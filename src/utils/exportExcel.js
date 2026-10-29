import * as XLSX from 'xlsx';
import { SESSION_STATUS, STOPPED_BY } from '../config/status';

/**
 * Traduce el código de estado a un texto legible para el reporte.
 */
const getStatusLabel = (status) => {
  switch (status) {
    case SESSION_STATUS.FINISHED:
      return 'Finalizado';
    case SESSION_STATUS.FORCE_RELEASED:
      return 'Liberación Forzada';
    case SESSION_STATUS.IN_PROGRESS:
      return 'En Curso';
    default:
      return status || '-';
  }
};

/**
 * Traduce quién detuvo la sesión a un texto legible.
 */
const getStoppedByLabel = (stoppedBy) => {
  switch (stoppedBy) {
    case STOPPED_BY.STUDENT:
      return 'Estudiante';
    case STOPPED_BY.ADMIN:
      return 'Administrador';
    default:
      return stoppedBy || '-';
  }
};

/**
 * Genera y descarga un archivo .xlsx con el listado de sesiones filtradas.
 * @param {Array} sessions - Arreglo de sesiones procesadas desde sessionService.
 * @param {string} fileNamePrefix - Prefijo para el nombre del archivo descargado.
 */
export const exportSessionsToExcel = (sessions, fileNamePrefix = 'BetaQR_Historico_Sesiones') => {
  if (!sessions || sessions.length === 0) {
    alert('No hay datos disponibles para exportar con los filtros seleccionados.');
    return;
  }

  // 1. Mapeo a columnas tabulares legibles
  const dataToExport = sessions.map((session, index) => ({
    'N°': index + 1,
    'Impresora': session.printerName || session.printerId || 'Sin asignar',
    'Estudiante': session.studentName || 'Anónimo',
    'Carrera': session.career || 'Sin especificar',
    'Fecha / Hora Inicio': session.startTimeFormatted || '-',
    'Fecha / Hora Término': session.endTimeFormatted || '-',
    'Duración': session.durationFormatted || '00:00:00',
    'Segundos Totales': session.durationSeconds || 0,
    'Estado': getStatusLabel(session.status),
    'Finalizado Por': getStoppedByLabel(session.stoppedBy),
  }));

  // 2. Crear la hoja de trabajo (Worksheet)
  const worksheet = XLSX.utils.json_to_sheet(dataToExport);

  // 3. Definir anchos sugeridos para las columnas (legibilidad en Excel)
  worksheet['!cols'] = [
    { wch: 6 },  // N°
    { wch: 25 }, // Impresora
    { wch: 25 }, // Estudiante
    { wch: 32 }, // Carrera
    { wch: 20 }, // Inicio
    { wch: 20 }, // Término
    { wch: 14 }, // Duración
    { wch: 18 }, // Segundos Totales
    { wch: 20 }, // Estado
    { wch: 16 }, // Finalizado Por
  ];

  // 4. Crear el libro de trabajo (Workbook) y adjuntar la hoja
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial Sesiones');

  // 5. Generar nombre de archivo con fecha actual
  const today = new Date().toISOString().split('T')[0];
  const fullFileName = `${fileNamePrefix}_${today}.xlsx`;

  // 6. Disparar la descarga directa
  XLSX.writeFile(workbook, fullFileName);
};