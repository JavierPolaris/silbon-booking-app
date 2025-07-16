// /api/public-company-services.js
import { getTimifyToken } from '../utils/getToken.js';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { companyId } = req.query;

  if (!companyId) {
    return res.status(400).json({ error: 'companyId es obligatorio' });
  }

  try {
    const token = await getTimifyToken();
    if (!token) return res.status(401).json({ error: 'Token inválido' });

    const { data } = await axios.get('https://api.timify.com/v1/booker-services/companies', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        enterprise_id: process.env.TIMIFY_ENTERPRISE_ID,
        with_full_attributes: true,
      },
    });

    const companies = data.data?.companies || [];
    const company = companies.find(c => c.id === companyId);

    if (!company) return res.status(404).json({ error: 'Tienda no encontrada' });

    res.status(200).json({ services: company.services || [] });
  } catch (err) {
    console.error('❌ Error al obtener servicios:', err.response?.data || err.message);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
}
