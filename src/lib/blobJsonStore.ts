import { BlobNotFoundError, get, put } from '@vercel/blob';

/** pathname에 저장된 JSON을 읽는다. 없으면 defaultValue 반환 */
export async function readJson<T>(pathname: string, defaultValue: T): Promise<T> {
  try {
    const result = await get(pathname, { access: 'private' });
    if (!result) {
      return defaultValue;
    }
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as T;
  } catch (error) {
    if (error instanceof BlobNotFoundError) {
      return defaultValue;
    }
    throw error;
  }
}

/** pathname에 JSON을 통째로 덮어쓴다 */
export async function writeJson<T>(pathname: string, value: T): Promise<void> {
  await put(pathname, JSON.stringify(value, null, 2), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}
