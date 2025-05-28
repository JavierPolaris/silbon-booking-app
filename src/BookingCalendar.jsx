// src/BookingCalendar.jsx
import React from 'react';
import './BookingCalendar.css';

export default function BookingCalendar({ availability, onTimeSelect }) {
  return (
    <div className="calendar-container">
      {availability.map(day => (
        <div key={day.day} className="calendar-day">
          <h4>{new Date(day.day).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'short' })}</h4>
          <div className="calendar-times">
            {day.times.map(time => (
              <button key={time} className="time-slot" onClick={() => onTimeSelect(day.day, time)}>
                {time}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
