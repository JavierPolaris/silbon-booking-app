import React, { useEffect, useState } from 'react';
import './BookingModal.css';
import BookingCalendar from './BookingCalendar';

export default function BookingModal() {
  const urlParams = new URLSearchParams(window.location.search);
  const allowedStores = urlParams.get("allowedStores")?.split(",") || [];
  const headerImage = urlParams.get("headerImage");
  const closeButtonColor = urlParams.get("closeButtonColor") || 'black';

  const [visible, setVisible] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [fieldIds, setFieldIds] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    notes: ''
  });
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');

  const formatDate = (date) =>
    date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const openModal = () => setVisible(true);
  const closeModal = () => {
    setVisible(false);
    setConfirmationMessage('');
    setSelectedCompany(null);
    setSelectedService(null);
    setAvailability([]);
    setSelectedDate(null);
    setSelectedTime(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      notes: ''
    });
  };

  useEffect(() => {
    const listener = (e) => {
      if (e.data === 'openBookingModal') openModal();
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);

  useEffect(() => {
    if (visible && companies.length === 0) {
      setLoadingStores(true);
      fetch('/api/public-branches-services')
        .then(res => res.json())
        .then(data => {
          setCompanies(data);
          setLoadingStores(false);
        })
        .catch(err => {
          console.error('Error cargando sucursales:', err);
          setLoadingStores(false);
        });
    }
  }, [visible]);

  const handleCompanyChange = (e) => {
    const companyId = e.target.value;
    const company = companies.find(c => c.id === companyId);
    setSelectedCompany(company);
    setFieldIds(company?.customerFields || []);
    setSelectedService(null);
    setAvailability([]);
    setSelectedDate(null);
    setSelectedTime(null);
    setServices(company?.services || []);
  };

  const handleBackToCompanies = () => {
    setSelectedCompany(null);
    setFieldIds([]);
    setServices([]);
    setSelectedService(null);
    setAvailability([]);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleServiceChange = async (e) => {
    const serviceId = e.target.value;
    const service = services.find(s => s.id === serviceId);
    setSelectedService(service);
    setLoadingAvailability(true);

    try {
      const res = await fetch(`/api/public-availability?companyId=${selectedCompany.id}&serviceId=${serviceId}`);
      const data = await res.json();
      setAvailability(data);
      setSelectedDate(data.length > 0 ? new Date(data[0].day) : null);
    } catch (err) {
      console.error('Error cargando disponibilidad:', err);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleTimeSelect = (day, time) => {
    setSelectedTime(time);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleInputChange = e => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCompany || !selectedService || !selectedDate || !selectedTime) {
      alert('Faltan campos obligatorios');
      return;
    }

    const resourceIds = selectedCompany?.resources?.map(r => r.id) || [];

    if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
      alert('Este servicio no tiene recursos asignados. No se puede reservar.');
      return;
    }

    const dayString = selectedDate.toLocaleDateString('sv-SE');

    try {
      const slotRes = await fetch('/api/book-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompany.id,
          serviceId: selectedService.id,
          resourceIds,
          date: dayString,
          time: selectedTime
        })
      });

      const result = await slotRes.json();
      if (!slotRes.ok || !result.data) {
        throw new Error(result.error || 'No se pudo reservar el slot');
      }

      const slotData = result.data.data;

      await fetch('/api/confirm-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId: slotData.id,
          secret: slotData.secret,
          companyId: selectedCompany.id,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          notes: formData.notes,
          fieldIds
        })
      });

      setConfirmationMessage('¡Tu cita ha sido confirmada! Te hemos enviado un correo con los detalles.');

      setTimeout(() => {
        window.parent.postMessage('bookingModalClose', '*');
      }, 500);

    } catch (error) {
      console.error('❌ Error al confirmar cita:', error);
    }
  };

  return (
    <>
      {visible && (
        <div className="booking-modal">
          <button
            className="modal-close-button"
            onClick={() => {
              closeModal();
              setTimeout(() => {
                window.parent.postMessage('bookingModalClose', '*');
              }, 300);
            }}
            aria-label="Cerrar"
          >
            <svg aria-hidden="true" focusable="false" fill="none" width="24" height="24" viewBox="0 0 16 16" style={{ color: closeButtonColor }}>
              <path d="M1 1L15 15M1 15L15 1" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>

          <div className="booking-scroll-container">
            <div className="booking-sidebar">
              {headerImage && (
                <div className="booking-header-image">
                  <img src={headerImage} alt="Imagen cabecera" />
                </div>
              )}
              <div className="booking-sidebar-content">
                {/* CONTENIDO ORIGINAL AQUÍ, sin cambios */}
              </div>
            </div>
          </div>

          <div
            className="booking-overlay"
            onClick={() => {
              closeModal();
              setTimeout(() => {
                window.parent.postMessage('bookingModalClose', '*');
              }, 300);
            }}
          ></div>
        </div>
      )}
    </>
  );
}
