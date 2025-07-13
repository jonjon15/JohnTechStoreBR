export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Missing code parameter' });
  }

  // Vamos testar com os dados corretos da sua aplicação JohnTech
  const client_id = process.env.BLING_CLIENT_ID || '44866dbd8fe131077d73dbe3d60531016512c855';
  const client_secret = process.env.BLING_CLIENT_SECRET || '18176f2b734f4abced1893fe39a852b6f28ff53c2a564348ebfe960367d1';
  
  try {
    // Testar múltiplos endpoints e métodos
    const tests = [
      {
        name: 'Método 1: bling.com.br com Basic Auth',
        url: 'https://bling.com.br/Api/v3/oauth/token',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code
        }).toString()
      },
      {
        name: 'Método 2: www.bling.com.br com Basic Auth',
        url: 'https://www.bling.com.br/Api/v3/oauth/token',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code
        }).toString()
      },
      {
        name: 'Método 3: api.bling.com.br com Basic Auth',
        url: 'https://api.bling.com.br/Api/v3/oauth/token',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code
        }).toString()
      }
    ];

    const results = [];

    for (const test of tests) {
      try {
        console.log(`🧪 Testando: ${test.name}`);
        
        const response = await fetch(test.url, {
          method: 'POST',
          headers: test.headers,
          body: test.body
        });

        const responseText = await response.text();
        
        results.push({
          method: test.name,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          responsePreview: responseText.substring(0, 500),
          isJSON: responseText.startsWith('{') || responseText.startsWith('['),
          success: response.ok
        });

      } catch (error) {
        results.push({
          method: test.name,
          error: error.message,
          success: false
        });
      }
    }

    res.status(200).json({
      message: 'Debug completo dos endpoints Bling',
      code: code.substring(0, 10) + '...',
      timestamp: new Date().toISOString(),
      results
    });

  } catch (error) {
    res.status(500).json({
      error: 'Erro no debug',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
