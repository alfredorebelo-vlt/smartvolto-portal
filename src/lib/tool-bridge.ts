/**
 * Injeta um bridge de persistência em qualquer HTML de ferramenta.
 *
 * O HTML da ferramenta pode chamar:
 *   VD.load(key?)          → Promise<any>   — carrega dados da BD
 *   VD.save(data, key?)    → Promise<void>  — grava dados na BD
 *   VD.onLoad(fn, key?)    → void           — atalho: chama fn(data) assim que carregar
 *
 * O bridge usa o slug da ferramenta (injectado em runtime) para saber
 * qual endpoint chamar. A sessão é validada server-side — o HTML não
 * precisa de gerir auth.
 */
export function injectBridge(html: string, slug: string): string {
  const bridge = `
<script id="__vd_bridge__">
(function(){
  var BASE = '/api/tools/${slug}/data';
  window.VD = {
    load: function(key) {
      var url = BASE + (key ? '?key=' + encodeURIComponent(key) : '');
      return fetch(url, { credentials: 'include' })
        .then(function(r){ return r.json(); })
        .then(function(d){ return d.data; });
    },
    save: function(data, key) {
      return fetch(BASE, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key || 'state', data: data })
      }).then(function(r){ return r.json(); });
    },
    onLoad: function(fn, key) {
      window.VD.load(key).then(function(data){ if(data !== null) fn(data); });
    }
  };
  // Auto-save hook: tools can set VD.autoSave = true to persist S on every render
  window.__vd_autoSaveEnabled__ = false;
  window.VD.enableAutoSave = function(getState, interval) {
    if(window.__vd_autoSaveEnabled__) return;
    window.__vd_autoSaveEnabled__ = true;
    var iv = interval || 3000;
    var last = null;
    setInterval(function(){
      try {
        var state = JSON.stringify(getState());
        if(state !== last){ last = state; window.VD.save(JSON.parse(state)); }
      } catch(e){}
    }, iv);
    window.addEventListener('visibilitychange', function(){
      if(document.visibilityState === 'hidden'){
        try{
          var s = getState();
          var payload = JSON.stringify({ key: 'state', data: s });
          // sendBeacon é garantido mesmo ao navegar para fora
          if(navigator.sendBeacon){
            var blob = new Blob([payload], { type: 'application/json' });
            navigator.sendBeacon(BASE, blob);
          } else {
            window.VD.save(s);
          }
        }catch(e){}
      }
    });
  };
})();
</script>`;

  // Injeta imediatamente após <body> para que VD esteja disponível
  // antes de qualquer script da ferramenta
  if (html.includes("<body>")) {
    return html.replace("<body>", "<body>" + bridge);
  }
  if (html.includes("<body ")) {
    return html.replace(/(<body[^>]*>)/, "$1" + bridge);
  }
  // fallback: injeta antes do primeiro <script>
  if (html.includes("<script")) {
    return html.replace("<script", bridge + "\n<script");
  }
  return bridge + html;
}
