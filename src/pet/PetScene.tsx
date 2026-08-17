import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import * as THREE from "three";

export type PetCharacter = "pip" | "puff" | "botty" | "spook" | "custom";

export interface PetConfig {
  characterType?: PetCharacter;
  scale?: number;
  speed?: number;
  wobbleSpeed?: number;
  enableIdle?: boolean;
  follow?: boolean;
  showBubble?: boolean;
  fallback?: ReactNode;
  bubbleText?: string;
  idleText?: string;
  bubbleBg?: string;
  bubbleColor?: string;
  bubbleOffsetX?: number;
  bubbleOffsetY?: number;
  customImage?: string;
  customImageSize?: number;
  customDepth?: number;
  pipColorBottom?: string;
  pipColorMiddle?: string;
  pipColorTop?: string;
  puffColorCenter?: string;
  puffColorEdge?: string;
  bottyColorTop?: string;
  bottyColorBottom?: string;
  bottyEyeColor?: string;
  globalEyeColor?: string;
  style?: CSSProperties;
}

const BASE_VERTEX = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vLocalPos;

void main() {
    vUv = uv;
    vLocalPos = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 viewSpacePos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-viewSpacePos.xyz);
    gl_Position = projectionMatrix * viewSpacePos;
}
`;

const PUFF_FRAG = `
uniform vec3 colorCenter;
uniform vec3 colorEdge;
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vViewDir);
    float rim = 1.0 - max(dot(n, v), 0.0);
    float mixFactor = pow(smoothstep(0.15, 0.85, rim), 1.2); 
    vec3 col = mix(colorCenter, colorEdge, mixFactor);
    vec3 l = normalize(vec3(0.2, 1.0, 0.8)); 
    vec3 h = normalize(l + v); 
    float spec = pow(max(dot(n, h), 0.0), 60.0); 
    col += vec3(1.0) * spec * 0.6; 
    gl_FragColor = vec4(col, 1.0);
}
`;

const BOTTY_VERTEX = `
uniform float uTime;
varying vec3 vNormal;
varying float vHeight;
varying vec3 vViewDir;

void main() {
    vec3 pos = position;
    
    // Tail wagging animation (adjusted for the shorter tail)
    if (pos.y < -0.95) {
        float tailT = (abs(pos.y) - 0.95) / 0.6; 
        pos.x += sin(uTime * 5.0) * (tailT * tailT) * 0.12;
    }
    
    vNormal = normalize(normalMatrix * normalize(pos));
    vHeight = pos.y; 
    vec4 viewSpacePos = modelViewMatrix * vec4(pos, 1.0);
    vViewDir = normalize(-viewSpacePos.xyz);
    gl_Position = projectionMatrix * viewSpacePos;
}
`;

const BOTTY_FRAG = `
uniform vec3 colorTop;
uniform vec3 colorBottom;
varying vec3 vNormal;
varying float vHeight;
varying vec3 vViewDir;

void main() {
    float h = clamp((vHeight + 1.15) / 2.3, 0.0, 1.0);
    vec3 col = mix(colorBottom, colorTop, smoothstep(0.15, 0.85, h));
    
    float rim = smoothstep(0.5, 1.0, 1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0));
    col += vec3(1.0) * rim * 0.45;
    
    gl_FragColor = vec4(col, 1.0);
}
`;

const PIP_VERTEX = `
uniform vec2 uCurve;
uniform vec3 uLocalOffset;
uniform vec3 uLocalScale;
uniform float uTime;
varying vec3 vFakeNormal;
varying float vHeight;
varying vec3 vViewDir;
void main() {
    vec3 pos = position;
    if (pos.y > 0.0) {
        float t = pos.y / 1.5; 
        float curveStrength = (pos.y * pos.y) * 0.25;
        pos.x += curveStrength * uCurve.x;
        pos.z += curveStrength * uCurve.y;
        pos.x += sin(t * 3.14 - uTime * 3.5) * (t * t * 0.12);
        pos.z += cos(t * 2.5 - uTime * 2.8) * (t * t * 0.08);
    }
    vec3 groupPos = (pos * uLocalScale) + uLocalOffset;
    vFakeNormal = normalize(normalMatrix * normalize(vec3(groupPos.x, groupPos.y * 0.8, groupPos.z)));
    vHeight = groupPos.y; 
    vec4 viewSpacePos = modelViewMatrix * vec4(pos, 1.0);
    vViewDir = normalize(-viewSpacePos.xyz);
    gl_Position = projectionMatrix * viewSpacePos;
}
`;

const PIP_FRAG = `
uniform vec3 colorBottom;
uniform vec3 colorMiddle;
uniform vec3 colorTop;
varying vec3 vFakeNormal;
varying float vHeight;
varying vec3 vViewDir;
void main() {
    float h = clamp((vHeight + 1.0) / 2.5, 0.0, 1.0);
    vec3 col = mix(mix(colorBottom, colorMiddle, smoothstep(0.0, 0.45, h)), colorTop, smoothstep(0.45, 0.95, h));
    float rim = smoothstep(0.4, 1.0, 1.0 - max(dot(normalize(vFakeNormal), normalize(vViewDir)), 0.0));
    col += vec3(1.0, 0.85, 0.4) * rim * 0.55;
    gl_FragColor = vec4(col, 1.0);
}
`;

const SPOOK_FRAG = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vLocalPos;

void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vViewDir);
    
    vec3 pink = vec3(1.0, 0.75, 0.85);
    vec3 yellow = vec3(1.0, 0.95, 0.6);
    vec3 green = vec3(0.6, 1.0, 0.8);
    vec3 blue = vec3(0.6, 0.8, 1.0);
    
    float mixX = clamp((vLocalPos.x + 1.0) / 2.0, 0.0, 1.0);
    float mixY = clamp((vLocalPos.y + 1.0) / 2.0, 0.0, 1.0);
    
    vec3 c1 = mix(pink, yellow, smoothstep(0.1, 0.6, mixX));
    vec3 c2 = mix(green, blue, smoothstep(0.4, 0.9, mixX));
    vec3 col = mix(c1, c2, smoothstep(0.2, 0.8, mixY));
    
    float rim = 1.0 - max(dot(n, v), 0.0);
    col = mix(vec3(1.0), col, smoothstep(0.0, 0.7, rim)); 
    
    vec3 l = normalize(vec3(0.5, 1.0, 0.8)); 
    vec3 h = normalize(l + v); 
    float spec = pow(max(dot(n, h), 0.0), 40.0); 
    col += vec3(1.0) * spec * 0.4; 
    
    gl_FragColor = vec4(col, 1.0);
}
`;

function buildPuffGeometry() {
  const geo = new THREE.SphereGeometry(1, 128, 128);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const r = Math.atan2(v.y, v.x);
    const s = (1 - Math.abs(v.z)) ** 1.5;
    const a = Math.cos(r * 8) * 0.12;
    v.x += Math.cos(r) * a * s;
    v.y += Math.sin(r) * a * s;
    v.z *= 0.4;
    v.x *= 1.05;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

function buildPipGeometry() {
  const pts: THREE.Vector2[] = [];
  for (let t = 0; t <= 100; t++) {
    const y = -1 + (t / 100) * 2.5;
    const r = y < 0 ? Math.sqrt(Math.max(0, 1 - y * y)) : (1 - (y / 1.5) ** 2) ** 1.5;
    pts.push(new THREE.Vector2(r, y));
  }
  return new THREE.LatheGeometry(pts, 128);
}

function buildBottyGeometry() {
  const geo = new THREE.SphereGeometry(1, 128, 128);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  const blend = 0.55;
  const iAngle = Math.PI / 2 - 0.65;
  const aAngle = Math.PI - 0.35;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const o = Math.atan2(v.z, v.x);
    const s = Math.acos(v.y);
    const c =
      1 /
      ((Math.abs(v.x) ** 4 + Math.abs(v.y) ** 4 + Math.abs(v.z) ** 4) ** 0.25 * blend +
        1 * (1 - blend));
    v.multiplyScalar(c);
    v.x *= 1.2;
    v.y *= 1.05;
    v.z *= 0.85;
    const l = Math.sqrt(((o - iAngle) * Math.sin(s) * 1.2) ** 2 + (s - aAngle) ** 2);
    if (l < 0.5) {
      const e = (1 - l / 0.5) ** 2 * 0.45;
      v.x += e * Math.cos(iAngle) * 1.5;
      v.y -= e;
      v.z += e * Math.sin(iAngle) * 0.2;
    }
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

function buildSpookGeometry() {
  const geo = new THREE.SphereGeometry(1, 128, 128, 0, Math.PI * 2, 0, Math.PI - 0.5);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    if (v.y < 0) {
      const e = Math.atan2(v.z, v.x);
      const t = Math.cos(e * 5) * 0.15;
      const r = Math.abs(v.y) / Math.abs(Math.cos(Math.PI - 0.5));
      v.y += t * r ** 3;
      v.x += v.x * r ** 2 * 0.1;
      v.z += v.z * r ** 2 * 0.1;
    }
    v.x *= 1.15;
    v.y *= 1.3;
    v.z *= 1.15;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

function buildLeafShape() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.5);
  shape.quadraticCurveTo(0.1, 0.1, 0.5, 0);
  shape.quadraticCurveTo(0.1, -0.1, 0, -0.5);
  shape.quadraticCurveTo(-0.1, -0.1, -0.5, 0);
  shape.quadraticCurveTo(-0.1, 0.1, 0, 0.5);
  return new THREE.ShapeGeometry(shape);
}

const DEFAULT_CONFIG: PetConfig = {
  characterType: "pip",
  scale: 1,
  speed: 0.05,
  wobbleSpeed: 2,
  enableIdle: true,
  follow: true,
  showBubble: true,
  bubbleText: "I talk too 😁",
  idleText: "Zzz... 💤",
  bubbleBg: "#FFFFFF",
  bubbleColor: "#111827",
  bubbleOffsetX: 1.2,
  bubbleOffsetY: 1.5,
  pipColorBottom: "#FFD700",
  pipColorMiddle: "#FF5500",
  pipColorTop: "#FF2244",
  puffColorCenter: "#FFFFFF",
  puffColorEdge: "#3A64FF",
  bottyColorTop: "#6EA8FF",
  bottyColorBottom: "#2A7DFF",
  bottyEyeColor: "#FFFFFF",
  globalEyeColor: "#111111",
  customImageSize: 1.8,
  customDepth: 0.25,
};

export default function PetScene(props: PetConfig) {
  const cfg = { ...DEFAULT_CONFIG, ...props };
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);
  const uniformsRef = useRef<{
    colorBottom?: THREE.Color;
    colorMiddle?: THREE.Color;
    colorTop?: THREE.Color;
    colorCenter?: THREE.Color;
    colorEdge?: THREE.Color;
    uTime?: { value: number };
  }>({});
  const materialRefs = useRef<{
    globalEyes?: THREE.MeshBasicMaterial | THREE.MeshStandardMaterial;
    bottyEyes?: THREE.MeshBasicMaterial;
  }>({});
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || failed) return;
    const d = cfgRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / Math.max(container.clientHeight, 1), 0.1, 100);
    camera.position.z = 5.5;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 2);
    dir.position.set(2, 5, 5);
    scene.add(dir);

    const group = new THREE.Group();
    scene.add(group);

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];
    const eyeMeshes: THREE.Mesh[] = [];
    const uniforms = uniformsRef.current;
    const materialsRef = materialRefs.current;
    let armMesh: THREE.Mesh | null = null;

    if (d.characterType === "custom") {
      const group2 = new THREE.Group();
      group.add(group2);
      if (d.customImage) {
        new THREE.TextureLoader().load(d.customImage, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
          textures.push(tex);
          const aspect = tex.image.width / tex.image.height;
          const depth = (d.customDepth || 0.25) / 30;
          const matTop = new THREE.MeshStandardMaterial({
            map: tex,
            transparent: false,
            alphaTest: 0.5,
            roughness: 0.15,
            metalness: 0.1,
            side: THREE.DoubleSide,
          });
          const matSide = new THREE.MeshStandardMaterial({
            map: tex,
            transparent: false,
            alphaTest: 0.5,
            roughness: 0.4,
            color: new THREE.Color(0x999999),
            side: THREE.DoubleSide,
          });
          materials.push(matTop, matSide);
          const size = d.customImageSize || 1.8;
          const plane = new THREE.PlaneGeometry(size * aspect, size);
          geometries.push(plane);
          for (let t = 0; t < 30; t++) {
            const z = (t - 30 / 2) * depth;
            const mesh = new THREE.Mesh(plane, t === 29 || t === 0 ? matTop : matSide);
            mesh.position.z = z;
            if (t === 0) mesh.rotation.y = Math.PI;
            group2.add(mesh);
          }
        });
      }
    } else if (d.characterType === "botty") {
      const geo = buildBottyGeometry();
      geometries.push(geo);
      const uniforms = {
        colorTop: { value: new THREE.Color(d.bottyColorTop) },
        colorBottom: { value: new THREE.Color(d.bottyColorBottom) },
        uTime: { value: 0 },
      };
      uniformsRef.current.colorTop = uniforms.colorTop.value;
      uniformsRef.current.colorBottom = uniforms.colorBottom.value;
      uniforms.uTime = uniforms.uTime;
      const mat = new THREE.ShaderMaterial({ vertexShader: BOTTY_VERTEX, fragmentShader: BOTTY_FRAG, uniforms });
      materials.push(mat);
      group.add(new THREE.Mesh(geo, mat));

      const eyeGeo = new THREE.CapsuleGeometry(0.14, 0.38, 32, 32);
      geometries.push(eyeGeo);
      const eyeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(d.bottyEyeColor) });
      materials.push(eyeMat);
      materialsRef.bottyEyes = eyeMat;
      const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
      eyeL.position.set(-0.35, 0.05, 0.82);
      eyeL.userData.origScaleY = 1;
      group.add(eyeL);
      eyeMeshes.push(eyeL);
      const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
      eyeR.position.set(0.35, 0.05, 0.82);
      eyeR.userData.origScaleY = 1;
      group.add(eyeR);
      eyeMeshes.push(eyeR);
    } else if (d.characterType === "spook") {
      const geo = buildSpookGeometry();
      geometries.push(geo);
      const mat = new THREE.ShaderMaterial({ vertexShader: BASE_VERTEX, fragmentShader: SPOOK_FRAG, side: THREE.DoubleSide });
      materials.push(mat);
      group.add(new THREE.Mesh(geo, mat));

      const eyeGeo = new THREE.SphereGeometry(0.18, 64, 64);
      geometries.push(eyeGeo);
      const eyeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(d.globalEyeColor) });
      materials.push(eyeMat);
      materialsRef.globalEyes = eyeMat;
      const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
      eyeL.scale.set(0.65, 1, 0.4);
      eyeL.position.set(-0.35, 0.1, 1.05);
      eyeL.rotation.z = 0.1;
      eyeL.userData.origScaleY = 1;
      group.add(eyeL);
      eyeMeshes.push(eyeL);
      const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
      eyeR.scale.set(0.65, 1, 0.4);
      eyeR.position.set(0.35, 0.1, 1.05);
      eyeR.rotation.z = -0.1;
      eyeR.userData.origScaleY = 1;
      group.add(eyeR);
      eyeMeshes.push(eyeR);

      const leaf = buildLeafShape();
      geometries.push(leaf);
      const leafMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      materials.push(leafMat);
      const leafMesh = new THREE.Mesh(leaf, leafMat);
      leafMesh.scale.set(0.35, 0.35, 0.35);
      leafMesh.position.set(1.3, 1.1, 0.8);
      group.add(leafMesh);
      armMesh = leafMesh;
    } else if (d.characterType === "puff") {
      const geo = buildPuffGeometry();
      geometries.push(geo);
      const uniforms = {
        colorCenter: { value: new THREE.Color(d.puffColorCenter) },
        colorEdge: { value: new THREE.Color(d.puffColorEdge) },
      };
      uniformsRef.current.colorCenter = uniforms.colorCenter.value;
      uniformsRef.current.colorEdge = uniforms.colorEdge.value;
      const mat = new THREE.ShaderMaterial({ vertexShader: BASE_VERTEX, fragmentShader: PUFF_FRAG, uniforms });
      materials.push(mat);
      group.add(new THREE.Mesh(geo, mat));

      const eyeGeo = new THREE.SphereGeometry(0.08, 64, 64);
      geometries.push(eyeGeo);
      const eyeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(d.globalEyeColor) });
      materials.push(eyeMat);
      materialsRef.globalEyes = eyeMat;
      const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
      eyeL.scale.set(0.9, 1.8, 0.4);
      eyeL.position.set(-0.22, 0, 0.38);
      eyeL.userData.origScaleY = 1.8;
      group.add(eyeL);
      eyeMeshes.push(eyeL);
      const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
      eyeR.scale.set(0.9, 1.8, 0.4);
      eyeR.position.set(0.22, 0, 0.38);
      eyeR.userData.origScaleY = 1.8;
      group.add(eyeR);
      eyeMeshes.push(eyeR);
    } else if (d.characterType === "pip") {
      const geo = buildPipGeometry();
      geometries.push(geo);
      const baseUniforms = {
        colorBottom: { value: new THREE.Color(d.pipColorBottom) },
        colorMiddle: { value: new THREE.Color(d.pipColorMiddle) },
        colorTop: { value: new THREE.Color(d.pipColorTop) },
        uTime: { value: 0 },
      };
      uniforms.colorBottom = baseUniforms.colorBottom.value;
      uniforms.colorMiddle = baseUniforms.colorMiddle.value;
      uniforms.colorTop = baseUniforms.colorTop.value;
      uniforms.uTime = baseUniforms.uTime;

      const mainMat = new THREE.ShaderMaterial({
        vertexShader: PIP_VERTEX,
        fragmentShader: PIP_FRAG,
        uniforms: {
          ...baseUniforms,
          uCurve: { value: new THREE.Vector2(0, 0) },
          uLocalOffset: { value: new THREE.Vector3(0, 0, 0) },
          uLocalScale: { value: new THREE.Vector3(1, 1, 1) },
        },
      });
      materials.push(mainMat);
      group.add(new THREE.Mesh(geo, mainMat));

      const flameLMat = new THREE.ShaderMaterial({
        vertexShader: PIP_VERTEX,
        fragmentShader: PIP_FRAG,
        uniforms: {
          ...baseUniforms,
          uCurve: { value: new THREE.Vector2(-1.8, 0) },
          uLocalOffset: { value: new THREE.Vector3(-0.62, 0.25, 0) },
          uLocalScale: { value: new THREE.Vector3(0.4, 0.65, 0.4) },
        },
      });
      materials.push(flameLMat);
      const flameL = new THREE.Mesh(geo, flameLMat);
      flameL.scale.set(0.4, 0.65, 0.4);
      flameL.position.set(-0.62, 0.25, 0);
      group.add(flameL);

      const flameRMat = new THREE.ShaderMaterial({
        vertexShader: PIP_VERTEX,
        fragmentShader: PIP_FRAG,
        uniforms: {
          ...baseUniforms,
          uCurve: { value: new THREE.Vector2(1.8, 0) },
          uLocalOffset: { value: new THREE.Vector3(0.62, 0.2, 0) },
          uLocalScale: { value: new THREE.Vector3(0.35, 0.55, 0.35) },
        },
      });
      materials.push(flameRMat);
      const flameR = new THREE.Mesh(geo, flameRMat);
      flameR.scale.set(0.35, 0.55, 0.35);
      flameR.position.set(0.62, 0.2, 0);
      group.add(flameR);

      const eyeGeo = new THREE.SphereGeometry(0.09, 64, 64);
      geometries.push(eyeGeo);
      const eyeMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(cfg.globalEyeColor), roughness: 0.1, metalness: 0.1 });
      materials.push(eyeMat);
      materialsRef.globalEyes = eyeMat;

      const glintGeo = new THREE.SphereGeometry(0.025, 32, 32);
      geometries.push(glintGeo);
      const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      materials.push(glintMat);

      const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
      eyeL.scale.set(1, 1.4, 2);
      eyeL.position.set(-0.35, -0.05, 0.85);
      eyeL.rotation.y = -0.15;
      eyeL.rotation.z = 0.05;
      eyeL.userData.origScaleY = 1.4;
      const glintL = new THREE.Mesh(glintGeo, glintMat);
      glintL.scale.set(1, 1 / 1.4, 1 / 2);
      glintL.position.set(0.035, 0.04, 0.075);
      eyeL.add(glintL);
      group.add(eyeL);
      eyeMeshes.push(eyeL);

      const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
      eyeR.scale.set(1, 1.4, 2);
      eyeR.position.set(0.35, -0.05, 0.85);
      eyeR.rotation.y = 0.15;
      eyeR.rotation.z = -0.05;
      eyeR.userData.origScaleY = 1.4;
      const glintR = new THREE.Mesh(glintGeo, glintMat);
      glintR.scale.set(1, 1 / 1.4, 1 / 2);
      glintR.position.set(0.035, 0.04, 0.075);
      eyeR.add(glintR);
      group.add(eyeR);
      eyeMeshes.push(eyeR);

      const noseGeo = new THREE.SphereGeometry(0.04, 64, 64);
      geometries.push(noseGeo);
      const noseMat = new THREE.MeshStandardMaterial({ color: 2754560, roughness: 0.6 });
      materials.push(noseMat);
      const nose = new THREE.Mesh(noseGeo, noseMat);
      nose.scale.set(1, 0.5, 1);
      nose.position.set(0, -0.22, 0.96);
      group.add(nose);
    }

    const sizeRef = { w: container.clientWidth, h: container.clientHeight };
    const pointer = { x: 0, y: 0 };
    let lastMove = performance.now();
    let visible = true;

    const onPointer = (cx: number, cy: number) => {
      if (!container || cfgRef.current.follow === false) return;
      lastMove = performance.now();
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      pointer.x = (cx - centerX) / (window.innerWidth / 2);
      pointer.y = -((cy - centerY) / (window.innerHeight / 2));
    };
    const onMouseMove = (e: MouseEvent) => onPointer(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (!e.touches || e.touches.length === 0) return;
      onPointer(e.touches[0].clientX, e.touches[0].clientY);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        sizeRef.w = width;
        sizeRef.h = height;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    });
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    intersectionObserver.observe(container);

    const tmpVector = new THREE.Vector3();
    let rafId: number;
    const loop = () => {
      rafId = requestAnimationFrame(loop);
      if (!visible) return;
      const d = cfgRef.current;
      const t = performance.now() * 0.001;
      const idle = d.enableIdle && performance.now() - lastMove > 3000;

      if (textRef.current) {
        const text = (idle && d.idleText) || d.bubbleText;
        if (textRef.current.innerText !== text) textRef.current.innerText = text;
      }

      let blink = 1;
      if (idle || t % 4 < 0.15 || t % 7 > 6.85) blink = 0.1;
      for (const eye of eyeMeshes) {
        if (eye.userData.origScaleY !== undefined) {
          eye.scale.y += (eye.userData.origScaleY * blink - eye.scale.y) * 0.2;
        }
      }

      if (uniforms.uTime && (d.characterType === "pip" || d.characterType === "botty")) {
        uniforms.uTime.value = t;
      }
      if (d.characterType === "spook" && armMesh) {
        armMesh.rotation.z = t * 1.5;
        armMesh.position.y = 1.1 + Math.sin(t * 3) * 0.1;
      }

      const f = d.wobbleSpeed || 2;
      const m = 1 + Math.sin(t * f) * (idle ? 0.035 : 0.02);
      const v = 1 - Math.sin(t * f) * (idle ? 0.02 : 0.01);
      const s = d.scale || 1;
      group.scale.set(s * v, s * m, s * v);

      const S = Math.sin(t * f * 0.8) * 0.08;
      let w = pointer.x * 2.5;
      let T = pointer.y * 1.5 + S;
      let E = pointer.x * 0.6;
      let D = -pointer.y * 0.4;
      if (idle) {
        w = Math.sin(t * 0.8) * 0.4;
        T = Math.cos(t * 0.6) * 0.3 + S;
        E = Math.sin(t * 0.5) * 0.3;
        D = Math.cos(t * 0.4) * 0.1;
      }

      const O = d.speed || 0.06;
      group.position.x += (w - group.position.x) * O;
      group.position.y += (T - group.position.y) * O;
      const k = -(w - group.position.x) * 0.15;
      group.rotation.y += (E - group.rotation.y) * (O * 1.5);
      group.rotation.x += (D - group.rotation.x) * (O * 1.5);
      group.rotation.z += (k - group.rotation.z) * (O * 1.5);

      if (d.showBubble && bubbleRef.current && sizeRef) {
        tmpVector.copy(group.position);
        tmpVector.x += (d.bubbleOffsetX || 1.2) * s;
        tmpVector.y += (d.bubbleOffsetY || 1.5) * s;
        tmpVector.project(camera);
        const px = (tmpVector.x * 0.5 + 0.5) * sizeRef.w;
        const py = (tmpVector.y * -0.5 + 0.5) * sizeRef.h;
        bubbleRef.current.style.transform = `translate3d(-50%, -100%, 0) translate3d(${px}px, ${py}px, 0)`;
      }

      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          if (obj.geometry) obj.geometry.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) {
            mat.forEach((m) => {
              if (m.map) m.map.dispose();
              m.dispose();
            });
          } else {
            if (mat.map) mat.map.dispose();
            mat.dispose();
          }
        }
      });
      textures.forEach((t) => t.dispose());
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      scene.clear();
      renderer.forceContextLoss();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.characterType, cfg.customImage, cfg.customImageSize, cfg.customDepth]);

  const d = cfgRef.current;
  useEffect(() => {
    const uniforms = uniformsRef.current;
    const materialsRef = materialRefs.current;
    if (d.characterType === "pip") {
      if (uniforms.colorBottom) uniforms.colorBottom.set(d.pipColorBottom);
      if (uniforms.colorMiddle) uniforms.colorMiddle.set(d.pipColorMiddle);
      if (uniforms.colorTop) uniforms.colorTop.set(d.pipColorTop);
    } else if (d.characterType === "puff") {
      if (uniforms.colorCenter) uniforms.colorCenter.set(d.puffColorCenter);
      if (uniforms.colorEdge) uniforms.colorEdge.set(d.puffColorEdge);
    } else if (d.characterType === "botty") {
      if (uniforms.colorTop) uniforms.colorTop.set(d.bottyColorTop);
      if (uniforms.colorBottom) uniforms.colorBottom.set(d.bottyColorBottom);
    }
    if (materialsRef.globalEyes) materialsRef.globalEyes.color.set(d.globalEyeColor);
    if (materialsRef.bottyEyes) materialsRef.bottyEyes.color.set(d.bottyEyeColor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.pipColorBottom, d.pipColorMiddle, d.pipColorTop, d.globalEyeColor, d.puffColorCenter, d.puffColorEdge, d.bottyColorTop, d.bottyColorBottom, d.bottyEyeColor, d.characterType]);

  if (failed) {
    if (cfg.fallback) return <>{cfg.fallback}</>;
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          minWidth: 100,
          minHeight: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        WebGL is unavailable
      </div>
    );
  }

  const bubbleStyle: CSSProperties = {
    backgroundColor: cfg.bubbleBg,
    color: cfg.bubbleColor,
    padding: "12px 22px",
    borderRadius: "24px",
    boxShadow: "0px 14px 34px rgba(0,0,0,0.12), 0px 4px 10px rgba(0,0,0,0.06)",
    fontWeight: 600,
    fontSize: "14px",
    fontFamily: '"Inter", -apple-system, sans-serif',
    whiteSpace: "nowrap",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        minWidth: 100,
        minHeight: 100,
        position: "relative",
        overflow: "visible",
        textDecoration: "none",
        ...cfg.style,
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          overflow: "visible",
        }}
      />
      {cfg.showBubble && (
        <div
          ref={bubbleRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
            zIndex: 100,
            willChange: "transform",
          }}
        >
          <div style={bubbleStyle}>
            <span ref={textRef}>{cfg.bubbleText}</span>
            <div
              style={{
                position: "absolute",
                bottom: "-7px",
                left: "24px",
                width: 0,
                height: 0,
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
                borderTop: `8px solid ${cfg.bubbleBg}`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
