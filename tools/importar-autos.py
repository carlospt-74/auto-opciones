#!/usr/bin/env python3
"""Pasa una hoja de cálculo (Excel o CSV) con autos a data/autos/<marca>/ (un archivo por auto) y regenera autos.json.

Uso:
    python3 tools/importar-autos.py --plantilla hoja.xlsx      # crea la plantilla vacía para llenar
    python3 tools/importar-autos.py hoja.xlsx                  # solo revisa: muestra qué agregaría y cambiaría
    python3 tools/importar-autos.py hoja.xlsx --aplicar        # escribe data/autos/*.json y regenera autos.json

Reglas:
  * Una fila = una versión de auto. Las filas vacías o que empiezan con # se ignoran.
  * Si el auto ya existe (mismo id, o misma marca + modelo + versión), solo se cambian las celdas que traigan valor;
    una celda vacía NUNCA borra un dato. No se tocan la foto, el enfoque de la foto ni "mostrar" de un auto existente.
  * Un auto nuevo entra con "mostrar" apagado si no tiene foto (el CMS exige foto). Se enciende en el CMS al subirla.
  * Si hay errores en alguna fila no se aplica nada (usa --ignorar-errores para aplicar solo las filas buenas).
Requiere openpyxl solo para leer o crear archivos .xlsx (pip install openpyxl). Los .csv no lo necesitan.
"""
import argparse, csv, difflib, glob, json, os, re, subprocess, sys, unicodedata

COLUMNAS = [  # (nombre en la hoja, campo en autos.json, ayuda)
    ('marca', 'marca', 'Elige de la lista. Obligatoria.'),
    ('modelo', 'modelo', 'Ej. RAV4. Obligatoria.'),
    ('version', 'version', 'Versión o acabado. Ej. XLE Híbrida. Obligatoria.'),
    ('año', 'anio', 'Año modelo. Ej. 2026.'),
    ('tipo', 'tipo', 'Elige de la lista: SUV, Sedán, Hatchback, Pickup. Obligatorio en autos nuevos.'),
    ('precio', 'precio', 'Precio de lista en pesos. Ej. 689900. Obligatorio.'),
    ('vigencia', 'vigencia', 'Fecha o mes del que es el precio. Ej. octubre de 2026.'),
    ('motor', 'motor', 'Ej. 2.5 L híbrido.'),
    ('hp', 'hp', 'Potencia en hp. Solo el número.'),
    ('transmisión', 'trans', 'Ej. Automática CVT.'),
    ('tracción', 'traccion', 'Ej. FWD, AWD, 4x4.'),
    ('rendimiento km/l', 'rend', 'Combinado, en km por litro. Ej. 15.4'),
    ('pasajeros', 'pas', 'Número de pasajeros (1 a 9).'),
    ('cajuela l', 'cajuela', 'Capacidad de cajuela en litros.'),
    ('bolsas de aire', 'bolsas', 'Número de bolsas de aire.'),
    ('foto', 'foto', 'Ruta de la foto ya subida. Ej. assets/fotos/rav4-1.jpg. Normalmente se deja vacía.'),
    ('id', 'id', 'Normalmente vacío: se crea solo. Solo minúsculas, números y guiones.'),
    ('fuente', None, 'De dónde salió el dato (agencia, documento, fecha). No se guarda en el portal.'),
    ('notas', None, 'Tus notas. No se guardan en el portal.'),
]
ALIAS = {  # nombre normalizado -> campo
    'ano': 'anio', 'anio': 'anio', 'anomodelo': 'anio', 'modeloano': 'anio',
    'carroceria': 'tipo', 'tipodeauto': 'tipo', 'tipodecarroceria': 'tipo',
    'preciodelista': 'precio', 'preciolista': 'precio', 'preciomxn': 'precio',
    'vigenciadelprecio': 'vigencia', 'preciovigenteal': 'vigencia', 'fecha': 'vigencia',
    'transmision': 'trans', 'caja': 'trans', 'traccion': 'traccion', 'potencia': 'hp', 'potenciahp': 'hp',
    'rendimiento': 'rend', 'rendimientokml': 'rend', 'kml': 'rend', 'pasajeros': 'pas', 'plazas': 'pas',
    'cajuela': 'cajuela', 'cajuelal': 'cajuela', 'cajuelalitros': 'cajuela',
    'bolsas': 'bolsas', 'bolsasdeaire': 'bolsas', 'airbags': 'bolsas', 'fuente': 'fuente', 'notas': 'notas',
    'nota': 'notas', 'foto': 'foto', 'id': 'id', 'marca': 'marca', 'modelo': 'modelo', 'version': 'version',
    'tipo': 'tipo', 'precio': 'precio', 'vigencia': 'vigencia', 'motor': 'motor', 'hp': 'hp', 'trans': 'trans',
    'rend': 'rend', 'pas': 'pas',
}
ORDEN_NUEVO = ['id', 'marca', 'modelo', 'version', 'anio', 'tipo', 'precio', 'vigencia', 'foto', 'enfoque_foto', 'mostrar',
               'motor', 'hp', 'trans', 'traccion', 'rend', 'pas', 'cajuela', 'bolsas']
ENTEROS = {'anio', 'precio', 'hp', 'pas', 'cajuela', 'bolsas'}


def norm(x):
    x = unicodedata.normalize('NFD', str(x or '')).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '', x)


def slug(x):
    x = unicodedata.normalize('NFD', str(x or '')).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', x).strip('-')[:60]


def numero(txt, decimal=False):
    """Extrae un número de un texto como '$689,900', '219 hp' o '15,4 km/l'. Devuelve None si no hay."""
    t = str(txt).strip()
    m = re.search(r'-?\d[\d.,]*', t)
    if not m:
        return None
    s = m.group(0).rstrip('.,')
    if decimal:
        if '.' not in s and re.fullmatch(r'\d+,\d{1,2}', s):
            s = s.replace(',', '.')
        else:
            s = s.replace(',', '')
        return float(s)
    s = s.replace(',', '')
    if re.fullmatch(r'\d+\.\d{1,2}', s):  # 689900.00 -> 689900
        s = s.split('.')[0]
    elif '.' in s:  # 689.900 (punto de miles)
        s = s.replace('.', '')
    return int(s)


def leer_json(ruta):
    with open(ruta, encoding='utf-8') as f:
        return json.load(f)


def leer_hoja(ruta):
    ext = ruta.lower().rsplit('.', 1)[-1]
    if ext == 'csv':
        with open(ruta, encoding='utf-8-sig', newline='') as f:
            muestra = f.read(4096); f.seek(0)
            delim = ';' if muestra.count(';') > muestra.count(',') else ','
            return list(csv.reader(f, delimiter=delim))
    if ext in ('xlsx', 'xlsm'):
        try:
            import openpyxl
        except ImportError:
            sys.exit('Para leer .xlsx instala openpyxl:  pip install openpyxl   (o guarda la hoja como .csv)')
        wb = openpyxl.load_workbook(ruta, read_only=True, data_only=True)
        ws = wb['Autos'] if 'Autos' in wb.sheetnames else wb.worksheets[0]
        return [['' if c is None else c for c in fila] for fila in ws.iter_rows(values_only=True)]
    sys.exit('Formato no soportado: usa .xlsx o .csv')


def crear_plantilla(ruta, marcas, tipos):
    try:
        import openpyxl
        from openpyxl.comments import Comment
        from openpyxl.styles import Font, PatternFill, Alignment
        from openpyxl.worksheet.datavalidation import DataValidation
    except ImportError:
        sys.exit('Para crear la plantilla instala openpyxl:  pip install openpyxl')
    wb = openpyxl.Workbook()
    ws = wb.active; ws.title = 'Autos'
    ws.append([c[0] for c in COLUMNAS])
    azul = PatternFill('solid', fgColor='1F3466')
    for i, (nombre, campo, ayuda) in enumerate(COLUMNAS, 1):
        c = ws.cell(row=1, column=i)
        c.font = Font(bold=True, color='FFFFFF'); c.fill = azul; c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        c.comment = Comment(ayuda, 'Auto-Opciones')
        ws.column_dimensions[c.column_letter].width = max(12, min(26, len(nombre) + 6))
    ws.row_dimensions[1].height = 32; ws.freeze_panes = 'A2'
    lis = wb.create_sheet('Listas')
    lis['A1'] = 'Marcas'; lis['B1'] = 'Tipos'
    for i, m in enumerate(marcas, 2): lis.cell(row=i, column=1, value=m)
    for i, t in enumerate(tipos, 2): lis.cell(row=i, column=2, value=t)
    dv_m = DataValidation(type='list', formula1="=Listas!$A$2:$A$%d" % (len(marcas) + 1), allow_blank=True)
    dv_t = DataValidation(type='list', formula1="=Listas!$B$2:$B$%d" % (len(tipos) + 1), allow_blank=True)
    ws.add_data_validation(dv_m); ws.add_data_validation(dv_t)
    dv_m.add('A2:A500'); dv_t.add('E2:E500')
    ins = wb.create_sheet('Instrucciones', 0)
    for fila in [
        ['Hoja para agregar o actualizar autos en el portal Auto-Opciones'], [''],
        ['1. Llena la hoja "Autos": una fila por versión de auto. Marca, modelo, versión y precio son obligatorios.'],
        ['2. Marca y tipo se eligen de la lista desplegable.'],
        ['3. Deja vacío lo que no sepas: no se inventa ni se borra nada con una celda vacía.'],
        ['4. En "vigencia" anota de qué fecha o mes es el precio, y en "fuente" de dónde lo sacaste.'],
        ['5. Las filas que empiezan con # se ignoran.'],
        ['6. Esta hoja NO sube las fotos. Las fotos se suben aparte en el CMS.'],
        ['7. Antes de publicar se revisa lo que cambiaría. Nada se publica automáticamente.'],
    ]: ins.append(fila)
    ins['A1'].font = Font(bold=True, size=14); ins.column_dimensions['A'].width = 100
    wb.save(ruta)
    print('Plantilla creada:', ruta)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('hoja', nargs='?', help='archivo .xlsx o .csv con los autos')
    ap.add_argument('--raiz', default='.', help='carpeta raíz del repositorio')
    ap.add_argument('--aplicar', action='store_true', help='escribe los archivos de data/autos/ y regenera autos.json (sin esto solo revisa)')
    ap.add_argument('--ignorar-errores', action='store_true', help='aplica las filas buenas aunque otras tengan errores')
    ap.add_argument('--plantilla', metavar='ARCHIVO.xlsx', help='crea la plantilla vacía y termina')
    a = ap.parse_args()
    R = a.raiz
    marcas = [m['nombre'] for m in leer_json(os.path.join(R, 'data/marcas.json'))['marcas'] if m.get('nombre')]
    sitio = leer_json(os.path.join(R, 'data/sitio.json'))
    f0 = sitio.get('filtros'); f0 = (f0[0] if isinstance(f0, list) and f0 else f0) or {}
    tipos = [t for t in f0.get('tipos', []) if t]
    if a.plantilla:
        return crear_plantilla(a.plantilla, marcas, tipos)
    if not a.hoja:
        ap.error('indica la hoja .xlsx o .csv (o usa --plantilla)')

    carpeta_autos = os.path.join(R, 'data/autos')
    if not os.path.isdir(carpeta_autos):
        sys.exit('No encuentro data/autos/<marca>/ (un archivo por auto).')
    archivos = sorted(glob.glob(os.path.join(carpeta_autos, '**', '*.json'), recursive=True))
    autos = [leer_json(f) for f in archivos]
    rutas = {x['id']: f for x, f in zip(autos, archivos)}
    tocados = set()
    por_marca = {norm(m): m for m in marcas}
    por_tipo = {norm(t): t for t in tipos}
    por_tipo.update({'pickup': 'Pickup', 'pickups': 'Pickup', 'suv': 'SUV', 'sedan': 'Sedán', 'hatchback': 'Hatchback'})
    por_tipo = {k: v for k, v in por_tipo.items() if v in tipos}

    filas = leer_hoja(a.hoja)
    i0 = next((i for i, f in enumerate(filas) if any(str(c).strip() for c in f)), None)
    if i0 is None:
        sys.exit('La hoja está vacía.')
    cab = []
    for c in filas[i0]:
        campo = ALIAS.get(norm(c))
        cab.append(campo)
    desconocidas = [str(c) for c, k in zip(filas[i0], cab) if k is None and str(c).strip()]
    if desconocidas:
        print('Aviso: columnas ignoradas (no las reconozco):', ', '.join(desconocidas))
    if 'marca' not in cab or 'modelo' not in cab or 'precio' not in cab:
        sys.exit('Faltan columnas obligatorias: marca, modelo y precio.')

    clave = lambda x: (norm(x['marca']), norm(x['modelo']), norm(x.get('version', '')))
    existentes_id = {x['id']: x for x in autos}
    existentes_clave = {clave(x): x for x in autos}
    errores, avisos, nuevos, cambios, vistos, ids_usados = [], [], [], [], set(), set(existentes_id)
    nuevos_dicts = []

    for n, fila in enumerate(filas[i0 + 1:], start=i0 + 2):
        celdas = {k: (str(v).strip() if v is not None else '') for k, v in zip(cab, fila) if k}
        if not any(celdas.values()) or str(fila[0]).strip().startswith('#'):
            continue
        err = lambda m: errores.append('Fila %d: %s' % (n, m))
        rotulo = ' '.join(x for x in [celdas.get('marca'), celdas.get('modelo'), celdas.get('version')] if x)
        # marca
        m = por_marca.get(norm(celdas.get('marca')))
        if not m:
            sug = difflib.get_close_matches(celdas.get('marca', ''), marcas, n=2, cutoff=0.5)
            err('marca "%s" no está en el portal%s' % (celdas.get('marca', ''), ' (¿%s?)' % ' o '.join(sug) if sug else '. Agrégala primero en Marcas del CMS'))
        if not celdas.get('modelo'):
            err('falta el modelo')
        # valores
        vals, bien = {}, True
        for campo in ['anio', 'precio', 'hp', 'pas', 'cajuela', 'bolsas', 'rend']:
            t = celdas.get(campo, '')
            if t == '':
                continue
            v = numero(t, decimal=(campo == 'rend'))
            if v is None:
                err('%s: "%s" no es un número' % (campo, t)); bien = False; continue
            vals[campo] = v
        for campo in ['version', 'vigencia', 'motor', 'trans', 'traccion', 'foto', 'id']:
            if celdas.get(campo):
                vals[campo] = celdas[campo]
        if celdas.get('tipo'):
            tp = por_tipo.get(norm(celdas['tipo']))
            if not tp:
                err('tipo "%s" no es válido (usa: %s)' % (celdas['tipo'], ', '.join(tipos)))
            else:
                vals['tipo'] = tp
        # rangos
        rangos = {'precio': (100000, 15000000, 'precio'), 'anio': (1990, 2100, 'año'), 'hp': (30, 1500, 'hp'),
                  'pas': (1, 9, 'pasajeros'), 'bolsas': (0, 20, 'bolsas de aire'), 'cajuela': (0, 5000, 'cajuela')}
        for campo, (lo, hi, nom) in rangos.items():
            if campo in vals and not (lo <= vals[campo] <= hi):
                err('%s fuera de rango (%s): %s' % (nom, '%d a %d' % (lo, hi), vals[campo]))
        if 'rend' in vals and not (3 <= vals['rend'] <= 60):
            avisos.append('Fila %d (%s): rendimiento %s km/l es raro, revísalo' % (n, rotulo, vals['rend']))
        if 'id' in vals and not re.fullmatch(r'[a-z0-9]+(-[a-z0-9]+)*', vals['id']):
            err('id "%s" no es válido (solo minúsculas, números y guiones)' % vals['id'])
        if not m or not celdas.get('modelo') or not bien or any(e.startswith('Fila %d:' % n) for e in errores):
            continue
        vals['marca'] = m; vals['modelo'] = celdas['modelo']
        rotulo = ' '.join(x for x in [m, vals['modelo'], vals.get('version')] if x)
        k = clave(vals) if 'version' in vals else (norm(m), norm(vals['modelo']), '')
        if vals.get('id') in existentes_id:
            ex = existentes_id[vals['id']]
        else:
            ex = existentes_clave.get(k)
        if k in vistos:
            err('está repetida en la hoja (%s)' % rotulo); continue
        vistos.add(k)
        if ex:
            dif = []
            for campo, v in vals.items():
                if campo in ('id', 'marca', 'modelo') or ex.get(campo) == v:
                    continue
                if campo == 'foto':
                    if v and not os.path.exists(os.path.join(R, v)):
                        avisos.append('Fila %d (%s): la foto "%s" no existe en el repositorio' % (n, rotulo, v))
                if campo == 'precio' and ex.get('precio') and abs(v - ex['precio']) / ex['precio'] > 0.25:
                    avisos.append('Fila %d (%s): el precio cambia más de 25%% (%s → %s), revísalo' % (n, rotulo, ex['precio'], v))
                dif.append((campo, ex.get(campo), v))
            if dif:
                cambios.append((rotulo, ex['id'], dif))
                if a.aplicar:
                    for campo, _, v in dif:
                        ex[campo] = v
                    tocados.add(ex['id'])
            continue
        # auto nuevo
        faltan = [c for c in ('version', 'tipo', 'precio') if c not in vals]
        if faltan:
            err('auto nuevo "%s": faltan %s' % (rotulo, ', '.join(faltan))); continue
        nid = vals.get('id') or slug(vals['modelo'])
        if nid in ids_usados:
            nid = slug('%s-%s' % (vals['modelo'], vals['version']))
        if nid in ids_usados:
            nid = slug('%s-%s-%s' % (m, vals['modelo'], vals['version']))
        base, c = nid, 2
        while nid in ids_usados:
            nid = '%s-%d' % (base, c); c += 1
        ids_usados.add(nid); vals['id'] = nid
        foto_ok = bool(vals.get('foto')) and os.path.exists(os.path.join(R, vals['foto']))
        if vals.get('foto') and not foto_ok:
            avisos.append('Fila %d (%s): la foto "%s" no existe en el repositorio; entra sin foto' % (n, rotulo, vals['foto'])); vals['foto'] = ''
        if not foto_ok:
            avisos.append('%s: entra con "mostrar" apagado porque no tiene foto (sube la foto en el CMS y enciéndelo)' % rotulo)
        vals['foto'] = vals.get('foto', '') if foto_ok else ''
        vals['enfoque_foto'] = 'centro'; vals['mostrar'] = foto_ok
        nuevo = {k2: vals[k2] for k2 in ORDEN_NUEVO if k2 in vals}
        nuevos.append(rotulo); nuevos_dicts.append(nuevo)

    # informe
    print('Hoja: %s' % a.hoja)
    print('Autos nuevos: %d | autos que cambian: %d | errores: %d | avisos: %d' % (len(nuevos), len(cambios), len(errores), len(avisos)))
    for r, d in zip(nuevos, nuevos_dicts):
        print('  + NUEVO  %-40s id=%-24s %s' % (r, d['id'], '$%s' % format(d['precio'], ',')))
    for r, i, dif in cambios:
        print('  ~ CAMBIA %s (id=%s)' % (r, i))
        for campo, antes, ahora in dif:
            print('        %-9s %s → %s' % (campo, '(vacío)' if antes in (None, '') else antes, ahora))
    for e in errores: print('  ERROR  ' + e)
    for v in avisos: print('  AVISO  ' + v)
    if errores and not a.ignorar_errores:
        print('\nNo se aplicó nada: corrige los errores en la hoja y vuelve a correr (o usa --ignorar-errores).')
        sys.exit(1)
    if not a.aplicar:
        print('\nSolo revisión. Para escribir los cambios, agrega --aplicar.')
        return
    for x in [x for x in autos if x['id'] in tocados] + nuevos_dicts:
        destino = rutas.get(x['id']) or os.path.join(carpeta_autos, slug(x['marca']), x['id'] + '.json')
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        with open(destino, 'w', encoding='utf-8') as f:
            json.dump(x, f, ensure_ascii=False, indent=2)
    subprocess.run([sys.executable, os.path.join(R, 'tools/generar-autos.py'), '--raiz', R], check=True)
    print('\nActualizados %d autos y creados %d en data/autos/ (%d en total).' % (len(tocados), len(nuevos_dicts), len(autos) + len(nuevos_dicts)))


if __name__ == '__main__':
    main()
