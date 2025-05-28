// /api/book-slot.js
import axios from 'axios';
import { getTimifyToken } from '../utils/getToken.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const {
    companyId,
    serviceId,
    resourceId,
    date, // Formato: "2025-05-30"
    time // Formato: "12:40"
  } = req.body;

  if (!companyId || !serviceId || !resourceId || !date || !time) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const token = await getTimifyToken();
    if (!token) return res.status(401).json({ error: 'Token inválido' });

    const payload = {
      company_id: companyId,
      id_de_servicio: serviceId,
      fecha: date,
      tiempo: time,
      identificadores_de_recursos: [resourceId]
    };

    const { data } = await axios.post(
      'https://api.timify.com/v1/booker-services/disponibilidades',
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(200).json({ message: 'Slot reservado correctamente', data });
  } catch (err) {
    console.error('❌ Error al reservar slot:', err.response?.data || err.message);
    res.status(500).json({ error: 'Error al reservar slot', details: err.response?.data || err.message });
  }
}
