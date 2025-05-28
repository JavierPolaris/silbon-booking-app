import { getTimifyToken } from '../utils/getToken.js';
import axios from 'axios';

export const config = {
  api: {
    bodyParser: true,
  },
};

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
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    const token = await getTimifyToken();

    const payload = {
      reservation_id: reservationId,
      secret: secret,
      fields: [
        {
          id: '67ea6b6d7ea2f9dc58cf9c01', // firstName
          value: firstName
        },
        {
          id: '67ea6b6d7ea2f9dc58cf9c04', // lastName
          value: lastName
        },
        {
          id: '67ea6b6d7ea2f9dc58cf9c02', // phone
          value: JSON.stringify({
            number: phoneNumber,
            country: 'ES'
          })
        },
        {
          id: '67ea6b6d7ea2f9dc58cf9bff', // email
          value: email
        }
      ]
    };

    const response = await axios.post(
      'https://api.timify.com/v1/booker-services/appointments/confirm',
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return res.status(200).json({ message: 'Cita confirmada', data: response.data });

  } catch (error) {
    console.error('Error al confirmar cita:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Error al confirmar cita', details: error.response?.data });
  }
}
