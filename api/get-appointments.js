// api/get-appointments.js
import axios from 'axios';
import { getTimifyToken } from '../utils/getToken.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const token = await getTimifyToken();

    const { data } = await axios.get('https://api.timify.com/v1/appointments', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: {
        from: '2024-01-01T00:00:00Z',
        to: '2025-12-31T23:59:59Z',
        with_customer: true,
        with_service: true,
        with_resource: true
      }
    });

    const simplified = (data.data || []).map(appointment => ({
      id: appointment.id,
      start: appointment.start,
      end: appointment.end,
      customer: {
        firstName: appointment.customer?.firstName,
        lastName: appointment.customer?.lastName,
        email: appointment.customer?.email
      },
      service: {
        id: appointment.service?.id,
        name: appointment.service?.name
      },
      resource: {
        id: appointment.resource?.id,
        name: appointment.resource?.name
      }
    }));

    res.status(200).json(simplified);
  } catch (error) {
    console.error('❌ Error al obtener citas:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Error al obtener citas',
      details: error.response?.data || error.message
    });
  }
}
