#!/usr/bin/env python3
"""Sincroniza las listas desplegables de Marca y Tipo (en .pages.yml) con los datos del sitio.

Marca  <- nombres de opciones/data/marcas.json
Tipo   <- 'Tipos de auto' de opciones/data/sitio.json (grupo Filtros)

Uso:
    python3 tools/sincronizar-listas.py            # actualiza .pages.yml y opciones/.pages.yml
    python3 tools/sincronizar-listas.py --revisar  # solo informa; termina con código 1 si hay diferencias

Ejecútalo después de agregar, quitar o renombrar una marca o un tipo, y sube el cambio al repositorio.
"""
import argparse, json, os, re, sys

ap = argparse.ArgumentParser()
ap.add_argument('--raiz', default='.', help='carpeta raíz del repositorio')
ap.add_argument('--revisar', action='store_true', help='solo revisar, sin escribir')
a = ap.parse_args()
R = a.raiz

def leer_json(ruta):
    with open(os.path.join(R, ruta), encoding='utf-8') as f:
        return json.load(f)

def uno(x):
    return (x[0] if x else {}) if isinstance(x, list) else (x or {})

marcas = [m['nombre'] for m in leer_json('opciones/data/marcas.json')['marcas'] if m.get('nombre')]
tipos = [t for t in uno(leer_json('opciones/data/sitio.json').get('filtros')).get('tipos', []) if t]

def yaml_texto(v):
    return json.dumps(v, ensure_ascii=False) if re.search(r'[:#\[\]{},&*!|>\'"%@`]|^\s|\s$|^-', v) else v

def reemplazar(lineas, campo, valores):
    """Cambia la lista `values:` del campo select con ese nombre. Devuelve (lineas, añadidas, quitadas)."""
    for i, l in enumerate(lineas):
        if re.match(r'^\s*- name: %s\s*$' % re.escape(campo), l):
            break
    else:
        sys.exit('No encontré el campo "%s" en .pages.yml' % campo)
    j = next(k for k in range(i, len(lineas)) if lineas[k].strip() == 'values:')
    base = len(lineas[j]) - len(lineas[j].lstrip())
    k = j + 1
    while k < len(lineas) and lineas[k].strip().startswith('- ') and len(lineas[k]) - len(lineas[k].lstrip()) > base:
        k += 1
    actuales = [re.sub(r'^\s*- ', '', x).strip().strip('"') for x in lineas[j + 1:k]]
    nuevas = [' ' * (base + 2) + '- ' + yaml_texto(v) for v in valores]
    return lineas[:j + 1] + nuevas + lineas[k:], [v for v in valores if v not in actuales], [v for v in actuales if v not in valores]

ruta = os.path.join(R, '.pages.yml')
with open(ruta, encoding='utf-8') as f:
    texto = f.read()
lineas = texto.split('\n')
lineas, am, qm = reemplazar(lineas, 'marca', marcas)
lineas, at, qt = reemplazar(lineas, 'tipo', tipos)
nuevo = '\n'.join(lineas)
print('Marcas: +%s -%s | Tipos: +%s -%s' % (am or '0', qm or '0', at or '0', qt or '0'))
if nuevo == texto:
    print('Todo sincronizado.'); sys.exit(0)
if a.revisar:
    print('Hay diferencias: ejecuta este script sin --revisar.'); sys.exit(1)
with open(ruta, 'w', encoding='utf-8') as f:
    f.write(nuevo)
with open(os.path.join(R, 'opciones/.pages.yml'), 'w', encoding='utf-8') as f:
    f.write(nuevo.replace('opciones/assets', 'assets').replace('opciones/data/', 'data/'))
print('Actualizados .pages.yml y opciones/.pages.yml')
