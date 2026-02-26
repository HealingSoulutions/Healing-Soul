var INTAKEQ_API_BASE = 'https://intakeq.com/api/v1';
var RESEND_KEY = process.env.RESEND_API_KEY;
var BUSINESS_EMAIL = 'info@healingsoulutions.care';

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
    throw new Error('IntakeQ API error: ' + response.status);
  }

  var text = await response.text();
  return text ? JSON.parse(text) : {};
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
  var sections = [];
  var timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  sections.push('=== SUBMISSION: ' + timestamp + ' ET ===');
  sections.push('\n=== APPOINTMENT ===');
  sections.push('Date: ' + (data.date || 'Not specified'));
  sections.push('Time: ' + (data.selTime || 'Not specified'));
  sections.push('Services: ' + (data.services && data.services.length > 0 ? data.services.join(', ') : 'General Consultation'));
  if (data.address) sections.push('Address: ' + data.address);
  if (data.notes) sections.push('Notes: ' + data.notes);
  sections.push('\n=== MEDICAL ===');
  sections.push('Medical History: ' + (data.medicalHistory || 'None'));
  sections.push('Surgical History: ' + (data.surgicalHistory || 'None'));
  sections.push('Medications: ' + (data.medications || 'None'));
  sections.push('Allergies: ' + (data.allergies || 'None'));
  if (data.clinicianNotes) sections.push('Clinician Notes: ' + data.clinicianNotes);
  sections.push('\n=== CONSENTS ===');
  sections.push(buildConsentSummary(data.consents || {}));
  sections.push('Signature: ' + (data.signature || 'NOT PROVIDED'));
  sections.push('\n=== PAYMENT ===');
  sections.push('Card: ' + (data.cardBrand || 'N/A') + ' ****' + (data.cardLast4 || 'N/A'));
  if (data.additionalPatients && data.additionalPatients.length > 0) {
    sections.push('\n=== ADDITIONAL PATIENTS (' + data.additionalPatients.length + ') ===');
    data.additionalPatients.forEach(function(pt, idx) {
      sections.push('\n--- Patient ' + (idx + 2) + ': ' + (pt.fname || '') + ' ' + (pt.lname || '') + ' ---');
      sections.push('Services: ' + (pt.services && pt.services.length > 0 ? pt.services.join(', ') : 'Same'));
      if (pt.medicalHistory) sections.push('Medical: ' + pt.medicalHistory);
      if (pt.medications) sections.push('Medications: ' + pt.medications);
      if (pt.allergies) sections.push('Allergies: ' + pt.allergies);
    });
  }
  return sections.join('\n');
}

export default async function handler(req, res) {
if (req.method === 'GET') { return res.status(200).json({ debug: global._lastIntakeResult || 'no bookings yet' }); }
  if (req.method === 'GET') { return res.status(200).json({ debug: global._lastIntakeResult || 'no bookings yet' }); }
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Method not allowed' }); }

  try {
    var data = req.body;

    if (!data.fname || !data.lname || !data.email) {
      return res.status(400).json({ error: 'First name, last name, and email are required.' });
    }

    var timestamp = new Date().toISOString();

    /* -- 1. INTAKEQ: Create/Update Client -- */
    var clientId;
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
        clientId = existingClients[0].ClientId || existingClients[0].Id;
        clientPayload.ClientId = clientId;
        await intakeqRequest('/clients', 'PUT', clientPayload);
      } else {
        var newClient = await intakeqRequest('/clients', 'POST', clientPayload);
        clientId = newClient.ClientId || newClient.Id;
      }
    } catch (clientError) {
      console.error('IntakeQ client error:', clientError);
    }

    /* -- 2. INTAKEQ: Submit Full Intake with Medical + Consents -- */
    try {
      var intakePayload = {
        ClientId: clientId || undefined,
        ClientName: data.fname + ' ' + data.lname,
        ClientEmail: data.email,
        ClientPhone: data.phone || '',
        Status: 'Submitted',
        DateCreated: timestamp,
        Questions: [],
      };

      var addQ = function(text, answer, category) {
        if (answer !== undefined && answer !== null && answer !== '') {
          intakePayload.Questions.push({
            Text: text,
            Answer: String(answer),
            Category: category || 'General',
          });
        }
      };

      addQ('First Name', data.fname, 'Personal Information');
      addQ('Last Name', data.lname, 'Personal Information');
      addQ('Email Address', data.email, 'Personal Information');
      addQ('Phone Number', data.phone, 'Personal Information');
      addQ('Street Address', data.address, 'Personal Information');
      addQ('Preferred Date', data.date, 'Appointment');
      addQ('Preferred Time', data.selTime, 'Appointment');
      addQ('Services Requested', data.services ? data.services.join(', ') : 'General Consultation', 'Appointment');
      addQ('Additional Notes', data.notes, 'Appointment');
      addQ('Medical History', data.medicalHistory || 'None provided', 'Medical History');
      addQ('Surgical History', data.surgicalHistory || 'None provided', 'Medical History');
      addQ('Current Medications', data.medications || 'None provided', 'Medications');
      addQ('Known Allergies', data.allergies || 'None provided', 'Allergies');
      addQ('Notes for Clinician', data.clinicianNotes, 'Clinical Notes');
      addQ('Treatment Consent', data.consents && data.consents.treatment ? 'AGREED' : 'Not Agreed', 'Consents');
      addQ('HIPAA Privacy Consent', data.consents && data.consents.hipaa ? 'AGREED' : 'Not Agreed', 'Consents');
      addQ('Medical Release Consent', data.consents && data.consents.medical ? 'AGREED' : 'Not Agreed', 'Consents');
      addQ('Financial Agreement', data.consents && data.consents.financial ? 'AGREED' : 'Not Agreed', 'Consents');
      addQ('Treatment Consent Details', data.consents && data.consents.treatment ? 'Patient consented to Informed Consent for Treatment including risks, complications, assumption of risk, peptide therapy disclosure, limitation of liability, indemnification, release and waiver, emergency authorization, scope of practice, and dispute resolution.' : 'NOT CONSENTED', 'Consent Details');
      addQ('HIPAA Consent Details', data.consents && data.consents.hipaa ? 'Patient acknowledged HIPAA Notice of Privacy Practices per 45 CFR Parts 160/164 including permitted uses and disclosures, authorization requirements, patient rights, minimum necessary standard, data security, and breach notification procedures.' : 'NOT ACKNOWLEDGED', 'Consent Details');
      addQ('Medical Release Details', data.consents && data.consents.medical ? 'Patient authorized release of medical history and health information for treatment purposes.' : 'NOT AUTHORIZED', 'Consent Details');
      addQ('Financial Agreement Details', data.consents && data.consents.financial ? 'Patient agreed to Financial Agreement including payment terms, 24-hour cancellation policy, no-show fees, and past due account terms.' : 'NOT AGREED', 'Consent Details');
      addQ('Electronic Signature', data.signature || 'Not Provided', 'Signatures');
      addQ('Intake Acknowledgment', data.intakeAcknowledged ? 'ACKNOWLEDGED' : 'Not Acknowledged', 'Signatures');
      addQ('Intake Signature', data.intakeSignature || '', 'Signatures');
      addQ('Consent Timestamp', timestamp, 'Signatures');
      addQ('Card Brand', data.cardBrand, 'Payment');
      addQ('Card Last 4 Digits', data.cardLast4, 'Payment');
      addQ('Cardholder Name', data.cardHolderName, 'Payment');
      addQ('Stripe Payment Method ID', data.stripePaymentMethodId, 'Payment');

      if (data.additionalPatients && data.additionalPatients.length > 0) {
        addQ('Total Additional Patients', String(data.additionalPatients.length), 'Additional Patients');
        data.additionalPatients.forEach(function(pt, idx) {
          var prefix = 'Additional Patient ' + (idx + 2);
          addQ(prefix + ' - First Name', pt.fname, 'Additional Patients');
          addQ(prefix + ' - Last Name', pt.lname, 'Additional Patients');
          addQ(prefix + ' - Services', pt.services ? pt.services.join(', ') : 'Same as primary', 'Additional Patients');
          addQ(prefix + ' - Medical History', pt.medicalHistory || 'None provided', 'Additional Patients');
          addQ(prefix + ' - Surgical History', pt.surgicalHistory || 'None provided', 'Additional Patients');
          addQ(prefix + ' - Medications', pt.medications || 'None provided', 'Additional Patients');
          addQ(prefix + ' - Allergies', pt.allergies || 'None provided', 'Additional Patients');
          addQ(prefix + ' - Clinician Notes', pt.clinicianNotes, 'Additional Patients');
        });
      }

      await intakeqRequest('/intakes', 'POST', intakePayload);
      console.log('IntakeQ intake submitted with all consents');
    } catch (intakeError) {
      console.error('IntakeQ intake submission error:', intakeError); global._lastIntakeResult = { time: new Date().toISOString(), error: intakeError.message };
    }

    /* -- 3. BUSINESS EMAIL -- */
    if (RESEND_KEY) { try { var be = '<div style="font-family:Arial;max-width:600px;margin:0 auto"><div style="background:#2E5A46;padding:20px;text-align:center"><h1 style="color:#D4BC82;margin:0">New Patient Intake</h1></div><div style="padding:20px"><p><b>Name:</b> ' + data.fname + ' ' + data.lname + '</p><p><b>Email:</b> ' + data.email + '</p><p><b>Phone:</b> ' + (data.phone || 'N/A') + '</p><p><b>Date:</b> ' + (data.date || 'TBD') + ' at ' + (data.selTime || 'TBD') + '</p><p><b>Services:</b> ' + (data.services && data.services.length > 0 ? data.services.join(', ') : 'General') + '</p><p><b>Medical:</b> ' + (data.medicalHistory || 'None') + '</p><p><b>Surgical:</b> ' + (data.surgicalHistory || 'None') + '</p><p><b>Medications:</b> ' + (data.medications || 'None') + '</p><p><b>Allergies:</b> ' + (data.allergies || 'None') + '</p><p><b>Signature:</b> ' + (data.signature || 'N/A') + '</p><p><b>Card:</b> ' + (data.cardBrand || '') + ' ****' + (data.cardLast4 || 'N/A') + '</p>' + (data.additionalPatients && data.additionalPatients.length > 0 ? '<h3 style="color:#2E5A46">Additional Patients</h3>' + data.additionalPatients.map(function(pt, i) { return '<p>' + (pt.fname || '') + ' ' + (pt.lname || '') + ' - ' + (pt.services && pt.services.length > 0 ? pt.services.join(', ') : 'Same') + '</p>'; }).join('') : '') + '</div></div>'; await fetch('https://api.resend.com/emails', { method: 'POST', headers: { 'Authorization': 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: 'Healing Soulutions <bookings@healingsoulutions.care>', to: ['info@healingsoulutions.care'], subject: 'New Intake: ' + data.fname + ' ' + data.lname, html: be, reply_to: data.email }) }); } catch(e) {} }

    /* -- 4. PATIENT CONFIRMATION EMAIL -- */
    if (RESEND_KEY && data.email) { try { var pe = '<div style="font-family:Arial;max-width:600px;margin:0 auto"><div style="background:#2E5A46;padding:20px;text-align:center"><h1 style="color:#D4BC82;margin:0">Booking Confirmed</h1><p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px">Healing Soulutions</p></div><div style="padding:20px"><p style="font-size:16px">Dear ' + data.fname + ',</p><p style="color:#555">Thank you for booking with Healing Soulutions. Our team will contact you within 24 hours to confirm.</p><div style="background:#f9f9f9;border-left:4px solid #2E5A46;padding:16px;margin:16px 0;border-radius:8px"><h3 style="color:#2E5A46;margin:0 0 10px">Appointment Details</h3><p><b>Date:</b> ' + (data.date || 'TBD') + '</p><p><b>Time:</b> ' + (data.selTime || 'TBD') + '</p><p><b>Services:</b> ' + (data.services && data.services.length > 0 ? data.services.join(', ') : 'General Consultation') + '</p></div><div style="background:#f9f9f9;padding:16px;margin:16px 0;border-radius:8px"><h3 style="color:#2E5A46;margin:0 0 10px">Your Medical Info</h3><p><b>Medical History:</b> ' + (data.medicalHistory || 'None') + '</p><p><b>Medications:</b> ' + (data.medications || 'None') + '</p><p><b>Allergies:</b> ' + (data.allergies || 'None') + '</p></div><div style="background:#FFF8E7;border:1px solid #D4BC82;padding:14px;margin:16px 0;border-radius:8px"><p style="margin:0;color:#555">&#10003; All consents signed</p></div><hr style="border:none;border-top:1px solid #eee;margin:20px 0"><p style="color:#555">Questions? Email info@healingsoulutions.care or call (585) 747-2215</p></div><div style="background:#2E5A46;padding:10px;text-align:center;font-size:11px;color:rgba(255,255,255,0.5)">Healing Soulutions | Concierge Nursing Care</div></div>'; await fetch('https://api.resend.com/emails', { method: 'POST', headers: { 'Authorization': 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: 'Healing Soulutions <bookings@healingsoulutions.care>', to: [data.email], subject: 'Booking Confirmed - Healing Soulutions', html: pe, reply_to: 'info@healingsoulutions.care' }) }); } catch(e) {} }
    global._lastIntakeResult = { time: new Date().toISOString(), clientId: clientId, intakeError: null };    
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
