#!/usr/bin/env python3
"""Arma data/autos.json (lo que lee el portal) a partir de un archivo por auto en data/autos/<marca>/ (una carpeta por marca).

Uso:
    python3 tools/generar-autos.py            # escribe data/autos.json
    python3 tools/generar-autos.py --revisar  # solo revisa; termina con código 1 si autos.json no coincide

Los archivos de data/autos/ son la fuente: se editan en el CMS (colección Autos). autos.json se genera
solo (GitHub Action "Generar autos.json"); no se edita a mano.
Orden: por el campo "orden" (menor primero; los que no lo traen van después), luego marca, modelo, precio y versión.
El campo "orden" solo sirve para esto y no se copia a autos.json.
"""
import argparse, glob, json, os, sys

ap = argparse.ArgumentParser()
ap.add_argument('--raiz', default='.', help='carpeta raíz del repositorio')
ap.add_argument('--revisar', action='store_true', help='solo revisar, sin escribir')
a = ap.parse_args()
carpeta = os.path.join(a.raiz, 'data/autos')
destino = os.path.join(a.raiz, 'data/autos.json')

autos, errores, ids = [], [], {}
for ruta in sorted(glob.glob(os.path.join(carpeta, '**', '*.json'), recursive=True)):
    nombre = os.path.relpath(ruta, carpeta)
    base = os.path.basename(ruta)
    try:
        with open(ruta, encoding='utf-8') as f:
            x = json.load(f)
    except ValueError as e:
        errores.append('%s: JSON inválido (%s)' % (nombre, e)); continue
    if not isinstance(x, dict) or not x.get('id'):
        errores.append('%s: falta el campo id' % nombre); continue
    if base != x['id'] + '.json':
        errores.append('%s: el nombre del archivo debe ser %s.json' % (nombre, x['id']))
    if x['id'] in ids:
        errores.append('%s: el id "%s" ya lo usa %s' % (nombre, x['id'], ids[x['id']]))
    ids[x['id']] = nombre
    autos.append(x)
if errores:
    sys.exit('No se generó autos.json:\n  ' + '\n  '.join(errores))
if not autos:
    sys.exit('No hay autos en %s; no se toca autos.json.' % carpeta)

def clave(x):
    o = x.get('orden')
    return (o if isinstance(o, (int, float)) else 10**9, str(x.get('marca', '')), str(x.get('modelo', '')), x.get('precio') or 0, str(x.get('version', '')))

autos.sort(key=clave)
salida = {'autos': [{k: v for k, v in x.items() if k != 'orden'} for x in autos]}
texto = json.dumps(salida, ensure_ascii=False, indent=2)
actual = open(destino, encoding='utf-8').read() if os.path.exists(destino) else ''
if actual.rstrip('\n') == texto:
    print('autos.json ya está al día (%d autos).' % len(autos)); sys.exit(0)
if a.revisar:
    print('autos.json no coincide con data/autos/. Ejecuta: python3 tools/generar-autos.py'); sys.exit(1)
with open(destino, 'w', encoding='utf-8') as f:
    f.write(texto + ('\n' if actual.endswith('\n') else ''))
print('Escribí %s con %d autos.' % (destino, len(autos)))
