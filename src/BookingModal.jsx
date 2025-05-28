import { useEffect, useState } from 'react';
import './BookingModal.css';

export default function BookingModal() {
  const [visible, setVisible] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [fieldIds, setFieldIds] = useState([]);
  const [services, setServices] = useState([]);

  const toggleModal = () => setVisible(!visible);

  useEffect(() => {
    // Carga todas las tiendas al abrir el modal
    if (visible && companies.length === 0) {
      fetch('/api/public-branches-services')
        .then(res => res.json())
        .then(data => setCompanies(data))
        .catch(err => console.error('Error cargando sucursales:', err));
    }
  }, [visible]);

  const handleCompanyChange = async (e) => {
    const companyId = e.target.value;
    setSelectedCompanyId(companyId);

    const selectedCompany = companies.find(c => c.id === companyId);
    if (selectedCompany) {
      setFieldIds(selectedCompany.customerFields);
    }

    try {
      const res = await fetch(`/api/public-availability?company_id=${companyId}`);
      const data = await res.json();
      setServices(data.services || []);
    } catch (err) {
      console.error('Error cargando servicios:', err);
    }
  };

  return (
    <>
      <button className="booking-toggle-button" onClick={toggleModal}>
        Reservar Cita en Tienda
      </button>

      {visible && (
        <div className="booking-modal">
          <div className="booking-sidebar">
            <h2>Reserva tu cita</h2>
            <p>Selecciona tu tienda más cercana</p>

            {/* Select de tiendas */}
            <select onChange={handleCompanyChange} defaultValue="">
              <option value="" disabled>Selecciona una tienda</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>

            {/* Mostrar ID de la tienda */}
            {selectedCompanyId && (
              <>
                <p><strong>Company ID:</strong> {selectedCompanyId}</p>

                <h4>Field IDs:</h4>
                <ul>
                  {fieldIds.map(field => (
                    <li key={field.id}>
                      <strong>{field.type}</strong> → {field.translationKey} → {field.id}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Selector de servicios */}
            {services.length > 0 && (
              <>
                <h4>Selecciona un servicio:</h4>
                <select>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          <div className="booking-overlay" onClick={toggleModal}></div>
        </div>
      )}
    </>
  );
}
