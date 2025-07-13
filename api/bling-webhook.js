// Endpoint para receber webhooks do Bling
// Implementado conforme documentação oficial: https://developer.bling.com.br/webhooks

import crypto from 'crypto';

export default async function handler(req, res) {
  // 🔒 CORS e Headers de Segurança
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Bling-Signature-256');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // OPTIONS para CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 🚫 Apenas POST permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 📋 Dados da requisição
  const eventId = `wh_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  const requestIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const blingSignature = req.headers['x-bling-signature-256'];
  const payload = JSON.stringify(req.body);

  console.log(`🔔 [${eventId}] Webhook recebido do Bling`);

  // 🔐 AUTENTICAÇÃO HMAC (conforme documentação oficial)
  const client_secret = process.env.BLING_CLIENT_SECRET || '18176f2b734f4abced1893fe39a852b6f28ff53c2a564348ebfe960367d1';
  
  if (blingSignature && client_secret) {
    try {
      // Gerar hash HMAC do payload
      const expectedHash = crypto
        .createHmac('sha256', client_secret)
        .update(payload, 'utf8')
        .digest('hex');
      
      const expectedSignature = `sha256=${expectedHash}`;
      
      // Verificar se as assinaturas coincidem
      if (blingSignature !== expectedSignature) {
        console.error(`❌ [${eventId}] Assinatura HMAC inválida:`, {
          received: blingSignature,
          expected: expectedSignature
        });
        return res.status(403).json({ 
          error: 'Assinatura do webhook inválida',
          eventId 
        });
      }
      
      console.log(`✅ [${eventId}] Assinatura HMAC validada com sucesso`);
    } catch (error) {
      console.error(`❌ [${eventId}] Erro na validação HMAC:`, error.message);
      return res.status(500).json({ 
        error: 'Erro na validação de segurança',
        eventId 
      });
    }
  } else {
    console.warn(`⚠️ [${eventId}] Webhook sem validação HMAC (desenvolvimento)`);
  }

  // 📊 LOG ESTRUTURADO DO EVENTO
  const logData = {
    eventId,
    event: req.body.event,
    companyId: req.body.companyId,
    date: req.body.date,
    version: req.body.version,
    ip: requestIp,
    body: req.body,
    headers: {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      'x-bling-signature-256': blingSignature
    },
    timestamp: new Date().toISOString()
  };

  console.log(`� [${eventId}] Webhook processado:`, logData);

  // 🔄 PROCESSAMENTO DE EVENTOS
  try {
    if (req.body.event) {
      const [resource, action] = req.body.event.split('.');
      
      console.log(`🎯 [${eventId}] Processando evento: ${resource}.${action}`);
      
      // Processar diferentes tipos de eventos
      switch (resource) {
        case 'product':
          console.log(`📦 [${eventId}] Evento de produto: ${action} - ID: ${req.body.data?.id}`);
          break;
        case 'order':
          console.log(`🛒 [${eventId}] Evento de pedido: ${action} - ID: ${req.body.data?.id}`);
          break;
        case 'stock':
          console.log(`📊 [${eventId}] Evento de estoque: ${action} - Produto: ${req.body.data?.produto?.id}`);
          break;
        case 'invoice':
          console.log(`📄 [${eventId}] Evento de nota fiscal: ${action} - ID: ${req.body.data?.id}`);
          break;
        default:
          console.log(`🔍 [${eventId}] Evento não mapeado: ${resource}.${action}`);
      }
    }

    // ✅ Resposta de sucesso (obrigatória para evitar reenvios)
    res.status(200).json({ 
      status: 'ok',
      eventId,
      processed: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ [${eventId}] Erro no processamento:`, error.message);
    
    // ⚠️ Retornar erro 500 fará o Bling reenviar o webhook
    res.status(500).json({ 
      error: 'Erro no processamento do webhook',
      eventId,
      details: error.message
    });
  }
}
