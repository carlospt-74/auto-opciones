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

  Promise.all(Object.entries(ARCH).map(([k, f]) =>
    fetch('data/' + f + '.json', { cache: 'no-cache' })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(j => { D[k] = k === 'sitio' ? aplanarSitio(j) : (Array.isArray(j[k]) ? j[k] : []); })
      .catch(e => console.warn('No se pudo leer data/' + f + '.json', e))
  )).then(() => { listo = true; aplicarColores(D.sitio.colores); if (D.sitio.titulo_pagina) document.title = D.sitio.titulo_pagina; prepararPagina(); notify(); });

  // Fórmula de mensualidad editable. Si tiene un error, se usa la de respaldo.
  const FORMULA_BASE = 'monto * tasa_mensual / (1 - (1 + tasa_mensual) ^ -plazo)';
  const VARS = ['precio', 'enganche', 'monto', 'tasa', 'tasa_mensual', 'plazo', 'apertura', 'seguro', 'iva'];
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
        const t = fn({ precio: 500000, enganche: 100000, monto: 400000, tasa: 14, tasa_mensual: 14 / 1200, plazo: 48, apertura: 2, seguro: 0, iva: 16 });
        if (!isFinite(t) || t <= 0) throw new Error('el resultado no es válido');
        fnAct = fn;
      } catch (e) { console.warn('Fórmula de mensualidad con error; se usa la de respaldo.', e.message); fnAct = fnBase; }
    }
    return fnAct;
  }
  function mensualidad(precio, engPct, fin, plazo) {
    const enganche = precio * engPct / 100, monto = precio - enganche, tasa = +fin.tasa || 0;
    const v = { precio, enganche, monto, tasa, tasa_mensual: tasa / 1200, plazo, apertura: +fin.apertura || 0, seguro: +fin.seguro || 0, iva: +((D.sitio.calculo || {}).iva) || 16 };
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
  const slug = x => norm(x).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  const soloDigitos = x => String(x || '').replace(/\D/g, '');
  const numMx = x => { const d = soloDigitos(x); return d.length === 10 ? '52' + d : d; };
  const telHref = x => { const n = numMx(x); return n ? 'tel:+' + n : ''; };

  // Analítica (opcional): solo se carga si se llena en el CMS.
  function track(evento, props) {
    try {
      if (window.plausible) window.plausible(evento, { props: props || {} });
      if (window.gtag) window.gtag('event', evento === 'lead' ? 'generate_lead' : evento, props || {});
    } catch (e) {}
  }
  function cargarAnalitica(an) {
    an = an || {};
    const add = (src, attrs) => { const s = document.createElement('script'); s.src = src; s.async = true; Object.keys(attrs || {}).forEach(k => s.setAttribute(k, attrs[k])); document.head.appendChild(s); };
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
    if (p[0] === 'comparar' && p[1]) return { page: 'inicio', ficha: null, menu: false, cmp: [0, 1, 2].map(i => p[1].split(',')[i] || null), irCmp: true };
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
    return { page: 'inicio', nid: null, pago: null, menu: false, marca: null, tipo: '*', pres: '', ficha: null, cmp: null, fin: [], slotMarca: [null, null, null], eng: null, plazo: null, req: null, checks: leerChecks(), q: '', orden: '', mmax: '', nVer: 0, finVer: null, cmpPos: 0, w: 1280 };
  }

  function vals(c) {
    subs.add(c);
    if (!listo) return {};
    const st = c.state || {};
    const set = p => {
      c.setState(p);
      if ('checks' in p) guardarChecks(p.checks);
      if ('page' in p || 'req' in p || 'ficha' in p || 'nid' in p) {
        try { const h = hashDe({ ...c.state, ...p }); if (h !== (location.hash || '#/')) history.pushState(null, '', h); } catch (e) {}
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
    const PRES = lst(fil.presupuestos);
    const pr = st.pres !== '' && st.pres != null ? PRES[+st.pres] : null;
    const cnt = m => AUTOS.filter(a => a.marca === m).length;
    const Q = norm(st.q || '').split(/\s+/).filter(Boolean), MMAX = +st.mmax || 0;
    const mens = a => mensualidad(a.precio, eng, finTarjeta, plazo);
    const lista0 = AUTOS.filter(a => (!st.marca || a.marca === st.marca) && (st.tipo === '*' || a.tipo === st.tipo) &&
      (!pr || ((!pr.min || a.precio >= +pr.min) && (!pr.max || a.precio <= +pr.max))) &&
      (!Q.length || Q.every(t => norm([a.marca, a.modelo, a.version, a.tipo].join(' ')).includes(t))) &&
      (!MMAX || esContado || mens(a) <= MMAX));
    const ordenSel = ['precio_asc', 'precio_desc', 'mensual'].includes(st.orden) ? st.orden : '';
    const lista = ordenSel === 'precio_asc' ? [...lista0].sort((x, y) => x.precio - y.precio) : ordenSel === 'precio_desc' ? [...lista0].sort((x, y) => y.precio - x.precio) : ordenSel === 'mensual' ? [...lista0].sort((x, y) => mens(x) - mens(y)) : lista0;
    // Lista de autos: se muestran unos pocos al inicio y "Ver más" agrega de N en N, en la misma página.
    // Cualquier cambio de filtro, búsqueda u orden reinicia el conteo a la cantidad inicial (ver setFiltro).
    const AUTOS_INICIALES = Math.max(1, Math.floor(+S.autos.autos_iniciales) || 4);
    const AUTOS_POR_VEZ = Math.max(1, Math.floor(+S.autos.autos_por_pagina) || 10);
    const setFiltro = p => set({ ...p, nVer: 0 });
    const visibles = Math.min(Math.max(st.nVer || 0, AUTOS_INICIALES), lista.length);
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

    window.__aoEsc = () => { if (st.menu) set({ menu: false }); else if (st.ficha) set({ ficha: null }); };
    const T = { ...TEXTOS, ...Object.fromEntries(Object.entries(S0.textos || {}).filter(([, v]) => typeof v === 'string' && v !== '')) };
    const MSG = { ...MENSAJES, ...Object.fromEntries(Object.entries({ auto: ct.mensaje_auto, opcion: ct.mensaje_opcion, marca: ct.mensaje_marca, credito: ct.mensaje_credito, compartir: ct.mensaje_compartir }).filter(([, v]) => v)) };
    const waNum = numMx(ct.whatsapp), correo1 = lst(ct.correos)[0];
    const lead = (tipo, texto) => {
      track('lead', { tipo });
      if (waNum) window.open('https://wa.me/' + waNum + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
      else if (correo1) window.location.href = 'mailto:' + correo1 + '?subject=' + encodeURIComponent('Solicitud desde el portal Auto-Opciones') + '&body=' + encodeURIComponent(texto);
      else if (telHref(ct.telefono)) window.location.href = telHref(ct.telefono);
    };
    const marcaTxt = st.marca || 'auto';

    const autos = lista.slice(0, visibles).map(a => {
      const inC = cmp.includes(a.id);
      return { ...a, enfoque: ENFOQUE[a.enfoque_foto] || 'center', foto: a.foto || '', precioF: mxn(a.precio), nombre: a.marca + ' ' + a.modelo,
        mensual: mxn(mensualidad(a.precio, eng, finTarjeta, plazo)), specs: specs(a),
        mensualTxt: esContado ? '' : esArrend ? T.renta_cotizar : mxn(mensualidad(a.precio, eng, finTarjeta, plazo)) + '/mes*', hayMensualTxt: !esContado,
        ficha: st.ficha === a.id, noFicha: st.ficha !== a.id, abrirFicha: () => set({ ficha: a.id }), cerrarFicha: () => set({ ficha: null }),
        inCmp: inC, notInCmp: !inC, cmpDisabled: !inC && nCmp >= 3,
        cmpLabel: inC ? T.en_comparador : (nCmp >= 3 ? T.comparador_lleno : T.comparar), toggleCmp: () => toggleCmp(a.id),
        hayAnio: !!a.anio, anioF: a.anio ? 'Modelo ' + a.anio : '', hayVig: !!a.vigencia, vigF: a.vigencia ? 'Precio vigente al ' + a.vigencia : '',
        cotizar: () => lead('auto', llenar(MSG.auto, { auto: [a.marca, a.modelo, a.version].filter(Boolean).join(' '), anio: a.anio ? ' ' + a.anio : '', precio: mxn(a.precio), enganche: eng + '%', plazo: plazo + ' meses', pago: pagoSel, detalle: esContado ? 'Me interesa comprarlo de contado.' : esArrend ? 'Me interesa la opción de arrendamiento.' : 'Con enganche de ' + eng + '% a ' + plazo + ' meses, la mensualidad estimada es ' + mxn(mensualidad(a.precio, eng, finTarjeta, plazo)) + ' al mes.', mensualidad: mxn(mensualidad(a.precio, eng, finTarjeta, plazo)) + ' al mes' })) };
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
      return { n: i + 1, filled: true, empty: false, id: a.id, enfoque: ENFOQUE[a.enfoque_foto] || 'center', foto: a.foto || '', marca: a.marca, modelo: a.modelo, version: a.version, nombre: a.marca + ' ' + a.modelo,
        precioF: mxn(a.precio), engF: mxn(engM), montoF: mxn(monto),
        aperturaF: mxn(monto * (+f.apertura || 0) / 100) + ' (' + (+f.apertura || 0) + '%)', tasaF: (+f.tasa || 0).toFixed(1) + '% anual',
        mensualF: mxn(mensualidad(a.precio, eng, f, plazo)), finId: f.id || '', finNombre: f.nombre || '',
        fins: FIN.map(x => ({ id: x.id, nombre: x.nombre })), specs: specs(a),
        onFin: e => { const fin = st.fin.slice(); fin[i] = e.target.value; set({ fin }); },
        quiero: () => lead('opcion', llenar(MSG.opcion, { auto: [a.marca, a.modelo, a.version].filter(Boolean).join(' '), anio: a.anio ? ' ' + a.anio : '', precio: mxn(a.precio), financiera: esContado || esArrend ? '' : (f.nombre || ''), enganche: eng + '%', plazo: plazo + ' meses', mensualidad: mxn(mensualidad(a.precio, eng, f, plazo)) + ' al mes',
          detalle: esContado ? 'Me interesa comprarlo de contado.' : esArrend ? 'Me interesa la opción de arrendamiento.' : 'Con ' + (f.nombre ? f.nombre + ', ' : '') + 'enganche de ' + eng + '% a ' + plazo + ' meses, la mensualidad estimada es ' + mxn(mensualidad(a.precio, eng, f, plazo)) + ' al mes.' })),
        quitar: () => { const cc = cmp.slice(); cc[i] = null; set({ cmp: cc }); } };
    });
    const compartirCmp = () => {
      const f = slots.filter(s => s.filled);
      if (!f.length) return;
      const url = location.origin + location.pathname + '#/comparar/' + f.map(s => encodeURIComponent(s.id)).join(',');
      const lineas = f.map(s => '• ' + [s.nombre, s.version].filter(Boolean).join(' ') + ' · ' + s.precioF + (esContado ? '' : ' · ' + s.mensualF + '/mes*'));
      const pie = esContado ? '' : '\n* ' + T.leyenda_mensualidad + ' (' + eng + '% de enganche, ' + plazo + ' meses)';
      track('compartir', { autos: f.length });
      window.open('https://wa.me/?text=' + encodeURIComponent(MSG.compartir + '\n' + lineas.join('\n') + pie + '\n' + url), '_blank', 'noopener');
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
      hayCmp: nCmp > 0, compartirCmp, txtCompartir: T.compartir_comparacion, cmpFin: nCmp > 0 && !esContado, conFin: !esContado,
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
      eng: eng + '%', plazo: plazo + ' meses', calcNota: cal.nota || '',
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
