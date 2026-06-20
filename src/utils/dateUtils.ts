export type DateFormatType =
  | 'YYYY-MM-DD'
  | 'YYYY/MM/DD'
  | 'YYYY-MM-DD HH:mm'
  | 'YYYY-MM-DD HH:mm:ss'
  | 'YYYY/MM/DD HH:mm'
  | 'YYYY年MM月DD日'
  | 'YYYY年MM月DD日 HH:mm'
  | 'MM-DD'
  | 'MM/DD'
  | 'HH:mm'
  | 'HH:mm:ss';

export interface OverdueCheckResult {
  isOverdue: boolean;
  overdueDays: number;
  remainingDays: number;
}

export const OVERDUE_THRESHOLD_DAYS = 7;

function pad(num: number): string {
  return num.toString().padStart(2, '0');
}

export function formatDate(date: Date | string | number, format: DateFormatType = 'YYYY-MM-DD'): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'YYYY/MM/DD':
      return `${year}/${month}/${day}`;
    case 'YYYY-MM-DD HH:mm':
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    case 'YYYY-MM-DD HH:mm:ss':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    case 'YYYY/MM/DD HH:mm':
      return `${year}/${month}/${day} ${hours}:${minutes}`;
    case 'YYYY年MM月DD日':
      return `${year}年${month}月${day}日`;
    case 'YYYY年MM月DD日 HH:mm':
      return `${year}年${month}月${day}日 ${hours}:${minutes}`;
    case 'MM-DD':
      return `${month}-${day}`;
    case 'MM/DD':
      return `${month}/${day}`;
    case 'HH:mm':
      return `${hours}:${minutes}`;
    case 'HH:mm:ss':
      return `${hours}:${minutes}:${seconds}`;
    default:
      return `${year}-${month}-${day}`;
  }
}

export function formatRelativeTime(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 7) return `${diffDay}天前`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}周前`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)}个月前`;
  return `${Math.floor(diffDay / 365)}年前`;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function diffInDays(from: Date | string | number, to: Date | string | number): number {
  const fromDate = startOfDay(from instanceof Date ? from : new Date(from));
  const toDate = startOfDay(to instanceof Date ? to : new Date(to));
  const diffMs = toDate.getTime() - fromDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function calculateOverdueDays(
  storedDate: Date | string | number,
  thresholdDays: number = OVERDUE_THRESHOLD_DAYS
): number {
  const days = diffInDays(storedDate, new Date());
  return Math.max(0, days - thresholdDays);
}

export function checkOverdue(
  storedDate: Date | string | number,
  thresholdDays: number = OVERDUE_THRESHOLD_DAYS
): OverdueCheckResult {
  const daysStored = diffInDays(storedDate, new Date());
  const overdueDays = Math.max(0, daysStored - thresholdDays);
  const remainingDays = Math.max(0, thresholdDays - daysStored);

  return {
    isOverdue: daysStored > thresholdDays,
    overdueDays,
    remainingDays,
  };
}

export function isToday(date: Date | string | number): boolean {
  const d = date instanceof Date ? date : new Date(date);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

export function isYesterday(date: Date | string | number): boolean {
  const d = date instanceof Date ? date : new Date(date);
  const yesterday = addDays(new Date(), -1);
  return (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  );
}

export function getToday(): Date {
  return startOfDay(new Date());
}

export function parseDateSafe(dateStr: string | undefined | null): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}
