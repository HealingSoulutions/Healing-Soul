/*
 * pages/api/test-questions.js
 * Gets full question structure. Visit /api/test-questions
 * DELETE after debugging.
 */
export default async function handler(req, res) {
  var apiKey = process.env.INTAKEQ_API_KEY;
  var questionnaireId = '69a277ecc252c3dd4d1aa452';

  // Send to a test client to get the form structure
  var testEmail = 'qs-' + Date.now() + '@test.healingsoulutions.care';
  var cRes = await fetch('https://intakeq.com/api/v1/clients', {
    method: 'POST',
    headers: { 'X-Auth-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ FirstName: 'QTest', LastName: 'Map', Email: testEmail }),
  });
  var cData = {};
  try { cData = JSON.parse(await cRes.text()); } catch (e) {}

  var sendRes = await fetch('https://intakeq.com/api/v1/intakes/send', {
    method: 'POST',
    headers: { 'X-Auth-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ QuestionnaireId: questionnaireId, ClientId: cData.ClientId }),
  });
  var sendData = {};
  try { sendData = JSON.parse(await sendRes.text()); } catch (e) {}

  // Extract just the question mapping we need
  var questions = (sendData.Questions || []).map(function (q) {
    var info = { id: q.Id, text: q.Text, type: q.QuestionType, subType: q.QuestionSubType || null };
    if (q.OfferedAnswers && q.OfferedAnswers.length) info.options = q.OfferedAnswers;
    if (q.Rows && q.Rows.length) info.rows = q.Rows;
    return info;
  });

  return res.status(200).json({
    intakeId: sendData.Id,
    clientId: cData.ClientId,
    totalQuestions: questions.length,
    questions: questions,
    consentForms: sendData.ConsentForms || [],
  });
}
