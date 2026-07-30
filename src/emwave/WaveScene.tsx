import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import ThemeUpdater from "../components/ThemeUpdater";
import { presets, getFields, normalize, len } from "./wavePhysics";

function V(x, y, z) { return new THREE.Vector3(x, y, z); }

interface SceneRefs {
  arrowsGroup: THREE.Group | null;
  linesGroup: THREE.Group | null;
  kArrow: THREE.ArrowHelper | null;
  waGroup: THREE.Group | null;
  frontGroup: THREE.Group | null;
  envGroup: THREE.Group | null;
  standingGroup: THREE.Group | null;
  reflector: THREE.Mesh | null;
  source: THREE.Mesh | null;
  grid: THREE.GridHelper | null;
  arrowsList: { pos: number[]; eArrow: THREE.ArrowHelper; bArrow: THREE.ArrowHelper }[];
  waList: { pos: number[]; eArrow: THREE.ArrowHelper; bArrow: THREE.ArrowHelper }[];
  lineData: any;
}

function AnimatedScene({ params, toggles }) {
  var { scene } = useThree();
  var clockRef = useRef(new THREE.Clock());
  var allRef = useRef<SceneRefs>({
    arrowsGroup: null,
    linesGroup: null,
    kArrow: null,
    waGroup: null,
    frontGroup: null,
    envGroup: null,
    standingGroup: null,
    reflector: null,
    source: null,
    grid: null,
    arrowsList: [],
    waList: [],
    lineData: {},
  });
  var paramsRef = useRef(params);
  paramsRef.current = params;
  var togglesRef = useRef(toggles);
  togglesRef.current = toggles;

  var kVal = params.k;
  var omegaVal = params.omega;
  var ampVal = params.amp;
  var preset = params.preset;

  var waves = useMemo(function () {
    var def = presets[preset];
    if (!def) return [];
    if (preset === "reflection") {
      return def.build(kVal, omegaVal, params.angle * Math.PI / 180);
    }
    return def.build(kVal, omegaVal);
  }, [preset, params.angle, kVal, omegaVal]);

  useEffect(function () {
    var r = allRef.current;

    if (r.arrowsGroup) { scene.remove(r.arrowsGroup); r.arrowsGroup = null; }
    if (r.linesGroup) { scene.remove(r.linesGroup); r.linesGroup = null; }
    if (r.kArrow) { scene.remove(r.kArrow); r.kArrow = null; }
    if (r.waGroup) { scene.remove(r.waGroup); r.waGroup = null; }
    if (r.frontGroup) { scene.remove(r.frontGroup); r.frontGroup = null; }
    if (r.envGroup) { scene.remove(r.envGroup); r.envGroup = null; }
    if (r.standingGroup) { scene.remove(r.standingGroup); r.standingGroup = null; }
    if (r.reflector) { scene.remove(r.reflector); r.reflector = null; }
    if (r.source) { scene.remove(r.source); r.source = null; }
    if (r.grid) { scene.remove(r.grid); r.grid = null; }
    r.arrowsList = [];
    r.waList = [];
    r.lineData = {};

    var isLight = window.matchMedia("(prefers-color-scheme: light)").matches;

    // --- Grid ---
    var gridColor = isLight ? 0xd0d4dc : 0x2a2a35;
    var gridSub = isLight ? 0xe8ebf0 : 0x15151c;
    var grid = new THREE.GridHelper(20, 20, gridColor, gridSub);
    scene.add(grid);
    r.grid = grid;

    // --- Field arrows (both E and B) ---
    if (toggles.showField) {
      var ag = new THREE.Group();
      r.arrowsList = [];
      for (var x = -4; x <= 4; x += 1.2) {
        for (var y = -4; y <= 4; y += 1.2) {
          for (var z = -4; z <= 4; z += 1.2) {
            var p = [x, y, z];
            var eArrow = new THREE.ArrowHelper(V(1, 0, 0), V(x, y, z), 0.1, 0x00d4ff, 0.12, 0.06);
            var bArrow = new THREE.ArrowHelper(V(0, 1, 0), V(x, y, z), 0.1, 0xff3366, 0.12, 0.06);
            ag.add(eArrow);
            ag.add(bArrow);
            r.arrowsList.push({ pos: p, eArrow, bArrow });
          }
        }
      }
      scene.add(ag);
      r.arrowsGroup = ag;
    }

    // --- Field lines ---
    var N = 300, L = 10;
    if (toggles.showLines) {
      var lg = new THREE.Group();
      r.lineData = { type: "plane", N, L, km: [0, 0, 1] };

      if (preset === "spherical") {
        var dirs = [
          [1,0,0],[0,1,0],[0,0,1],[-1,0,0],[0,-1,0],[0,0,-1],
          [0.707,0.707,0],[0.707,-0.707,0],[-0.707,0.707,0],[-0.707,-0.707,0],
          [0.707,0,0.707],[0.707,0,-0.707],[0,0.707,0.707],[0,0.707,-0.707],
        ];
        var normDirs = [];
        for (var di = 0; di < dirs.length; di++) {
          var l = Math.sqrt(dirs[di][0]*dirs[di][0] + dirs[di][1]*dirs[di][1] + dirs[di][2]*dirs[di][2]);
          normDirs.push([dirs[di][0]/l, dirs[di][1]/l, dirs[di][2]/l]);
        }
        r.lineData = { type: "spherical", dirs: normDirs, N, L };
        lg.add(new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.9 })));
        lg.add(new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xff3366, transparent: true, opacity: 0.9 })));
      } else if (preset === "reflection") {
        r.lineData = { type: "reflection", N, L };
        lg.add(new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.9 })));
        lg.add(new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xff3366, transparent: true, opacity: 0.9 })));
      } else {
        var km = [0, 0, 1];
        if (waves.length > 0) km = normalize(waves[0].K);
        r.lineData = { type: "plane", km, N, L };
        lg.add(new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.9 })));
        lg.add(new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xff3366, transparent: true, opacity: 0.9 })));
      }
      scene.add(lg);
      r.linesGroup = lg;
    }

    // --- k arrow ---
    if (toggles.showK && waves.length > 0 && preset !== "spherical" && preset !== "reflection") {
      var kDir = normalize(waves[0].K);
      var kArr = new THREE.ArrowHelper(V(kDir[0], kDir[1], kDir[2]), V(0, 0, 0), 2.8, 0xffd700, 0.5, 0.3);
      scene.add(kArr);
      r.kArrow = kArr;
    }

    // --- Wave arrows (both E and B) ---
    if (toggles.showWaveArrows) {
      var wg = new THREE.Group();
      r.waList = [];
      var L = 10;

      if (preset === "spherical") {
        var dirs = [
          [1,0,0],[0,1,0],[0,0,1],[-1,0,0],[0,-1,0],[0,0,-1],
          [0.707,0.707,0],[0.707,-0.707,0],
        ];
        var normDirs = [];
        for (var di = 0; di < dirs.length; di++) {
          var l = Math.sqrt(dirs[di][0]*dirs[di][0] + dirs[di][1]*dirs[di][1] + dirs[di][2]*dirs[di][2]);
          normDirs.push([dirs[di][0]/l, dirs[di][1]/l, dirs[di][2]/l]);
        }
        for (var di = 0; di < normDirs.length; di++) {
          for (var ri = 0; ri < 4; ri++) {
            var radius = 0.8 + 1.4 * ri;
            var pos = V(normDirs[di][0] * radius, normDirs[di][1] * radius, normDirs[di][2] * radius);
            var eArr = new THREE.ArrowHelper(V(1, 0, 0), pos, 0.35, 0x00d4ff, 0.18, 0.1);
            var bArr = new THREE.ArrowHelper(V(0, 1, 0), pos, 0.35, 0xff3366, 0.18, 0.1);
            wg.add(eArr);
            wg.add(bArr);
            r.waList.push({ pos: [pos.x, pos.y, pos.z], eArrow: eArr, bArrow: bArr });
          }
        }
      } else if (preset === "reflection") {
        var angRad = params.angle * Math.PI / 180;
        var kDir = [Math.sin(angRad), 0, -Math.cos(angRad)];
        for (var i = 0; i < 12; i++) {
          var frac = (i / 11) * 8 - 4;
          var pos = V(kDir[0] * frac, 0, kDir[2] * frac);
          pos.add(V(0, 0, -0.5));
          var eArr = new THREE.ArrowHelper(V(1, 0, 0), pos, 0.4, 0x00d4ff, 0.2, 0.12);
          var bArr = new THREE.ArrowHelper(V(0, 1, 0), pos, 0.4, 0xff3366, 0.2, 0.12);
          wg.add(eArr);
          wg.add(bArr);
          r.waList.push({ pos: [pos.x, pos.y, pos.z], eArrow: eArr, bArrow: bArr });
        }
      } else if (preset !== "plane_spherical") {
        var km = [0, 0, 1];
        if (waves.length > 0) km = normalize(waves[0].K);
        for (var i = 0; i < 12; i++) {
          var s = (i / 11 - 0.5) * L;
          var pos = V(km[0] * s, km[1] * s, km[2] * s);
          var eArr = new THREE.ArrowHelper(V(1, 0, 0), pos, 0.4, 0x00d4ff, 0.2, 0.12);
          var bArr = new THREE.ArrowHelper(V(0, 1, 0), pos, 0.4, 0xff3366, 0.2, 0.12);
          wg.add(eArr);
          wg.add(bArr);
          r.waList.push({ pos: [pos.x, pos.y, pos.z], eArrow: eArr, bArrow: bArr });
        }
      }
      scene.add(wg);
      r.waGroup = wg;
    }

    // --- Wave fronts (original style) ---
    if (toggles.showFront) {
      var fg = new THREE.Group();
      var v = omegaVal / kVal;
      var frontColor = isLight ? 0x0066cc : 0x66bbff;
      var cycle = 20;

      if (preset === "spherical") {
        var mat = new THREE.MeshBasicMaterial({ color: frontColor, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false });
        var mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), mat);
        mesh.userData = { type: "sphere", v, maxR: 12 };
        fg.add(mesh);
      } else if (preset === "standing") {
        // no traveling fronts
      } else if (preset === "interference") {
        var wavesData = waves.length > 1 ? waves : [{ K: [0, 0, 1] }, { K: [0.5, 0, 0.866] }];
        for (var wi = 0; wi < 2; wi++) {
          let kDir = normalize(wavesData[wi].K);
          var col = wi === 0 ? frontColor : (isLight ? 0xcc0055 : 0xff88bb);
          let mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false });
          let plane = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), mat);
          plane.userData = { type: "plane", kDir, v, offset: wi * 6.66 };
          fg.add(plane);
        }
      } else if (preset === "plane_spherical") {
        let km = waves.length > 0 ? normalize(waves[0].K) : [0, 0, 1];
        var pMat = new THREE.MeshBasicMaterial({ color: frontColor, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false });
        var pMesh = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), pMat);
        pMesh.userData = { type: "plane", kDir: km, v, offset: 0 };
        fg.add(pMesh);
        var sMat = new THREE.MeshBasicMaterial({ color: isLight ? 0xcc8800 : 0xffcc44, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false });
        var sMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), sMat);
        sMesh.userData = { type: "sphere", v, maxR: 12 };
        fg.add(sMesh);
      } else if (preset === "reflection") {
        var angRad = params.angle * Math.PI / 180;
        for (var wi = 0; wi < 2; wi++) {
          let kDir = [Math.sin(angRad), 0, wi === 0 ? -Math.cos(angRad) : Math.cos(angRad)];
          var col = wi === 0 ? frontColor : (isLight ? 0xcc6600 : 0xffaa44);
          let mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false });
          let plane = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), mat);
          plane.userData = { type: "plane", kDir, v, offset: 0 };
          fg.add(plane);
        }
      } else {
        let km = [0, 0, 1];
        if (waves.length > 0) km = normalize(waves[0].K);
        let geom = params.beamMode
          ? new THREE.CircleGeometry(params.beamWidth * 2.2, 64)
          : new THREE.PlaneGeometry(16, 16);
        let mat = new THREE.MeshBasicMaterial({ color: frontColor, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false });
        let mesh = new THREE.Mesh(geom, mat);
        mesh.userData = { type: "plane", kDir: km, v, offset: 0 };
        fg.add(mesh);
      }
      scene.add(fg);
      r.frontGroup = fg;
    }

    // --- Beam envelope ---
    if (toggles.showEnvelope && preset !== "spherical" && preset !== "plane_spherical" && preset !== "reflection") {
      var eg = new THREE.Group();
      var km = [0, 0, 1];
      if (waves.length > 0) km = normalize(waves[0].K);
      for (var i = 0; i < 7; i++) {
        var dist = (i / 6 - 0.5) * 8;
        var geo = new THREE.RingGeometry(params.beamWidth * 0.92, params.beamWidth, 32);
        var mat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false });
        var ring = new THREE.Mesh(geo, mat);
        ring.position.set(km[0] * dist, km[1] * dist, km[2] * dist);
        ring.quaternion.setFromUnitVectors(V(0, 0, 1), V(km[0], km[1], km[2]));
        eg.add(ring);
      }
      scene.add(eg);
      r.envGroup = eg;
    }

    // --- Standing nodes ---
    if (preset === "standing" && toggles.showFront) {
      var sg = new THREE.Group();
      for (var i = 0; i < 8; i++) {
        var z = (Math.PI / 2 + i * Math.PI) / kVal;
        var geo = new THREE.RingGeometry(0.08, 0.18, 32);
        var mat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false });
        var ring = new THREE.Mesh(geo, mat);
        ring.position.set(0, 0, z);
        ring.rotation.x = -Math.PI / 2;
        sg.add(ring);
      }
      scene.add(sg);
      r.standingGroup = sg;
    }

    // --- Reflector ---
    if (preset === "reflection") {
      var refl = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.MeshBasicMaterial({ color: isLight ? 0xffffff : 0x444455, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
      scene.add(refl);
      r.reflector = refl;
    }

    // --- Source ---
    if (preset === "spherical" || preset === "plane_spherical") {
      var src = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
      scene.add(src);
      r.source = src;
    }

    return function () {
      if (r.arrowsGroup) { scene.remove(r.arrowsGroup); r.arrowsGroup = null; }
      if (r.linesGroup) { scene.remove(r.linesGroup); r.linesGroup = null; }
      if (r.kArrow) { scene.remove(r.kArrow); r.kArrow = null; }
      if (r.waGroup) { scene.remove(r.waGroup); r.waGroup = null; }
      if (r.frontGroup) { scene.remove(r.frontGroup); r.frontGroup = null; }
      if (r.envGroup) { scene.remove(r.envGroup); r.envGroup = null; }
      if (r.standingGroup) { scene.remove(r.standingGroup); r.standingGroup = null; }
      if (r.reflector) { scene.remove(r.reflector); r.reflector = null; }
      if (r.source) { scene.remove(r.source); r.source = null; }
      if (r.grid) { scene.remove(r.grid); r.grid = null; }
      r.arrowsList = [];
      r.waList = [];
      r.lineData = {};
    };
  }, [preset, params.angle, kVal, omegaVal, params.beamMode, params.beamWidth, toggles.showField, toggles.showLines, toggles.showK, toggles.showWaveArrows, toggles.showFront, toggles.showEnvelope, waves, scene]);

  useFrame(function () {
    var r = allRef.current;
    var t = clockRef.current.getElapsedTime();
    var p = paramsRef.current;
    var tg = togglesRef.current;
    var kw = p.k, ow = p.omega, aw = p.amp, pr = p.preset;

    // Field arrows
    if (r.arrowsGroup) {
      for (var ai = 0; ai < r.arrowsList.length; ai++) {
        var d = r.arrowsList[ai];
        var fields = getFields(d.pos, t, pr, waves, kw, ow, aw, p.beamMode, p.beamWidth);
        var eLen = len(fields.E);
        var bLen = len(fields.B);
        if (eLen > 0.001) {
          d.eArrow.setDirection(V(fields.E[0] / eLen, fields.E[1] / eLen, fields.E[2] / eLen));
          d.eArrow.setLength(eLen, 0.15, 0.08);
        } else {
          d.eArrow.setLength(0.05);
        }
        if (bLen > 0.001) {
          d.bArrow.setDirection(V(fields.B[0] / bLen, fields.B[1] / bLen, fields.B[2] / bLen));
          d.bArrow.setLength(bLen, 0.15, 0.08);
        } else {
          d.bArrow.setLength(0.05);
        }
      }
    }

    // Field lines
    var ld = r.lineData;
    var lg = r.linesGroup;
    if (lg && ld.type) {
      var N = ld.N, L = ld.L;
      if (ld.type === "plane") {
        var ePos = new Float32Array(N * 3);
        var bPos = new Float32Array(N * 3);
        var km = ld.km;
        for (var i = 0; i < N; i++) {
          var frac = (i / (N - 1) - 0.5) * L;
          var rp = [km[0] * frac, km[1] * frac, km[2] * frac];
          var fields = getFields(rp, t, pr, waves, kw, ow, aw, p.beamMode, p.beamWidth);
          ePos[i * 3] = rp[0] + fields.E[0];
          ePos[i * 3 + 1] = rp[1] + fields.E[1];
          ePos[i * 3 + 2] = rp[2] + fields.E[2];
          bPos[i * 3] = rp[0] + fields.B[0];
          bPos[i * 3 + 1] = rp[1] + fields.B[1];
          bPos[i * 3 + 2] = rp[2] + fields.B[2];
        }
        (lg.children[0] as THREE.Line).geometry.setAttribute("position", new THREE.BufferAttribute(ePos, 3));
        (lg.children[0] as THREE.Line).geometry.attributes.position.needsUpdate = true;
        (lg.children[1] as THREE.Line).geometry.setAttribute("position", new THREE.BufferAttribute(bPos, 3));
        (lg.children[1] as THREE.Line).geometry.attributes.position.needsUpdate = true;
      } else if (ld.type === "spherical") {
        var dirs = ld.dirs;
        for (var di = 0; di < dirs.length; di++) {
          var eArr = [], bArr = [];
          for (var i = 0; i < N; i++) {
            var frac = 0.3 + (i / N) * 7;
            var rp = [dirs[di][0] * frac, dirs[di][1] * frac, dirs[di][2] * frac];
            var fields = getFields(rp, t, pr, waves, kw, ow, aw, p.beamMode, p.beamWidth);
            eArr.push(rp[0] + fields.E[0], rp[1] + fields.E[1], rp[2] + fields.E[2]);
            bArr.push(rp[0] + fields.B[0], rp[1] + fields.B[1], rp[2] + fields.B[2]);
          }
          if (lg.children.length <= di * 2) {
            lg.add(new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.9 })));
            lg.add(new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xff3366, transparent: true, opacity: 0.9 })));
          }
          (lg.children[di * 2] as THREE.Line).geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(eArr), 3));
          (lg.children[di * 2] as THREE.Line).geometry.attributes.position.needsUpdate = true;
          (lg.children[di * 2 + 1] as THREE.Line).geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(bArr), 3));
          (lg.children[di * 2 + 1] as THREE.Line).geometry.attributes.position.needsUpdate = true;
        }
      } else if (ld.type === "reflection") {
        var angRad = p.angle * Math.PI / 180;
        var kDir = [Math.sin(angRad), 0, -Math.cos(angRad)];
        var ePos = new Float32Array(N * 3);
        var bPos = new Float32Array(N * 3);
        for (var i = 0; i < N; i++) {
          var frac = (i / (N - 1)) * L;
          var rp = [kDir[0] * frac, 0, kDir[2] * frac];
          var fields = getFields(rp, t, pr, waves, kw, ow, aw, p.beamMode, p.beamWidth);
          ePos[i * 3] = rp[0] + fields.E[0] * 0.5;
          ePos[i * 3 + 1] = rp[1] + fields.E[1] * 0.5;
          ePos[i * 3 + 2] = rp[2] + fields.E[2] * 0.5;
          bPos[i * 3] = rp[0] + fields.B[0] * 0.5;
          bPos[i * 3 + 1] = rp[1] + fields.B[1] * 0.5;
          bPos[i * 3 + 2] = rp[2] + fields.B[2] * 0.5;
        }
        (lg.children[0] as THREE.Line).geometry.setAttribute("position", new THREE.BufferAttribute(ePos, 3));
        (lg.children[0] as THREE.Line).geometry.attributes.position.needsUpdate = true;
        (lg.children[1] as THREE.Line).geometry.setAttribute("position", new THREE.BufferAttribute(bPos, 3));
        (lg.children[1] as THREE.Line).geometry.attributes.position.needsUpdate = true;
      }
    }

    // Wave arrows (both E and B)
    for (var wi = 0; wi < r.waList.length; wi++) {
      var wa = r.waList[wi];
      var fields = getFields(wa.pos, t, pr, waves, kw, ow, aw, p.beamMode, p.beamWidth);
      var eLen = len(fields.E);
      var bLen = len(fields.B);
      if (eLen > 0.001) {
        wa.eArrow.setDirection(V(fields.E[0] / eLen, fields.E[1] / eLen, fields.E[2] / eLen));
        wa.eArrow.setLength(eLen, 0.15, 0.08);
      } else {
        wa.eArrow.setLength(0.05);
      }
      if (bLen > 0.001) {
        wa.bArrow.setDirection(V(fields.B[0] / bLen, fields.B[1] / bLen, fields.B[2] / bLen));
        wa.bArrow.setLength(bLen, 0.15, 0.08);
      } else {
        wa.bArrow.setLength(0.05);
      }
    }

    // Wave fronts (original animation)
    var fg = r.frontGroup;
    if (fg) {
      for (var fi = 0; fi < fg.children.length; fi++) {
        var child = fg.children[fi];
        let d = child.userData;
        if (d.type === "plane") {
          var dist = ((d.v * t + (d.offset || 0)) % 20) - 10;
          child.position.set(d.kDir[0] * dist, d.kDir[1] * dist, d.kDir[2] * dist);
          child.lookAt(child.position.clone().add(V(d.kDir[0], d.kDir[1], d.kDir[2])));
        } else if (d.type === "sphere") {
          var rsc = (d.v * t) % d.maxR;
          child.scale.set(rsc, rsc, rsc);
          child.visible = rsc > 0.1;
        }
      }
    }
  });

  return null;
}

export default function WaveScene({ params, toggles }) {
  return (
    <Canvas
      camera={{ position: [10, 8, 10], fov: 45, near: 0.1, far: 100 }}
      gl={{ antialias: true }}
      style={{ width: "100%", height: "100%", cursor: "grab" }}
    >
      <ambientLight intensity={1.0} color={0x404060} />
      <directionalLight position={[15, 30, 15]} intensity={1.5} color={0xffffff} />
      <directionalLight position={[-15, -10, -15]} intensity={0.5} color={0x4488ff} />
      <ThemeUpdater />
      <AnimatedScene params={params} toggles={toggles} />
      <OrbitControls enableDamping dampingFactor={0.08} minDistance={2} maxDistance={25} />
    </Canvas>
  );
}
