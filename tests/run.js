// Pruebas automáticas de la app. Usan un navegador real (Chromium) y una copia local de la app sin conexión a Firebase.
// Uso:  cd tests && npm install && npx playwright install chromium && node run.js
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
let chromium; try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require("/opt/node22/lib/node_modules/playwright")); }
let jsQR, PNG; try { jsQR = require("jsqr"); ({ PNG } = require("pngjs")); } catch {}
const RAIZ = path.join(__dirname, "..");
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webmanifest": "application/manifest+json" };
const srv = http.createServer((q, r) => {
  const f = path.join(RAIZ, decodeURIComponent(q.url.split("?")[0]).replace(/\/$/, "/index.html") || "/index.html");
  if (!f.startsWith(RAIZ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { "Content-Type": TIPOS[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(r);
});
const resultados = []; let fallos = 0;
async function prueba(nombre, fn) {
  try { await fn(); resultados.push("✔ " + nombre); } catch (e) { fallos++; resultados.push("✘ " + nombre + "\n    " + String(e.message).split("\n").slice(0, 6).join("\n    ")); }
}
(async () => {
  await new Promise(ok => srv.listen(0, "127.0.0.1", ok));
  const URL = "http://127.0.0.1:" + srv.address().port + "/index.html";
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : (fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {}));
  const nueva = async (extra = {}) => {
    const ctx = await b.newContext({ viewport: { width: 1300, height: 950 }, ...extra });
    await ctx.route("**/vendor/firebase/**", r => r.abort());   // sin Firebase: la app trabaja en modo local
    const page = await ctx.newPage(); page.errs = [];
    page.on("pageerror", e => page.errs.push(e.message)); page.on("dialog", d => d.accept());
    await page.addInitScript(() => { try { localStorage.setItem("inv-quien-omitir", "1"); } catch {} });
    await page.goto(URL + "#normal"); await page.waitForFunction(() => typeof Store !== "undefined" && typeof S !== "undefined"); await page.waitForTimeout(300);
    return { ctx, page };
  };
  const prod = (id, n, pk, ub, ex) => ({ id, codigo: id, nombre: n, packUn: pk, categoria: "Bebidas", ubic: ub, ...(ex || {}) });

  await prueba("La app carga sin errores de JavaScript", async () => {
    const { ctx, page } = await nueva(); assert.deepStrictEqual(page.errs, []); assert((await page.title()).length > 0); await ctx.close();
  });

  await prueba("Lotes: salida FEFO, traspaso no toca lotes, deshacer devuelve al mismo lote", async () => {
    const { ctx, page } = await nueva();
    const est = () => page.evaluate(() => { const p = S.productos.find(x => x.id === "a"); return { stock: p.stock, venc: p.vencimiento, l: lotesDe(p).map(x => x.v + ":" + x.u) }; });
    await page.evaluate(async (p) => { await Store.putProducto(fixProd({ ...p, vencimiento: "2027-01-10" })); }, prod("a", "Coca", 6, { repo: 60, p11: 0 }));
    await page.evaluate(() => Store.moverStock("a", { repo: 30 }, {}, [{ venc: "2027-03-01", un: 30 }]));
    await page.evaluate(() => Store.moverStock("a", { repo: 12 }, {}, [{ venc: "2026-12-15", un: 12 }]));
    assert.deepStrictEqual((await est()).l, ["2026-12-15:12", "2027-01-10:60", "2027-03-01:30"]);
    await page.evaluate(() => Store.moverStock("a", { repo: -20 }));
    const us = await page.evaluate(() => Store.ultimoFefo);
    assert.deepStrictEqual(us, [{ venc: "2026-12-15", un: 12 }, { venc: "2027-01-10", un: 8 }]);
    assert.strictEqual((await est()).venc, "2027-01-10");
    await page.evaluate((u) => Store.moverStock("a", { repo: 20 }, {}, u), us);
    assert.deepStrictEqual((await est()).l, ["2026-12-15:12", "2027-01-10:60", "2027-03-01:30"]);
    await page.evaluate(() => Store.moverStock("a", { repo: -10, p11: 10 }));
    assert.strictEqual((await est()).stock, 102);
    await page.evaluate(() => Store.putProducto({ ...S.productos[0], ubic: { repo: 5, p11: 0 } }));
    assert.deepStrictEqual((await est()).l, ["2027-03-01:5"]);   // un conteo bajo recorta primero los lotes que vencen antes
    assert.deepStrictEqual(page.errs, []); await ctx.close();
  });

  await prueba("Recepción: suma un lote, editarla y eliminarla ajusta su lote", async () => {
    const { ctx, page } = await nueva();
    await page.evaluate(async (p) => { await Store.putProducto(fixProd(p)); }, prod("a", "Coca", 6, { repo: 0 }));
    await page.evaluate(async () => { nuevoForm("recepcion"); S.form.tercero = "Prov"; S.form.lineas = [{ id: "a", cantidad: "10", venc: "2027-05-05" }]; await confirmarDoc(); });
    assert.deepStrictEqual(await page.evaluate(() => [S.productos[0].stock, S.productos[0].lotes]), [60, { "2027-05-05": 60 }]);
    await page.evaluate(async () => { editarDoc(S.docs[0].id); S.form.lineas = [{ id: "a", cantidad: "8", venc: "2027-06-06" }]; await confirmarDoc(); });
    assert.deepStrictEqual(await page.evaluate(() => [S.productos[0].stock, S.productos[0].vencimiento, lotesDe(S.productos[0]).length]), [48, "2027-06-06", 1]);
    await page.evaluate(() => eliminarDoc(S.docs[0].id)); await page.waitForTimeout(200);
    assert.deepStrictEqual(await page.evaluate(() => [S.productos[0].stock, lotesDe(S.productos[0]).length]), [0, 0]);
    assert.deepStrictEqual(page.errs, []); await ctx.close();
  });

  await prueba("Stock por incremento: el SDK y la conexión alternativa envían sumas, no valores absolutos", async () => {
    const posts = []; const { ctx, page } = await nueva();
    await ctx.route("https://firestore.googleapis.com/**", async r => { const u = r.request().url(); if (u.includes(":commit")) { posts.push(JSON.parse(r.request().postData())); return r.fulfill({ status: 200, contentType: "application/json", body: "{}" }); } r.fulfill({ status: 200, contentType: "application/json", body: '[{"readTime":"x"}]' }); });
    await page.evaluate(async (p) => { await Store.putProducto(fixProd(p)); }, prod("a", "Coca", 6, { repo: 0, p11: 6 }));
    await page.evaluate(() => { window.__u = []; window.firebase = window.firebase || {}; window.firebase.firestore = { FieldValue: { increment: n => ({ __inc: n }) } }; Store.db = { doc: () => ({ update: async o => window.__u.push(o), set: async () => {} }) }; Store.rest = false; });
    await page.evaluate(() => Store.moverStock("a", { repo: 18 }, {}, [{ venc: "2027-01-01", un: 18 }]));
    const u = await page.evaluate(() => window.__u[0]);
    assert.deepStrictEqual(u["ubic.repo"], { __inc: 18 }); assert.deepStrictEqual(u["lotes.`2027-01-01`"], { __inc: 18 });
    await page.evaluate(() => { window.firebase.auth = () => ({ currentUser: { getIdToken: async () => "t" } }); window.FIREBASE_CONFIG = { projectId: "x" }; Store.rest = true; });
    await page.evaluate(() => Store.moverStock("a", { repo: 12, p11: -6 })); await page.waitForTimeout(400);
    const w = posts.find(x => x.writes[0].updateTransforms);
    assert.deepStrictEqual(w.writes[0].updateTransforms.map(t => [t.fieldPath, t.increment.integerValue]), [["ubic.repo", "12"], ["ubic.p11", "-6"]]);
    await ctx.close();
  });

  await prueba("Picking a cooler se puede deshacer: devuelve el stock y anula el documento", async () => {
    const { ctx, page } = await nueva();
    await page.evaluate(async (p) => { await Store.putProducto(fixProd(p)); }, prod("a", "Coca", 6, { repo: 60, p11: 30 }));
    await page.evaluate(async () => { await Store.moverStock("a", { p11: -12 }); await Store.addDocu({ id: "d1", tipo: "picking", numero: 1, folio: "PK-0001", fecha: hoyISO(), ubicOrigen: "p11", ubicDestino: "c11", creado: new Date().toISOString(), unidades: 12, lineas: [{ productoId: "a", codigo: "a", nombre: "Coca", cantidad: 12, packUn: 6 }] }); await Store.addMov({ id: "m1", productoId: "a", nombre: "Coca", tipo: "picking", cantidad: 12, fecha: new Date().toISOString(), folio: "PK-0001" }, true); });
    await page.evaluate(() => deshacerPicking("d1")); await page.waitForTimeout(300);
    assert.deepStrictEqual(await page.evaluate(() => [S.productos[0].ubic.p11, S.docs[0].anulado, puedeDeshacer(S.docs[0]), S.movs.filter(m => m.tipo === "picking").length]), [30, true, false, 0]);
    await ctx.close();
  });

  await prueba("Papelera: eliminar manda a la papelera, restaurar y eliminar para siempre", async () => {
    const { ctx, page } = await nueva();
    await page.evaluate(async (p) => { await Store.putProducto(fixProd(p)); }, prod("z", "Para borrar", 6, { repo: 6 }));
    await page.evaluate(() => Store.delProducto("z"));
    assert.deepStrictEqual(await page.evaluate(() => [S.productos.length, S.papelera.length]), [0, 1]);
    await page.evaluate(() => Store.restaurarProducto("z"));
    assert.deepStrictEqual(await page.evaluate(() => [S.productos.length, S.papelera.length]), [1, 0]);
    await page.evaluate(async () => { await Store.delProducto("z"); await Store.borrarDefinitivo("z"); });
    assert.deepStrictEqual(await page.evaluate(() => [S.productos.length, S.papelera.length]), [0, 0]); await ctx.close();
  });

  await prueba("Zonas propias: editor, nombres repetidos, lista, QR que se puede leer y enlace directo", async () => {
    const { ctx, page } = await nueva();
    await page.evaluate(async (p) => { await Store.putProducto(fixProd(p)); }, prod("a", "Coca", 6, { repo: 120, p14: 30 }));
    await page.evaluate(() => { go({ go: "inv" }); abrirInv("p14"); });
    await page.click("[data-zedit]"); await page.click("[data-zeadd]"); await page.fill('[data-zen="0"]', "Pasillo 1 · Nivel 1");
    await page.click("[data-zeadd]"); await page.fill('[data-zen="1"]', "Pasillo 1 · Nivel 1");
    await page.click("[data-zesave]"); assert(/mismo nombre/.test(await page.innerText("#zEdBody .err")));
    await page.fill('[data-zen="1"]', "Bidones"); await page.selectOption('[data-zet="1"]', "pick"); await page.click("[data-zesave]"); await page.waitForTimeout(300);
    const zs = await page.evaluate(() => S.bodegas.find(b => b.id === "p14").zonas.map(z => [z.n, z.t, z.id]));
    assert.deepStrictEqual(zs.map(z => z.slice(0, 2)), [["Pasillo 1 · Nivel 1", "rep"], ["Bidones", "pick"]]); assert.notStrictEqual(zs[0][2], zs[1][2]);
    assert.strictEqual(await page.$$eval(".mz-zb", e => e.length), 2);
    await page.evaluate(() => openBod("p14")); await page.click('#fBod button[type="submit"]'); await page.waitForTimeout(200);
    assert.strictEqual(await page.evaluate(() => S.bodegas.find(b => b.id === "p14").zonas.length), 2);   // editar la bodega no pierde sus zonas
    if (jsQR) {
      await page.evaluate(() => { const d = document.createElement("div"); d.id = "qrt"; d.style.cssText = "position:fixed;left:0;top:0;z-index:99999;background:#fff"; const b = S.bodegas.find(x => x.id === "p14"); d.innerHTML = qrSvg(zonaUrl(b, mapaDe(b).zonas[1]), 260); document.body.appendChild(d); });
      const im = PNG.sync.read(await page.locator("#qrt svg").screenshot()), r = jsQR(new Uint8ClampedArray(im.data), im.width, im.height);
      assert(r && r.data.endsWith("#zona=p14/" + encodeURIComponent(zs[1][2])), "el QR no se pudo leer o apunta a otra zona");
    }
    await page.evaluate(() => go({ go: "home" })); await page.evaluate(z => { location.hash = "#zona=p14/" + encodeURIComponent(z); }, zs[1][2]); await page.waitForTimeout(400);
    assert.deepStrictEqual(await page.evaluate(() => [S.screen, S.invBod, S.mpSel]), ["inv", "p14", zs[1][2]]);
    assert.deepStrictEqual(page.errs, []); await ctx.close();
  });

  await prueba("Sugerencia de pedido: cuenta despachos y picking a cooler, no traspasos", async () => {
    const { ctx, page } = await nueva();
    await page.evaluate(async () => {
      const d = n => new Date(Date.now() - n * 864e5).toISOString();
      await Store.putProducto(fixProd({ id: "a", codigo: "a", nombre: "Coca", packUn: 6, categoria: "B", ubic: { repo: 12 } }));
      await Store.putProducto(fixProd({ id: "b", codigo: "b", nombre: "Sprite", packUn: 6, categoria: "B", ubic: { repo: 600 } }));
      for (let i = 0; i < 10; i++) await Store.addMov({ id: "m" + i, productoId: "a", nombre: "Coca", tipo: "despacho", cantidad: 36, fecha: d(i * 2 + 1) }, true);
      await Store.addMov({ id: "mp", productoId: "a", nombre: "Coca", tipo: "picking", cantidad: 60, fecha: d(1), nota: "PK-1 · sale a cooler" }, true);
      await Store.addMov({ id: "mt", productoId: "b", nombre: "Sprite", tipo: "traspaso", cantidad: 600, fecha: d(1), nota: "TI-1" }, true);
    });
    const g = await page.evaluate(() => { const r = sugerencias(); return { dias: r.dias, rows: r.rows.map(x => [x.p.nombre, x.falta]) }; });
    assert.strictEqual(g.dias, 20); assert.deepStrictEqual(g.rows, [["Coca", 47]]); await ctx.close();
  });

  await prueba("Avisos del navegador: avisa de un aviso nuevo de otra persona", async () => {
    const { ctx, page } = await nueva({ permissions: ["notifications"] });
    await page.evaluate(() => { Object.defineProperty(Notification, "permission", { get: () => "granted" }); window.__n = []; navigator.serviceWorker.getRegistration = async () => ({ showNotification: async (t, o) => window.__n.push([t, o.body]) }); });
    await page.evaluate(async () => { await Store.putProducto(fixProd({ id: "c", codigo: "c", nombre: "Fanta", packUn: 6, categoria: "B", ubic: { repo: 0 }, minimo: 2 })); render(true); });
    await page.evaluate(async () => { await Store.addDocu({ id: "av1", tipo: "aviso", creado: new Date().toISOString(), productoId: "c", nombre: "Fanta", codigo: "c", motivo: "sin", nivel: "operario", estado: "abierto", por: "Ana", cuenta: "ana@x.cl" }); render(false); });
    await page.waitForTimeout(300);
    assert.deepStrictEqual(await page.evaluate(() => window.__n), [["Depósito · nuevo aviso de reposición", "Fanta (Sin stock)"]]); await ctx.close();
  });

  await prueba("Lector de códigos: ZXing lee un EAN-13 y el escáner abre y cierra la cámara", async () => {
    const { ctx, page } = await nueva({ permissions: ["camera"] });
    const txt = await page.evaluate(async () => {
      await cargarZXing();
      const code = "7803908006043", L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"], G = ["0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111"], R = ["1110010", "1100110", "1101100", "1000010", "1011100", "1001110", "1010000", "1000100", "1001000", "1110100"];
      const par = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"][+code[0]];
      let bits = "101"; for (let i = 1; i < 7; i++) bits += (par[i - 1] === "L" ? L : G)[+code[i]]; bits += "01010"; for (let i = 7; i < 13; i++) bits += R[+code[i]]; bits += "101";
      const cv = document.createElement("canvas"), m = 4; cv.width = (bits.length + 20) * m; cv.height = 120; const cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, cv.width, cv.height); cx.fillStyle = "#000";
      [...bits].forEach((c, i) => { if (c === "1") cx.fillRect((i + 10) * m, 10, m, 100); });
      const Z = ZXing, h = new Map(); h.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.EAN_13]); const rd = new Z.MultiFormatReader(); rd.setHints(h);
      return rd.decode(new Z.BinaryBitmap(new Z.HybridBinarizer(new Z.HTMLCanvasElementLuminanceSource(cv)))).getText();
    });
    assert.strictEqual(txt, "7803908006043");
    await page.evaluate(async (p) => { await Store.putProducto(fixProd({ ...p, codigo: "7803908006043" })); go({ go: "picking" }); }, prod("a", "Coca", 6, { repo: 12 }));
    assert((await page.$$eval("[data-scan]", e => e.map(x => x.dataset.scan))).includes("pkPick"));
    await page.evaluate(() => scanResultado("pkPick", "7803908006043")); await page.waitForTimeout(300);
    assert.deepStrictEqual(await page.evaluate(() => S.pkLineas.map(l => l.id)), ["a"]); await ctx.close();
  });

  await prueba("Modo simple: un pedido se confirma, descuenta stock y se puede deshacer", async () => {
    const { ctx, page } = await nueva({ viewport: { width: 360, height: 700 }, hasTouch: true, isMobile: true });
    await page.evaluate(async (p) => { await Store.putProducto(fixProd(p)); }, prod("a", "Coca-Cola lata 350 ml", 6, { repo: 500, p11: 62 }));
    await page.goto(URL + "#simple"); await page.reload(); await page.waitForSelector("[data-smnuevo]");
    await page.click("[data-smnuevo]"); await page.click('[data-smorig="p11"]'); await page.click('[data-smdest="c11"]'); await page.click('[data-smadd="a"]'); await page.click("[data-smver-ped]"); await page.click("[data-smconf]"); await page.waitForTimeout(500);
    assert.strictEqual(await page.evaluate(() => S.productos[0].ubic.p11), 56);
    await page.click(".sm-pk >> nth=0"); await page.click("[data-smundo]"); await page.waitForTimeout(500);
    assert.strictEqual(await page.evaluate(() => S.productos[0].ubic.p11), 62);
    assert.deepStrictEqual(page.errs, []); await ctx.close();
  });

  await b.close(); srv.close();
  console.log(resultados.join("\n")); console.log(`\n${resultados.length - fallos} de ${resultados.length} pruebas pasaron.`);
  process.exit(fallos ? 1 : 0);
})().catch(e => { console.error("ERROR en las pruebas:", e); process.exit(2); });
