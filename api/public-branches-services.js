import { getTimifyToken } from '../utils/getToken.js';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const token = await getTimifyToken();
    console.log("🪪 Token obtenido:", token);

    if (!token) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const enterpriseId = process.env.TIMIFY_ENTERPRISE_ID;
    console.log("🏢 enterpriseId:", enterpriseId);

    const { data } = await axios.get('https://api.timify.com/v1/booker-services/companies', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        enterprise_id: enterpriseId,
        with_full_attributes: true,
      },
    });

    console.log("📦 Respuesta de Timify:", data);

    // ESTA ES LA LÍNEA IMPORTANTE
    res.status(200).json(data.data.companies || []);
  } catch (err) {
    console.error('❌ Error al obtener sucursales:', err.response?.data || err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
