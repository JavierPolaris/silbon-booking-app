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
    const [selectedCity, setSelectedCity] = useState('');
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '', notes: '' });
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState('');

    const formatDate = (date) => date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const openModal = () => setVisible(true);
    const closeModal = () => {
        setVisible(false);
        setConfirmationMessage('');
        setSelectedCompany(null);
        setSelectedService(null);
        setAvailability([]);
        setSelectedDate(null);
        setSelectedTime(null);
        setFormData({ firstName: '', lastName: '', email: '', phoneNumber: '', notes: '' });
        setSelectedCity('');
    };

    useEffect(() => {
        const listener = (e) => { if (e.data === 'openBookingModal') openModal(); };
        window.addEventListener('message', listener);
        return () => window.removeEventListener('message', listener);
    }, []);

    useEffect(() => {
        if (visible && companies.length === 0) {
            setLoadingStores(true);
            fetch('/api/public-branches-services')
                .then(res => res.json())
                .then(data => { setCompanies(data); setLoadingStores(false); })
                .catch(err => { console.error('Error cargando sucursales:', err); setLoadingStores(false); });
        }
    }, [visible]);

    const allowedCompanies = companies.filter(company => allowedStores.length === 0 || allowedStores.includes(company.id));
    const companiesWithCity = allowedCompanies.filter(company => company.city && company.city.trim() !== '');
    const branchesByCity = companiesWithCity.reduce((acc, branch) => { if (!acc[branch.city]) acc[branch.city] = []; acc[branch.city].push(branch); return acc; }, {});

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

    const handleDirectCompanySelect = (companyId) => {
        const company = companies.find(c => c.id === companyId);
        setSelectedCompany(company);
        setFieldIds(company?.customerFields || []);
        setSelectedService(null);
        setAvailability([]);
        setSelectedDate(null);
        setSelectedTime(null);
        setServices(company?.services || []);
    };

    return (
        <>
            {visible && (
                <div className="booking-modal">
                    <div className="booking-sidebar" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => { closeModal(); setTimeout(() => { window.parent.postMessage('bookingModalClose', '*'); }, 300); }} style={{ position: 'absolute', top: '10px', right: '30px', background: 'none', border: 'none', padding: '0', cursor: 'pointer' }} aria-label="Cerrar">
                            <svg aria-hidden="true" focusable="false" fill="none" width="24" height="24" viewBox="0 0 16 16" style={{ color: closeButtonColor }}>
                                <path d="M1 1L15 15M1 15L15 1" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                        </button>

                        <div className="booking-sidebar-content">
                            {headerImage && (<div className="booking-header-image"><img src={headerImage} alt="Imagen cabecera" /></div>)}
                            <h2>Reserva tu cita</h2>

                            {!selectedCompany && (
                                <>
                                    <p>Selecciona tu tienda más cercana</p>
                                    {loadingStores ? (
                                        <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                                            <svg width="36" height="36" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="40" stroke="#000" strokeWidth="10" fill="none" strokeDasharray="188.5" strokeDashoffset="188.5">
                                                    <animate attributeName="stroke-dashoffset" values="188.5;0" dur="1s" repeatCount="indefinite" />
                                                </circle>
                                            </svg>
                                        </div>
                                    ) : Object.keys(branchesByCity).length > 0 ? (
                                        <>
                                            <select onChange={(e) => setSelectedCity(e.target.value)} value={selectedCity}>
                                                <option value="">Selecciona ciudad</option>
                                                {Object.keys(branchesByCity).map(city => (<option key={city} value={city}>{city}</option>))}
                                            </select>
                                            {selectedCity && branchesByCity[selectedCity].map(company => (
                                                <button key={company.id} onClick={() => handleDirectCompanySelect(company.id)} style={{ display: 'block', marginTop: '0.5rem' }}>{company.name}</button>
                                            ))}
                                        </>
                                    ) : (
                                        <select onChange={handleCompanyChange} defaultValue="">
                                            <option value="" disabled>Selecciona una tienda</option>
                                            {allowedCompanies.map(company => (<option key={company.id} value={company.id}>{company.name}</option>))}
                                        </select>
                                    )}
                                </>
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
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="40"
                                                    stroke="#000"
                                                    strokeWidth="10"
                                                    fill="none"
                                                    strokeDasharray="188.5"
                                                    strokeDashoffset="188.5"
                                                >
                                                    <animate
                                                        attributeName="stroke-dashoffset"
                                                        values="188.5;0"
                                                        dur="1s"
                                                        repeatCount="indefinite"
                                                    />
                                                </circle>
                                            </svg>
                                        </div>
                                    ) : !selectedTime ? (
                                        <>
                                            <h3 style={{ marginTop: '1rem' }}>{selectedService.name}</h3>
                                            <BookingCalendar
                                                availableDates={availability}
                                                selectedDate={selectedDate}
                                                onDateChange={handleDateChange}
                                                onTimeSelect={handleTimeSelect}
                                            />

                                            {selectedDate && (
                                                <div className="calendar-times">
                                                    {availability
                                                        .find(d => new Date(d.day).toDateString() === selectedDate.toDateString())
                                                        ?.times.map(time => (
                                                            <button
                                                                key={time}
                                                                className={`time-slot ${time === selectedTime ? 'selected' : ''}`}
                                                                onClick={() => handleTimeSelect(selectedDate, time)}
                                                            >
                                                                {time}
                                                            </button>
                                                        ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <div className="booking-summary">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedTime(null)}
                                                    style={{ background: 'none', border: 'none', fontSize: '1.2rem', padding: 0, marginBottom: '1rem', cursor: 'pointer' }}
                                                >
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
                                                <textarea
                                                    name="notes"
                                                    placeholder="¿Quieres decirnos algo?"
                                                    onChange={handleInputChange}
                                                />
                                                <button type="submit">Confirmar cita</button>
                                            </form>
                                        </>
                                    )}
                                </>
                            )}
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
