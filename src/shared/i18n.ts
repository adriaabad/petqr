import { languages } from './core';
import type { Language } from './model';
const phrases: Record<string, [string, string]> = {
  'I want my PetQR': ['Quiero mi PetQR', 'Vull el meu PetQR'],
  'Everything uploaded to GitHub Pages is public. Keep confidential records private. Publish an address only if you want it visible to anyone scanning the QR.':
    [
      'Todo lo que subes a GitHub Pages es público. Mantén privados los documentos confidenciales. Publica una dirección solo si quieres mostrarla a quien escanee el QR.',
      'Tot el que puges a GitHub Pages és públic. Mantén privats els documents confidencials. Publica una adreça només si la vols mostrar a qui escanegi el QR.',
    ],
  'Address & outdoor access': ['Dirección y salidas', 'Adreça i sortides'],
  'Home address': ['Dirección de casa', 'Adreça de casa'],
  'Outdoor access': ['Salidas autorizadas', 'Sortides autoritzades'],
  'Usual area and outdoor instructions': [
    'Zona habitual e indicaciones de salida',
    'Zona habitual i indicacions de sortida',
  ],
  'Not specified': ['No indicado', 'No indicat'],
  'Stays at home': ['Debe estar en casa', 'Ha d’estar a casa'],
  'May go out independently': [
    'Puede salir y volver por su cuenta',
    'Pot sortir i tornar pel seu compte',
  ],
  'Only goes out accompanied': ['Solo puede salir acompañado', 'Només pot sortir acompanyat'],
  'Publish only the address or area you want anyone scanning the QR to see. Outdoor access describes permitted outings, not a lost/found status.':
    [
      'Publica solo la dirección o zona que quieras mostrar a quien escanee el QR. Las salidas indican qué tiene permitido hacer el animal; no son un estado de perdido/encontrado.',
      'Publica només l’adreça o zona que vulguis mostrar a qui escanegi el QR. Les sortides indiquen què té permès fer l’animal; no són un estat de perdut/trobat.',
    ],
  'Photo author': ['Autor de la foto', 'Autor de la foto'],
  'Photo source URL': ['URL de origen de la foto', 'URL d’origen de la foto'],
  'Photo license or permission': ['Licencia o permiso de la foto', 'Llicència o permís de la foto'],
  'License URL (optional)': ['URL de la licencia (opcional)', 'URL de la llicència (opcional)'],
  'Photo modifications (optional)': [
    'Modificaciones de la foto (opcional)',
    'Modificacions de la foto (opcional)',
  ],
  'Photo authorship and license (optional)': [
    'Autoría y licencia de la foto (opcional)',
    'Autoria i llicència de la foto (opcional)',
  ],
  'A new photo does not inherit the previous author. Add the actual author and permission for this photo. Uploading does not transfer copyright.':
    [
      'Una foto nueva no hereda la autoría anterior. Indica el autor y el permiso de esta foto. Subirla no transfiere los derechos de autor.',
      'Una foto nova no hereta l’autoria anterior. Indica l’autor i el permís d’aquesta foto. Pujar-la no transfereix els drets d’autor.',
    ],
  Allergies: ['Alergias', 'Al·lèrgies'],
  'Health conditions': ['Condiciones de salud', 'Condicions de salut'],
  'Behavior and handling notes': [
    'Comportamiento e indicaciones de manejo',
    'Comportament i indicacions de maneig',
  ],
  'Reset draft': ['Restablecer borrador', 'Restablir esborrany'],
  'Photo credits': ['Créditos de las fotos', 'Crèdits de les fotos'],
  'Microchip number': ['Número de microchip', 'Número de microxip'],
  'Registration number': ['Número de registro', 'Número de registre'],
  'Publish microchip number': ['Publicar número de microchip', 'Publicar número de microxip'],
  'Publish registration number': ['Publicar número de registro', 'Publicar número de registre'],
  'Optional. Published identification numbers can be read by anyone.': [
    'Opcional. Cualquier persona puede leer los números de identificación publicados.',
    'Opcional. Qualsevol persona pot llegir els números d’identificació publicats.',
  ],
  'Enter a Telegram username, @username or https://t.me/username. Leave blank if you do not use Telegram.':
    [
      'Introduce un usuario de Telegram, @usuario o https://t.me/usuario. Déjalo vacío si no usas Telegram.',
      'Introdueix un usuari de Telegram, @usuari o https://t.me/usuari. Deixa-ho buit si no utilitzes Telegram.',
    ],
  'Optional. Enter username, @username or https://t.me/username. Leave blank if you do not use Telegram.':
    [
      'Opcional. Acepta usuario, @usuario o https://t.me/usuario. Déjalo vacío si no usas Telegram.',
      'Opcional. Accepta usuari, @usuari o https://t.me/usuari. Deixa-ho buit si no utilitzes Telegram.',
    ],
  'More contact methods (optional)': [
    'Más métodos de contacto (opcional)',
    'Més mètodes de contacte (opcional)',
  ],
  'Some contact methods are incomplete and are omitted from this preview. Correct them in Contacts before exporting.':
    [
      'Hay métodos de contacto incompletos que no se muestran en esta vista previa. Corrígelos en Contactos antes de exportar.',
      'Hi ha mètodes de contacte incomplets que no es mostren en aquesta vista prèvia. Corregeix-los a Contactes abans d’exportar.',
    ],
  'Photos are converted and compressed on this device to WebP or JPEG, up to 1200 px and 300 KB. Animated images use the first frame.':
    [
      'Las fotos se convierten y comprimen aquí a WebP o JPEG, con un máximo de 1200 px y 300 KB. Las imágenes animadas usan el primer fotograma.',
      'Les fotos es converteixen i comprimeixen aquí a WebP o JPEG, amb un màxim de 1200 px i 300 KB. Les imatges animades utilitzen el primer fotograma.',
    ],
  'Choose a photo, such as JPEG, PNG, WebP, AVIF, GIF or BMP. SVG and documents are not supported.':
    [
      'Selecciona una foto, como JPEG, PNG, WebP, AVIF, GIF o BMP. No se admiten SVG ni documentos.',
      'Selecciona una foto, com JPEG, PNG, WebP, AVIF, GIF o BMP. No s’admeten SVG ni documents.',
    ],
  'This browser could not open the photo. Try another browser, or convert it to JPEG or PNG. Very large images may exceed your device memory.':
    [
      'Este navegador no ha podido abrir la foto. Prueba otro navegador o conviértela a JPEG o PNG. Las imágenes muy grandes pueden superar la memoria del dispositivo.',
      'Aquest navegador no ha pogut obrir la foto. Prova un altre navegador o converteix-la a JPEG o PNG. Les imatges molt grans poden superar la memòria del dispositiu.',
    ],
  'Photo optimized': ['Foto optimizada', 'Foto optimitzada'],
  'Image compression failed.': [
    'No se ha podido comprimir la foto. Prueba con otra imagen.',
    'No s’ha pogut comprimir la foto. Prova amb una altra imatge.',
  ],
  'Language unavailable offline': [
    'Idioma no disponible sin conexión.',
    'Idioma no disponible sense connexió.',
  ],
  'Use 3–64 lowercase letters, digits or hyphens.': [
    'Usa entre 3 y 64 letras minúsculas, números o guiones.',
    'Utilitza entre 3 i 64 lletres minúscules, números o guionets.',
  ],
  'Use a local assets/pets/ filename (WebP, PNG or JPEG).': [
    'Usa un archivo local en assets/pets/ (WebP, PNG o JPEG).',
    'Utilitza un fitxer local a assets/pets/ (WebP, PNG o JPEG).',
  ],
  'Use a telephone number, with optional +, spaces, parentheses and hyphens.': [
    'Usa un teléfono con números y, opcionalmente, +, espacios, paréntesis o guiones.',
    'Utilitza un telèfon amb números i, opcionalment, +, espais, parèntesis o guionets.',
  ],
  'Enter an HTTP(S) URL.': ['Introduce una URL HTTP(S).', 'Introdueix un URL HTTP(S).'],
  'Enter an HTTP(S) site URL without a query or fragment.': [
    'Introduce una URL HTTP(S) sin consulta ni fragmento.',
    'Introdueix un URL HTTP(S) sense consulta ni fragment.',
  ],
  'Links must use HTTP(S), without embedded credentials.': [
    'Los enlaces deben usar HTTP(S), sin credenciales.',
    'Els enllaços han d’utilitzar HTTP(S), sense credencials.',
  ],
  'Contact already assigned.': ['El contacto ya está asignado.', 'El contacte ja està assignat.'],
  'ZIP is larger than 60 MB.': ['El ZIP supera los 60 MB.', 'El ZIP supera els 60 MB.'],
  'File is larger than 60 MB.': ['El archivo supera los 60 MB.', 'El fitxer supera els 60 MB.'],
  'Archive exceeds safe extraction limits.': [
    'El archivo supera los límites de extracción segura.',
    'El fitxer supera els límits d’extracció segura.',
  ],
  'No local draft is available.': [
    'No hay ningún borrador local.',
    'No hi ha cap esborrany local.',
  ],
  'Local draft deleted.': ['Borrador local eliminado.', 'Esborrany local esborrat.'],
  'Maximum 30 photos per pet.': ['Máximo 30 fotos por animal.', 'Màxim 30 fotos per animal.'],
  'Tag dimensions must be 41–120 mm so the QR is at least 25 mm.': [
    'La placa debe medir entre 41 y 120 mm para que el QR tenga al menos 25 mm.',
    'La placa ha de mesurar entre 41 i 120 mm perquè el QR tingui almenys 25 mm.',
  ],
  Settings: ['Configuración', 'Configuració'],
  'View photo': ['Ver foto', 'Veure foto'],
  'My pets': ['Mis animales', 'Els meus animals'],
  Contacts: ['Contactos', 'Contactes'],
  'Site settings': ['Ajustes del sitio', 'Configuració del lloc'],
  Help: ['Ayuda', 'Ajuda'],
  'A little tag. A way home.': [
    'Una pequeña placa. Un camino a casa.',
    'Una petita placa. Un camí a casa.',
  ],
  'Your pets, their people, always connected.': [
    'Tus animales y su gente, siempre conectados.',
    'Els teus animals i la seva gent, sempre connectats.',
  ],
  'Add pet': ['Añadir animal', 'Afegir animal'],
  'View profile': ['Ver perfil', 'Veure perfil'],
  'QR code': ['Código QR', 'Codi QR'],
  Edit: ['Editar', 'Editar'],
  Safe: ['A salvo', 'Fora de perill'],
  Missing: ['Perdido', 'Perdut'],
  Found: ['Encontrado', 'Trobat'],
  Custom: ['Personalizado', 'Personalitzat'],
  Duplicate: ['Duplicar', 'Duplicar'],
  Delete: ['Eliminar', 'Eliminar'],
  'Move up': ['Subir', 'Pujar'],
  'Move down': ['Bajar', 'Baixar'],
  'Changes stay on this device. Export when you’re ready.': [
    'Los cambios se quedan en este dispositivo. Exporta cuando quieras.',
    'Els canvis es queden en aquest dispositiu. Exporta quan vulguis.',
  ],
  'Export files': ['Exportar archivos', 'Exportar fitxers'],
  'Import files': ['Importar archivos', 'Importar fitxers'],
  'Local editor': ['Editor local', 'Editor local'],
  'Local only. Nothing is uploaded automatically.': [
    'Solo local. Nada se sube automáticamente.',
    'Només local. No es puja res automàticament.',
  ],
  Call: ['Llamar', 'Trucar'],
  WhatsApp: ['WhatsApp', 'WhatsApp'],
  Email: ['Correo', 'Correu'],
  Telegram: ['Telegram', 'Telegram'],
  'Copy contact': ['Copiar contacto', 'Copiar contacte'],
  'Contact my people': ['Contacta con mi gente', 'Contacta amb la meva gent'],
  'Please contact my people so I can get home safely.': [
    'Contacta con mi gente para que pueda volver a casa.',
    'Contacta amb la meva gent perquè pugui tornar a casa.',
  ],
  'Important information': ['Información importante', 'Informació important'],
  'Full details': ['Todos los detalles', 'Tots els detalls'],
  'Emergency view': ['Vista de emergencia', 'Vista d’emergència'],
  'More photos': ['Más fotos', 'Més fotos'],
  'This pet is missing. Please contact their people.': [
    'Este animal está perdido. Contacta con su gente.',
    'Aquest animal està perdut. Contacta amb la seva gent.',
  ],
  'No public contact is available.': [
    'No hay ningún contacto público disponible.',
    'No hi ha cap contacte públic disponible.',
  ],
  'Public information. Share only what you are comfortable publishing.': [
    'Información pública. Comparte solo lo que quieras publicar.',
    'Informació pública. Comparteix només el que vulguis publicar.',
  ],
  'Open-source project': ['Proyecto de código abierto', 'Projecte de codi obert'],
  'All pets': ['Todos los animales', 'Tots els animals'],
  Theme: ['Tema', 'Tema'],
  System: ['Sistema', 'Sistema'],
  Light: ['Claro', 'Clar'],
  Dark: ['Oscuro', 'Fosc'],
  Language: ['Idioma', 'Idioma'],
  Back: ['Volver', 'Tornar'],
  Basic: ['Básico', 'Bàsic'],
  Advanced: ['Avanzado', 'Avançat'],
  'Preview profile': ['Vista previa', 'Vista prèvia'],
  'Edit pet': ['Editar animal', 'Editar animal'],
  Identity: ['Identidad', 'Identitat'],
  Name: ['Nombre', 'Nom'],
  Species: ['Especie', 'Espècie'],
  Breed: ['Raza', 'Raça'],
  Introduction: ['Presentación', 'Presentació'],
  'Stable ID': ['ID estable', 'ID estable'],
  'Keep this ID unchanged once a tag is printed.': [
    'No cambies este ID después de imprimir una placa.',
    'No canviïs aquest ID després d’imprimir una placa.',
  ],
  Status: ['Estado', 'Estat'],
  'Custom status': ['Estado personalizado', 'Estat personalitzat'],
  'Emergency message': ['Mensaje de emergencia', 'Missatge d’emergència'],
  Photos: ['Fotografías', 'Fotografies'],
  'Add photo': ['Añadir foto', 'Afegir foto'],
  'Alternative text': ['Texto alternativo', 'Text alternatiu'],
  Featured: ['Principal', 'Principal'],
  'Make featured': ['Hacer principal', 'Fer principal'],
  Remove: ['Quitar', 'Treure'],
  'Choose photo': ['Elegir foto', 'Triar foto'],
  Rotate: ['Girar', 'Girar'],
  'Zoom / crop': ['Zoom / recorte', 'Zoom / retall'],
  'Horizontal position': ['Posición horizontal', 'Posició horitzontal'],
  'Vertical position': ['Posición vertical', 'Posició vertical'],
  'Use photo': ['Usar foto', 'Utilitzar foto'],
  Cancel: ['Cancelar', 'Cancel·lar'],
  'Photos are processed on this device. Maximum 15 MB per file; exported at up to 1200 px.': [
    'Las fotos se procesan aquí. Máximo 15 MB por archivo; exportación de hasta 1200 px.',
    'Les fotos es processen aquí. Màxim 15 MB per fitxer; exportació de fins a 1200 px.',
  ],
  Appearance: ['Apariencia', 'Aparença'],
  'Accent color': ['Color de acento', 'Color d’accent'],
  Background: ['Fondo', 'Fons'],
  Sage: ['Salvia', 'Sàlvia'],
  Sand: ['Arena', 'Sorra'],
  Sky: ['Cielo', 'Cel'],
  'Decorative icon': ['Icono decorativo', 'Icona decorativa'],
  Paw: ['Huella', 'Petjada'],
  Heart: ['Corazón', 'Cor'],
  None: ['Ninguno', 'Cap'],
  'Allow search indexing': [
    'Permitir indexación en buscadores',
    'Permetre indexació als cercadors',
  ],
  'Publishing & privacy': ['Publicación y privacidad', 'Publicació i privacitat'],
  'Everything uploaded to GitHub Pages is public. Unlisted URLs and noindex do not provide privacy. Never upload confidential records or precise home addresses.':
    [
      'Todo lo subido a GitHub Pages es público. Las URL no listadas y noindex no dan privacidad. No subas documentos confidenciales ni direcciones exactas.',
      'Tot el que es puja a GitHub Pages és públic. Els URL no llistats i noindex no donen privacitat. No pugis documents confidencials ni adreces exactes.',
    ],
  'Public site URL': ['URL pública del sitio', 'URL públic del lloc'],
  'Use the exact deployed site URL, including the repository path.': [
    'Usa la URL publicada exacta, incluida la ruta del repositorio.',
    'Utilitza l’URL publicat exacte, inclosa la ruta del repositori.',
  ],
  'Default language': ['Idioma predeterminado', 'Idioma predeterminat'],
  'Show public pet index': ['Mostrar índice público de animales', 'Mostrar índex públic d’animals'],
  'Show attribution': ['Mostrar atribución', 'Mostrar atribució'],
  'Project source URL (optional)': [
    'URL del código fuente (opcional)',
    'URL del codi font (opcional)',
  ],
  'Site title': ['Título del sitio', 'Títol del lloc'],
  'Add contact': ['Añadir contacto', 'Afegir contacte'],
  'Contact name': ['Nombre del contacto', 'Nom del contacte'],
  Relationship: ['Relación', 'Relació'],
  Telephone: ['Teléfono', 'Telèfon'],
  'Preferred method': ['Método preferido', 'Mètode preferit'],
  'Preferred language': ['Idioma preferido', 'Idioma preferit'],
  Availability: ['Disponibilidad', 'Disponibilitat'],
  'Publish contact': ['Publicar contacto', 'Publicar contacte'],
  'I understand these contact details will be public.': [
    'Entiendo que estos datos de contacto serán públicos.',
    'Entenc que aquestes dades de contacte seran públiques.',
  ],
  'Shared contacts are reused across pets. Order assigned contacts by emergency priority.': [
    'Los contactos se comparten entre animales. Ordénalos por prioridad de emergencia.',
    'Els contactes es comparteixen entre animals. Ordena’ls per prioritat d’emergència.',
  ],
  'Assign contact': ['Asignar contacto', 'Assignar contacte'],
  'No contacts yet. Add one in Contacts.': [
    'Todavía no hay contactos. Añade uno en Contactos.',
    'Encara no hi ha contactes. Afegeix-ne un a Contactes.',
  ],
  'Override for this pet': ['Personalizar para este animal', 'Personalitzar per a aquest animal'],
  'Use shared details': ['Usar datos compartidos', 'Utilitzar dades compartides'],
  Publish: ['Publicar', 'Publicar'],
  'Sensitive information': ['Información sensible', 'Informació sensible'],
  'Sensitive details can identify an animal or expose health information. Publish only with informed consent.':
    [
      'Los datos sensibles pueden identificar al animal o revelar su salud. Publica solo con consentimiento informado.',
      'Les dades sensibles poden identificar l’animal o revelar-ne la salut. Publica només amb consentiment informat.',
    ],
  'Publish this sensitive information publicly? It may be copied and remain in Git history after removal.':
    [
      '¿Publicar esta información sensible? Puede copiarse y permanecer en el historial de Git tras borrarla.',
      'Vols publicar aquesta informació sensible? Es pot copiar i romandre a l’historial de Git després d’esborrar-la.',
    ],
  'Add field': ['Añadir campo', 'Afegir camp'],
  'Custom section': ['Sección personalizada', 'Secció personalitzada'],
  'Section title': ['Título de sección', 'Títol de secció'],
  'Field label': ['Etiqueta del campo', 'Etiqueta del camp'],
  Value: ['Valor', 'Valor'],
  Text: ['Texto', 'Text'],
  Warning: ['Aviso', 'Avís'],
  Link: ['Enlace', 'Enllaç'],
  Type: ['Tipo', 'Tipus'],
  'Add section': ['Añadir sección', 'Afegir secció'],
  'Translated text': ['Texto traducido', 'Text traduït'],
  'Edit translation': ['Editar traducción', 'Editar traducció'],
  'Delete this pet? Existing physical QR tags will stop working after you deploy.': [
    '¿Eliminar este animal? Sus placas QR dejarán de funcionar tras publicar.',
    'Vols eliminar aquest animal? Les seves plaques QR deixaran de funcionar després de publicar.',
  ],
  'Delete this contact and remove its pet assignments?': [
    '¿Eliminar este contacto y sus asignaciones?',
    'Vols eliminar aquest contacte i les seves assignacions?',
  ],
  'Save draft on this device': [
    'Guardar borrador en este dispositivo',
    'Desar esborrany en aquest dispositiu',
  ],
  'Restore local draft': ['Restaurar borrador local', 'Restaurar esborrany local'],
  'Forget local draft': ['Borrar borrador local', 'Esborrar esborrany local'],
  'Draft saved locally. Anyone using this browser may access it.': [
    'Borrador guardado localmente. Quien use este navegador podría acceder a él.',
    'Esborrany desat localment. Qui utilitzi aquest navegador podria accedir-hi.',
  ],
  'Replace the current draft with the deployed configuration?': [
    '¿Sustituir el borrador actual por la configuración publicada?',
    'Vols substituir l’esborrany actual per la configuració publicada?',
  ],
  'Copied.': ['Copiado.', 'Copiat.'],
  'Files exported.': ['Archivos exportados.', 'Fitxers exportats.'],
  'Configuration imported.': ['Configuración importada.', 'Configuració importada.'],
  'No pets yet. Add your first companion.': [
    'No hay animales todavía. Añade tu primer compañero.',
    'Encara no hi ha animals. Afegeix el teu primer company.',
  ],
  'Validation errors': ['Errores de validación', 'Errors de validació'],
  'Download SVG': ['Descargar SVG', 'Descarregar SVG'],
  'Download 3D SVG': ['Descargar SVG 3D', 'Descarregar SVG 3D'],
  '3D printing SVG': ['SVG para impresión 3D', 'SVG per a impressió 3D'],
  '3D QR size (mm)': ['Tamaño del QR 3D (mm)', 'Mida del QR 3D (mm)'],
  'Filled QR modules only, with a transparent background and real millimeter size. Import as an SVG modifier or embossing shape, set a 0.8 mm raised height in your slicer, and keep the quiet zone clear.':
    [
      'Solo módulos QR rellenos, con fondo transparente y tamaño real en milímetros. Impórtalo como modificador SVG o relieve, establece una altura de 0,8 mm en el laminador y deja libre el margen alrededor.',
      'Només mòduls QR plens, amb fons transparent i mida real en mil·límetres. Importa’l com a modificador SVG o relleu, estableix una altura de 0,8 mm al laminador i deixa lliure el marge del voltant.',
    ],
  '3D QR size must be 25–120 mm.': [
    'El tamaño del QR 3D debe estar entre 25 y 120 mm.',
    'La mida del QR 3D ha de ser entre 25 i 120 mm.',
  ],
  'Quiet zone must be 4–12 modules.': [
    'El margen debe estar entre 4 y 12 módulos.',
    'El marge ha de ser entre 4 i 12 mòduls.',
  ],
  'Download PNG': ['Descargar PNG', 'Descarregar PNG'],
  'Copy URL': ['Copiar URL', 'Copiar URL'],
  'Test destination': ['Probar destino', 'Provar destinació'],
  Resolution: ['Resolución', 'Resolució'],
  Foreground: ['Primer plano', 'Primer pla'],
  'Background color': ['Color de fondo', 'Color de fons'],
  'Error correction': ['Corrección de errores', 'Correcció d’errors'],
  'Quiet zone (modules)': ['Margen (módulos)', 'Marge (mòduls)'],
  'Include pet name': ['Incluir nombre', 'Incloure nom'],
  'QR codes require a final public URL. Configure it in Settings before printing.': [
    'Los QR necesitan una URL pública definitiva. Configúrala en Ajustes antes de imprimir.',
    'Els QR necessiten un URL públic definitiu. Configura’l a Configuració abans d’imprimir.',
  ],
  'Keep at least four clear modules around the code. Print at least 25 mm, larger for long URLs. Test with multiple phones before engraving.':
    [
      'Deja al menos cuatro módulos libres alrededor. Imprime a 25 mm como mínimo, más para URL largas. Prueba con varios teléfonos antes de grabar.',
      'Deixa almenys quatre mòduls lliures al voltant. Imprimeix a 25 mm com a mínim, més per a URL llargs. Prova amb diversos telèfons abans de gravar.',
    ],
  'Use dark code on a light background with at least 7:1 contrast.': [
    'Usa un código oscuro sobre fondo claro con contraste de al menos 7:1.',
    'Utilitza un codi fosc sobre fons clar amb contrast d’almenys 7:1.',
  ],
  'Printable tag': ['Placa imprimible', 'Placa imprimible'],
  Shape: ['Forma', 'Forma'],
  'Rounded rectangle': ['Rectángulo redondeado', 'Rectangle arrodonit'],
  Rectangle: ['Rectángulo', 'Rectangle'],
  Square: ['Cuadrado', 'Quadrat'],
  Circle: ['Círculo', 'Cercle'],
  'Width (mm)': ['Ancho (mm)', 'Amplada (mm)'],
  'Height (mm)': ['Alto (mm)', 'Alçada (mm)'],
  'Short text': ['Texto corto', 'Text curt'],
  'Phone on tag': ['Teléfono en la placa', 'Telèfon a la placa'],
  Print: ['Imprimir', 'Imprimir'],
  'Download tag SVG': ['Descargar placa SVG', 'Descarregar placa SVG'],
  'Download tag PNG': ['Descargar placa PNG', 'Descarregar placa PNG'],
  Close: ['Cerrar', 'Tancar'],
  'Share my location': ['Compartir mi ubicación', 'Compartir la meva ubicació'],
  'Your browser will ask for location permission. A map link will be prepared in WhatsApp. You choose whether to send it. PetQR does not store your location.':
    [
      'El navegador pedirá permiso de ubicación. Se preparará un enlace al mapa en WhatsApp. Tú decides si enviarlo. PetQR no guarda tu ubicación.',
      'El navegador demanarà permís d’ubicació. Es prepararà un enllaç al mapa a WhatsApp. Tu decideixes si l’envies. PetQR no desa la teva ubicació.',
    ],
  'Location unavailable. Contact the owner and describe where you are.': [
    'Ubicación no disponible. Contacta con su responsable e indica dónde estás.',
    'Ubicació no disponible. Contacta amb el responsable i indica on ets.',
  ],
  'Open WhatsApp with location': ['Abrir WhatsApp con ubicación', 'Obrir WhatsApp amb ubicació'],
  'I found your pet. Here is my location:': [
    'He encontrado a tu animal. Esta es mi ubicación:',
    'He trobat el teu animal. Aquesta és la meva ubicació:',
  ],
  'Export & publish': ['Exportar y publicar', 'Exportar i publicar'],
  'Download the ZIP, extract it, then replace the data/ folder and merge assets/pets/ into your repository. Commit the changes and wait for Pages to deploy.':
    [
      'Descarga el ZIP, extráelo, sustituye data/ y combina assets/pets/ en tu repositorio. Confirma los cambios y espera el despliegue.',
      'Descarrega el ZIP, extreu-lo, substitueix data/ i combina assets/pets/ al repositori. Confirma els canvis i espera el desplegament.',
    ],
  'Only selected public fields are exported. Unpublished fields remain in this browser session.': [
    'Solo se exportan campos públicos seleccionados. Los demás se quedan en esta sesión.',
    'Només s’exporten camps públics seleccionats. Els altres es queden en aquesta sessió.',
  ],
  'Import a PetQR ZIP or complete configuration JSON. This replaces your current draft.': [
    'Importa un ZIP de PetQR o un JSON de configuración completa. Sustituye el borrador actual.',
    'Importa un ZIP de PetQR o un JSON de configuració completa. Substitueix l’esborrany actual.',
  ],
  'Choose an image under 15 MB (JPEG, PNG or WebP).': [
    'Elige una imagen de menos de 15 MB (JPEG, PNG o WebP).',
    'Tria una imatge de menys de 15 MB (JPEG, PNG o WebP).',
  ],
  'Image could not be decoded.': [
    'No se ha podido leer la imagen.',
    'No s’ha pogut llegir la imatge.',
  ],
  'Unable to copy. Select and copy the URL manually.': [
    'No se puede copiar. Selecciona y copia la URL manualmente.',
    'No es pot copiar. Selecciona i copia l’URL manualment.',
  ],
  'Confirm publication': ['Confirmar publicación', 'Confirmar publicació'],
  'No JavaScript is needed to read this profile or contact the owner.': [
    'No se necesita JavaScript para leer este perfil o contactar.',
    'No cal JavaScript per llegir aquest perfil o contactar.',
  ],
  'Profiles are public, including when the index is disabled.': [
    'Los perfiles son públicos aunque desactives el índice.',
    'Els perfils són públics encara que desactivis l’índex.',
  ],
  'Optional fields': ['Campos opcionales', 'Camps opcionals'],
  'Emergency instructions stay visible in compact view.': [
    'Las instrucciones urgentes se ven en la vista compacta.',
    'Les instruccions urgents es veuen a la vista compacta.',
  ],
  'Unsaved session changes will be lost. Continue?': [
    'Se perderán los cambios de esta sesión. ¿Continuar?',
    'Es perdran els canvis d’aquesta sessió. Vols continuar?',
  ],
};
export function t(key: string, lang: Language): string {
  return lang === 'en' ? key : phrases[key]?.[lang === 'es' ? 0 : 1] || key;
}
export function preferredLanguage(fallback: Language): Language {
  try {
    const saved = localStorage.getItem('petqr-language');
    if (languages.includes(saved as Language)) return saved as Language;
  } catch {
    /* Storage may be disabled. */
  }
  for (const value of navigator.languages || [navigator.language]) {
    const code = value.split('-')[0];
    if (languages.includes(code as Language)) return code as Language;
  }
  return fallback;
}
export const statusKey = {
  safe: 'Safe',
  missing: 'Missing',
  found: 'Found',
  custom: 'Custom',
} as const;
