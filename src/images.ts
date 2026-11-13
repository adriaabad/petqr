import { t } from './i18n';
import type { Language } from './model';
export async function processImage(
  file: File,
  lang: Language,
): Promise<{ bytes: Uint8Array; extension: string } | null> {
  const tr = (key: string) => t(key, lang);
  if (
    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
    file.size > 15 * 1024 * 1024
  )
    throw new Error(tr('Choose an image under 15 MB (JPEG, PNG or WebP).'));
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(tr('Image could not be decoded.'));
  }
  if (bitmap.width * bitmap.height > 50_000_000) {
    bitmap.close();
    throw new Error(tr('Image could not be decoded.'));
  }
  return await new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.setAttribute('aria-label', tr('Photos'));
    dialog.innerHTML = `<div class="modal-heading"><h2>${tr('Photos')}</h2><button class="button" data-cancel>${tr('Cancel')}</button></div><canvas width="1200" height="900" class="crop-canvas"></canvas><div class="stack"><label>${tr('Zoom / crop')}<input type="range" name="zoom" min="1" max="3" step=".01" value="1"></label><label>${tr('Horizontal position')}<input type="range" name="x" min="-100" max="100" value="0"></label><label>${tr('Vertical position')}<input type="range" name="y" min="-100" max="100" value="0"></label></div><div class="qr-output-actions"><button class="button" data-rotate>${tr('Rotate')} 90°</button><button class="button primary" data-use>${tr('Use photo')}</button></div>`;
    const canvas = dialog.querySelector('canvas')!,
      ctx = canvas.getContext('2d')!;
    let angle = 0,
      finished = false;
    const value = (name: string) =>
      Number(dialog.querySelector<HTMLInputElement>(`[name=${name}]`)!.value);
    function draw() {
      const rotated = angle % 180 !== 0,
        w = rotated ? bitmap.height : bitmap.width,
        h = rotated ? bitmap.width : bitmap.height;
      const scale = Math.max(1200 / w, 900 / h) * value('zoom');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 1200, 900);
      ctx.save();
      ctx.translate(
        600 + ((value('x') / 100) * (w * scale - 1200)) / 2,
        450 + ((value('y') / 100) * (h * scale - 900)) / 2,
      );
      ctx.rotate((angle * Math.PI) / 180);
      ctx.scale(scale, scale);
      ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
      ctx.restore();
    }
    dialog.oninput = draw;
    dialog.querySelector<HTMLElement>('[data-rotate]')!.onclick = () => {
      angle = (angle + 90) % 360;
      draw();
    };
    dialog.querySelector<HTMLElement>('[data-cancel]')!.onclick = () => dialog.close();
    dialog.querySelector<HTMLElement>('[data-use]')!.onclick = () => {
      const button = dialog.querySelector<HTMLButtonElement>('[data-use]')!;
      button.disabled = true;
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            button.disabled = false;
            return;
          }
          finished = true;
          resolve({
            bytes: new Uint8Array(await blob.arrayBuffer()),
            extension: blob.type === 'image/webp' ? 'webp' : 'png',
          });
          dialog.close();
        },
        'image/webp',
        0.84,
      );
    };
    dialog.onclose = () => {
      bitmap.close();
      dialog.remove();
      if (!finished) resolve(null);
    };
    document.body.append(dialog);
    dialog.showModal();
    draw();
  });
}
