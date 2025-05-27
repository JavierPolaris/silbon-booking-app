import axios from 'axios';

export async function getTimifyToken() {
  const clientId = process.env.TIMIFY_APP_ID;
  const clientSecret = process.env.TIMIFY_APP_SECRET;

  if (!clientId || !clientSecret) {
    console.error("❌ Variables de entorno no definidas");
    return null;
  }

  try {
    const response = await axios.post('https://api.timify.com/v1/auth/token', {
      appid: clientId,
      appsecret: clientSecret
    });

    console.log("✅ Token recibido:", response.data);
    return response.data.accessToken;

  } catch (error) {
    console.error('❌ Error al obtener token:', error.response?.data || error.message);
    return null;
  }
}
