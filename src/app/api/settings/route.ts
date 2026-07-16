import { NextRequest, NextResponse } from 'next/server';
import { readSettings, updateTitle } from '@/lib/settingsStore';
import { validateAppTitle } from '@/lib/validation';

export async function GET() {
  try {
    const settings = await readSettings();
    return NextResponse.json(settings, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as { title?: string };

    const titleResult = validateAppTitle(body.title ?? '');
    if (!titleResult.valid) {
      return NextResponse.json({ error: titleResult.error }, { status: 400 });
    }

    const updated = await updateTitle((body.title ?? '').trim());
    return NextResponse.json(updated, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
