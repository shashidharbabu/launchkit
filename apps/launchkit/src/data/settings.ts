/** Key/value settings in the store (one row per key), for things like the Studio service address. */
import { flush, insert, selectOne, uid, update } from './blobstore';

export function getSetting(key: string): string | null {
  const row = selectOne('settings', { key });
  return row ? String(row.value ?? '') : null;
}

export function setSetting(key: string, value: string): void {
  if (selectOne('settings', { key })) update('settings', { key }, { value });
  else insert('settings', { id: uid(), key, value });
  flush();
}
