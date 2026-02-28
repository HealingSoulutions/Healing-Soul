
// test-intakeq.js — Deploy to: pages/api/test-intakeq.js
// Comprehensive IntakeQ diagnostic — tests EVERY approach to submitting full intake data
// Visit: https://healingsoulutions.care/api/test-intakeq

export default async function handler(req, res) {
  const API_KEY = process.env.INTAKEQ_API_KEY;
  const BASE = 'https://intakeq.com/api/v1';
  const PRACTITIONER_ID = '699328a73f048c95babc42b6';
  const QUESTIONNAIRE_ID = '69a277ecc252c3dd4d1aa452';

  const results = {};

  // Helper: make IntakeQ request
  async function iq(path, method = 'GET', body = null) {
    const opts = {
      method,
      headers: {
        'X-Auth-Key': API_KEY,
        'Content-Type': 'application/json',
      },
    };
    if (body) opts.body = JSON.stringify(body);
    const url = `${BASE}${path}`;
    try {
      const r = await fetch(url, opts);
      const text = await r.text();
      let json = null;
      try { json = JSON.parse(text); } catch (_) {}
      return { status: r.status, ok: r.ok, data: json || text, url };
    } catch (e) {
      return { status: 'ERROR', error: e.message, url };
    }
  }

  // ========== TEST 1: API Key Check ==========
  try {
    const r = await iq('/practitioners');
    results['1_api_key_check'] = {
      test: 'GET /practitioners — does the API key work?',
      status: r.status,
      ok: r.ok,
      practitioners: r.ok ? (Array.isArray(r.data) ? r.data.map(p => ({ id: p.Id, name: p.CompleteName || p.Name })) : r.data) : r.data,
    };
  } catch (e) {
    results['1_api_key_check'] = { error: e.message };
  }

  // ========== TEST 2: List Questionnaires ==========
  try {
    const r = await iq('/questionnaires');
    results['2_questionnaires'] = {
      test: 'GET /questionnaires — list all available forms',
      status: r.status,
      ok: r.ok,
      questionnaires: r.ok && Array.isArray(r.data)
        ? r.data.map(q => ({ id: q.Id, name: q.Name, archived: q.Archived }))
        : r.data,
    };
  } catch (e) {
    results['2_questionnaires'] = { error: e.message };
  }

  // ========== TEST 3: Get Questionnaire Fields ==========
  try {
    const r = await iq(`/questionnaires/${QUESTIONNAIRE_ID}`);
    results['3_questionnaire_fields'] = {
      test: `GET /questionnaires/${QUESTIONNAIRE_ID} — get field structure`,
      status: r.status,
      ok: r.ok,
      fields: r.ok && r.data && r.data.Questions
        ? r.data.Questions.map(q => ({
            id: q.Id,
            text: q.Text,
            type: q.QuestionType,
            required: q.Required,
            columnOrder: q.ColumnOrder,
          }))
        : r.data,
    };
  } catch (e) {
    results['3_questionnaire_fields'] = { error: e.message };
  }

  // ========== TEST 4: Create Test Client ==========
  let testClientId = null;
  try {
    // First search if test client exists
    const search = await iq('/clients?search=test-diag@healingsoulutions.care&IncludeProfile=true');
    if (search.ok && Array.isArray(search.data) && search.data.length > 0) {
      testClientId = search.data[0].ClientId || search.data[0].Id;
      results['4_create_client'] = {
        test: 'Client search — test client already exists',
        clientId: testClientId,
        existingClient: search.data[0],
      };
    } else {
      // Create new test client
      const createR = await iq('/clients', 'POST', {
        FirstName: 'Diagnostic',
        LastName: 'TestPatient',
        Email: 'test-diag@healingsoulutions.care',
        PhoneNumber: '+15857472215',
        DateOfBirth: '1990-01-15',
        Address: '123 Test Street',
        City: 'Rochester',
        State: 'NY',
        ZipCode: '14620',
        Country: 'US',
        PractitionerId: PRACTITIONER_ID,
      });
      testClientId = createR.ok ? (createR.data?.ClientId || createR.data?.Id || createR.data) : null;
      results['4_create_client'] = {
        test: 'POST /clients — create test client',
        status: createR.status,
        ok: createR.ok,
        clientId: testClientId,
        fullResponse: createR.data,
      };
    }
  } catch (e) {
    results['4_create_client'] = { error: e.message };
  }

  // ========== TEST 5: POST /intakes/send (questionnaire link) ==========
  try {
    const payload = {
      QuestionnaireId: QUESTIONNAIRE_ID,
      PractitionerId: PRACTITIONER_ID,
      ClientId: testClientId,
      ClientEmail: 'test-diag@healingsoulutions.care',
      ClientName: 'Diagnostic TestPatient',
    };
    const r = await iq('/intakes/send', 'POST', payload);
    results['5_intakes_send'] = {
      test: 'POST /intakes/send — sends questionnaire link to client',
      status: r.status,
      ok: r.ok,
      note: 'This sends an EMAIL with a link — does NOT submit completed data',
      payload,
      response: r.data,
    };
  } catch (e) {
    results['5_intakes_send'] = { error: e.message };
  }

  // ========== TEST 6: POST /intakes (submit completed intake) ==========
  const fullQuestions = [
    { Id: 'kj1o-1', Text: 'First Name', Answer: 'Diagnostic', QuestionType: 'OpenQuestion' },
    { Id: 'oj9c-1', Text: 'Last Name', Answer: 'TestPatient', QuestionType: 'OpenQuestion' },
    { Id: '9r2z-1', Text: 'Date of Birth', Answer: '01/15/1990', QuestionType: 'OpenQuestion' },
    { Id: '9lt7-1', Text: 'Email', Answer: 'test-diag@healingsoulutions.care', QuestionType: 'OpenQuestion' },
    { Id: '8mqt-1', Text: 'Phone', Answer: '+1 (585) 747-2215', QuestionType: 'OpenQuestion' },
    { Id: 'jhym-1', Text: 'Address Line 1', Answer: '123 Test Street', QuestionType: 'OpenQuestion' },
    { Id: 'wt5a-1', Text: 'Address Line 2', Answer: 'Suite 100', QuestionType: 'OpenQuestion' },
    { Id: '9uoi-1', Text: 'State', Answer: 'NY', QuestionType: 'OpenQuestion' },
    { Id: 'lp5z-1', Text: 'Zip Code', Answer: '14620', QuestionType: 'OpenQuestion' },
    { Id: 'jo66-1', Text: 'Medical/Surgical History', Answer: 'Test: No significant history', QuestionType: 'OpenQuestion' },
    { Id: 'gkmh-1', Text: 'Current Medications', Answer: 'Test: None', QuestionType: 'OpenQuestion' },
    { Id: 'elrp-1', Text: 'Allergies', Answer: 'Test: NKDA', QuestionType: 'OpenQuestion' },
    { Id: 'abjd-1', Text: 'IV Reaction History', Answer: 'Test: None', QuestionType: 'OpenQuestion' },
    { Id: 'andp-1', Text: 'Notes for Clinician', Answer: 'DIAGNOSTIC TEST — please ignore', QuestionType: 'OpenQuestion' },
    { Id: 'knxl-1', Text: 'Appointment Details', Answer: 'Test booking: Feb 28, 2026 at 2:00 PM — IV Hydration', QuestionType: 'OpenQuestion' },
    { Id: 't06w-1', Text: 'Consent Status', Answer: 'Treatment Consent: AGREED (Feb 28, 2026 2:00 PM)\nHIPAA Consent: AGREED (Feb 28, 2026 2:00 PM)\nMedical History Consent: AGREED (Feb 28, 2026 2:00 PM)\nFinancial Consent: AGREED (Feb 28, 2026 2:00 PM)', QuestionType: 'OpenQuestion' },
    { Id: 'ns11-1', Text: 'Signatures & Payment', Answer: 'Consent Signature: "Diagnostic TestPatient" (typed)\nIntake Signature: "Diagnostic TestPatient" (typed)\nPayment: Visa ending 4242', QuestionType: 'OpenQuestion' },
  ];

  try {
    const payload = {
      QuestionnaireId: QUESTIONNAIRE_ID,
      PractitionerId: PRACTITIONER_ID,
      ClientId: testClientId,
      Questions: fullQuestions,
    };
    const r = await iq('/intakes', 'POST', payload);
    results['6_intakes_post'] = {
      test: 'POST /intakes — submit completed intake directly',
      status: r.status,
      ok: r.ok,
      payload_summary: `${fullQuestions.length} questions, clientId: ${testClientId}`,
      response: r.data,
    };
  } catch (e) {
    results['6_intakes_post'] = { error: e.message };
  }

  // ========== TEST 7: POST /intakes with Answers array format ==========
  try {
    const payload = {
      QuestionnaireId: QUESTIONNAIRE_ID,
      PractitionerId: PRACTITIONER_ID,
      ClientId: testClientId,
      Answers: fullQuestions.map(q => ({
        QuestionId: q.Id,
        Answer: q.Answer,
      })),
    };
    const r = await iq('/intakes', 'POST', payload);
    results['7_intakes_answers_format'] = {
      test: 'POST /intakes — alternate Answers[] format',
      status: r.status,
      ok: r.ok,
      response: r.data,
    };
  } catch (e) {
    results['7_intakes_answers_format'] = { error: e.message };
  }

  // ========== TEST 8: POST /intakes/send WITH Questions (hybrid) ==========
  try {
    const payload = {
      QuestionnaireId: QUESTIONNAIRE_ID,
      PractitionerId: PRACTITIONER_ID,
      ClientId: testClientId,
      ClientEmail: 'test-diag@healingsoulutions.care',
      Questions: fullQuestions,
    };
    const r = await iq('/intakes/send', 'POST', payload);
    results['8_intakes_send_with_questions'] = {
      test: 'POST /intakes/send WITH Questions[] — hybrid approach',
      status: r.status,
      ok: r.ok,
      response: r.data,
    };
  } catch (e) {
    results['8_intakes_send_with_questions'] = { error: e.message };
  }

  // ========== TEST 9: POST /intake (singular, no 's') ==========
  try {
    const payload = {
      QuestionnaireId: QUESTIONNAIRE_ID,
      PractitionerId: PRACTITIONER_ID,
      ClientId: testClientId,
      Questions: fullQuestions,
    };
    const r = await iq('/intake', 'POST', payload);
    results['9_intake_singular'] = {
      test: 'POST /intake (singular) — alternate endpoint name',
      status: r.status,
      ok: r.ok,
      response: r.data,
    };
  } catch (e) {
    results['9_intake_singular'] = { error: e.message };
  }

  // ========== TEST 10: POST /questionnaires/{id}/responses ==========
  try {
    const payload = {
      PractitionerId: PRACTITIONER_ID,
      ClientId: testClientId,
      Questions: fullQuestions,
    };
    const r = await iq(`/questionnaires/${QUESTIONNAIRE_ID}/responses`, 'POST', payload);
    results['10_questionnaire_responses'] = {
      test: `POST /questionnaires/${QUESTIONNAIRE_ID}/responses — submit as response`,
      status: r.status,
      ok: r.ok,
      response: r.data,
    };
  } catch (e) {
    results['10_questionnaire_responses'] = { error: e.message };
  }

  // ========== TEST 11: List Recent Intakes ==========
  try {
    const r = await iq('/intakes?page=1&client=test-diag@healingsoulutions.care');
    const rAll = await iq('/intakes?page=1');
    results['11_list_intakes'] = {
      test: 'GET /intakes — check if any intakes came through',
      filtered: { status: r.status, ok: r.ok, count: Array.isArray(r.data) ? r.data.length : 'N/A', data: r.data },
      all_recent: {
        status: rAll.status,
        ok: rAll.ok,
        count: Array.isArray(rAll.data) ? rAll.data.length : 'N/A',
        first_5: Array.isArray(rAll.data)
          ? rAll.data.slice(0, 5).map(i => ({
              id: i.Id,
              client: i.ClientName,
              questionnaire: i.QuestionnaireName,
              date: i.DateCreated || i.CompletedDate,
              status: i.Status,
            }))
          : rAll.data,
      },
    };
  } catch (e) {
    results['11_list_intakes'] = { error: e.message };
  }

  // ========== TEST 12: File Upload Test (tiny test image) ==========
  if (testClientId) {
    try {
      // Create a minimal 1x1 PNG for testing
      const tinyPNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const boundary = '----DiagBoundary' + Date.now();
      const body =
        `------DiagBoundary${Date.now()}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="DIAGNOSTIC_TEST_Signature.png"\r\n` +
        `Content-Type: image/png\r\n\r\n` +
        atob(tinyPNG) +
        `\r\n------DiagBoundary${Date.now()}--\r\n`;

      const r = await fetch(`${BASE}/files/${testClientId}`, {
        method: 'POST',
        headers: {
          'X-Auth-Key': API_KEY,
          'Content-Type': `multipart/form-data; boundary=----DiagBoundary${Date.now()}`,
        },
        body,
      });
      const text = await r.text();
      let json = null;
      try { json = JSON.parse(text); } catch (_) {}
      results['12_file_upload'] = {
        test: `POST /files/${testClientId} — upload test signature image`,
        status: r.status,
        ok: r.ok,
        response: json || text,
      };
    } catch (e) {
      results['12_file_upload'] = { error: e.message };
    }
  } else {
    results['12_file_upload'] = { skipped: true, reason: 'No clientId from test 4' };
  }

  // ========== TEST 13: List Client Files ==========
  if (testClientId) {
    try {
      const r = await iq(`/files/${testClientId}`);
      results['13_client_files'] = {
        test: `GET /files/${testClientId} — check uploaded files`,
        status: r.status,
        ok: r.ok,
        response: r.data,
      };
    } catch (e) {
      results['13_client_files'] = { error: e.message };
    }
  }

  // ========== SUMMARY ==========
  results['SUMMARY'] = {
    api_key_works: results['1_api_key_check']?.ok || false,
    client_created: !!testClientId,
    clientId: testClientId,
    intakes_send_status: results['5_intakes_send']?.status,
    intakes_post_status: results['6_intakes_post']?.status,
    intakes_answers_status: results['7_intakes_answers_format']?.status,
    intakes_send_hybrid_status: results['8_intakes_send_with_questions']?.status,
    intake_singular_status: results['9_intake_singular']?.status,
    questionnaire_responses_status: results['10_questionnaire_responses']?.status,
    file_upload_status: results['12_file_upload']?.status || 'skipped',
    instructions: 'PASTE THIS ENTIRE PAGE back to Claude. The status codes tell us which endpoint works.',
  };

  res.status(200).json(results);
}
