# Cómo editar el sitio Auto-Opciones con Pages CMS

## Entrar
1. Ve a https://app.pagescms.org y entra con tu cuenta de GitHub.
2. Elige el repositorio del sitio y la rama `main`.
3. En el menú de la izquierda aparecen las secciones que puedes editar.

Cada vez que guardas, el cambio se publica solo en 1 o 2 minutos. Si no lo ves, recarga la página.

## Qué se edita en cada sección
- **Configuración del sitio:** colores, logo, teléfono, correos, menú, filtros, fórmula de mensualidad, ficha técnica, textos de requisitos y el orden de las secciones de inicio.
- **Autos:** agrega, edita u oculta autos. La marca y el tipo deben escribirse igual que en Marcas y en Filtros.
- **Marcas:** nombre y logo de cada marca.
- **Financieras:** tasa, comisión por apertura y seguro que usa el comparador.
- **Ofertas de crédito, Noticias y tips, Requisitos de crédito y Publicidad:** su contenido.

## Cómo se ven las listas
Las listas (autos, marcas, financieras, noticias, etc.) se abren **colapsadas** y cada registro muestra su nombre, por ejemplo "Toyota RAV4 XLE Híbrida". Haz clic en un registro para abrirlo, o en **Expand all** para abrirlos todos. Arrastra el ícono de puntos para cambiar el orden y usa el bote de basura para borrar.

## Agregar un auto nuevo
1. Entra a **Autos** y presiona **Add an item** al final de la lista.
2. Llena al menos los campos marcados **Required**: Id, Marca, Modelo, Tipo, Precio y Foto.
   - **Id:** corto, único y solo con minúsculas, números y guiones. Ejemplo: `cx-5`.
   - **Marca** y **Tipo:** se eligen de una lista desplegable (así no hay errores de escritura).
   - **Precio:** en pesos, sin símbolo ni comas. Ejemplo: `599900`.
3. Sube la **Foto** (ver Fotos más abajo). Opcional pero recomendable: **Año modelo** y **Precio vigente al** (se muestran en la tarjeta del auto).
4. Presiona **Save**. Si falta algo o hay un error, el campo se marca en rojo y no se guarda hasta corregirlo.

Un auto nuevo nace con **Mostrar** encendido. Si no debe verse todavía, apágalo; no lo borres.

## Agregar una marca o un tipo de auto nuevo
Las listas de **Marca** y **Tipo** de Autos son fijas. Para sumar una:
1. **Marca:** agrégala en **Marcas** (nombre y logo). Luego, en el menú de la izquierda, entra a **Configuration**, busca la lista `marca` dentro de `autos` y agrega el nombre, escrito igual que en Marcas, en orden alfabético.
2. **Tipo:** agrégalo en **Configuración del sitio → Filtros → Tipos de auto** y también en **Configuration**, en la lista `tipo` de `autos`.

Si prefieres no editar **Configuration**, pídele a quien administre el sitio que lo haga.

## Reglas que revisa el CMS
- **Id:** solo minúsculas, números y guiones, sin espacios ni acentos, y no se puede repetir. Aplica en autos, financieras, perfiles de requisitos y anuncios.
- **Números:** precio mayor a 0, pasajeros entre 1 y 9, bolsas de aire entre 0 y 20, tasa y comisión entre 0 y 100. Los decimales están permitidos (por ejemplo, rendimiento `15.4`).

## Cotizaciones y solicitudes (WhatsApp o correo)
Los botones **Cotizar este auto**, **Pedir cotización**, **Solicitar preautorización** y **Expediente completo** envían un mensaje ya escrito con los datos del auto o del perfil elegido (por ejemplo, auto, precio, enganche, plazo y mensualidad).
- En **Configuración del sitio → Contacto y pie de página**, escribe tu **WhatsApp** (10 dígitos). Los mensajes llegarán a ese número.
- Si **no** llenas el WhatsApp, el mensaje se abre en el correo del visitante, dirigido al **primer correo** de la lista.
- Puedes cambiar el texto de los mensajes en los campos **Mensaje al cotizar…**. Las palabras entre llaves, como `{auto}` o `{precio}`, se reemplazan solas.

## Noticias y tips con su propia página
En **Noticias y tips**, cada tarjeta se comporta según lo que llenes:
- **Texto completo del artículo:** la noticia se abre en su propia página (con enlace compartible). Separa los párrafos con una línea en blanco.
- **Enlace externo** (solo si no hay texto completo): la tarjeta abre ese enlace.
- Si no llenas ninguno de los dos, la tarjeta es solo informativa y no se puede presionar.

## Forma de pago
El filtro **Pago** del banner cambia lo que muestran las tarjetas de autos:
- **Crédito:** muestra la mensualidad estimada y la leyenda del asterisco (*).
- **Contado:** oculta la mensualidad y la leyenda.
- **Arrendamiento:** en lugar de la mensualidad muestra "Renta a cotizar".
También se incluye en el mensaje de cotización. Para que funcione, escribe las opciones en **Filtros → Formas de pago** con las palabras *Crédito*, *Contado* o *Arrendamiento*.

## Foto del banner y colores
- La **foto del banner** se cambia en **Secciones de la página de inicio → Banner → Foto** (horizontal, de unos 1600 × 900 px).
- Los colores de la marca están en **Colores**. El naranja de los botones es `#EE8A52` (hover `#DE7840`).

## Ofertas de crédito
Muestra solo ofertas que puedas respaldar. Cada oferta tiene un interruptor **Mostrar** para ocultarla sin borrarla.

## Textos del sitio
En **Configuración del sitio → Textos del sitio** puedes cambiar los textos de botones y etiquetas que no están en otras secciones (por ejemplo, "Cotizar este auto" o los pasos de Requisitos). Si dejas un campo vacío se usa el texto original.

La **leyenda del asterisco (*)** aclara bajo los autos que la mensualidad es estimada. Revisa con tu asesor que el texto cumpla con lo que necesitas. Para ocultarla, escribe un espacio en ese campo.

## Avisos legales
En **Contacto y pie de página → Enlaces legales** agrega, por ejemplo, el **Aviso de privacidad** y los **Términos** con su enlace. Aparecen en el pie de página solo cuando existen. Pide a un asesor legal que revise su contenido.

## Estadísticas de visitas (opcional)
En **Configuración del sitio → Estadísticas de visitas** puedes poner el dominio de **Plausible** o el ID de **Google Analytics 4** (`G-…`). Si los dejas vacíos, el sitio no usa estadísticas. Google Analytics usa cookies y puede requerir un aviso a los visitantes.

## Direcciones de cada vista
Cada vista tiene su propio enlace, por ejemplo `…/#/requisitos` o `…/#/auto/rav4` (el `id` del auto). Sirven para compartir y para que el botón Atrás del navegador funcione.

## Cambiar el orden de las secciones
En **Configuración del sitio → Secciones de la página de inicio**, arrastra los bloques. Cada tipo de sección muestra solo los campos que le corresponden. El interruptor **Mostrar** oculta una sección sin borrarla. El campo **Fondo** cambia entre blanco y naranja suave.

Para agregar una sección, presiona **Add an item** y elige su tipo. Los tipos se usan una sola vez, salvo **Publicidad**, que puedes repetir. Para poner otro anuncio, crea el anuncio en **Publicidad**, luego agrega una sección de tipo *Publicidad* y escribe el **Id del anuncio**.

## Menú y botón con enlace externo
En **Configuración del sitio → Menú superior** (y en **Botón del menú**), el campo **Lleva a** elige un lugar del propio sitio. Si quieres abrir un enlace externo, llena **Enlace externo** con `https://…`, `mailto:…` o `tel:…`. Cuando tiene un enlace, se usa ese en lugar de **Lleva a**.

## Fórmula de mensualidad
Está en **Configuración del sitio → Cálculo de mensualidad**. La fórmula actual es:

`monto * tasa_mensual / (1 - (1 + tasa_mensual) ^ -plazo)`

Variables que puedes usar: `precio`, `enganche`, `monto` (precio menos enganche), `tasa` (anual en %), `tasa_mensual`, `plazo` (meses), `apertura` (%), `seguro` (mensual), `iva` (%). Para potencias usa `^`.

Ejemplo con seguro: `monto * tasa_mensual / (1 - (1 + tasa_mensual) ^ -plazo) + seguro`

Si la fórmula tiene un error, el sitio usa la fórmula de respaldo y sigue funcionando.

## Colores
Escríbelos en formato `#RRGGBB`, por ejemplo `#EE8A52`. Si eliges un naranja muy claro, el texto blanco de los botones se leerá mal.

## Fotos y logos
- **Fotos** (autos, noticias y banner): puedes subir una nueva desde tu computadora. Se guarda en `assets/fotos`. Formatos: JPG, PNG o WEBP. Usa fotos horizontales de unos 1200 px de ancho; el CMS no las redimensiona.
- **Logos de marca:** se guardan en `assets/marcas`. Lo ideal es un SVG de un solo color (azul `#1B2A4A`), como los demás. También se aceptan PNG y WEBP.
- **Íconos de noticias:** solo SVG, en `assets/iconos`.
- Al subir un archivo, el CMS limpia su nombre: lo pasa a minúsculas y quita espacios y acentos (`Mi Foto.JPG` queda `mi-foto.jpg`).

## Ten en cuenta
- Los precios, tasas y requisitos que vienen de ejemplo deben validarse antes de publicar.
- El **Id** de autos, financieras, perfiles y anuncios no debe repetirse ni llevar espacios.
