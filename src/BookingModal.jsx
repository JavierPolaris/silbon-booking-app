import React, { useState, useEffect } from 'react';
import './BookingModal.css';

export default function BookingModal() {
  const [visible, setVisible] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);

  const toggleModal = () => setVisible(!visible);

  useEffect(() => {
    if (visible) {
      fetch('/api/public-branches-services') // O la ruta que tengas para listar sucursales
        .then(res => res.json())
        .then(data => setBranches(data))
        .catch(err => console.error('Error cargando sucursales:', err));
    }
  }, [visible]);

  return (
    <>
      <button className="booking-toggle-button" onClick={toggleModal}>
        Reservar Cita en Tienda
      </button>

      {visible && (
        <div className="booking-modal">
          <div className="booking-sidebar">
            <h2>Reserva tu cita</h2>
            <p>Selecciona tu tienda más cercana</p>

            {/* SELECTOR DE TIENDA */}
            <select onChange={e => setSelectedBranch(e.target.value)} defaultValue="">
              <option value="" disabled>Selecciona una tienda</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>

            {selectedBranch && (
              <div>
                {/* Aquí después cargaremos servicios según la tienda */}
                <p>Tienda seleccionada: {selectedBranch}</p>
              </div>
            )}
          </div>

          <div className="booking-overlay" onClick={toggleModal}></div>
        </div>
      )}
    </>
  );
}
