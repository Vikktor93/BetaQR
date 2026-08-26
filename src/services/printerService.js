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

// Detiene sesión: libera la impresora y finaliza el registro histórico
export const stopPrintSession = async (printer, detenidoPor = 'ESTUDIANTE') => {
  const printerRef = doc(db, 'printers', printer.id);
  const currentSession = printer.currentSession;

  // Si existe una sesión activa vinculada, se cierra
  if (currentSession?.sessionId) {
    const sessionDocRef = doc(db, 'print_sessions', currentSession.sessionId);
    await setDoc(sessionDocRef, {
      endTime: serverTimestamp(),
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