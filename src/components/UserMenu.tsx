import Image from 'next/image';
import { auth, signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export async function UserMenu() {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return null;
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      {user.image ? (
        <Image
          src={user.image}
          alt={user.name ?? '프로필 이미지'}
          width={28}
          height={28}
          className="rounded-full"
        />
      ) : null}
      <span className="hidden text-sm text-neutral-600 sm:inline">
        {user.name}
      </span>
      <form
        action={async () => {
          'use server';
          await signOut({ redirectTo: '/login' });
        }}
      >
        <Button type="submit" variant="ghost" size="sm">
          로그아웃
        </Button>
      </form>
    </div>
  );
}
