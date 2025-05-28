// /api/book-appointment.js
import axios from 'axios';
import { getTimifyToken } from '../utils/getToken.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    note,
    serviceId,
    companyId,
    startTime // ISO format: "2025-05-29T12:40:00+02:00"
  } = req.body;

  if (!firstName || !lastName || !email || !phoneNumber || !serviceId || !companyId || !startTime) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const token = await getTimifyToken();
    if (!token) return res.status(401).json({ error: 'Token inválido' });

    const payload = {
      serviceId,
      companyId,
      customer: {
        firstName,
        lastName,
        email,
        phoneNumber,
        language: 'es'
      },
      startTime,
      customData: {
        notes: note || ''
      },
      sendEmailToCustomer: true
    };

    const { data } = await axios.post('https://api.timify.com/v1/booker-services/reservations', payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Reserva creada correctamente:', data);
    res.status(200).json({ message: 'Reserva creada correctamente', data });
  } catch (err) {
    console.error('❌ Error al crear la reserva:', err.response?.data || err.message);
    res.status(500).json({ error: 'Error al crear la reserva' });
  }
}
