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

## Fotos
Al editar una foto puedes subir una nueva desde tu computadora. Se guarda en `assets/fotos`. Usa fotos horizontales de unos 1200 px de ancho.

## Ten en cuenta
- Los precios, tasas y requisitos que vienen de ejemplo deben validarse antes de publicar.
- El **Id** de autos, financieras, perfiles y anuncios no debe repetirse ni llevar espacios.
