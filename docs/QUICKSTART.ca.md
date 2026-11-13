# PetQR — Inici ràpid

Una petita placa. Un camí a casa. Crea perfils públics i QR permanents per a diversos animals, sense servidor, base de dades ni compte central de PetQR.

1. A GitHub, fes servir **Use this template → Create a new repository** al teu compte. El mantenidor ha de marcar primer el repositori com a plantilla. Tria un repositori públic per tenir GitHub Pages gratuït.
2. Obre **Settings → Pages → Source → GitHub Actions**. Executa **Actions → Validate, test & deploy PetQR → Run workflow** a la branca predeterminada.
3. Obre l’URL de Pages i afegeix-hi `/editor/`. Els exemples són ficticis: substitueix animals, fotos i contactes.
4. A Contactes, afegeix les teves dades i confirma que les vols publicar. Assigna’ls a cada animal. A Configuració, verifica l’URL públic i desactiva l’avís de dades fictícies.
5. Edita, previsualitza i fes servir **Exportar fitxers**. Extreu el ZIP: substitueix `data/` i combina `assets/pets/` al repositori. Confirma els canvis i espera que acabi Actions.
6. Obre cada perfil publicat, genera’n el QR i comprova l’enllaç i la impressió amb diversos telèfons.

**Tot el que es puja a GitHub Pages i al repositori públic és públic.** Els camps no publicats s’exclouen del ZIP; un esborrany local només es desa si ho demanes. No pugis documents, adreces exactes ni dades confidencials. Desactivar l’índex o utilitzar noindex no dona privacitat.

Per marcar un animal perdut: Editar → Missatge d’emergència → Estat → Perdut; exporta i publica. Canviar dades o estat manté el QR. No canviïs l’URL, el nom del repositori ni l’ID després d’imprimir plaques.

L’editor funciona en català, castellà i anglès. El mode Avançat permet afegir més de cent camps suggerits i seccions personalitzades. Fotos: retall, gir i compressió locals. QR: SVG, PNG, colors, marges i plaques imprimibles. Les modificacions locals no es desen automàticament a GitHub.

La [guia completa](../README.md), la [guia de privacitat](PRIVACY.md) i la [guia de desplegament](DEPLOYMENT.md) inclouen tots els detalls. Per al desenvolupament local: `npm ci`, `npm run dev`. Per comprovar: `npm run build`, `npm test`, `npm run test:e2e` després d’instal·lar Playwright Chromium.
