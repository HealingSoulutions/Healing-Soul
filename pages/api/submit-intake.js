/*
 * /api/submit-intake.js — Healing Soulutions
 *
 * Stores patient intake, medical history, all consents, and
 * signatures on IntakeQ's HIPAA-compliant server.
 *
 * IntakeQ data flow:
 *   1. POST /clients  (create or update — ClientId present = update)
 *   2. POST /clientTags  (tag the record)
 *   3. POST /files/{clientId}  (upload signature PNGs)
 *   4. (Optional) POST /intakes/send  (send a questionnaire form)
 *
 * Required env vars:
 *   INTAKEQ_API_KEY
 *   RESEND_API_KEY  (for email notifications)
 *   STRIPE_SECRET_KEY  (for payment)
 *
 * Optional env var:
 *   INTAKEQ_QUESTIONNAIRE_ID  (to auto-send an IntakeQ form)
 */

var INTAKEQ_API_BASE = 'https://intakeq.com/api/v1';
var RESEND_KEY = process.env.RESEND_API_KEY;
var INTAKEQ_QUESTIONNAIRE_ID = process.env.INTAKEQ_QUESTIONNAIRE_ID || '';

/* ── IntakeQ REST helper ────────────────────────────────── */

async function iqFetch(endpoint, method, body) {
  var apiKey = process.env.INTAKEQ_API_KEY;
  if (!apiKey) throw new Error('INTAKEQ_API_KEY not set');

  var opts = {
    method: method,
    headers: { 'X-Auth-Key': apiKey, 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);

  var url = INTAKEQ_API_BASE + endpoint;
  console.log('[IQ] ' + method + ' ' + url);

  var res = await fetch(url, opts);
  var text = await res.text();

  if (!res.ok) {
    console.error('[IQ] ' + res.status + ':', text.substring(0, 300));
    throw new Error('IntakeQ ' + res.status + ': ' + text.substring(0, 120));
  }

  return text ? JSON.parse(text) : {};
}

/* ── Upload a file to a client record ───────────────────── */

async function iqUploadFile(clientId, base64Data, fileName) {
  var apiKey = process.env.INTAKEQ_API_KEY;
  if (!apiKey || !clientId || !base64Data) return false;

  try {
    var raw = base64Data;
    if (raw.indexOf(',') !== -1) raw = raw.split(',')[1];
    var buf = Buffer.from(raw, 'base64');

    var boundary = '---Boundary' + Date.now();
    var header = '--' + boundary + '\r\n'
      + 'Content-Disposition: form-data; name="file"; filename="' + fileName + '"\r\n'
      + 'Content-Type: image/png\r\n\r\n';
    var footer = '\r\n--' + boundary + '--\r\n';

    var payload = Buffer.concat([Buffer.from(header), buf, Buffer.from(footer)]);

    var res = await fetch(INTAKEQ_API_BASE + '/files/' + clientId, {
      method: 'POST',
      headers: {
        'X-Auth-Key': apiKey,
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
      },
      body: payload,
    });

    if (!res.ok) {
      var errText = await res.text();
      console.error('[IQ] File upload ' + res.status + ':', errText.substring(0, 200));
      return false;
    }
    console.log('[IQ] File uploaded: ' + fileName);
    return true;
  } catch (err) {
    console.error('[IQ] File upload error:', err.message);
    return false;
  }
}

/* ── Build the full-text patient record ─────────────────── */

function buildRecord(data) {
  var ts = new Date();
  var eastern = ts.toLocaleString('en-US', { timeZone: 'America/New_York' });
  var utc = ts.toISOString();
  var cTs = data.consentTimestamps || {};
  var lines = [];

  lines.push('════════════════════════════════════════════════');
  lines.push('  WEBSITE INTAKE SUBMISSION — ' + eastern + ' ET');
  lines.push('════════════════════════════════════════════════');

  lines.push('');
  lines.push('── PATIENT ──');
  lines.push('Name: ' + data.fname + ' ' + data.lname);
  lines.push('Email: ' + data.email);
  lines.push('Phone: ' + (data.phone || 'N/A'));
  lines.push('Address: ' + (data.address || 'N/A'));

  lines.push('');
  lines.push('── APPOINTMENT REQUEST ──');
  lines.push('Date: ' + (data.date || 'Not specified'));
  lines.push('Time: ' + (data.selTime || 'Not specified'));
  lines.push('Services: ' + (data.services && data.services.length ? data.services.join(', ') : 'General Consultation'));
  if (data.notes) lines.push('Patient Notes: ' + data.notes);

  lines.push('');
  lines.push('── MEDICAL HISTORY ──');
  lines.push('Medical History: ' + (data.medicalHistory || 'None reported'));
  lines.push('Surgical History: ' + (data.surgicalHistory || 'None reported'));
  lines.push('Current Medications: ' + (data.medications || 'None reported'));
  lines.push('Known Allergies: ' + (data.allergies || 'None reported'));
  if (data.clinicianNotes) lines.push('Notes for Clinician: ' + data.clinicianNotes);

  lines.push('');
  lines.push('── CONSENTS ──');
  var c = data.consents || {};
  lines.push('Treatment Consent: ' + (c.treatment ? 'AGREED' : 'NOT AGREED') + (cTs.treatment ? '  [signed ' + cTs.treatment + ']' : ''));
  lines.push('HIPAA Privacy: ' + (c.hipaa ? 'AGREED' : 'NOT AGREED') + (cTs.hipaa ? '  [signed ' + cTs.hipaa + ']' : ''));
  lines.push('Medical Release: ' + (c.medical ? 'AGREED' : 'NOT AGREED') + (cTs.medical ? '  [signed ' + cTs.medical + ']' : ''));
  lines.push('Financial Agreement: ' + (c.financial ? 'AGREED' : 'NOT AGREED') + (cTs.financial ? '  [signed ' + cTs.financial + ']' : ''));

  lines.push('');
  lines.push('── SIGNATURES ──');
  var sigLabel = data.signature || 'NOT PROVIDED';
  if (sigLabel === 'drawn-signature') sigLabel = 'DRAWN (image file attached)';
  lines.push('Consent E-Signature: ' + sigLabel);
  lines.push('Consent Signature Type: ' + (data.signatureType || 'N/A'));
  lines.push('Intake Acknowledgment: ' + (data.intakeAcknowledged ? 'YES' : 'NO'));
  var iSigLabel = data.intakeSignature || 'NOT PROVIDED';
  if (iSigLabel === 'drawn_intake_sig') iSigLabel = 'DRAWN (image file attached)';
  lines.push('Intake Signature: ' + iSigLabel);
  lines.push('Intake Signature Type: ' + (data.intakeSignatureType || 'N/A'));

  lines.push('');
  lines.push('── PAYMENT VERIFICATION ──');
  lines.push('Card: ' + (data.cardBrand || 'N/A') + ' ****' + (data.cardLast4 || 'N/A'));
  lines.push('Cardholder: ' + (data.cardHolderName || 'N/A'));

  if (data.additionalPatients && data.additionalPatients.length) {
    lines.push('');
    lines.push('── ADDITIONAL PATIENTS (' + data.additionalPatients.length + ') ──');
    data.additionalPatients.forEach(function (pt, i) {
      lines.push('');
      lines.push('  Patient ' + (i + 2) + ': ' + (pt.fname || '') + ' ' + (pt.lname || ''));
      lines.push('  Services: ' + (pt.services && pt.services.length ? pt.services.join(', ') : 'Same as primary'));
      lines.push('  Medical: ' + (pt.medicalHistory || 'None'));
      lines.push('  Surgical: ' + (pt.surgicalHistory || 'None'));
      lines.push('  Medications: ' + (pt.medications || 'None'));
      lines.push('  Allergies: ' + (pt.allergies || 'None'));
      if (pt.clinicianNotes) lines.push('  Clinician Notes: ' + pt.clinicianNotes);
    });
  }

  lines.push('');
  lines.push('Consent Form Version: 2025-02');
  lines.push('UTC Timestamp: ' + utc);
  lines.push('────────────────────────────────────────────────');

  return lines.join('\n');
}

/* ════════════════════════════════════════════════════════════
   MAIN HANDLER
   ════════════════════════════════════════════════════════════ */

export default async function handler(req, res) {
  // Debug / health-check
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', lastResult: global._lastIntakeResult || null });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var log = {
    clientFound: false,
    clientSaved: false,
    clientId: null,
    tagged: false,
    consentSigUploaded: false,
    intakeSigUploaded: false,
    questionnaireSent: false,
    bizEmail: false,
    patientEmail: false,
    errors: [],
  };

  try {
    var data = req.body;
    if (!data.fname || !data.lname || !data.email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    var now = new Date().toISOString();
    var record = buildRecord(data);

    /* ─────────────────────────────────────────────────────
       STEP 1 — Find or create the client in IntakeQ
       CRITICAL: IncludeProfile=true so we get ClientId back
       CRITICAL: Use POST for both create AND update (per docs)
       ───────────────────────────────────────────────────── */
    try {
      // Search WITH IncludeProfile so we get ClientId
      var found = await iqFetch(
        '/clients?search=' + encodeURIComponent(data.email) + '&IncludeProfile=true',
        'GET'
      );
      console.log('[IQ] Search returned ' + (Array.isArray(found) ? found.length : 0) + ' client(s)');

      var payload = {
        FirstName: data.fname,
        LastName: data.lname,
        Email: data.email,
        Phone: data.phone || '',
        Address: data.address || '',
      };

      if (Array.isArray(found) && found.length > 0) {
        // Existing client → update
        log.clientFound = true;
        log.clientId = found[0].ClientId || found[0].ClientNumber;
        payload.ClientId = log.clientId;

        // APPEND to existing notes — don't overwrite
        var existing = found[0].AdditionalInformation || '';
        payload.AdditionalInformation = existing
          ? existing + '\n\n' + record
          : record;

        console.log('[IQ] Updating existing client ' + log.clientId);
      } else {
        // New client → create
        payload.AdditionalInformation = record;
        console.log('[IQ] Creating new client');
      }

      // POST handles both create (no ClientId) and update (with ClientId)
      var saved = await iqFetch('/clients', 'POST', payload);
      log.clientSaved = true;

      // Capture clientId from response if this was a new client
      if (!log.clientId) {
        log.clientId = saved.ClientId || saved.ClientNumber || saved.Id;
      }
      console.log('[IQ] Client saved. ID=' + log.clientId);
    } catch (err) {
      console.error('[IQ] CLIENT SAVE FAILED:', err.message);
      log.errors.push('Client save: ' + err.message);
    }

    /* ─────────────────────────────────────────────────────
       STEP 2 — Tag the client
       Uses the dedicated /clientTags endpoint (not the Tags
       array in the client payload, which may not work on POST)
       ───────────────────────────────────────────────────── */
    if (log.clientId) {
      try {
        await iqFetch('/clientTags', 'POST', { ClientId: log.clientId, Tag: 'Website Booking' });
        await iqFetch('/clientTags', 'POST', { ClientId: log.clientId, Tag: 'Online Intake' });
        log.tagged = true;
      } catch (tagErr) {
        console.error('[IQ] Tagging error:', tagErr.message);
        log.errors.push('Tags: ' + tagErr.message);
      }
    }

    /* ─────────────────────────────────────────────────────
       STEP 3 — Upload signature images as files
       These show up in the client's Files tab in IntakeQ
       ───────────────────────────────────────────────────── */
    if (log.clientId) {
      if (data.signatureImageData) {
        log.consentSigUploaded = await iqUploadFile(
          log.clientId,
          data.signatureImageData,
          'consent-esignature-' + now.replace(/[:.]/g, '-') + '.png'
        );
      }
      if (data.intakeSignatureImageData) {
        log.intakeSigUploaded = await iqUploadFile(
          log.clientId,
          data.intakeSignatureImageData,
          'intake-signature-' + now.replace(/[:.]/g, '-') + '.png'
        );
      }
    }

    /* ─────────────────────────────────────────────────────
       STEP 4 — (Optional) Send a pre-built IntakeQ form
       Only if INTAKEQ_QUESTIONNAIRE_ID env var is set.
       This sends the official form to the patient to fill.
       ───────────────────────────────────────────────────── */
    if (INTAKEQ_QUESTIONNAIRE_ID && log.clientId) {
      try {
        await iqFetch('/intakes/send', 'POST', {
          QuestionnaireId: INTAKEQ_QUESTIONNAIRE_ID,
          ClientId: log.clientId,
          ClientName: data.fname + ' ' + data.lname,
          ClientEmail: data.email,
        });
        log.questionnaireSent = true;
        console.log('[IQ] Questionnaire sent to ' + data.email);
      } catch (qErr) {
        console.error('[IQ] Questionnaire error:', qErr.message);
        log.errors.push('Questionnaire: ' + qErr.message);
      }
    }

    /* ─────────────────────────────────────────────────────
       STEP 5 — Business notification email
       ───────────────────────────────────────────────────── */
    if (RESEND_KEY) {
      try {
        var c = data.consents || {};
        var chk = function (v) { return v ? '&#10003;' : '&#10007;'; };
        var be =
          '<div style="font-family:Arial;max-width:600px;margin:0 auto">'
          + '<div style="background:#2E5A46;padding:20px;text-align:center">'
          + '<h1 style="color:#D4BC82;margin:0">New Patient Intake</h1></div>'
          + '<div style="padding:20px">'
          + '<p><b>Name:</b> ' + data.fname + ' ' + data.lname + '</p>'
          + '<p><b>Email:</b> ' + data.email + '</p>'
          + '<p><b>Phone:</b> ' + (data.phone || 'N/A') + '</p>'
          + '<p><b>Date:</b> ' + (data.date || 'TBD') + ' at ' + (data.selTime || 'TBD') + '</p>'
          + '<p><b>Services:</b> ' + (data.services && data.services.length ? data.services.join(', ') : 'General') + '</p>'
          + '<hr style="border:none;border-top:1px solid #eee;margin:16px 0">'
          + '<h3 style="color:#2E5A46;margin:0 0 8px">Medical</h3>'
          + '<p><b>Medical History:</b> ' + (data.medicalHistory || 'None') + '</p>'
          + '<p><b>Surgical:</b> ' + (data.surgicalHistory || 'None') + '</p>'
          + '<p><b>Medications:</b> ' + (data.medications || 'None') + '</p>'
          + '<p><b>Allergies:</b> ' + (data.allergies || 'None') + '</p>'
          + (data.clinicianNotes ? '<p><b>Clinician Notes:</b> ' + data.clinicianNotes + '</p>' : '')
          + '<hr style="border:none;border-top:1px solid #eee;margin:16px 0">'
          + '<h3 style="color:#2E5A46;margin:0 0 8px">Consents</h3>'
          + '<p>' + chk(c.treatment) + ' Treatment</p>'
          + '<p>' + chk(c.hipaa) + ' HIPAA</p>'
          + '<p>' + chk(c.medical) + ' Medical Release</p>'
          + '<p>' + chk(c.financial) + ' Financial</p>'
          + '<p><b>E-Sig:</b> ' + (data.signature === 'drawn-signature' ? 'Drawn' : (data.signature || 'N/A')) + '</p>'
          + '<p><b>Card:</b> ' + (data.cardBrand || '') + ' ****' + (data.cardLast4 || 'N/A') + '</p>'
          + '<p style="font-size:11px;color:#999;margin-top:16px">IntakeQ ID: ' + (log.clientId || 'N/A')
          + ' | Saved: ' + log.clientSaved + ' | Sigs: ' + (log.consentSigUploaded || log.intakeSigUploaded) + '</p>'
          + (data.additionalPatients && data.additionalPatients.length
            ? '<h3 style="color:#2E5A46">Additional Patients</h3>'
              + data.additionalPatients.map(function (pt) { return '<p>' + (pt.fname || '') + ' ' + (pt.lname || '') + '</p>'; }).join('')
            : '')
          + '</div></div>';

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Healing Soulutions <bookings@healingsoulutions.care>',
            to: ['info@healingsoulutions.care'],
            subject: 'New Intake: ' + data.fname + ' ' + data.lname + (log.clientId ? ' [#' + log.clientId + ']' : ''),
            html: be,
            reply_to: data.email,
          }),
        });
        log.bizEmail = true;
      } catch (e) {
        log.errors.push('Biz email: ' + e.message);
      }
    }

    /* ─────────────────────────────────────────────────────
       STEP 6 — Patient confirmation email
       ───────────────────────────────────────────────────── */
    if (RESEND_KEY && data.email) {
      try {
        var pe =
          '<div style="font-family:Arial;max-width:600px;margin:0 auto">'
          + '<div style="background:#2E5A46;padding:20px;text-align:center">'
          + '<h1 style="color:#D4BC82;margin:0">Booking Confirmed</h1>'
          + '<p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px">Healing Soulutions</p></div>'
          + '<div style="padding:20px">'
          + '<p style="font-size:16px">Dear ' + data.fname + ',</p>'
          + '<p style="color:#555">Thank you for booking. We\'ll contact you within 24 hours to confirm.</p>'
          + '<div style="background:#f9f9f9;border-left:4px solid #2E5A46;padding:16px;margin:16px 0;border-radius:8px">'
          + '<h3 style="color:#2E5A46;margin:0 0 10px">Appointment</h3>'
          + '<p><b>Date:</b> ' + (data.date || 'TBD') + '</p>'
          + '<p><b>Time:</b> ' + (data.selTime || 'TBD') + '</p>'
          + '<p><b>Services:</b> ' + (data.services && data.services.length ? data.services.join(', ') : 'General Consultation') + '</p></div>'
          + '<div style="background:#f9f9f9;padding:16px;margin:16px 0;border-radius:8px">'
          + '<h3 style="color:#2E5A46;margin:0 0 10px">Your Medical Info on File</h3>'
          + '<p><b>Medical History:</b> ' + (data.medicalHistory || 'None') + '</p>'
          + '<p><b>Medications:</b> ' + (data.medications || 'None') + '</p>'
          + '<p><b>Allergies:</b> ' + (data.allergies || 'None') + '</p></div>'
          + '<div style="background:#FFF8E7;border:1px solid #D4BC82;padding:14px;margin:16px 0;border-radius:8px">'
          + '<p style="margin:0;color:#555">&#10003; All consent forms signed &amp; securely stored (HIPAA)</p></div>'
          + '<hr style="border:none;border-top:1px solid #eee;margin:20px 0">'
          + '<p style="color:#555">Questions? info@healingsoulutions.care or (585) 747-2215</p></div>'
          + '<div style="background:#2E5A46;padding:10px;text-align:center;font-size:11px;color:rgba(255,255,255,0.5)">Healing Soulutions | Concierge Nursing Care</div></div>';

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Healing Soulutions <bookings@healingsoulutions.care>',
            to: [data.email],
            subject: 'Booking Confirmed - Healing Soulutions',
            html: pe,
            reply_to: 'info@healingsoulutions.care',
          }),
        });
        log.patientEmail = true;
      } catch (e) {
        log.errors.push('Patient email: ' + e.message);
      }
    }

    /* ── Save debug info ── */
    global._lastIntakeResult = { time: now, log: log };

    console.log('[RESULT] Client=' + log.clientSaved + ' ID=' + log.clientId
      + ' Tags=' + log.tagged
      + ' ConsentSig=' + log.consentSigUploaded
      + ' IntakeSig=' + log.intakeSigUploaded
      + ' Errors=' + log.errors.length);

    /* ── If client record failed, tell the patient clearly ── */
    if (!log.clientSaved) {
      return res.status(500).json({
        error: 'Could not save your record. Please call (585) 747-2215 or email info@healingsoulutions.care.',
        debug: log,
      });
    }

    return res.status(200).json({
      success: true,
      clientId: log.clientId,
      message: 'Intake submitted to HIPAA-secure server.',
      saved: {
        client: log.clientSaved,
        signatures: log.consentSigUploaded || log.intakeSigUploaded,
        tags: log.tagged,
      },
    });
  } catch (err) {
    console.error('[CRITICAL]', err);
    global._lastIntakeResult = { time: new Date().toISOString(), error: err.message, log: log };
    return res.status(500).json({
      error: 'Submission failed. Please call (585) 747-2215.',
    });
  }
}
