// api/public-availability.js
import axios from 'axios';
import { getTimifyToken } from '../utils/getToken.js';

function formatDateAsLocalISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function chunkArray(items, chunkSize) {
  const chunks = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
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

    const configuredChunkSize = Number.parseInt(process.env.TIMIFY_BOOKING_CHUNK_DAYS ?? '30', 10);
    const chunkSize = Number.isFinite(configuredChunkSize) && configuredChunkSize > 0
      ? configuredChunkSize
      : 30;

    const days = [];
    const today = new Date();

    for (let i = 0; i < lookaheadDays; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      days.push(formatDateAsLocalISO(day));
    }

    const dayChunks = chunkArray(days, chunkSize);
    const availabilityResponses = await Promise.all(
      dayChunks.map((chunk) =>
        axios.get('https://api.timify.com/v1/booker-services/availabilities', {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params: {
            company_id: companyId,
            service_id: serviceId,
            days: chunk
          },
          timeout: 15000
        })
      )
    );

    const slots = availabilityResponses.flatMap((response) => response.data?.data?.slots || []);
    const simplified = slots.map((slot) => ({
      day: slot.day,
      times: slot.times
    }));

    return res.status(200).json(simplified);
  } catch (err) {
    console.error('Error al obtener disponibilidad:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
