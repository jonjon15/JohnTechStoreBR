/**
 * API Endpoint: Mercado Livre Token Exchange
 * Troca código de autorização por access token
 */

export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { code, clientId, clientSecret } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Código de autorização é obrigatório' });
        }

        if (!clientId || !clientSecret) {
            return res.status(400).json({ error: 'Credenciais ML são obrigatórias' });
        }

        console.log('🔄 Trocando código por token ML...');
        console.log('Code:', code);

        // Preparar dados para requisição
        const tokenData = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            redirect_uri: process.env.ML_REDIRECT_URI || 'https://john-tech-store.vercel.app/callback-ml.html'
        });

        // Fazer requisição para ML
        const response = await fetch('https://api.mercadolibre.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: tokenData.toString()
        });

        console.log('📡 Status resposta ML:', response.status);

        const responseText = await response.text();
        console.log('📄 Resposta ML:', responseText);

        if (!response.ok) {
            return res.status(response.status).json({
                error: 'Erro na API do Mercado Livre',
                details: responseText,
                status: response.status
            });
        }

        const tokenResponse = JSON.parse(responseText);

        if (tokenResponse.access_token) {
            console.log('✅ Token ML obtido com sucesso');
            
            return res.status(200).json({
                access_token: tokenResponse.access_token,
                token_type: tokenResponse.token_type,
                expires_in: tokenResponse.expires_in,
                refresh_token: tokenResponse.refresh_token,
                scope: tokenResponse.scope,
                user_id: tokenResponse.user_id,
                timestamp: new Date().toISOString()
            });
        } else {
            console.error('❌ Token não recebido:', tokenResponse);
            return res.status(400).json({
                error: 'Token não recebido',
                details: tokenResponse
            });
        }

    } catch (error) {
        console.error('❌ Erro no endpoint ML token:', error);
        return res.status(500).json({
            error: 'Erro interno do servidor',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
