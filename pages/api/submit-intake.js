const INTAKEQ_API_BASE = 'https://intakeq.com/api/v1';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.INTAKEQ_API_KEY;
  const data = req.body;
  const errors = [];

  let clientId = null;
  try {
    const r = await fetch(`${INTAKEQ_API_BASE}/clients`, {
      method: 'POST',
      headers: { 'X-Auth-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        FirstName: data.fname || 'Unknown',
        LastName: data.lname || 'Unknown',
        Email: data.email || 'none@none.com',
        Phone: data.phone || '',
        Notes: 'Test from booking flow',
      }),
    });
    const t = await r.text();
    if (r.ok) {
      const parsed = JSON.parse(t);
      clientId = parsed.ClientId || parsed.Id;
    } else {
      errors.push('IntakeQ error ' + r.status + ': ' + t.substring(0, 100));
    }
  } catch (e) {
    errors.push('Fetch error: ' + e.message);
  }

  return res.status(200).json({
    success: true,
    clientId: clientId,
    errors: errors,
    message: 'Done',
  });
}
