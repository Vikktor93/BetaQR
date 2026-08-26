import { db } from '../config/firebase';
import { 
  doc, 
  updateDoc, 
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
      callback({ id: snapshot.id, ...snapshot.data() });
    } else {
      callback(null);
    }
  });
};

// Inicia sesión: actualiza a "Ocupado" y crea registro en "print_sessions"
export const startPrintSession = async (printer, studentName, career) => {
  const printerRef = doc(db, 'printers', printer.id);

  // Guarda en el historial de sesiones
  const sessionRef = await addDoc(collection(db, 'print_sessions'), {
    printerId: printer.id,
    printerName: printer.name,
    studentName,
    career,
    startTime: serverTimestamp(),
    endTime: null,
    status: 'EN_CURSO',
    stoppedBy: null,
  });

  // Cambia el estado de la máquina física
  await updateDoc(printerRef, {
    status: 'Ocupado',
    currentSession: {
      sessionId: sessionRef.id,
      studentName,
      career,
      startTime: new Date().toISOString()
    },
    updatedAt: serverTimestamp()
  });

  return sessionRef.id;
};

// Detiene la sesión: 'detenidoPor' por defecto es 'ESTUDIANTE'
export const stopPrintSession = async (printer, detenidoPor = 'ESTUDIANTE') => {
  const printerRef = doc(db, 'printers', printer.id);
  const currentSession = printer.currentSession;

  if (currentSession?.sessionId) {
    const sessionDocRef = doc(db, 'print_sessions', currentSession.sessionId);
    
    // Cierra el registro en el historial
    await updateDoc(sessionDocRef, {
      endTime: serverTimestamp(),
      status: detenidoPor === 'ADMINISTRADOR' ? 'LIBERACION_FORZADA' : 'FINALIZADO',
      stoppedBy: detenidoPor
    });
  }

  // Libera la máquina física para el siguiente alumno
  await updateDoc(printerRef, {
    status: 'Disponible',
    currentSession: null,
    updatedAt: serverTimestamp()
  });
};