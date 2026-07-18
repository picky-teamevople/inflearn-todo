import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/** 로그인한 사용자의 id를 반환. 미로그인 시 401 응답을 던진다 */
export async function requireUserId(): Promise<
  { userId: string } | { errorResponse: NextResponse }
> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { userId };
}
