import type { Config } from '../shared/model';
import type { ImageFiles } from './archive';
function open(): Promise<IDBDatabase> {
  return new Promise((ok, no) => {
    const r = indexedDB.open('petqr-local-draft', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('draft');
    r.onsuccess = () => ok(r.result);
    r.onerror = () => no(r.error);
    r.onblocked = () => no(new Error('Close other PetQR tabs to access the local draft.'));
  });
}
export async function draftStore(
  action: 'save' | 'read' | 'delete',
  data?: { config: Config; images: ImageFiles },
): Promise<{ config: Config; images: ImageFiles } | undefined> {
  const db = await open();
  try {
    return await new Promise((ok, no) => {
      const tx = db.transaction('draft', action === 'read' ? 'readonly' : 'readwrite');
      const store = tx.objectStore('draft');
      const r =
        action === 'save'
          ? store.put(data, 'current')
          : action === 'delete'
            ? store.delete('current')
            : store.get('current');
      let result: typeof data;
      r.onsuccess = () => {
        result = r.result;
      };
      tx.oncomplete = () => ok(result);
      tx.onerror = () => no(tx.error);
      tx.onabort = () => no(tx.error);
    });
  } finally {
    db.close();
  }
}
