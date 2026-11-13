import { t } from './i18n';
import type { Language } from './model';
const phrases: Record<string, [string, string]> = {
  'A publication is already in progress.': [
    'Ya hay una publicación en curso.',
    'Ja hi ha una publicació en curs.',
  ],
  'Only confirmed public data and referenced photos can be published.': [
    'Solo se pueden publicar datos públicos confirmados y las fotos referenciadas.',
    'Només es poden publicar dades públiques confirmades i les fotos referenciades.',
  ],
  'Save and publish': ['Guardar y publicar', 'Desar i publicar'],
  'Saving…': ['Guardando…', 'Desant…'],
  'Connect GitHub': ['Conectar GitHub', 'Connectar GitHub'],
  'Disconnect GitHub': ['Desconectar GitHub', 'Desconnectar GitHub'],
  'Connected as': ['Conectado como', 'Connectat com a'],
  Connect: ['Conectar', 'Connectar'],
  Repository: ['Repositorio', 'Repositori'],
  'Temporary access key': ['Clave de acceso temporal', 'Clau d’accés temporal'],
  'Create a limited access key in GitHub': [
    'Crear una clave limitada en GitHub',
    'Crear una clau limitada a GitHub',
  ],
  'Manage or revoke keys': ['Gestionar o revocar claves', 'Gestionar o revocar claus'],
  'Publish changes': ['Publicar cambios', 'Publicar canvis'],
  'View publication': ['Ver publicación', 'Veure publicació'],
  'GitHub Pages has no login server. Use a temporary fine-grained access key restricted to your repository. The key stays only in this tab for 30 minutes and is never saved in files or browser storage.':
    [
      'GitHub Pages no tiene servidor de inicio de sesión. Usa una clave temporal de acceso detallado limitada a tu repositorio. La clave se mantiene solo en esta pestaña durante 30 minutos; nunca se guarda en archivos ni en el almacenamiento del navegador.',
      'GitHub Pages no té servidor d’inici de sessió. Utilitza una clau temporal d’accés detallat limitada al teu repositori. La clau es manté només en aquesta pestanya durant 30 minuts; mai no es desa en fitxers ni a l’emmagatzematge del navegador.',
    ],
  'In GitHub choose Only select repositories, select the repository shown here, and allow only Contents: Read and write. Use a short expiration. Do not enable access to all repositories.':
    [
      'En GitHub elige Only select repositories, selecciona el repositorio indicado aquí y permite solo Contents: Read and write. Usa una caducidad corta. No habilites acceso a todos los repositorios.',
      'A GitHub tria Only select repositories, selecciona el repositori indicat aquí i permet només Contents: Read and write. Utilitza una caducitat curta. No habilitis accés a tots els repositoris.',
    ],
  'I selected only this repository and Contents: Read and write.': [
    'He seleccionado solo este repositorio y Contents: Read and write.',
    'He seleccionat només aquest repositori i Contents: Read and write.',
  ],
  'Only selected public information and referenced photos will be sent to GitHub. Unpublished fields stay in this browser. Published data and repository history are public.':
    [
      'Solo se enviarán a GitHub la información pública seleccionada y las fotos referenciadas. Los campos no publicados se quedan en este navegador. Los datos publicados y el historial del repositorio son públicos.',
      'Només s’enviaran a GitHub la informació pública seleccionada i les fotos referenciades. Els camps no publicats es queden en aquest navegador. Les dades publicades i l’historial del repositori són públics.',
    ],
  'Data and photos are saved together in one commit. The website updates after GitHub Actions finishes. Newer remote changes will never be overwritten automatically.':
    [
      'Los datos y las fotos se guardan juntos en una sola actualización. La web se actualiza cuando termina GitHub Actions. Los cambios remotos más recientes nunca se sobrescriben automáticamente.',
      'Les dades i les fotos es desen juntes en una sola actualització. La web s’actualitza quan acaba GitHub Actions. Els canvis remots més recents mai no se sobreescriuen automàticament.',
    ],
  'Saving public data and photos to GitHub…': [
    'Guardando datos públicos y fotos en GitHub…',
    'Desant dades públiques i fotos a GitHub…',
  ],
  'Saved in GitHub. The website is updating.': [
    'Guardado en GitHub. La web se está actualizando.',
    'Desat a GitHub. La web s’està actualitzant.',
  ],
  'Published. The website now includes your changes.': [
    'Publicado. La web ya incluye tus cambios.',
    'Publicat. La web ja inclou els teus canvis.',
  ],
  'Saved in GitHub. Deployment is still pending or needs attention. Check the publication.': [
    'Guardado en GitHub. El despliegue sigue pendiente o necesita atención. Revisa la publicación.',
    'Desat a GitHub. El desplegament continua pendent o necessita atenció. Revisa la publicació.',
  ],
  'No public changes to publish.': [
    'No hay cambios públicos que publicar.',
    'No hi ha canvis públics per publicar.',
  ],
  'Access key kept only in this tab.': [
    'Clave mantenida solo en esta pestaña.',
    'Clau mantinguda només en aquesta pestanya.',
  ],
  'Disconnected. The access key was forgotten by this tab.': [
    'Desconectado. Esta pestaña ha olvidado la clave.',
    'Desconnectat. Aquesta pestanya ha oblidat la clau.',
  ],
  'The editor connection expired. Connect again.': [
    'La conexión del editor ha caducado. Conecta de nuevo.',
    'La connexió de l’editor ha caducat. Connecta de nou.',
  ],
  'Use HTTPS or localhost before connecting GitHub.': [
    'Utiliza HTTPS o localhost antes de conectar GitHub.',
    'Utilitza HTTPS o localhost abans de connectar GitHub.',
  ],
  'Reload the editor to get safe publishing information.': [
    'Recarga el editor para obtener la información de publicación segura.',
    'Recarrega l’editor per obtenir la informació de publicació segura.',
  ],
  'Enter a repository as owner/name.': [
    'Introduce un repositorio con el formato propietario/nombre.',
    'Introdueix un repositori amb el format propietari/nom.',
  ],
  'Use the repository that published this editor.': [
    'Utiliza el repositorio desde el que se publicó este editor.',
    'Utilitza el repositori des del qual es va publicar aquest editor.',
  ],
  'Use a fine-grained access key starting with github_pat_. Broad classic keys are not accepted.': [
    'Usa una clave de acceso detallado que empiece por github_pat_. No se aceptan claves clásicas de acceso amplio.',
    'Utilitza una clau d’accés detallat que comenci per github_pat_. No s’accepten claus clàssiques d’accés ampli.',
  ],
  'The access key is invalid or expired. Connect again.': [
    'La clave de acceso no es válida o ha caducado. Conecta de nuevo.',
    'La clau d’accés no és vàlida o ha caducat. Connecta de nou.',
  ],
  'Connect GitHub before publishing.': [
    'Conecta GitHub antes de publicar.',
    'Connecta GitHub abans de publicar.',
  ],
  'This account does not have write access to the repository.': [
    'Esta cuenta no tiene permiso de escritura en el repositorio.',
    'Aquest compte no té permís d’escriptura al repositori.',
  ],
  'GitHub denied access. Select this repository and Contents: Read and write when creating the key. Repository rules may also require review.':
    [
      'GitHub ha denegado el acceso. Al crear la clave, selecciona este repositorio y Contents: Read and write. Las reglas del repositorio también pueden exigir revisión.',
      'GitHub ha denegat l’accés. En crear la clau, selecciona aquest repositori i Contents: Read and write. Les regles del repositori també poden exigir revisió.',
    ],
  'Repository or branch not available to this access key. Check the selected repository.': [
    'La clave no tiene acceso al repositorio o a la rama. Revisa el repositorio seleccionado.',
    'La clau no té accés al repositori o a la branca. Revisa el repositori seleccionat.',
  ],
  'Newer changes exist in GitHub. Save a local draft or export it, then reload the editor before publishing. Nothing was overwritten.':
    [
      'Hay cambios más recientes en GitHub. Guarda un borrador local o expórtalo y recarga el editor antes de publicar. No se ha sobrescrito nada.',
      'Hi ha canvis més recents a GitHub. Desa un esborrany local o exporta’l i recarrega l’editor abans de publicar. No s’ha sobreescrit res.',
    ],
  'Could not reach GitHub. Your draft is still here. Try again.': [
    'No se ha podido conectar con GitHub. Tu borrador sigue aquí. Inténtalo de nuevo.',
    'No s’ha pogut connectar amb GitHub. El teu esborrany continua aquí. Torna-ho a provar.',
  ],
  'GitHub could not save the changes. Your draft is still here.': [
    'GitHub no ha podido guardar los cambios. Tu borrador sigue aquí.',
    'GitHub no ha pogut desar els canvis. El teu esborrany continua aquí.',
  ],
  'GitHub rate limit reached. Wait and try again.': [
    'Se ha alcanzado el límite de peticiones de GitHub. Espera e inténtalo de nuevo.',
    'S’ha arribat al límit de peticions de GitHub. Espera i torna-ho a provar.',
  ],
  'The default branch changed. Reload the editor before publishing.': [
    'La rama predeterminada ha cambiado. Recarga el editor antes de publicar.',
    'La branca predeterminada ha canviat. Recarrega l’editor abans de publicar.',
  ],
  'GitHub returned an unexpected response. Try again.': [
    'GitHub ha devuelto una respuesta inesperada. Inténtalo de nuevo.',
    'GitHub ha retornat una resposta inesperada. Torna-ho a provar.',
  ],
  'Only PetQR public data and pet photos can be published.': [
    'Solo se pueden publicar datos públicos de PetQR y fotos de animales.',
    'Només es poden publicar dades públiques de PetQR i fotos d’animals.',
  ],
  'A photo exceeds the published size limit. Re-add it in Photos to compress it.': [
    'Una foto supera el tamaño permitido para publicar. Vuelve a añadirla en Fotografías para comprimirla.',
    'Una foto supera la mida permesa per publicar. Torna-la a afegir a Fotografies per comprimir-la.',
  ],
  'An access key was found in public data. Remove it before publishing.': [
    'Hay una clave de acceso en los datos públicos. Elimínala antes de publicar.',
    'Hi ha una clau d’accés a les dades públiques. Elimina-la abans de publicar.',
  ],
  'Repository is too large for safe browser publishing. Use Export files instead.': [
    'El repositorio es demasiado grande para publicar de forma segura desde el navegador. Utiliza Exportar archivos.',
    'El repositori és massa gran per publicar de manera segura des del navegador. Utilitza Exportar fitxers.',
  ],
};
export function pt(key: string, lang: Language): string {
  return lang === 'en' ? key : phrases[key]?.[lang === 'es' ? 0 : 1] || t(key, lang);
}
