# Habladores de reseñas — sistema de redirección

Cada hablador tiene un código (001 a 050). El chip NFC y el QR abren
`https://juansosaaa.github.io/r/?c=017` y esta página manda al cliente directo
a escribir la reseña en Google del negocio que tenga asignado ese código.

| Para qué | Dónde |
|---|---|
| Ver qué códigos están activos y probarlos | <https://juansosaaa.github.io/r/panel/> |
| Asignar o cambiar un negocio | <https://github.com/JuanSosaaa/r/edit/main/codigos.json> |
| Guía de instalación (1 página) | [`imprimir/guia-instalacion.pdf`](imprimir/guia-instalacion.pdf) |
| Hoja de 50 stickers QR | [`imprimir/hoja-qr-001-050.pdf`](imprimir/hoja-qr-001-050.pdf) |
| Contador de aperturas (opcional) | [`contador/INSTRUCCIONES.md`](contador/INSTRUCCIONES.md) |

Guarda las dos primeras direcciones en la pantalla de inicio del celular.

## Puesta en marcha (una sola vez)

1. En GitHub abre el repositorio → **Settings → Pages**.
2. En **Source** elige **Deploy from a branch**; rama **main**, carpeta
   **/ (root)**; **Save**.
3. Espera 1–2 minutos y abre <https://juansosaaa.github.io/r/panel/>. Debe
   mostrar «0 activos · 50 libres».

## Asignar un código a un negocio (desde el celular)

1. Abre <https://github.com/JuanSosaaa/r/edit/main/codigos.json> (con tu
   sesión de GitHub iniciada).
2. Busca la línea del código, por ejemplo:

   ```
   "017": { "negocio": "", "url": "" },
   ```

3. Escribe el nombre entre las primeras comillas y pega el enlace de reseña
   entre las segundas. No toques nada más de la línea:

   ```
   "017": { "negocio": "Café La Plaza", "url": "https://g.page/r/XXXXXXXX/review" },
   ```

4. Toca **Commit changes…** (botón verde, arriba) y otra vez
   **Commit changes** en la ventana que sale.
5. Espera 1–2 minutos, abre el [panel](https://juansosaaa.github.io/r/panel/),
   confirma que el 017 sale **Activo** y toca **Probar**: debe abrir la
   reseña de ese negocio.

**Cambiar** a dónde apunta un hablador: mismo procedimiento, reemplazando
nombre y enlace. **Liberar** un código: deja las dos comillas vacías (`""`).
No hay que tocar el chip ni el QR.

### Si algo sale mal

- El panel dice **«codigos.json tiene un error»**: mientras dure, ningún
  hablador funciona. Vuelve a abrir el archivo y revisa la línea que editaste:
  cada texto entre comillas, dos puntos después de `"negocio"` y `"url"`, y
  coma al final de la línea (menos en la 050). Si no encuentras el error, en
  GitHub entra a **History**, abre tu último cambio y usa **Revert**.
- Un código sale **«Revisar»**: el enlace no es de Google o quedó cortado al
  pegarlo. Solo se aceptan enlaces `https://` de `g.page`, `google.com`,
  `maps.app.goo.gl` y similares.
- El nombre del negocio no puede llevar comillas dobles (`"`).
- El nombre del negocio es visible para cualquiera que abra el panel o el
  archivo; no escribas ahí teléfonos ni datos privados.

## Reglas que no se pueden romper

- **Sin filtro de reseñas.** La página manda a *todas* las personas directo a
  Google, sin preguntar antes si la experiencia fue buena o mala. Google
  prohíbe desviar a los clientes insatisfechos, y por eso no existe (ni debe
  añadirse) una pantalla previa de «¿cómo te fue?».
- Tampoco se pueden ofrecer descuentos o regalos a cambio de reseñas. Díselo
  a cada negocio al entregar el hablador.
- **No cambies el nombre de la cuenta `JuanSosaaa` ni del repositorio `r`.**
  Esa dirección está grabada en los chips y en los QR impresos.

## Más códigos (051 en adelante)

1. Añade las líneas nuevas a `codigos.json` con el mismo formato.
2. Genera otra hoja de stickers en un computador:

   ```bash
   pip install qrcode reportlab
   python3 herramientas/generar_qr.py --base https://juansosaaa.github.io/r/ --desde 51 --hasta 100 --salida imprimir/hoja-qr-051-100.pdf
   ```

## Archivos

- `index.html`: la redirección. `comun.js`: validaciones compartidas.
- `codigos.json`: qué negocio tiene cada código.
- `config.js`: dirección del contador (vacía = apagado).
- `panel/`: tablero de estado.
- `pruebas/`: pruebas automáticas (`pruebas/LEEME.md`).
