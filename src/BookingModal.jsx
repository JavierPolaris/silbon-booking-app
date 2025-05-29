import React, { useEffect, useState } from 'react';
import './BookingModal.css';
import BookingCalendar from './BookingCalendar';

export default function BookingModal() {
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

    const toggleModal = () => setVisible(!visible);

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
        console.log('🧪 Servicio seleccionado:', service);

        try {
            const res = await fetch(`/api/public-availability?companyId=${selectedCompany.id}&serviceId=${serviceId}`);
            const data = await res.json();
            setAvailability(data);
            setSelectedDate(data.length > 0 ? new Date(data[0].day) : null);
        } catch (err) {
            console.error('Error cargando disponibilidad:', err);
        }
    };

    const handleTimeSelect = (day, time) => {
        setSelectedTime(time);
        console.log('Hora seleccionada:', day, time);
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
        console.log('Recursos disponibles:', resourceIds);

        if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
            alert('Este servicio no tiene recursos asignados. No se puede reservar.');
            return;
        }

        const dayString = selectedDate.toLocaleDateString('sv-SE');

        console.log('📤 Enviando reserva con los siguientes datos:');
        console.table({
            companyId: selectedCompany.id,
            serviceId: selectedService.id,
            resourceIds,
            date: dayString,
            time: selectedTime
        });

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
            console.log('📦 Respuesta de book-slot:', result);

            if (!slotRes.ok || !result.data) {
                throw new Error(result.error || 'No se pudo reservar el slot');
            }

            const slotData = result.data.data;

            console.log('📦 Enviando confirmación con:', {
                reservationId: slotData.id,
                secret: slotData.secret,
                companyId: selectedCompany.id,
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                fieldIds
            });

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

            setVisible(false);
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
                                {loadingStores ? (
                                    <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                                        <svg width="36" height="36" viewBox="0 0 100 100">
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="40"
                                                stroke="#ff9b00"
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
                                ) : (
                                    <select onChange={handleCompanyChange} defaultValue="">
                                        <option value="" disabled>Selecciona una tienda</option>
                                        {companies.map(company => (
                                            <option key={company.id} value={company.id}>{company.name}</option>
                                        ))}
                                    </select>
                                )}
                            </>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '1rem' }}>
                                    <button onClick={handleBackToCompanies} style={{ fontSize: '1.5rem', background: 'none', border: 'none' }}>←</button>
                                    <h3>{selectedCompany.name}</h3>
                                </div>

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
                                ) : (
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

                                        {selectedDate && selectedTime && (
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
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                    <div className="booking-overlay" onClick={toggleModal}></div>
                </div>
            )}
        </>
    );
}
import React, { useEffect, useState } from 'react';
import './BookingModal.css';
import BookingCalendar from './BookingCalendar';

export default function BookingModal() {
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

    const toggleModal = () => setVisible(!visible);

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
        console.log('🧪 Servicio seleccionado:', service);

        try {
            const res = await fetch(`/api/public-availability?companyId=${selectedCompany.id}&serviceId=${serviceId}`);
            const data = await res.json();
            setAvailability(data);
            setSelectedDate(data.length > 0 ? new Date(data[0].day) : null);
        } catch (err) {
            console.error('Error cargando disponibilidad:', err);
        }
    };

    const handleTimeSelect = (day, time) => {
        setSelectedTime(time);
        console.log('Hora seleccionada:', day, time);
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
        console.log('Recursos disponibles:', resourceIds);

        if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
            alert('Este servicio no tiene recursos asignados. No se puede reservar.');
            return;
        }

        const dayString = selectedDate.toLocaleDateString('sv-SE');

        console.log('📤 Enviando reserva con los siguientes datos:');
        console.table({
            companyId: selectedCompany.id,
            serviceId: selectedService.id,
            resourceIds,
            date: dayString,
            time: selectedTime
        });

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
            console.log('📦 Respuesta de book-slot:', result);

            if (!slotRes.ok || !result.data) {
                throw new Error(result.error || 'No se pudo reservar el slot');
            }

            const slotData = result.data.data;

            console.log('📦 Enviando confirmación con:', {
                reservationId: slotData.id,
                secret: slotData.secret,
                companyId: selectedCompany.id,
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                fieldIds
            });

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

            setVisible(false);
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
                                {loadingStores ? (
                                    <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                                        <svg width="36" height="36" viewBox="0 0 100 100">
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="40"
                                                stroke="#ff9b00"
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
                                ) : (
                                    <select onChange={handleCompanyChange} defaultValue="">
                                        <option value="" disabled>Selecciona una tienda</option>
                                        {companies.map(company => (
                                            <option key={company.id} value={company.id}>{company.name}</option>
                                        ))}
                                    </select>
                                )}
                            </>
                        ) : (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '1rem' }}>
                                    <button onClick={handleBackToCompanies} style={{ fontSize: '1.5rem', background: 'none', border: 'none' }}>←</button>
                                    <h3>{selectedCompany.name}</h3>
                                </div>

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
                                ) : (
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

                                        {selectedDate && selectedTime && (
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
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                    <div className="booking-overlay" onClick={toggleModal}></div>
                </div>
            )}
        </>
    );
}
