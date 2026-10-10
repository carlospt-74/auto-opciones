// Datos y lógica compartida de los 3 estilos del portal Auto-Opciones.
(function () {
  const MARCAS = ['Acura','Alfa Romeo','Audi','BMW','Cadillac','Chevrolet','Chrysler','Dodge','Fiat','Ford','Honda','Hyundai','Jeep','Kia','Land Rover','Mazda','Mercedes Benz','Mini Cooper','Mitsubishi','Nissan','Peugeot','RAM','Renault','Seat','Smart','Suzuki','Toyota','Volkswagen'];
  const S = (motor, hp, trans, rend, pas, cajuela, bolsas, traccion) => ({ motor, hp, trans, rend, pas, cajuela, bolsas, traccion });
  const AUTOS = [
    { id: 'rav4', marca: 'Toyota', modelo: 'RAV4', version: 'XLE Híbrida', tipo: 'SUV', precio: 689900, s: S('2.5 L híbrido', 219, 'e-CVT', 20.1, 5, 580, 8, 'AWD') },
    { id: 'cx5', marca: 'Mazda', modelo: 'CX-5', version: 'i Grand Touring', tipo: 'SUV', precio: 599900, s: S('2.5 L', 187, 'Automática 6 vel.', 14.5, 5, 442, 6, 'FWD') },
    { id: 'crv', marca: 'Honda', modelo: 'CR-V', version: 'Touring', tipo: 'SUV', precio: 729900, s: S('1.5 L turbo', 190, 'CVT', 15.4, 5, 586, 8, 'AWD') },
    { id: 'sentra', marca: 'Nissan', modelo: 'Sentra', version: 'Advance', tipo: 'Sedán', precio: 439900, s: S('2.0 L', 149, 'CVT', 16.9, 5, 405, 6, 'FWD') },
    { id: 'taos', marca: 'Volkswagen', modelo: 'Taos', version: 'Highline', tipo: 'SUV', precio: 589900, s: S('1.4 L turbo', 150, 'Tiptronic 6 vel.', 15.0, 5, 498, 6, 'FWD') },
    { id: 'tucson', marca: 'Hyundai', modelo: 'Tucson', version: 'Limited', tipo: 'SUV', precio: 679900, s: S('2.5 L', 187, 'Automática 8 vel.', 13.2, 5, 620, 6, 'FWD') },
    { id: 'ranger', marca: 'Ford', modelo: 'Ranger', version: 'XLT 4x4', tipo: 'Pickup', precio: 849900, s: S('2.0 L turbo diésel', 170, 'Automática 10 vel.', 11.8, 5, 1200, 6, '4x4') },
    { id: 'x1', marca: 'BMW', modelo: 'X1', version: 'sDrive20i', tipo: 'SUV', precio: 989900, s: S('2.0 L turbo', 204, 'Doble embrague 7 vel.', 14.2, 5, 540, 8, 'FWD') },
    { id: 'clasea', marca: 'Mercedes Benz', modelo: 'Clase A 200', version: 'Sedán Progressive', tipo: 'Sedán', precio: 899900, s: S('1.3 L turbo', 163, 'Doble embrague 7 vel.', 16.1, 5, 420, 7, 'FWD') },
    { id: 'compass', marca: 'Jeep', modelo: 'Compass', version: 'Limited', tipo: 'SUV', precio: 749900, s: S('1.3 L turbo', 175, 'Automática 6 vel.', 13.0, 5, 438, 6, 'FWD') },
    { id: 'sportage', marca: 'Kia', modelo: 'Sportage', version: 'GT-Line', tipo: 'SUV', precio: 649900, s: S('2.0 L', 154, 'Automática 6 vel.', 13.6, 5, 591, 6, 'FWD') },
    { id: 'mazda3', marca: 'Mazda', modelo: 'Mazda 3', version: 'Hatchback Signature', tipo: 'Hatchback', precio: 529900, s: S('2.5 L turbo', 227, 'Automática 6 vel.', 13.4, 5, 334, 8, 'FWD') }
  ];
  const SPECS = [['Motor', 'motor'], ['Potencia', 'hp', ' hp'], ['Transmisión', 'trans'], ['Tracción', 'traccion'], ['Rendimiento combinado', 'rend', ' km/l'], ['Pasajeros', 'pas'], ['Cajuela', 'cajuela', ' L'], ['Bolsas de aire', 'bolsas']];
  const FIN = [
    { id: 'bbva', nombre: 'BBVA', tasa: 13.9, apertura: 2 },
    { id: 'banorte', nombre: 'Banorte', tasa: 14.5, apertura: 1 },
    { id: 'banamex', nombre: 'Banamex', tasa: 13.5, apertura: 3 },
    { id: 'afirme', nombre: 'Afirme', tasa: 15.2, apertura: 1 },
    { id: 'hsbc', nombre: 'HSBC', tasa: 14.2, apertura: 2 }
  ];
  const OFERTAS = [
    { k: 'Enganche', v: 'Desde 0%', d: 'Hasta 20% según la financiera y la marca.' },
    { k: 'Comisión por apertura', v: '1%, 2% o 3%', d: 'Compara antes de elegir financiera.' },
    { k: 'Meses sin intereses', v: '12 y 24', d: 'En modelos participantes este mes.' },
    { k: 'Preautorización', v: 'Clientes premium', d: 'Por lealtad a la marca o buen historial de crédito.' }
  ];
  const NOTICIAS = [
    { cat: 'Crédito', t: 'CAT, tasa y comisión: qué revisar antes de firmar', d: 'La tasa más baja no siempre es el crédito más barato. Te explicamos cómo leer el Costo Anual Total.', min: 4 },
    { cat: 'Empresas', t: 'Arrendamiento puro o crédito: cuál conviene a tu negocio', d: 'Diferencias en deducción, flujo de efectivo y propiedad del auto al final del plazo.', min: 6 },
    { cat: 'Manejo', t: 'Tu auto y el calor de Monterrey', d: 'Batería, llantas y aire acondicionado: revisiones que conviene hacer antes del verano.', min: 3 },
    { cat: 'Seguro', t: 'Cobertura amplia o limitada', d: 'Qué cubre cada una y por qué tu financiera puede exigir cobertura amplia.', min: 5 }
  ];
  const REQ = [
    { id: 'pf', tab: 'Persona física', titulo: 'Persona física', para: 'Asalariados que compran a su nombre.',
      docs: ['Identificación oficial vigente (INE o pasaporte)', 'CURP', 'Comprobante de domicilio no mayor a 3 meses', 'Comprobantes de ingresos de los últimos 3 meses (recibos de nómina o estados de cuenta)', 'Constancia de situación fiscal (RFC)', 'Solicitud de crédito firmada', 'Autorización de consulta al Buró de Crédito', 'Dos referencias personales'],
      cond: ['Edad de 21 a 70 años', 'Antigüedad laboral mínima de 1 año', 'Enganche desde 10%'] },
    { id: 'pfae', tab: 'Persona física con actividad empresarial', titulo: 'Persona física con actividad empresarial', para: 'Profesionistas y negocios que facturan a su nombre.',
      docs: ['Identificación oficial vigente', 'Comprobante de domicilio fiscal y particular no mayor a 3 meses', 'Constancia de situación fiscal', 'Opinión de cumplimiento del SAT (32-D) positiva', 'Declaraciones anuales de los últimos 2 ejercicios', 'Estados de cuenta bancarios de los últimos 6 meses', 'Solicitud de crédito firmada', 'Autorización de consulta al Buró de Crédito'],
      cond: ['Antigüedad mínima de 2 años en la actividad', 'Ingresos comprobables vía declaraciones o estados de cuenta', 'Factura del auto a nombre del contribuyente'] },
    { id: 'pm', tab: 'Persona moral', titulo: 'Persona moral', para: 'Empresas constituidas que compran para su flotilla o directivos.',
      docs: ['Acta constitutiva inscrita en el Registro Público', 'Poderes del representante legal', 'Identificación oficial del representante legal y del aval', 'Constancia de situación fiscal de la empresa', 'Comprobante de domicilio fiscal no mayor a 3 meses', 'Estados financieros de los últimos 2 ejercicios y parcial reciente', 'Declaraciones anuales de los últimos 2 ejercicios', 'Estados de cuenta bancarios de los últimos 6 meses', 'Autorización de consulta al Buró de Crédito de la empresa y del aval'],
      cond: ['Antigüedad mínima de 2 años de operación', 'Aval u obligado solidario, generalmente un accionista', 'Opinión de cumplimiento del SAT positiva'] },
    { id: 'ap', tab: 'Arrendamiento puro', titulo: 'Arrendamiento puro', para: 'Personas físicas con actividad empresarial y personas morales que prefieren rentar el auto.',
      docs: ['Documentación de persona física con actividad empresarial o persona moral, según el caso', 'Cotización del vehículo elegido', 'Opinión de cumplimiento del SAT (32-D) positiva', 'Estados de cuenta bancarios de los últimos 6 meses', 'Autorización de consulta al Buró de Crédito'],
      cond: ['Las rentas pueden ser deducibles conforme a la Ley del ISR', 'El auto es propiedad de la arrendadora durante el plazo', 'Al final puedes renovar, devolver o comprar a valor de mercado', 'Depósito en garantía y primera renta al firmar'] },
    { id: 'af', tab: 'Arrendamiento financiero', titulo: 'Arrendamiento financiero', para: 'Empresas y personas con actividad empresarial que quieren quedarse con el auto.',
      docs: ['Documentación de persona física con actividad empresarial o persona moral, según el caso', 'Cotización del vehículo elegido', 'Estados financieros recientes', 'Estados de cuenta bancarios de los últimos 6 meses', 'Autorización de consulta al Buró de Crédito'],
      cond: ['Opción de compra pactada desde el inicio del contrato', 'El auto se deduce vía depreciación', 'IVA de cada renta acreditable', 'Pago inicial desde 10%'] }
  ];
  // Fotos (Pexels). Pega tu API key aquí o en localStorage 'ao_pexels_key'.
  const PEXELS_KEY = '';
  const FOTO = {}, subs = new Set();
  const key = () => PEXELS_KEY || (typeof localStorage !== 'undefined' && localStorage.getItem('ao_pexels_key')) || '';
  // Fotos guardadas en el proyecto (assets/fotos). Tienen prioridad y no requieren clave.
  const LOCAL = {  "Hyundai Tucson car": "assets/fotos/11245770.jpg",  "Mazda car": "assets/fotos/16028417.jpg",  "Nissan Sentra car": "assets/fotos/15223535.jpg",  "Mazda CX-5 car": "assets/fotos/17974812.jpg",  "signing car loan": "assets/fotos/3760067.jpg",  "Honda CR-V car": "assets/fotos/9331824.jpg",  "car insurance": "assets/fotos/10341357.jpg",  "car highway mountains": "assets/fotos/14782133.jpg",  "Mazda Mazda 3 car": "assets/fotos/16028417.jpg",  "Volkswagen Taos car": "assets/fotos/18990120.jpg",  "Toyota RAV4 car": "assets/fotos/28086865.jpg",  "Ford Ranger car": "assets/fotos/20284508.jpg",  "BMW X1 car": "assets/fotos/14850149.jpg",  "Mercedes Benz Clase A 200 car": "assets/fotos/9513404.jpg",  "Jeep Compass car": "assets/fotos/19806867.jpg",  "Kia Sportage car": "assets/fotos/27286179.jpg",  "new car city road": "assets/fotos/33437141.jpg",  "young woman driving car": "assets/fotos/4429509.jpg",  "Toyota car": "assets/fotos/13633258.jpg",  "Honda car": "assets/fotos/9846087.jpg",  "Nissan car": "assets/fotos/33501918.jpg",  "Volkswagen car": "assets/fotos/14499106.jpg",  "Kia car": "assets/fotos/7290399.jpg",  "BMW car": "assets/fotos/14850138.jpg",  "Ford car": "assets/fotos/16605543.jpg",  "business car keys": "assets/fotos/7144207.jpg" };
  let cache = {};
  try { Object.assign(cache, JSON.parse(localStorage.getItem('ao_pexels_cache') || '{}')); } catch (e) {}
  Object.assign(cache, LOCAL);
  const queue = []; let busy = false, enviados = 0;
  const MAX_POR_SESION = 40;
  const bloqueado = () => +(localStorage.getItem('ao_pexels_block') || 0) > Date.now();
  const guardar = () => { try { localStorage.setItem('ao_pexels_cache', JSON.stringify(cache)); } catch (e) {} };
  const notify = () => subs.forEach(c => { try { c.setState({ _f: Date.now() }); } catch (e) {} });
  function pump() {
    if (busy || !queue.length) return;
    if (bloqueado() || enviados >= MAX_POR_SESION) { queue.length = 0; return; }
    const q = queue.shift(); busy = true; enviados++;
    fetch('https://api.pexels.com/v1/search?per_page=1&orientation=landscape&query=' + encodeURIComponent(q), { headers: { Authorization: key() } })
      .then(r => { if (r.status === 429) { localStorage.setItem('ao_pexels_block', String(Date.now() + 3600e3)); throw new Error('429'); } if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(d => { const p = d.photos && d.photos[0]; cache[q] = p ? p.src.large : '-'; guardar(); notify(); })
      .catch(e => { if (e.message === '429') queue.length = 0; })
      .finally(() => { busy = false; setTimeout(pump, 350); });
  }
  function foto(q) {
    if (cache[q] !== undefined) return cache[q] === '-' ? '' : cache[q];
    if (FOTO[q] !== undefined) return '';
    FOTO[q] = '';
    if (!key() || bloqueado()) return '';
    queue.push(q); setTimeout(pump, 0);
    return '';
  }
  const LOGO = { 'Acura':'acura','Alfa Romeo':'alfaromeo','Audi':'audi','BMW':'bmw','Cadillac':'cadillac','Chevrolet':'chevrolet','Chrysler':'chrysler','Fiat':'fiat','Ford':'ford','Honda':'honda','Hyundai':'hyundai','Jeep':'jeep','Kia':'kia','Land Rover':'landrover','Mazda':'mazda','Mercedes Benz':'mercedes','Mini Cooper':'mini','Mitsubishi':'mitsubishi','Nissan':'nissan','Peugeot':'peugeot','RAM':'ram','Renault':'renault','Seat':'seat','Smart':'smart','Suzuki':'suzuki','Toyota':'toyota','Volkswagen':'volkswagen' };
  const logo = m => LOGO[m] ? 'assets/marcas/' + LOGO[m] + '.svg' : '';
  const NOTI_Q = { 'Crédito': 'signing car loan', 'Empresas': 'business car keys', 'Manejo': 'car highway mountains', 'Seguro': 'car insurance' };
  const DEST = ['Toyota', 'Mazda', 'Honda', 'Nissan', 'Volkswagen', 'Kia', 'BMW', 'Ford'];
  const ENG = [10, 20, 30, 40];
  const PLAZO = [12, 24, 36, 48, 60];
  const mxn = n => '$' + Math.round(n).toLocaleString('es-MX');
  const pago = (P, tasa, n) => { const r = tasa / 100 / 12; return P * r / (1 - Math.pow(1 + r, -n)); };
  const byId = id => AUTOS.find(a => a.id === id);

  function initState() {
    return { page: 'inicio', menu: false, marca: null, tipo: 'Todos', ficha: null, cmp: ['rav4', 'cx5', null], fin: ['bbva', 'banorte', 'bbva'], slotMarca: [null, null, null], eng: 20, plazo: 48, req: 'pf', checks: {}, w: 1280 };
  }

  function vals(c) {
    const st = c.state || {};
    subs.add(c);
    const set = p => c.setState(p);
    if (!c._ro) {
      c._rootRef = el => {
        if (!el || c._roEl === el) return;
        c._roEl = el;
        c._ro && c._ro.disconnect();
        c._ro = new ResizeObserver(e => { const w = e[0].contentRect.width; if (Math.abs(w - (c.state.w || 0)) > 4) c.setState({ w }); });
        c._ro.observe(el);
      };
      c._ro = null;
    }
    const narrow = (st.w || 1280) < 760;
    const tipos = ['Todos', 'SUV', 'Sedán', 'Hatchback', 'Pickup'];
    const cnt = m => AUTOS.filter(a => a.marca === m).length;
    let lista = AUTOS.filter(a => (!st.marca || a.marca === st.marca) && (st.tipo === 'Todos' || a.tipo === st.tipo));
    const toggleCmp = id => {
      const cmp = st.cmp.slice(); const i = cmp.indexOf(id);
      if (i >= 0) cmp[i] = null; else { const j = cmp.indexOf(null); if (j < 0) return; cmp[j] = id; }
      set({ cmp });
    };
    const nCmp = st.cmp.filter(Boolean).length;
    const autos = lista.map(a => {
      const inC = st.cmp.includes(a.id);
      const eng = a.precio * st.eng / 100;
      return {
        ...a, foto: foto(a.marca + ' ' + a.modelo + ' car'), precioF: mxn(a.precio), nombre: a.marca + ' ' + a.modelo, img: 'foto · ' + a.marca + ' ' + a.modelo,
        mensual: mxn(pago(a.precio - eng, 13.9, st.plazo)),
        specs: SPECS.map(([k, key, u]) => ({ k, v: a.s[key] + (u || '') })),
        ficha: st.ficha === a.id, noFicha: st.ficha !== a.id,
        abrirFicha: () => set({ ficha: a.id }), cerrarFicha: () => set({ ficha: null }),
        inCmp: inC, notInCmp: !inC, cmpDisabled: !inC && nCmp >= 3,
        cmpLabel: inC ? 'En comparador' : (nCmp >= 3 ? 'Comparador lleno' : 'Comparar'),
        toggleCmp: () => toggleCmp(a.id)
      };
    });
    const slots = st.cmp.map((id, i) => {
      const a = id && byId(id);
      const marcasConAutos = MARCAS.filter(m => cnt(m) > 0);
      if (!a) {
        const sm = st.slotMarca[i];
        return {
          n: i + 1, filled: false, empty: true, marcaSel: sm || '',
          marcas: marcasConAutos.map(m => ({ m })),
          modelos: AUTOS.filter(x => x.marca === sm && !st.cmp.includes(x.id)).map(x => ({ id: x.id, label: x.modelo + ' ' + x.version })),
          hasMarca: !!sm,
          onMarca: e => { const s = st.slotMarca.slice(); s[i] = e.target.value || null; set({ slotMarca: s }); },
          onModelo: e => { const v = e.target.value; if (!v) return; const cmp = st.cmp.slice(); cmp[i] = v; set({ cmp }); }
        };
      }
      const f = FIN.find(x => x.id === st.fin[i]) || FIN[0];
      const eng = a.precio * st.eng / 100, monto = a.precio - eng;
      return {
        n: i + 1, filled: true, empty: false, id: a.id, foto: foto(a.marca + ' ' + a.modelo + ' car'), marca: a.marca, modelo: a.modelo, version: a.version, nombre: a.marca + ' ' + a.modelo,
        img: 'foto · ' + a.marca + ' ' + a.modelo, precioF: mxn(a.precio), engF: mxn(eng), montoF: mxn(monto),
        aperturaF: mxn(monto * f.apertura / 100) + ' (' + f.apertura + '%)', tasaF: f.tasa.toFixed(1) + '% anual',
        mensualF: mxn(pago(monto, f.tasa, st.plazo)), finId: f.id, finNombre: f.nombre,
        fins: FIN.map(x => ({ id: x.id, nombre: x.nombre })),
        specs: SPECS.map(([k, key, u]) => ({ k, v: a.s[key] + (u || '') })),
        onFin: e => { const fin = st.fin.slice(); fin[i] = e.target.value; set({ fin }); },
        quitar: () => { const cmp = st.cmp.slice(); cmp[i] = null; set({ cmp }); }
      };
    });
    const pagos = slots.filter(s => s.filled).map(s => +s.mensualF.replace(/[^0-9]/g, ''));
    const maxP = Math.max(1, ...pagos), minP = Math.min(...pagos);
    slots.forEach((s, i) => { s.vs = i > 0; if (s.filled) { const p = +s.mensualF.replace(/[^0-9]/g, ''); s.barPct = Math.round(p / maxP * 100) + '%'; s.masBaja = pagos.length > 1 && p === minP; } });
    const filas = SPECS.map(([k, key, u]) => ({ k, cells: st.cmp.map(id => { const a = id && byId(id); return { v: a ? a.s[key] + (u || '') : '—' }; }) }));
    const req = REQ.find(r => r.id === st.req);
    const ck = st.checks[req.id] || {};
    const hechos = req.docs.filter((_, i) => ck[i]).length;
    const opt = (arr, cur, key, fmt) => arr.map(v => ({ label: fmt(v), active: v === cur, inactive: v !== cur, pick: () => set({ [key]: v }) }));
    return {
      rootRef: c._rootRef, narrow, wide: !narrow, navWide: (st.w || 1280) >= 1100, navNarrow: (st.w || 1280) < 1100,
      isInicio: st.page === 'inicio', isReq: st.page === 'req',
      goInicio: () => set({ page: 'inicio', menu: false }), goReq: () => set({ page: 'req', menu: false }),
      menuOpen: !!st.menu, toggleMenu: () => set({ menu: !st.menu }),
      marcas: MARCAS.map(m => ({ m, logo: logo(m), hasLogo: !!LOGO[m], noLogo: !LOGO[m], n: cnt(m), nLabel: cnt(m) ? cnt(m) + (cnt(m) === 1 ? ' modelo' : ' modelos') : 'Bajo pedido', active: st.marca === m, inactive: st.marca !== m, pick: () => set({ marca: st.marca === m ? null : m, ficha: null }) })),
      totalMarcas: MARCAS.length,
      marcaActiva: st.marca || 'Todas las marcas', hayFiltroMarca: !!st.marca, limpiarMarca: () => set({ marca: null }),
      heroMarca: st.marca || '',
      onHeroMarca: e => set({ marca: e.target.value || null }),
      marcasSelect: MARCAS.map(m => ({ m })),
      tipos: opt(tipos, st.tipo, 'tipo', v => v).map(t => ({ ...t, n: t.label === 'Todos' ? AUTOS.length : AUTOS.filter(a => a.tipo === t.label).length })),
      autos, hayAutos: autos.length > 0, sinAutos: autos.length === 0, nAutos: autos.length + (autos.length === 1 ? ' auto' : ' autos'),
      slots, filas, nCmp, nCmpLabel: nCmp + ' de 3',
      engOpts: opt(ENG, st.eng, 'eng', v => v + '%'), plazoOpts: opt(PLAZO, st.plazo, 'plazo', v => v + ' meses'),
      eng: st.eng + '%', plazo: st.plazo + ' meses',
      heroFoto: foto('new car city road'), heroFoto2: foto('young woman driving car'),
      verMarcas: !!st.verMarcas, noVerMarcas: !st.verMarcas, toggleMarcas: () => set({ verMarcas: !st.verMarcas }),
      destacadas: DEST.map(m => ({ m, logo: logo(m), hasLogo: !!LOGO[m], noLogo: !LOGO[m], n: cnt(m), nLabel: cnt(m) + (cnt(m) === 1 ? ' modelo' : ' modelos'), foto: foto(m + ' car'), active: st.marca === m, inactive: st.marca !== m, pick: () => set({ marca: st.marca === m ? null : m, ficha: null }) })),
      ofertas: OFERTAS, noticias: NOTICIAS.map(n => ({ ...n, foto: foto(NOTI_Q[n.cat]), icono: 'assets/iconos/' + n.cat.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() + '.svg' })), financieras: FIN,
      reqTabs: REQ.map(r => ({ label: r.tab, active: r.id === st.req, inactive: r.id !== st.req, pick: () => set({ req: r.id }), ir: () => set({ req: r.id, page: 'req', menu: false }) })),
      reqOpts: REQ.map(r => ({ id: r.id, label: r.tab })), reqSel: st.req, onReqSel: e => set({ req: e.target.value }),
      req: { titulo: req.titulo, para: req.para, cond: req.cond.map(t => ({ t })),
        docs: req.docs.map((t, i) => ({ t, n: String(i + 1).padStart(2, '0'), on: !!ck[i], off: !ck[i], toggle: () => set({ checks: { ...st.checks, [req.id]: { ...ck, [i]: !ck[i] } } }) })) },
      reqProgreso: hechos + ' de ' + req.docs.length, reqPct: Math.round(hechos / req.docs.length * 100) + '%',
      reqListo: hechos === req.docs.length, reqFalta: hechos !== req.docs.length
    };
  }
  window.AO = { initState, vals, MARCAS };
})();
