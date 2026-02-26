const INTAKEQ_API_BASE = 'https://intakeq.com/api/v1';

async function intakeqRequest(endpoint, method, body) {
  const apiKey = process.env.INTAKEQ_API_KEY;
  if (!apiKey) {
    throw new Error('IntakeQ API key is not configured.');
  }

  const response = await fetch(`${INTAKEQ_API_BASE}${endpoint}`, {
    method,
    headers: {
      'X-Auth-Key': apiKey,
      'Content-Type': 'application/json',
    },
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

function buildConsentSummary(consents) {
  const items = [];
  if (consents.treatment) items.push('Treatment Consent: AGREED');
  if (consents.hipaa) items.push('HIPAA Privacy: AGREED');
  if (consents.medical) items.push('Medical History Release: AGREED');
  if (consents.financial) items.push('Financial Agreement: AGREED');
  return items.join('\n');
}

function buildPatientNotes(data) {
  const sections = [];
  sections.push('=== APPOINTMENT DETAILS ===');
  sections.push('Preferred Date: ' + (data.date || 'Not specified'));
  sections.push('Preferred Time: ' + (data.selTime || 'Not specified'));
  sections.push('Services Requested: ' + (data.services && data.services.length > 0 ? data.services.join(', ') : 'General Consultation'));
  if (data.address) sections.push('Service Address: ' + data.address);
  if (data.notes) sections.push('Patient Notes: ' + data.notes);
  sections.push('\n=== MEDICAL INFORMATION ===');
  if (data.medicalHistory) sections.push('Medical History: ' + data.medicalHistory);
  if (data.surgicalHistory) sections.push('Surgical History: ' + data.surgicalHistory);
  if (data.medications) sections.push('Current Medications: ' + data.medications);
  if (data.allergies) sections.push('Allergies: ' + data.allergies);
  if (data.clinicianNotes) sections.push('Notes for Clinician: ' + data.clinicianNotes);
  sections.push('\n=== CONSENT STATUS ===');
  sections.push(buildConsentSummary(data.consents || {}));
  sections.push('Electronic Signature: ' + (data.signature ? 'PROVIDED' : 'NOT PROVIDED'));
  sections.push('Intake Acknowledgment: ' + (data.intakeAcknowledged ? 'ACKNOWLEDGED' : 'NOT ACKNOWLEDGED'));
  sections.push('\n=== PAYMENT VERIFICATION ===');
  sections.push('Card Brand: ' + (data.cardBrand || 'N/A'));
  sections.push('Card Last 4: ' + (data.cardLast4 || 'N/A'));
  sections.push('Stripe Payment Method ID: ' + (data.stripePaymentMethodId || 'N/A'));
  if (data.additionalPatients && data.additionalPatients.length > 0) {
    sections.push('\n=== ADDITIONAL PATIENTS ===');
    data.additionalPatients.forEach(function(pt, idx) {
      sections.push('\n--- Patient ' + (idx + 2) + ' ---');
      sections.push('Name: ' + (pt.fname || '') + ' ' + (pt.lname || ''));
      sections.push('Services: ' + (pt.services && pt.services.length > 0 ? pt.services.join(', ') : 'Same as primary'));
      if (pt.medicalHistory) sections.push('Medical History: ' + pt.medicalHistory);
      if (pt.surgicalHistory) sections.push('Surgical History: ' + pt.surgicalHistory);
      if (pt.medications) sections.push('Medications: ' + pt.medications);
      if (pt.allergies) sections.push('Allergies: ' + pt.allergies);
      if (pt.clinicianNotes) sections.push('Clinician Notes: ' + pt.clinicianNotes);
    });
  }
  return sections.join('\n');
}
async function sendBusinessEmail(data) {
  var resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) { return; }
  var patientName = ((data.fname || '') + ' ' + (data.lname || '')).trim() || 'New Patient';
  var c = data.consents || {};
  var ck = function(val) { return val ? 'YES' : 'NO'; };
  var html = '<div style="font-family:Arial;max-width:600px;margin:0 auto;"><div style="background:#2E5A46;padding:20px;text-align:center;"><h1 style="color:#D4BC82;margin:0;">New Patient Intake</h1></div><div style="padding:20px;"><p><b>Name:</b> ' + patientName + '</p><p><b>Email:</b> ' + (data.email || 'N/A') + '</p><p><b>Phone:</b> ' + (data.phone || 'N/A') + '</p><p><b>Date:</b> ' + (data.date || 'TBD') + '</p><p><b>Time:</b> ' + (data.selTime || 'TBD') + '</p><p><b>Services:</b> ' + (data.services && data.services.length > 0 ? data.services.join(', ') : 'General') + '</p><p><b>Consents:</b> Treatment:' + ck(c.treatment) + ' HIPAA:' + ck(c.hipaa) + ' Medical:' + ck(c.medical) + ' Financial:' + ck(c.financial) + '</p><p><b>Signature:</b> ' + (data.signature || 'N/A') + '</p></div></div>';
  try { await fetch('https://api.resend.com/emails', { method: 'POST', headers: { 'Authorization': 'Bearer ' + resendApiKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: 'Healing Soulutions <bookings@healingsoulutions.care>', to: ['info@healingsoulutions.care'], subject: 'New Intake: ' + patientName, html: html }) }); } catch (e) { console.error('Email error:', e); }
}

async function sendPatientEmail(data) {
  var resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey || !data.email) { return; }
  var patientName = ((data.fname || '') + ' ' + (data.lname || '')).trim() || 'Valued Patient';
  var html = '<div style="font-family:Arial;max-width:600px;margin:0 auto;"><div style="background:#2E5A46;padding:20px;text-align:center;"><h1 style="color:#D4BC82;margin:0;">Booking Confirmed</h1></div><div style="padding:20px;"><p>Dear ' + patientName + ',</p><p>Thank you for booking with Healing Soulutions. Our team will contact you within 24 hours.</p><p><b>Date:</b> ' + (data.date || 'TBD') + '</p><p><b>Time:</b> ' + (data.selTime || 'TBD') + '</p><p><b>Services:</b> ' + (data.services && data.services.length > 0 ? data.services.join(', ') : 'General') + '</p><p>Questions? Email info@healingsoulutions.care or call (585) 747-2215</p><p style="color:#999;font-size:12px;">24-hour cancellation policy applies.</p></div></div>';
  try { await fetch('https://api.resend.com/emails', { method: 'POST', headers: { 'Authorization': 'Bearer ' + resendApiKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: 'Healing Soulutions <bookings@healingsoulutions.care>', to: [data.email], subject: 'Booking Confirmed - Healing Soulutions', html: html, reply_to: 'info@healingsoulutions.care' }) }); } catch (e) { console.error('Patient email error:', e); }
}
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;

    if (!data.fname || !data.lname || !data.email) {
      return res.status(400).json({ error: 'First name, last name, and email are required.' });
    }

    let clientId;
    try {
      const existingClients = await intakeqRequest(
        '/clients?search=' + encodeURIComponent(data.email),
        'GET'
      );

      const clientPayload = {
        FirstName: data.fname,
        LastName: data.lname,
        Email: data.email,
        Phone: data.phone || '',
        Address: data.address || '',
        DateOfBirth: null,
        Tags: ['Website Booking', 'Online Intake'],
        Notes: buildPatientNotes(data),
      };

      if (Array.isArray(existingClients) && existingClients.length > 0) {
        clientId = existingClients[0].ClientId || existingClients[0].Id;
        clientPayload.ClientId = clientId;
        await intakeqRequest('/clients', 'PUT', clientPayload);
      } else {
        const newClient = await intakeqRequest('/clients', 'POST', clientPayload);
        clientId = newClient.ClientId || newClient.Id;
      }
    } catch (clientError) {
      console.error('IntakeQ client create/update error:', clientError);
    }

    try {
      const intakePayload = {
        ClientId: clientId || undefined,
        ClientName: data.fname + ' ' + data.lname,
        ClientEmail: data.email,
        ClientPhone: data.phone || '',
        Status: 'Submitted',
        DateCreated: new Date().toISOString(),
        Questions: [],
      };

      const addQuestion = function(text, answer, category) {
        if (answer) {
          intakePayload.Questions.push({
            Text: text,
            Answer: String(answer),
            Category: category || 'General',
          });
        }
      };

      addQuestion('First Name', data.fname, 'Personal Information');
      addQuestion('Last Name', data.lname, 'Personal Information');
      addQuestion('Email Address', data.email, 'Personal Information');
      addQuestion('Phone Number', data.phone, 'Personal Information');
      addQuestion('Street Address', data.address, 'Personal Information');
      addQuestion('Preferred Date', data.date, 'Appointment');
      addQuestion('Preferred Time', data.selTime, 'Appointment');
      addQuestion('Services Requested', data.services ? data.services.join(', ') : '', 'Appointment');
      addQuestion('Additional Notes', data.notes, 'Appointment');
      addQuestion('Medical History', data.medicalHistory, 'Medical History');
      addQuestion('Surgical History', data.surgicalHistory, 'Medical History');
      addQuestion('Current Medications', data.medications, 'Medications');
      addQuestion('Known Allergies', data.allergies, 'Allergies');
      addQuestion('Notes for Clinician', data.clinicianNotes, 'Clinical Notes');
      addQuestion('Treatment Consent', data.consents && data.consents.treatment ? 'Agreed' : 'Not Agreed', 'Consents');
      addQuestion('HIPAA Privacy Consent', data.consents && data.consents.hipaa ? 'Agreed' : 'Not Agreed', 'Consents');
      addQuestion('Medical Release Consent', data.consents && data.consents.medical ? 'Agreed' : 'Not Agreed', 'Consents');
      addQuestion('Financial Agreement', data.consents && data.consents.financial ? 'Agreed' : 'Not Agreed', 'Consents');
      addQuestion('Electronic Signature', data.signature ? 'Provided' : 'Not Provided', 'Consents');
      addQuestion('Intake Acknowledgment', data.intakeAcknowledged ? 'Acknowledged' : 'Not Acknowledged', 'Consents');
      addQuestion('Card Brand', data.cardBrand, 'Payment');
      addQuestion('Card Last 4 Digits', data.cardLast4, 'Payment');
      addQuestion('Stripe Payment Method ID', data.stripePaymentMethodId, 'Payment');
      addQuestion('Cardholder Name', data.cardHolderName, 'Payment');

      if (data.additionalPatients && data.additionalPatients.length > 0) {
        data.additionalPatients.forEach(function(pt, idx) {
          var prefix = 'Additional Patient ' + (idx + 2);
          addQuestion(prefix + ' - First Name', pt.fname, 'Additional Patients');
          addQuestion(prefix + ' - Last Name', pt.lname, 'Additional Patients');
          addQuestion(prefix + ' - Services', pt.services ? pt.services.join(', ') : '', 'Additional Patients');
          addQuestion(prefix + ' - Medical History', pt.medicalHistory, 'Additional Patients');
          addQuestion(prefix + ' - Surgical History', pt.surgicalHistory, 'Additional Patients');
          addQuestion(prefix + ' - Medications', pt.medications, 'Additional Patients');
          addQuestion(prefix + ' - Allergies', pt.allergies, 'Additional Patients');
          addQuestion(prefix + ' - Clinician Notes', pt.clinicianNotes, 'Additional Patients');
        });
      }

      await intakeqRequest('/intakes', 'POST', intakePayload);
    } catch (intakeError) {
      console.error('IntakeQ intake submission error:', intakeError);
    }
try { await sendBusinessEmail(data); } catch (e) {}
    try { await sendPatientEmail(data); } catch (e) {}    console.log('[Booking] ' + data.fname + ' ' + data.lname + ' (' + data.email + ') - Services: ' + (data.services ? data.services.join(', ') : 'General'));

    return res.status(200).json({
      success: true,
      clientId: clientId || null,
      message: 'Intake submitted successfully to HIPAA-secure server.',
    });
  } catch (error) {
    console.error('Submit intake error:', error);
    return res.status(500).json({ error: 'Failed to submit intake. Please contact us directly.' });
  }
}
