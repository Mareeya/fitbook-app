/** Backend stores session times in UTC; send ISO-8601 from the client. */
export function toApiDateTime(value: Date): string {
  return value.toISOString();
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function startOfLocalDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Value for `<input type="datetime-local">` from an API UTC string. */
export function toDateTimeLocalValue(isoUtc: string): string {
  const date = new Date(isoUtc);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Parse datetime-local control value to ISO UTC for the API. */
export function fromDateTimeLocalValue(localValue: string): string {
  return new Date(localValue).toISOString();
}

/** Merge a calendar date (no time) with an `HH:mm` time for the API. */
export function combineDateAndTime(date: Date, timeHHmm: string): string {
  const [hours, minutes] = timeHHmm.split(':').map((part) => Number(part));
  const combined = new Date(date);
  combined.setHours(hours, minutes, 0, 0);
  return combined.toISOString();
}

/** Split an API UTC timestamp into a local calendar date and `HH:mm`. */
export function splitDateAndTime(isoUtc: string): { date: Date; time: string } {
  const value = new Date(isoUtc);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: new Date(value.getFullYear(), value.getMonth(), value.getDate()),
    time: `${pad(value.getHours())}:${pad(value.getMinutes())}`,
  };
}

/** Backend `to` query is exclusive — include all of the selected end date. */
export function toExclusiveApiEnd(endDateInclusive: Date): string {
  return toApiDateTime(addDays(startOfLocalDay(endDateInclusive), 1));
}

export function formatSessionDateTime(isoUtc: string): { dateLabel: string; timeLabel: string } {
  const date = new Date(isoUtc);
  return {
    dateLabel: date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
    timeLabel: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  };
}
