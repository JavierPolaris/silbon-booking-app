import axios from 'axios';
import { getTimifyToken } from '../utils/getToken.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const {
    reservationId,
    secret,
    firstName,
    lastName,
    email,
    phoneNumber
  } = req.body;

  if (!reservationId || !secret || !firstName || !lastName || !email || !phoneNumber) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const token = await getTimifyToken();

    const payload = {
      reservation_id: reservationId,
      secret: secret,
      fields: [
        {
          id: '6655e370650cbf001ef2aabf', // 🧑 Nombre
          value: firstName
        },
        {
          id: '6655e38a650cbf001ef2aac1', // 👨 Apellidos
          value: lastName
        },
        {
          id: '6655e3b3650cbf001ef2aac8', // 📧 Email
          value: email
        },
        {
          id: '6655e39d650cbf001ef2aac4', // 📱 Teléfono (JSON.stringify!)
          value: JSON.stringify({
            number: phoneNumber,
            country: 'ES'
          })
        }
      ]
    };

    const response = await axios.post('https://api.timify.com/v1/booker-services/appointments/confirm', payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Cita confirmada:', response.data);
    return res.status(200).json({ message: 'Cita confirmada correctamente', data: response.data });
  } catch (error) {
    console.error('❌ Error al confirmar cita:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Error al confirmar la cita', details: error.response?.data });
  }
}
