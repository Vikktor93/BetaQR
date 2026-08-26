import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import StudentScanView from './pages/StudentScanView';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirección por defecto al Dashboard si se accede a la raíz */}
        <Route path="/" element={<Navigate to="/admin" replace />} />

        {/* Flujo Mobile-First del Estudiante vía QR */}
        <Route path="/impresora/:printerId" element={<StudentScanView />} />

        {/* Flujo del Administrador / Encargado */}
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Manejo de rutas inexistentes (404) */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}