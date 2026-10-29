import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Convierte de forma segura un valor de fecha/timestamp de Firestore a un objeto Date.
 * Maneja tanto Timestamps nativos (.toDate()) como strings de pruebas antiguas.
 */
export const parseFirestoreDate = (timestamp) => {
  if (!timestamp) return null;
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Formatea un objeto Date a formato local chileno legible (DD/MM/YYYY HH:MM:SS)
 */
export const formatSessionDate = (date) => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date);
};

/**
 * Se suscribe en tiempo real a los cambios de la colección print_sessions.
 * Ordena las sesiones desde la más reciente a la más antigua.
 */
export const subscribeToSessions = (callback, onError) => {
  const sessionsRef = collection(db, 'print_sessions');
  const q = query(sessionsRef, orderBy('startTime', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const sessions = snapshot.docs.map((doc) => {
        const data = doc.data();
        const start = parseFirestoreDate(data.startTime);
        const end = parseFirestoreDate(data.endTime);

        return {
          id: doc.id,
          ...data,
          startDateObj: start,
          endDateObj: end,
          startTimeFormatted: formatSessionDate(start),
          endTimeFormatted: formatSessionDate(end),
        };
      });
      callback(sessions);
    },
    (error) => {
      console.error('Error al obtener sesiones en tiempo real:', error);
      if (onError) onError(error);
    }
  );
};

/**
 * Obtiene todas las sesiones una única vez (útil para reportes directos o snapshots).
 */
export const getSessionsOnce = async () => {
  try {
    const sessionsRef = collection(db, 'print_sessions');
    const q = query(sessionsRef, orderBy('startTime', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      const start = parseFirestoreDate(data.startTime);
      const end = parseFirestoreDate(data.endTime);

      return {
        id: doc.id,
        ...data,
        startDateObj: start,
        endDateObj: end,
        startTimeFormatted: formatSessionDate(start),
        endTimeFormatted: formatSessionDate(end),
      };
    });
  } catch (error) {
    console.error('Error al consultar sesiones:', error);
    throw error;
  }
};