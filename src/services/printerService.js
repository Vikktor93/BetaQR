import { db } from '../config/firebase';
import {
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  collection,
  serverTimestamp,
  onSnapshot,
  runTransaction,
  deleteField
} from 'firebase/firestore';
import {
  PRINTER_STATUS,
  SESSION_STATUS,
  STOPPED_BY,
  normalizePrinterStatus
} from '../config/status';

// Códigos de error que la interfaz puede mostrar al usuario
export const PRINT_ERRORS = Object.freeze({
  PRINTER_NOT_FOUND: 'PRINTER_NOT_FOUND',
  PRINTER_BUSY: 'PRINTER_BUSY',
  PRINTER_UNAVAILABLE: 'PRINTER_UNAVAILABLE',
});

const printError = (code) => {
  const error = new Error(code);
  error.code = code;
  return error;
};

// Obtiene el ID del documento a partir de un objeto impresora o de un ID directo
const getPrinterId = (printer) =>
  printer?.docId || printer?.id || (typeof printer === 'string' ? printer : null);

// Escucha cambios de la impresora en tiempo real
export const subscribeToPrinter = (printerId, callback) => {
  if (!printerId) return () => {};
  const printerRef = doc(db, 'printers', printerId);
  return onSnapshot(
    printerRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ ...snapshot.data(), id: snapshot.id, docId: snapshot.id });
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error("Error al escuchar la impresora:", error);
      callback(null);
    }
  );
};

// Formatea segundos a "HH:MM:SS"
const formatDuration = (totalSeconds) => {
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

// Inicia sesión de impresión.
// Usa una transacción: Firestore verifica que la impresora siga disponible y la ocupa
// en una sola operación. Si dos estudiantes escanean al mismo tiempo, solo uno lo logra.
// Ambos startTime (sesión e impresora) usan la hora del servidor.
export const startPrintSession = async (printer, studentName, career) => {
  const printerId = getPrinterId(printer);
  if (!printerId) throw printError(PRINT_ERRORS.PRINTER_NOT_FOUND);

  const printerRef = doc(db, 'printers', printerId);
  // Se genera el ID de la sesión antes de la transacción para guardarlo en la impresora
  const sessionRef = doc(collection(db, 'print_sessions'));

  await runTransaction(db, async (transaction) => {
    const printerSnap = await transaction.get(printerRef);

    if (!printerSnap.exists()) {
      throw printError(PRINT_ERRORS.PRINTER_NOT_FOUND);
    }

    const current = printerSnap.data();
    const status = normalizePrinterStatus(current.status);

    if (status === PRINTER_STATUS.UNAVAILABLE) {
      throw printError(PRINT_ERRORS.PRINTER_UNAVAILABLE);
    }
    if (status === PRINTER_STATUS.BUSY || current.currentSession) {
      throw printError(PRINT_ERRORS.PRINTER_BUSY);
    }

    transaction.set(sessionRef, {
      printerId,
      printerName: current.name || 'Impresora 3D',
      studentName,
      career,
      startTime: serverTimestamp(),
      endTime: null,
      status: SESSION_STATUS.IN_PROGRESS,
      stoppedBy: null,
    });

    transaction.update(printerRef, {
      status: PRINTER_STATUS.BUSY,
      currentSession: {
        sessionId: sessionRef.id,
        studentName,
        career,
        startTime: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    });
  });

  return sessionRef.id;
};

// Detiene sesión: libera la impresora y cierra el registro histórico.
// La transacción evita cerrar dos veces la misma sesión (por ejemplo, si el estudiante
// presiona STOP mientras el administrador hace una liberación forzada).
export const stopPrintSession = async (printer, detenidoPor = STOPPED_BY.STUDENT) => {
  const printerId = getPrinterId(printer);
  if (!printerId) throw printError(PRINT_ERRORS.PRINTER_NOT_FOUND);

  const printerRef = doc(db, 'printers', printerId);

  // 1. Liberar la impresora y marcar el fin de la sesión con la hora del servidor
  const sessionId = await runTransaction(db, async (transaction) => {
    const printerSnap = await transaction.get(printerRef);

    if (!printerSnap.exists()) {
      throw printError(PRINT_ERRORS.PRINTER_NOT_FOUND);
    }

    const activeSessionId = printerSnap.data().currentSession?.sessionId || null;

    if (activeSessionId) {
      // set + merge en lugar de update: no falla si el documento de la sesión ya no existe
      transaction.set(
        doc(db, 'print_sessions', activeSessionId),
        {
          endTime: serverTimestamp(),
          status: detenidoPor === STOPPED_BY.ADMIN
            ? SESSION_STATUS.FORCED_RELEASE
            : SESSION_STATUS.FINISHED,
          stoppedBy: detenidoPor,
        },
        { merge: true }
      );
    }

    transaction.update(printerRef, {
      status: PRINTER_STATUS.AVAILABLE,
      currentSession: deleteField(),
      updatedAt: serverTimestamp(),
    });

    return activeSessionId;
  });

  // Si no había sesión activa (ya fue cerrada por otra persona), no hay duración que calcular
  if (!sessionId) {
    return { durationSeconds: 0, durationFormatted: formatDuration(0) };
  }

  // 2. Calcular la duración con los dos tiempos del servidor (startTime y endTime)
  const sessionRef = doc(db, 'print_sessions', sessionId);
  const sessionSnap = await getDoc(sessionRef);
  const { startTime, endTime } = sessionSnap.data() || {};

  let durationSeconds = 0;
  if (startTime?.toMillis && endTime?.toMillis) {
    durationSeconds = Math.max(0, Math.round((endTime.toMillis() - startTime.toMillis()) / 1000));
  }
  const durationFormatted = formatDuration(durationSeconds);

  await updateDoc(sessionRef, { durationSeconds, durationFormatted });

  return { durationSeconds, durationFormatted };
};

// Actualiza los datos editables de la impresora (Nombre, Modelo, Estado manual)
export const updatePrinter = async (printerId, updatedData) => {
  const printerRef = doc(db, 'printers', printerId);
  await updateDoc(printerRef, {
    ...updatedData,
    updatedAt: serverTimestamp()
  });
};

// Elimina el equipo de Firestore
export const deletePrinter = async (printerId) => {
  const printerRef = doc(db, 'printers', printerId);
  await deleteDoc(printerRef);
};
