import { db } from '../config/firebase';
import {
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
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

export const PRINT_ERRORS = Object.freeze({
  PRINTER_NOT_FOUND: 'PRINTER_NOT_FOUND',
  PRINTER_BUSY: 'PRINTER_BUSY',
  PRINTER_UNAVAILABLE: 'PRINTER_UNAVAILABLE',
  PRINTER_ID_TAKEN: 'PRINTER_ID_TAKEN',
});

const printError = (code) => {
  const error = new Error(code);
  error.code = code;
  return error;
};


const getPrinterId = (printer) =>
  printer?.docId || printer?.id || (typeof printer === 'string' ? printer : null);

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

const formatDuration = (totalSeconds) => {
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

export const startPrintSession = async (printer, studentName, career) => {
  const printerId = getPrinterId(printer);
  if (!printerId) throw printError(PRINT_ERRORS.PRINTER_NOT_FOUND);

  const printerRef = doc(db, 'printers', printerId);
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


export const stopPrintSession = async (printer, detenidoPor = STOPPED_BY.STUDENT) => {
  const printerId = getPrinterId(printer);
  if (!printerId) throw printError(PRINT_ERRORS.PRINTER_NOT_FOUND);

  const printerRef = doc(db, 'printers', printerId);

  const sessionId = await runTransaction(db, async (transaction) => {
    const printerSnap = await transaction.get(printerRef);

    if (!printerSnap.exists()) {
      throw printError(PRINT_ERRORS.PRINTER_NOT_FOUND);
    }

    const activeSessionId = printerSnap.data().currentSession?.sessionId || null;

    if (activeSessionId) {
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

  if (!sessionId) {
    return { durationSeconds: 0, durationFormatted: formatDuration(0) };
  }

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

export const generateSecurityToken = () => {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

export const buildPrinterQrUrl = (printerId, securityToken) => {
  const url = new URL(`/impresora/${printerId}`, window.location.origin);
  if (securityToken) url.searchParams.set('token', securityToken);
  return url.toString();
};

const getNextPrinterId = async () => {
  const snapshot = await getDocs(collection(db, 'printers'));
  const maxNumber = snapshot.docs.reduce((max, d) => {
    const match = /^printer_(\d+)$/.exec(d.id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `printer_${String(maxNumber + 1).padStart(2, '0')}`;
};


export const createPrinter = async ({ name, model, status = PRINTER_STATUS.AVAILABLE }) => {
  const printerId = await getNextPrinterId();
  const printerRef = doc(db, 'printers', printerId);
  const securityToken = generateSecurityToken();

  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(printerRef);
    if (existing.exists()) {
      throw printError(PRINT_ERRORS.PRINTER_ID_TAKEN);
    }
    transaction.set(printerRef, {
      name,
      model,
      status,
      securityToken,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  return { id: printerId, docId: printerId, name, model, status, securityToken };
};

export const updatePrinter = async (printerId, updatedData) => {
  const printerRef = doc(db, 'printers', printerId);
  await updateDoc(printerRef, {
    ...updatedData,
    updatedAt: serverTimestamp()
  });
};

export const deletePrinter = async (printerId) => {
  const printerRef = doc(db, 'printers', printerId);
  await deleteDoc(printerRef);
};
