import { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  User, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2 
} from 'lucide-react';
import { subscribeToSessions } from '../../services/sessionService';
import { exportSessionsToExcel } from '../../utils/exportExcel';
import { SESSION_STATUS, STOPPED_BY } from '../../config/status';

export default function SessionsHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const unsubscribe = subscribeToSessions(
      (data) => {
        setSessions(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error al cargar historial:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        (session.studentName && session.studentName.toLowerCase().includes(term)) ||
        (session.printerName && session.printerName.toLowerCase().includes(term)) ||
        (session.career && session.career.toLowerCase().includes(term));

      const normalizedStatus = String(session.status || '').trim().toUpperCase();
      const matchesStatus =
        statusFilter === 'ALL' ||
        session.status === statusFilter ||
        normalizedStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [sessions, searchTerm, statusFilter]);

  const handleExport = () => {
    exportSessionsToExcel(filteredSessions);
  };

  const getStatusBadge = (status) => {
    const normalized = String(status || '').trim().toUpperCase();

    if (normalized === SESSION_STATUS.FINISHED || normalized === 'FINALIZADO') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Finalizado
        </span>
      );
    }

    if (
      normalized === SESSION_STATUS.FORCE_RELEASED ||
      normalized === 'LIBERACION_FORZADA' ||
      normalized === 'LIBERACIÓN FORZADA'
    ) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
          <AlertTriangle className="w-3.5 h-3.5" />
          Liberación Forzada
        </span>
      );
    }

    if (normalized === SESSION_STATUS.IN_PROGRESS || normalized === 'EN_CURSO') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
          <Clock className="w-3.5 h-3.5" />
          En Curso
        </span>
      );
    }

    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
        {status || '-'}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
      {/* Barra de cabecera y controles */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Historial de Sesiones
          </h2>
          <p className="text-xs text-slate-500">
            Registro consolidado de impresiones del laboratorio
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={loading || filteredSessions.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold text-xs rounded-xl transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Exportar a Excel ({filteredSessions.length})
        </button>
      </div>

      {/* Barra de filtros */}
      <div className="p-4 bg-slate-50/60 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por estudiante, máquina o carrera..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">Todos los estados</option>
            <option value={SESSION_STATUS.FINISHED}>Finalizados</option>
            <option value={SESSION_STATUS.FORCE_RELEASED}>Liberación Forzada</option>
            <option value={SESSION_STATUS.IN_PROGRESS}>En Curso</option>
          </select>
        </div>
      </div>

      {/* Contenido / Tabla */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="text-xs">Cargando sesiones...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-sm">No se encontraron sesiones registradas con los filtros actuales.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                <th className="py-3 px-4 min-w-[150px]">Impresora</th>
                <th className="py-3 px-4 min-w-[180px]">Estudiante / Carrera</th>
                <th className="py-3 px-4 min-w-[150px]">Inicio</th>
                <th className="py-3 px-4 min-w-[150px]">Término</th>
                <th className="py-3 px-4 min-w-[90px]">Duración</th>
                <th className="py-3 px-4 min-w-[150px]">Estado</th>
                <th className="py-3 px-4 min-w-[120px]">Cierre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSessions.map((session) => (
                <tr 
                  key={session.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Printer className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      {session.printerName || session.printerId || 'Sin asignar'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-900 font-medium flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      {session.studentName || 'Anónimo'}
                    </div>
                    <div className="text-[11px] text-slate-500 pl-5">
                      {session.career || 'Sin especificar'}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    {session.startTimeFormatted}
                  </td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    {session.endTimeFormatted}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-medium text-slate-800">
                      {session.durationFormatted || '00:00:00'}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {getStatusBadge(session.status)}
                  </td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    {session.stoppedBy === STOPPED_BY.ADMIN || session.stoppedBy === 'ADMINISTRADOR'
                      ? 'Administrador'
                      : session.stoppedBy === STOPPED_BY.STUDENT || session.stoppedBy === 'ESTUDIANTE'
                      ? 'Estudiante'
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
