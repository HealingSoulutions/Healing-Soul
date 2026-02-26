export default async function handler(req, res) {
  const apiKey = process.env.INTAKEQ_API_KEY;
  if (!apiKey) return res.status(200).json({ error: 'NO KEY' });
  try {
    const r = await fetch('https://intakeq.com/api/v1/clients', {
      method: 'POST',
      headers: { 'X-Auth-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ FirstName: 'HealingSoul', LastName: 'ProjectTest', Email: 'hstest@test.com', Phone: '0000000000' }),
    });
    const t = await r.text();
    return res.status(200).json({ status: r.status, body: t.substring(0, 300) });
  } catch (e) {
    return res.status(200).json({ error: e.message });
  }
}
