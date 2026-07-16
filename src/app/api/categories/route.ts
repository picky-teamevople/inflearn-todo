import { NextRequest, NextResponse } from 'next/server';
import {
  createCategory,
  readCategories,
  reorderCategories,
} from '@/lib/categoryStore';
import { validateCategoryName } from '@/lib/validation';
import type { CreateCategoryInput } from '@/types/category';

export async function GET() {
  try {
    const categories = await readCategories();
    return NextResponse.json(categories, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateCategoryInput;
    const existing = await readCategories();

    const nameResult = validateCategoryName(
      body.name ?? '',
      existing.map((category) => category.name)
    );
    if (!nameResult.valid) {
      return NextResponse.json({ error: nameResult.error }, { status: 400 });
    }

    const category = await createCategory({ name: body.name.trim() });
    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as { orderedIds?: unknown };

    if (
      !Array.isArray(body.orderedIds) ||
      body.orderedIds.some((id) => typeof id !== 'string')
    ) {
      return NextResponse.json(
        { error: '잘못된 요청입니다' },
        { status: 400 }
      );
    }

    const reordered = await reorderCategories(body.orderedIds as string[]);
    return NextResponse.json(reordered, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
