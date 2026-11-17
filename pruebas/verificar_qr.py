#!/usr/bin/env python3
"""Comprueba la hoja de QR: tamaño de página, y que cada sticker se lea y
apunte a la dirección correcta (se rasteriza el PDF y se decodifica cada QR)."""
import sys
import cv2, numpy as np, pymupdf, zxingcpp

BASE = sys.argv[1] if len(sys.argv) > 1 else "https://juansosaaa.github.io/r/"
PDF = "imprimir/hoja-qr-001-050.pdf"
DPI = 600
doc = pymupdf.open(PDF)
assert len(doc) == 1, "debe tener 1 página"
pg = doc[0]
w_mm, h_mm = pg.rect.width / 72 * 25.4, pg.rect.height / 72 * 25.4
assert abs(w_mm - 215.9) < 0.1 and abs(h_mm - 279.4) < 0.1, (w_mm, h_mm)
pix = pg.get_pixmap(dpi=DPI)
img = np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width, pix.n)
gris = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
px = DPI / 25.4
x0 = (215.9 - 7 * 28) / 2 + 2
mal = []
for i in range(50):
    col, fila = i % 7, i // 7
    x, y = x0 + col * 28, 20 + fila * 28
    rec = gris[int((y + 0.3) * px):int((y + 23.7) * px), int((x + 0.3) * px):int((x + 23.7) * px)]
    esperado = "%s?c=%03d" % (BASE, i + 1)
    # se lee a 300 y a 150 ppp (150 ppp ≈ una foto de celular poco nítida)
    for escala in (0.5, 0.25):
        r = cv2.resize(rec, None, fx=escala, fy=escala, interpolation=cv2.INTER_AREA)
        res = zxingcpp.read_barcodes(r)
        if len(res) != 1 or res[0].text != esperado:
            mal.append((i + 1, escala, [x.text for x in res]))
        elif escala == 0.5:
            p = res[0].position
            lado = (p.top_right.x - p.top_left.x) / px / escala
            if abs(lado - 17) > 0.4:
                mal.append((i + 1, "lado QR mm", round(float(lado), 2)))
    # el número impreso
    txt_pdf = pg.get_text("text", clip=pymupdf.Rect(x / 25.4 * 72, y / 25.4 * 72, (x + 24) / 25.4 * 72, (y + 24) / 25.4 * 72)).strip()
    if txt_pdf != "%03d" % (i + 1):
        mal.append((i + 1, "número", txt_pdf))
print("página %.1f x %.1f mm" % (w_mm, h_mm))
print("FALLOS:", mal) if mal else print("OK: 50/50 QR leídos, con número y dirección correctos")
cv2.imwrite(sys.argv[2], gris[::4, ::4]) if len(sys.argv) > 2 else None
sys.exit(1 if mal else 0)
