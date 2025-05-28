import { getTimifyToken } from '../utils/getToken.js';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { companyId, serviceId } = req.query;

  if (!companyId || !serviceId) {
    return res.status(400).json({ error: 'Faltan parámetros: companyId y serviceId son obligatorios' });
  }

  try {
    const token = await getTimifyToken();
    if (!token) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const days = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date.toISOString().split('T')[0]); // 'YYYY-MM-DD'
    }

    console.log('🪪 Token:', token);
    console.log('🏢 companyId:', companyId);
    console.log('🧵 serviceId:', serviceId);
    console.log('📅 days[]:', days);

    const { data } = await axios.get('https://api.timify.com/v1/booker-services/availabilities', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      params: {
        company_id: companyId,
        service_id: serviceId,
        days
      }
    });

    console.log('📦 Disponibilidad recibida:', data);
    res.status(200).json(data);
  } catch (err) {
    console.error('❌ Error al obtener disponibilidad:', err.response?.data || err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
