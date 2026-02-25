export default async function handler(req, res) {
  var apiKey = process.env.INTAKEQ_API_KEY;

  var longNotes = '=== HEALING SOULUTIONS - PATIENT INTAKE ===\n'
    + 'Submitted: ' + new Date().toISOString() + '\n\n'
    + '--- PATIENT INFORMATION ---\n'
    + 'Name: LongNotes Test\n'
    + 'Email: longtest@test.com\n\n'
    + '--- CONSENTS ---\n'
    + 'Treatment Consent: AGREED\n'
    + 'HIPAA Privacy: AGREED\n'
    + 'Signature: LongNotes Test\n';

  try {
    var createRes = await fetch('https://intakeq.com/api/v1/clients', {
      method: 'POST',
      headers: { 'X-Auth-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        FirstName: 'LongNotes',
        LastName: 'Test',
        Email: 'longtest@test.com',
        Phone: '5551234567',
        Tags: ['Website Booking', 'Online Intake'],
        Notes: longNotes,
      }),
    });
    var createText = await createRes.text();

    return res.status(200).json({
      status: createRes.status,
      ok: createRes.ok,
      body: createText.substring(0, 300),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
