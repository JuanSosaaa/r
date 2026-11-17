#!/usr/bin/env python3
"""Genera la hoja de 50 stickers QR numerados (PDF tamaño carta).

Uso:
    pip install qrcode reportlab
    python3 herramientas/generar_qr.py --base https://juansosaaa.github.io/r/

Cada sticker mide 24 x 24 mm (línea de corte gris) y lleva el QR y su número.
"""
import argparse

import qrcode
from qrcode.constants import ERROR_CORRECT_M, ERROR_CORRECT_Q, ERROR_CORRECT_H
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

STICKER = 24.0   # lado del sticker (mm)
QR = 17.0        # lado del QR (mm); el borde blanco del sticker es su zona de silencio
PASO = 28.0      # distancia entre stickers (mm)
COLUMNAS = 7


def matriz(url):
    """QR lo más pequeño posible y, sin crecer, con la mayor corrección de errores."""
    base = qrcode.QRCode(error_correction=ERROR_CORRECT_M, border=0)
    base.add_data(url)
    base.make(fit=True)
    mejor = base
    for nivel in (ERROR_CORRECT_Q, ERROR_CORRECT_H):
        q = qrcode.QRCode(error_correction=nivel, border=0)
        q.add_data(url)
        q.make(fit=True)
        if q.version == base.version:
            mejor = q
    return mejor.get_matrix()


def generar(base, salida, desde=1, hasta=50):
    if not base.endswith("/"):
        base += "/"
    ancho, alto = letter
    c = canvas.Canvas(salida, pagesize=letter)
    c.setTitle("Stickers QR %03d-%03d" % (desde, hasta))
    c.setAuthor("")

    x0 = (ancho / mm - COLUMNAS * PASO) / 2 + (PASO - STICKER) / 2
    y_sup = alto / mm - 20.0  # borde superior de la primera fila

    c.setFont("Helvetica-Bold", 9)
    c.drawString(x0 * mm, (alto / mm - 11) * mm,
                 "Stickers QR %03d–%03d · 24 × 24 mm" % (desde, hasta))
    c.setFont("Helvetica", 7.5)
    c.drawString(x0 * mm, (alto / mm - 15) * mm,
                 "Imprimir en papel adhesivo blanco, tamaño carta, al 100 % (tamaño real, SIN «ajustar a la página»). "
                 "Cortar por la línea gris.")

    for i, n in enumerate(range(desde, hasta + 1)):
        col, fila = i % COLUMNAS, i // COLUMNAS
        x = x0 + col * PASO
        y = y_sup - fila * PASO - STICKER  # esquina inferior izquierda
        # línea de corte
        c.setStrokeGray(0.6)
        c.setLineWidth(0.25)
        c.rect(x * mm, y * mm, STICKER * mm, STICKER * mm, stroke=1, fill=0)
        # QR
        m = matriz("%s?c=%03d" % (base, n))
        mod = QR / len(m)
        qx = x + (STICKER - QR) / 2
        qy_sup = y + STICKER - 2.0
        c.setFillGray(0)
        for r, fila_m in enumerate(m):
            k = 0
            while k < len(fila_m):  # une módulos seguidos para evitar rayas blancas
                if fila_m[k]:
                    j = k
                    while j < len(fila_m) and fila_m[j]:
                        j += 1
                    c.rect((qx + k * mod) * mm, (qy_sup - (r + 1) * mod) * mm,
                           (j - k) * mod * mm, mod * mm, stroke=0, fill=1)
                    k = j
                else:
                    k += 1
        # número
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString((x + STICKER / 2) * mm, (y + 1.2) * mm, "%03d" % n)

    # regla de comprobación en el espacio libre de la última fila
    filas = (hasta - desde) // COLUMNAS + 1
    usados = (hasta - desde + 1) % COLUMNAS
    rx = x0 + (usados * PASO if usados else 0)
    ry = y_sup - (filas - 1 if usados else filas) * PASO - 10
    c.setStrokeGray(0)
    c.setLineWidth(0.4)
    c.line(rx * mm, ry * mm, (rx + 50) * mm, ry * mm)
    for t in (0, 50):
        c.line((rx + t) * mm, (ry - 1.5) * mm, (rx + t) * mm, (ry + 1.5) * mm)
    c.setFont("Helvetica", 7.5)
    c.setFillGray(0)
    c.drawString(rx * mm, (ry - 5) * mm, "Comprobación: esta línea debe medir exactamente 50 mm.")
    c.drawString(rx * mm, (ry - 8.5) * mm, "Si mide menos, se imprimió reducido: repetir al 100 %.")
    c.drawString(rx * mm, (ry - 14) * mm, "Los QR abren: %s?c=NNN" % base)
    c.showPage()
    c.save()


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--base", required=True, help="p. ej. https://juansosaaa.github.io/r/")
    p.add_argument("--salida", default="imprimir/hoja-qr-001-050.pdf")
    p.add_argument("--desde", type=int, default=1)
    p.add_argument("--hasta", type=int, default=50)
    a = p.parse_args()
    generar(a.base, a.salida, a.desde, a.hasta)
    print("Listo:", a.salida)
