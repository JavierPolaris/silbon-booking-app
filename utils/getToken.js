import axios from 'axios';

export async function getTimifyAdminToken() {
  const clientId = process.env.TIMIFY_CLIENT_ID;
  const clientSecret = process.env.TIMIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("❌ Variables de entorno no definidas");
    return null;
  }

  try {
    const response = await axios.post('https://connect.timify.com/oauth/token', {
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret
    });

    console.log("✅ Token con scopes recibidos:", response.data.scope);
    return response.data.access_token;

  } catch (error) {
    console.error('❌ Error al obtener token (Admin API):', error.response?.data || error.message);
    return null;
  }
}
