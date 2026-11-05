/*
 * A test inside a series can be scheduled to open later. Until it opens it may
 * have no questions yet, so its question count and subject split stay hidden
 * and it cannot be started. Mirrors helpers/testSchedule on the web.
 */

export const isScheduledAhead = (
  date: string | null | undefined,
  now: number,
): boolean => !!date && new Date(date).getTime() > now;

export const formatOpensDate = (date: string): string =>
  new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
