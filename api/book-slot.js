// ✅ 1. RESERVAR EL SLOT (book-slot.js)
import axios from 'axios';
import { getTimifyToken } from '../utils/getToken.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { companyId, serviceId, resourceIds, date, time } = req.body;

  if (!companyId || !serviceId || !resourceIds?.length || !date || !time) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const token = await getTimifyToken();

    const payload = {
      company_id: companyId,
      service_id: serviceId,
      resource_ids: resourceIds,
      date,
      time
    };

    const response = await axios.post('https://api.timify.com/v1/booker-services/appointments', payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return res.status(200).json({ message: 'Slot reservado', data: response.data });
  } catch (error) {
    console.error('Error al reservar slot:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Error al reservar el slot', details: error.response?.data });
  }
}