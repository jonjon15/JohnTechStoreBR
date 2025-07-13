// 🧪 API de Teste de Conectividade Bling
// Verifica se a implementação está funcionando corretamente

export default async function handler(req, res) {
  // 🔒 CORS e Headers de Segurança
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const testId = `test_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  const startTime = Date.now();

  console.log(`🧪 [${testId}] Iniciando teste de conectividade`);

  try {
    const { access_token } = req.query;

    if (!access_token) {
      return res.status(400).json({
        success: false,
        testId,
        error: 'Access token é obrigatório',
        suggestion: 'Faça login no Bling primeiro'
      });
    }

    // 🔄 Teste 1: Verificar dados básicos da empresa
    console.log(`🔍 [${testId}] Testando endpoint de dados básicos`);
    
    const empresaResponse = await fetch('https://api.bling.com.br/Api/v3/empresas/me/dados-basicos', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });

    const responseTime = Date.now() - startTime;
    const empresaData = empresaResponse.ok ? await empresaResponse.json() : null;

    if (!empresaResponse.ok) {
      const errorText = await empresaResponse.text();
      console.error(`❌ [${testId}] Erro na API:`, empresaResponse.status, errorText);
      
      return res.status(empresaResponse.status).json({
        success: false,
        testId,
        responseTime,
        error: `API retornou ${empresaResponse.status}`,
        details: errorText,
        suggestions: [
          'Verifique se o token de acesso está válido',
          'Confirme se os escopos necessários foram autorizados',
          'Teste fazer refresh do token se expirado'
        ]
      });
    }

    // ✅ Sucesso na conectividade
    console.log(`✅ [${testId}] Conectividade confirmada em ${responseTime}ms`);

    res.status(200).json({
      success: true,
      testId,
      responseTime,
      message: 'Conectividade com Bling API confirmada',
      empresaInfo: {
        id: empresaData?.data?.id,
        nome: empresaData?.data?.nome,
        cnpj: empresaData?.data?.cnpj
      },
      apiHealth: {
        endpoint: 'https://api.bling.com.br/Api/v3/empresas/me/dados-basicos',
        status: empresaResponse.status,
        headers: Object.fromEntries(empresaResponse.headers.entries())
      },
      conformidade: {
        basicAuth: '✅ Implementado',
        hostApi: '✅ api.bling.com.br',
        bearerToken: '✅ Bearer Authentication',
        responseFormat: '✅ JSON estruturado'
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ [${testId}] Erro no teste:`, error.message);

    res.status(500).json({
      success: false,
      testId,
      responseTime,
      error: error.message,
      type: error.name,
      suggestions: [
        'Verifique a conexão com a internet',
        'Confirme se as credenciais estão corretas',
        'Tente novamente em alguns segundos'
      ]
    });
  }
}
