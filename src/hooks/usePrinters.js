import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../config/firebase";

export function usePrinters() {
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const q = query(collection(db, "printers"), orderBy("name", "asc"));
      
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const printerList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setPrinters(printerList);
          setLoading(false);
        },
        (err) => {
          console.error("Error al escuchar impresoras:", err);
          setError(err);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error("Error en configuración de snapshot:", err);
      setError(err);
      setLoading(false);
    }
  }, []);

  return { printers, loading, error };
}