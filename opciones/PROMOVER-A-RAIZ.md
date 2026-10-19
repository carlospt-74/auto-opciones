# Lista de pasos para promover `/opciones` a la raíz

Este documento es para quien administre el repositorio. Todavía **no** se ha promovido nada.

1. **Quitar `noindex`.** En `index.html`, borrar la línea `<meta name="robots" content="noindex, nofollow">` (tiene un comentario encima). Mientras exista, Google no indexa el sitio.
2. **Mover los archivos.** Llevar a la raíz el contenido de `opciones/` (`index.html`, `ao.js`, `support.js`, `data/`, `assets/`, `AutoOpciones_Logo/`). La raíz ya tiene `assets/` con las mismas carpetas de fotos, marcas e íconos más `favicon*`, `logo.svg` y `AutoOpciones_og.png`; hay que fusionarlas sin perder esos archivos.
3. **Reemplazar `.pages.yml`.** Copiar `opciones/.pages.yml` sobre el `.pages.yml` de la raíz (sus rutas ya no llevan `opciones/`). Borrar el de `opciones/`.
3b. **Ajustar la acción Generar autos.json.** En `.github/workflows/generar-autos.yml` y en `tools/generar-autos.py` (`--raiz`), las rutas `opciones/data/autos/` y `opciones/data/autos.json` pasan a `data/autos/` y `data/autos.json`; lo mismo en `tools/importar-autos.py` y `.github/workflows/revisar-precios.yml`.
4. **Conservar `CNAME`** (`auto-opciones.com`).
5. **Revisar las rutas del favicon** en `index.html` (`AutoOpciones_Logo/06_favicon/...`) y la imagen de redes `og:image` (`https://auto-opciones.com/assets/AutoOpciones_og.png`).
6. **Agregar** `robots.txt` y `sitemap.xml` en la raíz, y una página `404.html` si se desea. El sitio ya incluye datos estructurados (schema.org) de la organización y los autos, y cada noticia con texto tiene su dirección `#/noticia/<slug>`; como las rutas usan `#`, las páginas de noticias no se listan por separado en un sitemap.
7. **Configurar en el CMS** el WhatsApp, los enlaces legales y, si se usan, las estadísticas (ver `GUIA-CMS.md`).
8. **Probar** en una vista previa antes de publicar: menú, requisitos (`#/requisitos`), una ficha (`#/auto/<id>`), cotizar un auto y el botón Atrás.
