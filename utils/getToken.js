import axios from 'axios';

export async function getTimifyToken() {
  const clientId = process.env.TIMIFY_CLIENT_ID;
  const clientSecret = process.env.TIMIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("❌ Variables de entorno no definidas");
    return null;
  }

  try {
    const response = await axios.post('https://api.timify.com/v1/auth/token', {
      appid: clientId,
      appsecret: clientSecret
    });

    return response.data.token; // <- este es el campo correcto según la doc oficial
  } catch (error) {
    console.error('❌ Error al obtener token:', error.response?.data || error.message);
    return null;
  }
}
