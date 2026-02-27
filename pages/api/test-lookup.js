/*
 * pages/api/test-lookup.js
 * Looks up the actual patient to show what's stored.
 * Visit /api/test-lookup in browser. DELETE after debugging.
 */
export default async function handler(req, res) {
  var apiKey = process.env.INTAKEQ_API_KEY;
  if (!apiKey) return res.status(200).json({ error: 'No API key' });

  // Look up the actual patient
  var email = req.query.email || 'berittran@gmail.com';

  var sRes = await fetch('https://intakeq.com/api/v1/clients?search=' + encodeURIComponent(email) + '&IncludeProfile=true', {
    method: 'GET',
    headers: { 'X-Auth-Key': apiKey },
  });
  var sBody = await sRes.text();
  var clients = [];
  try { clients = JSON.parse(sBody); } catch (e) {}

  if (!clients.length) {
    return res.status(200).json({ error: 'No client found for ' + email, rawResponse: sBody.substring(0, 500) });
  }

  var client = clients[0];

  return res.status(200).json({
    clientId: client.ClientId,
    name: client.Name,
    email: client.Email,
    phone: client.Phone,
    additionalInformation: client.AdditionalInformation || 'EMPTY',
    additionalInfoLength: (client.AdditionalInformation || '').length,
    tags: client.Tags,
    customFields: client.CustomFields,
    allFieldNames: Object.keys(client),
    hint: client.AdditionalInformation
      ? 'DATA IS HERE — In IntakeQ go to: Clients list → click this patient → scroll down or look for "Additional Information" section on the profile page'
      : 'AdditionalInformation is empty. The field may not have saved, or the search returned a cached version.',
  });
}
