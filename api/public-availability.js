import { getTimifyToken } from '../utils/getToken.js';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { companyId, serviceId } = req.query;

  if (!companyId || !serviceId) {
    return res.status(400).json({ error: 'Faltan parámetros: companyId y serviceId son obligatorios' });
  }

  try {
    const token = await getTimifyToken();

    const { data } = await axios.get('https://api.timify.com/v1/booker-services/availability', {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
      },
      params: {
        company_id: companyId,
        service_id: serviceId,
      },
    });

    res.status(200).json(data);
  } catch (err) {
    console.error('Error al obtener disponibilidad:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
