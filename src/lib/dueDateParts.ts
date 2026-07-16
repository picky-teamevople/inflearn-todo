export type Period = 'AM' | 'PM';

export interface DueDateParts {
  date: string; // YYYY-MM-DD (date input 값)
  period: Period; // 오전/오후
  time: string; // hh:mm, 12시간제 (01~12:00~59)
}

const TIME_PATTERN = /^(0?[1-9]|1[0-2]):([0-5][0-9])$/;

const pad = (value: number) => String(value).padStart(2, '0');

function toDateValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toPeriodAndTime(date: Date): { period: Period; time: string } {
  const hours24 = date.getHours();
  const period: Period = hours24 < 12 ? 'AM' : 'PM';
  const hour12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return { period, time: `${pad(hour12)}:${pad(date.getMinutes())}` };
}

/** 현재 시각 기준 기본 DueDateParts (마감일 체크 시 기본값으로 사용) */
export function nowAsDueDateParts(): DueDateParts {
  const now = new Date();
  return { date: toDateValue(now), ...toPeriodAndTime(now) };
}

/** ISO 8601 문자열을 DueDateParts로 변환, null이거나 파싱 실패 시 현재 시각 기준 기본값 */
export function toDueDateParts(dueDate: string | null): DueDateParts {
  if (dueDate === null) {
    return nowAsDueDateParts();
  }
  const parsed = new Date(dueDate);
  if (Number.isNaN(parsed.getTime())) {
    return nowAsDueDateParts();
  }
  return { date: toDateValue(parsed), ...toPeriodAndTime(parsed) };
}

/** DueDateParts를 ISO 8601 문자열로 변환, 날짜/시간 형식이 올바르지 않으면 null */
export function fromDueDateParts(parts: DueDateParts): string | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(parts.date);
  const timeMatch = TIME_PATTERN.exec(parts.time.trim());

  if (!dateMatch || !timeMatch) {
    return null;
  }

  const [, yearStr, monthStr, dayStr] = dateMatch;
  const [, hourStr, minuteStr] = timeMatch;

  const hour12 = Number(hourStr) % 12;
  const hour24 = parts.period === 'PM' ? hour12 + 12 : hour12;

  const date = new Date(
    Number(yearStr),
    Number(monthStr) - 1,
    Number(dayStr),
    hour24,
    Number(minuteStr),
    0,
    0
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}
