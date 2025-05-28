import axios from 'axios';
import { getTimifyToken } from '../utils/getToken.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const token = await getTimifyToken();
    const enterpriseId = process.env.TIMIFY_ENTERPRISE_ID;

    const response = await axios.get('https://api.timify.com/v1/companies', {
      headers: {
        accept: 'application/json',
        authorization: token,
      },
      params: {
        enterprise_id: enterpriseId,
      },
    });

    const companies = response.data?.data?.map(c => ({
      id: c.id,
      name: c.name,
      email: c.contactEmail,
      phone: c.phone?.phone,
      city: c.address?.city || '',
      address: c.address?.formatted || '',
      isOnline: c.onlineStatus?.isOnline,
      timezone: c.timezone,
    })) || [];

    res.status(200).json(companies);
  } catch (err) {
    console.error('❌ Error al obtener compañías:', err.response?.data || err.message);
    res.status(500).json({ error: 'Error al obtener compañías' });
  }
}
