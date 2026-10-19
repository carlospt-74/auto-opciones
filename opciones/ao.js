// Auto-Opciones · lógica del portal. Todo el contenido se lee de data/*.json (editable con Pages CMS).
(function () {
  if (window.__aoIniciado) return;
  window.__aoIniciado = true;
  const D = { sitio: {}, marcas: [], autos: [], financieras: [], ofertas: [], noticias: [], perfiles: [], anuncios: [] };
  const ARCH = { sitio: 'sitio', marcas: 'marcas', autos: 'autos', financieras: 'financieras', ofertas: 'ofertas', noticias: 'noticias', perfiles: 'requisitos', anuncios: 'anuncios' };
  let listo = false; const subs = new Set();
  const notify = () => subs.forEach(c => { try { c.setState({ _d: Date.now() }); } catch (e) {} });

  const VARS_COLOR = { principal: '--ao-1', principal_hover: '--ao-1h', texto_acento: '--ao-tx', fondo_suave: '--ao-suave', azul: '--ao-azul' };
  const COLOR_BASE = { principal: '#EE8A52', principal_hover: '#DE7840', texto_acento: '#9C4A1E', fondo_suave: '#FEF3EB', azul: '#1F3466' };
  function aplicarColores(c) {
    const r = document.documentElement.style;
    for (const k in VARS_COLOR) { const v = c && c[k]; r.setProperty(VARS_COLOR[k], /^#[0-9a-f]{6}$/i.test(v || '') ? v : COLOR_BASE[k]); }
  }
  aplicarColores();

  // sitio.json agrupa la configuración en bloques de un solo elemento (para poder colapsarlos en el CMS).
  // Aquí se "aplana" a las claves de siempre; también acepta la estructura anterior (sin grupos).
  const uno = x => Array.isArray(x) ? (x[0] || {}) : (x && typeof x === 'object' ? x : {});
  function aplanarSitio(j) {
    j = j && typeof j === 'object' ? j : {};
    const o = { ...j };
    if (j.encabezado !== undefined) { const e = uno(j.encabezado); o.logo = e.logo; o.menu = e.menu || []; o.boton_menu = e.boton_menu || {}; }
    if (j.ajustes !== undefined) { const a = uno(j.ajustes); o.titulo_pagina = a.titulo_pagina; o.descripcion = a.descripcion; o.analitica = a.analitica; }
    if (Array.isArray(j.ficha) && j.ficha[0] && Array.isArray(j.ficha[0].campos)) o.ficha = j.ficha[0].campos;
    ['colores', 'contacto', 'filtros', 'calculo', 'requisitos', 'textos'].forEach(k => { if (j[k] !== undefined) o[k] = uno(j[k]); });
    return o;
  }

  // Luminancia promedio de cada foto (0-255), para elegir un fondo con buen contraste. Si falta, se usan los fondos claros.
  let LUM = {};
  fetch('data/fotos-lum.json').then(r => r.ok ? r.json() : {}).then(j => { LUM = j || {}; notify(); }).catch(() => {});
  const FONDOS = [['#FFFFFF', 255], ['#E6E9EE', 232], ['#EFE4D2', 230], ['#D5E0EA', 224], ['#4A5463', 85], ['#5B4636', 75], ['#8C94A0', 146], ['#15181D', 25], ['#6F8FB0', 139], ['#B9C9B5', 196]];
  const rgbDe = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const distCol = (a, b) => Math.hypot(...rgbDe(a).map((v, i) => v - rgbDe(b)[i]));
  const FONDO_RAYAS = 'repeating-linear-gradient(135deg,#F7F3EF 0 12px,#EFE9E3 12px 24px)';

  Promise.all(Object.entries(ARCH).map(([k, f]) =>
    fetch('data/' + f + '.json', { cache: 'no-cache' })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(j => { D[k] = k === 'sitio' ? aplanarSitio(j) : (Array.isArray(j[k]) ? j[k] : []); })
      .catch(e => console.warn('No se pudo leer data/' + f + '.json', e))
  )).then(() => { listo = true; aplicarColores(D.sitio.colores); if (D.sitio.titulo_pagina) document.title = D.sitio.titulo_pagina; prepararPagina(); notify(); });

  // Fórmula de mensualidad editable. Si tiene un error, se usa la de respaldo.
  const FORMULA_BASE = '(monto + seguro_anual) * tasa_mensual / (1 - (1 + tasa_mensual) ^ -plazo)';
  const VARS = ['precio', 'enganche', 'monto', 'tasa', 'tasa_mensual', 'plazo', 'apertura', 'seguro', 'seguro_anual', 'iva'];
  const FUN = ['min', 'max', 'round', 'pow', 'abs', 'ceil', 'floor'];
  function compilar(f) {
    if (typeof f !== 'string' || !f.trim() || !/^[\w\s.+\-*/()^,]*$/.test(f)) throw new Error('caracteres no permitidos');
    (f.match(/[a-z_][a-z_0-9]*/gi) || []).forEach(i => { if (!VARS.includes(i) && !FUN.includes(i)) throw new Error('variable desconocida: ' + i); });
    const fn = new Function(...VARS, ...FUN, 'return (' + f.replace(/\^/g, '**') + ');');
    return v => fn(...VARS.map(k => v[k]), Math.min, Math.max, Math.round, Math.pow, Math.abs, Math.ceil, Math.floor);
  }
  const fnBase = compilar(FORMULA_BASE);
  let fnAct = fnBase, fAct = null;
  function formula() {
    const s = (D.sitio.calculo || {}).formula;
    if (s !== fAct) {
      fAct = s;
      try {
        const fn = compilar(s);
        const t = fn({ precio: 500000, enganche: 100000, monto: 400000, tasa: 14, tasa_mensual: 14 / 1200, plazo: 48, apertura: 2, seguro: 0, seguro_anual: 0, iva: 16 });
        if (!isFinite(t) || t <= 0) throw new Error('el resultado no es válido');
        fnAct = fn;
      } catch (e) { console.warn('Fórmula de mensualidad con error; se usa la de respaldo.', e.message); fnAct = fnBase; }
    }
    return fnAct;
  }
  function mensualidad(precio, engPct, fin, plazo, seguroAnual) {
    const enganche = precio * engPct / 100, monto = precio - enganche, tasa = +fin.tasa || 0;
    const v = { precio, enganche, monto, tasa, tasa_mensual: tasa / 1200, plazo, apertura: +fin.apertura || 0, seguro: +fin.seguro || 0, seguro_anual: +seguroAnual || 0, iva: +((D.sitio.calculo || {}).iva) || 16 };
    let r; try { r = formula()(v); } catch (e) { r = NaN; }
    if (!isFinite(r)) { try { r = fnBase(v); } catch (e) { r = 0; } }
    return isFinite(r) ? r : 0;
  }

  const TIPOS_SEC = ['banner', 'marcas', 'comparador', 'autos', 'ofertas', 'como_funciona', 'publicidad', 'info_credito', 'noticias', 'faq'];
  function secciones() {
    const L = Array.isArray(D.sitio.secciones) ? D.sitio.secciones : [];
    const S = {}; TIPOS_SEC.forEach(t => { S[t] = { show: false, order: 0 }; });
    const pubs = [];
    const ads = D.anuncios.filter(a => a.mostrar !== false);
    L.forEach((s, i) => {
      if (!s || !TIPOS_SEC.includes(s.tipo)) return;
      const suave = s.fondo === 'suave';
      const o = { ...s, show: s.mostrar !== false, order: i + 1, bg: suave ? 'var(--ao-suave)' : 'transparent', pb: suave ? 'clamp(40px,6cqi,80px)' : '0',
        verFin: s.mostrar_financieras !== false, verIconos: s.mostrar_iconos !== false };
      if (s.tipo === 'publicidad') {
        if (!o.show) return;
        const a = ads.find(x => x.id === s.anuncio) || ads.find(x => x.ubicacion !== 'requisitos');
        if (a) pubs.push({ ...o, anunciante: a.anunciante, texto: a.texto, enlace: a.enlace, texto_boton: a.texto_boton || 'Ver más', hayEnlace: !!a.enlace });
        return;
      }
      if (!S[s.tipo].seen) S[s.tipo] = { ...o, seen: true };
    });
    return { S, pubs };
  }

  const FICHA_BASE = [{ etiqueta: 'Motor', campo: 'motor', unidad: '' }];
  const mxn = n => '$' + Math.round(n).toLocaleString('es-MX');
  const lst = a => Array.isArray(a) ? a : [];

  // Qué parte de la foto se prioriza al recortarla (campo "Enfoque de la foto" de cada auto).
  const ENFOQUE = { arriba: 'center 15%', 'arriba-centro': 'center 30%', centro: 'center', 'abajo-centro': 'center 70%', abajo: 'center 85%' };

  // Textos de la interfaz que se pueden editar en el CMS (Configuración del sitio → Textos del sitio).
  const TEXTOS = {
    ver_ficha: 'Ver ficha técnica', ficha: 'Ficha técnica', precio_desde: 'Precio desde', cotizar_auto: 'Cotizar este auto',
    pedir_cotizacion: 'Pedir cotización', sin_autos: 'Te conseguimos un {marca} en cualquier agencia de Monterrey.',
    ver_comparacion: 'Ver comparación', comparar: 'Comparar', en_comparador: 'En comparador', comparador_lleno: 'Comparador lleno',
    enganche: 'Enganche', plazo: 'Plazo', mensualidad_estimada: 'Mensualidad estimada a',
    paso1: 'Paso 1 · Elige tu perfil', paso2: 'Paso 2 · Revisa tus documentos', paso3: 'Paso 3 · Solicita',
    condiciones: 'Condiciones generales', enviar_solicitud: 'Expediente completo · Enviar solicitud',
    atencion: 'Atención personalizada', siguenos: 'Síguenos', inicio: 'Inicio', requisitos: 'Requisitos',
    leyenda_mensualidad: 'Pago mensual estimado con una tasa de referencia, sujeto a aprobación de crédito.',
    seguro_interruptor: 'Financiar el seguro del primer año (estimado)', leyenda_seguro: 'Incluye un seguro de auto del primer año, estimado y financiado con el crédito. Si ya tienes seguro, elige No y deja el campo vacío.',
    pago_inicial: 'Pago inicial', seguro_pago_unico: 'Seguro (pago único)', leyenda_pago_inicial: 'Pago inicial estimado: enganche, comisión por apertura y, si no financias el seguro, el monto que captures.',
    buscar_label: 'Buscar', buscar_placeholder: 'Marca o modelo', ordenar: 'Ordenar por', orden_relevancia: 'Más relevantes', orden_precio_asc: 'Precio: de menor a mayor', orden_precio_desc: 'Precio: de mayor a menor', orden_mensual: 'Mensualidad: de menor a mayor', mensual_hasta: 'Pago mensual hasta', limpiar_filtros: 'Limpiar filtros', horario: 'Horario',
    whatsapp_texto: 'Escríbenos por WhatsApp', saltar: 'Saltar al contenido', imprimir_lista: 'Imprimir o guardar mi lista', renta_cotizar: 'Renta a cotizar', noticias: 'Noticias', noticia_no_encontrada: 'No encontramos esta noticia.',
    volver_noticias: 'Ver más noticias y tips', min_lectura: 'min de lectura', cta_noticia: 'Cotizar mi auto', ver_mas_autos: 'Ver más autos', volver_arriba: 'Volver arriba', deslizar: 'Desliza para ver los demás autos', compartir_comparacion: 'Compartir comparación por WhatsApp',
    quiero_opcion: 'Quiero esta opción', mostrando_autos: 'Mostrando {n} de {total}',
    fin_ayuda: 'Toca una financiera para ver sus condiciones.', fin_volver: 'Ver ofertas generales', fin_info: 'Más información',
    fin_tasa: 'Tasa anual', fin_apertura: 'Comisión por apertura', fin_seguro: 'Seguro mensual', fin_enganche: 'Enganche desde', fin_plazos: 'Plazos',
    fin_leyenda: 'Condiciones de referencia, sujetas a aprobación de crédito de cada institución.'
  };
  // Mensajes que se envían al pedir una cotización o una preautorización (editables en el CMS).
  const MENSAJES = {
    auto: 'Hola, me interesa cotizar el {auto}{anio} (precio desde {precio}). {detalle} ¿Me pueden apoyar?',
    opcion: 'Hola, quiero esta opción: {auto}{anio} (precio {precio}). {detalle} ¿Me pueden apoyar?',
    marca: 'Hola, busco un {marca}. ¿Me pueden ayudar a cotizarlo?',
    compartir: 'Mira esta comparación de autos en Auto-Opciones:',
    credito: 'Hola, quiero iniciar mi preautorización de crédito. Perfil: {perfil}. Documentos listos: {listos}. {faltan}'
  };
  const llenar = (tpl, v) => String(tpl).replace(/\{(\w+)\}/g, (_, k) => v[k] != null ? v[k] : '').replace(/\s+([.,?!])/g, '$1').replace(/\s{2,}/g, ' ').trim();
  const norm = x => String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const compacto = x => norm(x).replace(/[^a-z0-9]/g, '');  // sin espacios ni guiones: "xtrail" encuentra "X-Trail"
  const slug = x => norm(x).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  const soloDigitos = x => String(x || '').replace(/\D/g, '');
  const numMx = x => { const d = soloDigitos(x); return d.length === 10 ? '52' + d : d; };
  // En celular el WhatsApp se abre directo; en computadora o tablet se ofrece un recuadro con varias vías de contacto.
  const esCel = () => { try { return /iPhone|iPod|Android.+Mobile|Windows Phone/i.test(navigator.userAgent) || (window.matchMedia('(pointer:coarse)').matches && Math.min(screen.width, screen.height) < 600); } catch (e) { return false; } };
  const telHref = x => { const n = numMx(x); return n ? 'tel:+' + n : ''; };

  // Analítica (opcional): solo se carga si se llena en el CMS.
  function track(evento, props) {
    try {
      if (window.plausible) window.plausible(evento, { props: props || {} });
      if (window.gtag) window.gtag('event', evento === 'lead' ? 'generate_lead' : evento, props || {});
    } catch (e) {}
    enUmami(u => u.track(evento, props || {}));
  }
  // Umami se maneja a mano (data-auto-track="false") porque el portal usa rutas con "#": cada vista se manda con una ruta propia.
  let umamiCola = [], ultimaVista = '';
  function enUmami(fn) {
    try {
      if (window.umami) fn(window.umami);
      else if (window.__aoUmami && umamiCola.length < 50) umamiCola.push(fn);
    } catch (e) {}
  }
  function rutaVirtual() {
    const p = (location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean).map(x => { try { return decodeURIComponent(x); } catch (e) { return x; } });
    if (p[0] === 'requisitos') return { url: '/requisitos' + (p[1] ? '/' + p[1] : ''), titulo: 'Requisitos de crédito' };
    if (p[0] === 'auto' && p[1]) { const a = D.autos.find(x => x.id === p[1]); return { url: '/auto/' + p[1], titulo: a ? [a.marca, a.modelo].join(' ') : 'Ficha de auto' }; }
    if (p[0] === 'noticia' && p[1]) return { url: '/noticia/' + p[1], titulo: 'Noticia' };
    if (p[0] === 'comparar') return { url: '/comparar', titulo: 'Comparador' };
    return { url: '/', titulo: 'Inicio' };
  }
  function registrarVista() {
    try {
      const r = rutaVirtual(), base = location.pathname.replace(/\/index\.html$/, '').replace(/\/$/, ''), url = base + r.url;
      if (url === ultimaVista) return;
      ultimaVista = url;
      enUmami(u => u.track(props => ({ ...props, url, title: 'Auto-Opciones · ' + r.titulo })));
    } catch (e) {}
  }
  function clicsDeContacto(e) {
    const a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const h = a.getAttribute('href') || '';
    if (/^https:\/\/wa\.me\//.test(h)) track('whatsapp', { origen: a.closest('aside[aria-label="WhatsApp"]') ? 'flotante' : a.closest('footer') ? 'pie' : 'pagina' });
    else if (/^tel:/.test(h)) track('llamada');
    else if (/^mailto:/.test(h)) track('correo');
  }
  function cargarAnalitica(an) {
    an = an || {};
    const add = (src, attrs) => { const s = document.createElement('script'); s.src = src; s.async = true; Object.keys(attrs || {}).forEach(k => s.setAttribute(k, attrs[k])); document.head.appendChild(s); return s; };
    if (/^[a-z0-9.-]+$/i.test(an.plausible_dominio || '') && !window.plausible) {
      window.plausible = function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
      add('https://plausible.io/js/script.js', { defer: '', 'data-domain': an.plausible_dominio });
    }
    if (/^G-[A-Z0-9]+$/i.test(an.ga4_id || '') && !window.gtag) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date()); window.gtag('config', an.ga4_id);
      add('https://www.googletagmanager.com/gtag/js?id=' + an.ga4_id);
    }
    const umamiId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(an.umami_id || '') ? an.umami_id : '';
    if (umamiId && !window.__aoUmami) {
      window.__aoUmami = true;
      const dom = /^[a-z0-9.,-]+$/i.test(an.umami_dominios || '') && an.umami_dominios ? an.umami_dominios : 'auto-opciones.com,www.auto-opciones.com';
      const s = add('https://cloud.umami.is/script.js', { defer: '', 'data-website-id': umamiId, 'data-auto-track': 'false', 'data-domains': dom, 'data-do-not-track': 'true' });
      s.onload = () => { umamiCola.splice(0).forEach(enUmami); };
      window.addEventListener('hashchange', registrarVista); window.addEventListener('popstate', registrarVista);
      registrarVista();
    }
    if (/^[A-Za-z0-9]{16,64}$/.test(an.cloudflare_token || '')) add('https://static.cloudflareinsights.com/beacon.min.js', { type: 'module', 'data-cf-beacon': JSON.stringify({ token: an.cloudflare_token }) });
    if ((umamiId || window.plausible || window.gtag) && !window.__aoClics) { window.__aoClics = true; document.addEventListener('click', clicsDeContacto, true); }
  }
  function ponerMeta(sel, attr, val) { const el = document.querySelector(sel); if (el && val) el.setAttribute(attr, val); }
  // Datos estructurados (schema.org) para que los buscadores entiendan la organización y los autos.
  function datosEstructurados() {
    try {
      const sd = D.sitio, ct = sd.contacto || {}, abs = u => { try { return new URL(u, location.href).href; } catch (e) { return undefined; } };
      const org = { '@type': 'Organization', name: 'Auto-Opciones', url: location.origin + location.pathname, logo: sd.logo ? abs(sd.logo) : undefined };
      const contactPoint = { '@type': 'ContactPoint', contactType: 'customer service', areaServed: 'MX', availableLanguage: 'es', telephone: telHref(ct.telefono).replace(/^tel:/, '') || undefined, email: lst(ct.correos)[0] || undefined };
      if (contactPoint.telephone || contactPoint.email) org.contactPoint = contactPoint;
      const sameAs = lst(ct.redes).filter(v => /^https?:\/\//i.test(v)); if (sameAs.length) org.sameAs = sameAs;
      const autos = D.autos.filter(a => a.mostrar !== false && a.precio);
      const lista = { '@type': 'ItemList', itemListElement: autos.map((a, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Car', name: [a.marca, a.modelo, a.version].filter(Boolean).join(' '), brand: { '@type': 'Brand', name: a.marca }, model: a.modelo, vehicleConfiguration: a.version || undefined, bodyType: a.tipo || undefined, vehicleModelDate: a.anio ? String(a.anio) : undefined, image: a.foto ? abs(a.foto) : undefined, offers: { '@type': 'Offer', price: a.precio, priceCurrency: 'MXN', itemCondition: 'https://schema.org/NewCondition' } } })) };
      let el = document.getElementById('ao-jsonld');
      if (!el) { el = document.createElement('script'); el.type = 'application/ld+json'; el.id = 'ao-jsonld'; document.head.appendChild(el); }
      el.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': [org, lista] });
    } catch (e) {}
  }
  function prepararPagina() {
    const sd = D.sitio;
    if (sd.descripcion) { ponerMeta('meta[name="description"]', 'content', sd.descripcion); ponerMeta('meta[property="og:description"]', 'content', sd.descripcion); }
    if (sd.titulo_pagina) ponerMeta('meta[property="og:title"]', 'content', sd.titulo_pagina);
    cargarAnalitica(sd.analitica);
    datosEstructurados();
  }

  // Dirección de cada vista (#/requisitos, #/auto/rav4) para poder compartirla y usar el botón Atrás.
  const hashDe = st => st.page === 'noticia' ? '#/noticia/' + encodeURIComponent(st.nid || '') : st.page === 'req' ? '#/requisitos' + (st.req ? '/' + encodeURIComponent(st.req) : '') : (st.ficha ? '#/auto/' + encodeURIComponent(st.ficha) : '#/');
  const estadoDeHash = () => {
    const p = (location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean).map(x => { try { return decodeURIComponent(x); } catch (e) { return x; } });
    if (p[0] === 'requisitos') return { page: 'req', req: p[1] || null, ficha: null, menu: false };
    if (p[0] === 'comparar' && p[1]) {
      const e = { page: 'inicio', ficha: null, menu: false, cmp: [0, 1, 2].map(i => p[1].split(',')[i] || null), irCmp: true };
      // Ajustes del enlace compartido (opcionales; los enlaces anteriores solo traen los autos).
      const eng = parseInt(p[2], 10), plazo = parseInt(p[3], 10);
      if (isFinite(eng) && eng >= 0 && eng <= 100) e.eng = eng;
      if (isFinite(plazo) && plazo > 0 && plazo <= 120) e.plazo = plazo;
      if (p[4] === '1' || p[4] === '0') e.seg = p[4] === '1';
      if (p[5]) e.fin = [0, 1, 2].map(i => (p[5].split(',')[i] || '').trim()).map(v => v && v !== '_' ? v : undefined);
      if (p[6]) e.segMonto = [0, 1, 2].map(i => String((p[6].split(',')[i] || '')).replace(/[^0-9]/g, '').replace(/^0+$/, '').slice(0, 6));
      if (p[7]) e.pago = p[7];
      return e;
    }
    if (p[0] === 'auto' && p[1]) return { page: 'inicio', ficha: p[1], menu: false };
    if (p[0] === 'noticia' && p[1]) return { page: 'noticia', nid: p[1], ficha: null, menu: false };
    return { page: 'inicio', ficha: null, menu: false };
  };
  // Permite activar con Enter o Espacio los elementos que funcionan como botón pero no son <button>.
  if (!window.__aoTeclado) {
    window.__aoTeclado = true;
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && window.__aoEsc) window.__aoEsc();
      const el = e.target;
      if ((e.key === 'Enter' || e.key === ' ') && el && el.getAttribute && /^(button|checkbox|link)$/.test(el.getAttribute('role') || '') && el.tagName !== 'BUTTON') { e.preventDefault(); el.click(); }
    });
  }

  // La lista de documentos marcados se recuerda en este navegador (si el navegador lo permite).
  const LS_CHECKS = 'ao_checks_v1';
  const leerChecks = () => { try { const j = JSON.parse(localStorage.getItem(LS_CHECKS) || '{}'); return j && typeof j === 'object' && !Array.isArray(j) ? j : {}; } catch (e) { return {}; } };
  const guardarChecks = c => { try { localStorage.setItem(LS_CHECKS, JSON.stringify(c)); } catch (e) {} };

  function initState() {
    return { page: 'inicio', nid: null, pago: null, menu: false, marca: null, tipo: '*', pres: '', ficha: null, cmp: null, fin: [], slotMarca: [null, null, null], eng: null, plazo: null, seg: null, leadModal: null, copiado: false, segMonto: ['', '', ''], req: null, checks: leerChecks(), q: '', orden: '', mmax: '', nVer: 0, finVer: null, cmpPos: 0, w: 1280 };
  }

  function vals(c) {
    subs.add(c);
    if (!listo) return {};
    const st = c.state || {};
    const set = p => {
      c.setState(p);
      if ('checks' in p) guardarChecks(p.checks);
      if ('page' in p || 'req' in p || 'ficha' in p || 'nid' in p) {
        try { const h = hashDe({ ...c.state, ...p }); if (h !== (location.hash || '#/')) { history.pushState(null, '', h); registrarVista(); } } catch (e) {}
      }
    };
    if (!c._hashOn) {
      c._hashOn = true;
      const aplicar = () => { const e = estadoDeHash(); const ir = e.irCmp; delete e.irCmp; if (e.page !== (c.state || {}).page) window.scrollTo(0, 0); c.setState(e); if (ir) scrollA('comparador'); };
      window.addEventListener('popstate', aplicar); window.addEventListener('hashchange', aplicar);
      if (location.hash && location.hash !== '#/') setTimeout(aplicar, 0);
    }
    if (!c._rootRef) {
      c._rootRef = el => {
        if (!el || c._roEl === el) return;
        c._roEl = el; c._ro && c._ro.disconnect();
        c._ro = new ResizeObserver(e => { const w = e[0].contentRect.width; if (Math.abs(w - (c.state.w || 0)) > 4) c.setState({ w }); });
        c._ro.observe(el);
      };
    }
    const S0 = D.sitio, cal = S0.calculo || {}, fil = S0.filtros || {}, ct = S0.contacto || {}, rq = S0.requisitos || {};
    const W = st.w || 1280;
    const { S, pubs } = secciones();
    const FICHA = lst(S0.ficha).length ? S0.ficha : FICHA_BASE;
    const specs = a => FICHA.filter(f => a[f.campo] !== undefined && a[f.campo] !== '').map(f => { const raw = a[f.campo], v = raw + (f.unidad ? ' ' + f.unidad : ''); return { k: f.etiqueta, v, v2: !f.unidad && /^\d+([.,]\d+)?$/.test(String(raw)) ? raw + ' ' + String(f.etiqueta).toLowerCase() : v }; });
    const AUTOS = D.autos.filter(a => a.mostrar !== false);
    // Las marcas se ordenan alfabéticamente (sin distinguir mayúsculas ni acentos), sin importar el orden en que estén en marcas.json.
    const MARCAS = D.marcas.filter(m => m.mostrar !== false).sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es', { sensitivity: 'base' }));
    const FIN = D.financieras.filter(f => f.mostrar !== false);
    const ENG = lst(cal.enganches).map(Number).filter(isFinite); if (!ENG.length) ENG.push(10, 20, 30, 40);
    const PLAZO = lst(cal.plazos).map(Number).filter(isFinite); if (!PLAZO.length) PLAZO.push(12, 24, 36, 48, 60);
    const MMAX_OPTS = lst(fil.pagos_mensuales).map(Number).filter(n => n > 0).map(n => ({ v: String(n), t: 'Hasta ' + mxn(n) + '/mes' }));
    const PAGOS = lst(fil.pagos);
    const pagoSel = st.pago != null && PAGOS.includes(st.pago) ? st.pago : (PAGOS[0] || '');
    const esContado = /contado/.test(norm(pagoSel)), esArrend = /arrend/.test(norm(pagoSel));
    const eng = st.eng != null ? st.eng : (+cal.enganche_inicial || ENG[0]);
    const plazo = st.plazo != null ? st.plazo : (+cal.plazo_inicial || PLAZO[PLAZO.length - 1]);
    const finTarjeta = { tasa: +cal.tasa_tarjetas || (FIN[0] && FIN[0].tasa) || 14, apertura: 0, seguro: 0 };
    // Seguro del primer año: % del precio de lista (o el monto propio del auto), financiado dentro del crédito. Solo con financiamiento y si la fórmula usa seguro_anual.
    const segPct = +cal.seguro_porcentaje || 0;
    formula();
    const fVigente = fnAct !== fnBase && cal.formula ? cal.formula : FORMULA_BASE;
    const haySeguro = segPct > 0 && /seguro_anual/.test(fVigente) && !esContado && !esArrend;
    const segOn = haySeguro && (st.seg != null ? !!st.seg : cal.seguro_incluir_inicial !== false);
    const segDe = a => segOn ? (+a.seguro_anual > 0 ? +a.seguro_anual : Math.round(a.precio * segPct / 100)) : 0;
    const segTxt = segOn ? ' Incluye un seguro del primer año estimado.' : '';
    const PRES = lst(fil.presupuestos);
    const pr = st.pres !== '' && st.pres != null ? PRES[+st.pres] : null;
    const cnt = m => new Set(AUTOS.filter(a => a.marca === m).map(a => norm(a.modelo))).size;  // modelos distintos (no versiones)
    const Q = norm(st.q || '').split(/\s+/).filter(Boolean), MMAX = +st.mmax || 0;
    const mens = a => mensualidad(a.precio, eng, finTarjeta, plazo, segDe(a));
    const lista0 = AUTOS.filter(a => (!st.marca || a.marca === st.marca) && (st.tipo === '*' || a.tipo === st.tipo) &&
      (!pr || ((!pr.min || a.precio >= +pr.min) && (!pr.max || a.precio <= +pr.max))) &&
      (!Q.length || Q.every(t => { const h = [a.marca, a.modelo, a.version, a.tipo].join(' '); return norm(h).includes(t) || (compacto(t) !== '' && compacto(h).includes(compacto(t))); })) &&
      (!MMAX || esContado || mens(a) <= MMAX));
    const ordenSel = ['precio_asc', 'precio_desc', 'mensual'].includes(st.orden) ? st.orden : '';
    const lista = ordenSel === 'precio_asc' ? [...lista0].sort((x, y) => x.precio - y.precio) : ordenSel === 'precio_desc' ? [...lista0].sort((x, y) => y.precio - x.precio) : ordenSel === 'mensual' ? [...lista0].sort((x, y) => mens(x) - mens(y)) : lista0;
    // Lista de autos: se muestran unos pocos al inicio y "Ver más" agrega de N en N, en la misma página.
    // Cualquier cambio de filtro, búsqueda u orden reinicia el conteo a la cantidad inicial (ver setFiltro).
    const AUTOS_INICIALES = Math.max(1, Math.floor(+S.autos.autos_iniciales) || 4);
    const AUTOS_POR_VEZ = Math.max(1, Math.floor(+S.autos.autos_por_pagina) || 10);
    const setFiltro = p => set({ ...p, nVer: 0 });
    // Si se abre una ficha por enlace (#/auto/<id>), la lista debe incluir ese auto aunque quede después de los primeros.
    const iFicha = st.ficha ? lista.findIndex(a => a.id === st.ficha) : -1;
    const visibles = Math.min(Math.max(st.nVer || 0, AUTOS_INICIALES, iFicha + 1), lista.length);
    const hayMas = lista.length > visibles;
    const byId = id => AUTOS.find(a => a.id === id);
    const cmp = (st.cmp || [AUTOS[0] && AUTOS[0].id, AUTOS[1] && AUTOS[1].id, null]).map(x => (x && byId(x)) ? x : null);
    const nCmp = cmp.filter(Boolean).length;
    const toggleCmp = id => { const a = cmp.slice(); const i = a.indexOf(id); if (i >= 0) a[i] = null; else { const j = a.indexOf(null); if (j < 0) return; a[j] = id; } set({ cmp: a }); };
    const scrollA = id => setTimeout(() => { const el = document.getElementById('sec-' + id); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }, 60);
    const ir = d => {
      d = String(d || '');
      if (/^(https?:|mailto:|tel:)/.test(d)) { window.open(d, /^https?:/.test(d) ? '_blank' : '_self'); return; }
      if (d === 'pagina:requisitos') { set({ page: 'req', menu: false }); window.scrollTo(0, 0); return; }
      set({ page: 'inicio', menu: false });
      if (d.indexOf('seccion:') === 0) scrollA(d.slice(8)); else window.scrollTo(0, 0);
    };

    window.__aoEsc = () => { if (st.leadModal) set({ leadModal: null }); else if (st.menu) set({ menu: false }); else if (st.ficha) set({ ficha: null, nVer: visibles }); };
    const T = { ...TEXTOS, ...Object.fromEntries(Object.entries(S0.textos || {}).filter(([, v]) => typeof v === 'string' && v !== '')) };
    const MSG = { ...MENSAJES, ...Object.fromEntries(Object.entries({ auto: ct.mensaje_auto, opcion: ct.mensaje_opcion, marca: ct.mensaje_marca, credito: ct.mensaje_credito, compartir: ct.mensaje_compartir }).filter(([, v]) => v)) };
    const waNum = numMx(ct.whatsapp), correo1 = lst(ct.correos)[0];
    const lead = (tipo, texto) => {
      track('lead', { tipo });
      if (!esCel() && (waNum || correo1)) { set({ leadModal: { texto, tipo }, copiado: false }); return; }
      if (waNum) window.open('https://wa.me/' + waNum + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
      else if (correo1) window.location.href = 'mailto:' + para + '?subject=' + encodeURIComponent('Solicitud desde el portal Auto-Opciones') + '&body=' + encodeURIComponent(texto);
      else if (telHref(ct.telefono)) window.location.href = telHref(ct.telefono);
    };
    const marcaTxt = st.marca || 'auto';

    // Simulación de crédito imprimible (una hoja por auto), con el plan que la persona tiene elegido.
    const SIM_LEGAL = 'Esta simulación es informativa y no constituye una oferta, cotización oficial ni compromiso de crédito de Auto-Opciones ni de institución financiera alguna. Las cifras se calcularon con una tasa de referencia y pueden variar según la institución, tu perfil y la fecha de contratación. El crédito está sujeto a aprobación de la institución financiera. El seguro del primer año es una estimación y se suma al monto financiado; el costo real depende de la aseguradora y del paquete elegido. El pago inicial incluye el enganche y la comisión por apertura, y no incluye placas, trámites ni accesorios. Precios, versiones y disponibilidad sujetos a cambio sin previo aviso. Las imágenes son ilustrativas.';
    const hayCotiz = !esContado && !esArrend;
    const simular = (a, f, nombreFin, segUnico) => () => {
      const esc = x => String(x == null ? '' : x).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      const abs = u => { try { return new URL(u, location.href).href; } catch (e) { return ''; } };
      const engM = a.precio * eng / 100, monto = a.precio - engM, segFin = segDe(a), tasa = +f.tasa || 0, aperPct = +f.apertura || 0, aperM = monto * aperPct / 100;
      const pagoIni = Math.round(engM) + Math.round(aperM) + (segUnico || 0), mens = mensualidad(a.precio, eng, f, plazo, segFin);
      const hoy = new Date(), yy = String(hoy.getFullYear()).slice(2) + String(hoy.getMonth() + 1).padStart(2, '0') + String(hoy.getDate()).padStart(2, '0');
      let h = 0; [a.id, eng, plazo, nombreFin, segOn ? 1 : 0].join('|').split('').forEach(ch => { h = (h * 31 + ch.charCodeAt(0)) >>> 0; });
      const folio = 'AO-' + yy + '-' + h.toString(36).toUpperCase().padStart(4, '0').slice(-4);
      const fecha = hoy.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
      const m2 = n => '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const fila = (k, v) => '<div><span>' + esc(k) + '</span><b>' + esc(v) + '</b></div>';
      const d10 = soloDigitos(ct.whatsapp || '').replace(/^52(?=\d{10}$)/, ''), wa = d10.length === 10 ? d10.slice(0, 2) + ' ' + d10.slice(2, 6) + ' ' + d10.slice(6) : (ct.whatsapp || ''), mail = correo1 || '', web = location.host;
      const autoFilas = [fila('Marca', a.marca), fila('Modelo', a.modelo), a.version ? fila('Versión', a.version) : '', a.anio ? fila('Año modelo', a.anio) : '', a.trans ? fila('Transmisión', a.trans) : '', a.traccion ? fila('Tracción', a.traccion) : '', fila('Precio de lista', mxn(a.precio)), a.vigencia ? fila('Precio vigente', a.vigencia) : ''].join('');
      const html = '<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Simulación ' + esc(folio) + ' · ' + esc(a.marca + ' ' + a.modelo) + '</title><style>@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;background:#e9ecf1;font-family:Archivo,system-ui,sans-serif;color:#1F3466;-webkit-print-color-adjust:exact;print-color-adjust:exact}'
        + '.barra{position:sticky;top:0;background:#1F3466;color:#fff;padding:10px 16px;display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:14px}.barra button{font:inherit;font-weight:600;border:0;border-radius:12px;padding:9px 16px;background:#EE8A52;color:#fff;cursor:pointer}'
        + '.hoja{width:794px;max-width:100%;min-height:1123px;background:#fff;margin:16px auto;padding:44px 48px;display:flex;flex-direction:column;gap:18px}'
        + '.top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1F3466;padding-bottom:14px;gap:12px}.top img{width:210px;max-width:45%;height:auto}.tit{text-align:right}.tit h1{margin:0;font-size:24px;font-weight:600}.tit p{margin:2px 0 0;font-size:12px;color:#56607A}'
        + '.badge{display:inline-block;background:#FEF3EB;color:#9C4A1E;font-weight:600;font-size:11px;padding:3px 9px;border-radius:10px;margin-top:6px}.sec{border:1px solid rgba(31,52,102,.15);border-radius:14px;overflow:hidden}'
        + '.sec h2{margin:0;background:#1F3466;color:#fff;font-size:13px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;padding:8px 14px}.auto{display:grid;grid-template-columns:300px 1fr}.ph{background:#F7F3EF;min-height:210px;position:relative}.ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}'
        + '.il{position:absolute;right:8px;bottom:6px;font-size:10px;color:#56607A;background:rgba(255,255,255,.9);padding:2px 7px;border-radius:8px}.kv{padding:6px 14px}.kv div{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid rgba(31,52,102,.08);font-size:13.5px}.kv div:last-child{border:0}.kv span{color:#56607A}.kv b{font-weight:600;text-align:right}'
        + '.big{background:#FBF9F7;padding:14px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(31,52,102,.1);gap:12px}.big small{display:block;font-size:12px;color:#56607A}.big strong{font-size:34px;font-weight:600;color:#9C4A1E}.cols{display:grid;grid-template-columns:1fr 1fr}'
        + '.contacto{padding:12px 14px;font-size:13.5px;line-height:1.55}.legal{font-size:9.6px;line-height:1.5;color:#56607A;margin-top:auto}.pie{display:flex;justify-content:space-between;font-size:10.5px;color:#56607A;border-top:1px solid rgba(31,52,102,.15);padding-top:8px;gap:12px}'
        + '@media (max-width:700px){.auto,.cols{grid-template-columns:1fr}.hoja{padding:24px 18px}}@media print{body{background:#fff}.barra{display:none}.hoja{margin:0;width:794px;min-height:1123px;padding:44px 48px}.auto{grid-template-columns:300px 1fr}.cols{grid-template-columns:1fr 1fr}}</style></head><body>'
        + '<div class="barra"><span>Simulación lista. Elige «Guardar como PDF» en el cuadro de impresión.</span><button onclick="window.print()">Imprimir o guardar PDF</button></div>'
        + '<div class="hoja"><div class="top"><img src="' + esc(abs(S0.logo || 'AutoOpciones_Logo/02_solo-texto/AutoOpciones_02_solo-texto.svg')) + '" alt="Auto-Opciones"><div class="tit"><h1>Simulación de crédito</h1><p>Folio ' + esc(folio) + '</p><p>Fecha: ' + esc(fecha) + '</p><span class="badge">Cifras estimadas · No es una oferta oficial</span></div></div>'
        + '<div class="sec"><h2>Datos del auto</h2><div class="auto"><div class="ph">' + (a.foto ? '<img src="' + esc(abs(a.foto)) + '" alt=""><span class="il">Imagen ilustrativa</span>' : '') + '</div><div class="kv">' + autoFilas + '</div></div></div>'
        + '<div class="sec"><h2>Plan simulado</h2><div class="cols"><div class="kv">' + fila('Institución de referencia', nombreFin) + fila('Enganche (' + eng + '%)', mxn(engM)) + fila('Monto a financiar', mxn(monto + segFin)) + fila('Seguro 1.er año (estimado, financiado)', segOn ? mxn(segFin) : 'No incluido') + '</div>'
        + '<div class="kv">' + fila('Plazo', plazo + ' meses') + fila('Tasa anual de referencia', tasa + '%') + fila('Comisión por apertura (' + aperPct + '%)', mxn(aperM)) + fila('Pago inicial estimado', mxn(pagoIni)) + '</div></div>'
        + '<div class="big"><div><small>Pago mensual estimado</small><strong>' + m2(mens) + '</strong></div><div style="text-align:right"><small>durante ' + plazo + ' meses</small><small>Total de pagos: ' + mxn(mens * plazo) + '</small></div></div></div>'
        + '<div class="sec"><h2>¿Te interesa? Contáctanos</h2><div class="contacto">' + (wa ? 'WhatsApp <b>' + esc(wa) + '</b><br>' : '') + (mail ? 'Correo: <b>' + esc(mail) + '</b> · ' : '') + esc(web) + '<br><span style="color:#56607A">Menciona el folio <b style="color:#1F3466">' + esc(folio) + '</b> para darte seguimiento más rápido.</span></div></div>'
        + '<div class="legal"><b>Aviso importante.</b> ' + esc(SIM_LEGAL) + '</div><div class="pie"><span>Auto-Opciones · Monterrey, MX</span><span>Simulación generada en ' + esc(web) + ' · Folio ' + esc(folio) + '</span></div></div>'
        + '<script>window.addEventListener("load",function(){if(!/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent))setTimeout(function(){window.print()},600)})<\/script></body></html>';
      track('simulacion', { auto: a.id, institucion: nombreFin });
      try { const url = URL.createObjectURL(new Blob([html], { type: 'text/html' })); window.open(url, '_blank'); } catch (e) {}
    };
    // Fondo de color por versión: cada versión de un mismo modelo y año recibe un fondo distinto (por precio, estable),
    // entre los que contrastan con el color de la foto.
    const fondoDe = {};
    const grupos = {};
    AUTOS.forEach(a => { (grupos[a.marca + '|' + a.modelo + '|' + (a.anio || '')] = grupos[a.marca + '|' + a.modelo + '|' + (a.anio || '')] || []).push(a); });
    Object.values(grupos).forEach(g => {
      const ord = [...g].sort((x, y) => x.precio - y.precio || String(x.id).localeCompare(String(y.id)));
      const l = LUM[(g[0].foto || '')];
      const ok = l === undefined ? FONDOS.slice(0, 4) : FONDOS.filter(f => Math.abs(f[1] - l) > 60);
      const pal0 = ok.length ? ok : FONDOS.slice(0, 4);
      // Se elige primero el blanco (o el primero compatible) y después, cada vez, el color más distinto de los ya elegidos.
      const pal = [pal0[0]];
      while (pal.length < Math.min(ord.length, pal0.length)) {
        const rest = pal0.filter(p => !pal.includes(p));
        pal.push(rest.reduce((m, p) => Math.min(...pal.map(q => distCol(p[0], q[0]))) > Math.min(...pal.map(q => distCol(m[0], q[0]))) ? p : m));
      }
      ord.forEach((a, i) => { fondoDe[a.id] = pal[i % pal.length][0]; });
    });
    const autos = lista.slice(0, visibles).map(a => {
      const inC = cmp.includes(a.id);
      return { ...a, fondo: a.foto && fondoDe[a.id] ? fondoDe[a.id] : FONDO_RAYAS, enfoque: ENFOQUE[a.enfoque_foto] || 'center', foto: a.foto || '', precioF: mxn(a.precio), nombre: a.marca + ' ' + a.modelo,
        mensual: mxn(mensualidad(a.precio, eng, finTarjeta, plazo, segDe(a))), specs: specs(a),
        mensualTxt: esContado ? '' : esArrend ? T.renta_cotizar : mxn(mensualidad(a.precio, eng, finTarjeta, plazo, segDe(a))) + '/mes*', hayMensualTxt: !esContado,
        ficha: st.ficha === a.id, noFicha: st.ficha !== a.id, abrirFicha: () => set({ ficha: a.id }), cerrarFicha: () => set({ ficha: null, nVer: visibles }),
        inCmp: inC, notInCmp: !inC, cmpDisabled: !inC && nCmp >= 3,
        cmpLabel: inC ? T.en_comparador : (nCmp >= 3 ? T.comparador_lleno : T.comparar), toggleCmp: () => toggleCmp(a.id),
        hayAnio: !!a.anio, anioF: a.anio ? 'Modelo ' + a.anio : '', hayVig: !!a.vigencia, vigF: a.vigencia ? 'Precio vigente: ' + a.vigencia : '',
        hayCotiz, simular: simular(a, finTarjeta, 'Tasa de referencia', 0),
        cotizar: () => lead('auto', llenar(MSG.auto, { auto: [a.marca, a.modelo, a.version].filter(Boolean).join(' '), anio: a.anio ? ' ' + a.anio : '', precio: mxn(a.precio), enganche: eng + '%', plazo: plazo + ' meses', pago: pagoSel, detalle: esContado ? 'Me interesa comprarlo de contado.' : esArrend ? 'Me interesa la opción de arrendamiento.' : 'Con enganche de ' + eng + '% a ' + plazo + ' meses, la mensualidad estimada es ' + mxn(mensualidad(a.precio, eng, finTarjeta, plazo, segDe(a))) + ' al mes.' + segTxt, mensualidad: mxn(mensualidad(a.precio, eng, finTarjeta, plazo, segDe(a))) + ' al mes' })) };
    });

    const marcasConAutos = MARCAS.filter(m => cnt(m.nombre) > 0);
    const slots = cmp.map((id, i) => {
      const a = id && byId(id);
      if (!a) {
        const sm = st.slotMarca[i];
        return { n: i + 1, filled: false, empty: true, marcaSel: sm || '', marcas: marcasConAutos.map(m => ({ m: m.nombre })),
          modelos: AUTOS.filter(x => x.marca === sm && !cmp.includes(x.id)).map(x => ({ id: x.id, label: x.modelo + ' ' + x.version })),
          hasMarca: !!sm,
          onMarca: e => { const s = st.slotMarca.slice(); s[i] = e.target.value || null; set({ slotMarca: s }); },
          onModelo: e => { const v = e.target.value; if (!v) return; const cc = cmp.slice(); cc[i] = v; set({ cmp: cc }); } };
      }
      const f = FIN.find(x => x.id === st.fin[i]) || FIN[0] || finTarjeta;
      const engM = a.precio * eng / 100, monto = a.precio - engM;
      const segFin = segDe(a), segAparte = haySeguro && !segOn, segUnico = segAparte ? Math.min(500000, parseInt(st.segMonto[i], 10) || 0) : 0;
      const aperturaM = monto * (+f.apertura || 0) / 100;
      const pagoIni = Math.round(engM) + Math.round(aperturaM) + segUnico;
      return { n: i + 1, filled: true, empty: false, id: a.id, fondo: a.foto && fondoDe[a.id] ? fondoDe[a.id] : FONDO_RAYAS, enfoque: ENFOQUE[a.enfoque_foto] || 'center', foto: a.foto || '', marca: a.marca, modelo: a.modelo, version: a.version, nombre: a.marca + ' ' + a.modelo,
        precioF: mxn(a.precio), engF: mxn(engM), montoF: mxn(monto + segFin),
        incluyeSeg: segOn, segFinF: mxn(segFin), pideSeg: segAparte, segVal: segUnico ? String(segUnico) : '', onSegMonto: e => { const v = String(e.target.value).replace(/[^0-9]/g, '').slice(0, 6); const m = st.segMonto.slice(); m[i] = v; set({ segMonto: m }); },
        pagoIniF: mxn(pagoIni),
        aperturaF: mxn(aperturaM), tasaF: (+f.tasa || 0).toFixed(1) + '% anual',
        mensualF: mxn(mensualidad(a.precio, eng, f, plazo, segDe(a))), finId: f.id || '', finNombre: f.nombre || '',
        fins: FIN.map(x => ({ id: x.id, nombre: x.nombre })), specs: specs(a),
        onFin: e => { const fin = st.fin.slice(); fin[i] = e.target.value; set({ fin }); },
        hayCotiz, simular: simular(a, f, f.nombre || 'Tasa de referencia', segUnico),
        quiero: () => lead('opcion', llenar(MSG.opcion, { auto: [a.marca, a.modelo, a.version].filter(Boolean).join(' '), anio: a.anio ? ' ' + a.anio : '', precio: mxn(a.precio), financiera: esContado || esArrend ? '' : (f.nombre || ''), enganche: eng + '%', plazo: plazo + ' meses', mensualidad: mxn(mensualidad(a.precio, eng, f, plazo, segDe(a))) + ' al mes',
          detalle: esContado ? 'Me interesa comprarlo de contado.' : esArrend ? 'Me interesa la opción de arrendamiento.' : 'Con ' + (f.nombre ? f.nombre + ', ' : '') + 'enganche de ' + eng + '% a ' + plazo + ' meses, la mensualidad estimada es ' + mxn(mensualidad(a.precio, eng, f, plazo, segDe(a))) + ' al mes.' + segTxt + ' Pago inicial estimado: ' + mxn(pagoIni) + ' (enganche, comisión por apertura' + (segUnico ? ' y seguro' : '') + ').' })),
        quitar: () => { const cc = cmp.slice(); cc[i] = null; const m = st.segMonto.slice(); m[i] = ''; set({ cmp: cc, segMonto: m }); } };
    });
    const compartirCmp = () => {
      const f = slots.filter(s => s.filled);
      if (!f.length) return;
      // Además de los autos, el enlace conserva enganche, plazo, seguro, financieras, montos de seguro y forma de pago.
      const ajustes = [eng, plazo, segOn ? 1 : 0, f.map(s => encodeURIComponent(s.finId || '_')).join(','), f.map(s => s.segVal || '0').join(','), encodeURIComponent(pagoSel)].join('/');
      const url = location.origin + location.pathname + '#/comparar/' + f.map(s => encodeURIComponent(s.id)).join(',') + '/' + ajustes;
      const lineas = f.map(s => '• ' + [s.nombre, s.version].filter(Boolean).join(' ') + ' · ' + s.precioF + (esContado ? '' : ' · ' + s.mensualF + '/mes*'));
      const pie = esContado ? '' : '\n* ' + T.leyenda_mensualidad + ' (' + eng + '% de enganche, ' + plazo + ' meses' + (segOn ? ', con seguro del primer año estimado' : '') + ')';
      track('compartir', { autos: f.length });
      const texto = MSG.compartir + '\n' + lineas.join('\n') + pie + '\n' + url;
      // Celular: WhatsApp directo. Computadora o tablet: recuadro con varias vías para compartir.
      if (esCel()) window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank', 'noopener');
      else set({ leadModal: { texto, tipo: 'compartir', compartir: true }, copiado: false });
    };
    const pagos = slots.filter(s => s.filled).map(s => +s.mensualF.replace(/[^0-9]/g, ''));
    const maxP = Math.max(1, ...pagos), minP = Math.min(...pagos);
    slots.forEach(s => { if (s.filled) { const p = +s.mensualF.replace(/[^0-9]/g, ''); s.barPct = Math.round(p / maxP * 100) + '%'; s.masBaja = pagos.length > 1 && p === minP; } });

    // Financieras: al tocar una, el banner de ofertas muestra sus condiciones (solo los datos que tenga llenos).
    const num = v => (v === '' || v == null || !isFinite(+v) ? null : +v);
    const pct = n => String(Math.round(n * 100) / 100) + '%';
    const finSel = st.finVer ? FIN.find(x => x.id === st.finVer) : null;
    const finCards = !finSel ? [] : [
      num(finSel.tasa) !== null && { k: T.fin_tasa, v: pct(num(finSel.tasa)) },
      num(finSel.apertura) !== null && { k: T.fin_apertura, v: pct(num(finSel.apertura)) },
      num(finSel.seguro) > 0 && { k: T.fin_seguro, v: mxn(num(finSel.seguro)) + '/mes' },
      num(finSel.enganche_desde) !== null && { k: T.fin_enganche, v: pct(num(finSel.enganche_desde)) },
      String(finSel.plazos || '').trim() && { k: T.fin_plazos, v: String(finSel.plazos).trim() }
    ].filter(Boolean);
    const finEnlace = finSel && /^https?:\/\/\S+$/.test(finSel.enlace || '') ? finSel.enlace : '';
    const PER = D.perfiles;
    const req = PER.find(r => r.id === st.req) || PER[0] || { id: '-', titulo: '', para: '', documentos: [], condiciones: [] };
    const docs = lst(req.documentos), ck = st.checks[req.id] || {};
    const hechos = docs.filter(t => ck[t]).length, faltan = docs.filter(t => !ck[t]);
    const opt = (arr, cur, key, fmt) => arr.map(v => ({ label: fmt(v), active: v === cur, inactive: v !== cur, pick: () => set({ [key]: v }) }));
    const tipos = [{ label: fil.texto_todos || 'Todos', val: '*' }].concat(lst(fil.tipos).map(t => ({ label: t, val: t })));
    const pick = m => () => setFiltro({ marca: st.marca === m ? null : m, ficha: null });
    const reqPub = D.anuncios.find(a => a.ubicacion === 'requisitos' && a.mostrar !== false);
    const bm = S0.boton_menu || {};
    const NOTICIAS = D.noticias.filter(n => n.mostrar !== false).map(n => { const tieneTexto = !!String(n.contenido || '').trim(), tieneEnlace = /^(https?:|mailto:|tel:)/.test(n.enlace || ''); return { ...n, slug: slug(n.titulo), tieneTexto, tieneEnlace, clic: tieneTexto || tieneEnlace }; });
    const NOT = st.page === 'noticia' ? NOTICIAS.find(n => n.slug === st.nid && n.tieneTexto) : null;
    try { const base = S0.titulo_pagina || 'Auto-Opciones'; document.title = NOT ? NOT.titulo + ' | ' + base : base; ponerMeta('meta[name="description"]', 'content', NOT ? (NOT.resumen || S0.descripcion) : S0.descripcion); } catch (e) {}

    return {
      T, hayPagina: true,
      saltar: e => { if (e && e.preventDefault) e.preventDefault(); const m = document.getElementById('contenido'); if (m) { m.focus(); m.scrollIntoView(); } }, imprimir: () => window.print(), rootRef: c._rootRef,
      heroPadTop: W < 760 ? '180px' : 'clamp(12px,2cqi,24px)', cmpCols: W < 760 ? 'repeat(3,max(250px,78cqi))' : 'repeat(3,minmax(240px,1fr))', cmpMin: W < 760 ? '0' : '760px', waBottom: st.page === 'inicio' ? '88px' : '20px',
      q: st.q || '', onQ: e => setFiltro({ q: e.target.value }), ordenSel, onOrden: e => setFiltro({ orden: e.target.value }),
      ordenOpts: [['', T.orden_relevancia], ['precio_asc', T.orden_precio_asc], ['precio_desc', T.orden_precio_desc], ['mensual', T.orden_mensual]].map(([v, t]) => ({ v, t })),
      mmaxSel: MMAX ? String(MMAX) : '', onMmax: e => setFiltro({ mmax: e.target.value }), mmaxOpts: MMAX_OPTS, verMmax: MMAX_OPTS.length > 0 && !esContado,
      hayFiltros: !!(st.marca || st.tipo !== '*' || pr || Q.length || MMAX), limpiar: () => setFiltro({ marca: null, tipo: '*', pres: '', q: '', mmax: '', ficha: null }),
      pasos: lst(S.como_funciona.pasos).map((x, i) => ({ n: i + 1, t: x.titulo, d: x.texto })), preguntas: lst(S.faq.preguntas).map(x => ({ q: x.pregunta, a: x.respuesta })), narrow: W < 760, wide: W >= 760, navWide: W >= 1100, navNarrow: W < 1100,
      isInicio: st.page === 'inicio', isReq: st.page === 'req',
      goInicio: () => ir('pagina:inicio'), goReq: () => ir('pagina:requisitos'),
      menuOpen: !!st.menu, toggleMenu: () => set({ menu: !st.menu }),
      S, pubs, logo: S0.logo || 'AutoOpciones_Logo/02_solo-texto/AutoOpciones_02_solo-texto.svg',
      menu: lst(S0.menu).map(m => ({ texto: m.texto, ir: () => ir(m.enlace || m.destino) })),
      btnMenu: { texto: bm.texto || 'Solicitar crédito', ir: () => ir(bm.enlace || bm.destino || 'pagina:requisitos') },
      c: { telefono: ct.telefono || '', frase: ct.frase || '', horario: ct.horario || '', hayHorario: !!ct.horario, direccion: ct.direccion || '', hayDir: !!ct.direccion, telHref: telHref(ct.telefono), hayTel: !!telHref(ct.telefono), hayWa: !!waNum, waHref: waNum ? 'https://wa.me/' + waNum : '' },
      correos: lst(ct.correos).map(v => ({ v, href: 'mailto:' + v })), legales: lst(ct.legales).filter(l => l && l.texto && l.enlace).map(l => ({ texto: l.texto, enlace: l.enlace })), hayLegales: lst(ct.legales).some(l => l && l.texto && l.enlace),
      sinAutosTxt: llenar(T.sin_autos, { marca: marcaTxt }), cotizarMarca: () => lead('marca', llenar(MSG.marca, { marca: st.marca || 'auto' })),
      pedirCredito: () => lead('credito', llenar(MSG.credito, { perfil: req.titulo || req.pestana || '', listos: hechos + ' de ' + docs.length, faltan: faltan.length && faltan.length < docs.length ? 'Me faltan: ' + faltan.slice(0, 6).join('; ') + (faltan.length > 6 ? '; y otros' : '') + '.' : '' })),
      redes: lst(ct.redes).map(v => { const href = /^https?:\/\//i.test(v) ? v : /^www\./i.test(v) ? 'https://' + v : ''; return { v, href, hayHref: !!href, noHref: !href }; }),
      marcas: MARCAS.map(m => { const n = cnt(m.nombre); return { m: m.nombre, logo: m.logo || '', hasLogo: !!m.logo, noLogo: !m.logo, n, nLabel: n ? n + (n === 1 ? ' modelo' : ' modelos') : 'Bajo pedido', active: st.marca === m.nombre, inactive: st.marca !== m.nombre, pick: pick(m.nombre) }; }),
      totalMarcas: MARCAS.length,
      marcaActiva: st.marca || 'Todas las marcas',
      heroMarca: st.marca || '', onHeroMarca: e => setFiltro({ marca: e.target.value || null }),
      marcasSelect: MARCAS.map(m => ({ m: m.nombre })),
      heroFoto: S.banner.foto || '',
      fl: { presupuesto: fil.texto_presupuesto || 'Presupuesto', cualquiera: fil.texto_cualquiera || 'Cualquiera', pago: fil.texto_pago || 'Pago' },
      verPres: fil.mostrar_presupuesto !== false && PRES.length > 0, verPago: fil.mostrar_pago !== false && lst(fil.pagos).length > 0,
      presOpts: PRES.map((p, i) => ({ i: String(i), texto: p.texto })), presSel: st.pres == null ? '' : String(st.pres), onPres: e => setFiltro({ pres: e.target.value }),
      pagoOpts: PAGOS.map(t => ({ t })), pagoSel, onPago: e => setFiltro({ pago: e.target.value }),
      ...(() => {
        const lm = st.leadModal, tx = lm ? lm.texto : '', comp = !!(lm && lm.compartir), para = comp ? '' : (correo1 || ''), asunto = comp ? 'Comparación de autos en Auto-Opciones' : 'Solicitud desde el portal Auto-Opciones', canal = n => track('lead_canal', { canal: n, tipo: lm ? lm.tipo : '' });
        const abre = (url, n) => { canal(n); window.open(url, '_blank', 'noopener'); };
        return {
          leadAbierto: !!lm, leadStop: e => { try { e.stopPropagation(); } catch (x) {} }, leadTexto: tx, leadCerrar: () => set({ leadModal: null }),
          leadTitulo: comp ? '¿Cómo quieres compartir tu comparación?' : '¿Cómo quieres enviar tu solicitud?', leadSub: comp ? 'Elige cómo enviarla. El mensaje y el enlace ya van escritos.' : 'Elige la opción que te quede más cómoda. El mensaje ya va escrito.',
          hayLeadWa: comp || !!waNum, hayLeadCorreo: comp || !!correo1, leadCorreoEt: comp ? 'Por correo:' : 'Por correo a ' + (correo1 || '') + ':',
          hayLeadNativo: comp && typeof navigator.share === 'function', leadNativo: () => { canal('compartir_sistema'); try { navigator.share({ title: asunto, text: tx }).catch(() => {}); } catch (e) {} },
          leadWa: () => abre('https://wa.me/' + (comp ? '' : waNum) + '?text=' + encodeURIComponent(tx), 'whatsapp'),
          leadGmail: () => abre('https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(para) + '&su=' + encodeURIComponent(asunto) + '&body=' + encodeURIComponent(tx), 'gmail'),
          leadOutlook: () => abre('https://outlook.live.com/mail/0/deeplink/compose?to=' + encodeURIComponent(para) + '&subject=' + encodeURIComponent(asunto) + '&body=' + encodeURIComponent(tx), 'outlook'),
          leadMailto: () => { canal('mailto'); window.location.href = 'mailto:' + para + '?subject=' + encodeURIComponent(asunto) + '&body=' + encodeURIComponent(tx); },
          leadCopiar: () => { canal('copiar'); const ok = () => set({ copiado: true }); try { navigator.clipboard.writeText(tx).then(ok, () => {}); } catch (e) {} },
          leadCopiadoTxt: st.copiado ? (comp ? 'Mensaje y enlace copiados ✓' : 'Mensaje copiado ✓') : (comp ? 'Copiar mensaje y enlace' : 'Copiar mensaje')
        };
      })(),
      hayCmp: nCmp > 0, compartirCmp, txtCompartir: T.compartir_comparacion, cmpFin: nCmp > 0 && !esContado, conFin: !esContado, haySeguro, leyendaSeguro: segOn ? ' ' + T.leyenda_seguro : '', segTitulo: T.seguro_interruptor,
      segOpts: [{ label: 'Sí', active: segOn, inactive: !segOn, pick: () => set({ seg: true }) }, { label: 'No', active: !segOn, inactive: segOn, pick: () => set({ seg: false }) }],
      cardCols: S.autos.vista === 'cuadricula' ? 'repeat(auto-fit,minmax(min(100%,280px),1fr))' : W >= 760 ? 'minmax(300px,36%) minmax(0,1fr)' : 'minmax(0,1fr)', cardAlto: W >= 760 && S.autos.vista !== 'cuadricula' ? '260px' : '220px',
      buscar: () => scrollA('autos'), verCmp: () => scrollA('comparador'),
      tipos: tipos.map(t => ({ label: t.label, active: st.tipo === t.val, inactive: st.tipo !== t.val, pick: () => setFiltro({ tipo: t.val }) })),
      autos, hayAutos: autos.length > 0, sinAutos: autos.length === 0, nAutos: lista.length + (lista.length === 1 ? ' auto' : ' autos'),
      verMas: hayMas, masAutos: () => set({ nVer: Math.min(visibles + AUTOS_POR_VEZ, lista.length) }),
      masTxt: T.ver_mas_autos + ' (' + Math.min(AUTOS_POR_VEZ, lista.length - visibles) + ' más)',
      cuentaAutos: llenar(T.mostrando_autos, { n: visibles, total: lista.length }), hayCuenta: lista.length > AUTOS_INICIALES,
      alFinal: hayMas || (W < 760 && lista.length > 2), hayArriba: W < 760 && lista.length > 2,
      cabTextoOrden: W >= 760 ? '2' : '0', cabTextoAlinea: W >= 760 ? 'right' : 'left', cabTextoMargen: W >= 760 ? 'auto' : '0',
      arriba: () => window.scrollTo({ top: 0, behavior: window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }),
      cmpDeslizar: W < 760 && nCmp > 0, cmpPos: st.cmpPos || 0,
      cmpScroll: e => { const el = e.currentTarget, n = 3; const i = Math.min(n - 1, Math.round(el.scrollLeft / Math.max(1, (el.scrollWidth - el.clientWidth) / Math.max(1, n - 1)))); if (i !== (c.state.cmpPos || 0)) c.setState({ cmpPos: i }); },
      puntos: [0, 1, 2].map(i => ({ on: i === (st.cmpPos || 0), off: i !== (st.cmpPos || 0) })), txtDeslizar: T.deslizar, txtArriba: T.volver_arriba,
      autosCols: S.autos.vista === 'cuadricula' ? 'repeat(auto-fill,minmax(min(100%,340px),1fr))' : 'minmax(0,1fr)',
      slots, nCmp, nCmpLabel: nCmp + ' de 3', cmpEtiqueta: S.comparador.etiqueta || 'Comparador',
      engOpts: opt(ENG, eng, 'eng', v => v + '%'), plazoOpts: opt(PLAZO, plazo, 'plazo', v => v + ' meses'),
      eng: eng + '%', plazo: plazo + ' meses', calcNota: cal.nota || '', leyendaPago: T.leyenda_pago_inicial,
      ofertas: D.ofertas.filter(o => o.mostrar !== false).map(o => ({ k: o.etiqueta, v: o.valor, d: o.detalle })),
      financieras: FIN.map(f => ({ ...f, active: st.finVer === f.id, inactive: st.finVer !== f.id, pick: () => { track('financiera', { id: f.id }); set({ finVer: st.finVer === f.id ? null : f.id }); } })),
      hayFinSel: !!finSel, noFinSel: !finSel, finNombre: finSel ? finSel.nombre : '', finCards,
      finLogo: finSel && finSel.logo ? finSel.logo : '', hayFinLogo: !!(finSel && finSel.logo),
      finDetalle: finSel ? String(finSel.detalle || '').trim() : '', hayFinDetalle: !!(finSel && String(finSel.detalle || '').trim()),
      finEnlace, hayFinEnlace: !!finEnlace, finVolver: () => set({ finVer: null }),
      noticias: NOTICIAS.map(n => ({ cat: n.categoria, t: n.titulo, d: n.resumen, foto: n.foto || '', icono: n.icono || '', slug: n.slug, clic: n.clic, cursor: n.clic ? 'pointer' : 'default', rol: n.clic ? 'link' : 'group', tab: n.clic ? '0' : '',
        abrir: () => { if (n.tieneTexto) { set({ page: 'noticia', nid: n.slug, menu: false }); window.scrollTo(0, 0); } else if (n.tieneEnlace) window.open(n.enlace, /^https?:/.test(n.enlace) ? '_blank' : '_self', 'noopener'); } })),
      isNoticia: st.page === 'noticia', noticiaOk: !!NOT, noticiaNo: !NOT, art: NOT ? { t: NOT.titulo, cat: NOT.categoria, foto: NOT.foto || '', hayFoto: !!NOT.foto, d: NOT.resumen || '', hayMin: !!+NOT.minutos, min: NOT.minutos + ' ' + T.min_lectura, ps: String(NOT.contenido || '').split(/\n\s*\n/).map(x => x.trim()).filter(Boolean).map(t => ({ t, partes: t.split(/(https?:\/\/[^\s]+)/g).filter(Boolean).map(x => /^https?:\/\//.test(x) ? { t: x, link: true, nolink: false } : { t: x, link: false, nolink: true }) })) } : {},
      cotizarGeneral: () => lead('marca', llenar(MSG.marca, { marca: 'auto' })), goNoticias: () => { set({ page: 'inicio', nid: null, menu: false }); scrollA('noticias'); },
      reqTabs: PER.map(r => ({ label: r.pestana, active: r.id === req.id, inactive: r.id !== req.id, pick: () => set({ req: r.id }), ir: () => { set({ req: r.id }); ir('pagina:requisitos'); } })),
      rq: { titulo: rq.titulo || '', resaltado: rq.resaltado || '', nota: rq.nota || '', boton: rq.boton || 'Solicitar preautorización', aviso: rq.aviso || '' },
      hayLeyenda: !!String(T.leyenda_mensualidad || '').trim() && !esContado,
      hayReqPub: !!reqPub, reqPub: reqPub || {},
      req: { titulo: req.titulo, para: req.para, cond: lst(req.condiciones).map(t => ({ t })),
        docs: docs.map((t, i) => ({ t, n: String(i + 1).padStart(2, '0'), on: !!ck[t], off: !ck[t], toggle: () => set({ checks: { ...st.checks, [req.id]: { ...ck, [t]: !ck[t] } } }) })) },
      reqProgreso: hechos + ' de ' + docs.length, reqPct: (docs.length ? Math.round(hechos / docs.length * 100) : 0) + '%',
      reqListo: docs.length > 0 && hechos === docs.length, reqFalta: !(docs.length > 0 && hechos === docs.length)
    };
  }
  window.AO = { initState, vals };
})();
