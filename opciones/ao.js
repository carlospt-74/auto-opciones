// Auto-Opciones · lógica del portal. Todo el contenido se lee de data/*.json (editable con Pages CMS).
(function () {
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

  Promise.all(Object.entries(ARCH).map(([k, f]) =>
    fetch('data/' + f + '.json', { cache: 'no-cache' })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(j => { D[k] = k === 'sitio' ? (j || {}) : (Array.isArray(j[k]) ? j[k] : []); })
      .catch(e => console.warn('No se pudo leer data/' + f + '.json', e))
  )).then(() => { listo = true; aplicarColores(D.sitio.colores); if (D.sitio.titulo_pagina) document.title = D.sitio.titulo_pagina; notify(); });

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

  const TIPOS_SEC = ['banner', 'marcas', 'comparador', 'autos', 'ofertas', 'publicidad', 'info_credito', 'noticias'];
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

  function initState() {
    return { page: 'inicio', menu: false, marca: null, tipo: '*', pres: '', ficha: null, cmp: null, fin: [], slotMarca: [null, null, null], eng: null, plazo: null, req: null, checks: {}, w: 1280 };
  }

  function vals(c) {
    subs.add(c);
    if (!listo) return {};
    const st = c.state || {};
    const set = p => c.setState(p);
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
    const specs = a => FICHA.filter(f => a[f.campo] !== undefined && a[f.campo] !== '').map(f => ({ k: f.etiqueta, v: a[f.campo] + (f.unidad ? ' ' + f.unidad : '') }));
    const AUTOS = D.autos.filter(a => a.mostrar !== false);
    const MARCAS = D.marcas.filter(m => m.mostrar !== false);
    const FIN = D.financieras.filter(f => f.mostrar !== false);
    const ENG = lst(cal.enganches).map(Number).filter(isFinite); if (!ENG.length) ENG.push(10, 20, 30, 40);
    const PLAZO = lst(cal.plazos).map(Number).filter(isFinite); if (!PLAZO.length) PLAZO.push(12, 24, 36, 48, 60);
    const eng = st.eng != null ? st.eng : (+cal.enganche_inicial || ENG[0]);
    const plazo = st.plazo != null ? st.plazo : (+cal.plazo_inicial || PLAZO[PLAZO.length - 1]);
    const finTarjeta = { tasa: +cal.tasa_tarjetas || (FIN[0] && FIN[0].tasa) || 14, apertura: 0, seguro: 0 };
    const PRES = lst(fil.presupuestos);
    const pr = st.pres !== '' && st.pres != null ? PRES[+st.pres] : null;
    const cnt = m => AUTOS.filter(a => a.marca === m).length;
    const lista = AUTOS.filter(a => (!st.marca || a.marca === st.marca) && (st.tipo === '*' || a.tipo === st.tipo) &&
      (!pr || ((!pr.min || a.precio >= +pr.min) && (!pr.max || a.precio <= +pr.max))));
    const byId = id => AUTOS.find(a => a.id === id);
    const cmp = (st.cmp || [AUTOS[0] && AUTOS[0].id, AUTOS[1] && AUTOS[1].id, null]).map(x => (x && byId(x)) ? x : null);
    const nCmp = cmp.filter(Boolean).length;
    const toggleCmp = id => { const a = cmp.slice(); const i = a.indexOf(id); if (i >= 0) a[i] = null; else { const j = a.indexOf(null); if (j < 0) return; a[j] = id; } set({ cmp: a }); };
    const scrollA = id => setTimeout(() => { const el = document.getElementById('sec-' + id); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' }); }, 60);
    const ir = d => {
      d = String(d || '');
      if (/^(https?:|mailto:|tel:)/.test(d)) { window.open(d, /^https?:/.test(d) ? '_blank' : '_self'); return; }
      if (d === 'pagina:requisitos') { set({ page: 'req', menu: false }); window.scrollTo(0, 0); return; }
      set({ page: 'inicio', menu: false });
      if (d.indexOf('seccion:') === 0) scrollA(d.slice(8)); else window.scrollTo(0, 0);
    };

    const autos = lista.map(a => {
      const inC = cmp.includes(a.id);
      return { ...a, foto: a.foto || '', precioF: mxn(a.precio), nombre: a.marca + ' ' + a.modelo,
        mensual: mxn(mensualidad(a.precio, eng, finTarjeta, plazo)), specs: specs(a),
        ficha: st.ficha === a.id, noFicha: st.ficha !== a.id, abrirFicha: () => set({ ficha: a.id }), cerrarFicha: () => set({ ficha: null }),
        inCmp: inC, notInCmp: !inC, cmpDisabled: !inC && nCmp >= 3,
        cmpLabel: inC ? 'En comparador' : (nCmp >= 3 ? 'Comparador lleno' : 'Comparar'), toggleCmp: () => toggleCmp(a.id) };
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
      return { n: i + 1, filled: true, empty: false, id: a.id, foto: a.foto || '', marca: a.marca, modelo: a.modelo, version: a.version, nombre: a.marca + ' ' + a.modelo,
        precioF: mxn(a.precio), engF: mxn(engM), montoF: mxn(monto),
        aperturaF: mxn(monto * (+f.apertura || 0) / 100) + ' (' + (+f.apertura || 0) + '%)', tasaF: (+f.tasa || 0).toFixed(1) + '% anual',
        mensualF: mxn(mensualidad(a.precio, eng, f, plazo)), finId: f.id || '', finNombre: f.nombre || '',
        fins: FIN.map(x => ({ id: x.id, nombre: x.nombre })), specs: specs(a),
        onFin: e => { const fin = st.fin.slice(); fin[i] = e.target.value; set({ fin }); },
        quitar: () => { const cc = cmp.slice(); cc[i] = null; set({ cmp: cc }); } };
    });
    const pagos = slots.filter(s => s.filled).map(s => +s.mensualF.replace(/[^0-9]/g, ''));
    const maxP = Math.max(1, ...pagos), minP = Math.min(...pagos);
    slots.forEach(s => { if (s.filled) { const p = +s.mensualF.replace(/[^0-9]/g, ''); s.barPct = Math.round(p / maxP * 100) + '%'; s.masBaja = pagos.length > 1 && p === minP; } });

    const PER = D.perfiles;
    const req = PER.find(r => r.id === st.req) || PER[0] || { id: '-', titulo: '', para: '', documentos: [], condiciones: [] };
    const docs = lst(req.documentos), ck = st.checks[req.id] || {};
    const hechos = docs.filter((_, i) => ck[i]).length;
    const opt = (arr, cur, key, fmt) => arr.map(v => ({ label: fmt(v), active: v === cur, inactive: v !== cur, pick: () => set({ [key]: v }) }));
    const tipos = [{ label: fil.texto_todos || 'Todos', val: '*' }].concat(lst(fil.tipos).map(t => ({ label: t, val: t })));
    const pick = m => () => set({ marca: st.marca === m ? null : m, ficha: null });
    const reqPub = D.anuncios.find(a => a.ubicacion === 'requisitos' && a.mostrar !== false);
    const bm = S0.boton_menu || {};

    return {
      rootRef: c._rootRef, narrow: W < 760, wide: W >= 760, navWide: W >= 1100, navNarrow: W < 1100,
      isInicio: st.page === 'inicio', isReq: st.page === 'req',
      goInicio: () => ir('pagina:inicio'), goReq: () => ir('pagina:requisitos'),
      menuOpen: !!st.menu, toggleMenu: () => set({ menu: !st.menu }),
      S, pubs, logo: S0.logo || 'AutoOpciones_Logo/02_solo-texto/AutoOpciones_02_solo-texto.svg',
      menu: lst(S0.menu).map(m => ({ texto: m.texto, ir: () => ir(m.destino) })),
      btnMenu: { texto: bm.texto || 'Solicitar crédito', ir: () => ir(bm.destino || 'pagina:requisitos') },
      c: { telefono: ct.telefono || '', frase: ct.frase || '' },
      correos: lst(ct.correos).map(v => ({ v })), redes: lst(ct.redes).map(v => ({ v })),
      marcas: MARCAS.map(m => { const n = cnt(m.nombre); return { m: m.nombre, logo: m.logo || '', hasLogo: !!m.logo, noLogo: !m.logo, n, nLabel: n ? n + (n === 1 ? ' modelo' : ' modelos') : 'Bajo pedido', active: st.marca === m.nombre, inactive: st.marca !== m.nombre, pick: pick(m.nombre) }; }),
      totalMarcas: MARCAS.length,
      marcaActiva: st.marca || 'Todas las marcas',
      heroMarca: st.marca || '', onHeroMarca: e => set({ marca: e.target.value || null }),
      marcasSelect: MARCAS.map(m => ({ m: m.nombre })),
      heroFoto: S.banner.foto || '',
      fl: { presupuesto: fil.texto_presupuesto || 'Presupuesto', cualquiera: fil.texto_cualquiera || 'Cualquiera', pago: fil.texto_pago || 'Pago' },
      verPres: fil.mostrar_presupuesto !== false && PRES.length > 0, verPago: fil.mostrar_pago !== false && lst(fil.pagos).length > 0,
      presOpts: PRES.map((p, i) => ({ i: String(i), texto: p.texto })), presSel: st.pres == null ? '' : String(st.pres), onPres: e => set({ pres: e.target.value }),
      pagoOpts: lst(fil.pagos).map(t => ({ t })),
      buscar: () => scrollA('autos'), verCmp: () => scrollA('comparador'),
      tipos: tipos.map(t => ({ label: t.label, active: st.tipo === t.val, inactive: st.tipo !== t.val, pick: () => set({ tipo: t.val }) })),
      autos, hayAutos: autos.length > 0, sinAutos: autos.length === 0, nAutos: autos.length + (autos.length === 1 ? ' auto' : ' autos'),
      autosCols: S.autos.vista === 'cuadricula' ? 'repeat(auto-fill,minmax(min(100%,340px),1fr))' : 'minmax(0,1fr)',
      slots, nCmp, nCmpLabel: nCmp + ' de 3', cmpEtiqueta: S.comparador.etiqueta || 'Comparador',
      engOpts: opt(ENG, eng, 'eng', v => v + '%'), plazoOpts: opt(PLAZO, plazo, 'plazo', v => v + ' meses'),
      eng: eng + '%', plazo: plazo + ' meses', calcNota: cal.nota || '',
      ofertas: D.ofertas.filter(o => o.mostrar !== false).map(o => ({ k: o.etiqueta, v: o.valor, d: o.detalle })),
      financieras: FIN,
      noticias: D.noticias.filter(n => n.mostrar !== false).map(n => ({ cat: n.categoria, t: n.titulo, d: n.resumen, foto: n.foto || '', icono: n.icono || '' })),
      reqTabs: PER.map(r => ({ label: r.pestana, active: r.id === req.id, inactive: r.id !== req.id, pick: () => set({ req: r.id }), ir: () => { set({ req: r.id }); ir('pagina:requisitos'); } })),
      rq: { titulo: rq.titulo || '', resaltado: rq.resaltado || '', nota: rq.nota || '', boton: rq.boton || 'Solicitar preautorización', aviso: rq.aviso || '' },
      hayReqPub: !!reqPub, reqPub: reqPub || {},
      req: { titulo: req.titulo, para: req.para, cond: lst(req.condiciones).map(t => ({ t })),
        docs: docs.map((t, i) => ({ t, n: String(i + 1).padStart(2, '0'), on: !!ck[i], off: !ck[i], toggle: () => set({ checks: { ...st.checks, [req.id]: { ...ck, [i]: !ck[i] } } }) })) },
      reqProgreso: hechos + ' de ' + docs.length, reqPct: (docs.length ? Math.round(hechos / docs.length * 100) : 0) + '%',
      reqListo: docs.length > 0 && hechos === docs.length, reqFalta: !(docs.length > 0 && hechos === docs.length)
    };
  }
  window.AO = { initState, vals };
})();
