import { db } from '../config/firebase';
import { 
  doc, 
  setDoc, 
  addDoc, 
  collection, 
  serverTimestamp, 
  onSnapshot,
  Timestamp
} from 'firebase/firestore';

// Escucha cambios de la impresora en tiempo real
export const subscribeToPrinter = (printerId, callback) => {
  const printerRef = doc(db, 'printers', printerId);
  return onSnapshot(
    printerRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ ...snapshot.data(), id: snapshot.id });
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
  const printerRef = doc(db, 'printers', printer.id);
  const nowTimestamp = Timestamp.now();

  // Crea el documento histórico en 'print_sessions'
  const sessionRef = await addDoc(collection(db, 'print_sessions'), {
    printerId: printer.id,
    printerName: printer.name || 'Impresora 3D',
    studentName,
    career,
    startTime: serverTimestamp(),
    endTime: null,
    status: 'EN_CURSO',
    stoppedBy: null,
  });

  // Actualiza la impresora a 'Ocupado'
  await setDoc(
    printerRef,
    {
      status: 'Ocupado',
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
export const stopPrintSession = async (printer, detenidoPor = 'ESTUDIANTE') => {
  const printerRef = doc(db, 'printers', printer.id);
  const currentSession = printer.currentSession;

  let durationSeconds = 0;
  let durationFormatted = '00:00:00';

  if (currentSession?.sessionId) {
    const sessionDocRef = doc(db, 'print_sessions', currentSession.sessionId);

    // Soporta tanto Timestamp de Firestore como strings ISO o ms
    let startDate = null;
    if (currentSession.startTime?.toDate) {
      startDate = currentSession.startTime.toDate();
    } else if (currentSession.startTime) {
      startDate = new Date(currentSession.startTime);
    }

    const endDate = new Date();

    if (startDate && !isNaN(startDate.getTime())) {
      durationSeconds = Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / 1000));
      durationFormatted = formatDuration(durationSeconds);
    }

    // Actualiza el histórico
    await setDoc(
      sessionDocRef,
      {
        endTime: serverTimestamp(),
        durationSeconds,
        durationFormatted,
        status: detenidoPor === 'ADMINISTRADOR' ? 'LIBERACION_FORZADA' : 'FINALIZADO',
        stoppedBy: detenidoPor
      },
      { merge: true }
    );
  }

  // Libera la impresora
  await setDoc(
    printerRef,
    {
      status: 'Disponible',
      currentSession: null,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  // Retorna el cálculo para feedback inmediato en UI
  return { durationSeconds, durationFormatted };
};