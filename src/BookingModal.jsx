import React, { useEffect, useState } from 'react';
import './BookingModal.css';
import BookingCalendar from './BookingCalendar';

export default function BookingModal() {
    const [visible, setVisible] = useState(false);
    const [companies, setCompanies] = useState([]);
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
            fetch('/api/public-branches-services')
                .then(res => res.json())
                .then(setCompanies)
                .catch(err => console.error('Error cargando sucursales:', err));
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
        setSelectedDate(day);
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
        if (!selectedCompany || !selectedService || !selectedDate || !selectedTime) return;
        console.log('📋 Datos a enviar:', {
            companyId: selectedCompany.id,
            serviceId: selectedService.id,
            resourceIds: selectedService.resource_ids,
            date: new Date(selectedDate).toISOString().split('T')[0],
            time: selectedTime
        });
        try {
            // Paso 1: reservar slot
            const slotRes = await fetch('/api/book-slot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyId: selectedCompany.id,
                    serviceId: selectedService.id,
                    resourceIds: selectedService.resource_ids, // 👈 AÑADIDO NECESARIO
                    date: new Date(selectedDate).toISOString().split('T')[0],
                    time: selectedTime
                })
            });

            const result = await slotRes.json();
            console.log('📦 Respuesta de book-slot:', result);

            if (!slotRes.ok || !result.data) {
                throw new Error(result.error || 'No se pudo reservar el slot');
            }

            const slotData = result.data;


            // Paso 2: confirmar cita
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


            alert('Cita confirmada con éxito');
            setVisible(false);
        } catch (err) {
            console.error('Error al confirmar cita:', err);
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
                                <select onChange={handleCompanyChange} defaultValue="">
                                    <option value="" disabled>Selecciona una tienda</option>
                                    {companies.map(company => (
                                        <option key={company.id} value={company.id}>{company.name}</option>
                                    ))}
                                </select>
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
                                                        <button key={time} className={`time-slot ${time === selectedTime ? 'selected' : ''}`} onClick={() => handleTimeSelect(selectedDate, time)}>
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
