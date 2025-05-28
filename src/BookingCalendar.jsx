// src/BookingCalendar.jsx
import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './BookingCalendar.css';

export default function BookingCalendar({ availableDates, selectedDate, onDateChange, onTimeSelect }) {

  // Convertir array de fechas disponibles a objetos Date
  const validDates = availableDates.map(d => new Date(d.day));

  const isTileDisabled = ({ date }) => {
    return !validDates.some(d =>
      d.getFullYear() === date.getFullYear() &&
      d.getMonth() === date.getMonth() &&
      d.getDate() === date.getDate()
    );
  };

  return (
    <div className="calendar-wrapper">
      <Calendar
        onChange={onDateChange}
        value={selectedDate}
        tileDisabled={isTileDisabled}
        locale="es-ES"
      />
    </div>
  );
}
