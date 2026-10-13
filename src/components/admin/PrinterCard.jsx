import React from 'react';
import { ChevronDown, ChevronUp, Clock, AlertOctagon, Trash2, Edit3 } from 'lucide-react';
import { useLiveTimer } from '../../hooks/useLiveTimer';

export default function PrinterCard({
  printer,
  isExpanded,
  onToggle,
  onForceStop,
  onEdit,
  onDelete,
  isForcing,
}) {
  const isAvailable = printer.status === 'Disponible';
  const isNoDisponible = printer.status === 'No disponible' || printer.status === 'No Disponible';
  const elapsed = useLiveTimer(printer.currentSession?.startTime);

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 mb-3 overflow-hidden transition-all">
      {/* Cabecera / Fila Principal */}
      <div
        className="p-4 sm:px-6 flex items-center justify-between cursor-pointer hover:bg-slate-50/60 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isAvailable 
                ? 'bg-emerald-500' 
                : isNoDisponible 
                ? 'bg-amber-500' 
                : 'bg-rose-500 animate-pulse'
            }`}
          />
          <div>
            <h3 className="font-semibold text-slate-900 text-sm md:text-base">
              {printer.name}
            </h3>
            <p className="text-xs text-slate-400">{printer.model || 'Bambu Lab A1 Mini'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              isAvailable
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : isNoDisponible
                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                : 'bg-rose-50 text-rose-600 border border-rose-200'
            }`}
          >
            {isAvailable 
              ? 'Disponible para uso' 
              : isNoDisponible 
              ? 'No disponible' 
              : 'Impresión en curso'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {/* Acordeón Desplegable */}
      {isExpanded && (
        <div className="px-6 py-5 border-t border-slate-100 bg-white">
          <div className="flex items-center justify-between gap-6">
            
            {/* Contenido Central */}
            <div className="flex-1">
              {!isAvailable && !isNoDisponible && printer.currentSession ? (
                /* Caso: Impresión activa */
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs max-w-sm">
                    <span className="text-slate-400 font-medium">Estudiante:</span>
                    <span className="font-semibold text-slate-800">
                      {printer.currentSession.studentName || 'Sin registrar'}
                    </span>

                    <span className="text-slate-400 font-medium">Carrera:</span>
                    <span className="font-semibold text-slate-800">
                      {printer.currentSession.career || 'Ingeniería Civil en Informática'}
                    </span>

                    <span className="text-slate-400 font-medium">Inicio:</span>
                    <span className="font-semibold text-slate-800">
                      {printer.currentSession.startTime?.toDate
                        ? printer.currentSession.startTime
                            .toDate()
                            .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '--:--'}
                    </span>
                  </div>

                  <div className="flex flex-col items-start md:items-end justify-center gap-2">
                    <span className="text-[11px] font-medium text-slate-400">
                      Tiempo transcurrido
                    </span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800 text-sm">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{elapsed}</span>
                    </div>
                    <button
                      type="button"
                      disabled={isForcing}
                      onClick={(e) => {
                        e.stopPropagation();
                        onForceStop(printer);
                      }}
                      className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <AlertOctagon className="w-3.5 h-3.5" />
                      {isForcing ? 'Finalizando...' : 'Finalizar Impresión'}
                    </button>
                  </div>
                </div>
              ) : isNoDisponible ? (
                /* Caso: En Mantenimiento */
                <div className="py-2">
                  <p className="text-xs text-amber-600 font-medium">
                    Equipo en mantenimiento o fuera de servicio.
                  </p>
                </div>
              ) : (
                /* Caso: Disponible */
                <div className="py-2">
                  <p className="text-xs text-slate-500">
                    Equipo sin uso activo. Listo para escaneo de código QR.
                  </p>
                </div>
              )}
            </div>

            {/* Acciones del Mockup de Figma (Eliminar / Editar) */}
            <div className="flex flex-col items-center gap-2 pl-4 border-l border-slate-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(printer);
                }}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Eliminar impresora"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(printer);
                }}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                title="Editar impresora"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}