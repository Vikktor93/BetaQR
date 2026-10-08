import React from 'react';
import { ChevronDown, ChevronUp, Clock, AlertOctagon } from 'lucide-react';
import { useLiveTimer } from '../../hooks/useLiveTimer';

export default function PrinterCard({
  printer,
  isExpanded,
  onToggle,
  onForceStop,
  isForcing,
}) {
  const isAvailable = printer.status === 'Disponible';
  const elapsed = useLiveTimer(printer.currentSession?.startTime);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 mb-3 overflow-hidden transition-all">
      {/* Cabecera / Fila Principal */}
      <div
        className="p-4 sm:px-6 flex items-center justify-between cursor-pointer hover:bg-slate-50/60 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isAvailable ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
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
                : 'bg-rose-50 text-rose-600 border border-rose-200'
            }`}
          >
            {isAvailable ? 'Disponible para uso' : 'Impresión en curso'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {/* Acordeón Desplegable según Figma */}
      {isExpanded && (
        <div className="px-6 py-5 border-t border-slate-100 bg-white">
          {!isAvailable && printer.currentSession ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Información del estudiante */}
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

              {/* Tiempo transcurrido y botón de finalizar */}
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
                  className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  {isForcing ? 'Finalizando...' : 'Finalizar Impresión'}
                </button>
              </div>
            </div>
          ) : (
            /* Vista disponible */
            <div className="py-2">
              <p className="text-xs text-slate-500">
                Impresora lista y a la espera de escaneo del código QR físico.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}