var INTAKEQ_API_BASE = 'https://intakeq.com/api/v1';
var RESEND_KEY = process.env.RESEND_API_KEY;
var BUSINESS_EMAIL = 'info@healingsoulutions.care';

// Optional: Set this in your env to auto-send a pre-configured IntakeQ form
var INTAKEQ_QUESTIONNAIRE_ID = process.env.INTAKEQ_QUESTIONNAIRE_ID || '';

async function intakeqRequest(endpoint, method, body) {
  var apiKey = process.env.INTAKEQ_API_KEY;
  if (!apiKey) {
    throw new Error('IntakeQ API key is not configured.');
  }

  var response = await fetch(INTAKEQ_API_BASE + endpoint, {
    method: method,
    headers: {
      'X-Auth-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    var errorText = await response.text();
    console.error('IntakeQ API error [' + response.status + ']:', errorText);
    throw new Error('IntakeQ API error: ' + response.status + ' - ' + errorText.substring(0, 200));
  }

  var text = await response.text();
  return text ? JSON.parse(text) : {};
}

// Upload a file (e.g. signature image) to a client's record in IntakeQ
async function uploadFileToClient(clientId, base64Data, fileName, contentType) {
  var apiKey = process.env.INTAKEQ_API_KEY;
  if (!apiKey || !clientId || !base64Data) return null;

  try {
    // Strip data URL prefix if present
    var rawBase64 = base64Data;
    if (rawBase64.indexOf(',') !== -1) {
      rawBase64 = rawBase64.split(',')[1];
    }
    var buffer = Buffer.from(rawBase64, 'base64');

    var boundary = '----FormBoundary' + Date.now();
    var body = '--' + boundary + '\r\n' +
      'Content-Disposition: form-data; name="file"; filename="' + fileName + '"\r\n' +
      'Content-Type: ' + contentType + '\r\n\r\n';
    var ending = '\r\n--' + boundary + '--\r\n';

    var bodyBuffer = Buffer.concat([
      Buffer.from(body, 'utf-8'),
      buffer,
      Buffer.from(ending, 'utf-8'),
    ]);

    var response = await fetch(INTAKEQ_API_BASE + '/files/' + clientId, {
      method: 'POST',
      headers: {
        'X-Auth-Key': apiKey,
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': String(bodyBuffer.length),
      },
      body: bodyBuffer,
    });

    if (response.ok) {
      console.log('[IntakeQ] File uploaded: ' + fileName);
      return true;
    } else {
      var errText = await response.text();
      console.error('[IntakeQ] File upload failed [' + response.status + ']:', errText.substring(0, 200));
      return false;
    }
  } catch (err) {
    console.error('[IntakeQ] File upload error:', err.message);
    return false;
  }
}

function buildConsentSummary(consents, consentTimestamps) {
  var ts = consentTimestamps || {};
  var items = [];
  if (consents.treatment) items.push('Treatment Consent: AGREED at ' + (ts.treatment || 'N/A'));
  if (consents.hipaa) items.push('HIPAA Privacy: AGREED at ' + (ts.hipaa || 'N/A'));
  if (consents.medical) items.push('Medical History Release: AGREED at ' + (ts.medical || 'N/A'));
  if (consents.financial) items.push('Financial Agreement: AGREED at ' + (ts.financial || 'N/A'));
  return items.join('\n');
}

function buildPatientNotes(data) {
  var sections = [];
  var timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  sections.push('=== SUBMISSION: ' + timestamp + ' ET ===');

  sections.push('\n=== APPOINTMENT ===');
  sections.push('Date: ' + (data.date || 'Not specified'));
  sections.push('Time: ' + (data.selTime || 'Not specified'));
  sections.push('Services: ' + (data.services && data.services.length > 0 ? data.services.join(', ') : 'General Consultation'));
  if (data.address) sections.push('Address: ' + data.address);
  if (data.notes) sections.push('Notes: ' + data.notes);

  sections.push('\n=== MEDICAL HISTORY ===');
  sections.push('Medical History: ' + (data.medicalHistory || 'None reported'));
  sections.push('Surgical History: ' + (data.surgicalHistory || 'None reported'));
  sections.push('Medications: ' + (data.medications || 'None reported'));
  sections.push('Allergies: ' + (data.allergies || 'None reported'));
  if (data.clinicianNotes) sections.push('Clinician Notes: ' + data.clinicianNotes);

  sections.push('\n=== CONSENTS ===');
  sections.push(buildConsentSummary(data.consents || {}, data.consentTimestamps || {}));

  sections.push('\n=== SIGNATURES ===');
  var sigLabel = data.signature || 'NOT PROVIDED';
  if (sigLabel === 'drawn-signature') sigLabel = 'DRAWN SIGNATURE (image on file)';
  sections.push('Consent E-Signature: ' + sigLabel);
  sections.push('Consent Signature Type: ' + (data.signatureType || 'N/A'));
  sections.push('Intake Acknowledgment: ' + (data.intakeAcknowledged ? 'ACKNOWLEDGED' : 'NOT ACKNOWLEDGED'));
  var intakeSigLabel = data.intakeSignature || 'NOT PROVIDED';
  if (intakeSigLabel === 'drawn_intake_sig') intakeSigLabel = 'DRAWN SIGNATURE (image on file)';
  sections.push('Intake Signature: ' + intakeSigLabel);
  sections.push('Intake Signature Type: ' + (data.intakeSignatureType || 'N/A'));
  sections.push('Consent Form Version: ' + (data.consentVersion || '2025-02'));
  sections.push('Submission Timestamp (UTC): ' + new Date().toISOString());

  sections.push('\n=== PAYMENT ===');
  sections.push('Card: ' + (data.cardBrand || 'N/A') + ' ****' + (data.cardLast4 || 'N/A'));
  sections.push('Cardholder: ' + (data.cardHolderName || 'N/A'));

  if (data.additionalPatients && data.additionalPatients.length > 0) {
    sections.push('\n=== ADDITIONAL PATIENTS (' + data.additionalPatients.length + ') ===');
    data.additionalPatients.forEach(function (pt, idx) {
      sections.push('\n--- Patient ' + (idx + 2) + ': ' + (pt.fname || '') + ' ' + (pt.lname || '') + ' ---');
      sections.push('Services: ' + (pt.services && pt.services.length > 0 ? pt.services.join(', ') : 'Same'));
      sections.push('Medical History: ' + (pt.medicalHistory || 'None reported'));
      sections.push('Surgical History: ' + (pt.surgicalHistory || 'None reported'));
      sections.push('Medications: ' + (pt.medications || 'None reported'));
      sections.push('Allergies: ' + (pt.allergies || 'None reported'));
      if (pt.clinicianNotes) sections.push('Clinician Notes: ' + pt.clinicianNotes);
    });
  }

  return sections.join('\n');
}

export default async function handler(req, res) {
  // Debug endpoint
  if (req.method === 'GET') {
    return res.status(200).json({ debug: global._lastIntakeResult || 'no bookings yet' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Track what succeeds/fails for detailed response
  var results = {
    clientCreated: false,
    clientId: null,
    consentSignatureUploaded: false,
    intakeSignatureUploaded: false,
    questionnaireSent: false,
    businessEmailSent: false,
    patientEmailSent: false,
    errors: [],
  };

  try {
    var data = req.body;

    if (!data.fname || !data.lname || !data.email) {
      return res.status(400).json({ error: 'First name, last name, and email are required.' });
    }

    var timestamp = new Date().toISOString();

    /* ============================================================
       1. INTAKEQ: Create/Update Client with ALL data
       ─────────────────────────────────────────────────────────
       This is the PRIMARY storage. The AdditionalInformation
       field holds the complete intake record including medical
       history, consent status, and signature info — all stored
       on IntakeQ's HIPAA-compliant, encrypted server.
       ============================================================ */
    try {
      var existingClients = await intakeqRequest(
        '/clients?search=' + encodeURIComponent(data.email),
        'GET'
      );

      var clientPayload = {
        FirstName: data.fname,
        LastName: data.lname,
        Email: data.email,
        Phone: data.phone || '',
        Address: data.address || '',
        DateOfBirth: null,
        Tags: ['Website Booking', 'Online Intake'],
        AdditionalInformation: buildPatientNotes(data),
      };

      if (Array.isArray(existingClients) && existingClients.length > 0) {
        results.clientId = existingClients[0].ClientId || existingClients[0].Id;
        clientPayload.ClientId = results.clientId;

        // Append to existing notes instead of overwriting
        var existingInfo = existingClients[0].AdditionalInformation || '';
        if (existingInfo) {
          clientPayload.AdditionalInformation = existingInfo + '\n\n' + clientPayload.AdditionalInformation;
        }

        await intakeqRequest('/clients', 'PUT', clientPayload);
        results.clientCreated = true;
        console.log('[IntakeQ] Client updated:', results.clientId);
      } else {
        var newClient = await intakeqRequest('/clients', 'POST', clientPayload);
        results.clientId = newClient.ClientId || newClient.Id;
        results.clientCreated = true;
        console.log('[IntakeQ] Client created:', results.clientId);
      }
    } catch (clientError) {
      console.error('[IntakeQ] Client create/update error:', clientError.message);
      results.errors.push('Client: ' + clientError.message);
    }

    /* ============================================================
       2. INTAKEQ: Upload Signature Image Files
       ─────────────────────────────────────────────────────────
       Stores drawn/typed signatures as PNG image files attached
       to the client record. These are accessible from the
       client's file tab in IntakeQ for HIPAA audit trail.
       ============================================================ */
    if (results.clientId) {
      // Upload consent e-signature image (from Step 2 consent forms)
      if (data.signatureImageData) {
        var sigUploaded = await uploadFileToClient(
          results.clientId,
          data.signatureImageData,
          'consent-esignature-' + timestamp.replace(/[:.]/g, '-') + '.png',
          'image/png'
        );
        results.consentSignatureUploaded = !!sigUploaded;
      }

      // Upload intake acknowledgment signature image (from Step 1)
      if (data.intakeSignatureImageData) {
        var intakeSigUploaded = await uploadFileToClient(
          results.clientId,
          data.intakeSignatureImageData,
          'intake-acknowledgment-signature-' + timestamp.replace(/[:.]/g, '-') + '.png',
          'image/png'
        );
        results.intakeSignatureUploaded = !!intakeSigUploaded;
      }
    }

    /* ============================================================
       3. INTAKEQ: Send Pre-configured Questionnaire (optional)
       ─────────────────────────────────────────────────────────
       If INTAKEQ_QUESTIONNAIRE_ID is set in your environment,
       this sends the official IntakeQ form to the patient.
       The form appears in IntakeQ's Pending Forms dashboard.
       ============================================================ */
    if (INTAKEQ_QUESTIONNAIRE_ID && results.clientId) {
      try {
        await intakeqRequest('/intakes/send', 'POST', {
          QuestionnaireId: INTAKEQ_QUESTIONNAIRE_ID,
          ClientId: results.clientId,
          ClientName: data.fname + ' ' + data.lname,
          ClientEmail: data.email,
        });
        results.questionnaireSent = true;
        console.log('[IntakeQ] Questionnaire sent to:', data.email);
      } catch (qError) {
        console.error('[IntakeQ] Questionnaire send error:', qError.message);
        results.errors.push('Questionnaire: ' + qError.message);
        // Non-fatal — client data is already saved
      }
    }

    /* ============================================================
       4. BUSINESS NOTIFICATION EMAIL
       ============================================================ */
    if (RESEND_KEY) {
      try {
        var be = '<div style="font-family:Arial;max-width:600px;margin:0 auto">' +
          '<div style="background:#2E5A46;padding:20px;text-align:center">' +
          '<h1 style="color:#D4BC82;margin:0">New Patient Intake</h1></div>' +
          '<div style="padding:20px">' +
          '<p><b>Name:</b> ' + data.fname + ' ' + data.lname + '</p>' +
          '<p><b>Email:</b> ' + data.email + '</p>' +
          '<p><b>Phone:</b> ' + (data.phone || 'N/A') + '</p>' +
          '<p><b>Date:</b> ' + (data.date || 'TBD') + ' at ' + (data.selTime || 'TBD') + '</p>' +
          '<p><b>Services:</b> ' + (data.services && data.services.length > 0 ? data.services.join(', ') : 'General') + '</p>' +
          '<hr style="border:none;border-top:1px solid #eee;margin:16px 0">' +
          '<h3 style="color:#2E5A46;margin:0 0 8px">Medical Information</h3>' +
          '<p><b>Medical History:</b> ' + (data.medicalHistory || 'None') + '</p>' +
          '<p><b>Surgical History:</b> ' + (data.surgicalHistory || 'None') + '</p>' +
          '<p><b>Medications:</b> ' + (data.medications || 'None') + '</p>' +
          '<p><b>Allergies:</b> ' + (data.allergies || 'None') + '</p>' +
          (data.clinicianNotes ? '<p><b>Clinician Notes:</b> ' + data.clinicianNotes + '</p>' : '') +
          '<hr style="border:none;border-top:1px solid #eee;margin:16px 0">' +
          '<h3 style="color:#2E5A46;margin:0 0 8px">Consents & Signatures</h3>' +
          '<p>' + (data.consents && data.consents.treatment ? '&#10003;' : '&#10007;') + ' Treatment Consent</p>' +
          '<p>' + (data.consents && data.consents.hipaa ? '&#10003;' : '&#10007;') + ' HIPAA Privacy</p>' +
          '<p>' + (data.consents && data.consents.medical ? '&#10003;' : '&#10007;') + ' Medical History Release</p>' +
          '<p>' + (data.consents && data.consents.financial ? '&#10003;' : '&#10007;') + ' Financial Agreement</p>' +
          '<p><b>E-Signature:</b> ' + (data.signature === 'drawn-signature' ? 'Drawn (image on file)' : (data.signature || 'N/A')) + '</p>' +
          '<p><b>Intake Acknowledged:</b> ' + (data.intakeAcknowledged ? 'Yes' : 'No') + '</p>' +
          '<p><b>Card:</b> ' + (data.cardBrand || '') + ' ****' + (data.cardLast4 || 'N/A') + '</p>' +
          '<p style="font-size:11px;color:#999;margin-top:16px">IntakeQ Client ID: ' + (results.clientId || 'N/A') +
          ' | Signatures uploaded: ' + (results.consentSignatureUploaded || results.intakeSignatureUploaded ? 'Yes' : 'No') + '</p>' +
          (data.additionalPatients && data.additionalPatients.length > 0
            ? '<h3 style="color:#2E5A46">Additional Patients</h3>' +
              data.additionalPatients.map(function (pt, i) {
                return '<p>' + (pt.fname || '') + ' ' + (pt.lname || '') + ' - ' +
                  (pt.services && pt.services.length > 0 ? pt.services.join(', ') : 'Same') + '</p>';
              }).join('')
            : '') +
          '</div></div>';

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + RESEND_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Healing Soulutions <bookings@healingsoulutions.care>',
            to: ['info@healingsoulutions.care'],
            subject: 'New Intake: ' + data.fname + ' ' + data.lname + (results.clientId ? ' [ID:' + results.clientId + ']' : ''),
            html: be,
            reply_to: data.email,
          }),
        });
        results.businessEmailSent = true;
      } catch (e) {
        console.error('[Email] Business notification error:', e.message);
        results.errors.push('Business email: ' + e.message);
      }
    }

    /* ============================================================
       5. PATIENT CONFIRMATION EMAIL
       ============================================================ */
    if (RESEND_KEY && data.email) {
      try {
        var pe = '<div style="font-family:Arial;max-width:600px;margin:0 auto">' +
          '<div style="background:#2E5A46;padding:20px;text-align:center">' +
          '<h1 style="color:#D4BC82;margin:0">Booking Confirmed</h1>' +
          '<p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px">Healing Soulutions</p></div>' +
          '<div style="padding:20px">' +
          '<p style="font-size:16px">Dear ' + data.fname + ',</p>' +
          '<p style="color:#555">Thank you for booking with Healing Soulutions. Our team will contact you within 24 hours to confirm.</p>' +
          '<div style="background:#f9f9f9;border-left:4px solid #2E5A46;padding:16px;margin:16px 0;border-radius:8px">' +
          '<h3 style="color:#2E5A46;margin:0 0 10px">Appointment Details</h3>' +
          '<p><b>Date:</b> ' + (data.date || 'TBD') + '</p>' +
          '<p><b>Time:</b> ' + (data.selTime || 'TBD') + '</p>' +
          '<p><b>Services:</b> ' + (data.services && data.services.length > 0 ? data.services.join(', ') : 'General Consultation') + '</p></div>' +
          '<div style="background:#f9f9f9;padding:16px;margin:16px 0;border-radius:8px">' +
          '<h3 style="color:#2E5A46;margin:0 0 10px">Your Medical Info on File</h3>' +
          '<p><b>Medical History:</b> ' + (data.medicalHistory || 'None') + '</p>' +
          '<p><b>Medications:</b> ' + (data.medications || 'None') + '</p>' +
          '<p><b>Allergies:</b> ' + (data.allergies || 'None') + '</p></div>' +
          '<div style="background:#FFF8E7;border:1px solid #D4BC82;padding:14px;margin:16px 0;border-radius:8px">' +
          '<p style="margin:0;color:#555">&#10003; All consent forms signed and securely stored</p>' +
          '<p style="margin:4px 0 0;color:#999;font-size:12px">Your records are stored on a HIPAA-compliant server</p></div>' +
          '<hr style="border:none;border-top:1px solid #eee;margin:20px 0">' +
          '<p style="color:#555">Questions? Email info@healingsoulutions.care or call (585) 747-2215</p></div>' +
          '<div style="background:#2E5A46;padding:10px;text-align:center;font-size:11px;color:rgba(255,255,255,0.5)">Healing Soulutions | Concierge Nursing Care</div></div>';

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + RESEND_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Healing Soulutions <bookings@healingsoulutions.care>',
            to: [data.email],
            subject: 'Booking Confirmed - Healing Soulutions',
            html: pe,
            reply_to: 'info@healingsoulutions.care',
          }),
        });
        results.patientEmailSent = true;
      } catch (e) {
        console.error('[Email] Patient confirmation error:', e.message);
        results.errors.push('Patient email: ' + e.message);
      }
    }

    // Save results for debug endpoint
    global._lastIntakeResult = {
      time: timestamp,
      clientId: results.clientId,
      results: results,
    };

    console.log('[Booking] ' + data.fname + ' ' + data.lname + ' (' + data.email + ') - Services: ' + (data.services ? data.services.join(', ') : 'General') +
      ' | Client: ' + (results.clientCreated ? 'OK' : 'FAIL') +
      ' | Sigs: consent=' + (results.consentSignatureUploaded ? 'OK' : 'N/A') +
      ' intake=' + (results.intakeSignatureUploaded ? 'OK' : 'N/A'));

    // If the primary client record failed to save, tell the patient
    if (!results.clientCreated) {
      return res.status(500).json({
        error: 'Failed to save patient record. Please contact us directly at info@healingsoulutions.care or (585) 747-2215.',
        details: results,
      });
    }

    return res.status(200).json({
      success: true,
      clientId: results.clientId || null,
      message: 'Intake submitted successfully to HIPAA-secure server.',
      details: {
        clientSaved: results.clientCreated,
        signaturesSaved: results.consentSignatureUploaded || results.intakeSignatureUploaded,
        questionnaireSent: results.questionnaireSent,
        emailsSent: results.businessEmailSent && results.patientEmailSent,
      },
    });
  } catch (error) {
    console.error('[CRITICAL] Submit intake error:', error);
    global._lastIntakeResult = { time: new Date().toISOString(), error: error.message, results: results };
    return res.status(500).json({
      error: 'Failed to submit intake. Please contact us directly at info@healingsoulutions.care or (585) 747-2215.',
    });
  }
}
