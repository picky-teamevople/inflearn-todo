import { signIn } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-xl font-bold text-neutral-900">To Do</h1>
      <p className="text-sm text-neutral-500">
        로그인하고 나만의 할 일을 관리하세요.
      </p>
      <form
        action={async () => {
          'use server';
          await signIn('google', { redirectTo: '/' });
        }}
      >
        <Button type="submit">Google로 계속하기</Button>
      </form>
    </div>
  );
}
