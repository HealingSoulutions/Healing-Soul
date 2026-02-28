import https from 'https';

function iq(path, method, body) {
  return new Promise(function(resolve) {
    var opts = {
      hostname: 'intakeq.com',
      path: '/api/v1' + path,
      method: method || 'GET',
      headers: { 'X-Auth-Key': process.env.INTAKEQ_API_KEY, 'Content-Type': 'application/json' }
    };
    var req = https.request(opts, function(resp) {
      var data = '';
      resp.on('data', function(chunk) { data += chunk; });
      resp.on('end', function() {
        var json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({ s: resp.statusCode, ok: resp.statusCode >= 200 && resp.statusCode < 300, d: json || data });
      });
    });
    req.on('error', function(e) { resolve({ s: 0, ok: false, d: e.message }); });
    if (body) { req.write(JSON.stringify(body)); }
    req.end();
  });
}

export default async function handler(req, res) {
  try {
    var PRAC = '699328a73f048c95babc42b6';
    var QID = '69a277ecc252c3dd4d1aa452';
    var out = {};
    var uid = Date.now();
    var em = 'diag-' + uid + '@healingsoulutions.care';

    var c = await iq('/clients', 'POST', { FirstName: 'DiagTest', LastName: 'Run' + uid, Email: em, PractitionerId: PRAC });
    var cid = c.ok ? (c.d.ClientId || c.d.Id) : null;
    out.client = { status: c.s, id: cid, email: em };

    if (cid) {
      var i = await iq('/intakes/send', 'POST', {
        QuestionnaireId: QID,
        PractitionerId: PRAC,
        ClientId: cid,
        ClientEmail: em,
        ClientName: 'DiagTest Run' + uid,
        Questions: [
          { Id: 'kj1o-1', Text: 'First name', Answer: 'DiagTest', QuestionType: 'OpenQuestion' },
          { Id: 'oj9c-1', Text: 'Last name', Answer: 'Run' + uid, QuestionType: 'OpenQuestion' },
          { Id: '9r2z-1', Text: 'Date of birth', Answer: '06/20/1985', QuestionType: 'OpenQuestion' },
          { Id: '9lt7-1', Text: 'Email', Answer: em, QuestionType: 'OpenQuestion' },
          { Id: '8mqt-1', Text: 'Phone', Answer: '+1 585 747 2215', QuestionType: 'OpenQuestion' },
          { Id: 'jhym-1', Text: 'Address line 1', Answer: '456 Test Ave', QuestionType: 'OpenQuestion' },
          { Id: 'wt5a-1', Text: 'Address line 2', Answer: '', QuestionType: 'OpenQuestion' },
          { Id: '9uoi-1', Text: 'State', Answer: 'NY', QuestionType: 'OpenQuestion' },
          { Id: 'lp5z-1', Text: 'Zipcode', Answer: '14620', QuestionType: 'OpenQuestion' },
          { Id: 'jo66-1', Text: 'Medical/surgical history', Answer: 'TEST: Appendectomy 2010', QuestionType: 'OpenQuestion' },
          { Id: 'gkmh-1', Text: 'Current medication/supplements', Answer: 'TEST: Lisinopril 10mg', QuestionType: 'OpenQuestion' },
          { Id: 'elrp-1', Text: 'Allergies', Answer: 'TEST: Penicillin', QuestionType: 'OpenQuestion' },
          { Id: 'abjd-1', Text: 'Previous reaction to IV therapy?', Answer: 'TEST: None', QuestionType: 'OpenQuestion' },
          { Id: 'andp-1', Text: 'Additional notes for clinician', Answer: 'DIAGNOSTIC - ignore', QuestionType: 'OpenQuestion' },
          { Id: 'uvgy-1', Text: 'Additional notes', Answer: 'TEST booking', QuestionType: 'OpenQuestion' },
          { Id: 'knxl-1', Text: 'Appt', Answer: 'Feb 28 2026 3PM IV Hydration', QuestionType: 'OpenQuestion' },
          { Id: 't06w-1', Text: 'Consents', Answer: 'All 4 consents AGREED', QuestionType: 'OpenQuestion' },
          { Id: 'ns11-1', Text: 'Sigs', Answer: 'Typed sig: DiagTest | Visa 4242', QuestionType: 'OpenQuestion' }
        ]
      });

      var iid = i.d && i.d.Id ? i.d.Id : null;
      var qs = i.d && i.d.Questions ? i.d.Questions : [];
      var filled = 0;
      var ansArr = [];
      for (var x = 0; x < qs.length; x++) {
        if (qs[x].Answer) { filled++; }
        ansArr.push({ id: qs[x].Id, ans: qs[x].Answer });
      }
      out.intake = { status: i.s, ok: i.ok, id: iid, intakeStatus: i.d ? i.d.Status : null, url: i.d ? i.d.Url : null, filled: filled, total: qs.length, answers: ansArr };

      if (iid) {
        var rb = await iq('/intakes/' + iid);
        var q3 = rb.d && rb.d.Questions ? rb.d.Questions : [];
        var f3 = 0;
        var a3 = [];
        for (var y = 0; y < q3.length; y++) {
          if (q3[y].Answer) { f3++; }
          a3.push({ id: q3[y].Id, ans: q3[y].Answer });
        }
        out.readback = { status: rb.s, intakeStatus: rb.d ? rb.d.Status : null, filled: f3, total: q3.length, answers: a3 };

        var mc = await iq('/intakes/' + iid, 'POST', { Id: iid, Status: 'Completed' });
        out.markComplete = { status: mc.s, ok: mc.ok, response: mc.d };
      }
    }

    out.SUMMARY = { clientId: cid, intakeId: out.intake ? out.intake.id : 'NONE', answersSent: out.intake ? out.intake.filled : 0, answersReadBack: out.readback ? out.readback.filled : 'N/A', completeStatus: out.markComplete ? out.markComplete.status : 'N/A' };
    return res.status(200).json(out);
  } catch (err) {
    return res.status(200).json({ CRASHED: true, error: err.message, stack: err.stack });
  }
}
