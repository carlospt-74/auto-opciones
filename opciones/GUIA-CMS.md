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
   - **Marca:** igual que aparece en **Marcas** (ejemplo: `Mazda`).
   - **Tipo:** igual que en **Configuración del sitio → Filtros** (ejemplo: `SUV`).
   - **Precio:** en pesos, sin símbolo ni comas. Ejemplo: `599900`.
3. Sube la **Foto** (ver Fotos más abajo).
4. Presiona **Save**. Si falta algo o hay un error, el campo se marca en rojo y no se guarda hasta corregirlo.

Si un auto no debe verse todavía, apaga **Mostrar**. No lo borres.

## Reglas que revisa el CMS
- **Id:** solo minúsculas, números y guiones, sin espacios ni acentos, y no se puede repetir. Aplica en autos, financieras, perfiles de requisitos y anuncios.
- **Números:** precio mayor a 0, pasajeros entre 1 y 9, bolsas de aire entre 0 y 20, tasa y comisión entre 0 y 100. Los decimales están permitidos (por ejemplo, rendimiento `15.4`).

## Cambiar el orden de las secciones
En **Configuración del sitio → Secciones**, arrastra los bloques. El interruptor **Mostrar** oculta una sección sin borrarla. El campo **Fondo** cambia entre blanco y naranja suave.

Para poner otro anuncio, crea el anuncio en **Publicidad**, luego agrega un bloque de tipo *Publicidad* en Secciones y escribe el **Id del anuncio**.

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
