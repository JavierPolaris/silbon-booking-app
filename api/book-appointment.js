// /api/book-appointment.js
import axios from 'axios';
import { getTimifyToken } from '../utils/getToken.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  console.log('📥 Body recibido:', req.body);

  const {
    firstName,
    lastName,
    email,
    phone,
    note,
    serviceId,
    companyId,
    resourceId,
    startTime
  } = req.body;

  if (!firstName || !lastName || !email || !phone || !serviceId || !companyId || !resourceId || !startTime) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const token = await getTimifyToken();
    if (!token) return res.status(401).json({ error: 'Token inválido' });

    const payload = {
      service_id: serviceId,
      company_id: companyId,
      resource_ids: [resourceId],
      firstName,
      lastName,
      email,
      phone,
      language: 'es',
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
    res.status(500).json({ error: 'Error al crear la reserva', details: err.response?.data || err.message });
  }
}
