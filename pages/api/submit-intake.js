const INTAKEQ_API_BASE = 'https://intakeq.com/api/v1';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ lastResult: global._lastResult || 'no results yet' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.INTAKEQ_API_KEY;
  const data = req.body;
  let clientId = null;
  let error = null;
  let intakeqStatus = null;
  let intakeqBody = null;

  try {
    const r = await fetch(INTAKEQ_API_BASE + '/clients', {
      method: 'POST',
      headers: { 'X-Auth-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        FirstName: data.fname || 'Unknown',
        LastName: data.lname || 'Unknown',
        Email: data.email || 'none@none.com',
        Phone: data.phone || '',
        Notes: 'Booking test',
      }),
    });
    intakeqStatus = r.status;
    intakeqBody = await r.text();
    if (r.ok) {
      const parsed = JSON.parse(intakeqBody);
      clientId = parsed.ClientId || parsed.Id;
    } else {
      error = 'IntakeQ ' + r.status;
    }
  } catch (e) {
    error = e.message;
  }

  global._lastResult = {
    time: new Date().toISOString(),
    fname: data.fname,
    clientId: clientId,
    error: error,
    intakeqStatus: intakeqStatus,
    intakeqBody: intakeqBody ? intakeqBody.substring(0, 300) : null,
  };

  return res.status(200).json({ success: true, clientId: clientId, error: error });
}
