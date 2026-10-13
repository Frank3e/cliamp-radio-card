/*
 * Regenera las imágenes de `images/` renderizando la tarjeta real con Chromium
 * headless. Requiere `chromium` (o `google-chrome`) y `magick`/ImageMagick.
 *
 *   cd test && npm run preview
 *
 * Variables: CHROMIUM (ruta al binario), MAGICK (ruta a magick/convert).
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const CARD = path.join(ROOT, "dist", "cliamp-radio-card.js");
const IMAGES = path.join(ROOT, "images");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "cliamp-preview-"));

const CHROMIUM = process.env.CHROMIUM || "chromium";
const MAGICK = process.env.MAGICK || "magick";
const FONT = "/usr/share/fonts/TTF/JetBrainsMonoNerdFont-Bold.ttf";

const LRC = [
  "[00:00.00]So close, no matter how far",
  "[00:08.00]Couldn't be much more from the heart",
  "[00:16.00]Forever trusting who we are",
  "[00:24.00]And nothing else matters",
  "[00:34.00]Never opened myself this way",
  "[00:42.00]Life is ours, we live it our way",
  "[00:50.00]All these words I don't just say",
  "[00:58.00]And nothing else matters",
].join("\\n");

const HARNESS = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;}
  body{background:#202020;}
  #wrap{width:500px;height:520px;}
  cliamp-radio-card{display:block;width:100%;height:100%;}
</style></head><body>
<div id="wrap"><cliamp-radio-card id="card"></cliamp-radio-card></div>
<script src="${CARD.replace(/\\/g, "/")}"></script>
<script>
  var params={};
  (location.search||"").replace(/^\\?/,"").split("&").forEach(function(kv){
    var p=kv.split("=");if(p[0])params[decodeURIComponent(p[0])]=decodeURIComponent(p[1]||"");
  });
  var dark=params.dark!=="0";
  document.body.style.background=dark?"#1b1b1b":"#f4f4f4";
  var LRC="${LRC}";
  if(params.lyrics==="1"){
    window.fetch=function(){return Promise.resolve({ok:true,json:function(){
      return Promise.resolve({syncedLyrics:LRC,plainLyrics:LRC});}});};
  }
  var attrs={friendly_name:"Sal\\u00f3n",volume_level:0.42,
    media_content_id:"https://radio.cliamp.stream/omarchy/stream",
    media_title:"Omarchy Radio",media_artist:"Omarchy",media_album_name:"cliamp.stream"};
  if(params.lyrics==="1"){
    attrs.media_title="Nothing Else Matters";attrs.media_artist="Metallica";
    attrs.media_album_name="Metallica";attrs.media_duration=388;
    attrs.media_position=35;attrs.media_position_updated_at=new Date().toISOString();
  }
  var hass={themes:{darkMode:dark},states:{
    "media_player.salon":{state:"playing",attributes:attrs},
    "media_player.kitchen":{state:"idle",attributes:{friendly_name:"Cocina (MA)",volume_level:0.5,mass_player_id:"ma-1"}}
  },callWS:function(){return Promise.resolve({children:[]});},callService:function(){}};
  var card=document.getElementById("card");
  card.setConfig({entity:"media_player.salon",theme:dark?"dark":"light",
    palette:params.palette||"omarchy",visualizer:params.visualizer||"bars",
    stations:"list",eq_animate:params.static==="1"?"off":"always",
    lyrics:params.lyrics==="1"?"on":"off"});
  card.hass=hass;
  if(params.static==="1"){
    setTimeout(function(){
      var fills=card.shadowRoot.querySelectorAll(".eqbars .bar > .fill");
      for(var i=0;i<fills.length;i++){
        var h=0.28+0.68*Math.abs(Math.sin(i*0.9+0.6))*(0.6+0.4*Math.abs(Math.sin(i*2.3)));
        fills[i].style.transform="scaleY("+h.toFixed(3)+")";
      }
      var eqs=card.shadowRoot.querySelectorAll(".eqbars");
      for(var j=0;j<eqs.length;j++)eqs[j].classList.remove("playing");
    },400);
  }
</script></body></html>`;

const HTML = path.join(TMP, "preview.html");
fs.writeFileSync(HTML, HARNESS);

function shot(out, query, scale) {
  const args = [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
    "--window-size=500,520", "--virtual-time-budget=3500",
    "--screenshot=" + out, "file://" + HTML + "?" + query,
  ];
  if (scale) args.unshift("--force-device-scale-factor=" + scale);
  execFileSync(CHROMIUM, args, { stdio: "ignore" });
  process.stdout.write("  " + path.basename(out) + "\n");
}

function montage(out, tiles, tile) {
  const args = ["montage", "-background", "#101010", "-fill", "#f6dcac", "-font", FONT, "-pointsize", "22"];
  tiles.forEach((t) => args.push("-label", t.label, t.file));
  args.push("-tile", tile, "-geometry", "500x520+8+8", out);
  execFileSync(MAGICK, args, { stdio: "ignore" });
  process.stdout.write("  " + path.basename(out) + "\n");
}

if (!fs.existsSync(IMAGES)) fs.mkdirSync(IMAGES, { recursive: true });
console.log("Renderizando previews de la tarjeta (Chromium headless)…");

shot(path.join(IMAGES, "preview.png"), "dark=1&palette=omarchy&visualizer=bars&static=1", 2);
shot(path.join(IMAGES, "preview-light.png"), "dark=0&palette=omarchy&visualizer=bars&static=1", 2);
shot(path.join(IMAGES, "preview-lyrics.png"), "dark=1&palette=catppuccin-mocha&visualizer=bars&lyrics=1&static=1", 2);

const PALETTES = ["omarchy", "matte-black", "catppuccin-mocha", "catppuccin-latte", "flexoki-light", "ethereal", "tokyo-night", "nord", "gruvbox-dark"];
const PAL_TILES = PALETTES.map((p) => {
  const f = path.join(TMP, "p_" + p + ".png");
  shot(f, "dark=1&palette=" + p + "&visualizer=bars&static=1", 1);
  return { label: p, file: f };
});
montage(path.join(IMAGES, "preview-themes.png"), PAL_TILES, "3x3");

const VIZ = ["bars", "blocks", "peak", "mirror", "dots", "off"];
const VIZ_TILES = VIZ.map((v) => {
  const f = path.join(TMP, "v_" + v + ".png");
  shot(f, "dark=1&palette=omarchy&visualizer=" + v + "&static=1", 1);
  return { label: v, file: f };
});
montage(path.join(IMAGES, "preview-visualizers.png"), VIZ_TILES, "3x2");

/* normalize montages to 8-bit sRGB (magick montage may emit 16-bit) */
["preview-themes.png", "preview-visualizers.png"].forEach((f) => {
  const p = path.join(IMAGES, f);
  const tmp = p + ".tmp.png";
  execFileSync(MAGICK, [p, "-depth", "8", "PNG24:" + tmp], { stdio: "ignore" });
  fs.renameSync(tmp, p);
});

fs.rmSync(TMP, { recursive: true, force: true });
console.log("Listo. Imágenes en images/.");
