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
    const [selectedCity, setSelectedCity] = useState('');
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
        resetAll();
    };

    const resetAll = () => {
        setSelectedCity('');
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
        setConfirmationMessage('');
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
            fetch('/api/public-companies')
                .then(res => res.json())
                .then(data => setCompanies(data))
                .catch(err => console.error('Error cargando sucursales:', err));
        }
    }, [visible]);

    const allowedCompanies = companies.filter(company =>
        allowedStores.length === 0 || allowedStores.includes(company.id)
    );

    const branchesByCity = allowedCompanies.reduce((acc, branch) => {
        if (!acc[branch.city]) acc[branch.city] = [];
        acc[branch.city].push(branch);
        return acc;
    }, {});

    const handleCitySelect = (city) => {
        setSelectedCity(city);
        setSelectedCompany(null);
        setSelectedService(null);
        setAvailability([]);
    };

    const handleCompanySelect = async (companyId) => {
        const company = allowedCompanies.find(c => c.id === companyId);
        setSelectedCompany(company);
        setFieldIds(company?.customerFields || []);
        setSelectedService(null);
        setAvailability([]);
        setSelectedDate(null);
        setSelectedTime(null);
        try {
            const res = await fetch(`/api/public-branches-services?companyId=${companyId}`);
            const data = await res.json();
            setServices(data.services || []);
        } catch (err) {
            console.error('Error al cargar servicios:', err);
        }
    };

    const handleServiceSelect = async (serviceId) => {
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCompany || !selectedService || !selectedDate || !selectedTime) {
            alert('Faltan campos obligatorios');
            return;
        }
        const resourceIds = selectedCompany?.resources?.map(r => r.id) || [];
        if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
            alert('Este servicio no tiene recursos asignados.');
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
                    ...formData,
                    fieldIds
                })
            });
            setConfirmationMessage('¡Tu cita ha sido confirmada! Te hemos enviado un correo.');
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
                    <div className="booking-sidebar" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => { closeModal(); setTimeout(() => { window.parent.postMessage('bookingModalClose', '*'); }, 300); }} style={{ position: 'absolute', top: '10px', right: '30px', background: 'none', border: 'none' }}>
                            <svg fill="none" width="24" height="24" viewBox="0 0 16 16" style={{ color: closeButtonColor }}><path d="M1 1L15 15M1 15L15 1" stroke="currentColor" strokeWidth="1.5" /></svg>
                        </button>

                        <div className="booking-sidebar-content">
                            {headerImage && <div className="booking-header-image"><img src={headerImage} alt="Imagen cabecera" /></div>}
                            <h2>Reserva tu cita</h2>

                            {confirmationMessage ? (
                                <p>{confirmationMessage}</p>
                            ) : !selectedCity ? (
                                <>
                                    <p>Selecciona tu ciudad</p>
                                    {Object.keys(branchesByCity).map(city => (
                                        <button key={city} onClick={() => handleCitySelect(city)}>{city}</button>
                                    ))}
                                </>
                            ) : !selectedCompany ? (
                                <>
                                    <button onClick={() => setSelectedCity('')}>← Volver a ciudades</button>
                                    <p>Selecciona tu tienda en {selectedCity}</p>
                                    {branchesByCity[selectedCity].map(company => (
                                        <button key={company.id} onClick={() => handleCompanySelect(company.id)}>{company.name}</button>
                                    ))}
                                </>
                            ) : !selectedService ? (
                                <>
                                    <button onClick={() => setSelectedCompany(null)}>← Volver a tiendas</button>
                                    <h3>{selectedCompany.name}</h3>
                                    <p>Selecciona un servicio</p>
                                    {services.map(service => (
                                        <button key={service.id} onClick={() => handleServiceSelect(service.id)}>{service.name}</button>
                                    ))}
                                </>
                            ) : loadingAvailability ? (
                                <p>Cargando disponibilidad...</p>
                            ) : !selectedTime ? (
                                <>
                                    <button onClick={() => setSelectedService(null)}>← Volver a servicios</button>
                                    <BookingCalendar availableDates={availability} selectedDate={selectedDate} onDateChange={setSelectedDate} onTimeSelect={(day, time) => setSelectedTime(time)} />
                                    {selectedDate && (
                                        <div className="calendar-times">
                                            {availability.find(d => new Date(d.day).toDateString() === selectedDate.toDateString())?.times.map(time => (
                                                <button key={time} className={`time-slot ${time === selectedTime ? 'selected' : ''}`} onClick={() => setSelectedTime(time)}>{time}</button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setSelectedTime(null)}>← Cambiar hora</button>
                                    <h3>{selectedCompany.name}</h3>
                                    <p><strong>Servicio:</strong> {selectedService.name}</p>
                                    <p><strong>Fecha:</strong> {formatDate(selectedDate)}</p>
                                    <p><strong>Hora:</strong> {selectedTime}</p>
                                    <form onSubmit={handleSubmit} className="booking-form">
                                        <input name="firstName" required placeholder="Nombre" onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))} />
                                        <input name="lastName" required placeholder="Apellidos" onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))} />
                                        <input name="email" type="email" required placeholder="Email" onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} />
                                        <input name="phoneNumber" required placeholder="Teléfono" onChange={e => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))} />
                                        <textarea name="notes" placeholder="¿Algo que quieras añadir?" onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))} />
                                        <button type="submit">Confirmar cita</button>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="booking-overlay" onClick={closeModal}></div>
                </div>
            )}
        </>
    );
}
