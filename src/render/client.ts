/**
 * tiny ERS-style SPA client.
 *
 * - opens a WebSocket on load
 * - intercepts internal link clicks
 * - sends `{type:'navigate', path}` over the socket
 * - swaps the `<main>` content with the response html
 * - falls back to plain http navigation if the socket is not ready
 */
export const spaClientScript = `
(function(){
  var ws=null, wsReady=false, pending=null, currentReqId=0;
  var pendingMap=Object.create(null);
  var main=function(){return document.querySelector('main')};

  function connect(){
    var proto=location.protocol==='https:'?'wss:':'ws:';
    try{ws=new WebSocket(proto+'//'+location.host+'/__ws')}catch(e){return}
    ws.onopen=function(){
      wsReady=true;
      if(pending){var p=pending;pending=null;send(p.path,p.id)}
    };
    ws.onclose=function(){wsReady=false;ws=null;setTimeout(connect,1500)};
    ws.onerror=function(){};
    ws.onmessage=function(e){
      try{var msg=JSON.parse(e.data)}catch(_){return}
      if(msg.type!=='page-data')return;
      var cb=pendingMap[msg.id];
      if(cb){delete pendingMap[msg.id];cb(msg)}
    };
  }

  function send(path, id){
    if(!ws||!wsReady){pending={path:path,id:id};return}
    ws.send(JSON.stringify({type:'navigate',path:path,id:id}))
  }

  function navigate(path, push){
    var id=++currentReqId;
    var m=main(); if(m) m.style.opacity='0.5';
    document.documentElement.setAttribute('data-navigating','true');

    pendingMap[id]=function(msg){
      var m2=main();
      if(m2 && msg.html){
        m2.innerHTML=msg.html;
        m2.style.opacity='';
      }
      if(msg.title) document.title=msg.title;
      document.documentElement.removeAttribute('data-navigating');
      updateActiveNav(path);
      if(push) history.pushState({path:path},'',path);
      window.scrollTo(0,0);
    };
    send(path, id);
  }

  function updateActiveNav(path){
    var p = path === '/' ? '/' : path.replace(/\\/$/,'');
    document.querySelectorAll('[data-nav-link]').forEach(function(a){
      var href=a.getAttribute('href');
      if(href===p) a.classList.add('active'); else a.classList.remove('active')
    });
  }

  function isInternal(a){
    if(!a||a.target==='_blank') return false;
    if(a.hasAttribute('download')) return false;
    var href=a.getAttribute('href');
    if(!href||href.startsWith('#')||href.startsWith('mailto:')||href.startsWith('tel:')) return false;
    if(href.startsWith('http://')||href.startsWith('https://')){
      try{var u=new URL(href);if(u.host!==location.host)return false}catch(_){return false}
    }
    return true;
  }

  document.addEventListener('click', function(e){
    if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0) return;
    var t=e.target; while(t && t.tagName!=='A') t=t.parentElement;
    if(!t||!isInternal(t)) return;
    e.preventDefault();
    var path=new URL(t.href).pathname || '/';
    if(path===location.pathname) return;
    navigate(path, true);
  });

  window.addEventListener('popstate', function(e){
    var path=(e.state&&e.state.path)||location.pathname;
    navigate(path, false);
  });

  connect();
})();
`
