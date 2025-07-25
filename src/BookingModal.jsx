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
    const [selectedCity, setSelectedCity] = useState(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        notes: ''
    });
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState('');

    const allowedCompanies = companies.filter(company =>
        allowedStores.length === 0 || allowedStores.includes(company.id)
    );

    const cities = [...new Set(allowedCompanies.map(company => company.city).filter(Boolean))];
    const filteredCompanies = allowedCompanies.filter(company => company.city === selectedCity);

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
            Promise.all([
                fetch('/api/public-branches-services').then(res => res.json()),
                fetch('/api/public-companies').then(res => res.json())
            ])
                .then(([branchesData, companiesData]) => {
                    const companiesWithCity = branchesData.map(branch => {
                        const matchingCompany = companiesData.find(c => c.id === branch.id);
                        return {
                            ...branch,
                            city: matchingCompany?.city || null
                        };
                    });
                    setCompanies(companiesWithCity);
                    setLoadingStores(false);
                })
                .catch(err => {
                    console.error('❌ Error cargando sucursales:', err);
                    setLoadingStores(false);
                });
        }
    }, [visible]);

    const handleCityChange = (e) => {
        setSelectedCity(e.target.value);
        setSelectedCompany(null);
        setServices([]);
        setSelectedService(null);
    };

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
            console.error('❌ Error al confirmar cita:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
        }
    };

    return (
        <>
            {visible && (
                <div className="booking-modal">
                    <div className="booking-sidebar" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => {
                                closeModal();
                                setTimeout(() => {
                                    window.parent.postMessage('bookingModalClose', '*');
                                }, 300);
                            }}
                            style={{
                                position: 'absolute',
                                top: '10px',
                                right: '30px',
                                background: 'none',
                                border: 'none',
                                padding: '0',
                                cursor: 'pointer'
                            }}
                            aria-label="Cerrar"
                        >
                            <svg aria-hidden="true" focusable="false" fill="none" width="24" height="24" viewBox="0 0 16 16" style={{ color: closeButtonColor }}>
                                <path d="M1 1L15 15M1 15L15 1" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                        </button>

                        <div className="booking-sidebar-content">
                            {headerImage && (
                                <div className="booking-header-image">
                                    <img src={headerImage} alt="Imagen cabecera" />
                                </div>
                            )}
                            <h2>Reserva tu cita</h2>

                            {confirmationMessage ? (
                                <div className="confirmation-message">
                                    <p>{confirmationMessage}</p>
                                </div>
                            ) : !selectedCompany ? (
                                <>
                                    {cities.length > 0 && !selectedCity ? (
                                        <>
                                            <p>Selecciona tu ciudad</p>
                                            {loadingStores ? (
                                                <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                                                    <svg width="36" height="36" viewBox="0 0 100 100">
                                                        <circle cx="50" cy="50" r="40" stroke="#000" strokeWidth="10" fill="none" strokeDasharray="188.5" strokeDashoffset="188.5">
                                                            <animate attributeName="stroke-dashoffset" values="188.5;0" dur="1s" repeatCount="indefinite" />
                                                        </circle>
                                                    </svg>
                                                </div>
                                            ) : (
                                                <select onChange={handleCityChange} defaultValue="">
                                                    <option value="" disabled>Selecciona una ciudad</option>
                                                    {cities.map(city => (
                                                        <option key={city} value={city}>{city}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {cities.length > 0 && (
                                                <button onClick={() => setSelectedCity(null)} style={{ marginBottom: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                    ← Volver a ciudades
                                                </button>
                                            )}
                                            <p>Selecciona tu tienda más cercana</p>
                                            {loadingStores ? (
                                                <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                                                    <svg width="36" height="36" viewBox="0 0 100 100">
                                                        <circle cx="50" cy="50" r="40" stroke="#000" strokeWidth="10" fill="none" strokeDasharray="188.5" strokeDashoffset="188.5">
                                                            <animate attributeName="stroke-dashoffset" values="188.5;0" dur="1s" repeatCount="indefinite" />
                                                        </circle>
                                                    </svg>
                                                </div>
                                            ) : (
                                                <select onChange={handleCompanyChange} defaultValue="">
                                                    <option value="" disabled>Selecciona una tienda</option>
                                                    {(cities.length > 0 ? filteredCompanies : allowedCompanies).map(company => (
                                                        <option key={company.id} value={company.id}>{company.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </>
                                    )}
                                </>
                            ) : (
                                <>
                                    {selectedCompany && !selectedTime && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '1rem' }}>
                                            <button onClick={handleBackToCompanies} style={{ fontSize: '1.5rem', background: 'none', border: 'none' }}>←</button>
                                            <h3>{selectedCompany.name}</h3>
                                        </div>
                                    )}
                                    {!selectedService ? (
                                        <>
                                            <h4 style={{ marginTop: '1rem' }}>Selecciona un servicio:</h4>
                                            <select onChange={handleServiceChange} defaultValue="">
                                                <option value="" disabled>Selecciona un servicio</option>
                                                {services.map(service => (
                                                    <option key={service.id} value={service.id}>{service.name}</option>
                                                ))}
                                            </select>
                                        </>
                                    ) : loadingAvailability ? (
                                        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                                            <svg width="48" height="48" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="40" stroke="#000" strokeWidth="10" fill="none" strokeDasharray="188.5" strokeDashoffset="188.5">
                                                    <animate attributeName="stroke-dashoffset" values="188.5;0" dur="1s" repeatCount="indefinite" />
                                                </circle>
                                            </svg>
                                        </div>
                                    ) : !selectedTime ? (
                                        <>
                                            <h3 style={{ marginTop: '1rem' }}>{selectedService.name}</h3>
                                            <BookingCalendar availableDates={availability} selectedDate={selectedDate} onDateChange={handleDateChange} onTimeSelect={handleTimeSelect} />
                                            {selectedDate && (
                                                <div className="calendar-times">
                                                    {availability.find(d => new Date(d.day).toDateString() === selectedDate.toDateString())?.times.map(time => (
                                                        <button key={time} className={`time-slot ${time === selectedTime ? 'selected' : ''}`} onClick={() => handleTimeSelect(selectedDate, time)}>
                                                            {time}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <div className="booking-summary">
                                                <button type="button" onClick={() => setSelectedTime(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', padding: 0, marginBottom: '1rem', cursor: 'pointer' }}>
                                                    ← Cambiar día u hora
                                                </button>
                                                <h3 style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '1rem' }}>{selectedCompany.name}</h3>
                                                <p><strong>Servicio:</strong> {selectedService.name}</p>
                                                <p><strong>Fecha:</strong> {formatDate(selectedDate)}</p>
                                                <p><strong>Hora:</strong> {selectedTime}</p>
                                            </div>
                                            <form onSubmit={handleSubmit} className="booking-form">
                                                <h4>Introduce tus datos</h4>
                                                <input name="firstName" required placeholder="Nombre" onChange={handleInputChange} />
                                                <input name="lastName" required placeholder="Apellidos" onChange={handleInputChange} />
                                                <input name="email" type="email" required placeholder="Email" onChange={handleInputChange} />
                                                <input name="phoneNumber" required placeholder="Teléfono" onChange={handleInputChange} />
                                                <textarea name="notes" placeholder="¿Quieres decirnos algo?" onChange={handleInputChange} />
                                                <button type="submit">Confirmar cita</button>
                                            </form>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    <div className="booking-overlay" onClick={() => {
                        closeModal();
                        setTimeout(() => {
                            window.parent.postMessage('bookingModalClose', '*');
                        }, 300);
                    }}></div>
                </div>
            )}
        </>
    );
}
