import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

function parseOBJ(text) {
  const pos = [], nor = [], vs = [], ns = [];
  const lines = text.split('\n');
  const pushIdx = (tok) => {
    const p = tok.split('/');
    let vi = parseInt(p[0], 10); if (vi < 0) vi = vs.length / 3 + vi + 1;
    pos.push(vs[(vi - 1) * 3], vs[(vi - 1) * 3 + 1], vs[(vi - 1) * 3 + 2]);
    if (p[2]) {
      let ni = parseInt(p[2], 10); if (ni < 0) ni = ns.length / 3 + ni + 1;
      nor.push(ns[(ni - 1) * 3], ns[(ni - 1) * 3 + 1], ns[(ni - 1) * 3 + 2]);
    }
  };
  for (const raw of lines) {
    const l = raw.trim();
    if (!l || l[0] === '#') continue;
    const t = l.split(/\s+/);
    if (t[0] === 'v') vs.push(+t[1], +t[2], +t[3]);
    else if (t[0] === 'vn') ns.push(+t[1], +t[2], +t[3]);
    else if (t[0] === 'f') {
      for (let i = 2; i < t.length - 1; i++) { pushIdx(t[1]); pushIdx(t[i]); pushIdx(t[i + 1]); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  if (nor.length === pos.length) g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  else g.computeVertexNormals();
  return g;
}

class Starburst3D extends HTMLElement {
  connectedCallback() {
    if (this._init) return;
    this._init = true;
    const w = this.clientWidth || 143, h = this.clientHeight || 163;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio * 2, 4));
    renderer.setSize(w, h, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    const cv = renderer.domElement;
    cv.style.cssText = 'width:100%;height:100%;display:block';
    this.appendChild(cv);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 100);
    camera.position.set(0, 0, 8);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xbfc6d8, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(2.5, 3.5, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xe6ecff, 1.4);
    fill.position.set(-3.5, -1.5, 2.5);
    scene.add(fill);
    const back = new THREE.DirectionalLight(0xffffff, 1.0);
    back.position.set(0, 1, -4);
    scene.add(back);

    const material = new THREE.MeshStandardMaterial({
      color: 0xc9cedd, metalness: 0.85, roughness: 0.28
    });

    const pivot = new THREE.Group();
    scene.add(pivot);

    fetch(this.getAttribute('src') || 'figma-antispam/assets/starburst.obj')
      .then((r) => r.text())
      .then((txt) => {
        const geo = parseOBJ(txt);
        geo.computeBoundingBox();
        const size = geo.boundingBox.getSize(new THREE.Vector3());
        const center = geo.boundingBox.getCenter(new THREE.Vector3());
        geo.translate(-center.x, -center.y, -center.z);
        const mesh = new THREE.Mesh(geo, material);
        mesh.scale.setScalar(2.2 / Math.max(size.x, size.y, size.z));
        pivot.add(mesh);
        camera.position.z = 4.6;
      })
      .catch(() => {});

    const t0 = performance.now();
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      pivot.rotation.y = Math.sin(t * 1.10) * 0.40;
      pivot.rotation.x = Math.sin(t * 0.84) * 0.13;
      pivot.rotation.z = Math.sin(t * 0.70) * 0.06;
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    };
    tick();

    new ResizeObserver(() => {
      const nw = this.clientWidth || w, nh = this.clientHeight || h;
      if (!nw || !nh) return;
      renderer.setSize(nw, nh, false);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
    }).observe(this);
  }
}
if (!customElements.get('starburst-3d')) customElements.define('starburst-3d', Starburst3D);
