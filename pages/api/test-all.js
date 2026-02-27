/*
 * pages/api/test-all.js
 * 
 * DEPLOY THIS FILE, then visit your-site.com/api/test-all in a browser.
 * It tests IntakeQ and Resend independently and shows you exactly what works.
 * DELETE THIS FILE after debugging.
 */
export default async function handler(req, res) {
  var results = [];
  var apiKey = process.env.INTAKEQ_API_KEY;
  var resendKey = process.env.RESEND_API_KEY;

  /* ── TEST 1: Check env vars ── */
  results.push({
    test: '1. INTAKEQ_API_KEY env var',
    pass: !!apiKey,
    detail: apiKey ? 'Set: ' + apiKey.substring(0, 4) + '***' + apiKey.slice(-4) : 'NOT SET — add to your .env or Vercel environment variables',
  });
  results.push({
    test: '2. RESEND_API_KEY env var',
    pass: !!resendKey,
    detail: resendKey ? 'Set: ' + resendKey.substring(0, 4) + '***' + resendKey.slice(-4) : 'NOT SET — add to your .env or Vercel environment variables',
  });

  /* ── TEST 3: IntakeQ search ── */
  if (apiKey) {
    try {
      var sUrl = 'https://intakeq.com/api/v1/clients?search=test&IncludeProfile=true';
      var sRes = await fetch(sUrl, { method: 'GET', headers: { 'X-Auth-Key': apiKey } });
      var sText = await sRes.text();
      results.push({
        test: '3. IntakeQ SEARCH (GET /clients?search=test&IncludeProfile=true)',
        pass: sRes.ok,
        httpStatus: sRes.status,
        responsePreview: sText.substring(0, 300),
      });
    } catch (e) {
      results.push({ test: '3. IntakeQ SEARCH', pass: false, error: e.message });
    }
  } else {
    results.push({ test: '3. IntakeQ SEARCH', pass: false, detail: 'SKIPPED — no API key' });
  }

  /* ── TEST 4: IntakeQ create client ── */
  var testClientId = null;
  if (apiKey) {
    try {
      var testEmail = 'diag-' + Date.now() + '@test.healingsoulutions.care';
      var cRes = await fetch('https://intakeq.com/api/v1/clients', {
        method: 'POST',
        headers: { 'X-Auth-Key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          FirstName: 'DiagTest',
          LastName: 'AutoCheck',
          Name: 'DiagTest AutoCheck',
          Email: testEmail,
          AdditionalInformation: 'DIAGNOSTIC TEST — ' + new Date().toISOString() + '\n\nMedical History: Test data\nConsent: Treatment AGREED\nSignature: Test typed\n\nIf you see this, IntakeQ API is working.',
        }),
      });
      var cText = await cRes.text();
      var cData = {};
      try { cData = JSON.parse(cText); } catch (e) {}
      testClientId = cData.ClientId || cData.ClientNumber || cData.Id;
      results.push({
        test: '4. IntakeQ CREATE CLIENT (POST /clients)',
        pass: cRes.ok,
        httpStatus: cRes.status,
        clientId: testClientId,
        responsePreview: cText.substring(0, 300),
      });
    } catch (e) {
      results.push({ test: '4. IntakeQ CREATE CLIENT', pass: false, error: e.message });
    }
  } else {
    results.push({ test: '4. IntakeQ CREATE CLIENT', pass: false, detail: 'SKIPPED — no API key' });
  }

  /* ── TEST 5: IntakeQ update client (PUT - same as test-email.js) ── */
  if (apiKey && testClientId) {
    try {
      var uRes = await fetch('https://intakeq.com/api/v1/clients', {
        method: 'PUT',
        headers: { 'X-Auth-Key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ClientId: testClientId,
          FirstName: 'DiagTest',
          LastName: 'AutoCheck',
          AdditionalInformation: 'DIAGNOSTIC TEST — ' + new Date().toISOString() + '\n\nUPDATED via PUT — this proves updates work.\nMedical History: Updated\nAll Consents: AGREED',
        }),
      });
      var uText = await uRes.text();
      results.push({
        test: '5. IntakeQ UPDATE CLIENT (PUT /clients — same as test-email.js)',
        pass: uRes.ok,
        httpStatus: uRes.status,
        responsePreview: uText.substring(0, 300),
      });
    } catch (e) {
      results.push({ test: '5. IntakeQ UPDATE CLIENT', pass: false, error: e.message });
    }
  } else {
    results.push({ test: '5. IntakeQ UPDATE CLIENT', pass: false, detail: 'SKIPPED — no client ID from step 4' });
  }

  /* ── TEST 6: Resend business email ── */
  if (resendKey) {
    try {
      var beRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + resendKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Healing Soulutions <bookings@healingsoulutions.care>',
          to: ['info@healingsoulutions.care'],
          subject: 'DIAGNOSTIC TEST — Business Email ' + new Date().toLocaleString(),
          html: '<h1>Business Email Test</h1><p>If you see this email, the business notification is working.</p><p>Time: ' + new Date().toISOString() + '</p>',
        }),
      });
      var beText = await beRes.text();
      results.push({
        test: '6. Resend BUSINESS EMAIL (to info@healingsoulutions.care)',
        pass: beRes.ok,
        httpStatus: beRes.status,
        responsePreview: beText.substring(0, 300),
        note: beRes.ok ? 'Check info@healingsoulutions.care inbox' : 'FAILED — check Resend dashboard for domain verification',
      });
    } catch (e) {
      results.push({ test: '6. Resend BUSINESS EMAIL', pass: false, error: e.message });
    }
  } else {
    results.push({ test: '6. Resend BUSINESS EMAIL', pass: false, detail: 'SKIPPED — no Resend API key' });
  }

  /* ── TEST 7: Resend patient email (to your own email for testing) ── */
  if (resendKey) {
    try {
      var peRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + resendKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Healing Soulutions <bookings@healingsoulutions.care>',
          to: ['info@healingsoulutions.care'],
          subject: 'DIAGNOSTIC TEST — Patient Email ' + new Date().toLocaleString(),
          html: '<h1>Patient Email Test</h1><p>If you see this, the patient confirmation email is working.</p><p>This would normally go to the patient email address.</p><p>Time: ' + new Date().toISOString() + '</p>',
        }),
      });
      var peText = await peRes.text();
      results.push({
        test: '7. Resend PATIENT EMAIL (test to info@healingsoulutions.care)',
        pass: peRes.ok,
        httpStatus: peRes.status,
        responsePreview: peText.substring(0, 300),
      });
    } catch (e) {
      results.push({ test: '7. Resend PATIENT EMAIL', pass: false, error: e.message });
    }
  } else {
    results.push({ test: '7. Resend PATIENT EMAIL', pass: false, detail: 'SKIPPED — no Resend API key' });
  }

  /* ── SUMMARY ── */
  var allPassed = results.every(function (r) { return r.pass; });
  return res.status(200).json({
    summary: allPassed ? 'ALL 7 TESTS PASSED' : 'SOME TESTS FAILED — see details below',
    timestamp: new Date().toISOString(),
    results: results,
    instructions: 'Share the full JSON output of this page so we can see exactly what works and what does not.',
  });
}
