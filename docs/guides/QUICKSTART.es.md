# PetQR — Inicio rápido

Una pequeña placa. Un camino a casa. Crea perfiles públicos y QR permanentes para varios animales, sin servidor, base de datos ni cuenta central de PetQR.

1. En GitHub, usa **Use this template → Create a new repository** en tu cuenta. La plantilla ya está activada. [Crea tu copia directamente](https://github.com/new?template_owner=adriaabad&template_name=petqr&name=petqr&visibility=public). Elige un repositorio público para GitHub Pages gratuito.
2. En **tu repositorio nuevo** (el nombre que has elegido, no `adriaabad/petqr`), activa la publicación:
   1. Abre **Settings → Pages**. En **Build and deployment → Source**, despliega el menú y selecciona **GitHub Actions**. Si aparecen tarjetas para configurar **Jekyll** o **Static HTML**, ignóralas: PetQR ya incluye su propio workflow.
   2. En **Code**, comprueba que estás en la rama `main` y que existe `.github/workflows/pages.yml`.
   3. Abre **Actions**. En la barra lateral izquierda, selecciona **Validate, test & deploy PetQR**. Si GitHub te pide activar Actions, actívalas y vuelve aquí. También puedes abrir directamente `https://github.com/USUARIO/REPOSITORIO/actions/workflows/pages.yml`, cambiando `USUARIO` y `REPOSITORIO` por los tuyos.
   4. **Encima de la lista de ejecuciones**, pulsa **Run workflow**, selecciona la rama `main` y vuelve a pulsar **Run workflow** para confirmar. Espera a que **build** y **deploy** terminen en verde.
   5. Si ya existe una ejecución roja iniciada al crear el repositorio, ábrela para ver el error. Puede haber empezado antes de que activaras Pages; la nueva ejecución del punto anterior es la que debe publicar la web.
3. Vuelve a **Settings → Pages** y pulsa **Visit site**. Añade `/editor/` al final de la URL publicada. Los ejemplos son ficticios: sustituye animales, fotos y contactos.
4. En Contactos, añade tus datos y confirma que quieres publicarlos. Asígnalos a cada animal. En Ajustes, verifica la URL pública.
5. Edita, previsualiza y usa **Exportar archivos**. Extrae el ZIP: sustituye `data/` y combina `assets/pets/` en tu repositorio. Confirma los cambios y espera a que termine Actions.
6. Abre cada perfil publicado, genera su QR y comprueba el enlace y la impresión con varios teléfonos.

**Todo lo subido a GitHub Pages y al repositorio público es público.** Los campos no publicados se excluyen del ZIP; un borrador local solo se guarda si lo pides. No subas documentos, direcciones exactas ni datos confidenciales. Desactivar el índice o usar noindex no da privacidad.

En Identidad puedes añadir el número de microchip y el número de registro. Marca Publicar y confirma solo si quieres mostrarlos públicamente. Exporta el ZIP y súbelo a GitHub para actualizar la web; el QR se mantiene. No cambies la URL, el nombre del repositorio ni el ID después de imprimir placas.

El editor funciona en catalán, castellano e inglés. La ficha tiene un único formulario, sin modo Avanzado ni estado de perdido/encontrado. Los detalles adicionales ya existentes se conservan. Fotos: recorte, giro y compresión locales. QR: SVG, PNG, colores, márgenes y placas imprimibles. Las modificaciones locales no se guardan automáticamente en GitHub.

La [guía completa](../../README.md), la [guía de privacidad](PRIVACY.md) y la [guía de despliegue](DEPLOYMENT.md) incluyen todos los detalles. Para desarrollo local: `npm ci`, `npm run dev`. Para comprobar: `npm run build`, `npm test`, `npm run test:e2e` tras instalar Playwright Chromium.
