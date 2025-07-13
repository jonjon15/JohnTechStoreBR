// 🎯 API de Homologação Bling - Implementação Completa
// Conforme documentação: https://developer.bling.com.br/homologacao#execu%C3%A7%C3%A3o

export default async function handler(req, res) {
  // 🔒 CORS e Headers de Segurança
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { access_token, refresh_token } = req.body;

  if (!access_token) {
    return res.status(400).json({ error: 'Access token é obrigatório' });
  }

  // 📊 Sistema de monitoramento de homologação
  const homologacaoId = `hml_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  const startTime = Date.now();
  const maxDuration = 10000; // 10 segundos conforme documentação
  
  let currentHash = null;
  const logs = [];

  function log(step, message, data = {}) {
    const logEntry = {
      step,
      message,
      timestamp: Date.now() - startTime,
      data
    };
    logs.push(logEntry);
    console.log(`🔍 [${homologacaoId}] Step ${step}: ${message}`, data);
  }

  // 🔧 Função para fazer requisições com headers apropriados
  async function makeRequest(method, endpoint, body = null, useRefreshToken = false) {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${useRefreshToken ? refresh_token : access_token}`
    };

    // Adicionar hash de homologação se disponível
    if (currentHash) {
      headers['x-bling-homologacao'] = currentHash;
    }

    const options = {
      method,
      headers
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`https://api.bling.com.br/Api/v3/homologacao${endpoint}`, options);
    
    // Capturar hash para próxima requisição
    const newHash = response.headers.get('x-bling-homologacao');
    if (newHash) {
      currentHash = newHash;
      log('HASH', `Novo hash capturado: ${newHash}`);
    }

    return response;
  }

  try {
    log('START', 'Iniciando processo de homologação');

    // ⏱️ Verificar limite de tempo
    const checkTime = () => {
      if (Date.now() - startTime > maxDuration) {
        throw new Error('Tempo limite de 10 segundos excedido');
      }
    };

    // 🔄 STEP 1: GET - Obter dados do produto
    log('STEP1', 'Iniciando GET /homologacao/produtos');
    checkTime();
    
    const step1Response = await makeRequest('GET', '/produtos');
    
    if (!step1Response.ok) {
      throw new Error(`Step 1 falhou: ${step1Response.status} - ${await step1Response.text()}`);
    }

    const step1Data = await step1Response.json();
    const produtoData = step1Data.data;
    
    log('STEP1', 'Dados do produto obtidos', produtoData);

    // ⏱️ Aguardar 2 segundos conforme documentação
    await new Promise(resolve => setTimeout(resolve, 2000));
    checkTime();

    // 🔄 STEP 2: POST - Criar produto
    log('STEP2', 'Iniciando POST /homologacao/produtos');
    
    const step2Response = await makeRequest('POST', '/produtos', produtoData);
    
    if (!step2Response.ok) {
      throw new Error(`Step 2 falhou: ${step2Response.status} - ${await step2Response.text()}`);
    }

    const step2Data = await step2Response.json();
    const produtoId = step2Data.data.id;
    
    log('STEP2', 'Produto criado', { id: produtoId });

    // ⏱️ Aguardar 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000));
    checkTime();

    // 🔄 STEP 3: PUT - Atualizar produto (nome para "Copo")
    log('STEP3', `Iniciando PUT /homologacao/produtos/${produtoId}`);
    
    const updateData = {
      ...produtoData,
      nome: "Copo"
    };
    
    const step3Response = await makeRequest('PUT', `/produtos/${produtoId}`, updateData);
    
    if (!step3Response.ok) {
      throw new Error(`Step 3 falhou: ${step3Response.status} - ${await step3Response.text()}`);
    }

    log('STEP3', 'Produto atualizado');

    // ⏱️ Aguardar 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000));
    checkTime();

    // 🔄 STEP 4: PATCH - Alterar situação para "I" (Inativo)
    log('STEP4', `Iniciando PATCH /homologacao/produtos/${produtoId}/situacoes`);
    
    const step4Response = await makeRequest('PATCH', `/produtos/${produtoId}/situacoes`, {
      situacao: "I"
    });
    
    if (!step4Response.ok) {
      // 🔄 Token pode ter sido invalidado aqui - tentar refresh
      if (step4Response.status === 401 && refresh_token) {
        log('REFRESH', 'Token invalidado, tentando refresh');
        
        const step4RetryResponse = await makeRequest('PATCH', `/produtos/${produtoId}/situacoes`, {
          situacao: "I"
        }, true); // usar refresh token
        
        if (!step4RetryResponse.ok) {
          throw new Error(`Step 4 (retry) falhou: ${step4RetryResponse.status} - ${await step4RetryResponse.text()}`);
        }
      } else {
        throw new Error(`Step 4 falhou: ${step4Response.status} - ${await step4Response.text()}`);
      }
    }

    log('STEP4', 'Situação do produto alterada para Inativo');

    // ⏱️ Aguardar 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000));
    checkTime();

    // 🔄 STEP 5: DELETE - Remover produto
    log('STEP5', `Iniciando DELETE /homologacao/produtos/${produtoId}`);
    
    const step5Response = await makeRequest('DELETE', `/produtos/${produtoId}`);
    
    if (!step5Response.ok) {
      throw new Error(`Step 5 falhou: ${step5Response.status} - ${await step5Response.text()}`);
    }

    log('STEP5', 'Produto removido');

    // ✅ SUCESSO
    const totalTime = Date.now() - startTime;
    log('SUCCESS', `Homologação concluída com sucesso em ${totalTime}ms`);

    res.status(200).json({
      success: true,
      homologacaoId,
      totalTime,
      message: 'Homologação executada com sucesso conforme documentação Bling',
      steps: logs,
      finalHash: currentHash
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    log('ERROR', error.message, { totalTime });

    console.error(`❌ [${homologacaoId}] Erro na homologação:`, error.message);

    res.status(500).json({
      success: false,
      homologacaoId,
      totalTime,
      error: error.message,
      steps: logs
    });
  }
}
