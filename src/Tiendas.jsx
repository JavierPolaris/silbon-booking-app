import React, { useEffect, useState } from 'react';
import './Tiendas.css'; // Puedes crear este CSS para estilos personalizados

export default function Tiendas() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public-branches-services')
      .then(res => res.json())
      .then(data => {
        setCompanies(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando tiendas:', err);
        setLoading(false);
      });
  }, []);

  const copyToClipboard = (id) => {
    navigator.clipboard.writeText(id)
      .then(() => alert('ID copiado: ' + id))
      .catch(err => console.error('Error al copiar:', err));
  };

  return (
    <div className="tiendas-container">
      <h1>Listado de Tiendas disponibles en Timify</h1>
      <p style={{ marginBottom: '1rem' }}>Haz clic en el icono para copiar el ID de la tienda.</p>

      {loading ? (
        <p>Cargando tiendas...</p>
      ) : (
        <table className="tiendas-table">
          <thead>
            <tr>
              <th>Nombre de Tienda</th>
              <th>ID Timify</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id}>
                <td>{company.name}</td>
                <td><code>{company.id}</code></td>
                <td>
                  <button
                    className="copy-button"
                    onClick={() => copyToClipboard(company.id)}
                  >
                    📋
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
