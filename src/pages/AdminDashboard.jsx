import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrinters } from '../hooks/usePrinters';
import { useAuth } from '../context/AuthContext';
import PrinterCard from '../components/admin/PrinterCard';
import ConfirmModal from '../components/admin/ConfirmModal';
import EditPrinterModal from '../components/admin/EditPrinterModal';
import { stopPrintSession, updatePrinter, deletePrinter } from '../services/printerService';
import { LayoutGrid, Loader2, AlertTriangle, LogOut } from 'lucide-react';

export default function AdminDashboard() {
  const { printers, loading, error } = usePrinters();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [expandedId, setExpandedId] = useState(null);
  const [forcingId, setForcingId] = useState(null);

  // Estados de modales
  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    variant: 'danger',
    action: null,
  });

  const [editModalState, setEditModalState] = useState({
    isOpen: false,
    printer: null,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const disponibles = printers.filter((p) => p.status === 'Disponible').length;
  const ocupadas = printers.filter((p) => p.status === 'Ocupado' || p.status === 'Impresión en curso').length;

  const handleToggle = (id) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  // 1. Finalizar impresión con ConfirmModal
  const handleForceStopClick = (printer) => {
    setConfirmModalState({
      isOpen: true,
      title: '¿Finalizar Impresión?',
      message: `Esto detendrá la sesión de "${printer.name}" y liberará el equipo para otros estudiantes.`,
      confirmText: 'Finalizar Sesión',
      variant: 'warning',
      action: async () => {
        const printerId = printer.docId || printer.id;
        setForcingId(printerId);
        try {
          await stopPrintSession(printer, 'ADMINISTRADOR');
        } catch (err) {
          console.error(err);
        } finally {
          setForcingId(null);
          setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // 2. Eliminar impresora con ConfirmModal
  const handleDeleteClick = (printer) => {
    setConfirmModalState({
      isOpen: true,
      title: '¿Eliminar Impresora?',
      message: `¿Estás seguro de que deseas eliminar "${printer.name}"? Esta acción removerá el equipo permanentemente.`,
      confirmText: 'Eliminar Equipo',
      variant: 'danger',
      action: async () => {
        const printerId = printer.docId || printer.id;
        try {
          await deletePrinter(printerId);
        } catch (err) {
          console.error('Error al eliminar impresora:', err);
        } finally {
          setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // 3. Abrir modal de edición
  const handleEditClick = (printer) => {
    setEditModalState({
      isOpen: true,
      printer,
    });
  };

  // 4. Guardar cambios de edición
  const handleSaveEdit = async (updatedData) => {
    const printerId = editModalState.printer.docId || editModalState.printer.id;
    setIsUpdating(true);
    try {
      await updatePrinter(printerId, updatedData);
      setEditModalState({ isOpen: false, printer: null });
    } catch (err) {
      console.error('Error al actualizar impresora:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-2" />
        <p className="text-sm font-medium text-slate-500">Cargando impresoras...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xs max-w-sm w-full text-center border border-red-100">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800">Error al cargar el dashboard</h2>
          <p className="text-sm text-slate-600 mt-1">
            No se pudo conectar con la base de datos de impresoras.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <header className="max-w-2xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Dashboard de Impresoras</h1>
              <p className="text-xs text-slate-500">
                Laboratorio de Prototipado 3D (Lab 303) · Estado en vivo
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200 cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>

        <div className="flex gap-3 mt-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {disponibles} disponibles
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            {ocupadas} en uso
          </span>
        </div>
      </header>

      {printers.length === 0 ? (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-xs border border-slate-200 text-center text-sm text-slate-500">
          Aún no hay impresoras registradas en el laboratorio.
        </div>
      ) : (
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          {printers.map((printer) => {
            const pId = printer.docId || printer.id;
            return (
              <PrinterCard
                key={pId}
                printer={printer}
                isExpanded={expandedId === pId}
                onToggle={() => handleToggle(pId)}
                onForceStop={handleForceStopClick}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                isForcing={forcingId === pId}
              />
            );
          })}
        </div>
      )}

      {/* Modales */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        confirmText={confirmModalState.confirmText}
        variant={confirmModalState.variant}
        onConfirm={confirmModalState.action}
        onCancel={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
      />

      <EditPrinterModal
        isOpen={editModalState.isOpen}
        printer={editModalState.printer}
        onClose={() => setEditModalState({ isOpen: false, printer: null })}
        onSave={handleSaveEdit}
        isLoading={isUpdating}
      />
    </main>
  );
}