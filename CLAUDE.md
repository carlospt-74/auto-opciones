# CLAUDE.md · Auto-Opciones (portal web)

> Lo lee Claude Code al iniciar una sesión en este repositorio. Resume cómo está construido el portal, cómo se trabaja en él y qué reglas ya decidió Carlos. **Este repositorio es PÚBLICO y GitHub Pages publica TODO su contenido en `auto-opciones.com`.** Por eso aquí no va nada confidencial: ni contraseñas, claves o tokens privados, ni estrategia de negocio, ni borradores legales, ni precios o fotos de agencias sin permiso. Esos materiales viven en una carpeta privada de Google Drive de Carlos ("Auto-Opciones · Contexto del proyecto (privado)"); si hacen falta, pídeselos.

## 0. Reglas de Carlos (obligatorias)
1. Decir siempre la verdad. No inventar datos, cifras, citas ni fuentes; no especular ni adivinar.
2. Citar fuente verificable para lo que dependa de información externa. Si no se puede verificar: **"No puedo confirmar esto"**.
3. Mostrar cómo se calculó cualquier cifra. Separar hechos, suposiciones y opiniones (las opiniones, etiquetadas).
4. Idioma: español de México (textos del sitio, mensajes de commit, respuestas).
5. Antes de acciones difíciles de revertir o visibles hacia fuera, confirmar. Cuando Carlos pida "dime qué harías antes de ejecutar", no ejecutes: explica y espera.

## 1. Qué es
Auto-Opciones es un servicio de intermediación (broker) para comprar autos nuevos de agencia en Monterrey, N.L. El portal es una página estática con catálogo, calculadora de mensualidad, comparador y solicitud por WhatsApp. **No tiene servidor ni base de datos propia**: lo que se captura se envía abriendo WhatsApp o el correo con un mensaje prellenado. Los socios son Carlos (técnico) y Omar (negocio y ventas).

## 2. Reglas del proyecto
- **El portal vive en la raíz del dominio** (`auto-opciones.com`), promovido el 31-oct-2026 por indicación de Carlos (con visto bueno de Omar). La ruta `/opciones/` se eliminó (da 404, sin redirección). **`index.html` mantiene `noindex`: no quitarlo hasta que Carlos lo indique.** Para que Google indexe: quitar la línea `noindex` de `index.html`, activar la línea `Sitemap` de `robots.txt` y enviar `sitemap.xml` en Google Search Console. Carlos asumió los pendientes de la sección 10 al promover.
- Los cambios al portal (`index.html`, `ao.js`, `support.js`, `data/`, `assets/`) y a su configuración de CMS (`.pages.yml`) Carlos los autoriza subir directo. Cambios a este archivo, a `.github/` y a `tools/`: están permitidos solo cuando son necesarios para el portal; ante duda, preguntar.
- **No inventar contenido de agencias ni de la empresa** (requisitos, precios, razón social, RFC, domicilio). Si falta, dejarlo marcado como pendiente.
- **Precios y fotos de terceros**: no publicarlos sin permiso por escrito de la agencia o marca. Todo dato nuevo lleva su fuente y fecha.
- El aviso de privacidad y los términos son borradores hasta que los valide un asesor legal: `aviso-de-privacidad.html` es una página de borrador (noindex, con banner) y no está enlazada en el pie.
- **El bot de WhatsApp (Assista Auto-Broker) está en otro repositorio** (`carlospt-74/notar-ia`), no aquí.

## 3. Estructura
```
index.html              plantillas del portal (etiquetas <x-dc>, <sc-if>, <sc-for>); carga ao.js con ?v=cmsNN. Lleva noindex (ver 2)
ao.js                   lógica del portal (IIFE, window.AO): estado, rutas con hash, cálculo, comparador, analítica
support.js              runtime de las plantillas; carga React 18.3.1 desde unpkg.com
data/                   contenido (JSON): sitio, financieras, marcas, ofertas, noticias, requisitos, anuncios, autos.json
data/autos/<marca>/     UN archivo JSON por auto (fuente de verdad de los autos)
data/fotos-lum.json     datos de luminosidad de fotos; los lee ao.js
assets/{fotos,iconos,marcas}  y logo.svg, favicon*, AutoOpciones_og.png (imagen de redes)
AutoOpciones_Logo/      logos y favicons (el portal usa 02_solo-texto y 06_favicon)
aviso-de-privacidad.html  borrador (noindex, con banner); no está enlazado en el pie
404.html, robots.txt, sitemap.xml
GUIA-CMS.md             guía para Carlos y Omar. Actualízala cuando cambies algo visible en el CMS
.pages.yml              configuración de Pages CMS (única copia)
tools/                  importar-autos.py, generar-autos.py, sincronizar-listas.py, optimizar-fotos.py, plantilla-autos.xlsx
.github/workflows/      generar-autos.yml, revisar-precios.yml
.github/scripts/        revisar_precios.py
CNAME                   auto-opciones.com (no tocar)
```
Rutas del portal (hash): `#/`, `#/requisitos[/perfil]`, `#/auto/<id>`, `#/noticia/<slug>`, `#/comparar/<id1,id2,id3>`. Las vistas se mandan a la analítica como rutas virtuales.

## 4. Pages CMS (cómo se administra)
- Carlos y Omar editan en https://app.pagescms.org; cada guardado es un **commit directo a `main`** (mensajes tipo "Actualiza … (desde Pages CMS)"). Por eso `main` cambia sin avisar: haz `git fetch` antes de trabajar.
- `.pages.yml` (raíz) es la única copia. Las listas desplegables de Marca, Tipo y Anuncio se sincronizan con `python3 tools/sincronizar-listas.py` (la opción `todos` de Anuncio la agrega el propio script).
- Valida `.pages.yml` con el esquema real de configuración de Pages CMS (`ConfigSchema` del proyecto abierto pages-cms) antes de subir; un error rompe todo el CMS. Ese validador no está en el repositorio.
- **Cuidado con formularios viejos:** si Carlos abre el CMS antes de que un cambio de esquema se publique y guarda, el CMS puede borrar campos nuevos (ya pasó con `calculo.seguro_porcentaje`). Tras cambiar el esquema, avisarle que recargue el CMS (Ctrl+F5) y revisar el diff del siguiente commit del CMS.
- Los JSON se guardan con sangría de 2 espacios y a veces sin salto de línea final: respeta el formato al editar.

## 5. Datos de autos
- **Fuente de verdad:** un archivo por auto en `data/autos/<marca>/<id>.json` (se edita en el CMS, colección Autos).
- `data/autos.json` (lo que lee el portal) **se genera solo**: la Action "Generar autos.json" corre `python3 tools/generar-autos.py` cuando cambian archivos de `data/autos/` y hace commit a `main`. No se edita a mano. `--revisar` solo comprueba que coincida.
- Estado el 31-oct-2026: 965 autos de 35 marcas, 17 ocultos (`mostrar: false`). No todos tienen año ni vigencia del precio.
- `tools/importar-autos.py` pasa una hoja Excel/CSV a los archivos por auto (primero solo revisa; con `--aplicar` escribe; una celda vacía nunca borra un dato; los autos nuevos entran ocultos hasta tener foto). Plantilla: `tools/plantilla-autos.xlsx`.
- Fotos: horizontales, ~1000 px de ancho, proporción 3:2, el auto completo y centrado (la tarjeta recorta). Campo `enfoque_foto` ajusta el recorte. `tools/optimizar-fotos.py` reduce el peso.
- Controles de precio: el campo Precio del CMS acepta de 100,000 a 15,000,000. `.github/scripts/revisar_precios.py` (llamado por las Actions) falla si un precio sale del rango o cambia más de 25 %. **Avisa, no frena la publicación.** Cómo corregir: `GUIA-CMS.md`, sección "Precio mal capturado".

## 6. Calculadora y comparador
- Fórmula (editable en el CMS, grupo 4 de Configuración del sitio): `(monto + seguro_anual) * tasa_mensual / (1 - (1 + tasa_mensual) ^ -plazo)`. Si la fórmula del CMS falla, se usa la de respaldo. Variables: `precio, enganche, monto, tasa, tasa_mensual, plazo, apertura, seguro, seguro_anual, iva`.
- **Seguro del primer año:** estimado como % del precio de lista (`calculo.seguro_porcentaje`, hoy 2; es una referencia que dio Carlos, no una cotización), con monto propio opcional por auto (`seguro_anual`). Interruptor "Financiar el seguro del primer año (estimado)": con Sí se suma al monto financiado; con No aparece por auto un campo "Seguro (pago único)" que no cambia la mensualidad. Con porcentaje 0 o si la fórmula no usa `seguro_anual`, el interruptor se oculta; tampoco aparece con contado o arrendamiento.
- **Pago inicial** en el comparador = enganche + apertura + seguro pagado al inicio (se suman las cifras ya redondeadas). La línea Apertura muestra solo el monto, sin porcentaje. También aparece en el mensaje de WhatsApp de "Quiero esta opción".
- Las mensualidades se muestran como estimadas, "sujetas a aprobación de crédito". No presentarlas como oferta.
- El campo `seguro` (mensual) de cada financiera hoy no afecta ningún cálculo; solo se muestra en sus condiciones si es mayor que 0.

## 7. Analítica
Umami Cloud y Cloudflare Web Analytics, configurados en el grupo 9 del CMS (`analitica`). Eventos: `whatsapp` (origen flotante, pie o pagina), `llamada`, `correo`, `lead`, `compartir` y vistas virtuales por ruta. Umami respeta "No rastrear" y solo mide en `auto-opciones.com`. Para excluir visitas propias: `localStorage.setItem('umami.disabled', 1)` en cada navegador. Cualquier herramienta que se active debe mencionarse en el aviso de privacidad.

## 8. Cómo probar (sin servidor)
- Servir la raíz del repositorio con `python3 -m http.server` y abrir con Playwright (`playwright-core` + el Chromium preinstalado en `/opt/pw-browsers`). El portal carga React desde `unpkg.com`: si el entorno bloquea esa red, descarga `react.production.min.js` y `react-dom.production.min.js` (18.3.1) a una copia temporal y ajusta `support.js` solo en esa copia. Bloquea o simula los scripts de Umami y Cloudflare.
- Verifica: números contra un cálculo manual, móvil de 390 px sin desborde horizontal, consola sin errores propios.
- Al cambiar `ao.js`, sube el número de versión en `index.html` (`ao.js?v=cmsNN`) para romper la caché.

## 9. Flujo de Git
Trabajar en la rama que asigne la sesión → commits pequeños con mensaje en español → PR a `main` → fusión con squash → volver a alinear la rama con `main` (`git fetch origin main && git checkout -B <rama> origin/main` y `git push --force-with-lease`). No crear PR si Carlos no lo pide; no empujar a otras ramas. Si el hook de Git avisa de commits sin subir tras alinear la rama, es solo que la rama remota quedó atrás: `git push` normal.

## 10. Pendientes técnicos abiertos
- **Quitar `noindex`** cuando Carlos lo indique (ver 2). Antes, validar el aviso de privacidad con un asesor legal (razón social, RFC y domicilio sin definir), que debe mencionar la analítica activa (Umami y Cloudflare); enlazarlo en el pie cuando esté validado.
- Carlos asumió al promover (31-oct-2026): permiso por escrito de agencias y marcas para los precios y fotos de los autos (no confirmado en el repositorio); noticias con "texto sugerido" sin revisar; requisitos, tasas y ofertas de ejemplo sin validar.
- Foto de noche del banner: `assets/fotos/fotomty2.jpg` tiene origen y licencia sin confirmar; reemplazarla por una con licencia. Las otras 4 fotos del reel son de Pexels (fuente en "Autor y fuente" del CMS).
- Financieras: tasas de Santander, Scotiabank y Banregio salen de ofertas ya vencidas; Banamex y HSBC están ocultas sin tasas oficiales vigentes (HSBC Inmediauto aparece cerrado a nueva originación en la ficha de CONDUSEF).
- Anuncios: verificar el texto del anuncio de Afirme; revisión legal del término "Publicidad". Con "reducir movimiento" el reel y los anuncios rotan sin animación y sin botón de pausa: evaluar agregarlo.
- Leer el catálogo público de una agencia (Nissan Rivero) con Firecrawl (hay un permiso escrito pendiente y los datos no se publican hasta tenerlo; las páginas de modelo siguen el patrón `/nissan/catalogo/nuevos/nissan-<modelo>-<año>/` y tienen un PDF de catálogo con ficha técnica; falta el precio por versión).
- Año y vigencia de los autos (algunos no los tienen); páginas propias por noticia.
