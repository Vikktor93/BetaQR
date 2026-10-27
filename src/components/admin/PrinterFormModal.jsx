import { useState } from 'react';
import { X, Copy, Check, Link as LinkIcon } from 'lucide-react';
import { PRINTER_STATUS, PRINTER_STATUS_LABELS, normalizePrinterStatus } from '../../config/status';
import { buildPrinterQrUrl } from '../../services/printerService';

const PRINTER_MODELS = [
  'Bambu Lab A1 Mini',
  'Bambu Lab A1',
  'Bambu Lab P1S',
  'Bambu Lab X1 Carbon',
  'Creality Ender 3 V2',
];

const CREATE_STATUS_OPTIONS = [PRINTER_STATUS.AVAILABLE, PRINTER_STATUS.UNAVAILABLE];

export default function PrinterFormModal({
  isOpen,
  printer = null,
  onClose,
  onSave,
  isLoading = false,
  errorMessage = '',
}) {
  const isEditing = Boolean(printer);

  const [name, setName] = useState(printer?.name || '');
  const [model, setModel] = useState(printer?.model || PRINTER_MODELS[0]);
  const [status, setStatus] = useState(
    isEditing ? normalizePrinterStatus(printer.status) : PRINTER_STATUS.AVAILABLE
  );
  const [nameError, setNameError] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const printerId = printer?.docId || printer?.id;
  const qrUrl = isEditing ? buildPrinterQrUrl(printerId, printer.securityToken) : '';
  const statusOptions = isEditing ? Object.values(PRINTER_STATUS) : CREATE_STATUS_OPTIONS;

  const modelOptions = PRINTER_MODELS.includes(model) ? PRINTER_MODELS : [model, ...PRINTER_MODELS];

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = name.trim().replace(/\s+/g, ' ');
    if (!cleanName) {
      setNameError('Ingresa un nombre para la impresora.');
      return;
    }
    onSave({ name: cleanName, model, status });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('No se pudo copiar el enlace:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in">
      <div
        className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-lg w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <h2 className="text-base md:text-lg font-bold text-slate-800">
            {isEditing ? 'Configuración de la impresora' : 'Nueva impresora'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Cerrar"
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
              onChange={(e) => {
                setName(e.target.value);
                setNameError('');
              }}
              placeholder="Bambu Lab A1 Mini #01"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {nameError && <p className="mt-1.5 text-xs font-medium text-rose-600">{nameError}</p>}
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
              {modelOptions.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              {isEditing ? 'Estado operativo manual' : 'Estado inicial'}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            >
              {statusOptions.map((value) => (
                <option key={value} value={value}>
                  {PRINTER_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </div>

          {!isEditing && (
            <p className="text-xs text-slate-500">
              El ID (por ejemplo <code>printer_04</code>) y el token de seguridad del QR se generan automáticamente.
            </p>
          )}

          {isEditing && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                <LinkIcon className="w-3.5 h-3.5" /> Enlace para el código QR
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={qrUrl}
                  onFocus={(e) => e.target.select()}
                  className="flex-1 min-w-0 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 font-mono"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              {!printer.securityToken && (
                <p className="mt-2 text-xs text-amber-700">
                  Esta impresora no tiene token de seguridad: cualquier persona con el enlace puede usarla.
                </p>
              )}
            </div>
          )}

          {errorMessage && (
            <p role="alert" className="text-xs font-medium text-rose-600">{errorMessage}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isEditing ? 'Cerrar' : 'Cancelar'}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear impresora'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
