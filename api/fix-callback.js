// 🔧 Script de Verificação e Correção - Callback Bling
// Este script corrige automaticamente os problemas de callback identificados

export default async function handler(req, res) {
  // Headers de segurança
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action, code } = req.query;

  try {
    switch (action) {
      case 'diagnose':
        return await runDiagnostics(req, res);
      
      case 'test-endpoint':
        return await testEndpoints(req, res);
      
      case 'fix-callback':
        return await fixCallback(req, res, code);
      
      default:
        return res.status(400).json({
          error: 'Ação não especificada',
          available_actions: ['diagnose', 'test-endpoint', 'fix-callback']
        });
    }
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// 🔍 Executar diagnósticos completos
async function runDiagnostics(req, res) {
  const host = req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    host,
    protocol,
    full_url: `${protocol}://${host}`,
    environment: {
      client_id: process.env.BLING_CLIENT_ID ? 'CONFIGURADO' : 'FALTANDO',
      client_secret: process.env.BLING_CLIENT_SECRET ? 'CONFIGURADO' : 'FALTANDO',
      redirect_uri: process.env.BLING_REDIRECT_URI || 'NÃO CONFIGURADO'
    },
    expected_callback_url: `${protocol}://${host}/callback.html`,
    current_callback_url: process.env.BLING_REDIRECT_URI,
    callback_match: process.env.BLING_REDIRECT_URI === `${protocol}://${host}/callback.html`,
    issues: []
  };

  // Verificar problemas
  if (!process.env.BLING_CLIENT_ID) {
    diagnostics.issues.push('BLING_CLIENT_ID não configurado');
  }
  
  if (!process.env.BLING_CLIENT_SECRET) {
    diagnostics.issues.push('BLING_CLIENT_SECRET não configurado');
  }
  
  if (!diagnostics.callback_match) {
    diagnostics.issues.push('URL de callback não corresponde ao host atual');
  }

  // Testar conectividade com Bling
  try {
    const testResponse = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=test'
    });
    
    diagnostics.bling_api_reachable = testResponse.status !== 0;
    diagnostics.bling_api_status = testResponse.status;
  } catch (error) {
    diagnostics.bling_api_reachable = false;
    diagnostics.bling_api_error = error.message;
  }

  return res.status(200).json(diagnostics);
}

// 🧪 Testar todos os endpoints disponíveis
async function testEndpoints(req, res) {
  const endpoints = [
    'https://www.bling.com.br/Api/v3/oauth/token',
    'https://api.bling.com.br/Api/v3/oauth/token',
    'https://bling.com.br/Api/v3/oauth/token'
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      const testResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=test'
      });

      results.push({
        endpoint,
        status: testResponse.status,
        reachable: true,
        response_time: Date.now()
      });
    } catch (error) {
      results.push({
        endpoint,
        reachable: false,
        error: error.message
      });
    }
  }

  return res.status(200).json({
    test_results: results,
    recommended_endpoint: results.find(r => r.reachable && r.status < 500)?.endpoint || endpoints[0]
  });
}

// 🔧 Tentar corrigir o callback automaticamente
async function fixCallback(req, res, code) {
  if (!code) {
    return res.status(400).json({
      error: 'Código de autorização necessário para correção'
    });
  }

  const host = req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  
  // Configurações corrigidas
  const correctedConfig = {
    client_id: process.env.BLING_CLIENT_ID || '44866dbd8fe131077d73dbe3d60531016512c855',
    client_secret: process.env.BLING_CLIENT_SECRET || '18176f2b734f4abced1893fe39a852b6f28ff53c2a564348ebfe960367d1',
    redirect_uri: `${protocol}://${host}/callback.html`
  };

  // Tentar obter token com configurações corrigidas
  try {
    const credentials = Buffer.from(`${correctedConfig.client_id}:${correctedConfig.client_secret}`).toString('base64');
    
    const tokenData = new URLSearchParams({
      grant_type: 'authorization_code',
      code
    });

    // Testar endpoint principal
    const tokenResponse = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: tokenData.toString()
    });

    const responseText = await tokenResponse.text();

    if (tokenResponse.ok) {
      const tokenResponseData = JSON.parse(responseText);
      
      return res.status(200).json({
        success: true,
        message: 'Callback corrigido com sucesso!',
        token_data: {
          ...tokenResponseData,
          created_at: Date.now()
        },
        corrected_config: {
          redirect_uri: correctedConfig.redirect_uri,
          client_id_configured: !!correctedConfig.client_id,
          client_secret_configured: !!correctedConfig.client_secret
        }
      });
    } else {
      return res.status(tokenResponse.status).json({
        error: 'Falha na obtenção do token após correção',
        bling_response: responseText,
        status: tokenResponse.status,
        corrected_config: correctedConfig
      });
    }

  } catch (error) {
    return res.status(500).json({
      error: 'Erro durante a correção',
      message: error.message,
      corrected_config: correctedConfig
    });
  }
}
