export default async function handler(req, res) {
  var apiKey = process.env.INTAKEQ_API_KEY;
  try {
    var r = await fetch('https://intakeq.com/api/v1/clients', {
      method: 'POST',
      headers: { 'X-Auth-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        FirstName: 'NotesField',
        LastName: 'Test',
        Email: 'notesfield@test.com',
        Phone: '0000000000',
        Notes: 'NOTES FIELD TEST',
        AdditionalInformation: 'ADDITIONAL INFO TEST',
      }),
    });
    var t = await r.text();
    return res.status(200).json({ status: r.status, body: t.substring(0, 400) });
  } catch (e) {
    return res.status(200).json({ error: e.message });
  }
}
