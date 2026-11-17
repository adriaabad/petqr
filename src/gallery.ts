// Progressive enhancement: without JavaScript the thumbnails open the original photos.
export function bindPhotoGallery(root: Document = document): void {
  const main = root.querySelector<HTMLImageElement>('.profile-photo img');
  if (!main) return;
  const links = [...root.querySelectorAll<HTMLAnchorElement>('.photo-thumbnail')];
  for (const link of links)
    link.onclick = (event) => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
        return;
      const image = link.querySelector('img')!;
      event.preventDefault();
      main.src = link.href;
      main.alt = image.alt;
      main.style.objectPosition = image.style.objectPosition;
      for (const item of links) item.removeAttribute('aria-current');
      link.setAttribute('aria-current', 'true');
    };
}
