import { db } from '../config/firebase';
import { 
  doc, 
  setDoc, 
  addDoc, 
  collection, 
  serverTimestamp, 
  onSnapshot 
} from 'firebase/firestore';

// Escucha cambios de la impresora en tiempo real
export const subscribeToPrinter = (printerId, callback) => {
  const printerRef = doc(db, 'printers', printerId);
  return onSnapshot(printerRef, (snapshot) => {
    if (snapshot.exists()) {
      // El ID de Firestore (snapshot.id) prevalece siempre
      callback({ ...snapshot.data(), id: snapshot.id });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Error al escuchar la impresora:", error);
    callback(null);
  });
};

// Inicia sesión: crea registro en print_sessions y actualiza la impresora
export const startPrintSession = async (printer, studentName, career) => {
  const printerRef = doc(db, 'printers', printer.id);

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

  // Actualiza la impresora a 'Ocupado' de forma segura
  await setDoc(printerRef, {
    status: 'Ocupado',
    currentSession: {
      sessionId: sessionRef.id,
      studentName,
      career,
      startTime: new Date().toISOString()
    },
    updatedAt: serverTimestamp()
  }, { merge: true });

  return sessionRef.id;
};

// Operación matemática: convierte segundos a formato "HH:MM:SS"
const formatDuration = (totalSeconds) => {
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

// Detiene sesión: libera la impresora y finaliza el registro histórico
export const stopPrintSession = async (printer, detenidoPor = 'ESTUDIANTE') => {
  const printerRef = doc(db, 'printers', printer.id);
  const currentSession = printer.currentSession;

  let durationSeconds = 0;
  let durationFormatted = '00:00:00';

  // Si existe una sesión activa vinculada, se cierra
  if (currentSession?.sessionId) {
    const sessionDocRef = doc(db, 'print_sessions', currentSession.sessionId);

    // Operación matemática: calcula cuánto duró la impresión
    const startDate = currentSession.startTime ? new Date(currentSession.startTime) : null;
    const endDate = new Date();

    if (startDate && !isNaN(startDate.getTime())) {
      durationSeconds = Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / 1000));
      durationFormatted = formatDuration(durationSeconds);
    }

    // Consulta: guarda el cálculo de tiempo (hora/minutos/segundos) en print_sessions,
    // para que solo se consulte y se vea en el panel de admin
    await setDoc(sessionDocRef, {
      endTime: serverTimestamp(),
      durationSeconds,
      durationFormatted,
      status: detenidoPor === 'ADMINISTRADOR' ? 'LIBERACION_FORZADA' : 'FINALIZADO',
      stoppedBy: detenidoPor
    }, { merge: true });
  }

  // Libera el estado de la impresora
  await setDoc(printerRef, {
    status: 'Disponible',
    currentSession: null,
    updatedAt: serverTimestamp()
  }, { merge: true });
};