// Pruebas de punta a punta del sitio en un navegador real (Chromium).
// Uso: node pruebas/sitio.js            -> prueba la copia local
//      node pruebas/sitio.js https://juansosaaa.github.io/r/   -> prueba el sitio publicado
const http = require("http"), fs = require("fs"), path = require("path");
const { chromium } = require("playwright");

const RAIZ = path.join(__dirname, "..");
const REMOTO = process.argv[2];
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json", ".pdf": "application/pdf" };
const GOOGLE = "https://g.page/r/PRUEBA123/review";

let fallos = 0;
function comprobar(nombre, ok, detalle) {
  console.log((ok ? "  OK    " : "  FALLO ") + nombre + (ok || !detalle ? "" : "  -> " + detalle));
  if (!ok) fallos++;
}

(async () => {
  const golpes = []; // llamadas al contador simulado
  const servidor = http.createServer((req, res) => {
    const u = new URL(req.url, "http://x");
    if (u.pathname === "/contador") { golpes.push(u.searchParams.get("c")); res.end("ok"); return; }
    if (!u.pathname.startsWith("/r/")) { res.statusCode = 404; res.end(); return; }
    let f = path.join(RAIZ, u.pathname.slice(3));
    if (u.pathname.endsWith("/")) f = path.join(f, "index.html");
    fs.readFile(f, (e, d) => {
      if (e) { res.statusCode = 404; res.end("no"); return; }
      res.setHeader("Content-Type", TIPOS[path.extname(f)] || "application/octet-stream");
      res.end(d);
    });
  });
  await new Promise(r => servidor.listen(0, r));
  const puerto = servidor.address().port;
  const BASE = REMOTO || `http://localhost:${puerto}/r/`;

  const nav = await chromium.launch();

  // Abre BASE+ruta con un codigos.json / config.js de prueba (o los reales si json === null).
  // Devuelve { destino } si redirigió a Google, o { titulo, texto } si mostró un aviso.
  async function abrir(ruta, json, opciones = {}) {
    const ctx = await nav.newContext(opciones.movil ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : {});
    const pag = await ctx.newPage();
    let destino = null;
    await ctx.route(/^https:\/\/([^/]*\.)?(g\.page|google\.com|goo\.gl)\//, r => { destino = r.request().url(); r.fulfill({ contentType: "text/html", body: "<title>Google (simulado)</title>" }); });
    await ctx.route(/^https:\/\/malo\.example\//, r => { destino = r.request().url(); r.fulfill({ body: "x" }); });
    if (json !== null) await ctx.route(/codigos\.json/, r => json === 404 ? r.fulfill({ status: 404, body: "" }) : r.fulfill({ contentType: "application/json", body: json }));
    if (opciones.contador) await ctx.route(/config\.js/, r => r.fulfill({ contentType: "text/javascript", body: `window.CONFIG={CONTADOR_URL:"http://localhost:${puerto}/contador"};` }));
    await pag.goto(BASE + ruta);
    await pag.waitForFunction(() => document.title.includes("simulado") || (document.getElementById("aviso") && !document.getElementById("aviso").hidden) || document.getElementById("lista"), null, { timeout: 8000 }).catch(() => {});
    await pag.waitForTimeout(300);
    const r = { destino, pag, ctx };
    if (!destino && await pag.locator("#titulo").count()) {
      r.titulo = await pag.locator("#titulo").textContent();
      r.texto = await pag.locator("#texto").textContent();
      r.cod = await pag.locator("#cod").textContent();
    }
    return r;
  }

  const J = o => JSON.stringify(o);
  const base = { "001": { negocio: "", url: "" }, "017": { negocio: "Café La Plaza", url: GOOGLE }, "018": { negocio: "Mala", url: "https://malo.example/phishing" }, "019": { negocio: "Sin https", url: "http://g.page/r/X/review" }, "020": { negocio: "Otra", url: "https://search.google.com/local/writereview?placeid=ChIJabc" } };
  let r;

  console.log("Redirección (" + BASE + ")");
  if (!REMOTO) {
    r = await abrir("?c=017", J(base)); comprobar("código asignado abre la reseña de Google", r.destino === GOOGLE, r.destino || r.titulo); await r.ctx.close();
    r = await abrir("?c=017", J(base), { movil: true }); comprobar("igual en pantalla de celular", r.destino === GOOGLE, r.destino || r.titulo); await r.ctx.close();
    r = await abrir("?c=17", J(base)); comprobar("«17» se entiende como 017", r.destino === GOOGLE, r.destino || r.titulo); await r.ctx.close();
    r = await abrir("?c=020", J(base)); comprobar("enlace search.google.com/local/writereview", r.destino === base["020"].url, r.destino || r.titulo); await r.ctx.close();
    r = await abrir("?c=001", J(base)); comprobar("código libre: «Hablador sin activar»", !r.destino && r.titulo === "Hablador sin activar" && r.cod === "Código 001", r.titulo); await r.ctx.close();
    r = await abrir("?c=045", J(base)); comprobar("código que no está en el archivo: «sin activar»", !r.destino && r.titulo === "Hablador sin activar", r.titulo); await r.ctx.close();
    r = await abrir("", J(base)); comprobar("sin código: «Enlace incompleto»", !r.destino && r.titulo === "Enlace incompleto", r.titulo); await r.ctx.close();
    r = await abrir("?c=abc", J(base)); comprobar("código con letras: «Enlace incompleto»", !r.destino && r.titulo === "Enlace incompleto", r.titulo); await r.ctx.close();
    r = await abrir("?c=018", J(base)); comprobar("enlace que no es de Google: NO redirige", !r.destino && r.titulo === "Enlace no válido", r.destino || r.titulo); await r.ctx.close();
    r = await abrir("?c=019", J(base)); comprobar("enlace http (sin s): NO redirige", !r.destino && r.titulo === "Enlace no válido", r.destino || r.titulo); await r.ctx.close();
    r = await abrir("?c=017", '{ “017”: { “negocio”: “Café”, “url”: “' + GOOGLE + '” }, }'); comprobar("tolera comillas curvas del iPhone y coma sobrante", r.destino === GOOGLE, r.destino || r.titulo); await r.ctx.close();
    r = await abrir("?c=017", '{ "017": { "negocio": "Café" "url": "x" }'); comprobar("archivo dañado: «No se pudo abrir»", !r.destino && r.titulo === "No se pudo abrir", r.titulo); await r.ctx.close();
    r = await abrir("?c=017", 404); comprobar("archivo no disponible: «No se pudo abrir»", !r.destino && r.titulo === "No se pudo abrir", r.titulo); await r.ctx.close();

    console.log("Contador");
    golpes.length = 0;
    r = await abrir("?c=017", J(base), { contador: true }); await r.pag.waitForTimeout(500);
    comprobar("apertura válida avisa al contador y redirige", r.destino === GOOGLE && golpes.join() === "017", "golpes=" + golpes.join()); await r.ctx.close();
    golpes.length = 0;
    r = await abrir("?c=001", J(base), { contador: true }); await r.pag.waitForTimeout(300);
    comprobar("código libre no se cuenta", golpes.length === 0, "golpes=" + golpes.join()); await r.ctx.close();
    r = await abrir("?c=017", J(base)); comprobar("contador apagado: no hace llamadas y redirige", r.destino === GOOGLE); await r.ctx.close();

    console.log("Panel");
    r = await abrir("panel/", J(base));
    const resumen = await r.pag.locator("#resumen").textContent();
    comprobar("resumen del panel", resumen === "2 activos · 1 libres · 2 por revisar", resumen);
    comprobar("enlace «Probar» del 017", await r.pag.locator("li:has-text('017') a").getAttribute("href") === "../?c=017");
    await r.ctx.close();
    r = await abrir("panel/", "{ roto");
    comprobar("panel avisa si el archivo está dañado", await r.pag.locator("#error").isVisible()); await r.ctx.close();
  }

  console.log("Archivos reales");
  r = await abrir("?c=017", null); comprobar("codigos.json real: 017 libre → «Hablador sin activar»", !r.destino && r.titulo === "Hablador sin activar", r.destino || r.titulo); await r.ctx.close();
  r = await abrir("panel/", null);
  const res2 = await r.pag.locator("#resumen").textContent();
  comprobar("panel real: 50 códigos", /^\d+ activos · \d+ libres/.test(res2) && await r.pag.locator("li").count() === 50, res2);
  await r.ctx.close();
  const real = JSON.parse(fs.readFileSync(path.join(RAIZ, "codigos.json"), "utf8"));
  comprobar("codigos.json local es JSON válido con 001–050", Object.keys(real).length === 50 && real["001"] && real["050"]);

  await nav.close(); servidor.close();
  console.log(fallos ? `\n${fallos} FALLO(S)` : "\nTodo OK");
  process.exit(fallos ? 1 : 0);
})();
