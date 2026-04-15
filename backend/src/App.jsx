import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Business from './pages/Business'
import Contacts from './pages/Contacts'
import Products from './pages/Products'
import Inventory from './pages/Inventory'
import Transactions from './pages/Transactions'
import Financial from './pages/Financial'
import Layout from './components/Layout'

const API = '/fw/api/v1'

export { API }

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter basename="/fw">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="business" element={<Business />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="products" element={<Products />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="financial" element={<Financial />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
