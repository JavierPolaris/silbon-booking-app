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
    if (!token) return res.status(401).json({ error: 'Token inválido' });
    

    // Generar los próximos 30 días
    const days = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      days.push(day.toISOString().split('T')[0]);
    }

    const { data } = await axios.get('https://api.timify.com/v1/booker-services/availabilities', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        company_id: companyId,
        service_id: serviceId,
        days
      }
    });

    const simplified = data.data?.slots?.map(slot => ({
      day: slot.day,
      times: slot.times
    })) || [];

    res.status(200).json(simplified);

  } catch (err) {
    console.error('❌ Error al obtener disponibilidad:', err.response?.data || err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
