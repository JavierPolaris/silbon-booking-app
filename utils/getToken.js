import axios from 'axios';

export async function getTimifyToken() {
  try {
    const response = await axios.post('https://enterprise-api.timify.com/v1/oauth/token', {
      grant_type: 'client_credentials',
      client_id: process.env.TIMIFY_CLIENT_ID,
      client_secret: process.env.TIMIFY_CLIENT_SECRET
    });

    return response.data.access_token;
  } catch (error) {
    console.error('❌ Error al obtener token:', error.response?.data || error.message);
    return null;
  }
}
