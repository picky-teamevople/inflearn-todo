import { Badge } from '@/components/ui/badge';
import { getDeadlineStatus } from '@/hooks/useDeadlineStatus';

interface DueDateBadgeProps {
  dueDate: string | null; // ISO 8601 문자열 또는 null("마감일 없음")
  completed: boolean;
}

const NO_DUE_DATE_LABEL = '마감일 없음';
const UPCOMING_LABEL = '임박';
const OVERDUE_LABEL = '기한 초과';

function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate);
  const pad = (value: number) => value.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function DueDateBadge({ dueDate, completed }: DueDateBadgeProps) {
  const status = getDeadlineStatus(dueDate, completed);

  if (dueDate === null) {
    return (
      <Badge variant="outline" className="text-neutral-500">
        {NO_DUE_DATE_LABEL}
      </Badge>
    );
  }

  const formatted = formatDueDate(dueDate);

  if (status === 'overdue') {
    return (
      <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
        {OVERDUE_LABEL} · {formatted}
      </Badge>
    );
  }

  if (status === 'upcoming') {
    return (
      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
        {UPCOMING_LABEL} · {formatted}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-neutral-600">
      {formatted}
    </Badge>
  );
}
