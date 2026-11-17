// Prueba la lógica de contador/Codigo.gs con una hoja de cálculo simulada.
// (No sustituye la prueba real en Google: ver contador/INSTRUCCIONES.md, paso 7.)
const fs = require("fs"), path = require("path"), vm = require("vm");

function Hoja() { this.c = []; }
Hoja.prototype = {
  getLastRow() { return this.c.length; },
  getLastColumn() { return Math.max(0, ...this.c.map(f => f.length)); },
  appendRow(f) { this.c.push(f.slice()); },
  setFrozenRows() {},
  getRange(f, c, nf = 1, nc = 1) {
    const h = this;
    const leer = (i, j) => (h.c[i] && h.c[i][j] !== undefined ? h.c[i][j] : "");
    const poner = (i, j, v) => { while (h.c.length <= i) h.c.push([]); h.c[i][j] = v; };
    return {
      getValues: () => Array.from({ length: nf }, (_, i) => Array.from({ length: nc }, (_, j) => leer(f - 1 + i, c - 1 + j))),
      setValues: v => v.forEach((fila, i) => fila.forEach((x, j) => poner(f - 1 + i, c - 1 + j, x))),
      getValue: () => leer(f - 1, c - 1),
      setValue: v => poner(f - 1, c - 1, v),
    };
  },
};
const hojas = {};
const ctx = {
  SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: n => hojas[n] || null, insertSheet: n => (hojas[n] = new Hoja()) }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  ContentService: { createTextOutput: t => t },
  Utilities: {
    formatDate(d, zona, f) {
      const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).formatToParts(d).map(x => [x.type, x.value]));
      return f.replace("yyyy", p.year).replace("MM", p.month).replace("dd", p.day).replace("HH", p.hour).replace("mm", p.minute).replace("ss", p.second);
    },
  },
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "contador", "Codigo.gs"), "utf8"), ctx);

let fallos = 0;
const ok = (n, c, d) => { console.log((c ? "  OK    " : "  FALLO ") + n + (c ? "" : "  -> " + JSON.stringify(d))); if (!c) fallos++; };

ctx.registrar("017", new Date("2026-11-17T15:00:00Z"));
ctx.registrar("017", new Date("2026-11-18T01:30:00Z")); // 17 nov 20:30 en Bogotá
ctx.registrar("003", new Date("2026-11-20T15:00:00Z"));
ctx.registrar("017", new Date("2026-12-01T04:59:00Z")); // todavía 30 nov en Bogotá
ctx.registrar("017", new Date("2026-12-01T05:01:00Z")); // ya 1 dic en Bogotá
ctx.doGet({ parameter: { c: "003" } });
ctx.doGet({ parameter: { c: "hola" } });
ctx.doGet({ parameter: {} });
ctx.doGet(undefined);

const R = hojas.Resumen.c, A = hojas.Aperturas.c;
ok("Aperturas: 1 encabezado + 6 filas (las inválidas no entran)", A.length === 7, A);
ok("hora guardada en horario de Colombia", A[2][0] === "2026-11-17 20:30:00", A[2]);
ok("encabezados del Resumen", R[0].join("|") === "Código|Total|Última apertura|Mes 2026-11|Mes 2026-12", R[0]);
const f17 = R.find(f => f[0] === "Hablador 017"), f03 = R.find(f => f[0] === "Hablador 003");
ok("017: total 4, nov 3, dic 1", f17 && f17[1] === 4 && f17[3] === 3 && f17[4] === 1, f17);
ok("017: última apertura", f17 && f17[2] === "2026-12-01 00:01", f17);
ok("003: total 2 (la segunda entra por doGet con la fecha de hoy)", f03 && f03[1] === 2, f03);
ok("una sola fila por hablador", R.length === 3, R);
console.log(fallos ? `\n${fallos} FALLO(S)` : "\nTodo OK");
process.exit(fallos ? 1 : 0);
