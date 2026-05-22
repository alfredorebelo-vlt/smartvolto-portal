/**
 * Normaliza os headings de um fragmento HTML para que o nível mínimo
 * seja sempre h2. Exemplo: se o tool usa h1/h2/h3, são promovidos para
 * h2/h3/h4 — assim o h1 fica reservado para o portal e a hierarquia
 * de navegação é consistente entre ferramentas.
 */
export function normalizeHeadings(html: string): string {
  // Encontra o nível mínimo de heading presente (só dentro do <body> se existir)
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html;
  const matches = body.match(/<h([1-6])[\s>]/gi) ?? [];
  if (matches.length === 0) return html;

  const levels = matches.map((m) => parseInt(m.replace(/<h/i, ""), 10));
  const minLevel = Math.min(...levels);

  // Se o mínimo já é h2 ou superior, nada a fazer
  if (minLevel >= 2) return html;

  // Shift: eleva todos os headings de forma a que o mínimo fique em h2
  const shift = 2 - minLevel; // ex: minLevel=1 → shift=1
  return html.replace(/<(\/?)h([1-6])(\s|>)/gi, (_, slash, n, rest) => {
    const newLevel = Math.min(parseInt(n, 10) + shift, 6);
    return `<${slash}h${newLevel}${rest}`;
  });
}

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
