/**
 * API Endpoint: Mercado Livre Refresh Token
 * Renova access token usando refresh token
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
        const { refresh_token, clientId, clientSecret } = req.body;

        if (!refresh_token) {
            return res.status(400).json({ error: 'Refresh token é obrigatório' });
        }

        if (!clientId || !clientSecret) {
            return res.status(400).json({ error: 'Credenciais ML são obrigatórias' });
        }

        console.log('🔄 Renovando token ML...');

        // Preparar dados para requisição
        const refreshData = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refresh_token
        });

        // Fazer requisição para ML
        const response = await fetch('https://api.mercadolibre.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: refreshData.toString()
        });

        console.log('📡 Status resposta ML refresh:', response.status);

        const responseText = await response.text();
        console.log('📄 Resposta ML refresh:', responseText);

        if (!response.ok) {
            return res.status(response.status).json({
                error: 'Erro ao renovar token ML',
                details: responseText,
                status: response.status
            });
        }

        const tokenResponse = JSON.parse(responseText);

        if (tokenResponse.access_token) {
            console.log('✅ Token ML renovado com sucesso');
            
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
            console.error('❌ Token ML não renovado:', tokenResponse);
            return res.status(400).json({
                error: 'Token não renovado',
                details: tokenResponse
            });
        }

    } catch (error) {
        console.error('❌ Erro no endpoint ML refresh:', error);
        return res.status(500).json({
            error: 'Erro interno do servidor',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
