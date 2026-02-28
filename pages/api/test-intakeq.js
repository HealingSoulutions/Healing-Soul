// test-intakeq.js — Deploy to: pages/api/test-intakeq.js
// REPLACE the old test-intakeq.js with this one
// Focused test: does /intakes/send with pre-filled Questions actually save answers?

module.exports = async function handler(req, res) {
  const API_KEY = process.env.INTAKEQ_API_KEY;
  const BASE = 'https://intakeq.com/api/v1';
  const PRACTITIONER_ID = '699328a73f048c95babc42b6';
  const QUESTIONNAIRE_ID = '69a277ecc252c3dd4d1aa452';

  const results = {};

  async function iq(path, method = 'GET', body = null) {
    const opts = {
      method,
      headers: { 'X-Auth-Key': API_KEY, 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);
    try {
      const r = await fetch(`${BASE}${path}`, opts);
      const text = await r.text();
      let json = null;
      try { json = JSON.parse(text); } catch (_) {}
      return { status: r.status, ok: r.ok, data: json || text };
    } catch (e) {
      return { status: 'ERROR', error: e.message };
    }
  }

  // STEP 1: Create a FRESH test client (unique email so /intakes/send won't reject as duplicate)
  const uniqueId = Date.now();
  const testEmail = `diag-${uniqueId}@healingsoulutions.care`;
  let clientId = null;

  try {
    const r = await iq('/clients', 'POST', {
      FirstName: 'DiagTest',
      LastName: 'Prefilled',
      Email: testEmail,
      PhoneNumber: '+15857472215',
      DateOfBirth: '1985-06-20',
      Address: '456 Diagnostic Ave',
      City: 'Rochester',
      State: 'NY',
      ZipCode: '14620',
      Country: 'US',
      PractitionerId: PRACTITIONER_ID,
    });
    clientId = r.ok ? (r.data?.ClientId || r.data?.Id) : null;
    results['1_create_fresh_client'] = {
      test: 'Create unique test client',
      email: testEmail,
      clientId,
      status: r.status,
    };
  } catch (e) {
    results['1_create_fresh_client'] = { error: e.message };
  }

  // STEP 2: POST /intakes/send WITH all Questions pre-filled
  // This is the key test — does IntakeQ save the answers we send?
  if (clientId) {
    try {
      const payload = {
        QuestionnaireId: QUESTIONNAIRE_ID,
        PractitionerId: PRACTITIONER_ID,
        ClientId: clientId,
        ClientEmail: testEmail,
        ClientName: 'DiagTest Prefilled',
        Questions: [
          { Id: 'kj1o-1', Text: 'First name', Answer: 'DiagTest', QuestionType: 'OpenQuestion' },
          { Id: 'oj9c-1', Text: 'Last name', Answer: 'Prefilled', QuestionType: 'OpenQuestion' },
          { Id: '9r2z-1', Text: 'Date of birth', Answer: '06/20/1985', QuestionType: 'OpenQuestion' },
          { Id: '9lt7-1', Text: 'Email', Answer: testEmail, QuestionType: 'OpenQuestion' },
          { Id: '8mqt-1', Text: 'Phone', Answer: '+1 (585) 747-2215', QuestionType: 'OpenQuestion' },
          { Id: 'jhym-1', Text: 'Address line 1', Answer: '456 Diagnostic Ave', QuestionType: 'OpenQuestion' },
          { Id: 'wt5a-1', Text: 'Address line 2', Answer: 'Suite 200', QuestionType: 'OpenQuestion' },
          { Id: '9uoi-1', Text: 'State', Answer: 'NY', QuestionType: 'OpenQuestion' },
          { Id: 'lp5z-1', Text: 'Zipcode', Answer: '14620', QuestionType: 'OpenQuestion' },
          { Id: 'jo66-1', Text: 'Medical/surgical history', Answer: 'DIAG TEST: Appendectomy 2010, Tonsillectomy 2005', QuestionType: 'OpenQuestion' },
          { Id: 'gkmh-1', Text: 'Current medication/supplements', Answer: 'DIAG TEST: Lisinopril 10mg daily, Vitamin D 2000IU', QuestionType: 'OpenQuestion' },
          { Id: 'elrp-1', Text: 'Allergies', Answer: 'DIAG TEST: Penicillin (hives), Sulfa (rash)', QuestionType: 'OpenQuestion' },
          { Id: 'abjd-1', Text: 'Previous reaction to IV therapy?', Answer: 'DIAG TEST: None', QuestionType: 'OpenQuestion' },
          { Id: 'andp-1', Text: 'Additional notes for clinician', Answer: 'DIAG TEST: Please ignore this entry — automated diagnostic test', QuestionType: 'OpenQuestion' },
          { Id: 'uvgy-1', Text: 'Additional notes', Answer: 'DIAG TEST: Appointment Feb 28 2026 at 3:00 PM, IV Hydration', QuestionType: 'OpenQuestion' },
          { Id: 'knxl-1', Text: 'Appointment details', Answer: 'Date: Feb 28, 2026 | Time: 3:00 PM | Service: IV Hydration Therapy', QuestionType: 'OpenQuestion' },
          { Id: 't06w-1', Text: 'Consent status', Answer: 'Treatment Consent: AGREED (Feb 28, 2026 3:00 PM)\nHIPAA Consent: AGREED (Feb 28, 2026 3:00 PM)\nMedical History Consent: AGREED (Feb 28, 2026 3:00 PM)\nFinancial Consent: AGREED (Feb 28, 2026 3:00 PM)', QuestionType: 'OpenQuestion' },
          { Id: 'ns11-1', Text: 'Signatures & payment', Answer: 'Consent Signature: "DiagTest Prefilled" (typed)\nIntake Signature: "DiagTest Prefilled" (typed)\nPayment: Visa ending 4242', QuestionType: 'OpenQuestion' },
        ],
      };

      const r = await iq('/intakes/send', 'POST', payload);
      const intakeId = r.data?.Id || null;
      const intakeStatus = r.data?.Status || null;
      const questionsReturned = r.data?.Questions || [];
      const answersInResponse = questionsReturned.filter(q => q.Answer !== null && q.Answer !== '');

      results['2_intakes_send_prefilled'] = {
        test: 'POST /intakes/send with all Questions[] pre-filled',
        status: r.status,
        ok: r.ok,
        intakeId,
        intakeStatus,
        totalQuestionsReturned: questionsReturned.length,
        questionsWithAnswers: answersInResponse.length,
        answersPreview: questionsReturned.map(q => ({
          id: q.Id,
          text: q.Text,
          answer: q.Answer,
          hasAnswer: q.Answer !== null && q.Answer !== '',
        })),
        intakeUrl: r.data?.Url || null,
      };
    } catch (e) {
      results['2_intakes_send_prefilled'] = { error: e.message };
    }
  }

  // STEP 3: Try to retrieve the intake we just created
  if (results['2_intakes_send_prefilled']?.intakeId) {
    const intakeId = results['2_intakes_send_prefilled'].intakeId;

    // 3a: GET /intakes/{id}/summary
    try {
      const r = await iq(`/intakes/${intakeId}/summary`);
      results['3a_get_intake_summary'] = {
        test: `GET /intakes/${intakeId}/summary`,
        status: r.status,
        ok: r.ok,
        response: typeof r.data === 'string' ? r.data.substring(0, 200) : r.data,
      };
    } catch (e) {
      results['3a_get_intake_summary'] = { error: e.message };
    }

    // 3b: GET /intakes/{id}
    try {
      const r = await iq(`/intakes/${intakeId}`);
      const questions = r.data?.Questions || [];
      const withAnswers = questions.filter(q => q.Answer !== null && q.Answer !== '');
      results['3b_get_intake_detail'] = {
        test: `GET /intakes/${intakeId}`,
        status: r.status,
        ok: r.ok,
        intakeStatus: r.data?.Status || null,
        totalQuestions: questions.length,
        questionsWithAnswers: withAnswers.length,
        answers: questions.map(q => ({
          id: q.Id,
          text: q.Text,
          answer: q.Answer,
          hasAnswer: q.Answer !== null && q.Answer !== '',
        })),
      };
    } catch (e) {
      results['3b_get_intake_detail'] = { error: e.message };
    }
  }

  // STEP 4: Try POST /intakes/{id} to mark as completed / update answers
  if (results['2_intakes_send_prefilled']?.intakeId) {
    const intakeId = results['2_intakes_send_prefilled'].intakeId;

    try {
      const r = await iq(`/intakes/${intakeId}`, 'POST', {
        Id: intakeId,
        Status: 'Completed',
        Questions: [
          { Id: 'kj1o-1', Answer: 'DiagTest' },
          { Id: 'oj9c-1', Answer: 'Prefilled' },
          { Id: 'jo66-1', Answer: 'DIAG: Appendectomy 2010' },
        ],
      });
      results['4_post_intake_complete'] = {
        test: `POST /intakes/${intakeId} — try to mark as completed`,
        status: r.status,
        ok: r.ok,
        response: typeof r.data === 'string' ? r.data.substring(0, 300) : r.data,
      };
    } catch (e) {
      results['4_post_intake_complete'] = { error: e.message };
    }
  }

  // STEP 5: File upload test
  if (clientId) {
    try {
      const tinyPNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const boundary = '----SigBoundary' + uniqueId;
      const imgBuffer = Buffer.from(tinyPNG, 'base64');
      const body = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="Consent_Signature_DiagTest.png"\r\nContent-Type: image/png\r\n\r\n`),
        imgBuffer,
        Buffer.from(`\r\n--${boundary}--\r\n`),
      ]);

      const r = await fetch(`${BASE}/files/${clientId}`, {
        method: 'POST',
        headers: {
          'X-Auth-Key': API_KEY,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body,
      });
      const text = await r.text();
      let json = null;
      try { json = JSON.parse(text); } catch (_) {}
      results['5_file_upload'] = {
        test: `POST /files/${clientId} — signature upload`,
        status: r.status,
        ok: r.ok,
        response: json || text,
      };
    } catch (e) {
      results['5_file_upload'] = { error: e.message };
    }
  }

  // SUMMARY
  results['SUMMARY'] = {
    clientId,
    clientEmail: testEmail,
    intakeId: results['2_intakes_send_prefilled']?.intakeId || 'FAILED',
    intakeStatus: results['2_intakes_send_prefilled']?.intakeStatus || 'FAILED',
    answersInSendResponse: results['2_intakes_send_prefilled']?.questionsWithAnswers || 0,
    answersPersistedOnReRead: results['3b_get_intake_detail']?.questionsWithAnswers || 'N/A',
    canCompleteViaPost: results['4_post_intake_complete']?.status || 'N/A',
    fileUploadWorks: results['5_file_upload']?.ok || false,
    INSTRUCTIONS: 'ALSO CHECK YOUR INTAKEQ DASHBOARD: Go to Intakes tab and look for "DiagTest Prefilled". Does it show? Are the medical history fields filled in? PASTE THIS WHOLE PAGE BACK TO CLAUDE.',
  };

  res.status(200).json(results);
};
