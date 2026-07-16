import { NextRequest, NextResponse } from 'next/server';
import {
  deleteCategory,
  readCategories,
  updateCategory,
} from '@/lib/categoryStore';
import { validateCategoryName } from '@/lib/validation';

const NOT_FOUND_MESSAGE = '존재하지 않는 카테고리입니다';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { name?: string };
    const existing = await readCategories();
    const target = existing.find((category) => category.id === id);

    if (!target) {
      return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
    }

    const otherNames = existing
      .filter((category) => category.id !== id)
      .map((category) => category.name);

    const nameResult = validateCategoryName(body.name ?? '', otherNames);
    if (!nameResult.valid) {
      return NextResponse.json({ error: nameResult.error }, { status: 400 });
    }

    const updated = await updateCategory(id, (body.name ?? '').trim());

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
  try {
    const { id } = await context.params;
    const success = await deleteCategory(id);

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
