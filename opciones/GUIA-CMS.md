# Cómo editar el sitio Auto-Opciones con Pages CMS

## Entrar
1. Ve a https://app.pagescms.org y entra con tu cuenta de GitHub.
2. Elige el repositorio del sitio y la rama `main`.
3. En el menú de la izquierda aparecen las secciones que puedes editar.

Cada vez que guardas, el cambio se publica solo en 1 o 2 minutos. Si no lo ves, recarga la página.

## Qué se edita en cada sección
- **Configuración del sitio:** está dividida en **10 grupos numerados** en el mismo orden en que aparecen en el portal, y cada uno se abre y se cierra con la flecha. Entran cerrados; abre solo el que quieras ajustar y guarda con **Save**:
  1. **Encabezado:** logo, menú superior y botón del menú.
  2. **Secciones de la página de inicio:** banner, marcas, comparador, autos, ofertas, cómo funciona, publicidad, información de crédito, noticias y preguntas frecuentes, en orden de aparición (arrastra para cambiar el orden).
  3. **Buscador del banner y filtros de autos:** tipos de auto, presupuestos y formas de pago.
  4. **Comparador y cálculo de mensualidad:** enganches, plazos, tasa y fórmula.
  5. **Ficha técnica de los autos:** qué datos se muestran.
  6. **Página de requisitos:** textos.
  7. **Pie de página, contacto y WhatsApp:** teléfono, correos, redes, enlaces legales y mensajes.
  8. **Textos de botones y etiquetas** (lo que casi no cambia).
  9. **Título, descripción y estadísticas del sitio.**
  10. **Colores.**
  Cada grupo muestra una flecha y, a la derecha, un bote de basura: **no lo uses**; si borras un grupo, el CMS no te dejará guardar hasta que lo recuperes.
- **Autos:** agrega, edita u oculta autos. Cada auto es un registro propio, agrupado en una **carpeta por marca** (por ejemplo `nissan`, `bmw`): toca una carpeta para abrirla y ver sus autos debajo. Se puede **ordenar** por marca, modelo, versión o precio. La marca y el tipo deben escribirse igual que en Marcas y en Filtros.
- **Marcas:** nombre y logo de cada marca.
- **Financieras:** tasa, comisión por apertura y seguro que usa el comparador, más datos opcionales (enganche desde, plazos, detalle, enlace y logo) que se muestran al tocar la financiera en Ofertas de crédito.
- **Ofertas de crédito, Noticias y tips, Requisitos de crédito y Publicidad:** su contenido.

## Cómo se ven las listas
Las listas (autos, marcas, financieras, noticias, etc.) se abren **colapsadas** y cada registro muestra su nombre, por ejemplo "Toyota RAV4 XLE Híbrida". Haz clic en un registro para abrirlo, o en **Expand all** para abrirlos todos. Arrastra el ícono de puntos para cambiar el orden y usa el bote de basura para borrar.

## Agregar un auto nuevo
1. Entra a **Autos** y crea un registro nuevo (botón de agregar de la lista). El **Id** también será el nombre del archivo, y el auto se guarda solo en la carpeta de su marca (`opciones/data/autos/<marca>/<id>.json`; si la marca es nueva, se crea su carpeta). Los nombres de carpeta van en minúsculas y con guiones.
2. Llena al menos los campos marcados **Required**: Id, Marca, Modelo, Tipo, Precio y Foto.
   - **Id:** corto, único y solo con minúsculas, números y guiones. Ejemplo: `cx-5`.
   - **Marca** y **Tipo:** se eligen de una lista desplegable (así no hay errores de escritura).
   - **Precio:** en pesos, sin símbolo ni comas. Ejemplo: `599900`.
3. Sube la **Foto** (ver Fotos más abajo). Opcional pero recomendable: **Año modelo** y **Precio vigente al** (se muestran en la tarjeta del auto). **Posición en el portal** es opcional: un número menor aparece antes; los autos sin posición van al final, por marca y modelo.
4. Revisa cómo se ve la tarjeta en el portal. La tarjeta recorta la foto (más en pantallas anchas), así que lo ideal es una foto 3:2 con el auto completo y al centro. Si el auto queda cortado, cambia **Enfoque de la foto** (por ejemplo, *Arriba* cuando el auto está en la parte alta de la foto).
5. Presiona **Save**. Si falta algo o hay un error, el campo se marca en rojo y no se guarda hasta corregirlo.

Un auto nuevo nace con **Mostrar** encendido. Si no debe verse todavía, apágalo; no lo borres.

## Importar muchos autos desde una hoja de cálculo
Para cargar o actualizar varios autos a la vez (por ejemplo, con las listas de precios de una agencia):
1. Llena `tools/plantilla-autos.xlsx` (o un `.csv` con las mismas columnas): una fila por versión. Marca, modelo, versión y precio son obligatorios; lo que no sepas se deja vacío.
2. Revisa lo que cambiaría: `python3 tools/importar-autos.py mi-hoja.xlsx`. Muestra los autos nuevos, los precios o datos que cambian, los errores y los avisos. No escribe nada.
3. Si todo está bien: `python3 tools/importar-autos.py mi-hoja.xlsx --aplicar`. Escribe un archivo por auto en `opciones/data/autos/<marca>/` y vuelve a generar `autos.json`. Sube el cambio al repositorio.

Cosas que debes saber:
- Una celda vacía **nunca borra** un dato que ya existe.
- No se tocan la foto, el enfoque de la foto ni "Mostrar" de un auto que ya está.
- Un auto nuevo entra con **Mostrar apagado** hasta que le subas su foto en el CMS (el CMS exige foto).
- Si una marca no está en el portal, el script avisa: agrégala primero en **Marcas**.
- Anota en "vigencia" de qué fecha es el precio y en "fuente" de dónde lo sacaste (la fuente no se guarda en el portal).
- Esto no sube fotos. Las fotos necesitan permiso de la marca o de la agencia.

## Agregar una marca o un tipo de auto nuevo
Las listas de **Marca** y **Tipo** de Autos son fijas. Para sumar una:
1. **Marca:** agrégala en **Marcas** (nombre y logo). Luego, en el menú de la izquierda, entra a **Configuration**, busca la lista `marca` dentro de `autos` y agrega el nombre, escrito igual que en Marcas (el orden da igual: el portal siempre muestra las marcas en orden alfabético).
2. **Tipo:** agrégalo en **Configuración del sitio → grupo 3 (Buscador y filtros) → Tipos de auto** y también en **Configuration**, en la lista `tipo` de `autos`.

**Forma rápida:** pídele a quien administre el repositorio que corra `python3 tools/sincronizar-listas.py`. El script copia a las listas del CMS (en los dos archivos `.pages.yml`) los nombres de **Marcas** y los **Tipos de auto** de Filtros; con `--revisar` solo informa si falta algo. Si prefieres no editar **Configuration** ni correr el script, pídele a quien administre el sitio que lo haga.

## Reglas que revisa el CMS
- **Id:** solo minúsculas, números y guiones, sin espacios ni acentos, y no se puede repetir. Aplica en autos, financieras, perfiles de requisitos y anuncios.
- **Números:** precio de 100,000 a 15,000,000, pasajeros entre 1 y 9, bolsas de aire entre 0 y 20, tasa y comisión entre 0 y 100. Los decimales están permitidos (por ejemplo, rendimiento `15.4`).

## Cotizaciones y solicitudes (WhatsApp o correo)
Los botones **Cotizar este auto**, **Pedir cotización**, **Solicitar preautorización** y **Expediente completo** envían un mensaje ya escrito con los datos del auto o del perfil elegido (por ejemplo, auto, precio, enganche, plazo y mensualidad).
- En **Configuración del sitio → grupo 7 (Pie de página, contacto y WhatsApp)**, escribe tu **WhatsApp** (10 dígitos). Los mensajes llegarán a ese número.
- Si **no** llenas el WhatsApp, el mensaje se abre en el correo del visitante, dirigido al **primer correo** de la lista.
- Puedes cambiar el texto de los mensajes en los campos **Mensaje al cotizar…**. Las palabras entre llaves, como `{auto}` o `{precio}`, se reemplazan solas.

## Cómo funciona y Preguntas frecuentes
Son dos secciones de **grupo 2**:
- **Cómo funciona:** pasos con título y texto.
- **Preguntas frecuentes:** pregunta y respuesta; en el sitio se abren al presionarlas.
Los textos que traen son una **propuesta basada en lo que hace el sitio**; revísalos y ajústalos. Para ocultar una sección sin borrarla, apaga **Mostrar**.

## Buscar, ordenar y pago mensual
La lista de autos tiene un **buscador** (marca, modelo, versión o tipo), un selector de **orden** (precio o mensualidad) y el filtro **Pago mensual hasta**, que usa el enganche y el plazo del comparador. Los montos del filtro se editan en **grupo 3 → Opciones de «Pago mensual hasta»**; si lo dejas vacío, el filtro no aparece. Con la forma de pago **Contado** ese filtro se oculta.

## Cuántos autos se muestran y «Ver más»
La lista de autos no muestra todos de golpe. En **Configuración del sitio → grupo 2 → Autos** hay dos números:
- **Autos que se muestran al inicio** (por omisión 4).
- **Autos que se agregan cada vez que se presiona «Ver más»** (por omisión 10).

Debajo de la lista aparece "Mostrando X de N" y el botón **Ver más autos**. Cada clic agrega más autos **en la misma página** (no abre otra), y el botón desaparece cuando ya se ven todos. Si la persona cambia un filtro, la búsqueda o el orden, la lista vuelve a mostrar la cantidad inicial. El texto del botón y del contador se cambia en el **grupo 8**.

## Botón «Quiero esta opción» del comparador
Cada auto elegido en el comparador tiene su botón **Quiero esta opción**. Abre WhatsApp (o el correo, si no hay WhatsApp) con un mensaje que incluye el auto, la financiera elegida en ese auto, el enganche, el plazo y la mensualidad estimada. Con la forma de pago *Contado* o *Arrendamiento* el mensaje lo dice y no menciona financiera.
- El texto del botón se cambia en el **grupo 8** ("Comparador: botón «Quiero esta opción»").
- El mensaje se cambia en el **grupo 7** ("Mensaje al presionar «Quiero esta opción»"). Variables: `{auto}`, `{anio}`, `{precio}`, `{financiera}`, `{enganche}`, `{plazo}`, `{mensualidad}` y `{detalle}`.

## Financieras: toca una para ver sus condiciones
En **Ofertas de crédito vigentes**, cada financiera de la fila inferior es un botón. Al tocarla, las tarjetas de arriba cambian a las condiciones de esa financiera; al tocarla otra vez, o con **Ver ofertas generales**, vuelven las ofertas normales.
- Siempre muestra, si están llenos: **tasa anual**, **comisión por apertura** y **seguro mensual** (solo si es mayor a 0).
- Campos opcionales nuevos en **Financieras**: **Enganche desde (%)**, **Plazos disponibles**, **Detalle**, **Enlace para más información** (aparece como botón «Más información») y **Logo**. Los que dejes vacíos no se muestran.
- Las etiquetas ("Tasa anual", "Ver ofertas generales", etc.) y la leyenda se cambian en el **grupo 8**. Las condiciones son de referencia: revisa la leyenda con tu asesor.

## Botón flotante de WhatsApp, horario y dirección
- Cuando escribes el **WhatsApp** (grupo 7), aparece un botón redondo de WhatsApp en la esquina del sitio. Sin número, no aparece.
- En el mismo grupo puedes agregar **Horario de atención** y **Dirección**, que se muestran en el pie de página solo si los llenas.
- En **Redes y sitios**, las direcciones que empiezan con `https://` o `www.` se vuelven enlaces.

## Noticias y tips con su propia página
En **Noticias y tips**, cada tarjeta se comporta según lo que llenes:
- **Texto completo del artículo:** la noticia se abre en su propia página (con enlace compartible). Separa los párrafos con una línea en blanco.
- **Enlace externo** (solo si no hay texto completo): la tarjeta abre ese enlace.
- Si no llenas ninguno de los dos, la tarjeta es solo informativa y no se puede presionar.
- En el texto, las direcciones que empiezan con `https://` se vuelven enlaces.
- Las 4 noticias actuales traen un **texto sugerido** con sus fuentes al final. Es informativo y debe revisarse antes de lanzar el sitio; no sustituye asesoría financiera, fiscal ni legal.

## Forma de pago
El filtro **Pago** del banner cambia lo que muestran las tarjetas de autos:
- **Crédito:** muestra la mensualidad estimada y la leyenda del asterisco (*).
- **Contado:** oculta la mensualidad y la leyenda.
- **Arrendamiento:** en lugar de la mensualidad muestra "Renta a cotizar".
También se incluye en el mensaje de cotización. Para que funcione, escribe las opciones en **grupo 3 → Formas de pago** con las palabras *Crédito*, *Contado* o *Arrendamiento*.

## Foto del banner y colores
- La **foto del banner** se cambia en **grupo 2 (Secciones de la página de inicio) → Banner → Foto** (horizontal, de unos 1600 × 900 px).
- Los colores de la marca están en **grupo 10 (Colores)**. El naranja de los botones es `#EE8A52` (hover `#DE7840`).

## Ofertas de crédito
Muestra solo ofertas que puedas respaldar. Cada oferta tiene un interruptor **Mostrar** para ocultarla sin borrarla.

## Textos del sitio
En **Configuración del sitio → grupo 8 (Textos de botones y etiquetas)** puedes cambiar los textos de botones y etiquetas que no están en otras secciones (por ejemplo, "Cotizar este auto" o los pasos de Requisitos). Si dejas un campo vacío se usa el texto original.

La **leyenda del asterisco (*)** aclara bajo los autos que la mensualidad es estimada. Revisa con tu asesor que el texto cumpla con lo que necesitas. Para ocultarla, escribe un espacio en ese campo.

## Avisos legales
En **grupo 7 → Enlaces legales** agrega, por ejemplo, el **Aviso de privacidad** y los **Términos** con su enlace. Aparecen en el pie de página solo cuando existen. Pide a un asesor legal que revise su contenido.

## Estadísticas de visitas (opcional)
En **Configuración del sitio → grupo 9 (Título, descripción y estadísticas)** puedes activar una o varias herramientas. Si dejas todo vacío, el sitio no mide nada.

- **Umami** (recomendada para empezar; plan gratis): crea tu sitio en umami.is, entra a *Websites → Edit* y copia el **Website ID** en "ID del sitio en Umami". Mide visitas, **cada página interna** (requisitos, fichas, noticias) y los eventos: `lead` (cotizar o pedir preautorización), `compartir`, `financiera`, `whatsapp` (clic en un enlace de WhatsApp), `llamada` y `correo`.
- **Cloudflare Web Analytics** (gratis): en Cloudflare, *Web Analytics → Add a site* con `auto-opciones.com`, y copia el valor de **token** del fragmento de código en "Código (token) de Cloudflare". Mide visitas y velocidad; no tiene eventos propios.
- **Plausible** (de pago) o **Google Analytics 4** (usa cookies): también disponibles.

Notas:
- Umami solo mide en los dominios de "Umami: dominios donde se mide" (por defecto `auto-opciones.com` y `www.auto-opciones.com`), así que las vistas previas y pruebas no cuentan. El portal en `/opciones` sí cuenta si se abre desde auto-opciones.com.
- Umami respeta la opción "No rastrear" del navegador de quien visita.
- Cada evento y cada propiedad de un evento cuenta para el límite mensual del plan gratis de Umami (100,000 eventos).
- Para que tus propias visitas no cuenten, en Umami se puede excluir tu IP o usar un navegador aparte para administrar.
- **Cualquier herramienta que actives debe mencionarse en el aviso de privacidad.** Pide al asesor que lo revise.

## Direcciones de cada vista
Cada vista tiene su propio enlace, por ejemplo `…/#/requisitos` o `…/#/auto/rav4` (el `id` del auto). Sirven para compartir y para que el botón Atrás del navegador funcione.

## Cambiar el orden de las secciones
En **Configuración del sitio → grupo 2 (Secciones de la página de inicio)**, arrastra los bloques. Cada tipo de sección muestra solo los campos que le corresponden. El interruptor **Mostrar** oculta una sección sin borrarla. El campo **Fondo** cambia entre blanco y naranja suave.

Para agregar una sección, presiona **Add an item** y elige su tipo. Los tipos se usan una sola vez, salvo **Publicidad**, que puedes repetir. Para poner otro anuncio, crea el anuncio en **Publicidad**, luego agrega una sección de tipo *Publicidad* y elige el anuncio en la lista.

## Menú y botón con enlace externo
En **Configuración del sitio → grupo 1 (Encabezado) → Menú superior** (y en **Botón del menú**), el campo **Lleva a** elige un lugar del propio sitio. Si quieres abrir un enlace externo, llena **Enlace externo** con `https://…`, `mailto:…` o `tel:…`. Cuando tiene un enlace, se usa ese en lugar de **Lleva a**.

## Fórmula de mensualidad
Está en **Configuración del sitio → grupo 4 (Comparador y cálculo de mensualidad)**. La fórmula actual es:

`(monto + seguro_anual) * (tasa_mensual * (1 + iva / 100)) / (1 - (1 + tasa_mensual * (1 + iva / 100)) ^ -plazo)`

Esta fórmula le suma a la tasa el IVA de los intereses (los bancos publican la tasa sin IVA y cobran IVA sobre el interés de cada mes). En pruebas con créditos de ejemplo queda a menos de 0.5 % del pago promedio real; el pago real baja un poco cada mes, así que el resultado es una **estimación**. La fórmula anterior (sin IVA en los intereses) quedaba entre 3.5 % y 4.3 % por debajo.

**Cómo capturar las financieras con esta fórmula:** en **Tasa anual** escribe la tasa publicada por el banco, **sin IVA**. En **Comisión por apertura** escribe la comisión publicada **multiplicada por 1.16**, porque el portal no le suma IVA (por ejemplo, 2.5 % publicado se captura como 2.9). Anota la fuente y la fecha en el mensaje del cambio.

Variables que puedes usar: `precio`, `enganche`, `monto` (precio menos enganche), `tasa` (anual en %), `tasa_mensual`, `plazo` (meses), `apertura` (%), `seguro` (mensual), `seguro_anual` (pesos del seguro del primer año de ese auto), `iva` (%). Para potencias usa `^`.

Si la fórmula tiene un error, el sitio usa la fórmula de respaldo y sigue funcionando.

### Seguro del primer año
El seguro se **suma al monto financiado** (mismo plazo y tasa del crédito) y se muestra como estimado.
- **Porcentaje general:** en el grupo 4, **Seguro del primer año (% del precio de lista)**. Hoy es 2: el seguro de cada auto es el 2 % de su precio de lista (por ejemplo, $439,900 → $8,798). Es una referencia, no una cotización. Valídalo de vez en cuando con cotizaciones reales.
- **Monto propio de un auto:** en el auto, el campo **Seguro anual propio (MXN)**. Si lo dejas vacío o en 0, se usa el porcentaje.
- **Interruptor para el visitante:** en el comparador aparece "Incluir seguro del primer año (estimado)" con Sí o No, para quien ya tiene seguro. **El seguro empieza incluido** se controla con la casilla del mismo nombre en el grupo 4.
- **Quitarlo por completo:** pon el porcentaje en 0. El interruptor desaparece y la mensualidad se calcula sin seguro.
- **Si cambias la fórmula** y no usa `seguro_anual`, el interruptor se oculta, porque no tendría efecto.
- No aparece con pago de contado ni con arrendamiento.
- Los textos del interruptor y de la leyenda se editan en el grupo de textos del sitio.

## Colores
Escríbelos en formato `#RRGGBB`, por ejemplo `#EE8A52`. Si eliges un naranja muy claro, el texto blanco de los botones se leerá mal.

## Fotos y logos
- **Fotos** (autos, noticias y banner): puedes subir una nueva desde tu computadora. Se guarda en `assets/fotos`. Formatos: JPG, PNG o WEBP. Usa fotos horizontales de unos 1200 px de ancho; el CMS no las redimensiona.
- **Logos de marca:** se guardan en `assets/marcas`. Lo ideal es un SVG de un solo color (azul `#1B2A4A`), como los demás. También se aceptan PNG y WEBP.
- **Íconos de noticias:** solo SVG, en `assets/iconos`.
- Al subir un archivo, el CMS limpia su nombre: lo pasa a minúsculas y quita espacios y acentos (`Mi Foto.JPG` queda `mi-foto.jpg`).

## Optimizar fotos
El CMS no reduce el tamaño de las fotos. Para aligerar las que pesan más de 150 KB, quien administre el repositorio puede correr `python3 tools/optimizar-fotos.py` (requiere Pillow). Las fotos PNG pesadas conviene guardarlas como JPG antes de subirlas.

## Lista de documentos de Requisitos
Los documentos que marca cada visitante se recuerdan en su propio navegador; no se guardan en ningún servidor. El mensaje de preautorización incluye cuáles faltan. El botón **Imprimir o guardar mi lista** abre la impresión del navegador (también sirve para guardarla como PDF): al imprimir solo salen el perfil y la lista, sin encabezado, panel de solicitud ni botones.

## Teclado y accesibilidad
Con la tecla **Tab**, lo primero que aparece es **Saltar al contenido**. La tecla **Esc** cierra el menú del celular y la ficha técnica. Si el visitante tiene activado "reducir movimiento" en su dispositivo, el sitio evita las animaciones.

## Cómo llega un auto al portal (autos.json)
Cada auto vive en su propio archivo, `opciones/data/autos/<marca>/<id>.json`, y eso es lo que editas en el CMS. El portal lee un solo archivo, `opciones/data/autos.json`, que **se genera solo**: al guardar un auto, la acción **Generar autos.json** (pestaña Actions de GitHub) lo arma con todos los autos y lo publica en unos segundos. **No edites `autos.json` a mano**: el siguiente guardado lo reescribe. Si por algún motivo no se generó, corre `python3 tools/generar-autos.py` y sube el cambio.

## Historial de cambios
Cada vez que guardas en el CMS se crea un registro en GitHub con un mensaje en español, por ejemplo "Actualiza opciones/data/autos.json (desde Pages CMS)".

## Precio mal capturado: cómo evitarlo y cómo corregirlo
**Antes de guardar.** El campo **Precio** solo acepta de 100,000 a 15,000,000. Revisa los ceros y compara con la lista de la agencia. Anota siempre en **Precio vigente al** la fecha del precio.

**Después de guardar.** Cada cambio en un auto activa **Generar autos.json**, que incluye la revisión automática de precios (pestaña Actions de GitHub). Falla si un precio sale del rango o cambia más de 25 % contra el guardado anterior. Un salto real y correcto también la hace fallar: en ese caso solo confirma el precio. **La revisión avisa, pero no frena la publicación**: el precio mal capturado ya está en el sitio hasta que lo corrijas. Por eso, después de editar precios, abre el sitio publicado y compáralos; lo ideal es que lo haga una segunda persona.

**Cómo corregir.**
1. Lo más rápido: vuelve a abrir el auto en el CMS, escribe el precio correcto y guarda.
2. Si no sabes cuál era el correcto, en GitHub abre el archivo del auto (`opciones/data/autos/<marca>/<id>.json`), pulsa **History**, abre el último guardado que estaba bien y copia el contenido del archivo en ese guardado. Luego edita el archivo actual, pega ese contenido y guarda (commit). Los nombres de los botones de GitHub pueden variar un poco.
3. Si quieres, pide ayuda y comparte el enlace del guardado equivocado.

## Ten en cuenta
- Los precios, tasas y requisitos que vienen de ejemplo deben validarse antes de publicar.
- El **Id** de autos, financieras, perfiles y anuncios no debe repetirse ni llevar espacios.
