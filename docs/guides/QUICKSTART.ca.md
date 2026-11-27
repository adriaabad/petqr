# PetQR — Inici ràpid

Una petita placa. Un camí a casa. Crea perfils públics i QR permanents per a diversos animals, sense servidor, base de dades ni compte central de PetQR.

1. A GitHub, fes servir **Use this template → Create a new repository** al teu compte. La plantilla ja està activada. [Crea la teva còpia directament](https://github.com/new?template_owner=adriaabad&template_name=petqr&name=petqr&visibility=public). Tria un repositori públic per tenir GitHub Pages gratuït.
2. Al **teu repositori nou** (el nom que has triat, no `adriaabad/petqr`), activa la publicació:
   1. Obre **Settings → Pages**. A **Build and deployment → Source**, desplega el menú i selecciona **GitHub Actions**. Si apareixen targetes per configurar **Jekyll** o **Static HTML**, ignora-les: PetQR ja porta el seu propi workflow.
   2. A la pestanya **Code**, comprova que ets a la branca `main` i que existeix `.github/workflows/pages.yml`.
   3. Obre **Actions**. A la barra lateral esquerra, selecciona **Validate, test & deploy PetQR**. Si GitHub et demana activar Actions, activa’ls i torna-hi. També pots anar directament a `https://github.com/USUARI/REPOSITORI/actions/workflows/pages.yml`, substituint `USUARI` i `REPOSITORI` pels teus.
   4. **A sobre de la llista d’execucions**, prem **Run workflow**, selecciona la branca `main` i prem **Run workflow** una segona vegada per confirmar. Espera que **build** i **deploy** acabin en verd.
   5. Si ja hi ha una execució vermella iniciada en crear el repositori, obre-la per veure l’error. Pot haver començat abans que activessis Pages; la nova execució del punt anterior és la que ha de publicar la web.
3. Torna a **Settings → Pages** i prem **Visit site**. Afegeix `/editor/` al final de l’URL publicada. Els exemples són ficticis: substitueix animals, fotos i contactes.
4. A Contactes, afegeix les teves dades i confirma que les vols publicar. Assigna’ls a cada animal. A Configuració, verifica l’URL públic.
5. Edita, previsualitza i fes servir **Exportar fitxers**. Extreu el ZIP: substitueix `data/` i combina `assets/pets/` al repositori. Confirma els canvis i espera que acabi Actions.
6. Obre cada perfil publicat, genera’n el QR i comprova l’enllaç i la impressió amb diversos telèfons.

**Tot el que es puja a GitHub Pages i al repositori públic és públic.** Els camps no publicats s’exclouen del ZIP; un esborrany local només es desa si ho demanes. No pugis documents, adreces exactes ni dades confidencials. Desactivar l’índex o utilitzar noindex no dona privacitat.

A Identitat pots afegir el número de microxip i el número de registre. Marca Publicar i confirma només si els vols mostrar públicament. Exporta el ZIP i puja’l a GitHub per actualitzar la web; el QR es manté. No canviïs l’URL, el nom del repositori ni l’ID després d’imprimir plaques.

L’editor funciona en català, castellà i anglès. La fitxa té un únic formulari, sense mode Avançat ni estat de perdut/trobat. Els detalls addicionals ja existents es conserven. Fotos: retall, gir i compressió locals. QR: SVG, PNG, colors, marges i plaques imprimibles. Les modificacions locals no es desen automàticament a GitHub.

La [guia completa](../../README.md), la [guia de privacitat](PRIVACY.md) i la [guia de desplegament](DEPLOYMENT.md) inclouen tots els detalls. Per al desenvolupament local: `npm ci`, `npm run dev`. Per comprovar: `npm run build`, `npm test`, `npm run test:e2e` després d’instal·lar Playwright Chromium.
