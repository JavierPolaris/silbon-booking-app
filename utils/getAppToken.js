// getAppToken.js
import axios from 'axios';

export async function getAppToken() {
  const appId = process.env.TIMIFY_CLIENT_ID;
  const appSecret = process.env.TIMIFY_CLIENT_SECRET;

  if (!appId || !appSecret) {
    console.error("❌ Faltan variables TIMIFY_CLIENT_ID o TIMIFY_CLIENT_SECRET");
    return null;
  }

  try {
    const response = await axios.post('https://api.timify.com/v1/oauth/token', {
      applicationId: appId,
      applicationSecret: appSecret,
    });

    console.log("✅ App Token recibido:", response.data.accessToken);
    return response.data.accessToken;

  } catch (error) {
    console.error('❌ Error en getAppToken:', error.response?.data || error.message);
    return null;
  }
}
