import { db } from '../config/firebase';
import { 
  doc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  getDoc, 
  addDoc, 
  collection, 
  serverTimestamp, 
  onSnapshot,
  Timestamp,
  deleteField
} from 'firebase/firestore';
import { PRINTER_STATUS, SESSION_STATUS, STOPPED_BY } from '../config/status';

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

// Inicia sesión: crea registro en print_sessions y actualiza la impresora
export const startPrintSession = async (printer, studentName, career) => {
  const targetId = printer?.docId || printer?.id || (typeof printer === 'string' ? printer : 'printer_01');
  const printerRef = doc(db, 'printers', targetId);
  const nowTimestamp = Timestamp.now();

  const sessionRef = await addDoc(collection(db, 'print_sessions'), {
    printerId: targetId,
    printerName: printer?.name || 'Impresora 3D',
    studentName,
    career,
    startTime: serverTimestamp(),
    endTime: null,
    status: SESSION_STATUS.IN_PROGRESS,
    stoppedBy: null,
  });

  await setDoc(
    printerRef,
    {
      status: PRINTER_STATUS.BUSY,
      currentSession: {
        sessionId: sessionRef.id,
        studentName,
        career,
        startTime: nowTimestamp
      },
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  return sessionRef.id;
};

// Detiene sesión: libera la impresora y finaliza el registro histórico
export const stopPrintSession = async (printer, detenidoPor = STOPPED_BY.STUDENT) => {
  const targetId = printer?.docId || printer?.id || (typeof printer === 'string' ? printer : 'printer_01');
  const printerRef = doc(db, 'printers', targetId);

  let sessionData = printer?.currentSession;
  if (!sessionData) {
    try {
      const snap = await getDoc(printerRef);
      if (snap.exists()) {
        sessionData = snap.data().currentSession;
      }
    } catch (readErr) {
      console.warn("[printerService] Error al leer antes de detener:", readErr);
    }
  }

  let durationSeconds = 0;
  let durationFormatted = '00:00:00';

  console.log(`[printerService] Deteniendo sesión para impresora ${targetId} por ${detenidoPor}`);

  if (sessionData?.sessionId) {
    try {
      const sessionDocRef = doc(db, 'print_sessions', sessionData.sessionId);

      let startDate = null;
      if (sessionData.startTime?.toDate) {
        startDate = sessionData.startTime.toDate();
      } else if (sessionData.startTime?.seconds) {
        startDate = new Date(sessionData.startTime.seconds * 1000);
      } else if (sessionData.startTime) {
        startDate = new Date(sessionData.startTime);
      }

      const endDate = new Date();

      if (startDate && !isNaN(startDate.getTime())) {
        durationSeconds = Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / 1000));
        durationFormatted = formatDuration(durationSeconds);
      }

      await setDoc(
        sessionDocRef,
        {
          endTime: serverTimestamp(),
          durationSeconds,
          durationFormatted,
          status: detenidoPor === STOPPED_BY.ADMIN ? SESSION_STATUS.FORCED_RELEASE : SESSION_STATUS.FINISHED,
          stoppedBy: detenidoPor
        },
        { merge: true }
      );
    } catch (sessionErr) {
      console.warn("[printerService] Error al actualizar histórico:", sessionErr);
    }
  }

  try {
    await updateDoc(printerRef, {
      status: PRINTER_STATUS.AVAILABLE,
      currentSession: deleteField(),
      updatedAt: serverTimestamp()
    });
  } catch (updateErr) {
    console.warn("[printerService] Fallback a setDoc:", updateErr);
    await setDoc(
      printerRef,
      {
        status: PRINTER_STATUS.AVAILABLE,
        currentSession: null,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  }

  console.log(`[printerService] Impresora ${targetId} liberada exitosamente.`);
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