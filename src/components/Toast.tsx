'use client';

interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  if (message === null) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-in fade-in slide-in-from-bottom-2 fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-lg duration-200"
    >
      {message}
    </div>
  );
}
