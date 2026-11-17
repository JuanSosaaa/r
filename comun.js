// Funciones compartidas por la página de redirección y el panel.
(function () {
  // Dominios de Google a los que se permite redirigir. Evita que un error
  // de digitación (o un enlace pegado por equivocación) mande al cliente
  // a otra página.
  var DOMINIOS = ["google.com", "google.com.co", "g.page", "goo.gl", "g.co"];

  // "17", " 017 " o "0017" -> "017". Devuelve null si no es 001-999.
  function normalizarCodigo(c) {
    if (c == null) return null;
    c = String(c).trim();
    if (!/^\d{1,4}$/.test(c)) return null;
    var n = parseInt(c, 10);
    if (n < 1 || n > 999) return null;
    return ("00" + n).slice(-3);
  }

  // Devuelve la URL limpia si es un enlace https de Google; si no, null.
  function validarUrl(u) {
    if (typeof u !== "string") return null;
    u = u.trim();
    if (!u) return null;
    try {
      var p = new URL(u);
      if (p.protocol !== "https:") return null;
      var h = p.hostname.toLowerCase();
      for (var i = 0; i < DOMINIOS.length; i++) {
        if (h === DOMINIOS[i] || h.endsWith("." + DOMINIOS[i])) return p.href;
      }
    } catch (e) {}
    return null;
  }

  // Lee codigos.json tolerando los errores típicos de editar desde el
  // celular: comillas curvas (“ ”) y una coma sobrante al final.
  function leerCodigos(texto) {
    texto = texto
      .replace(/^﻿/, "")
      .replace(/[“”„‟″]/g, '"')
      .replace(/,(\s*[}\]])/g, "$1");
    var datos = JSON.parse(texto);
    var limpio = {};
    Object.keys(datos).forEach(function (k) {
      var c = normalizarCodigo(k);
      if (c) limpio[c] = datos[k];
    });
    return limpio;
  }

  // Descarga codigos.json sin caché, para que los cambios se vean rápido.
  function cargarCodigos(base) {
    return fetch(base + "codigos.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then(leerCodigos);
  }

  window.Comun = {
    normalizarCodigo: normalizarCodigo,
    validarUrl: validarUrl,
    leerCodigos: leerCodigos,
    cargarCodigos: cargarCodigos
  };
})();
