// /api/public-branches-services
import { getTimifyToken } from '../utils/getToken.js';
import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const token = await getTimifyToken();
        const enterpriseId = process.env.TIMIFY_ENTERPRISE_ID;
        const companyId = req.query.companyId;

        const { data } = await axios.get('https://api.timify.com/v1/booker-services/companies', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                enterprise_id: enterpriseId,
                with_full_attributes: true,
            },
        });

        const companies = data.data.companies || [];
        const company = companies.find(c => c.id === companyId);

        if (!company) {
            return res.status(404).json({ services: [] });
        }

        res.status(200).json({ services: company.services || [] });

    } catch (err) {
        console.error('❌ Error al obtener servicios:', err.response?.data || err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}
