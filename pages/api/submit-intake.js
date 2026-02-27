/*
 * pages/api/submit-intake.js
 *
 * Uses the exact same direct-fetch pattern as test-email.js
 * which is PROVEN to work with IntakeQ.
 */

var RESEND_KEY = process.env.RESEND_API_KEY;

/* ── Build the full text record ── */

function buildRecord(data) {
  var ts = new Date();
  var eastern = ts.toLocaleString('en-US', { timeZone: 'America/New_York' });
  var cTs = data.consentTimestamps || {};
  var c = data.consents || {};
  var L = [];

  L.push('========================================');
  L.push('WEBSITE INTAKE — ' + eastern + ' ET');
  L.push('========================================');
  L.push('');
  L.push('PATIENT: ' + data.fname + ' ' + data.lname);
  L.push('Email: ' + data.email);
  L.push('Phone: ' + (data.phone || 'N/A'));
  L.push('Address: ' + (data.address || 'N/A'));
  L.push('');
  L.push('APPOINTMENT');
  L.push('Date: ' + (data.date || 'TBD'));
  L.push('Time: ' + (data.selTime || 'TBD'));
  L.push('Services: ' + (data.services && data.services.length ? data.services.join(', ') : 'General'));
  if (data.notes) L.push('Notes: ' + data.notes);
  L.push('');
  L.push('MEDICAL HISTORY');
  L.push('Medical: ' + (data.medicalHistory || 'None'));
  L.push('Surgical: ' + (data.surgicalHistory || 'None'));
  L.push('Medications: ' + (data.medications || 'None'));
  L.push('Allergies: ' + (data.allergies || 'None'));
  if (data.clinicianNotes) L.push('Clinician Notes: ' + data.clinicianNotes);
  L.push('');
  L.push('CONSENTS');
  L.push('Treatment: ' + (c.treatment ? 'AGREED' : 'NO') + (cTs.treatment ? ' @ ' + cTs.treatment : ''));
  L.push('HIPAA: ' + (c.hipaa ? 'AGREED' : 'NO') + (cTs.hipaa ? ' @ ' + cTs.hipaa : ''));
  L.push('Medical Release: ' + (c.medical ? 'AGREED' : 'NO') + (cTs.medical ? ' @ ' + cTs.medical : ''));
  L.push('Financial: ' + (c.financial ? 'AGREED' : 'NO') + (cTs.financial ? ' @ ' + cTs.financial : ''));
  L.push('');
  L.push('SIGNATURES');
  var sl = data.signature || 'NONE';
  if (sl === 'drawn-signature') sl = 'DRAWN (image attached)';
  L.push('Consent Sig: ' + sl + ' (' + (data.signatureType || 'N/A') + ')');
  L.push('Intake Ack: ' + (data.intakeAcknowledged ? 'YES' : 'NO'));
  var il = data.intakeSignature || 'NONE';
  if (il === 'drawn_intake_sig') il = 'DRAWN (image attached)';
  L.push('Intake Sig: ' + il + ' (' + (data.intakeSignatureType || 'N/A') + ')');
  L.push('');
  L.push('PAYMENT');
  L.push('Card: ' + (data.cardBrand || 'N/A') + ' ****' + (data.cardLast4 || 'N/A'));
  L.push('Cardholder: ' + (data.cardHolderName || 'N/A'));

  if (data.additionalPatients && data.additionalPatients.length) {
    L.push('');
    L.push('ADDITIONAL PATIENTS (' + data.additionalPatients.length + ')');
    data.additionalPatients.forEach(function (pt, i) {
      L.push('  #' + (i + 2) + ': ' + (pt.fname || '') + ' ' + (pt.lname || ''));
      L.push('  Services: ' + (pt.services && pt.services.length ? pt.services.join(', ') : 'Same'));
      L.push('  Medical: ' + (pt.medicalHistory || 'None'));
      L.push('  Surgical: ' + (pt.surgicalHistory || 'None'));
      L.push('  Meds: ' + (pt.medications || 'None'));
      L.push('  Allergies: ' + (pt.allergies || 'None'));
      if (pt.clinicianNotes) L.push('  Notes: ' + pt.clinicianNotes);
    });
  }

  L.push('');
  L.push('Submitted: ' + ts.toISOString());
  L.push('========================================');
  return L.join('\n');
}

/* ════════════════════════════════════════════════
   HANDLER
   ════════════════════════════════════════════════ */

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ lastResult: global._lastIntakeResult || null });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var apiKey = process.env.INTAKEQ_API_KEY;
  var log = [];
  var clientId = null;

  function L(msg) { log.push('[' + new Date().toISOString() + '] ' + msg); console.log('[IntakeQ] ' + msg); }

  try {
    var data = req.body;
    if (!data.fname || !data.lname || !data.email) {
      return res.status(400).json({ error: 'Name and email required.' });
    }

    if (!apiKey) {
      L('ERROR: INTAKEQ_API_KEY env var is not set!');
      return res.status(500).json({ error: 'IntakeQ not configured.', log: log });
    }
    L('API key present: ' + apiKey.substring(0, 4) + '...');

    var record = buildRecord(data);

    /* ──────────────────────────────────────────────
       STEP 1: Search for existing client
       Using IncludeProfile=true to get ClientId
       (same direct fetch pattern as test-email.js)
       ────────────────────────────────────────────── */
    var searchUrl = 'https://intakeq.com/api/v1/clients?search='
      + encodeURIComponent(data.email) + '&IncludeProfile=true';
    L('Searching: GET ' + searchUrl);

    var searchRes = await fetch(searchUrl, {
      method: 'GET',
      headers: { 'X-Auth-Key': apiKey },
    });
    var searchText = await searchRes.text();
    L('Search response: ' + searchRes.status + ' — ' + searchText.substring(0, 300));

    var existingClients = [];
    try { existingClients = searchText ? JSON.parse(searchText) : []; } catch (e) { L('Search parse error: ' + e.message); }

    /* ──────────────────────────────────────────────
       STEP 2: Create or update client
       Exact same pattern as test-email.js
       ────────────────────────────────────────────── */
    var clientPayload = {
      FirstName: data.fname,
      LastName: data.lname,
      Name: data.fname + ' ' + data.lname,
      Email: data.email,
      Phone: data.phone || '',
      Address: data.address || '',
      AdditionalInformation: record,
    };

    if (Array.isArray(existingClients) && existingClients.length > 0) {
      /* ── EXISTING CLIENT → PUT (same as test-email.js) ── */
      clientId = existingClients[0].ClientId || existingClients[0].ClientNumber;
      L('Found existing client: ' + clientId);

      // Append to existing notes
      var prevNotes = existingClients[0].AdditionalInformation || '';
      if (prevNotes) {
        clientPayload.AdditionalInformation = prevNotes + '\n\n' + record;
      }
      clientPayload.ClientId = clientId;

      L('Updating: PUT /clients with ClientId=' + clientId);
      var putRes = await fetch('https://intakeq.com/api/v1/clients', {
        method: 'PUT',
        headers: { 'X-Auth-Key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(clientPayload),
      });
      var putText = await putRes.text();
      L('PUT response: ' + putRes.status + ' — ' + putText.substring(0, 300));

      if (!putRes.ok) {
        L('PUT FAILED! Status=' + putRes.status);
        global._lastIntakeResult = { time: new Date().toISOString(), log: log, error: 'PUT failed' };
        return res.status(500).json({ error: 'Failed to update patient record in IntakeQ.', log: log });
      }
    } else {
      /* ── NEW CLIENT → POST ── */
      L('No existing client found. Creating new: POST /clients');
      var postRes = await fetch('https://intakeq.com/api/v1/clients', {
        method: 'POST',
        headers: { 'X-Auth-Key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(clientPayload),
      });
      var postText = await postRes.text();
      L('POST response: ' + postRes.status + ' — ' + postText.substring(0, 300));

      if (!postRes.ok) {
        L('POST FAILED! Status=' + postRes.status);
        global._lastIntakeResult = { time: new Date().toISOString(), log: log, error: 'POST failed' };
        return res.status(500).json({ error: 'Failed to create patient record in IntakeQ.', log: log });
      }

      try {
        var created = postText ? JSON.parse(postText) : {};
        clientId = created.ClientId || created.ClientNumber || created.Id;
        L('New client created: ' + clientId);
      } catch (e) {
        L('Could not parse new client response: ' + e.message);
      }
    }

    L('CLIENT SAVED SUCCESSFULLY. ID=' + clientId);

    /* ──────────────────────────────────────────────
       STEP 3: Upload signature images as files
       ────────────────────────────────────────────── */
    var sigUploaded = false;
    if (clientId && data.signatureImageData) {
      try {
        var raw64 = data.signatureImageData;
        if (raw64.indexOf(',') !== -1) raw64 = raw64.split(',')[1];
        var buf = Buffer.from(raw64, 'base64');
        var bnd = '---Sig' + Date.now();
        var body = Buffer.concat([
          Buffer.from('--' + bnd + '\r\nContent-Disposition: form-data; name="file"; filename="consent-sig.png"\r\nContent-Type: image/png\r\n\r\n'),
          buf,
          Buffer.from('\r\n--' + bnd + '--\r\n'),
        ]);
        var fRes = await fetch('https://intakeq.com/api/v1/files/' + clientId, {
          method: 'POST',
          headers: { 'X-Auth-Key': apiKey, 'Content-Type': 'multipart/form-data; boundary=' + bnd },
          body: body,
        });
        L('Consent sig upload: ' + fRes.status);
        sigUploaded = fRes.ok;
      } catch (e) { L('Sig upload error: ' + e.message); }
    }

    var intakeSigUploaded = false;
    if (clientId && data.intakeSignatureImageData) {
      try {
        var raw64b = data.intakeSignatureImageData;
        if (raw64b.indexOf(',') !== -1) raw64b = raw64b.split(',')[1];
        var buf2 = Buffer.from(raw64b, 'base64');
        var bnd2 = '---ISig' + Date.now();
        var body2 = Buffer.concat([
          Buffer.from('--' + bnd2 + '\r\nContent-Disposition: form-data; name="file"; filename="intake-sig.png"\r\nContent-Type: image/png\r\n\r\n'),
          buf2,
          Buffer.from('\r\n--' + bnd2 + '--\r\n'),
        ]);
        var fRes2 = await fetch('https://intakeq.com/api/v1/files/' + clientId, {
          method: 'POST',
          headers: { 'X-Auth-Key': apiKey, 'Content-Type': 'multipart/form-data; boundary=' + bnd2 },
          body: body2,
        });
        L('Intake sig upload: ' + fRes2.status);
        intakeSigUploaded = fRes2.ok;
      } catch (e) { L('Intake sig upload error: ' + e.message); }
    }

    /* ──────────────────────────────────────────────
       STEP 4: Tag the client
       ────────────────────────────────────────────── */
    if (clientId) {
      try {
        await fetch('https://intakeq.com/api/v1/clientTags', {
          method: 'POST',
          headers: { 'X-Auth-Key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ClientId: clientId, Tag: 'Website Booking' }),
        });
        await fetch('https://intakeq.com/api/v1/clientTags', {
          method: 'POST',
          headers: { 'X-Auth-Key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ClientId: clientId, Tag: 'Online Intake' }),
        });
        L('Tags applied');
      } catch (e) { L('Tagging error: ' + e.message); }
    }

    /* ──────────────────────────────────────────────
       STEP 5: Business notification email
       ────────────────────────────────────────────── */
    if (RESEND_KEY) {
      try {
        var con = data.consents || {};
        var ck = function (v) { return v ? '&#10003;' : '&#10007;'; };
        var html =
          '<div style="font-family:Arial;max-width:600px;margin:0 auto">'
          + '<div style="background:#2E5A46;padding:20px;text-align:center"><h1 style="color:#D4BC82;margin:0">New Patient Intake</h1></div>'
          + '<div style="padding:20px">'
          + '<p><b>' + data.fname + ' ' + data.lname + '</b></p>'
          + '<p>Email: ' + data.email + ' | Phone: ' + (data.phone || 'N/A') + '</p>'
          + '<p>Date: ' + (data.date || 'TBD') + ' at ' + (data.selTime || 'TBD') + '</p>'
          + '<p>Services: ' + (data.services && data.services.length ? data.services.join(', ') : 'General') + '</p>'
          + '<hr style="margin:12px 0">'
          + '<p><b>Medical:</b> ' + (data.medicalHistory || 'None') + '</p>'
          + '<p><b>Surgical:</b> ' + (data.surgicalHistory || 'None') + '</p>'
          + '<p><b>Medications:</b> ' + (data.medications || 'None') + '</p>'
          + '<p><b>Allergies:</b> ' + (data.allergies || 'None') + '</p>'
          + '<hr style="margin:12px 0">'
          + '<p>' + ck(con.treatment) + ' Treatment ' + ck(con.hipaa) + ' HIPAA ' + ck(con.medical) + ' Medical ' + ck(con.financial) + ' Financial</p>'
          + '<p>Sig: ' + (data.signature === 'drawn-signature' ? 'Drawn' : (data.signature || 'N/A')) + ' | Card: ' + (data.cardBrand || '') + ' ****' + (data.cardLast4 || 'N/A') + '</p>'
          + '<p style="font-size:11px;color:#999">IntakeQ ID: ' + (clientId || 'N/A') + ' | Saved: YES | SigFiles: ' + (sigUploaded || intakeSigUploaded) + '</p>'
          + '</div></div>';

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Healing Soulutions <bookings@healingsoulutions.care>',
            to: ['info@healingsoulutions.care'],
            subject: 'New Intake: ' + data.fname + ' ' + data.lname,
            html: html, reply_to: data.email,
          }),
        });
        L('Business email sent');
      } catch (e) { L('Business email error: ' + e.message); }
    }

    /* ──────────────────────────────────────────────
       STEP 6: Patient confirmation email
       ────────────────────────────────────────────── */
    if (RESEND_KEY && data.email) {
      try {
        var phtml =
          '<div style="font-family:Arial;max-width:600px;margin:0 auto">'
          + '<div style="background:#2E5A46;padding:20px;text-align:center"><h1 style="color:#D4BC82;margin:0">Booking Confirmed</h1>'
          + '<p style="color:rgba(255,255,255,0.7);font-size:13px;margin:4px 0 0">Healing Soulutions</p></div>'
          + '<div style="padding:20px">'
          + '<p>Dear ' + data.fname + ',</p>'
          + '<p style="color:#555">Thank you for booking. We\'ll confirm within 24 hours.</p>'
          + '<div style="background:#f9f9f9;border-left:4px solid #2E5A46;padding:16px;margin:16px 0;border-radius:8px">'
          + '<p><b>Date:</b> ' + (data.date || 'TBD') + '</p>'
          + '<p><b>Time:</b> ' + (data.selTime || 'TBD') + '</p>'
          + '<p><b>Services:</b> ' + (data.services && data.services.length ? data.services.join(', ') : 'General') + '</p></div>'
          + '<div style="background:#FFF8E7;border:1px solid #D4BC82;padding:14px;margin:16px 0;border-radius:8px">'
          + '<p style="margin:0;color:#555">&#10003; All consents signed &amp; securely stored (HIPAA)</p></div>'
          + '<p style="color:#555">Questions? info@healingsoulutions.care or (585) 747-2215</p>'
          + '</div></div>';

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Healing Soulutions <bookings@healingsoulutions.care>',
            to: [data.email],
            subject: 'Booking Confirmed - Healing Soulutions',
            html: phtml, reply_to: 'info@healingsoulutions.care',
          }),
        });
        L('Patient email sent');
      } catch (e) { L('Patient email error: ' + e.message); }
    }

    L('DONE');
    global._lastIntakeResult = { time: new Date().toISOString(), clientId: clientId, log: log };

    return res.status(200).json({
      success: true,
      clientId: clientId,
      message: 'Saved to IntakeQ.',
      log: log,
    });

  } catch (err) {
    L('CRITICAL ERROR: ' + err.message);
    console.error(err);
    global._lastIntakeResult = { time: new Date().toISOString(), error: err.message, log: log };
    return res.status(500).json({ error: err.message, log: log });
  }
}
