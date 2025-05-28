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
    const [selectedDay, setSelectedDay] = useState(null);

    const [selectedDate, setSelectedDate] = useState(null);

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
        setSelectedDay(null);
        setServices(company?.services || []);
    };

    const handleBackToCompanies = () => {
        setSelectedCompany(null);
        setFieldIds([]);
        setServices([]);
        setSelectedService(null);
        setAvailability([]);
        setSelectedDay(null);
    };

    const handleServiceChange = async (e) => {
        const serviceId = e.target.value;
        const service = services.find(s => s.id === serviceId);
        setSelectedService(service);

        try {
            const res = await fetch(`/api/public-availability?companyId=${selectedCompany.id}&serviceId=${serviceId}`);
            const data = await res.json();
            setAvailability(data);
            setSelectedDay(data.length > 0 ? data[0].day : null);
        } catch (err) {
            console.error('Error cargando disponibilidad:', err);
        }
    };

    const handleTimeSelect = (day, time) => {
        console.log('Hora seleccionada:', day, time);
    };
    const handleDateChange = (date) => {
        setSelectedDate(date);
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
                                                        <button key={time} className="time-slot" onClick={() => handleTimeSelect(selectedDate, time)}>
                                                            {time}
                                                        </button>
                                                    ))}
                                            </div>
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
