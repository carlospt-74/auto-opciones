#!/usr/bin/env python3
"""Revisa los precios de data/autos.json contra la versión anterior.

Falla (código 1) si algún precio sale del rango permitido o cambia más del umbral.
Uso: revisar_precios.py ANTERIOR.json NUEVO.json   (ANTERIOR puede no existir)
"""
import json, os, sys

MIN, MAX, UMBRAL = 100_000, 15_000_000, 0.25  # mismos límites que tools/importar-autos.py


def cargar(ruta):
    if not ruta or not os.path.exists(ruta):
        return {}
    try:
        with open(ruta, encoding='utf-8') as f:
            autos = json.load(f).get('autos', [])
    except (ValueError, AttributeError):
        return {}
    return {a.get('id') or '%s %s %s' % (a.get('marca'), a.get('modelo'), a.get('version')): a for a in autos}


def main():
    antes, ahora = cargar(sys.argv[1]), cargar(sys.argv[2])
    if not ahora:
        print('::error::No se pudo leer autos.json o no tiene autos.')
        return 1
    hallazgos = []
    for clave, a in ahora.items():
        nombre = ' '.join(str(a.get(k) or '') for k in ('marca', 'modelo', 'version')).strip() or clave
        p = a.get('precio')
        if not isinstance(p, (int, float)) or isinstance(p, bool):
            hallazgos.append('%s: el precio no es un número (%r)' % (nombre, p))
            continue
        if not MIN <= p <= MAX:
            hallazgos.append('%s: precio fuera de rango (%s; se permite de %s a %s)' % (nombre, format(p, ','), format(MIN, ','), format(MAX, ',')))
        previo = (antes.get(clave) or {}).get('precio')
        if isinstance(previo, (int, float)) and previo > 0 and abs(p - previo) / previo > UMBRAL:
            hallazgos.append('%s: el precio cambió más de %d%% (%s → %s)' % (nombre, UMBRAL * 100, format(previo, ','), format(p, ',')))
    if not hallazgos:
        print('Precios revisados: sin hallazgos (%d autos).' % len(ahora))
        return 0
    print('REVISA ESTOS PRECIOS:')
    for h in hallazgos:
        print(' - ' + h)
        print('::error::' + h)
    return 1


if __name__ == '__main__':
    sys.exit(main())
