// Teste alternativo para token Bling - múltiplas abordagens
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { code } = req.query;
  const requestId = `test_${Date.now()}`;

  if (!code) {
    return res.status(400).json({ 
      error: 'Missing code parameter',
      requestId
    });
  }

  const client_id = process.env.BLING_CLIENT_ID || '44866dbd8fe131077d73dbe3d60531016512c855';
  const client_secret = process.env.BLING_CLIENT_SECRET || '18176f2b734f4abced1893fe39a852b6f28ff53c2a564348ebfe960367d1';
  const redirect_uri = `https://${req.headers.host}/callback.html`;

  console.log(`🧪 [${requestId}] Testing multiple approaches for Bling token`);

  // Método 1: Basic Auth no header (conforme documentação)
  console.log(`🧪 [${requestId}] Tentativa 1: Basic Auth no header`);
  
  try {
    const credentials = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
    
    const tokenData1 = new URLSearchParams({
      grant_type: 'authorization_code',
      code
    });

    const response1 = await fetch('https://bling.com.br/Api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: tokenData1.toString(),
    });

    const text1 = await response1.text();
    console.log(`🧪 [${requestId}] Método 1 - Status: ${response1.status}, Response: ${text1.substring(0, 100)}`);

    if (response1.ok) {
      const data = JSON.parse(text1);
      return res.status(200).json({
        success: true,
        method: 'Basic Auth Header',
        data: {
          ...data,
          created_at: Date.now()
        }
      });
    }

  } catch (error) {
    console.log(`🧪 [${requestId}] Método 1 falhou: ${error.message}`);
  }

  // Método 2: Credenciais no body
  console.log(`🧪 [${requestId}] Tentativa 2: Credenciais no body`);
  
  try {
    const tokenData2 = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id,
      client_secret,
      code
    });

    const response2 = await fetch('https://bling.com.br/Api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: tokenData2.toString(),
    });

    const text2 = await response2.text();
    console.log(`🧪 [${requestId}] Método 2 - Status: ${response2.status}, Response: ${text2.substring(0, 100)}`);

    if (response2.ok) {
      const data = JSON.parse(text2);
      return res.status(200).json({
        success: true,
        method: 'Credentials in Body',
        data: {
          ...data,
          created_at: Date.now()
        }
      });
    }

  } catch (error) {
    console.log(`🧪 [${requestId}] Método 2 falhou: ${error.message}`);
  }

  // Método 3: Com redirect_uri no body
  console.log(`🧪 [${requestId}] Tentativa 3: Com redirect_uri`);
  
  try {
    const credentials = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
    
    const tokenData3 = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri
    });

    const response3 = await fetch('https://bling.com.br/Api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: tokenData3.toString(),
    });

    const text3 = await response3.text();
    console.log(`🧪 [${requestId}] Método 3 - Status: ${response3.status}, Response: ${text3.substring(0, 100)}`);

    if (response3.ok) {
      const data = JSON.parse(text3);
      return res.status(200).json({
        success: true,
        method: 'Basic Auth + redirect_uri',
        data: {
          ...data,
          created_at: Date.now()
        }
      });
    }

  } catch (error) {
    console.log(`🧪 [${requestId}] Método 3 falhou: ${error.message}`);
  }

  // Se chegou aqui, nenhum método funcionou
  return res.status(500).json({
    error: 'All methods failed',
    message: 'Verifique os logs do servidor para detalhes',
    requestId
  });
}
