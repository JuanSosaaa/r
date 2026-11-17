# Pruebas

Se ejecutan en un computador con Node.js, Playwright y Python.

```bash
node pruebas/sitio.js
```

```bash
node pruebas/sitio.js https://juansosaaa.github.io/r/
```

```bash
node pruebas/contador.js
```

```bash
pip install pymupdf opencv-python-headless zxing-cpp numpy
python3 pruebas/verificar_qr.py
```

- `sitio.js`: abre la página en un navegador real con códigos de prueba
  (asignado, libre, enlace malo, archivo dañado, contador). Con una dirección
  como argumento prueba el sitio ya publicado.
- `contador.js`: lógica del contador con una hoja de cálculo simulada.
- `verificar_qr.py`: lee los 50 QR del PDF y comprueba número y dirección.
