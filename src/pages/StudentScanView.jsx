import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CAREERS } from '../config/careers';
import { subscribeToPrinter, startPrintSession, stopPrintSession } from '../services/printerService';
import { 
  Printer, 
  Play, 
  Square, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle,
  Loader2 
} from 'lucide-react';

export default function StudentScanView() {
  const { printerId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [printer, setPrinter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');
  const [career, setCareer] = useState(CAREERS[0] || '');
  const [submitting, setSubmitting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  // Suscripción en tiempo real a la impresora específica
  useEffect(() => {
    const unsubscribe = subscribeToPrinter(printerId, (data) => {
      setPrinter(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [printerId]);

  // Cronómetro en vivo compatible con Timestamp de Firestore y Date strings
  useEffect(() => {
    let interval = null;
    if (printer?.status === 'Ocupado' && printer.currentSession?.startTime) {
      interval = setInterval(() => {
        const rawStart = printer.currentSession.startTime;
        const start = rawStart?.toDate ? rawStart.toDate().getTime() : new Date(rawStart).getTime();
        const now = Date.now();
        const diff = Math.max(0, Math.floor((now - start) / 1000));

        const hours = String(Math.floor(diff / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
        const seconds = String(diff % 60).padStart(2, '0');
        setElapsedTime(`${hours}:${minutes}:${seconds}`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [printer]);

  // Pantalla de Carga
  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-2" />
        <p className="text-sm font-medium text-slate-500">Conectando con la impresora...</p>
      </main>
    );
  }

  // Validación 1: Impresora no encontrada
  if (!printer) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm max-w-sm w-full text-center border border-red-100">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800">Impresora no encontrada</h2>
          <p className="text-sm text-slate-600 mt-1">
            El código QR no corresponde a un equipo activo del laboratorio.
          </p>
        </div>
      </main>
    );
  }

  // Validación 2: Token de seguridad no coincide (RNF05)
  if (printer.securityToken && printer.securityToken !== token) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm max-w-sm w-full text-center border border-amber-100">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800">Acceso no autorizado</h2>
          <p className="text-sm text-slate-600 mt-1">
            Debes escanear directamente el código QR físico pegado en el chasis de la máquina.
          </p>
        </div>
      </main>
    );
  }

  // Manejador: Iniciar Impresión
  const handleStart = async (e) => {
    e.preventDefault();
    if (!studentName.trim()) return;

    setSubmitting(true);
    try {
      await startPrintSession(printer, studentName.trim(), career);
    } catch (err) {
      console.error(err);
      alert('Error al iniciar la sesión de impresión. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Manejador: Detener Impresión (STOP)
  const handleStop = async () => {
    if (!confirm('¿Deseas finalizar tu tiempo de impresión y liberar la impresora?')) return;

    setSubmitting(true);
    try {
      await stopPrintSession(printer, 'ESTUDIANTE');
      setStudentName('');
    } catch (err) {
      console.error(err);
      alert('Error al finalizar la sesión.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 max-w-md mx-auto">
      {/* Encabezado con datos del equipo */}
      <header className="text-center pt-2">
        <div className="inline-flex items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-2xl mb-2 shadow-xs">
          <Printer className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">{printer.name}</h1>
        <p className="text-xs text-slate-500 font-medium">{printer.model}</p>
      </header>

      {/* Caso 1: Impresora Disponible */}
      {printer.status === 'Disponible' && (
        <form onSubmit={handleStart} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4 my-auto">
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold uppercase tracking-wider">
            <CheckCircle className="w-4 h-4" /> Disponible para imprimir
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre Completo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Juan Pérez"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Carrera <span className="text-rose-500">*</span>
            </label>
            <select
              value={career}
              onChange={(e) => setCareer(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              {CAREERS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Iniciar Impresión</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Caso 2: Impresora Ocupada (Sesión Activa) */}
      {printer.status === 'Ocupado' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center space-y-6 my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Impresión en Curso
          </div>

          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Estudiante Responsable</p>
            <p className="text-lg font-bold text-slate-800 mt-1">{printer.currentSession?.studentName || 'Estudiante'}</p>
            <p className="text-xs text-slate-500">{printer.currentSession?.career}</p>
          </div>

          {/* Cronómetro en Vivo */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center gap-3">
            <Clock className="w-6 h-6 text-slate-400" />
            <span className="text-3xl font-mono font-bold text-slate-800 tracking-wider">
              {elapsedTime}
            </span>
          </div>

          <button
            onClick={handleStop}
            disabled={submitting}
            className="w-full py-4 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Square className="w-5 h-5 fill-current" />
                <span>STOP (Finalizar Impresión)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Caso 3: Impresora No Disponible / Mantención */}
      {printer.status === 'No Disponible' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center space-y-3 my-auto">
          <XCircle className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">Equipo Fuera de Servicio</h2>
          <p className="text-xs text-slate-500">
            Esta impresora se encuentra en mantenimiento o calibración técnica.
          </p>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-2 text-xs text-slate-400 space-y-1">
        <p>Laboratorio de Prototipado 3D (Lab 303)</p>
        <p>Universidad de Los Lagos, Sede Chiloé</p>
        <p className="mt-3">© Copyright 2026 | Ingeniería Civil en Informática</p>
      </footer>
    </main>
  );
}