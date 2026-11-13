# PetQR — Inicio rápido

Una pequeña placa. Un camino a casa. Crea perfiles públicos y QR permanentes para varios animales, sin servidor, base de datos ni cuenta central de PetQR.

1. En GitHub, usa **Use this template → Create a new repository** en tu cuenta. El mantenedor debe marcar primero el repositorio como plantilla. Elige un repositorio público para GitHub Pages gratuito.
2. Abre **Settings → Pages → Source → GitHub Actions**. Ejecuta **Actions → Validate, test & deploy PetQR → Run workflow** en la rama predeterminada.
3. Abre la URL de Pages y añade `/editor/`. Los ejemplos son ficticios: sustituye animales, fotos y contactos.
4. En Contactos, añade tus datos y confirma que quieres publicarlos. Asígnalos a cada animal. En Ajustes, verifica la URL pública y desactiva el aviso de datos ficticios.
5. Edita, previsualiza y usa **Conectar GitHub → Guardar y publicar**. La primera vez, pulsa **Crear una clave limitada en GitHub**: selecciona **Only select repositories**, solo tu repositorio PetQR y **Contents: Read and write**. Usa una caducidad corta. Pega la clave únicamente en el campo del editor; nunca en un chat ni en datos de la mascota. Revisa el resumen y pulsa **Publicar cambios**. Espera al aviso «Publicado».
6. Abre cada perfil publicado, genera su QR y comprueba el enlace y la impresión con varios teléfonos.

**Todo lo subido a GitHub Pages y al repositorio público es público.** Los campos no publicados se excluyen del ZIP; un borrador local solo se guarda si lo pides. No subas documentos, direcciones exactas ni datos confidenciales. Desactivar el índice o usar noindex no da privacidad.

La clave permanece solo en la memoria de esta pestaña durante 30 minutos; se olvida al recargar o desconectar. Desconectar no revoca la clave en GitHub. Los visitantes necesitan permisos de escritura y una clave válida para guardar. Protege la clave: el permiso Contents permite modificar el contenido de todo el repositorio. No hay servidor adicional ni inicio de sesión automático. [Detalles del guardado y seguridad](GITHUB_SAVE.md).

También puedes usar **Exportar archivos** sin ninguna clave. Extrae el ZIP, sustituye `data/`, combina `assets/pets/` en tu repositorio y confirma los cambios. Espera a que termine Actions.

Para marcar un animal perdido: Editar → Mensaje de emergencia → Estado → Perdido; guarda y publica. Cambiar datos o estado mantiene el QR. No cambies la URL, el nombre del repositorio ni el ID después de imprimir placas.

El editor funciona en catalán, castellano e inglés. El modo Avanzado permite añadir más de cien campos sugeridos y secciones personalizadas. Fotos: recorte, giro y compresión locales. QR: SVG, PNG, colores, márgenes y placas imprimibles. Las modificaciones locales no se guardan automáticamente en GitHub.

La [guía completa](../README.md), la [guía de privacidad](PRIVACY.md) y la [guía de despliegue](DEPLOYMENT.md) incluyen todos los detalles. Para desarrollo local: `npm ci`, `npm run dev`. Para comprobar: `npm run build`, `npm test`, `npm run test:e2e` tras instalar Playwright Chromium.
