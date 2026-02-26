const INTAKEQ_API_BASE = 'https://intakeq.com/api/v1';
const BUSINESS_EMAIL = 'info@healingsoulutions.care';

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
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) { return; }
  const patientName = ((data.fname || '') + ' ' + (data.lname || '')).trim() || 'New Patient';
  const c = data.consents || {};
  const ck = function(val) { return val ? 'YES' : 'NO'; };

  let addPatientsHtml = '';
  if (data.additionalPatients && data.additionalPatients.length > 0) {
    addPatientsHtml = '<h3 style="color:#2E5A46;margin-top:20px;">Additional Patients (' + data.additionalPatients.length + ')</h3>';
    data.additionalPatients.forEach(function(pt, idx) {
      const ptName = ((pt.fname || '') + ' ' + (pt.lname || '')).trim() || 'Patient ' + (idx + 2);
      const ptSvc = pt.services && pt.services.length > 0 ? pt.services.join(', ') : 'Same as primary';
      addPatientsHtml += '<div style="background:#f0f7f3;border-radius:8px;padding:12px;margin:8px 0;">'
        + '<b style="color:#2E5A46;">Patient ' + (idx + 2) + ': ' + ptName + '</b><br/>'
        + 'Services: ' + ptSvc + '<br/>'
        + 'Medical History: ' + (pt.medicalHistory || 'None') + '<br/>'
        + 'Surgical History: ' + (pt.surgicalHistory || 'None') + '<br/>'
        + 'Medications: ' + (pt.medications || 'None') + '<br/>'
        + 'Allergies: ' + (pt.allergies || 'None') + '<br/>'
        + (pt.clinicianNotes ? 'Clinician Notes: ' + pt.clinicianNotes + '<br/>' : '')
        + '</div>';
    });
  }

  const html = '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">'
    + '<div style="background:#2E5A46;padding:20px;text-align:center;">'
    + '<h1 style="color:#D4BC82;margin:0;font-size:22px;">New Patient Intake</h1>'
    + '<p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px;">Healing Soulutions</p></div>'
    + '<div style="padding:20px;">'
    + '<h3 style="color:#2E5A46;">Patient Information</h3>'
    + '<p><b>Name:</b> ' + patientName + '</p>'
    + '<p><b>Email:</b> ' + (data.email || 'N/A') + '</p>'
    + '<p><b>Phone:</b> ' + (data.phone || 'N/A') + '</p>'
    + '<p><b>Address:</b> ' + (data.address || 'N/A') + '</p>'
    + '<h3 style="color:#2E5A46;margin-top:20px;">Appointment</h3>'
    + '<p><b>Date:</b> ' + (data.date || 'TBD') + '</p>'
    + '<p><b>Time:</b> ' + (data.selTime || 'TBD') + '</p>'
    + '<p><b>Services:</b> ' + (data.services && data.services.length > 0 ? data.services.join(', ') : 'General Consultation') + '</p>'
    + (data.notes ? '<p><b>Notes:</b> ' + data.notes + '</p>' : '')
    + '<h3 style="color:#2E5A46;margin-top:20px;">Medical Information</h3>'
    + '<p><b>Medical History:</b> ' + (data.medicalHistory || 'None') + '</p>'
    + '<p><b>Surgical History:</b> ' + (data.surgicalHistory || 'None') + '</p>'
    + '<p><b>Medications:</b> ' + (data.medications || 'None') + '</p>'
    + '<p><b>Allergies:</b> ' + (data.allergies || 'None') + '</p>'
    + (data.clinicianNotes ? '<p><b>Clinician Notes:</b> ' + data.clinicianNotes + '</p>' : '')
    + '<h3 style="color:#2E5A46;margin-top:20px;">Consents</h3>'
    + '<p>Treatment: ' + ck(c.treatment) + ' | HIPAA: ' + ck(c.hipaa) + ' | Medical: ' + ck(c.medical) + ' | Financial: ' + ck(c.financial) + '</p>'
    + '<p><b>E-Signature:</b> ' + (data.signature || 'Not provided') + '</p>'
    + '<p><b>Intake Acknowledged:</b> ' + (data.intakeAcknowledged ? 'Yes' : 'No') + '</p>'
    + '<h3 style="color:#2E5A46;margin-top:20px;">Payment</h3>'
    + '<p><b>Card:</b> ' + (data.cardBrand || 'N/A') + ' ****' + (data.cardLast4 || 'N/A') + ' (' + (data.cardHolderName || 'N/A') + ')</p>'
    + addPatientsHtml
    + '<div style="margin-top:20px;padding:12px;background:#FFF8E7;border:1px solid #D4BC82;border-radius:8px;text-align:center;">'
    + '<p style="margin:0;font-size:13px;color:#2E5A46;"><b>Full record saved to IntakeQ (HIPAA-secure)</b></p></div>'
    + '</div></div>';

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + resendApiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Healing Soulutions <bookings@healingsoulutions.care>',
        to: [BUSINESS_EMAIL],
        subject: 'New Intake: ' + patientName + ' - ' + (data.date || 'Date TBD'),
        html: html,
        reply_to: data.email || undefined,
      }),
    });
  } catch (e) { console.error('Business email error:', e); }
}

async function sendPatientConfirmationEmail(data) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey || !data.email) { return; }
  const patientName = ((data.fname || '') + ' ' + (data.lname || '')).trim() || 'Valued Patient';
  const serviceList = data.services && data.services.length > 0 ? data.services.join(', ') : 'General Consultation';
  const c = data.consents || {};

  let addPatientsHtml = '';
  if (data.additionalPatients && data.additionalPatients.length > 0) {
    addPatientsHtml = '<div style="margin-top:16px;padding:12px;background:#f0f7f3;border-radius:8px;">'
      + '<p style="margin:0 0 8px;font-weight:600;color:#2E5A46;">Additional Patients:</p>';
    data.additionalPatients.forEach(function(pt, idx) {
      const ptName = ((pt.fname || '') + ' ' + (pt.lname || '')).trim() || 'Patient ' + (idx + 2);
      const ptSvc = pt.services && pt.services.length > 0 ? pt.services.join(', ') : 'Same as primary';
      addPatientsHtml += '<p style="margin:4px 0;font-size:14px;">' + ptName + ' - ' + ptSvc + '</p>';
    });
    addPatientsHtml += '</div>';
  }

  const html = '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">'
    + '<div style="background:#2E5A46;padding:24px;text-align:center;">'
    + '<h1 style="color:#D4BC82;margin:0;font-size:24px;">Booking Confirmed</h1>'
    + '<p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Healing Soulutions</p></div>'
    + '<div style="padding:24px;">'
    + '<p style="font-size:16px;color:#333;">Dear ' + patientName + ',</p>'
    + '<p style="font-size:14px;color:#555;line-height:1.6;">Thank you for booking with Healing Soulutions. Your appointment request has been received. Our team will contact you within 24 hours to confirm.</p>'
    + '<div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:20px 0;border-left:4px solid #2E5A46;">'
    + '<h3 style="margin:0 0 12px;color:#2E5A46;font-size:16px;">Your Appointment Details</h3>'
    + '<p style="margin:4px 0;font-size:14px;"><b>Date:</b> ' + (data.date || 'To be confirmed') + '</p>'
    + '<p style="margin:4px 0;font-size:14px;"><b>Time:</b> ' + (data.selTime || 'To be confirmed') + '</p>'
    + '<p style="margin:4px 0;font-size:14px;"><b>Services:</b> ' + serviceList + '</p>'
    + (data.address ? '<p style="margin:4px 0;font-size:14px;"><b>Location:</b> ' + data.address + '</p>' : '')
    + addPatientsHtml
    + '</div>'
    + '<h3 style="color:#2E5A46;margin-top:20px;font-size:15px;">Medical Information on File</h3>'
    + '<p style="font-size:13px;color:#555;"><b>Medical History:</b> ' + (data.medicalHistory || 'None provided') + '</p>'
    + '<p style="font-size:13px;color:#555;"><b>Surgical History:</b> ' + (data.surgicalHistory || 'None provided') + '</p>'
    + '<p style="font-size:13px;color:#555;"><b>Medications:</b> ' + (data.medications || 'None provided') + '</p>'
    + '<p style="font-size:13px;color:#555;"><b>Allergies:</b> ' + (data.allergies || 'None provided') + '</p>'
    + (data.clinicianNotes ? '<p style="font-size:13px;color:#555;"><b>Notes for Clinician:</b> ' + data.clinicianNotes + '</p>' : '')
    + '<div style="background:#FFF8E7;border-radius:8px;padding:14px;margin:16px 0;border:1px solid #D4BC82;">'
    + '<p style="margin:0 0 8px;font-size:13px;color:#555;font-weight:600;">Consents Completed:</p>'
    + (c.treatment ? '<p style="margin:2px 0;font-size:13px;color:#555;">&#10003; Treatment Consent</p>' : '')
    + (c.hipaa ? '<p style="margin:2px 0;font-size:13px;color:#555;">&#10003; HIPAA Privacy Notice</p>' : '')
    + (c.medical ? '<p style="margin:2px 0;font-size:13px;color:#555;">&#10003; Medical History Release</p>' : '')
    + (c.financial ? '<p style="margin:2px 0;font-size:13px;color:#555;">&#10003; Financial Agreement</p>' : '')
    + '<p style="margin:8px 0 0;font-size:12px;color:#888;">Signed electronically by: ' + (data.signature || 'N/A') + '</p>'
    + '</div>'
    + '<p style="margin:4px 0;font-size:14px;"><b>Card on file:</b> ' + (data.cardBrand || '') + ' ****' + (data.cardLast4 || 'N/A') + '</p>'
    + '<hr style="border:none;border-top:1px solid #eee;margin:20px 0;"/>'
    + '<p style="font-size:14px;color:#555;">If you need to reschedule or have questions:</p>'
    + '<p style="font-size:14px;"><b>Email:</b> ' + BUSINESS_EMAIL + '</p>'
    + '<p style="font-size:14px;"><b>Phone:</b> (585) 747-2215</p>'
    + '<p style="font-size:13px;color:#999;margin-top:20px;">Please remember our 24-hour cancellation policy. Cancellations made less than 24 hours before your appointment may be subject to a fee.</p>'
    + '</div>'
    + '<div style="background:#f5f5f5;padding:12px;text-align:center;font-size:11px;color:#999;">'
    + 'Healing Soulutions | Concierge Nursing Care | New York Metropolitan Area</div>'
    + '</div>';

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + resendApiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Healing Soulutions <bookings@healingsoulutions.care>',
        to: [data.email],
        subject: 'Booking Confirmed - Healing Soulutions | ' + (data.date || ''),
        html: html,
        reply_to: BUSINESS_EMAIL,
      }),
    });
  } catch (e) { console.error('Patient email error:', e); }
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

    try { await sendBusinessEmail(data); } catch (e) { console.error('Business email failed:', e); }
    try { await sendPatientConfirmationEmail(data); } catch (e) { console.error('Patient email failed:', e); }

    console.log('[Booking] ' + data.fname + ' ' + data.lname + ' (' + data.email + ') - Services: ' + (data.services ? data.services.join(', ') : 'General'));

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
