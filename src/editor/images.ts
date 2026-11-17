import { t } from '../shared/i18n';
import type { Language } from '../shared/model';
export const MAX_PHOTO_BYTES = 300 * 1024;

async function decodePhoto(
  file: File,
  lang: Language,
): Promise<{ image: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (
    /\.svgz?$/i.test(file.name) ||
    file.type === 'image/svg+xml' ||
    /^\s*</.test(await file.slice(0, 256).text()) ||
    (!file.type.startsWith('image/') &&
      !/\.(jpe?g|jfif|png|webp|gif|avif|bmp|ico|heic|heif)$/i.test(file.name))
  )
    throw new Error(
      t(
        'Choose a photo, such as JPEG, PNG, WebP, AVIF, GIF or BMP. SVG and documents are not supported.',
        lang,
      ),
    );
  let source: CanvasImageSource, width: number, height: number, close: () => void;
  try {
    const bitmap = await createImageBitmap(file);
    source = bitmap;
    width = bitmap.width;
    height = bitmap.height;
    close = () => bitmap.close();
  } catch {
    const url = URL.createObjectURL(file),
      image = new Image();
    try {
      image.src = url;
      await image.decode();
      source = image;
      width = image.naturalWidth;
      height = image.naturalHeight;
      close = () => {
        image.src = '';
        URL.revokeObjectURL(url);
      };
    } catch {
      URL.revokeObjectURL(url);
      throw new Error(
        t(
          'This browser could not open the photo. Try another browser, or convert it to JPEG or PNG. Very large images may exceed your device memory.',
          lang,
        ),
      );
    }
  }
  const ratio = Math.min(1, 2400 / Math.max(width, height));
  if (ratio < 1) {
    const reduced = document.createElement('canvas');
    reduced.width = Math.max(1, Math.round(width * ratio));
    reduced.height = Math.max(1, Math.round(height * ratio));
    const context = reduced.getContext('2d');
    if (!context) {
      close();
      throw new Error(t('Image could not be decoded.', lang));
    }
    context.drawImage(source, 0, 0, reduced.width, reduced.height);
    close();
    return {
      image: reduced,
      width: reduced.width,
      height: reduced.height,
      close: () => {
        reduced.width = 0;
        reduced.height = 0;
      },
    };
  }
  return { image: source, width, height, close };
}

function encode(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((ok, no) =>
    canvas.toBlob(
      (blob) => (blob ? ok(blob) : no(new Error('Image compression failed.'))),
      type,
      quality,
    ),
  );
}
export async function compressPhoto(
  canvas: HTMLCanvasElement,
): Promise<{ bytes: Uint8Array; extension: string }> {
  let working = canvas;
  let type = 'image/webp';
  for (let pass = 0; pass < 10; pass++) {
    for (const quality of [0.84, 0.72, 0.6, 0.48]) {
      let blob = await encode(working, type, quality);
      if (blob.type !== type) {
        type = 'image/jpeg';
        blob = await encode(working, type, quality);
      }
      if (blob.size <= MAX_PHOTO_BYTES)
        return {
          bytes: new Uint8Array(await blob.arrayBuffer()),
          extension: type === 'image/webp' ? 'webp' : 'jpg',
        };
    }
    const smaller = document.createElement('canvas');
    smaller.width = Math.max(1, Math.round(working.width * 0.8));
    smaller.height = Math.max(1, Math.round(working.height * 0.8));
    smaller.getContext('2d')!.drawImage(working, 0, 0, smaller.width, smaller.height);
    working = smaller;
  }
  throw new Error('Image compression failed.');
}
export async function processImage(
  file: File,
  lang: Language,
): Promise<{ bytes: Uint8Array; extension: string } | null> {
  const tr = (key: string) => t(key, lang),
    bitmap = await decodePhoto(file, lang);
  return await new Promise((resolve, reject) => {
    const dialog = document.createElement('dialog');
    dialog.setAttribute('aria-label', tr('Photos'));
    dialog.innerHTML = `<div class="modal-heading"><h2>${tr('Photos')}</h2><button class="button" data-cancel>${tr('Cancel')}</button></div><p class="hint">${tr('Photos are converted and compressed on this device to WebP or JPEG, up to 1200 px and 300 KB. Animated images use the first frame.')}</p><canvas width="1200" height="900" class="crop-canvas"></canvas><div class="stack"><label>${tr('Zoom / crop')}<input type="range" name="zoom" min="1" max="3" step=".01" value="1"></label><label>${tr('Horizontal position')}<input type="range" name="x" min="-100" max="100" value="0"></label><label>${tr('Vertical position')}<input type="range" name="y" min="-100" max="100" value="0"></label></div><div class="qr-output-actions"><button class="button" data-rotate>${tr('Rotate')} 90°</button><button class="button primary" data-use>${tr('Use photo')}</button></div>`;
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
      ctx.drawImage(bitmap.image, -bitmap.width / 2, -bitmap.height / 2);
      ctx.restore();
    }
    dialog.oninput = draw;
    dialog.querySelector<HTMLElement>('[data-rotate]')!.onclick = () => {
      angle = (angle + 90) % 360;
      draw();
    };
    dialog.querySelector<HTMLElement>('[data-cancel]')!.onclick = () => dialog.close();
    dialog.querySelector<HTMLElement>('[data-use]')!.onclick = async () => {
      const button = dialog.querySelector<HTMLButtonElement>('[data-use]')!;
      button.disabled = true;
      try {
        const processed = await compressPhoto(canvas);
        if (!dialog.open) return;
        finished = true;
        resolve(processed);
        dialog.close();
      } catch (error) {
        finished = true;
        reject(new Error(tr(error instanceof Error ? error.message : 'Image compression failed.')));
        dialog.close();
      }
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
