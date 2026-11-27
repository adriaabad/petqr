import QRCode, { type QRCodeErrorCorrectionLevel } from 'qrcode';
import { publicPetURL, type Config, type Pet, type Language } from '../shared/model';
import { t } from '../shared/i18n';
import { esc } from '../public/render';
import { download, svgToPNG } from './download';
import { copy, toast } from '../shared/preferences';
export function luminance(hex: string): number {
  const rgb = hex
    .slice(1)
    .match(/../g)!
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}
export function validQRColors(foreground: string, background: string): boolean {
  return (
    luminance(background) > luminance(foreground) &&
    (luminance(background) + 0.05) / (luminance(foreground) + 0.05) >= 7
  );
}
export async function qrSVG(
  url: string,
  options: {
    foreground?: string;
    background?: string;
    level?: QRCodeErrorCorrectionLevel;
    margin?: number;
    label?: string;
  } = {},
): Promise<string> {
  const {
    foreground = '#153c33',
    background = '#ffffff',
    level = 'M',
    margin = 4,
    label = '',
  } = options;
  if (
    !/^#[a-f0-9]{6}$/i.test(foreground) ||
    !/^#[a-f0-9]{6}$/i.test(background) ||
    !validQRColors(foreground, background)
  )
    throw new Error('Use dark code on a light background with at least 7:1 contrast.');
  const svg = await QRCode.toString(url, {
    type: 'svg',
    margin: Math.max(4, Math.min(12, margin)),
    errorCorrectionLevel: level,
    color: { dark: foreground, light: background },
  });
  if (!label) return svg;
  const dimension = Number(svg.match(/viewBox="0 0 (\d+)/)?.[1]);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dimension} ${dimension + 10}"><rect width="100%" height="100%" fill="${background}"/>${svg.replace('<svg ', `<svg x="0" y="0" width="${dimension}" height="${dimension}" `)}<text x="${dimension / 2}" y="${dimension + 6}" text-anchor="middle" font-family="sans-serif" font-size="4.5" fill="${foreground}">${esc(label)}</text></svg>`;
}
export function qr3DSVG(
  url: string,
  options: { sizeMm?: number; level?: QRCodeErrorCorrectionLevel; margin?: number } = {},
): string {
  const { sizeMm = 50, level = 'M', margin = 4 } = options;
  if (!Number.isFinite(sizeMm) || sizeMm < 25 || sizeMm > 120)
    throw new Error('3D QR size must be 25–120 mm.');
  if (!Number.isInteger(margin) || margin < 4 || margin > 12)
    throw new Error('Quiet zone must be 4–12 modules.');
  const qr = QRCode.create(url, { errorCorrectionLevel: level });
  const count = qr.modules.size;
  const total = count + margin * 2;
  const segments: string[] = [];
  for (let y = 0; y < count; y++) {
    for (let x = 0; x < count;) {
      if (!qr.modules.data[y * count + x]) {
        x++;
        continue;
      }
      const start = x;
      while (x < count && qr.modules.data[y * count + x]) x++;
      segments.push(`M${start + margin} ${y + margin}h${x - start}v1h-${x - start}z`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${sizeMm}mm" height="${sizeMm}mm" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges"><path fill="#000000" d="${segments.join('')}"/></svg>`;
}
export function tagSVG(
  qr: string,
  options: {
    width: number;
    height: number;
    shape: string;
    name: string;
    phone: string;
    text: string;
  },
): string {
  const { width: w, height: h, shape, name, phone, text } = options;
  const size = Math.min(w, h) * 0.62;
  if (w < 35 || h < 35 || w > 120 || h > 120 || size < 25)
    throw new Error('Tag dimensions must be 41–120 mm so the QR is at least 25 mm.');
  const border =
    shape === 'Circle'
      ? `<circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) / 2 - 0.5}"/>`
      : `<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${shape === 'Rounded rectangle' ? 4 : 0}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}"><g fill="white" stroke="black" stroke-width=".25">${border}</g>${qr.replace(/<svg /, `<svg x="${(w - size) / 2}" y="${h * 0.12}" width="${size}" height="${size}" `)}<g fill="black" text-anchor="middle" font-family="sans-serif"><text x="${w / 2}" y="${h * 0.8}" font-size="3.2" font-weight="bold">${esc(name.slice(0, 30))}</text><text x="${w / 2}" y="${h * 0.875}" font-size="2.2">${esc(phone.slice(0, 30))}</text><text x="${w / 2}" y="${h * 0.94}" font-size="1.7">${esc(text.slice(0, 40))}</text></g></svg>`;
}
export function openQR(config: Config, pet: Pet, lang: Language): void {
  const tr = (k: string) => t(k, lang);
  const dialog = document.createElement('dialog');
  dialog.setAttribute('aria-label', tr('QR code'));
  let url = '';
  try {
    url = publicPetURL(config.site.publicUrl, pet);
  } catch {}
  dialog.innerHTML = `<div class="modal-heading"><h2>${tr('QR code')} · ${esc(pet.name)}</h2><button class="button" data-close>${tr('Close')}</button></div>${url ? `<div class="url-display">${esc(url)}</div><div class="qr-preview" data-qr></div><p class="error-box" data-qr-error role="alert"></p><div class="qr-options"><label>${tr('Resolution')}<select name="resolution" aria-label="${tr('Resolution')}"><option>512</option><option selected>1024</option><option>2048</option></select></label><label>${tr('Error correction')}<select name="level" aria-label="${tr('Error correction')}"><option>L</option><option selected>M</option><option>Q</option><option>H</option></select></label><label>${tr('Foreground')}<input name="foreground" type="color" value="#153c33"></label><label>${tr('Background color')}<input name="background" type="color" value="#ffffff"></label><label>${tr('Quiet zone (modules)')}<input name="margin" type="number" min="4" max="12" value="4"></label><label class="check"><input type="checkbox" name="label">${tr('Include pet name')}</label></div><div class="qr-output-actions"><button class="button primary" data-svg>${tr('Download SVG')}</button><button class="button" data-png>${tr('Download PNG')}</button><button class="button" data-copy-url>${tr('Copy URL')}</button><a class="button" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${tr('Test destination')}</a></div><p class="hint">${tr('Keep at least four clear modules around the code. Print at least 25 mm, larger for long URLs. Test with multiple phones before engraving.')}</p><div class="divider"></div><h3>${tr('3D printing SVG')}</h3><p class="hint">${tr('Filled QR modules only, with a transparent background and real millimeter size. Import as an SVG modifier or embossing shape, set a 0.8 mm raised height in your slicer, and keep the quiet zone clear.')}</p><div class="qr-options"><label>${tr('3D QR size (mm)')}<input name="qr3d-size" type="number" min="25" max="120" step="1" value="50"></label></div><div class="qr-output-actions"><button class="button primary" data-qr-3d-svg>${tr('Download 3D SVG')}</button></div><div class="qr-preview qr-preview-3d" data-qr-3d></div><div class="divider"></div><h3>${tr('Printable tag')}</h3><div class="form-grid tag-options"><label>${tr('Shape')}<select name="shape" aria-label="${tr('Shape')}">${['Rounded rectangle', 'Rectangle', 'Square', 'Circle'].map((s) => `<option value="${s}">${tr(s)}</option>`).join('')}</select></label><label>${tr('Width (mm)')}<input name="width" type="number" min="41" max="120" value="50"></label><label>${tr('Height (mm)')}<input name="height" type="number" min="41" max="120" value="50"></label><label>${tr('Phone on tag')}<input name="phone" maxlength="30"></label><label class="wide">${tr('Short text')}<input name="text" maxlength="40"></label></div><div class="tag-preview" data-tag></div><div class="qr-output-actions"><button class="button" data-tag-svg>${tr('Download tag SVG')}</button><button class="button" data-tag-png>${tr('Download tag PNG')}</button><button class="button" data-print>${tr('Print')}</button></div>` : `<div class="notice warning">${tr('QR codes require a final public URL. Configure it in Settings before printing.')}</div>`}`;
  document.body.append(dialog);
  dialog.showModal();
  dialog.querySelector<HTMLElement>('[data-close]')!.onclick = () => dialog.close();
  dialog.onclose = () => dialog.remove();
  if (!url) return;
  const get = (name: string) =>
    (dialog.querySelector(`[name="${name}"]`) as HTMLInputElement).value;
  let svg = '',
    svg3d = '',
    tag = '',
    sequence = 0;
  async function update() {
    const ticket = ++sequence;
    svg = '';
    svg3d = '';
    tag = '';
    try {
      const code = await qrSVG(url, {
        foreground: get('foreground'),
        background: get('background'),
        level: get('level') as QRCodeErrorCorrectionLevel,
        margin: Number(get('margin')),
        label: dialog.querySelector<HTMLInputElement>('[name=label]')!.checked ? pet.name : '',
      });
      const code3d = qr3DSVG(url, {
        sizeMm: Number(get('qr3d-size')),
        level: get('level') as QRCodeErrorCorrectionLevel,
        margin: Number(get('margin')),
      });
      const shape = get('shape'),
        w = Number(get('width')),
        h = ['Square', 'Circle'].includes(shape) ? w : Number(get('height'));
      (dialog.querySelector('[name=height]') as HTMLInputElement).disabled = [
        'Square',
        'Circle',
      ].includes(shape);
      const tagCode = tagSVG(
        await qrSVG(url, { level: get('level') as QRCodeErrorCorrectionLevel }),
        { width: w, height: h, shape, name: pet.name, phone: get('phone'), text: get('text') },
      );
      if (ticket !== sequence) return;
      svg = code;
      svg3d = code3d;
      tag = tagCode;
      dialog.querySelector('[data-qr]')!.innerHTML = svg;
      dialog.querySelector('[data-qr-3d]')!.innerHTML = svg3d;
      dialog.querySelector('[data-tag]')!.innerHTML = tag;
      dialog.querySelector('[data-qr-error]')!.textContent = '';
    } catch (error) {
      if (ticket === sequence) {
        dialog.querySelector('[data-qr-error]')!.textContent = tr(
          error instanceof Error ? error.message : String(error),
        );
        dialog.querySelector('[data-qr]')!.replaceChildren();
        dialog.querySelector('[data-qr-3d]')!.replaceChildren();
        dialog.querySelector('[data-tag]')!.replaceChildren();
      }
    }
  }
  dialog.oninput = () => {
    void update();
  };
  void update();
  dialog.querySelector<HTMLElement>('[data-copy-url]')!.onclick = () => {
    void copy(url, lang);
  };
  dialog.querySelector<HTMLElement>('[data-svg]')!.onclick = () => {
    if (svg) download(svg, `${pet.id}-qr.svg`, 'image/svg+xml');
  };
  dialog.querySelector<HTMLElement>('[data-qr-3d-svg]')!.onclick = () => {
    if (svg3d) download(svg3d, `${pet.id}-qr-3d.svg`, 'image/svg+xml');
  };
  dialog.querySelector<HTMLElement>('[data-tag-svg]')!.onclick = () => {
    if (tag) download(tag, `${pet.id}-tag.svg`, 'image/svg+xml');
  };
  for (const [selector, isTag] of [
    ['[data-png]', false],
    ['[data-tag-png]', true],
  ] as const)
    dialog.querySelector<HTMLElement>(selector)!.onclick = () => {
      const source = isTag ? tag : svg;
      if (!source) return;
      void svgToPNG(source, Number(get('resolution')))
        .then((blob) => download(blob, `${pet.id}-${isTag ? 'tag' : 'qr'}.png`, 'image/png'))
        .catch((e) => toast(String(e)));
    };
  dialog.querySelector<HTMLElement>('[data-print]')!.onclick = () => {
    if (!tag) return;
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;width:0;height:0;border:0';
    document.body.append(frame);
    frame.onload = () => {
      frame.contentWindow!.focus();
      frame.contentWindow!.print();
      setTimeout(() => frame.remove(), 60000);
    };
    frame.srcdoc = `<!doctype html><html><head><title>${esc(pet.name)}</title><style>@page{margin:15mm}body{margin:0}svg{display:block}</style></head><body>${tag}</body></html>`;
  };
}
