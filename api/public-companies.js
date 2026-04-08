// api/public-companies.js
import axios from 'axios';
import { getTimifyToken } from '../utils/getToken.js';

const CITY_ALIASES = {
  alicante: 'Alicante',
  alacant: 'Alicante',
  'alicante alacant': 'Alicante',
  'a coruna': 'A Coruña',
  'la coruna': 'A Coruña',
  coruna: 'A Coruña',
  donostia: 'San Sebastian',
  'san sebastian': 'San Sebastian',
  'san sebastian donostia': 'San Sebastian',
  'donostia san sebastian': 'San Sebastian',
  vitoria: 'Vitoria',
  gasteiz: 'Vitoria',
  'vitoria gasteiz': 'Vitoria',
  lleida: 'Lleida',
  lerida: 'Lleida',
  orense: 'Ourense',
  ourense: 'Ourense',
  gerona: 'Girona',
  girona: 'Girona'
};

function normalizeCityKey(value) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[\/,-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCityName(value) {
  const normalizedKey = normalizeCityKey(value);
  return CITY_ALIASES[normalizedKey] || value || '';
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  try {
    const token = await getTimifyToken();
    const enterpriseId = process.env.TIMIFY_ENTERPRISE_ID;

    const response = await axios.get('https://api.timify.com/v1/companies', {
      headers: {
        accept: 'application/json',
        authorization: token
      },
      params: {
        enterprise_id: enterpriseId
      }
    });

    const companies = response.data?.data?.map((company) => ({
      id: company.id,
      name: company.name,
      email: company.contactEmail,
      phone: company.phone?.phone,
      city: normalizeCityName(company.address?.city),
      address: company.address?.formatted || '',
      isOnline: company.onlineStatus?.isOnline,
      timezone: company.timezone
    })) || [];

    return res.status(200).json(companies);
  } catch (err) {
    console.error('Error al obtener companias:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Error al obtener companias' });
  }
}
