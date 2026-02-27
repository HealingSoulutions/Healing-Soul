/*
 * pages/api/test-practice.js
 * Checks what practice/practitioner the API key belongs to
 * and lists all clients. Visit /api/test-practice in browser.
 * DELETE after debugging.
 */
export default async function handler(req, res) {
  var apiKey = process.env.INTAKEQ_API_KEY;
  if (!apiKey) return res.status(200).json({ error: 'No API key' });

  var results = {};

  // 1. Get practitioner/practice info
  try {
    var pRes = await fetch('https://intakeq.com/api/v1/practitioners', {
      method: 'GET',
      headers: { 'X-Auth-Key': apiKey },
    });
    var pBody = await pRes.text();
    results.practitioners = {
      httpStatus: pRes.status,
      data: pBody.substring(0, 1000),
    };
  } catch (e) {
    results.practitioners = { error: e.message };
  }

  // 2. List ALL clients (no search filter)
  try {
    var cRes = await fetch('https://intakeq.com/api/v1/clients?page=1', {
      method: 'GET',
      headers: { 'X-Auth-Key': apiKey },
    });
    var cBody = await cRes.text();
    var clients = [];
    try { clients = JSON.parse(cBody); } catch (e) {}
    results.allClients = {
      httpStatus: cRes.status,
      totalReturned: clients.length,
      clientList: clients.map(function (c) {
        return { id: c.ClientId, name: c.Name, email: c.Email, archived: c.Archived, practitionerId: c.PractitionerId };
      }),
    };
  } catch (e) {
    results.allClients = { error: e.message };
  }

  // 3. Direct lookup of the known patient
  try {
    var bRes = await fetch('https://intakeq.com/api/v1/clients?search=berittran%40gmail.com&IncludeProfile=true', {
      method: 'GET',
      headers: { 'X-Auth-Key': apiKey },
    });
    var bBody = await bRes.text();
    var bClients = [];
    try { bClients = JSON.parse(bBody); } catch (e) {}
    results.beritLookup = {
      found: bClients.length > 0,
      clientId: bClients[0] ? bClients[0].ClientId : null,
      practitionerId: bClients[0] ? bClients[0].PractitionerId : null,
      archived: bClients[0] ? bClients[0].Archived : null,
    };
  } catch (e) {
    results.beritLookup = { error: e.message };
  }

  results.instructions = [
    '1. Check practitioners — does the practitioner name match who you are logged in as in the dashboard?',
    '2. Check allClients — these are ALL clients the API can see. If you see them here but not in the dashboard, you may have a filter active.',
    '3. In IntakeQ dashboard: check if there is a practitioner filter or location filter at the top of the Clients list. Try selecting "All Practitioners" or "All Locations".',
    '4. Also check if there is an "Archived" filter — make sure you are viewing active clients.',
  ];

  return res.status(200).json(results);
}
