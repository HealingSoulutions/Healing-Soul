/*
 * pages/api/test-visible.js
 * 
 * Tries different ways to store data that's actually VISIBLE
 * in the IntakeQ dashboard UI.
 * Visit /api/test-visible in browser. DELETE after debugging.
 */
export default async function handler(req, res) {
  var apiKey = process.env.INTAKEQ_API_KEY;
  if (!apiKey) return res.status(200).json({ error: 'No API key' });

  var results = {};
  var clientId = 4; // berit tran's known ID

  // METHOD 1: Try POST /clients/{id}/notes (client notes)
  try {
    var noteRes = await fetch('https://intakeq.com/api/v1/clients/' + clientId + '/notes', {
      method: 'POST',
      headers: { 'X-Auth-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Text: 'TEST NOTE — ' + new Date().toISOString() + '\n\nThis is a test to see if notes appear in the dashboard.\n\nMedical History: Test\nConsent: Treatment AGREED',
      }),
    });
    var noteBody = await noteRes.text();
    results.method1_clientNotes = {
      endpoint: 'POST /clients/' + clientId + '/notes',
      httpStatus: noteRes.status,
      response: noteBody.substring(0, 500),
      checkIn: 'Look for a "Notes" tab or section on the client profile',
    };
  } catch (e) {
    results.method1_clientNotes = { error: e.message };
  }

  // METHOD 2: Try POST /notes (general notes endpoint)
  try {
    var note2Res = await fetch('https://intakeq.com/api/v1/notes', {
      method: 'POST',
      headers: { 'X-Auth-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ClientId: clientId,
        Text: 'TEST NOTE v2 — ' + new Date().toISOString() + '\n\nAnother test for dashboard visibility.',
        Type: 'General',
      }),
    });
    var note2Body = await note2Res.text();
    results.method2_generalNotes = {
      endpoint: 'POST /notes',
      httpStatus: note2Res.status,
      response: note2Body.substring(0, 500),
    };
  } catch (e) {
    results.method2_generalNotes = { error: e.message };
  }

  // METHOD 3: Try POST /practiceNotes 
  try {
    var note3Res = await fetch('https://intakeq.com/api/v1/practiceNotes', {
      method: 'POST',
      headers: { 'X-Auth-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ClientId: clientId,
        Text: 'PRACTICE NOTE TEST — ' + new Date().toISOString(),
      }),
    });
    var note3Body = await note3Res.text();
    results.method3_practiceNotes = {
      endpoint: 'POST /practiceNotes',
      httpStatus: note3Res.status,
      response: note3Body.substring(0, 500),
    };
  } catch (e) {
    results.method3_practiceNotes = { error: e.message };
  }

  // METHOD 4: Try sending an intake questionnaire
  // First, list available questionnaire templates
  try {
    var formRes = await fetch('https://intakeq.com/api/v1/questionnaires', {
      method: 'GET',
      headers: { 'X-Auth-Key': apiKey },
    });
    var formBody = await formRes.text();
    results.method4_questionnaires = {
      endpoint: 'GET /questionnaires',
      httpStatus: formRes.status,
      response: formBody.substring(0, 1000),
      note: 'These are your available questionnaire templates. If you have one, we can auto-send it to patients.',
    };
  } catch (e) {
    results.method4_questionnaires = { error: e.message };
  }

  // METHOD 5: Try the intake/summary endpoint
  try {
    var sumRes = await fetch('https://intakeq.com/api/v1/intakes/summary?client=' + clientId, {
      method: 'GET',
      headers: { 'X-Auth-Key': apiKey },
    });
    var sumBody = await sumRes.text();
    results.method5_intakeSummary = {
      endpoint: 'GET /intakes/summary?client=' + clientId,
      httpStatus: sumRes.status,
      response: sumBody.substring(0, 500),
    };
  } catch (e) {
    results.method5_intakeSummary = { error: e.message };
  }

  results.instructions = 'After running this, check berit tran profile in IntakeQ for any new Notes tab, notes section, or visible data. Tell me which methods returned 200 and if anything appeared.';

  return res.status(200).json(results);
}
