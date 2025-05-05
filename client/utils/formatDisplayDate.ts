/**
 * @param ymdString A date string of the form `yyyy-MM-dd`, e.g. `2025-04-30`
 * @returns A display string for the given date using the short month, e.g. `Apr 30, 2025`
 */
export default function (ymdString: string): string {
  const utcDate = new Date(ymdString);

  // Use the current time in the date object to avoid timezone issues.
  const date = new Date(Date.now());
  // Overwrite the year/month/day of the current date object to get the correct date in the correct timezone.
  date.setFullYear(utcDate.getUTCFullYear());
  date.setMonth(utcDate.getUTCMonth());
  date.setDate(utcDate.getUTCDate());

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
