import axios from 'axios';

export async function getTimifyToken() {
  const clientId = process.env.TIMIFY_CLIENT_ID;
  const clientSecret = process.env.TIMIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("❌ Variables de entorno no definidas");
    return null;
  }

  try {
    const response = await axios.post('https://enterprise-api.timify.com/v1/oauth/token', {
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret
    });

    return response.data.access_token;
  } catch (error) {
    console.error('❌ Error al obtener token:', error.response?.data || error.message);
    return null;
  }
}
