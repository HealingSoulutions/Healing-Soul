export default async function handler(req, res) {
  var apiKey = process.env.INTAKEQ_API_KEY;

  try {
    var r1 = await fetch('https://intakeq.com/api/v1/clients', {
      method: 'POST',
      headers: { 'X-Auth-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ FirstName: 'NotesTest', LastName: 'Today', Email: 'notestest@test.com', Phone: '5551234567' }),
    });
    var t1 = await r1.text();
    var clientData = JSON.parse(t1);
    var clientId = clientData.ClientId || clientData.Id;

    var r2 = await fetch('https://intakeq.com/api/v1/clients', {
      method: 'PUT',
      headers: { 'X-Auth-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ClientId: clientId, Notes: 'TEST - Can you see this in IntakeQ?' }),
    });
    var t2 = await r2.text();

    return res.status(200).json({ create: { status: r1.status, body: t1.substring(0, 200) }, update: { status: r2.status, body: t2.substring(0, 200) } });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
