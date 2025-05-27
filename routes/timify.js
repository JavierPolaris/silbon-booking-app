import express from 'express'; 
import axios from 'axios';
import { getTimifyToken } from '../utils/getToken.js';

const router = express.Router();

router.get('/me', async (req, res) => {
    try {
        const token = await getTimifyToken();
        if (!token) return res.status(500).json({ error: 'Token error' });

        const response = await axios.get('https://api.timify.com/v1/me', {
            headers: {
                Authorization: `Bearer ${token}`,
                accept: 'application/json'
            }
        });

        console.log("👤 Info del token:", response.data);
        res.json(response.data);
    } catch (error) {
        console.error('❌ Error en /me:', error.response?.data || error.message);
        res.status(500).json({ error: 'Error al obtener información del token' });
    }
});



router.get('/availability', async (req, res) => {
    try {
        const token = await getTimifyToken();
        if (!token) return res.status(500).json({ error: 'Token error' });

        // Reemplaza con tu companyId y serviceId reales
        const companyId = 'TU_COMPANY_ID';
        const serviceId = 'TU_SERVICE_ID';

        const response = await axios.get(
            `https://api.timify.com/v1/events/availability`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                params: { 
                    companyId,
                    serviceId
                }
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('❌ Error en disponibilidad:', error.response?.data || error.message);
        res.status(500).json({ error: 'Error al consultar disponibilidad' });
    }
});

router.get('/companies', async (req, res) => {
    try {
        const token = await getTimifyToken();
        if (!token) return res.status(500).json({ error: 'Token error' });

        const enterpriseId = '67ea4f04d5b5e2b82079de7c';
        console.log("TOKEN USADO:", token);

        const response = await axios.get('https://api.timify.com/v1/enterprises/{enterpriseId}/companies', {
            headers: {
                Authorization: `Bearer ${token}`
            },
            params: {
                enterprise_id: enterpriseId
            }
        });

        // Extraemos solo los datos necesarios, si quieres devolver todo el array tal cual, puedes omitir este paso
        const companies = response.data?.data?.map(c => ({
            id: c.id,
            name: c.name,
            email: c.contactEmail,
            phone: c.phone?.phone,
            city: c.address?.city || '',
            address: c.address?.formatted || '',
            isOnline: c.onlineStatus?.isOnline,
            timezone: c.timezone
        })) || [];

        res.json(companies);
    } catch (error) {
        console.error('❌ Error al obtener compañías:', error.response?.data || error.message);
        res.status(500).json({ error: 'Error al obtener compañías' });
    }
});


// Obtener servicios de una compañía concreta
router.get('/services/:companyId', async (req, res) => {
    const { companyId } = req.params;

    try {
        const token = await getTimifyToken();
        if (!token) return res.status(500).json({ error: 'Token error' });

        const response = await axios.get(
            `https://api.timify.com/v1/companies/${companyId}/services`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'company-id': companyId
                }
            }
        );


        res.json(response.data);
    } catch (error) {
        console.error('❌ Error al obtener servicios:', error.response?.data || error.message);
        res.status(500).json({ error: 'Error al obtener servicios' });
    }
});

router.get('/debug/token', async (req, res) => {
    try {
        const token = await getTimifyToken();
        res.json({ token }); // <-- devuelve como propiedad `token`
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});




export default router;
