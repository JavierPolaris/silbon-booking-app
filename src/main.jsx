import React from 'react'
import ReactDOM from 'react-dom/client'
import BookingModal from './BookingModal.jsx'
import Tiendas from './Tiendas.jsx'
import './BookingModal.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Tiendas />
    {/* Render the BookingModal component */}
    <BookingModal />
  </React.StrictMode>
)
