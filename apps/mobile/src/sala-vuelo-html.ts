/**
 * HTML del vuelo en vivo (CesiumJS + Google Photorealistic 3D Tiles). NO contiene ninguna clave.
 *
 * Contrato con la app (ver scriptInyeccionVuelo en sala-vuelo.ts):
 * - Antes de cargar, la app define window.__AUDITE_CLAVE (clave de Map Tiles API, solo en memoria) y
 *   window.__AUDITE_PLAN (keyframes de cámara de la sede).
 * - La página avisa por ReactNativeWebView.postMessage con JSON { tipo: "listo" | "fin" | "error", ... }.
 *   Los mensajes jamás incluyen la clave: cualquier texto pasa antes por limpiar().
 * - Modo captura (plan.captura): no arranca solo; expone window.__vuelo.pintar(ms) para fotografiar
 *   la trayectoria fotograma a fotograma con la misma sesión (revisión interna, nunca se publica).
 *
 * CesiumJS va pinnado desde CDN (el vuelo ya exige red). Políticas de Map Tiles API: sin caché propia,
 * sin precarga, logo de Google y atribuciones siempre visibles (showCreditsOnScreen).
 */
export const CESIUM_VERSION = "1.147.0";
const CDN = "https://cdn.jsdelivr.net/npm/cesium@" + CESIUM_VERSION + "/Build/Cesium/";

export const HTML_VUELO = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="${CDN}Widgets/widgets.css">
<script src="${CDN}Cesium.js"></script>
<style>
html,body,#c{margin:0;padding:0;width:100%;height:100%;background:#020205;overflow:hidden}
.cesium-viewer-toolbar,.cesium-viewer-animationContainer,.cesium-viewer-timelineContainer,.cesium-viewer-fullscreenContainer,.cesium-viewer-bottom .cesium-widget-credits .cesium-credit-logoContainer:empty{display:none}
/* Logo de Google y atribuciones: siempre visibles, sobre una banda legible; nunca recortados ni tapados. */
.cesium-viewer-bottom{left:0;right:0;bottom:0;padding:0 8px;display:flex;justify-content:center;pointer-events:none}
.cesium-widget-credits{position:relative !important;display:flex !important;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px;max-width:100%;padding:3px 10px;margin-bottom:var(--margen-inferior,0px);background:rgba(0,0,0,.62);border-radius:8px;font:11px/1.35 -apple-system,Roboto,sans-serif;color:#f1f1f1;pointer-events:auto}
.cesium-credit-logoContainer,.cesium-credit-textContainer{display:inline-block !important}
.cesium-widget-credits a{color:#f1f1f1}
.cesium-credit-expand-link{display:none}
.cesium-credit-logoContainer img{height:20px;max-width:none;vertical-align:middle}
</style></head>
<body><div id="c"></div>
<script>
(function(){
  var plan = window.__AUDITE_PLAN, clave = window.__AUDITE_CLAVE;
  function limpiar(t){ return String(t==null?"":t).replace(/key=[^&"' ]*/gi,"key=REDACTED").slice(0,200); }
  function aviso(o){ try{ if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(o)); }catch(e){} }
  function fallo(motivo,det){ aviso({tipo:"error",motivo:motivo,detalle:limpiar(det)}); }
  if(!plan){ return fallo("sin-plan"); }
  if(!clave){ return fallo("sin-clave"); }
  if(typeof Cesium==="undefined"){ return fallo("sin-cesium"); }
  document.documentElement.style.setProperty("--margen-inferior",(plan.margenInferior||0)+"px");

  var resolverLista, lista=new Promise(function(r){ resolverLista=r; });
  var viewer, ts, camara, capaGlobo=null, t0=null, fin=false, sueloMedido=null, sueloActual=plan.suelo||0;
  var K = plan.keyframes, L = K.map(function(k){return Math.log(k.rango);});
  var rad = Cesium.Math.toRadians;

  var GLOBO_OCULTO=20000, GLOBO_PLENO=60000;
  function suave(x){ return x*x*(3-2*x); }
  /* Progreso en rango logarítmico: arranque y llegada suaves, descenso continuo en medio. */
  function curva(x){ x=Math.max(0,Math.min(1,x)); return 0.3*x + 0.7*(1-Math.pow(1-x,2.2)); }

  function pose(ms){
    var u = curva(ms/plan.duracion);
    var lr = L[0] + (L[L.length-1]-L[0])*u;
    var i=0; while(i<L.length-2 && lr<L[i+1]) i++;
    var a=K[i], b=K[i+1];
    var f = suave(Math.max(0,Math.min(1,(L[i]-lr)/(L[i]-L[i+1]))));
    function m(p){ return a[p]+(b[p]-a[p])*f; }
    return { rango:Math.exp(lr), lon:m("lon"), lat:m("lat"), altura:m("altura"), rumbo:m("rumbo"), cabeceo:m("cabeceo") };
  }

  function medirSuelo(p){
    if(p.rango>9000) return;
    try{
      if(viewer.scene.sampleHeightSupported){
        var h = viewer.scene.sampleHeight(Cesium.Cartographic.fromDegrees(p.lon,p.lat));
        if(typeof h==="number" && isFinite(h)){ if(plan.suelo){ h=Math.max(plan.suelo-30,Math.min(plan.suelo+40,h)); } sueloMedido=h; }
      }
    }catch(e){}
    if(sueloMedido!==null) sueloActual += (sueloMedido-sueloActual)*0.25;
  }

  function aplicar(ms){
    var p = pose(ms);
    medirSuelo(p);
    var objetivo = Cesium.Cartesian3.fromDegrees(p.lon,p.lat,(p.rango>9000?0:sueloActual)+p.altura);
    /* Menos detalle (más barato) lejos del suelo; todo el detalle solo en el tramo final. */
    if(ts && "maximumScreenSpaceError" in ts){ ts.maximumScreenSpaceError = p.rango>200000?24:(p.rango>5000?12:plan.detalleFinal||6); }
    /* Globo visible desde lejos; se funde entre 60 km y 20 km para no competir con la malla 3D. */
    if(viewer.scene.globe){ var ag=Math.max(0,Math.min(1,(p.rango-GLOBO_OCULTO)/(GLOBO_PLENO-GLOBO_OCULTO))); if(capaGlobo) capaGlobo.alpha=ag; viewer.scene.globe.show=ag>0.01; }
    camara.lookAt(objetivo,new Cesium.HeadingPitchRange(rad(p.rumbo),rad(p.cabeceo),p.rango));
  }

  /* Modo vivo: el bucle de Cesium pinta solo y aquí basta esperar fotogramas.
     Modo captura: el bucle automático está parado; se pinta a mano hasta que las teselas están cargadas y
     se deja el navegador en reposo para poder fotografiar la página. */
  function globoListo(n){ var g=viewer&&viewer.scene.globe; return !g || !g.show || g.tilesLoaded || (plan.captura && n>=8 && (!capaGlobo || capaGlobo.ready)); }
  function esperarRender(maxMs){
    if(plan.captura){
      return (async function(){
        var n=0, ini=performance.now();
        for(;;){
          viewer.render(); n++;
          await new Promise(function(r){ setTimeout(r,25); });
          if((n>=4 && ts.tilesLoaded && globoListo(n)) || performance.now()-ini>maxMs) break;
        }
        viewer.render();
        return {cargado:ts.tilesLoaded,n:n,ms:Math.round(performance.now()-ini)};
      })();
    }
    return new Promise(function(res){
      var n=0, ini=performance.now();
      (function paso(){
        n++;
        if((n>=3 && ts.tilesLoaded && globoListo(n)) || performance.now()-ini>maxMs){ return res({cargado:ts.tilesLoaded,n:n}); }
        requestAnimationFrame(paso);
      })();
    });
  }

  window.__vuelo = {
    pintar:function(ms,max){ return lista.then(function(){ aplicar(ms); return esperarRender(max||9000); }); },
    pose:pose, duracion:plan.duracion,
    ajustar:function(o){ if(o.escala) viewer.resolutionScale=o.escala; if(o.detalleFinal) plan.detalleFinal=o.detalleFinal; },
    diagnostico:function(){ var g=viewer&&viewer.scene.globe; var st=ts&&ts.statistics||{}; return { globo:g?{show:g.show,alpha:capaGlobo&&capaGlobo.alpha,tilesLoaded:g.tilesLoaded,capaListo:capaGlobo&&capaGlobo.ready}:null, cargado:ts&&ts.tilesLoaded, frames:viewer&&viewer.scene.frameState.frameNumber, visitadas:st.visited, seleccionadas:st.selected, tris:st.trianglesSelected, pendientes:st.numberOfPendingRequests, procesando:st.numberOfTilesProcessing }; },
    /* Solo captura de revisión: cambia la trayectoria sin recargar el tileset (misma sesión). */
    ponerKeyframes:function(kfs,suelo,duracion){ K=kfs; L=K.map(function(k){return Math.log(k.rango);}); if(typeof suelo==="number"){ sueloActual=suelo; sueloMedido=null; } if(duracion) plan.duracion=duracion; }
  };

  async function iniciar(){
    try{
      viewer = new Cesium.Viewer("c",{
        baseLayer:false, baseLayerPicker:false, geocoder:false, homeButton:false, sceneModePicker:false,
        navigationHelpButton:false, animation:false, timeline:false, fullscreenButton:false, infoBox:false,
        selectionIndicator:false, msaaSamples:1, useBrowserRecommendedResolution:false
      });
      var sc = viewer.scene; camara = sc.camera;
      if(plan.escala) viewer.resolutionScale = plan.escala;
      if(plan.captura) viewer.useDefaultRenderLoop = false;
      /* Globo: NASA GIBS Blue Marble Next Generation (acceso libre, sin clave). Solo se ve desde lejos. */
      try{
        /* WMS (no WMTS): la matriz WMTS de GIBS en nivel 0 no coincide con el esquema geográfico de Cesium. */
        var gp = new Cesium.WebMapServiceImageryProvider({
          url: "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi", layers: "BlueMarble_NextGeneration",
          parameters: { format:"image/jpeg", transparent:false, version:"1.1.1", styles:"" },
          tilingScheme: new Cesium.GeographicTilingScheme(), tileWidth:512, tileHeight:512, maximumLevel:8,
          credit: new Cesium.Credit("Imagen de la Tierra: NASA Blue Marble Next Generation (GIBS)", true)
        });
        capaGlobo = viewer.imageryLayers.addImageryProvider(gp);
        sc.globe.showGroundAtmosphere=false; sc.globe.baseColor=Cesium.Color.fromCssColorString("#0a1a33");
      }catch(e){ capaGlobo=null; }
      sc.sun.show=false; sc.moon.show=false; sc.backgroundColor=Cesium.Color.fromCssColorString("#020205");
      try{ if(!sc.skyAtmosphere) sc.skyAtmosphere=new Cesium.SkyAtmosphere(Cesium.Ellipsoid.WGS84); sc.skyAtmosphere.show=true; }catch(e){}
      viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
      sc.screenSpaceCameraController.enableInputs=false;
      /* Una sola apertura de root.json (una sesión). Cesium la reutiliza durante todo el vuelo. */
      /* No se usa ningún geocodificador, por eso se declara onlyUsingWithGoogleGeocoder.
         Caché de teselas en memoria acotada (móvil): nada se guarda en disco ni se reutiliza entre vuelos. */
      ts = await Cesium.createGooglePhotorealistic3DTileset({ key: clave, onlyUsingWithGoogleGeocoder:true }, { showCreditsOnScreen:true, maximumScreenSpaceError:6, cacheBytes:200*1024*1024, maximumCacheOverflowBytes:100*1024*1024 });
    }catch(e){
      if(plan.depuracion){ ts={tilesLoaded:true}; } else { return fallo("root", e && e.message); }
    }
    try{
      viewer.scene.primitives.add(ts);
      /* Cesium 1.147: el evento de fallo de teselas es tileFailed (no errorEvent). */
      if(ts.tileFailed) ts.tileFailed.addEventListener(function(e){ fallo("tesela", e && e.message); });
    }catch(e){
      return fallo("escena", e && e.message);
    }
    aplicar(0);
    resolverLista();
    await esperarRender(plan.captura?60000:2500);
    aviso({tipo:"listo"});
    if(plan.captura) return;
    /* Reloj real. Si las teselas van por detrás en el descenso final, el reloj avanza más despacio (máx. +4 s). */
    var previo=performance.now(), t=0, holgura=4000;
    t0=previo;
    (function marco(){
      var ahora=performance.now(), dt=ahora-previo; previo=ahora;
      var enCola = !ts.tilesLoaded && t>plan.duracion*0.35 && holgura>0;
      if(enCola){ var perdido=dt*0.65; holgura-=perdido; dt-=perdido; }
      t+=dt;
      aplicar(Math.min(t,plan.duracion));
      if(t>=plan.duracion){ if(!fin){ fin=true; aviso({tipo:"fin"}); } }
      if(!fin) requestAnimationFrame(marco);
    })();
  }
  function arrancar(){ iniciar().catch(function(e){ fallo("inicio", e && e.message); }); }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",arrancar); else arrancar();
})();
</script></body></html>`;
