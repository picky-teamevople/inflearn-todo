import { readJson, writeJson } from '@/lib/blobJsonStore';
import type { AppSettings } from '@/types/settings';

const DEFAULT_SETTINGS: AppSettings = { title: 'To Do' };

function pathnameFor(userId: string): string {
  return `settings/${userId}.json`;
}

/** 사용자의 앱 설정 읽기 (없으면 기본값) */
export async function readSettings(userId: string): Promise<AppSettings> {
  const parsed = await readJson<Partial<AppSettings>>(
    pathnameFor(userId),
    DEFAULT_SETTINGS
  );
  return { ...DEFAULT_SETTINGS, ...parsed };
}

/** 앱 설정 전체 저장 */
export async function writeSettingsAtomic(
  userId: string,
  settings: AppSettings
): Promise<void> {
  await writeJson(pathnameFor(userId), settings);
}

/** 앱 제목 수정 후 저장 */
export async function updateTitle(
  userId: string,
  title: string
): Promise<AppSettings> {
  const settings = await readSettings(userId);
  const updated: AppSettings = { ...settings, title: title.trim() };
  await writeSettingsAtomic(userId, updated);
  return updated;
}
