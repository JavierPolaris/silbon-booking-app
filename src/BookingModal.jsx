import React, { useEffect, useState } from 'react';
import './BookingModal.css';

export default function BookingModal() {
  const [visible, setVisible] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [fieldIds, setFieldIds] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [availability, setAvailability] = useState([]);

  const toggleModal = () => setVisible(!visible);

  useEffect(() => {
    if (visible && companies.length === 0) {
      fetch('/api/public-branches-services')
        .then(res => res.json())
        .then(data => setCompanies(data))
        .catch(err => console.error('Error cargando sucursales:', err));
    }
  }, [visible]);

  const handleCompanyChange = async (e) => {
    const companyId = e.target.value;
    const company = companies.find(c => c.id === companyId);
    setSelectedCompany(company);
    setFieldIds(company.customerFields);

    try {
      const res = await fetch(`/api/public-availability?companyId=${companyId}&serviceId=`);
      const data = await res.json();
      setServices(data.services || []);
    } catch (err) {
      console.error('Error cargando servicios:', err);
    }
  };

  const handleServiceChange = async (e) => {
    const serviceId = e.target.value;
    const selected = services.find(s => s.id === serviceId);
    setSelectedService(selected);

    try {
      const res = await fetch(`/api/public-availability?companyId=${selectedCompany.id}&serviceId=${serviceId}`);
      const data = await res.json();
      setAvailability(data || []);
    } catch (err) {
      console.error('Error obteniendo disponibilidad:', err);
    }
  };

  const resetCompany = () => {
    setSelectedCompany(null);
    setServices([]);
    setSelectedService(null);
    setAvailability([]);
  };

  const resetService = () => {
    setSelectedService(null);
    setAvailability([]);
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

            {!selectedCompany ? (
              <>
                <p>Selecciona tu tienda más cercana</p>
                <select onChange={handleCompanyChange} defaultValue="">
                  <option value="" disabled>Selecciona una tienda</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <button className="back-button" onClick={resetCompany}>←</button>
                <h3>{selectedCompany.name}</h3>
              </>
            )}

            {selectedCompany && !selectedService && services.length > 0 && (
              <>
                <h4>Selecciona un servicio:</h4>
                <select onChange={handleServiceChange} defaultValue="">
                  <option value="" disabled>Selecciona un servicio</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </>
            )}

            {selectedService && (
              <>
                <button className="back-button" onClick={resetService}>←</button>
                <h3>{selectedService.name}</h3>

                <h4>Fechas y horas disponibles:</h4>
                <ul>
                  {availability.map((day, index) => (
                    <li key={index}>
                      <strong>{day.day}</strong>: {day.times.join(', ')}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="booking-overlay" onClick={toggleModal}></div>
        </div>
      )}
    </>
  );
}
