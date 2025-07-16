// api/confirm-appointment.js
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

  const idByType = (type) => {
    const match = fieldIds.find(f => f.type === type);
    return match?.id || null;
  };

  const firstNameId = idByType('TEXT');
  const lastNameId = idByType('TEXT');
  const phoneId = idByType('PHONE');
  const emailId = idByType('EMAIL');

  if (!firstNameId || !lastNameId || !phoneId || !emailId) {
    return res.status(400).json({ error: 'IDs de campos obligatorios no encontrados' });
  }


  try {
    const token = await getTimifyToken();

    const payload = {
      company_id: companyId,
      reservation_id: reservationId,
      secret: secret,
      fields: [
        {
          id: firstNameId,
          value: firstName
        },
        {
          id: lastNameId,
          value: lastName
        },
        {
          id: phoneId,
          value: JSON.stringify({
            number: phoneNumber,
            country: 'ES'
          })
        },
        {
          id: emailId,
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
