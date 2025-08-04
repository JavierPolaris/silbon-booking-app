// api/get-appointments.js
import axios from 'axios';
import { getTimifyToken } from '../utils/getToken.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const token = await getTimifyToken();
    const companyId = process.env.TIMIFY_COMPANY_ID; // asegúrate de tenerlo en tus variables

    // Fechas: últimos 3 días para asegurar que haya contenido
    const timezone = 'Europe/Madrid'; // o el que uses
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 3);

    const from_date = from.toISOString().split('T')[0];
    const to_date = today.toISOString().split('T')[0];

    const from_time = `${from_date} 00:00`;
    const to_time = `${to_date} 23:59`;

    const { data } = await axios.get('https://api.timify.com/v1/appointments', {
      headers: {
        Authorization: `Bearer ${token}`,
        'company-id': companyId,
        'Content-Type': 'application/json'
      },
      params: {
        timezone,
        from_date,
        to_date,
        from_time,
        to_time,
        limit: 50,
        page: 1
      }
    });

    const simplified = (data.data || []).map(appointment => ({
      id: appointment.id,
      start: appointment.start,
      end: appointment.end,
      customer_id: appointment.customer_id,
      service_id: appointment.service_id,
      resource_id: appointment.resource_id
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
