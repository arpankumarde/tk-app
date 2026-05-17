import { useState, useEffect } from "react";

/**
 * Custom hook to manage a countdown timer.
 * @param targetDate The end date/time for the countdown (ISO string, timestamp, or Date object).
 * @returns Formatted time string (HH:mm:ss) or null if time has passed.
 */
export const useCountdown = (targetDate: string | number | Date | null | undefined) => {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();

      if (difference <= 0) {
        return null;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      let result = "";
      if (days > 0) result += `${days}d `;
      result += `${hours.toString().padStart(2, "0")}h `;
      result += `${minutes.toString().padStart(2, "0")}m `;
      result += `${seconds.toString().padStart(2, "0")}s`;

      return result.trim();
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining === null) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
};
