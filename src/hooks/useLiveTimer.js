import { useState, useEffect } from "react";

export function useLiveTimer(startTime) {
  const [elapsed, setElapsed] = useState("00:00:00");

  useEffect(() => {
    if (!startTime) {
      setElapsed("00:00:00");
      return;
    }

    const calculateElapsed = () => {
      const start = startTime.toDate
        ? startTime.toDate().getTime()
        : new Date(startTime).getTime();
      const now = Date.now();
      const diffMs = Math.max(0, now - start);

      const totalSec = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      const pad = (n) => String(n).padStart(2, "0");
      setElapsed(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return elapsed;
}