import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/requireUserId';
import { deleteTodo, updateTodo } from '@/lib/todoStore';
import {
  validateCategories,
  validateDueDate,
  validateTitle,
} from '@/lib/validation';
import type { UpdateTodoInput } from '@/types/todo';

const NOT_FOUND_MESSAGE = '존재하지 않는 항목입니다';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireUserId();
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as UpdateTodoInput;

    if (body.title !== undefined) {
      const titleResult = validateTitle(body.title);
      if (!titleResult.valid) {
        return NextResponse.json(
          { error: titleResult.error },
          { status: 400 }
        );
      }
    }

    if (body.dueDate !== undefined) {
      const dueDateResult = validateDueDate(body.dueDate);
      if (!dueDateResult.valid) {
        return NextResponse.json(
          { error: dueDateResult.error },
          { status: 400 }
        );
      }
    }

    if (body.categories !== undefined) {
      const categoriesResult = validateCategories(body.categories);
      if (!categoriesResult.valid) {
        return NextResponse.json(
          { error: categoriesResult.error },
          { status: 400 }
        );
      }
    }

    const updated = await updateTodo(auth.userId, id, body);

    if (!updated) {
      return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireUserId();
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const { id } = await context.params;
    const success = await deleteTodo(auth.userId, id);

    if (!success) {
      return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
