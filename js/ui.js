(function(){
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var body = document.body;
  var lens = window.lens = {x:.5,y:.6,s:0,tx:.5,ty:.6,ts:0,press:0,cx:.5,cy:.5,ct:99,mode:'intro',out:false,radius:.2};
  var lastTouchUp = 0, introStart = performance.now(), nameY = .7;

  /* ----- view toggle ----- */
  var btns = document.querySelectorAll('.seg button');
  btns.forEach(function(b){
    b.addEventListener('click', function(){
      body.dataset.view = b.dataset.view;
      btns.forEach(function(o){ o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
    });
  });

  /* ----- which character is on stage ----- */
  var secs = Array.prototype.slice.call(document.querySelectorAll('section[data-char]'));
  function pickActive(){
    var mid = innerHeight * .5, best = secs[0], bd = 1e9;
    secs.forEach(function(s){
      var r = s.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) { best = s; bd = -1; }
      else if (bd >= 0) {
        var d = Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
        if (d < bd) { bd = d; best = s; }
      }
    });
    body.dataset.char = best.dataset.char;
    body.dataset.side = best.dataset.side;
  }
  var ticking = false;
  addEventListener('scroll', function(){
    if (ticking) return; ticking = true;
    requestAnimationFrame(function(){ ticking = false; pickActive(); });
  }, {passive:true});
  pickActive();

  /* ----- hero letters ----- */
  var h1 = document.getElementById('name'), chars = [];
  h1.querySelectorAll('.line').forEach(function(line){
    var words = line.textContent.trim().split(' ');
    line.textContent = '';
    words.forEach(function(w, wi){
      var ws = document.createElement('span'); ws.className = 'word';
      Array.prototype.forEach.call(w, function(ch){
        var c = document.createElement('span'); c.className = 'ch'; c.textContent = ch;
        ws.appendChild(c); chars.push({el:c, cx:0, cy:0});
      });
      line.appendChild(ws);
      if (wi < words.length - 1) line.appendChild(document.createTextNode(' '));
    });
  });
  function measure(){
    chars.forEach(function(c){ c.el.style.transform = ''; });
    chars.forEach(function(c){
      var r = c.el.getBoundingClientRect();
      c.cx = r.left + r.width / 2 + scrollX;
      c.cy = r.top + r.height / 2 + scrollY;
    });
    var hr = h1.getBoundingClientRect();
    nameY = 1 - ((hr.top + scrollY + hr.height / 2) / innerHeight);
    nameY = Math.min(.85, Math.max(.35, nameY));
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  addEventListener('load', measure);
  addEventListener('resize', measure);
  measure();

  /* ----- pointer ----- */
  function setPos(e){ lens.tx = e.clientX / innerWidth; lens.ty = 1 - e.clientY / innerHeight; }
  addEventListener('pointermove', function(e){ lens.mode = 'pointer'; lens.out = false; setPos(e); lens.ts = .42; });
  addEventListener('pointerdown', function(e){
    lens.mode = 'pointer'; lens.out = false; setPos(e); lens.ts = .42;
    lens.press = 1; lens.cx = lens.tx; lens.cy = lens.ty; lens.ct = 0;
  });
  function up(e){
    lens.press = 0;
    if (e.pointerType && e.pointerType !== 'mouse') { lastTouchUp = performance.now(); lens.mode = 'touchidle'; }
  }
  addEventListener('pointerup', up);
  addEventListener('pointercancel', up);
  document.documentElement.addEventListener('mouseleave', function(){ lens.out = true; });
  document.documentElement.addEventListener('mouseenter', function(){ lens.out = false; });

  /* ----- frame ----- */
  var prev = performance.now();
  function frame(now){
    requestAnimationFrame(frame);
    var dt = Math.min(.05, (now - prev) / 1000); prev = now;
    var t = now / 1000;

    if (reduce) { lens.ts = 0; }
    else if (lens.out) { lens.ts = 0; }
    else if (lens.mode === 'intro') {
      var p = (now - introStart - 500) / 3000;
      if (p < 0) { lens.ts = 0; }
      else {
        var q = Math.min(1, p), e = q < .5 ? 2*q*q : 1 - Math.pow(-2*q + 2, 2) / 2;
        lens.tx = .05 + .58 * e; lens.ty = nameY; lens.ts = .55 * Math.sin(Math.PI * q);
        if (p >= 1) lens.mode = 'wander';
      }
    }
    else if (lens.mode === 'touchidle' && now - lastTouchUp < 1500) { lens.ts = .2; }
    else if (lens.mode === 'wander' || lens.mode === 'touchidle') {
      lens.mode = 'wander';
      lens.tx = .5 + .3 * Math.sin(t * .31);
      lens.ty = .5 + .22 * Math.sin(t * .47 + 1.2);
      lens.ts = .3;
    }

    var kp = 1 - Math.exp(-dt * 12), ks = 1 - Math.exp(-dt * 9);
    lens.x += (lens.tx - lens.x) * kp;
    lens.y += (lens.ty - lens.y) * kp;
    lens.s += ((lens.ts + lens.press * .22) - lens.s) * ks;
    lens.ct += dt;
    lens.radius = innerWidth < 820 ? .17 : .2;

    /* hero letters bulge with the same lens */
    if (!reduce && scrollY < innerHeight * 1.1) {
      var lx = lens.x * innerWidth, ly = (1 - lens.y) * innerHeight + scrollY;
      var R = lens.radius * innerHeight * 1.5;
      for (var i = 0; i < chars.length; i++) {
        var c = chars[i];
        if (lens.s < .01) { if (c.on) { c.el.style.transform = ''; c.on = false; } continue; }
        var dx = c.cx - lx, dy = c.cy - ly, d = Math.sqrt(dx*dx + dy*dy) || 1;
        var f = Math.max(0, 1 - d / R); f = f * f * (3 - 2 * f);
        if (f <= 0) { if (c.on) { c.el.style.transform = ''; c.on = false; } continue; }
        var sc = 1 + lens.s * f * 1.1, push = lens.s * f * R * .2;
        c.el.style.transform = 'translate(' + (dx / d * push).toFixed(1) + 'px,' + (dy / d * push).toFixed(1) + 'px) scale(' + sc.toFixed(3) + ')';
        c.on = true;
      }
    }
  }
  requestAnimationFrame(frame);
})();
