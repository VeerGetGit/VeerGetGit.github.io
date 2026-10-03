import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const lens = window.lens;
const canvas = document.getElementById('gl');
const body = document.body;
const root = document.documentElement;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias:false, alpha:false, powerPreference:'high-performance' });
} catch (err) {
  root.classList.add('no-gl');
  throw err;
}

const small = innerWidth < 820;
const DPR = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75);
renderer.setPixelRatio(DPR);

let W = innerWidth, H = innerHeight;
renderer.setSize(W, H, false);

const halfFloatOK = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float');
const rt = new THREE.WebGLRenderTarget(W * DPR, H * DPR, {
  type: halfFloatOK ? THREE.HalfFloatType : THREE.UnsignedByteType,
  samples: small ? 2 : 4,
  depthBuffer: true
});

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x190a0c);
const camera = new THREE.PerspectiveCamera(38, W / H, .1, 120);
scene.add(camera);
const rig = new THREE.Group();
camera.add(rig);

/* ---------- lights ---------- */
scene.add(new THREE.HemisphereLight(0xffc9a0, 0x2a0a10, 1.0));
const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(3, 5, 2); scene.add(key);
const fill = new THREE.PointLight(0xffb938, 60, 30, 2); fill.position.set(-3, 1, -5); scene.add(fill);
const rim = new THREE.PointLight(0xff4d2e, 70, 30, 2); rim.position.set(4, 2, -12); scene.add(rim);

/* ---------- fabric of space ---------- */
const fabricMat = new THREE.ShaderMaterial({
  transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
  uniforms:{
    uTime:{value:0}, uMouse:{value:new THREE.Vector2()}, uAmp:{value:0}, uAmpN:{value:0},
    uSigma:{value:2.2}, uScroll:{value:0},
    uColA:{value:new THREE.Color(0xd9421f)}, uColB:{value:new THREE.Color(0xff8a3d)}
  },
  vertexShader:`
    uniform float uTime, uAmp, uAmpN, uSigma; uniform vec2 uMouse;
    varying vec2 vPlane; varying float vDisp; varying vec2 vUv;
    void main(){
      vec3 p = position;
      vPlane = position.xy; vUv = uv;
      vec2 d = p.xy - uMouse;
      float well = exp(-dot(d,d) / (uSigma*uSigma));
      p.xy = uMouse + d * (1.0 + uAmpN * 0.5 * well);
      p.z += well * uAmp + sin(p.x*.35 + uTime*.6) * cos(p.y*.3 - uTime*.45) * .35;
      vDisp = well * uAmpN;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }`,
  fragmentShader:`
    precision highp float;
    uniform vec3 uColA, uColB; uniform float uScroll;
    varying vec2 vPlane; varying float vDisp; varying vec2 vUv;
    float gridLine(vec2 c, float size, float w){
      vec2 q = c / size;
      vec2 g = abs(fract(q - .5) - .5) / fwidth(q);
      return 1.0 - clamp(min(g.x, g.y) / w, 0.0, 1.0);
    }
    void main(){
      vec2 c = vPlane + vec2(0.0, uScroll);
      float minor = gridLine(c, 1.2, 1.0);
      float major = gridLine(c, 6.0, 1.6);
      float a = minor * .16 + major * .34;
      float fade = 1.0 - smoothstep(.35, .95, length((vUv - .5) * vec2(1.0, 1.6)));
      vec3 col = mix(uColA, uColB, clamp(vDisp * 1.4, 0.0, 1.0));
      a = (a + vDisp * (minor + major) * .9) * fade;
      gl_FragColor = vec4(col, a);
    }`
});
const fabric = new THREE.Mesh(new THREE.PlaneGeometry(64, 36, 200, 112), fabricMat);
fabric.position.z = -14;
fabric.frustumCulled = false;
camera.add(fabric);

/* ---------- stars ---------- */
{
  const N = 1600, arr = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    arr[i*3] = (Math.random() - .5) * 90;
    arr[i*3+1] = (Math.random() - .5) * 50;
    arr[i*3+2] = -18 - Math.random() * 40;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  var stars = new THREE.Points(g, new THREE.PointsMaterial({ size:.07, color:0xffe3c4, transparent:true, opacity:.75, sizeAttenuation:true, depthWrite:false }));
  rig.add(stars);
}

/* ---------- helpers ---------- */
const M = {
  pearl: new THREE.MeshStandardMaterial({ color:0xf6e6d4, roughness:.34, metalness:.06 }),
  dark:  new THREE.MeshStandardMaterial({ color:0x2b0e11, roughness:.22, metalness:.5 }),
  mid:   new THREE.MeshStandardMaterial({ color:0x6a2c1e, roughness:.4, metalness:.3 }),
  venus: new THREE.MeshBasicMaterial({ color:0xffb938 }),
  mars:  new THREE.MeshBasicMaterial({ color:0xff4d2e }),
  ember: new THREE.MeshBasicMaterial({ color:0xff8a3d })
};

const glowT = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'), g = x.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.25,'rgba(255,255,255,.45)'); g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0,0,64,64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
function glow(color, size){
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowT, color, blending:THREE.AdditiveBlending, depthWrite:false, transparent:true }));
  s.scale.set(size, size, 1); return s;
}
function roundRect(x, px, py, w, h, r){
  x.beginPath(); x.moveTo(px+r,py);
  x.arcTo(px+w,py,px+w,py+h,r); x.arcTo(px+w,py+h,px,py+h,r);
  x.arcTo(px,py+h,px,py,r); x.arcTo(px,py,px+w,py,r); x.closePath();
}
function textPanel(lines, accent){
  const c = document.createElement('canvas'); c.width = 640; c.height = 300;
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(34,11,13,.92)'; roundRect(x,6,6,628,288,26); x.fill();
  x.lineWidth = 3; x.strokeStyle = accent; x.globalAlpha = .7; roundRect(x,6,6,628,288,26); x.stroke(); x.globalAlpha = 1;
  ['#ff5f57','#febc2e','#28c840'].forEach((col,i) => { x.fillStyle = col; x.beginPath(); x.arc(44+i*28,44,8,0,7); x.fill(); });
  x.font = '600 24px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'; x.textBaseline = 'middle';
  lines.forEach((ln,i) => { x.fillStyle = i === 0 ? accent : '#ffe9d2'; x.fillText(ln, 34, 112 + i*54); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function addEyes(head, mat, glowColor, opts){
  const o = Object.assign({ x:.3, y:.03, z:.88, glow:.75 }, opts || {});
  const eyes = new THREE.Group(); eyes.position.set(0, o.y, o.z); head.add(eyes);
  const geo = new THREE.CapsuleGeometry(.075, .15, 6, 16);
  [-1, 1].forEach(s => {
    const e = new THREE.Mesh(geo, mat); e.position.x = s * o.x; eyes.add(e);
    const gl = glow(glowColor, o.glow); gl.position.set(s * o.x, 0, .06); eyes.add(gl);
  });
  return eyes;
}
function addHands(g, ringMat, y){
  const hands = [];
  [-1, 1].forEach(s => {
    const h = new THREE.Group(); h.position.set(s * 1.2, y, .25); h.userData.y = y;
    h.add(new THREE.Mesh(new THREE.SphereGeometry(.17, 20, 16), M.pearl));
    const r = new THREE.Mesh(new THREE.TorusGeometry(.25, .025, 8, 32), ringMat); r.rotation.x = Math.PI / 2; h.add(r);
    g.add(h); hands.push(h);
  });
  return hands;
}

/* ---------- character A: the agent builder ---------- */
function botA(){
  const g = new THREE.Group(), head = new THREE.Group(); head.position.y = .6; g.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(.85, 48, 32), M.pearl); skull.scale.set(1.12, .92, 1); head.add(skull);
  const visor = new THREE.Mesh(new RoundedBoxGeometry(1.5, .64, .34, 6, .28), M.dark); visor.position.set(0, .03, .74); head.add(visor);
  const eyes = addEyes(head, M.venus, 0xffb938, { x:.33, z:.92 });
  [-1, 1].forEach(s => {
    const ear = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .2, 24), M.dark); ear.rotation.z = Math.PI/2; ear.position.set(s*1.02, 0, 0); head.add(ear);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .22, 16), M.venus); cap.rotation.z = Math.PI/2; cap.position.set(s*1.04, 0, 0); head.add(cap);
  });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .45, 8), M.dark); stem.position.y = .98; head.add(stem);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(.1, 16, 12), M.venus); tip.position.y = 1.24; head.add(tip);
  const tg = glow(0xffb938, .7); tg.position.copy(tip.position); head.add(tg);

  const torso = new THREE.Mesh(new RoundedBoxGeometry(1.05, .9, .8, 6, .32), M.pearl); torso.position.y = -.82; g.add(torso);
  const core = new THREE.Mesh(new THREE.SphereGeometry(.13, 16, 12), M.venus); core.position.set(0, -.78, .4); g.add(core);
  const cg = glow(0xffb938, .6); cg.position.set(0, -.78, .45); g.add(cg);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.5, .045, 12, 48), M.mid); ring.rotation.x = Math.PI/2; ring.position.y = -.3; g.add(ring);
  const hands = addHands(g, M.venus, -.75);

  const orbit = new THREE.Group(); g.add(orbit);
  const sets = [
    ['workflow = StateGraph(State)', 'workflow.add_node("intent", classify)', 'workflow.add_edge("intent", "tools")'],
    ['agent = create_react_agent(', '    llm, tools', ')'],
    ['eval: 117/119 passed', 'intent accuracy: 51/51', 'llm calls: -80%']
  ];
  const ys = [1.0, -.35, .35];
  sets.forEach((lines, i) => {
    const a = i * Math.PI * 2 / 3;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.9, .89),
      new THREE.MeshBasicMaterial({ map:textPanel(lines, '#ffb938'), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
    m.position.set(Math.cos(a) * 2.05, ys[i], Math.sin(a) * 2.05);
    m.rotation.y = Math.PI/2 - a;
    orbit.add(m);
  });

  return { g, head, eyes, hands, extra(t){ ring.rotation.z = t * 1.2; orbit.rotation.y = reduce ? 0 : t * .35; tg.material.opacity = .65 + Math.sin(t*3)*.3; } };
}

/* ---------- character B: the project lead ---------- */
function botB(){
  const g = new THREE.Group(), head = new THREE.Group(); head.position.y = .6; g.add(head);
  const skull = new THREE.Mesh(new RoundedBoxGeometry(1.75, 1.35, 1.35, 8, .46), M.pearl); head.add(skull);
  const visor = new THREE.Mesh(new RoundedBoxGeometry(1.4, .58, .3, 6, .26), M.dark); visor.position.set(0, .04, .6); head.add(visor);
  const eyes = addEyes(head, M.mars, 0xff4d2e, { x:.31, y:.05, z:.78 });
  const band = new THREE.Mesh(new THREE.TorusGeometry(.95, .045, 12, 64, Math.PI), M.mid); band.scale.y = .72; head.add(band);
  [-1, 1].forEach(s => {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(.26, .26, .2, 24), M.dark); cup.rotation.z = Math.PI/2; cup.position.set(s*.98, 0, 0); head.add(cup);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .24, 16), M.mars); cap.rotation.z = Math.PI/2; cap.position.set(s*1.0, 0, 0); head.add(cap);
  });
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(.98,-.05,.05), new THREE.Vector3(.9,-.4,.4), new THREE.Vector3(.5,-.52,.72)]);
  head.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, .022, 8, false), M.dark));
  const mic = new THREE.Mesh(new THREE.SphereGeometry(.065, 12, 10), M.mars); mic.position.set(.5, -.52, .72); head.add(mic);

  const torso = new THREE.Mesh(new RoundedBoxGeometry(1.2, .95, .85, 6, .34), M.pearl); torso.position.y = -.85; g.add(torso);
  const badge = new THREE.Mesh(new RoundedBoxGeometry(.24, .15, .04, 3, .03), M.mars); badge.position.set(-.3, -.7, .44); g.add(badge);
  const hands = addHands(g, M.mars, -.8);

  /* floating kanban board */
  const board = new THREE.Group(); board.position.set(2.0, .1, -.3); board.rotation.y = -.3; g.add(board);
  board.add(new THREE.Mesh(new RoundedBoxGeometry(2.5, 1.6, .08, 3, .06), M.dark));
  const bc = document.createElement('canvas'); bc.width = 768; bc.height = 480;
  const bx = bc.getContext('2d');
  bx.fillStyle = '#2a0e10'; roundRect(bx, 0, 0, 768, 480, 30); bx.fill();
  bx.font = '600 30px sans-serif'; bx.textAlign = 'center'; bx.fillStyle = '#d6ac98';
  ['To do', 'Doing', 'Done'].forEach((s, i) => bx.fillText(s, 128 + i * 256, 62));
  bx.strokeStyle = 'rgba(255,170,120,.30)'; bx.lineWidth = 2;
  [256, 512].forEach(px => { bx.beginPath(); bx.moveTo(px, 28); bx.lineTo(px, 452); bx.stroke(); });
  bx.beginPath(); bx.moveTo(24, 92); bx.lineTo(744, 92); bx.stroke();
  const bt = new THREE.CanvasTexture(bc); bt.colorSpace = THREE.SRGBColorSpace; bt.anisotropy = 4;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), new THREE.MeshBasicMaterial({ map:bt, transparent:true }));
  face.position.z = .045; board.add(face);

  const colX = [-.8, 0, .8];
  const palette = [0xff4d2e, 0xffb938, 0xff8a3d, 0xf6e6d4, 0xff4d2e, 0xffb938];
  const startCols = [0, 0, 0, 1, 1, 2];
  const cards = palette.map((col, i) => {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(.66, .22, .06, 3, .05), new THREE.MeshStandardMaterial({ color:col, roughness:.45, metalness:.05 }));
    mesh.position.z = .09; board.add(mesh);
    return { mesh, col:startCols[i], tx:0, ty:0 };
  });
  function layout(){
    const n = [0,0,0];
    cards.forEach(c => { const s = n[c.col]++; c.tx = colX[c.col]; c.ty = .36 - s * .3; });
  }
  layout(); cards.forEach(c => { c.mesh.position.x = c.tx; c.mesh.position.y = c.ty; });
  let timer = 0;

  return { g, head, eyes, hands, extra(t, dt){
    board.position.y = .1 + (reduce ? 0 : Math.sin(t * 1.1) * .08);
    timer += dt;
    if (timer > 1.7) {
      timer = 0;
      const todo = cards.filter(c => c.col === 0), doing = cards.filter(c => c.col === 1);
      if (todo.length) todo[Math.floor(Math.random() * todo.length)].col = 1;
      else if (doing.length) doing[Math.floor(Math.random() * doing.length)].col = 2;
      else cards.forEach(c => { c.col = 0; });
      layout();
    }
    const k = Math.min(1, dt * 6);
    cards.forEach(c => { c.mesh.position.x += (c.tx - c.mesh.position.x) * k; c.mesh.position.y += (c.ty - c.mesh.position.y) * k; });
  } };
}

/* ---------- character C: the researcher ---------- */
function botC(){
  const g = new THREE.Group(), head = new THREE.Group(); head.position.y = .6; g.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(.88, 48, 32), M.pearl); skull.scale.set(1.1, .95, 1); head.add(skull);
  const visor = new THREE.Mesh(new RoundedBoxGeometry(1.55, .7, .3, 6, .3), M.dark); visor.position.set(0, .02, .74); head.add(visor);
  const eyes = new THREE.Group(); eyes.position.set(0, .03, .93); head.add(eyes);
  [-1, 1].forEach(s => {
    const goggle = new THREE.Mesh(new THREE.TorusGeometry(.27, .055, 12, 40), M.ember); goggle.position.set(s*.36, 0, -.01); eyes.add(goggle);
    const lensDisc = new THREE.Mesh(new THREE.CircleGeometry(.22, 32), new THREE.MeshBasicMaterial({ color:0xff8a3d, transparent:true, opacity:.22 })); lensDisc.position.set(s*.36, 0, -.005); eyes.add(lensDisc);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(.09, 16, 12), M.ember); pupil.position.set(s*.36, 0, .02); eyes.add(pupil);
    const gl = glow(0xff8a3d, .6); gl.position.set(s*.36, 0, .08); eyes.add(gl);
  });
  [-1, 1].forEach(s => {
    const ear = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .2, 24), M.dark); ear.rotation.z = Math.PI/2; ear.position.set(s*1.02, 0, 0); head.add(ear);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .22, 16), M.ember); cap.rotation.z = Math.PI/2; cap.position.set(s*1.04, 0, 0); head.add(cap);
  });
  const torso = new THREE.Mesh(new RoundedBoxGeometry(1.0, .85, .75, 6, .3), M.pearl); torso.position.y = -.8; g.add(torso);
  const bar = new THREE.Mesh(new RoundedBoxGeometry(.5, .06, .04, 2, .02), M.ember); bar.position.set(0, -.72, .38); g.add(bar);
  const hands = addHands(g, M.ember, -.75);
  hands[0].position.x = -1.0;

  /* hologram neural network (inner side, toward screen centre) */
  const holo = new THREE.Group(); holo.position.set(-1.85, .4, .2); g.add(holo);
  const layers = [3, 4, 4, 2], sx = .5, nodes = [];
  layers.forEach((n, li) => {
    const col = [];
    for (let j = 0; j < n; j++) {
      const p = new THREE.Vector3((li - 1.5) * sx, (j - (n - 1) / 2) * .36, 0);
      const s = new THREE.Mesh(new THREE.SphereGeometry(.065, 12, 10), M.ember); s.position.copy(p); holo.add(s);
      col.push(p);
    }
    nodes.push(col);
  });
  const edges = [], pts = [];
  for (let li = 0; li < layers.length - 1; li++) nodes[li].forEach(a => nodes[li+1].forEach(b => { edges.push([a, b]); pts.push(a.x, a.y, a.z, b.x, b.y, b.z); }));
  const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  holo.add(new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color:0xff8a3d, transparent:true, opacity:.4 })));
  const pulses = [];
  for (let i = 0; i < 8; i++) {
    const sp = glow(0xffe0b0, .3); holo.add(sp);
    pulses.push({ sp, e:Math.floor(Math.random() * edges.length), t:Math.random(), v:.5 + Math.random() * .6 });
  }
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.55, .6, .04, 32), M.mid); base.position.y = -.85; holo.add(base);
  const baseRing = new THREE.Mesh(new THREE.TorusGeometry(.55, .02, 8, 40), M.ember); baseRing.rotation.x = Math.PI/2; baseRing.position.y = -.83; holo.add(baseRing);

  return { g, head, eyes, hands, extra(t, dt){
    holo.rotation.y = reduce ? 0 : Math.sin(t * .5) * .6;
    holo.position.y = .4 + (reduce ? 0 : Math.sin(t * 1.3 + 1) * .07);
    pulses.forEach(p => {
      p.t += dt * p.v;
      if (p.t > 1) { p.t = 0; p.e = Math.floor(Math.random() * edges.length); }
      p.sp.position.lerpVectors(edges[p.e][0], edges[p.e][1], p.t);
    });
  } };
}

/* ---------- stage ---------- */
const bots = { A:botA(), B:botB(), C:botC() };
let phase = 0;
Object.keys(bots).forEach(k => {
  const b = bots[k];
  b.key = k; b.s = 0; b.x = 0; b.y = 0; b.sc = 1; b.tx = 0; b.ty = 0; b.mul = k === 'B' ? .85 : 1;
  b.phase = (phase += 1.7); b.blink = 2 + Math.random() * 3; b.blinkT = 0;
  b.g.position.z = -9; b.g.scale.setScalar(.0001); b.g.visible = false;
  rig.add(b.g);
});

const HALF_H = Math.tan(THREE.MathUtils.degToRad(19)) * 9;
const HALF_H_FAB = Math.tan(THREE.MathUtils.degToRad(19)) * 14;
function place(b, side){
  const aspect = W / H, halfW = HALF_H * aspect, dir = side === 'left' ? -1 : 1;
  if (aspect < .95)      { b.tx = 0;               b.ty = HALF_H * .40; b.sc = .62; }
  else if (W < 1180)     { b.tx = dir * halfW*.58; b.ty = -.1;          b.sc = .8; }
  else                   { b.tx = dir * halfW*.54; b.ty = -.1;          b.sc = 1.0; }
  b.sc *= b.mul;
}

/* ---------- lens (post-process) ---------- */
const post = new THREE.ShaderMaterial({
  depthTest:false, depthWrite:false, toneMapped:false,
  uniforms:{
    tDiffuse:{value:rt.texture}, uMouse:{value:new THREE.Vector2(.5,.5)}, uStrength:{value:0},
    uRadius:{value:.2}, uAspect:{value:W/H}, uRip:{value:new THREE.Vector2(.5,.5)}, uRipT:{value:99},
    uRim:{value:new THREE.Color(0xff8a3d)}
  },
  vertexShader:`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader:`
    precision highp float;
    uniform sampler2D tDiffuse; uniform vec2 uMouse, uRip;
    uniform float uStrength, uRadius, uAspect, uRipT; uniform vec3 uRim;
    varying vec2 vUv;
    void main(){
      vec2 uv = vUv;
      vec2 rp = uv - uRip; rp.x *= uAspect;
      float rr = length(rp);
      float ringW = exp(-pow((rr - uRipT * .75) * 14.0, 2.0)) * exp(-uRipT * 1.8) * step(uRipT, 3.0);
      vec2 dir = normalize(rp + 1e-5);
      uv += vec2(dir.x / uAspect, dir.y) * ringW * .018;

      vec2 d = uv - uMouse;
      vec2 da = vec2(d.x * uAspect, d.y);
      float t = length(da) / uRadius;
      float f = 1.0 - smoothstep(0.0, 1.0, t);
      float s = uStrength * f;
      vec3 col;
      col.r = texture2D(tDiffuse, uMouse + d * (1.0 - s * .93)).r;
      col.g = texture2D(tDiffuse, uMouse + d * (1.0 - s)).g;
      col.b = texture2D(tDiffuse, uMouse + d * (1.0 - s * 1.07)).b;
      float rimV = smoothstep(.78, 1.0, t) * (1.0 - smoothstep(1.0, 1.08, t));
      col += uRim * rimV * uStrength * .5;
      col += uRim * f * f * uStrength * .05;
      gl_FragColor = vec4(col, 1.0);
      #include <colorspace_fragment>
    }`
});
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post); quad.frustumCulled = false;
const postScene = new THREE.Scene(); postScene.add(quad);
const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

/* ---------- resize ---------- */
function resize(){
  const w = innerWidth, h = innerHeight;
  if (w === W && Math.abs(h - H) < 80) return;
  W = w; H = h;
  renderer.setSize(W, H, false);
  rt.setSize(W * DPR, H * DPR);
  camera.aspect = W / H; camera.updateProjectionMatrix();
  post.uniforms.uAspect.value = W / H;
}
addEventListener('resize', resize);

/* ---------- loop ---------- */
const viewCols = { both:new THREE.Color(0xff8a3d), eng:new THREE.Color(0xffb938), pm:new THREE.Color(0xff4d2e) };
const curCol = (viewCols[body.dataset.view] || viewCols.both).clone();
const vTmp = new THREE.Vector3();
const clamp = THREE.MathUtils.clamp;
let last = performance.now(), first = true;

function loop(now){
  requestAnimationFrame(loop);
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  const t = now / 1000;

  curCol.lerp(viewCols[body.dataset.view] || viewCols.both, Math.min(1, dt * 3));
  fabricMat.uniforms.uColB.value.copy(curCol);
  post.uniforms.uRim.value.copy(curCol);
  fabricMat.uniforms.uTime.value = reduce ? 0 : t;
  fabricMat.uniforms.uMouse.value.set((lens.x * 2 - 1) * HALF_H_FAB * (W / H), (lens.y * 2 - 1) * HALF_H_FAB);
  fabricMat.uniforms.uAmp.value = lens.s * 8;
  fabricMat.uniforms.uAmpN.value = Math.min(1, lens.s / .6);
  fabricMat.uniforms.uScroll.value = (scrollY / H) * 3;

  stars.rotation.z = reduce ? 0 : t * .006;
  rig.rotation.y += ((lens.x - .5) * 2 * .035 - rig.rotation.y) * .05;
  rig.rotation.x += (-(lens.y - .5) * 2 * .025 - rig.rotation.x) * .05;

  const active = body.dataset.char || 'A', side = body.dataset.side || 'right';
  const lx = lens.x * 2 - 1, ly = lens.y * 2 - 1;
  const nod = lens.ct < 2 ? Math.sin(lens.ct * 16) * Math.exp(-lens.ct * 5) * .22 : 0;

  for (const k in bots) {
    const b = bots[k], on = k === active;
    if (on) { place(b, side); if (b.s < .03) { b.x = b.tx; b.y = b.ty; } }
    b.s +=((on ? 1 : 0) - b.s) * Math.min(1, dt * (reduce ? 30 : 5));
    if (b.s < .01 && !on) { b.g.visible = false; continue; }
    b.g.visible = true;
    const mk = Math.min(1, dt * 4);
    b.x += (b.tx - b.x) * (on ? mk : 0);
    b.y += (b.ty - b.y) * (on ? mk : 0);
    b.g.scale.setScalar(Math.max(.0001, b.s * b.sc));
    b.g.position.x = b.x;
    b.g.position.y = b.y + (reduce ? 0 : Math.sin(t * 1.25 + b.phase) * .09);
    b.g.rotation.y = (1 - b.s) * (b.tx < 0 ? 1.1 : -1.1);

    b.g.getWorldPosition(vTmp); vTmp.project(camera);
    const dx = lx - vTmp.x, dy = ly - vTmp.y;
    const yaw = clamp(dx * .7, -.75, .75), pitch = clamp(-dy * .55, -.45, .45) + (on ? nod : 0);
    const kk = Math.min(1, dt * 6);
    b.head.rotation.y += (yaw - b.head.rotation.y) * kk;
    b.head.rotation.x += (pitch - b.head.rotation.x) * kk;
    b.eyes.position.x += (clamp(dx * .12, -.1, .1) - b.eyes.position.x) * kk;

    b.blink -= dt;
    if (b.blink < 0) { b.blinkT = .13; b.blink = 2.5 + Math.random() * 3.5; }
    if (b.blinkT > 0) { b.blinkT -= dt; b.eyes.scale.y = .1; } else b.eyes.scale.y += (1 - b.eyes.scale.y) * Math.min(1, dt * 20);

    b.hands.forEach((h, i) => { h.position.y = h.userData.y + (reduce ? 0 : Math.sin(t * 1.6 + i * 1.7 + b.phase) * .06); });
    b.extra(t, dt);
  }

  post.uniforms.uMouse.value.set(lens.x, lens.y);
  post.uniforms.uStrength.value = lens.s;
  post.uniforms.uRadius.value = lens.radius;
  post.uniforms.uRip.value.set(lens.cx, lens.cy);
  post.uniforms.uRipT.value = reduce ? 99 : lens.ct;

  renderer.setRenderTarget(rt);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  renderer.render(postScene, postCam);

  if (first) { first = false; root.classList.add('gl-ready'); }
}
requestAnimationFrame(loop);
