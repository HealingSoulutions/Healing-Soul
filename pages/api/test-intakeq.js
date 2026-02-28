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
      // Test A: /intakes/send WITH Questions (what we want to work)
      var payloadA = {
        QuestionnaireId: QID,
        PractitionerId: PRAC,
        ClientId: cid,
        ClientEmail: em,
        ClientName: 'DiagTest Run' + uid,
        Questions: [
          { Id: 'kj1o-1', Text: 'First name', Answer: 'DiagTest', QuestionType: 'OpenQuestion' },
          { Id: 'oj9c-1', Text: 'Last name', Answer: 'Run' + uid, QuestionType: 'OpenQuestion' },
          { Id: 'jo66-1', Text: 'Medical/surgical history', Answer: 'TEST: Appendectomy 2010', QuestionType: 'OpenQuestion' }
        ]
      };
      var rA = await iq('/intakes/send', 'POST', payloadA);
      out.testA_send_with_questions = { status: rA.s, ok: rA.ok, fullResponse: rA.d };

      // Test B: /intakes/send WITHOUT Questions (just send the form link)
      var em2 = 'diag2-' + uid + '@healingsoulutions.care';
      var c2 = await iq('/clients', 'POST', { FirstName: 'DiagB', LastName: 'Run' + uid, Email: em2, PractitionerId: PRAC });
      var cid2 = c2.ok ? (c2.d.ClientId || c2.d.Id) : null;
      if (cid2) {
        var payloadB = {
          QuestionnaireId: QID,
          PractitionerId: PRAC,
          ClientId: cid2,
          ClientEmail: em2,
          ClientName: 'DiagB Run' + uid
        };
        var rB = await iq('/intakes/send', 'POST', payloadB);
        out.testB_send_no_questions = { status: rB.s, ok: rB.ok, hasId: !!(rB.d && rB.d.Id), intakeId: rB.d ? rB.d.Id : null, intakeStatus: rB.d ? rB.d.Status : null };

        // If B worked, try updating that intake with answers
        if (rB.ok && rB.d && rB.d.Id) {
          var intakeId = rB.d.Id;

          // Test C: POST answers to the intake
          var rC = await iq('/intakes/' + intakeId, 'POST', {
            Id: intakeId,
            Questions: [
              { Id: 'kj1o-1', Answer: 'DiagB' },
              { Id: 'oj9c-1', Answer: 'Run' + uid },
              { Id: 'jo66-1', Answer: 'TEST: Appendectomy 2010' }
            ]
          });
          out.testC_post_answers_to_intake = { status: rC.s, ok: rC.ok, fullResponse: rC.d };

          // Test D: Read it back
          var rD = await iq('/intakes/' + intakeId);
          var q4 = rD.d && rD.d.Questions ? rD.d.Questions : [];
          var filled = 0;
          var answers = [];
          for (var x = 0; x < q4.length; x++) {
            if (q4[x].Answer) { filled++; }
            answers.push({ id: q4[x].Id, text: q4[x].Text, answer: q4[x].Answer });
          }
          out.testD_readback = { status: rD.s, intakeStatus: rD.d ? rD.d.Status : null, filled: filled, total: q4.length, answers: answers };
        }
      }
    }

    out.SUMMARY = {
      sendWithQuestions: out.testA_send_with_questions ? out.testA_send_with_questions.status : 'N/A',
      sendWithoutQuestions: out.testB_send_no_questions ? out.testB_send_no_questions.status : 'N/A',
      postAnswersToIntake: out.testC_post_answers_to_intake ? out.testC_post_answers_to_intake.status : 'N/A',
      answersReadBack: out.testD_readback ? out.testD_readback.filled : 'N/A'
    };
    return res.status(200).json(out);
  } catch (err) {
    return res.status(200).json({ CRASHED: true, error: err.message, stack: err.stack });
  }
}
