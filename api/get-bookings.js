// api/get-bookings.js
import axios from 'axios';
import { getTimifyToken } from '../utils/getToken.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const token = await getTimifyToken();
    const { data } = await axios.get('https://api.timify.com/v1/bookings', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: {
        // Puedes acotar el rango de fechas si lo necesitas
        from: '2025-07-01T00:00:00Z',
        to: '2025-08-04T23:59:59Z'
      }
    });

    res.status(200).json(data.data || []);
  } catch (error) {
    console.error('❌ Error al obtener bookings:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error al obtener bookings', details: error.response?.data });
  }
}
