// ✅ book-appointment.js
import axios from 'axios';
import { getTimifyToken } from '../utils/getToken.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const {
    reservationId,   // viene de book-slot.js → data.data.id
    secret,          // viene de book-slot.js → data.data.secret
    externalCustomerId, // opcional si ya existe
    fields           // campos personalizados para el cliente
  } = req.body;

  if (!reservationId || !secret || !fields?.length) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const token = await getTimifyToken();

    const payload = {
      reservation_id: reservationId,
      secret: secret,
      fields: fields
    };

    const response = await axios.post('https://api.timify.com/v1/booker-services/appointments/confirm', payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    res.status(200).json({ message: 'Cita confirmada', data: response.data });
  } catch (error) {
    console.error('❌ Error al confirmar cita:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error al confirmar la cita', details: error.response?.data });
  }
}
