import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const PRINTER_MODELS = [
  'Bambu Lab A1 Mini',
  'Bambu Lab A1',
  'Bambu Lab P1S',
  'Bambu Lab X1 Carbon',
  'Creality Ender 3 V2',
];

export default function EditPrinterModal({
  isOpen,
  printer,
  onClose,
  onSave,
  isLoading = false,
}) {
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [status, setStatus] = useState('Disponible');

  useEffect(() => {
    if (printer) {
      setName(printer.name || '');
      setModel(printer.model || PRINTER_MODELS[0]);
      setStatus(printer.status || 'Disponible');
    }
  }, [printer]);

  if (!isOpen || !printer) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      name: name.trim(),
      model,
      status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in">
      <div 
        className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-lg w-full p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <h2 className="text-base md:text-lg font-bold text-slate-800">
            Configuración de la impresora
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Nombre / Identificador
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bambu Lab A1 Mini #01"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Modelo / Tipo de equipo
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            >
              {PRINTER_MODELS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Estado operativo manual
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            >
              <option value="Disponible">Disponible para uso</option>
              <option value="Ocupado">Impresión en curso</option>
              <option value="No disponible">No disponible</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
