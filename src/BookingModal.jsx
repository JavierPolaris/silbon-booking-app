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
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedCompany, setSelectedCompany] = useState(null);
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
        setSelectedCity('');
        setSelectedCompany(null);
        setServices([]);
        setSelectedService(null);
        setAvailability([]);
        setSelectedDate(null);
        setSelectedTime(null);
        setConfirmationMessage('');
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
            fetch('/api/public-companies')
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

    const branchesByCity = companies
        .filter(company => company.city && (allowedStores.length === 0 || allowedStores.includes(company.id)))
        .reduce((acc, branch) => {
            if (!acc[branch.city]) acc[branch.city] = [];
            acc[branch.city].push(branch);
            return acc;
        }, {});

    const handleCompanySelect = async (companyId) => {
        const company = companies.find(c => c.id === companyId);
        setSelectedCompany(company);
        setSelectedService(null);
        setAvailability([]);
        setSelectedDate(null);
        setSelectedTime(null);

        try {
            const res = await fetch(`/api/public-branches-services?companyId=${companyId}`);
            const data = await res.json();
            setServices(data?.services || []);
        } catch (err) {
            console.error('Error cargando servicios:', err);
        }
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        const resourceIds = selectedCompany?.resources?.map(r => r.id) || [];
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
            if (!result.data) throw new Error(result.error);

            const slotData = result.data.data;
            await fetch('/api/confirm-appointment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reservationId: slotData.id,
                    secret: slotData.secret,
                    companyId: selectedCompany.id,
                    ...formData,
                    fieldIds: []
                })
            });

            setConfirmationMessage('¡Tu cita ha sido confirmada!');
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
                        <button onClick={closeModal} style={{ position: 'absolute', top: '10px', right: '30px' }} aria-label="Cerrar">
                            <svg fill="none" width="24" height="24" viewBox="0 0 16 16" style={{ color: closeButtonColor }}>
                                <path d="M1 1L15 15M1 15L15 1" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                        </button>

                        <div className="booking-sidebar-content">
                            {headerImage && <div className="booking-header-image"><img src={headerImage} alt="Imagen cabecera" /></div>}
                            <h2>Reserva tu cita</h2>

                            {confirmationMessage ? (
                                <div className="confirmation-message"><p>{confirmationMessage}</p></div>
                            ) : !selectedCompany ? (
                                <>
                                    {selectedCity ? (
                                        <>
                                            <button onClick={() => setSelectedCity('')} style={{ background: 'none' }}>← Cambiar ciudad</button>
                                            {branchesByCity[selectedCity].map(company => (
                                                <button key={company.id} onClick={() => handleCompanySelect(company.id)}>
                                                    {company.name}
                                                </button>
                                            ))}
                                        </>
                                    ) : (
                                        <>
                                            <select onChange={(e) => setSelectedCity(e.target.value)} defaultValue="">
                                                <option value="" disabled>Selecciona ciudad</option>
                                                {Object.keys(branchesByCity).map(city => (
                                                    <option key={city} value={city}>{city}</option>
                                                ))}
                                            </select>
                                        </>
                                    )}
                                </>
                            ) : (
                                <>
                                    {!selectedService ? (
                                        <>
                                            <button onClick={() => setSelectedCompany(null)} style={{ background: 'none' }}>← Cambiar tienda</button>
                                            <h3>{selectedCompany.name}</h3>
                                            <select onChange={handleServiceChange} defaultValue="">
                                                <option value="" disabled>Selecciona un servicio</option>
                                                {services.map(service => (
                                                    <option key={service.id} value={service.id}>{service.name}</option>
                                                ))}
                                            </select>
                                        </>
                                    ) : loadingAvailability ? (
                                        <div>Cargando disponibilidad...</div>
                                    ) : !selectedTime ? (
                                        <>
                                            <BookingCalendar availableDates={availability} selectedDate={selectedDate} onDateChange={setSelectedDate} onTimeSelect={setSelectedTime} />
                                            {selectedDate && (
                                                <div className="calendar-times">
                                                    {availability.find(d => new Date(d.day).toDateString() === selectedDate.toDateString())
                                                        ?.times.map(time => (
                                                            <button key={time} onClick={() => setSelectedTime(time)}>
                                                                {time}
                                                            </button>
                                                        ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="booking-form">
                                            <h4>Introduce tus datos</h4>
                                            <input name="firstName" required placeholder="Nombre" onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))} />
                                            <input name="lastName" required placeholder="Apellidos" onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))} />
                                            <input name="email" type="email" required placeholder="Email" onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} />
                                            <input name="phoneNumber" required placeholder="Teléfono" onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))} />
                                            <textarea name="notes" placeholder="¿Quieres decirnos algo?" onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} />
                                            <button type="submit">Confirmar cita</button>
                                        </form>
                                    )}
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
