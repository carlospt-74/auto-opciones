#!/usr/bin/env python3
"""Reduce el peso de las fotos JPG/JPEG de una carpeta (por defecto opciones/assets/fotos).

Uso:   python3 tools/optimizar-fotos.py [carpeta] [--ancho 1600] [--calidad 82] [--solo-mayores-a 150]
Requiere Pillow (pip install pillow). Solo toca archivos .jpg/.jpeg; no cambia nombres ni rutas.
Las fotos PNG/WEBP se listan para que las conviertas a JPG si pesan mucho.
"""
import argparse, os, sys
from PIL import Image, ImageOps

ap = argparse.ArgumentParser()
ap.add_argument('carpeta', nargs='?', default='opciones/assets/fotos')
ap.add_argument('--ancho', type=int, default=1600, help='ancho máximo en px')
ap.add_argument('--calidad', type=int, default=82)
ap.add_argument('--solo-mayores-a', type=int, default=150, help='solo archivos de más de N KB')
a = ap.parse_args()

total_antes = total_despues = 0
for nombre in sorted(os.listdir(a.carpeta)):
    ruta = os.path.join(a.carpeta, nombre); ext = nombre.lower().rsplit('.', 1)[-1]
    kb = os.path.getsize(ruta) // 1024
    if ext in ('png', 'webp') and kb > a.solo_mayores_a:
        print(f'AVISO  {nombre}: {kb} KB (conviene guardarla como JPG)'); continue
    if ext not in ('jpg', 'jpeg') or kb <= a.solo_mayores_a:
        continue
    im = ImageOps.exif_transpose(Image.open(ruta)).convert('RGB')
    if im.width > a.ancho:
        im = im.resize((a.ancho, round(im.height * a.ancho / im.width)), Image.LANCZOS)
    tmp = ruta + '.tmp'
    im.save(tmp, 'JPEG', quality=a.calidad, optimize=True, progressive=True)
    nuevo = os.path.getsize(tmp) // 1024
    if nuevo < kb:
        os.replace(tmp, ruta); print(f'OK     {nombre}: {kb} KB → {nuevo} KB'); total_antes += kb; total_despues += nuevo
    else:
        os.remove(tmp); print(f'IGUAL  {nombre}: ya estaba optimizada ({kb} KB)')
if total_antes: print(f'Ahorro total: {total_antes - total_despues} KB')
