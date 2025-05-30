import React from 'react'
import ReactDOM from 'react-dom/client'
import BookingModal from './BookingModal.jsx'
import Tiendas from './Tiendas.jsx'
import './BookingModal.css'

const path = window.location.pathname;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {path === '/tiendas' ? <Tiendas /> : <BookingModal />}
  </React.StrictMode>
)
