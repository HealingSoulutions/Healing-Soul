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

/* ═══════════════════════════════════════
   EMAIL NOTIFICATION TO info@healingsoulutions.care
   ═══════════════════════════════════════ */

function buildEmailHtml(data) {
  const consentStatus = data.consents || {};
  const consentCheck = function (val) { return val ? '✅ Agreed' : '❌ Not Agreed'; };

  let additionalPatientsHtml = '';
  if (data.additionalPatients && data.additionalPatients.length > 0) {
    additionalPatientsHtml = '<h3 style="color:#2E5A46;border-bottom:2px solid #D4BC82;padding-bottom:6px;margin-top:24px;">Additional Patients</h3>';
    data.additionalPatients.forEach(function(pt, idx) {
      const ptName = ((pt.fname || '') + ' ' + (pt.lname || '')).trim() || 'Patient ' + (idx + 2);
      const ptServices = pt.services && pt.services.length > 0 ? pt.services.join(', ') : 'Same as primary';
      additionalPatientsHtml += `
        <div style="background:#f0f7f3;border-radius:8px;padding:12px;margin:8px 0;">
          <strong style="color:#2E5A46;">Patient ${idx + 2}: ${ptName}</strong><br/>
          <span style="color:#555;">Services:</span> ${ptServices}<br/>
          ${pt.medicalHistory ? '<span style="color:#555;">Medical History:</span> ' + pt.medicalHistory + '<br/>' : ''}
          ${pt.surgicalHistory ? '<span style="color:#555;">Surgical History:</span> ' + pt.surgicalHistory + '<br/>' : ''}
          ${pt.medications ? '<span style="color:#555;">Medications:</span> ' + pt.medications + '<br/>' : ''}
          ${pt.allergies ? '<span style="color:#555;">Allergies:</span> ' + pt.allergies + '<br/>' : ''}
          ${pt.clinicianNotes ? '<span style="color:#555;">Clinician Notes:</span> ' + pt.clinicianNotes + '<br/>' : ''}
        </div>`;
    });
  }

  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden;">
      <div style="background:#2E5A46;padding:20px 24px;text-align:center;">
        <h1 style="color:#D4BC82;margin:0;font-size:22px;">🌿 New Patient Intake</h1>
        <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px;">Healing Soulutions — Secure Booking Notification</p>
      </div>
      <div style="padding:24px;">
        <h3 style="color:#2E5A46;border-bottom:2px solid #D4BC82;padding-bottom:6px;">Patient Information</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:6px 8px;color:#777;width:160px;">Name</td><td style="padding:6px 8px;font-weight:600;">${data.fname || ''} ${data.lname || ''}</td></tr>
          <tr style="background:#f9f9f9;"><td style="padding:6px 8px;color:#777;">Email</td><td style="padding:6px 8px;">${data.email || 'N/A'}</td></tr>
          <tr><td style="padding:6px 8px;color:#777;">Phone</td><td style="padding:6px 8px;">${data.phone || 'N/A'}</td></tr>
          <tr style="background:#f9f9f9;"><td style="padding:6px 8px;color:#777;">Address</td><td style="padding:6px 8px;">${data.address || 'N/A'}</td></tr>
        </table>

        <h3 style="color:#2E5A46;border-bottom:2px solid #D4BC82;padding-bottom:6px;margin-top:24px;">Appointment Details</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:6px 8px;color:#777;width:160px;">Preferred Date</td><td style="padding:6px 8px;font-weight:600;">${data.date || 'Not specified'}</td></tr>
          <tr style="background:#f9f9f9;"><td style="padding:6px 8px;color:#777;">Preferred Time</td><td style="padding:6px 8px;">${data.selTime || 'Not specified'}</td></tr>
          <tr><td style="padding:6px 8px;color:#777;">Services</td><td style="padding:6px 8px;">${data.services && data.services.length > 0 ? data.services.join(', ') : 'General Consultation'}</td></tr>
          ${data.notes ? '<tr style="background:#f9f9f9;"><td style="padding:6px 8px;color:#777;">Patient Notes</td><td style="padding:6px 8px;">' + data.notes + '</td></tr>' : ''}
        </table>

        <h3 style="color:#2E5A46;border-bottom:2px solid #D4BC82;padding-bottom:6px;margin-top:24px;">Medical Information</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:6px 8px;color:#777;width:160px;">Medical History</td><td style="padding:6px 8px;">${data.medicalHistory || 'None provided'}</td></tr>
          <tr style="background:#f9f9f9;"><td style="padding:6px 8px;color:#777;">Surgical History</td><td style="padding:6px 8px;">${data.surgicalHistory || 'None provided'}</td></tr>
          <tr><td style="padding:6px 8px;color:#777;">Medications</td><td style="padding:6px 8px;">${data.medications || 'None provided'}</td></tr>
          <tr style="background:#f9f9f9;"><td style="padding:6px 8px;color:#777;">Allergies</td><td style="padding:6px 8px;">${data.allergies || 'None provided'}</td></tr>
          ${data.clinicianNotes ? '<tr><td style="padding:6px 8px;color:#777;">Clinician Notes</td><td style="padding:6px 8px;">' + data.clinicianNotes + '</td></tr>' : ''}
        </table>

        <h3 style="color:#2E5A46;border-bottom:2px solid #D4BC82;padding-bottom:6px;margin-top:24px;">Consent Status</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:6px 8px;color:#777;width:160px;">Treatment Consent</td><td style="padding:6px 8px;">${consentCheck(consentStatus.treatment)}</td></tr>
          <tr style="background:#f9f9f9;"><td style="padding:6px 8px;color:#777;">HIPAA Privacy</td><td style="padding:6px 8px;">${consentCheck(consentStatus.hipaa)}</td></tr>
          <tr><td style="padding:6px 8px;color:#777;">Medical Release</td><td style="padding:6px 8px;">${consentCheck(consentStatus.medical)}</td></tr>
          <tr style="background:#f9f9f9;"><td style="padding:6px 8px;color:#777;">Financial Agreement</td><td style="padding:6px 8px;">${consentCheck(consentStatus.financial)}</td></tr>
          <tr><td style="padding:6px 8px;color:#777;">E-Signature</td><td style="padding:6px 8px;">${data.signature ? '✅ Provided' : '❌ Not Provided'}</td></tr>
          <tr style="background:#f9f9f9;"><td style="padding:6px 8px;color:#777;">Intake Acknowledged</td><td style="padding:6px 8px;">${data.intakeAcknowledged ? '✅ Yes' : '❌ No'}</td></tr>
        </table>

        <h3 style="color:#2E5A46;border-bottom:2px solid #D4BC82;padding-bottom:6px;margin-top:24px;">Payment Verification</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:6px 8px;color:#777;width:160px;">Card Brand</td><td style="padding:6px 8px;">${data.cardBrand || 'N/A'}</td></tr>
          <tr style="background:#f9f9f9;"><td style="padding:6px 8px;color:#777;">Card Last 4</td><td style="padding:6px 8px;">${data.cardLast4 ? '****' + data.cardLast4 : 'N/A'}</td></tr>
          <tr><td style="padding:6px 8px;color:#777;">Cardholder</td><td style="padding:6px 8px;">${data.cardHolderName || 'N/A'}</td></tr>
          <tr style="background:#f9f9f9;"><td style="padding:6px 8px;color:#777;">Stripe PM ID</td><td style="padding:6px 8px;font-size:11px;color:#999;">${data.stripePaymentMethodId || 'N/A'}</td></tr>
        </table>

        ${additionalPatientsHtml}

        <div style="margin-top:24px;padding:12px;background:#FFF8E7;border:1px solid #D4BC82;border-radius:8px;text-align:center;">
          <p style="margin:0;font-size:13px;color:#2E5A46;">
            <strong>📋 Full intake also submitted to IntakeQ</strong><br/>
            <span style="font-size:11px;color:#777;">This email is a copy for your records. All data is stored on IntakeQ's HIPAA-compliant servers.</span>
          </p>
        </div>
      </div>
      <div style="background:#f5f5f5;padding:12px 24px;text-align:center;font-size:11px;color:#999;">
        Healing Soulutions — Submitted ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET
      </div>
    </div>`;
}

async function sendNotificationEmail(data) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY not configured — skipping email notification.');
    return { skipped: true };
  }

  const patientName = ((data.fname || '') + ' ' + (data.lname || '')).trim() || 'New Patient';
  const serviceList = data.services && data.services.length > 0 ? data.services.join(', ') : 'General Consultation';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + resendApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Healing Soulutions <bookings@healingsoulutions.care>',
        to: ['info@healingsoulutions.care'],
        subject: '🌿 New Intake: ' + patientName + ' — ' + (data.date || 'Date TBD'),
        html: buildEmailHtml(data),
        reply_to: data.email || undefined,
        tags: [
          { name: 'type', value: 'intake-notification' },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend email error [' + response.status + ']:', errorText);
      return { error: errorText };
    }

    const result = await response.json();
    console.log('Notification email sent:', result.id);
    return { success: true, emailId: result.id };
  } catch (emailErr) {
    console.error('Email send error:', emailErr);
    return { error: emailErr.message };
  }
}

/* ═══════════════════════════════════════
   MAIN HANDLER
   ═══════════════════════════════════════ */

module.exports = async function handler(req, res) {
  /* ── GET = Test email (visit /api/submit-intake in browser to test) ── */
  if (req.method === 'GET') {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'RESEND_API_KEY is NOT set in environment variables', found: false });
    }

    // Debug: show key info (safe — only shows first 7 chars like "re_abc..")
    const keyPreview = apiKey.substring(0, 7) + '...' + apiKey.substring(apiKey.length - 4);
    const keyLength = apiKey.length;
    const startsCorrectly = apiKey.startsWith('re_');
    const hasSpaces = apiKey !== apiKey.trim();
    const hasQuotes = apiKey.includes('"') || apiKey.includes("'");

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey.trim(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Healing Soulutions <bookings@healingsoulutions.care>',
          to: ['info@healingsoulutions.care'],
          subject: 'Test Email - Healing Soulutions',
          html: '<h1>This is a test!</h1><p>If you see this email, Resend is working correctly and your intake notifications will work.</p>',
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        return res.status(400).json({
          error: 'Resend returned an error',
          status: response.status,
          details: result,
          debug: { keyPreview, keyLength, startsCorrectly, hasSpaces, hasQuotes },
        });
      }
      return res.status(200).json({ success: true, message: 'Test email sent to info@healingsoulutions.care!', emailId: result.id });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to reach Resend', message: err.message, debug: { keyPreview, keyLength, startsCorrectly, hasSpaces, hasQuotes } });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;

    if (!data.fname || !data.lname || !data.email) {
      return res.status(400).json({ error: 'First name, last name, and email are required.' });
    }

    /* ── 1. Send to IntakeQ (HIPAA-secure) ── */
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

    /* ── 2. Send email copy to info@healingsoulutions.care ── */
    let emailResult = {};
    try {
      emailResult = await sendNotificationEmail(data);
    } catch (emailError) {
      console.error('Email notification error:', emailError);
      // Don't fail the whole request if email fails
    }

    console.log('[Booking] ' + data.fname + ' ' + data.lname + ' (' + data.email + ') - Services: ' + (data.services ? data.services.join(', ') : 'General'));

    return res.status(200).json({
      success: true,
      clientId: clientId || null,
      emailSent: emailResult.success || false,
      message: 'Intake submitted successfully to HIPAA-secure server.',
    });
  } catch (error) {
    console.error('Submit intake error:', error);
    return res.status(500).json({ error: 'Failed to submit intake. Please contact us directly.' });
  }
}
