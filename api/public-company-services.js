import { getTimifyToken } from '../utils/getToken.js';
import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { companyId } = req.query;

    if (!companyId) {
        return res.status(400).json({ error: 'Parámetro companyId obligatorio' });
    }

    try {
        const token = await getTimifyToken();
        if (!token) return res.status(401).json({ error: 'Token inválido' });

        const { data } = await axios.get('https://api.timify.com/v1/booker-services/services', {
            headers: { Authorization: `Bearer ${token}` },
            params: { company_id: companyId }
        });

        const services = data?.data?.map(service => ({
            id: service.id,
            name: service.name
        })) || [];

        res.status(200).json(services);
    } catch (err) {
        console.error('❌ Error al obtener servicios:', err.response?.data || err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}
