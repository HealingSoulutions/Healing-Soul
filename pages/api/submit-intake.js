const INTAKEQ_API_BASE = 'https://intakeq.com/api/v1';

async function intakeqRequest(endpoint, method, body) {
  const apiKey = process.env.INTAKEQ_API_KEY;
  if (!apiKey) throw new Error('IntakeQ API key is not configured.');

  const response = await fetch(`${INTAKEQ_API_BASE}${endpoint}`, {
    method,
    headers: { 'X-Auth-Key': apiKey, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`IntakeQ API error [${response.status}]:`, errorText);
    throw new Error(`IntakeQ API error: ${response.status}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

async function uploadBase64Image(clientId, fileName, base64Data) {
  var apiKey = process.env.INTAKEQ_API_KEY;
  if (!apiKey || !clientId || !base64Data) return false;
  try {
    var raw = base64Data.replace(/^data:image\/\w+;base64,/, '');
    var binaryStr = Buffer.from(raw, 'base64');
    var boundary = '----FormBoundary' + Date.now();
    var header = '--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="' + fileName + '"\r\nContent-Type: image/png\r\n\r\n';
    var footer = '\r\n--' + boundary + '--\r\n';
    var headerBuf = Buffer.from(header, 'utf-8');
    var footerBuf = Buffer.from(footer, 'utf-8');
    var fullBody = Buffer.concat([headerBuf, binaryStr, footerBuf]);

    var resp = await fetch(INTAKEQ_API_BASE + '/files/' + clientId, {
      method: 'POST',
      headers: { 'X-Auth-Key': apiKey, 'Content-Type': 'multipart/form-data; boundary=' + boundary },
      body: fullBody,
    });
    console.log('[Upload] ' + fileName + ': ' + resp.status);
    return resp.ok;
  } catch (e) {
    console.error('[Upload] Error for ' + fileName + ':', e.message);
    return false;
  }
}

function formatAddress(d) {
  var parts = [];
  if (d.address1) parts.push(d.address1);
  if (d.address2) parts.push(d.address2);
  var cityLine = [d.city, d.stateProvince || d.state, d.postalCode || d.zipCode].filter(Boolean).join(', ');
  if (cityLine) parts.push(cityLine);
  if (d.country && d.country !== 'United States') parts.push(d.country);
  return parts.join(', ') || (d.address || 'Not specified');
}

function buildConsentSummary(consents) {
  var items = [];
  if (consents.treatment) items.push('Treatment Consent: AGREED');
  if (consents.hipaa) items.push('HIPAA Privacy: AGREED');
  if (consents.medical) items.push('Medical History Release: AGREED');
  if (consents.financial) items.push('Financial Agreement: AGREED');
  return items.join('\n');
}

function buildPatientNotes(data) {
  var s = [];
  s.push('=== APPOINTMENT DETAILS ===');
  s.push('Date: ' + (data.date || 'Not specified'));
  s.push('Time: ' + (data.selTime || 'Not specified'));
  s.push('Services: ' + (data.services && data.services.length > 0 ? data.services.join(', ') : 'General Consultation'));
  s.push('Address: ' + formatAddress(data));
  if (data.notes) s.push('Notes: ' + data.notes);

  s.push('\n=== PATIENT INFO ===');
  if (data.dob) s.push('Date of Birth: ' + data.dob);

  s.push('\n=== MEDICAL INFORMATION ===');
  if (data.medicalSurgicalHistory) s.push('Medical/Surgical History: ' + data.medicalSurgicalHistory);
  if (data.medications) s.push('Medications: ' + data.medications);
  if (data.allergies) s.push('Allergies: ' + data.allergies);
  if (data.ivReactions) s.push('Previous IV Therapy Reactions: ' + data.ivReactions);
  if (data.clinicianNotes) s.push('Clinician Notes: ' + data.clinicianNotes);

  s.push('\n=== CONSENT STATUS ===');
  s.push(buildConsentSummary(data.consents || {}));
  s.push('E-Signature: ' + (data.signature ? 'PROVIDED' : 'NOT PROVIDED'));
  s.push('Intake Acknowledgment: ' + (data.intakeAcknowledged ? 'ACKNOWLEDGED' : 'NOT ACKNOWLEDGED'));

  if (data.consentFormSignature) {
    s.push('\n=== CONSENT SIGNATURE ===');
    var cSig = data.consentFormSignature;
    s.push('Signature: ' + (cSig.type === 'typed' ? 'Typed — ' + cSig.text : 'Drawn — image attached'));
  }

  s.push('\n=== PAYMENT ===');
  s.push('Card: ' + (data.cardBrand || 'N/A') + ' ending ' + (data.cardLast4 || 'N/A'));
  s.push('Stripe ID: ' + (data.stripePaymentMethodId || 'N/A'));

  if (data.additionalPatients && data.additionalPatients.length > 0) {
    s.push('\n=== ADDITIONAL PATIENTS ===');
    data.additionalPatients.forEach(function (pt, idx) {
      s.push('\n--- Patient ' + (idx + 2) + ' ---');
      s.push('Name: ' + (pt.fname || '') + ' ' + (pt.lname || ''));
      if (pt.dob) s.push('Date of Birth: ' + pt.dob);
      if (pt.phone) s.push('Phone: ' + pt.phone);
      s.push('Address: ' + formatAddress(pt));
      s.push('Services: ' + (pt.services && pt.services.length > 0 ? pt.services.join(', ') : 'Same as primary'));
      if (pt.medicalSurgicalHistory) s.push('Medical/Surgical History: ' + pt.medicalSurgicalHistory);
      if (pt.medications) s.push('Medications: ' + pt.medications);
      if (pt.allergies) s.push('Allergies: ' + pt.allergies);
      if (pt.ivReactions) s.push('IV Reactions: ' + pt.ivReactions);
      if (pt.clinicianNotes) s.push('Clinician Notes: ' + pt.clinicianNotes);
    });
  }
  return s.join('\n');
}

function ptSection(label, val) {
  if (!val) return '';
  return '<p><strong style="color:#D4BC82;">' + label + ':</strong> ' + val + '</p>';
}

function buildBusinessEmailHtml(data) {
  var addr = formatAddress(data);
  var h = '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a3a2a;color:#fff;padding:30px;border-radius:12px;">';
  h += '<div style="text-align:center;margin-bottom:20px;"><h1 style="color:#D4BC82;font-size:22px;margin:0;">New Patient Booking</h1><p style="color:rgba(255,255,255,0.6);font-size:13px;">Healing Soulutions</p></div>';

  h += '<div style="background:rgba(255,255,255,0.08);border-radius:8px;padding:16px;margin-bottom:16px;">';
  h += '<h2 style="color:#D4BC82;font-size:16px;margin:0 0 12px;">Primary Patient</h2>';
  h += ptSection('Name', (data.fname || '') + ' ' + (data.lname || ''));
  h += ptSection('Date of Birth', data.dob);
  h += ptSection('Email', data.email);
  h += ptSection('Phone', data.phone);
  h += ptSection('Address', addr);
  h += ptSection('Date', data.date || 'TBD');
  h += ptSection('Time', data.selTime || 'TBD');
  h += ptSection('Services', data.services && data.services.length > 0 ? data.services.join(', ') : 'General Consultation');
  h += ptSection('Notes', data.notes);
  h += '</div>';

  h += '<div style="background:rgba(255,255,255,0.08);border-radius:8px;padding:16px;margin-bottom:16px;">';
  h += '<h2 style="color:#D4BC82;font-size:16px;margin:0 0 12px;">Medical Information</h2>';
  h += ptSection('Medical/Surgical History', data.medicalSurgicalHistory);
  h += ptSection('Medications', data.medications);
  h += ptSection('Allergies', data.allergies);
  h += ptSection('Previous IV Therapy Reactions', data.ivReactions);
  h += ptSection('Clinician Notes', data.clinicianNotes);
  h += '</div>';

  h += '<div style="background:rgba(255,255,255,0.08);border-radius:8px;padding:16px;margin-bottom:16px;">';
  h += '<h2 style="color:#D4BC82;font-size:16px;margin:0 0 12px;">Consent Status</h2>';
  var cl = { treatment: 'Treatment Consent', hipaa: 'HIPAA Privacy', medical: 'Medical Release', financial: 'Financial Agreement' };
  ['treatment', 'hipaa', 'medical', 'financial'].forEach(function (k) {
    var agreed = data.consents && data.consents[k];
    h += '<p>' + (agreed ? '✅' : '❌') + ' <strong style="color:#D4BC82;">' + cl[k] + ':</strong> ' + (agreed ? 'AGREED' : 'NOT AGREED') + '</p>';
  });
  var cSig = data.consentFormSignature;
  var sigDesc = cSig ? (cSig.type === 'typed' ? 'Typed: ' + cSig.text : 'Drawn signature (image in IntakeQ files)') : 'Not provided';
  h += ptSection('Consent Signature', sigDesc);
  h += ptSection('Overall E-Signature', data.signature ? 'Provided' : 'Not provided');
  h += ptSection('Intake Acknowledgment', data.intakeAcknowledged ? 'Acknowledged' : 'Not acknowledged');
  h += '</div>';

  h += '<div style="background:rgba(255,255,255,0.08);border-radius:8px;padding:16px;margin-bottom:16px;">';
  h += '<h2 style="color:#D4BC82;font-size:16px;margin:0 0 12px;">Payment</h2>';
  h += ptSection('Cardholder', data.cardHolderName);
  h += ptSection('Card', (data.cardBrand || '') + ' ending in ' + (data.cardLast4 || 'N/A'));
  h += '</div>';

  if (data.additionalPatients && data.additionalPatients.length > 0) {
    h += '<div style="background:rgba(255,255,255,0.08);border-radius:8px;padding:16px;margin-bottom:16px;">';
    h += '<h2 style="color:#D4BC82;font-size:16px;margin:0 0 12px;">Additional Patients (' + data.additionalPatients.length + ')</h2>';
    data.additionalPatients.forEach(function (pt, idx) {
      h += '<div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:12px;margin-top:12px;">';
      h += '<h3 style="color:#D4BC82;font-size:14px;margin:0 0 8px;">Patient ' + (idx + 2) + ': ' + (pt.fname || '') + ' ' + (pt.lname || '') + '</h3>';
      h += ptSection('Date of Birth', pt.dob);
      h += ptSection('Phone', pt.phone);
      var pa = formatAddress(pt);
      if (pa && pa !== 'Not specified') h += ptSection('Address', pa);
      h += ptSection('Services', pt.services && pt.services.length > 0 ? pt.services.join(', ') : 'Same as primary');
      h += ptSection('Medical/Surgical History', pt.medicalSurgicalHistory);
      h += ptSection('Medications', pt.medications);
      h += ptSection('Allergies', pt.allergies);
      h += ptSection('Previous IV Reactions', pt.ivReactions);
      h += ptSection('Clinician Notes', pt.clinicianNotes);
      h += '</div>';
    });
    h += '</div>';
  }

  h += '</div>';
  return h;
}

function buildPatientEmailHtml(data) {
  var addr = formatAddress(data);
  var h = '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a3a2a;color:#fff;padding:30px;border-radius:12px;">';
  h += '<div style="text-align:center;margin-bottom:20px;"><h1 style="color:#D4BC82;font-size:22px;margin:0;">Booking Confirmation</h1><p style="color:rgba(255,255,255,0.6);font-size:13px;">Healing Soulutions</p></div>';

  h += '<div style="background:rgba(255,255,255,0.08);border-radius:8px;padding:16px;margin-bottom:16px;">';
  h += '<h2 style="color:#D4BC82;font-size:16px;margin:0 0 12px;">Your Appointment</h2>';
  h += ptSection('Patient', (data.fname || '') + ' ' + (data.lname || ''));
  h += ptSection('Date', data.date || 'TBD');
  h += ptSection('Time', data.selTime || 'TBD');
  h += ptSection('Services', data.services && data.services.length > 0 ? data.services.join(', ') : 'General Consultation');
  h += ptSection('Address', addr);
  h += '</div>';

  h += '<div style="background:rgba(255,255,255,0.08);border-radius:8px;padding:16px;margin-bottom:16px;">';
  h += '<h2 style="color:#D4BC82;font-size:16px;margin:0 0 12px;">Medical Info on File</h2>';
  h += ptSection('Medical/Surgical History', data.medicalSurgicalHistory);
  h += ptSection('Medications', data.medications);
  h += ptSection('Allergies', data.allergies);
  h += ptSection('Previous IV Reactions', data.ivReactions);
  h += '</div>';

  h += '<div style="background:rgba(255,255,255,0.08);border-radius:8px;padding:16px;margin-bottom:16px;">';
  h += '<h2 style="color:#D4BC82;font-size:16px;margin:0 0 12px;">Consent Forms</h2>';
  h += '<p>✅ Treatment Consent — Signed</p>';
  h += '<p>✅ HIPAA Privacy — Signed</p>';
  h += '<p>✅ Medical Release — Signed</p>';
  h += '<p>✅ Financial Agreement — Signed</p>';
  h += '</div>';

  if (data.additionalPatients && data.additionalPatients.length > 0) {
    h += '<div style="background:rgba(255,255,255,0.08);border-radius:8px;padding:16px;margin-bottom:16px;">';
    h += '<h2 style="color:#D4BC82;font-size:16px;margin:0 0 12px;">Additional Patients (' + data.additionalPatients.length + ')</h2>';
    data.additionalPatients.forEach(function (pt, idx) {
      h += '<div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:12px;margin-top:12px;">';
      h += '<h3 style="color:#D4BC82;font-size:14px;margin:0 0 8px;">Patient ' + (idx + 2) + ': ' + (pt.fname || '') + ' ' + (pt.lname || '') + '</h3>';
      h += ptSection('Date of Birth', pt.dob);
      h += ptSection('Phone', pt.phone);
      var pa = formatAddress(pt);
      if (pa && pa !== 'Not specified') h += ptSection('Address', pa);
      h += ptSection('Services', pt.services && pt.services.length > 0 ? pt.services.join(', ') : 'Same as primary');
      h += ptSection('Medical/Surgical History', pt.medicalSurgicalHistory);
      h += ptSection('Medications', pt.medications);
      h += ptSection('Allergies', pt.allergies);
      h += ptSection('Previous IV Reactions', pt.ivReactions);
      h += ptSection('Clinician Notes', pt.clinicianNotes);
      h += '</div>';
    });
    h += '</div>';
  }

  h += '<div style="background:rgba(255,255,255,0.08);border-radius:8px;padding:16px;margin-bottom:16px;">';
  h += ptSection('Payment', (data.cardBrand || 'Card') + ' ending in ' + (data.cardLast4 || '****') + ' verified');
  h += '</div>';

  h += '<div style="text-align:center;padding:16px;">';
  h += '<p style="color:#D4BC82;font-size:14px;">Our team will contact you within 24 hours to confirm.</p>';
  h += '<p style="color:rgba(255,255,255,0.5);font-size:12px;">Healing Soulutions — info@healingsoulutions.care — (585) 747-2215</p>';
  h += '<p style="color:rgba(255,255,255,0.4);font-size:11px;">Your data is stored securely per HIPAA regulations.</p>';
  h += '</div></div>';
  return h;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    var data = req.body;
    if (!data.fname || !data.lname || !data.email) {
      return res.status(400).json({ error: 'First name, last name, and email are required.' });
    }

    var errors = [];
    var clientId;

    // ── 1. Create/update client in IntakeQ ──
    try {
      var existingClients = await intakeqRequest('/clients?search=' + encodeURIComponent(data.email) + '&IncludeProfile=true', 'GET');
      var clientPayload = {
        FirstName: data.fname, LastName: data.lname, Email: data.email,
        Phone: data.phone || '', Address: formatAddress(data),
        Notes: buildPatientNotes(data),
      };
      if (Array.isArray(existingClients) && existingClients.length > 0) {
        clientId = existingClients[0].ClientId || existingClients[0].Id;
        clientPayload.ClientId = clientId;
        clientPayload.Email = data.email;
        await intakeqRequest('/clients', 'POST', clientPayload);
      } else {
        var newClient = await intakeqRequest('/clients', 'POST', clientPayload);
        clientId = newClient.ClientId || newClient.Id;
      }
    } catch (e) {
      console.error('Client error:', e);
      errors.push('client: ' + e.message);
    }

    // ── 2. Submit intake questions ──
    try {
      var payload = {
        ClientId: clientId || undefined,
        ClientName: data.fname + ' ' + data.lname,
        ClientEmail: data.email,
        ClientPhone: data.phone || '',
        Status: 'Submitted',
        DateCreated: new Date().toISOString(),
        Questions: [],
      };
      var addQ = function (text, answer, cat) {
        if (answer) payload.Questions.push({ Text: text, Answer: String(answer), Category: cat || 'General' });
      };

      addQ('First Name', data.fname, 'Personal Information');
      addQ('Last Name', data.lname, 'Personal Information');
      addQ('Date of Birth', data.dob, 'Personal Information');
      addQ('Email', data.email, 'Personal Information');
      addQ('Phone', data.phone, 'Personal Information');
      addQ('Address Line 1', data.address1, 'Personal Information');
      addQ('Address Line 2', data.address2, 'Personal Information');
      addQ('City', data.city, 'Personal Information');
      addQ('State / Province / Region', data.stateProvince || data.state, 'Personal Information');
      addQ('Country', data.country, 'Personal Information');
      addQ('Postal / Zip Code', data.postalCode || data.zipCode, 'Personal Information');
      addQ('Preferred Date', data.date, 'Appointment');
      addQ('Preferred Time', data.selTime, 'Appointment');
      addQ('Services', data.services ? data.services.join(', ') : '', 'Appointment');
      addQ('Additional Notes', data.notes, 'Appointment');
      addQ('Medical / Surgical History', data.medicalSurgicalHistory, 'Medical');
      addQ('Current Medications', data.medications, 'Medical');
      addQ('Allergies', data.allergies, 'Medical');
      addQ('Previous IV Therapy Reactions', data.ivReactions, 'Medical');
      addQ('Notes for Clinician', data.clinicianNotes, 'Medical');

      addQ('Treatment Consent', data.consents && data.consents.treatment ? 'Agreed' : 'Not Agreed', 'Consents');
      addQ('HIPAA Privacy', data.consents && data.consents.hipaa ? 'Agreed' : 'Not Agreed', 'Consents');
      addQ('Medical Release', data.consents && data.consents.medical ? 'Agreed' : 'Not Agreed', 'Consents');
      addQ('Financial Agreement', data.consents && data.consents.financial ? 'Agreed' : 'Not Agreed', 'Consents');

      // Consent signature (single signature for all consents)
      if (data.consentFormSignature) {
        addQ('Consent Forms Signature', data.consentFormSignature.type === 'typed' ? 'Typed: ' + data.consentFormSignature.text : 'Drawn (image in Files)', 'Consent Signatures');
      }

      addQ('E-Signature', data.signature ? 'Provided' : 'Not Provided', 'Consents');
      addQ('Intake Acknowledgment', data.intakeAcknowledged ? 'Acknowledged' : 'Not Acknowledged', 'Consents');
      addQ('Card Brand', data.cardBrand, 'Payment');
      addQ('Card Last 4', data.cardLast4, 'Payment');
      addQ('Stripe ID', data.stripePaymentMethodId, 'Payment');
      addQ('Cardholder', data.cardHolderName, 'Payment');

      if (data.additionalPatients && data.additionalPatients.length > 0) {
        data.additionalPatients.forEach(function (pt, idx) {
          var p = 'Patient ' + (idx + 2);
          addQ(p + ' — Name', (pt.fname || '') + ' ' + (pt.lname || ''), 'Additional Patients');
          addQ(p + ' — Date of Birth', pt.dob, 'Additional Patients');
          addQ(p + ' — Phone', pt.phone, 'Additional Patients');
          addQ(p + ' — Address', formatAddress(pt), 'Additional Patients');
          addQ(p + ' — Services', pt.services ? pt.services.join(', ') : '', 'Additional Patients');
          addQ(p + ' — Medical/Surgical History', pt.medicalSurgicalHistory, 'Additional Patients');
          addQ(p + ' — Medications', pt.medications, 'Additional Patients');
          addQ(p + ' — Allergies', pt.allergies, 'Additional Patients');
          addQ(p + ' — IV Reactions', pt.ivReactions, 'Additional Patients');
          addQ(p + ' — Clinician Notes', pt.clinicianNotes, 'Additional Patients');
        });
      }

      await intakeqRequest('/intakes', 'POST', payload);
    } catch (e) {
      console.error('Intake error:', e);
      errors.push('intake: ' + e.message);
    }

    // ── 3. Upload consent signature images to IntakeQ Files ──
    if (clientId) {
      if (data.consentFormSignature && data.consentFormSignature.type === 'drawn' && data.consentFormSignature.image) {
        try { await uploadBase64Image(clientId, 'Consent_Forms_Signature.png', data.consentFormSignature.image); } catch (e) { console.error('Consent sig upload:', e.message); }
      }
      if (data.intakeSignatureImage && data.intakeSignatureImage.type === 'drawn' && data.intakeSignatureImage.image) {
        try { await uploadBase64Image(clientId, 'Intake_Acknowledgment_Sig.png', data.intakeSignatureImage.image); } catch (e) { console.error('Intake sig upload:', e.message); }
      }
    }

    // ── 4. Business notification email ──
    try {
      var rk = process.env.RESEND_API_KEY;
      if (rk) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + rk, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Healing Soulutions <bookings@healingsoulutions.care>',
            to: ['info@healingsoulutions.care'],
            subject: 'New Booking: ' + data.fname + ' ' + data.lname + ' — ' + (data.services && data.services.length > 0 ? data.services[0] : 'General'),
            html: buildBusinessEmailHtml(data),
          }),
        });
        console.log('[Email] Business notification sent');
      }
    } catch (e) {
      console.error('Business email error:', e);
      errors.push('businessEmail: ' + e.message);
    }

    // ── 5. Patient confirmation email ──
    try {
      var rk2 = process.env.RESEND_API_KEY;
      if (rk2 && data.email) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + rk2, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Healing Soulutions <bookings@healingsoulutions.care>',
            to: [data.email],
            subject: 'Booking Confirmation — Healing Soulutions',
            html: buildPatientEmailHtml(data),
          }),
        });
        console.log('[Email] Patient confirmation sent to ' + data.email);
      }
    } catch (e) {
      console.error('Patient email error:', e);
      errors.push('patientEmail: ' + e.message);
    }

    console.log('[Booking] ' + data.fname + ' ' + data.lname + ' (' + data.email + ')');
    if (errors.length > 0) console.warn('[Booking] Partial errors:', errors.join('; '));

    return res.status(200).json({
      success: true,
      clientId: clientId || null,
      errors: errors.length > 0 ? errors : undefined,
      message: 'Intake submitted successfully to HIPAA-secure server.',
    });
  } catch (error) {
    console.error('Submit intake error:', error);
    return res.status(500).json({ error: 'Failed to submit intake. Please contact us directly.' });
  }
}
