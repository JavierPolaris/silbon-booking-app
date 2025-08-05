// api/get-all-appointments.js
import axios from 'axios';
import { getTimifyToken } from '../utils/getToken.js';



export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const token = await getTimifyToken();
    const accessToken = typeof token === 'string' ? token : token.accessToken;
    console.log("🪪 Token obtenido:", accessToken);

    if (!accessToken) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const timezone = 'Europe/Madrid';
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const dateStr = yesterday.toISOString().split('T')[0];
    const from_time = `${dateStr} 00:00`;
    const to_time = `${dateStr} 23:55`;





    const enterpriseId = process.env.TIMIFY_ENTERPRISE_ID;
    console.log("🏢 enterpriseId:", enterpriseId);

    const { data } = await axios.get('https://api.timify.com/v1/booker-services/companies', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        enterprise_id: enterpriseId,
        with_full_attributes: true,
      },
    });

    console.log("📦 Respuesta de Timify:", data.data.companyIds);
    const companyIds = data.data.companyIds;

    const allAppointments = [];
    for (const companyId of companyIds) {
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const { data: appointmentsResponse } = await axios.get('https://api.timify.com/v1/appointments', {
          headers: {
            Authorization: accessToken,
            'company-id': companyId,
            'Content-Type': 'application/json',
          },
          params: {
            timezone,
            from_date: dateStr,
            to_date: dateStr,
            from_time,
            to_time,
            limit: 50,
            page,
          },
        });

        const appointments = appointmentsForBranch.data || [];
        console.log(`📅 Citas obtenidas para la sucursal ${companyId}:`, appointments);

        appointmentsForBranch.push(...appointments);
        hasMore = appointments.length === 50;
        page++;
      }

      groupedAppointments.push({
        branch_id: companyId,
        appointments: appointmentsForBranch,
      });
    }

    res.status(200).json(groupedAppointments);
  } catch (error) {
    console.error('❌ Error al obtener citas:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Error al obtener citas',
      details: error.response?.data || error.message,
    });
  }
}