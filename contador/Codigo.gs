/**
 * Contador de aperturas de los habladores.
 * Se pega en una hoja de cálculo de Google (Extensiones → Apps Script) y se
 * publica como aplicación web. Ver contador/INSTRUCCIONES.md.
 *
 * Cada vez que alguien abre un hablador activo:
 *   - añade una fila a la pestaña "Aperturas" (fecha y código)
 *   - actualiza la pestaña "Resumen" (total, última apertura y total por mes)
 */
var ZONA = "America/Bogota";

function doGet(e) {
  var c = String((e && e.parameter && e.parameter.c) || "").trim();
  if (/^\d{3}$/.test(c)) registrar(c, new Date());
  return ContentService.createTextOutput("ok");
}

function tres(v) {
  var s = String(v).trim();
  return /^\d{1,3}$/.test(s) ? ("00" + s).slice(-3) : s;
}

function hoja(ss, nombre, encabezados) {
  var h = ss.getSheetByName(nombre);
  if (!h) {
    h = ss.insertSheet(nombre);
    h.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
    h.setFrozenRows(1);
  }
  return h;
}

function registrar(c, ahora) {
  var candado = LockService.getScriptLock();
  candado.waitLock(15000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    var ap = hoja(ss, "Aperturas", ["Fecha y hora", "Código"]);
    ap.appendRow([Utilities.formatDate(ahora, ZONA, "yyyy-MM-dd HH:mm:ss"), "Hablador " + c]);

    var re = hoja(ss, "Resumen", ["Código", "Total", "Última apertura"]);
    var mes = "Mes " + Utilities.formatDate(ahora, ZONA, "yyyy-MM");

    // columna del mes actual (se crea la primera vez que hay una apertura ese mes)
    var nCols = re.getLastColumn();
    var enc = re.getRange(1, 1, 1, nCols).getValues()[0];
    var colMes = enc.indexOf(mes) + 1;
    if (!colMes) {
      colMes = nCols + 1;
      re.getRange(1, colMes).setValue(mes);
    }

    // fila del código (se crea la primera vez que se abre ese hablador)
    var nFilas = re.getLastRow();
    var fila = 0;
    if (nFilas > 1) {
      var codigos = re.getRange(2, 1, nFilas - 1, 1).getValues();
      for (var i = 0; i < codigos.length; i++) {
        if (tres(String(codigos[i][0]).replace("Hablador ", "")) === c) { fila = i + 2; break; }
      }
    }
    if (!fila) {
      fila = nFilas + 1;
      re.getRange(fila, 1).setValue("Hablador " + c);
    }

    var total = re.getRange(fila, 2);
    total.setValue((Number(total.getValue()) || 0) + 1);
    re.getRange(fila, 3).setValue(Utilities.formatDate(ahora, ZONA, "yyyy-MM-dd HH:mm"));
    var delMes = re.getRange(fila, colMes);
    delMes.setValue((Number(delMes.getValue()) || 0) + 1);
  } finally {
    candado.releaseLock();
  }
}
