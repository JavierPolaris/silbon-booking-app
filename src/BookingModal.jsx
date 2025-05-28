import React, { useEffect, useState } from 'react';
import './BookingModal.css';

export default function BookingModal() {
  const [visible, setVisible] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);

  useEffect(() => {
    fetch('/api/public-branches-services')
      .then(res => res.json())
      .then(data => setBranches(data))
      .catch(err => console.error('Error cargando sucursales:', err));
  }, []);

  const toggleModal = () => setVisible(!visible);

  const handleBranchSelect = (e) => {
    const selectedId = e.target.value;
    const branch = branches.find(b => b.id === selectedId);
    setSelectedBranch(branch);
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
            <p>Selecciona tu tienda más cercana</p>

            <select onChange={handleBranchSelect}>
              <option value="">-- Selecciona una tienda --</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>

            {selectedBranch && (
              <div style={{ marginTop: '1rem' }}>
                <p><strong>Company ID:</strong> {selectedBranch.id}</p>
                <p><strong>Field IDs:</strong></p>
                <ul>
                  {selectedBranch.customerFields.map(field => (
                    <li key={field.id}>
                      {field.type} → {field.translationKey} → {field.id}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="booking-overlay" onClick={toggleModal}></div>
        </div>
      )}
    </>
  );
}
