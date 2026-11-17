import { paw } from '../public/render';
const paths: Record<string, string> = {
  contacts:
    '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-17a3 3 0 0 1 0 6m2 5a5 5 0 0 1 3 5v1"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="m9 3-1 3-3 1-2 3 2 3-1 3 3 2 2 3 3-1 3 1 2-3 3-2-1-3 2-3-2-3-3-1-1-3-3 1Z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 4 3c-1 1-1 1-1 3m0 2v.1"/>',
};
export function icon(name: string) {
  if (name === 'pets' || !paths[name]) return paw.replace('<svg ', '<svg width="21" height="21" ');
  return `<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}
