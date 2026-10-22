// Valores oficiales de estado usados en Firestore.
// Usar SIEMPRE estas constantes en lugar de escribir los textos a mano.

// Estado de una impresora (colección 'printers', campo 'status')
export const PRINTER_STATUS = Object.freeze({
  AVAILABLE: 'Disponible',
  BUSY: 'Ocupado',
  UNAVAILABLE: 'No disponible',
});

// Estado de una sesión de impresión (colección 'print_sessions', campo 'status')
export const SESSION_STATUS = Object.freeze({
  IN_PROGRESS: 'EN_CURSO',
  FINISHED: 'FINALIZADO',
  FORCED_RELEASE: 'LIBERACION_FORZADA',
});

// Quién detuvo la sesión (colección 'print_sessions', campo 'stoppedBy')
export const STOPPED_BY = Object.freeze({
  STUDENT: 'ESTUDIANTE',
  ADMIN: 'ADMINISTRADOR',
});

// Textos que se muestran al usuario para cada estado de impresora
export const PRINTER_STATUS_LABELS = Object.freeze({
  [PRINTER_STATUS.AVAILABLE]: 'Disponible para uso',
  [PRINTER_STATUS.BUSY]: 'Impresión en curso',
  [PRINTER_STATUS.UNAVAILABLE]: 'No disponible',
});

// Valores antiguos que pueden existir en documentos ya guardados en Firestore
const LEGACY_PRINTER_STATUS = {
  'disponible': PRINTER_STATUS.AVAILABLE,
  'ocupado': PRINTER_STATUS.BUSY,
  'impresión en curso': PRINTER_STATUS.BUSY,
  'en uso': PRINTER_STATUS.BUSY,
  'no disponible': PRINTER_STATUS.UNAVAILABLE,
  'mantención': PRINTER_STATUS.UNAVAILABLE,
};

// Convierte cualquier valor guardado al estado oficial.
// Si el valor no se reconoce, se considera 'Disponible'.
export const normalizePrinterStatus = (status) =>
  LEGACY_PRINTER_STATUS[(status || '').trim().toLowerCase()] ?? PRINTER_STATUS.AVAILABLE;
