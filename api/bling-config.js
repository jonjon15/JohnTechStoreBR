export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Retornar configurações públicas do Bling (sem secrets)
  const config = {
    client_id: process.env.BLING_CLIENT_ID || '44866dbd8fe131077d73dbe3d60531016512c855',
    redirect_uri: process.env.BLING_REDIRECT_URI || `https://${req.headers.host}/callback.html`
  };

  if (!config.client_id) {
    return res.status(500).json({ 
      error: 'BLING_CLIENT_ID não configurado nas variáveis de ambiente' 
    });
  }

  res.status(200).json(config);
}
