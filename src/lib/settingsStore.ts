import { mkdir, readFile, rename, writeFile } from 'fs/promises';
import path from 'path';
import type { AppSettings } from '@/types/settings';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'settings.json');
const TEMP_FILE = path.join(DATA_DIR, 'settings.json.tmp');

const DEFAULT_SETTINGS: AppSettings = { title: 'To Do' };

/** JSON 파일 읽기 (파일 없으면 기본값) */
export async function readSettings(): Promise<AppSettings> {
  try {
    const raw = await readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      return DEFAULT_SETTINGS;
    }
    throw error;
  }
}

/** 임시 파일에 쓴 뒤 rename으로 원자적 교체 */
export async function writeSettingsAtomic(
  settings: AppSettings
): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(TEMP_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  await rename(TEMP_FILE, DATA_FILE);
}

/** 앱 제목 수정 후 저장 */
export async function updateTitle(title: string): Promise<AppSettings> {
  const settings = await readSettings();
  const updated: AppSettings = { ...settings, title: title.trim() };
  await writeSettingsAtomic(updated);
  return updated;
}
