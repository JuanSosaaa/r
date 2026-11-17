# Contador de aperturas (opcional)

Cuenta cuántas veces se abrió cada hablador y lo guarda en una hoja de cálculo
de Google tuya. Es gratis. Se configura una sola vez, mejor desde un computador
(15 minutos).

> **Qué cuenta y qué no.** Cuenta *aperturas* (alguien acercó el celular o
> escaneó el QR), no reseñas escritas. Tus propias pruebas también suman.
> No guarda ningún dato de la persona: solo fecha, hora y número de hablador.

## Activarlo

1. Entra a <https://sheets.new> con tu cuenta de Google. Ponle de nombre
   «Aperturas habladores».
2. Menú **Extensiones → Apps Script**.
3. Borra lo que aparece y pega todo el contenido del archivo
   [`Codigo.gs`](Codigo.gs). Guarda (icono del disquete).
4. Arriba a la derecha: **Implementar → Nueva implementación**.
   - En el engranaje, elige **Aplicación web**.
   - **Ejecutar como:** Yo.
   - **Quién tiene acceso:** Cualquier usuario.
   - Toca **Implementar** y acepta los permisos que pide Google (es tu propio
     programa; si sale «Google no ha verificado esta aplicación», entra por
     «Configuración avanzada → Ir a … (no seguro)»).
5. Copia la **URL de la aplicación web** (termina en `/exec`).
6. En GitHub abre <https://github.com/JuanSosaaa/r/edit/main/config.js> y pega
   la URL entre las comillas:

   ```js
   CONTADOR_URL: "https://script.google.com/macros/s/XXXXXXXX/exec"
   ```

   Toca **Commit changes…** y confirma.
7. Espera 2 minutos, abre un hablador activo y mira la hoja de cálculo: deben
   aparecer las pestañas **Aperturas** y **Resumen** con tu prueba.

## Usarlo para vender la mensualidad

La pestaña **Resumen** tiene una fila por hablador: total, última apertura y
una columna por mes. Toma una captura de la fila del cliente o cópiala a un
mensaje: «Este mes 38 personas abrieron la página de reseñas desde tu mesa».

## Apagarlo

Deja `CONTADOR_URL: ""` en `config.js`. Los habladores siguen funcionando igual.
