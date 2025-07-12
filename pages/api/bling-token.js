import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Missing code parameter' });
  }

  const client_id = '44866dbd8fe131077d73dbe3d60531016512c855'; // Seu Client ID
  const client_secret = '18176f2b734f4abced1893fe39a852b6f28ff53c2a564348ebfe960367d1'; // Seu Client Secret
  const redirect_uri = 'https://john-tech-store.vercel.app/auth/callback'; // Mesma URL que usou na autorização

  try {
    const response = await fetch('https://api.bling.com.br/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id,
        client_secret,
        redirect_uri,
        code,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: errorData });
    }

    const data = await response.json();

    // Retorna o token para o frontend
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
