// src/uploadToOneLake.js
import axios from 'axios';

const tenantId = process.env.AZURE_TENANT_ID;
const clientId = process.env.AZURE_CLIENT_ID;
const clientSecret = process.env.AZURE_CLIENT_SECRET;
const baseUrl = process.env.ONELAKE_BASE_URL;

async function getAccessToken() {
  const { data } = await axios.post(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://storage.azure.com/.default",
      grant_type: "client_credentials",
    })
  );
  return data.access_token;
}

export async function uploadJsonToOneLake(jsonData, fileName = "appointments.json") {
  const accessToken = await getAccessToken();
  const jsonString = JSON.stringify(jsonData);
  const filePath = `${baseUrl}/${fileName}`;

  // 1. Crear archivo
  await axios.put(`${filePath}?resource=file`, null, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Length': 0,
    },
  });

  // 2. Subir contenido
  await axios.patch(`${filePath}?action=append&position=0`, jsonString, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(jsonString),
    },
  });

  // 3. Cerrar el archivo
  await axios.patch(`${filePath}?action=flush&position=${Buffer.byteLength(jsonString)}`, null, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  console.log(`✅ Subido a OneLake como: ${fileName}`);
}
