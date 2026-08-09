const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

interface DateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export function isValidTimeZone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}

export function isValidLocalDate(localDate: string): boolean {
  const match = DATE_PATTERN.exec(localDate);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function isValidLocalTime(localTime: string): boolean {
  return TIME_PATTERN.test(localTime);
}

function parseLocalDateTime(localDate: string, localTime: string): DateTimeParts {
  const dateMatch = DATE_PATTERN.exec(localDate);
  const timeMatch = TIME_PATTERN.exec(localTime);
  if (!dateMatch || !isValidLocalDate(localDate)) {
    throw new Error(`Invalid local date: ${localDate}`);
  }
  if (!timeMatch) {
    throw new Error(`Invalid local time: ${localTime}`);
  }
  return {
    year: Number(dateMatch[1]),
    month: Number(dateMatch[2]),
    day: Number(dateMatch[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
  };
}

function partsInTimeZone(date: Date, timezone: string): DateTimeParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes) => {
    const value = parts.find((part) => part.type === type)?.value;
    if (!value) throw new Error(`Unable to read ${type} in ${timezone}`);
    return Number(value);
  };

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
  };
}

function partsAsUtc(parts: DateTimeParts): number {
  return Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
  );
}

export function zonedDateTimeToUtc(
  localDate: string,
  localTime: string,
  timezone: string,
): Date {
  if (!isValidTimeZone(timezone)) {
    throw new Error(`Invalid timezone: ${timezone}`);
  }

  const desired = parseLocalDateTime(localDate, localTime);
  let instant = partsAsUtc(desired);

  // Reconcile the guessed UTC instant with the requested wall-clock time.
  // Two passes cover offset changes around daylight-saving transitions.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const actual = partsInTimeZone(new Date(instant), timezone);
    const difference = partsAsUtc(desired) - partsAsUtc(actual);
    if (difference === 0) break;
    instant += difference;
  }

  const result = new Date(instant);
  const actual = partsInTimeZone(result, timezone);
  if (partsAsUtc(actual) !== partsAsUtc(desired)) {
    throw new Error(
      `Local time ${localDate} ${localTime} does not exist in ${timezone}`,
    );
  }
  return result;
}

export function buildOccurrenceTimes(
  localDate: string,
  localTime: string,
  timezone: string,
  durationMinutes: number,
): { startsAt: string; endsAt: string } {
  const start = zonedDateTimeToUtc(localDate, localTime, timezone);
  return {
    startsAt: start.toISOString(),
    endsAt: new Date(start.getTime() + durationMinutes * 60_000).toISOString(),
  };
}
