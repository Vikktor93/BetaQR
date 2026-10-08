import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import StudentScanView from './pages/StudentScanView';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import NotFound from './pages/NotFound';

// Protección de la ruta privada /admin
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Redirección por defecto al Dashboard si se accede a la raíz */}
          <Route path="/" element={<Navigate to="/admin" replace />} />

          {/* Flujo Mobile-First del Estudiante vía QR */}
          <Route path="/impresora/:printerId" element={<StudentScanView />} />

          {/* Flujo del Administrador / Encargado */}
          <Route path="/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Manejo de rutas inexistentes (404) */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}