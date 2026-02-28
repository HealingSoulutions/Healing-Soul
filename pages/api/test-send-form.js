/*
 * pages/api/test-send-form.js
 *
 * Sends the questionnaire to a test client, then retrieves
 * the form structure to see all question IDs.
 * Visit /api/test-send-form in browser. DELETE after debugging.
 */
export default async function handler(req, res) {
  var apiKey = process.env.INTAKEQ_API_KEY;
  if (!apiKey) return res.status(200).json({ error: 'No API key' });

  var questionnaireId = '69a277ecc252c3dd4d1aa452';
  var results = {};

  // STEP 1: Create a fresh test client to send the form to
  var testEmail = 'formtest-' + Date.now() + '@test.healingsoulutions.care';
  var cRes = await fetch('https://intakeq.com/api/v1/clients', {
    method: 'POST',
    headers: { 'X-Auth-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      FirstName: 'FormTest',
      LastName: 'Structure',
      Name: 'FormTest Structure',
      Email: testEmail,
    }),
  });
  var cBody = await cRes.text();
  var cData = {};
  try { cData = JSON.parse(cBody); } catch (e) {}
  var clientId = cData.ClientId;
  results.step1_createClient = { clientId: clientId, email: testEmail };

  // STEP 2: Send the questionnaire to this client
  if (clientId) {
    var sendRes = await fetch('https://intakeq.com/api/v1/intakes/send', {
      method: 'POST',
      headers: { 'X-Auth-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        QuestionnaireId: questionnaireId,
        ClientId: clientId,
      }),
    });
    var sendBody = await sendRes.text();
    results.step2_sendForm = {
      httpStatus: sendRes.status,
      response: sendBody.substring(0, 500),
    };
  }

  // STEP 3: Get intake summary for this client to find the intake ID
  if (clientId) {
    // Small delay to let IntakeQ process
    await new Promise(function (r) { setTimeout(r, 1500); });

    var sumRes = await fetch('https://intakeq.com/api/v1/intakes/summary?client=' + clientId, {
      method: 'GET',
      headers: { 'X-Auth-Key': apiKey },
    });
    var sumBody = await sumRes.text();
    var intakes = [];
    try { intakes = JSON.parse(sumBody); } catch (e) {}
    results.step3_intakeSummary = {
      httpStatus: sumRes.status,
      intakesFound: intakes.length,
      intakes: intakes,
    };

    // STEP 4: Get the FULL intake form to see question structure
    if (intakes.length > 0) {
      var intakeId = intakes[0].Id;
      var fullRes = await fetch('https://intakeq.com/api/v1/intakes/' + intakeId, {
        method: 'GET',
        headers: { 'X-Auth-Key': apiKey },
      });
      var fullBody = await fullRes.text();
      var fullData = {};
      try { fullData = JSON.parse(fullBody); } catch (e) {}

      // Extract question structure
      var questions = (fullData.Questions || []).map(function (q) {
        return {
          Id: q.Id,
          Text: q.Text,
          QuestionType: q.QuestionType,
          Answer: q.Answer || null,
          Rows: q.Rows || null,
          Columns: q.Columns || null,
          OfferedAnswers: q.OfferedAnswers || null,
        };
      });

      results.step4_fullIntake = {
        intakeId: intakeId,
        status: fullData.Status,
        questionnaireName: fullData.QuestionnaireName,
        totalQuestions: questions.length,
        questions: questions,
      };

      // Also check consent forms
      if (fullData.ConsentForms) {
        results.step4_consentForms = fullData.ConsentForms;
      }
    }
  }

  results.instructions = 'The questions array shows every field in your form with its ID. I will use these IDs to map your website data to the IntakeQ form fields.';

  return res.status(200).json(results);
}
