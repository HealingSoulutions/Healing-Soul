export default async function handler(req, res) {
  var apiKey = process.env.INTAKEQ_API_KEY;
  try {
    var r = await fetch('https://intakeq.com/api/v1/clients', {
      method: 'PUT',
      headers: { 'X-Auth-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ClientId: 12,
        FirstName: 'FieldTest',
        LastName: 'Feb26',
        Email: 'fieldtest226@test.com',
        AdditionalInformation: 'UPDATED VIA PUT TEST',
      }),
    });
    var t = await r.text();
    return res.status(200).json({ status: r.status, body: t.substring(0, 500) });
  } catch (e) {
    return res.status(200).json({ error: e.message });
  }
}
