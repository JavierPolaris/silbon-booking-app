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
    companyId,
    reservationId,
    secret,
    firstName,
    lastName,
    email,
    phoneNumber,
    fieldIds // 👈 recibimos los IDs desde el frontend
  } = req.body;

  // Validaciones básicas
  if (
    !companyId || !reservationId || !secret ||
    !firstName || !lastName || !email || !phoneNumber
  ) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  if (
    !fieldIds || !fieldIds.firstName || !fieldIds.lastName ||
    !fieldIds.phone || !fieldIds.email
  ) {
    return res.status(400).json({ error: 'Faltan IDs de campos personalizados' });
  }

  try {
    const token = await getTimifyToken();

    const payload = {
      company_id: companyId,
      reservation_id: reservationId,
      secret: secret,
      fields: [
        {
          id: fieldIds.firstName,
          value: firstName
        },
        {
          id: fieldIds.lastName,
          value: lastName
        },
        {
          id: fieldIds.phone,
          value: JSON.stringify({
            number: phoneNumber,
            country: 'ES'
          })
        },
        {
          id: fieldIds.email,
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
    return res.status(500).json({
      error: 'Error al confirmar cita',
      details: error.response?.data || error.message
    });
  }
}
