import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/requireUserId';
import { createTodo, readTodos } from '@/lib/todoStore';
import {
  validateCategories,
  validateDueDate,
  validateTitle,
} from '@/lib/validation';
import type { CreateTodoInput } from '@/types/todo';

export async function GET() {
  const auth = await requireUserId();
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const todos = await readTodos(auth.userId);
    return NextResponse.json(todos, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUserId();
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const body = (await request.json()) as CreateTodoInput;

    const titleResult = validateTitle(body.title ?? '');
    if (!titleResult.valid) {
      return NextResponse.json({ error: titleResult.error }, { status: 400 });
    }

    const dueDateResult = validateDueDate(body.dueDate ?? null);
    if (!dueDateResult.valid) {
      return NextResponse.json(
        { error: dueDateResult.error },
        { status: 400 }
      );
    }

    const categoriesResult = validateCategories(body.categories ?? []);
    if (!categoriesResult.valid) {
      return NextResponse.json(
        { error: categoriesResult.error },
        { status: 400 }
      );
    }

    const todo = await createTodo(auth.userId, body);
    return NextResponse.json(todo, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
