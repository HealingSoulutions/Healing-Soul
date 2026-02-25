export default async function handler(req, res) {
  var apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'RESEND_API_KEY not found' });
  }

  var keyPreview = apiKey.substring(0, 7) + '...' + apiKey.substring(apiKey.length - 4);

  return res.status(200).json({
    keyFound: true,
    keyPreview: keyPreview,
    keyLength: apiKey.length,
    startsWithRe: apiKey.startsWith('re_'),
    hasSpaces: apiKey !== apiKey.trim()
  });
}
```

Commit it, wait for deploy, then visit:
```
https://healing-soul-git-main-berit-trans-projects.vercel.app/api/test-email
