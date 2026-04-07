// api/public-availability.js
import axios from 'axios';
import { getTimifyToken } from '../utils/getToken.js';

function formatDateAsLocalISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  const { companyId, serviceId } = req.query;

  if (!companyId || !serviceId) {
    return res.status(400).json({ error: 'Faltan parametros: companyId y serviceId son obligatorios' });
  }

  try {
    const token = await getTimifyToken();
    if (!token) {
      return res.status(401).json({ error: 'Token invalido' });
    }

    const configuredLookaheadDays = Number.parseInt(process.env.TIMIFY_BOOKING_LOOKAHEAD_DAYS ?? '365', 10);
    const lookaheadDays = Number.isFinite(configuredLookaheadDays) && configuredLookaheadDays > 0
      ? configuredLookaheadDays
      : 365;

    const days = [];
    const today = new Date();

    for (let i = 0; i < lookaheadDays; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      days.push(formatDateAsLocalISO(day));
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

    const simplified = data.data?.slots?.map((slot) => ({
      day: slot.day,
      times: slot.times
    })) || [];

    return res.status(200).json(simplified);
  } catch (err) {
    console.error('Error al obtener disponibilidad:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
