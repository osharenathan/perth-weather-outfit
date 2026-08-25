import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const SKIN = 0xd9a066;
const container = document.getElementById("avatarContainer");

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(0, 1.4, 4.2);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
container.innerHTML = "";
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.1, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 2.6;
controls.maxDistance = 6;
controls.maxPolarAngle = Math.PI / 1.7;
controls.enablePan = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 2.2;

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
keyLight.position.set(2, 4, 3);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xaecbff, 0.35);
fillLight.position.set(-3, 2, -2);
scene.add(fillLight);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(1.3, 32),
  new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0.01;
scene.add(ground);

const avatar = new THREE.Group();
scene.add(avatar);

const mat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05 });

let parts = {};

function buildArm(side) {
  const group = new THREE.Group();
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.085, 0.42, 10), mat(0xffffff));
  upper.position.y = -0.21;
  const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.38, 10), mat(SKIN));
  fore.position.y = -0.61;
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), mat(SKIN));
  hand.position.y = -0.8;
  group.add(upper, fore, hand);
  group.position.set(side * 0.42, 1.62, 0);
  group.rotation.z = side * 0.12;
  avatar.add(group);
  return { group, upper, fore, hand };
}

function buildAvatar() {
  // legs
  const legGeo = new THREE.CylinderGeometry(0.14, 0.13, 0.9, 12);
  const legL = new THREE.Mesh(legGeo, mat(0x555b66));
  legL.position.set(-0.16, 0.45, 0);
  const legR = legL.clone();
  legR.position.x = 0.16;
  avatar.add(legL, legR);

  // shoes
  const shoeGeo = new THREE.BoxGeometry(0.2, 0.12, 0.32);
  const shoeL = new THREE.Mesh(shoeGeo, mat(0x1a1a1a));
  shoeL.position.set(-0.16, 0.06, 0.05);
  const shoeR = shoeL.clone();
  shoeR.position.x = 0.16;
  avatar.add(shoeL, shoeR);

  // torso (shirt)
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.85, 16), mat(0xffffff));
  torso.position.y = 1.32;
  avatar.add(torso);

  // collar (shirt visible at the neck even under a jacket)
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 8, 16), mat(0xffffff));
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 1.72;
  avatar.add(collar);

  const armL = buildArm(-1);
  const armR = buildArm(1);

  // neck + head
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.12, 10), mat(SKIN));
  neck.position.y = 1.8;
  avatar.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), mat(SKIN));
  head.position.y = 2.02;
  avatar.add(head);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.225, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.9),
    mat(0x2b1c12)
  );
  hair.position.y = 2.05;
  avatar.add(hair);

  // sunglasses (hidden until UV is high)
  const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.05), mat(0x111111));
  glasses.position.set(0, 2.02, 0.2);
  glasses.visible = false;
  avatar.add(glasses);

  // scarf (hidden unless cold)
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.08, 8, 16), mat(0x7a1f2b));
  scarf.rotation.x = Math.PI / 2;
  scarf.position.y = 1.74;
  scarf.visible = false;
  avatar.add(scarf);

  // jacket overlay (hidden unless cool/cold)
  const jacket = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.34, 0.62, 16), mat(0x2b3444));
  jacket.position.y = 1.5;
  jacket.visible = false;
  avatar.add(jacket);
  const shoulderGeo = new THREE.SphereGeometry(0.13, 12, 12);
  const shoulderL = new THREE.Mesh(shoulderGeo, mat(0x2b3444));
  shoulderL.position.set(-0.4, 1.72, 0);
  shoulderL.visible = false;
  const shoulderR = shoulderL.clone();
  shoulderR.position.x = 0.4;
  avatar.add(shoulderL, shoulderR);

  // umbrella (hidden unless rain is likely)
  const umbrellaGroup = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.1, 8), mat(0x333333));
  shaft.position.y = 0.55;
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.32, 12), mat(0x2255aa));
  canopy.position.y = 1.15;
  umbrellaGroup.add(shaft, canopy);
  umbrellaGroup.position.set(0.62, 0.75, 0.15);
  umbrellaGroup.rotation.z = -0.15;
  umbrellaGroup.visible = false;
  avatar.add(umbrellaGroup);

  parts = { torso, collar, armL, armR, jacket, shoulderL, shoulderR, scarf, glasses, umbrellaGroup, legL, legR, shoeL, shoeR };
}

buildAvatar();

function applyOutfit(spec) {
  if (!spec) return;
  const c = (hex) => new THREE.Color(hex);

  parts.torso.material.color = c(spec.shirtColor);
  parts.collar.material.color = c(spec.shirtColor);
  parts.armL.upper.material.color = c(spec.shirtColor);
  parts.armR.upper.material.color = c(spec.shirtColor);

  const foreColor = spec.shirtSleeve === "long" ? spec.shirtColor : SKIN;
  parts.armL.fore.material.color = c(foreColor);
  parts.armR.fore.material.color = c(foreColor);

  parts.legL.material.color = c(spec.trouserColor);
  parts.legR.material.color = c(spec.trouserColor);
  parts.shoeL.material.color = c(spec.shoeColor);
  parts.shoeR.material.color = c(spec.shoeColor);

  parts.jacket.visible = !!spec.jacket;
  parts.shoulderL.visible = !!spec.jacket;
  parts.shoulderR.visible = !!spec.jacket;
  if (spec.jacket) {
    parts.jacket.material.color = c(spec.jacketColor);
    parts.shoulderL.material.color = c(spec.jacketColor);
    parts.shoulderR.material.color = c(spec.jacketColor);
  }

  parts.scarf.visible = !!spec.scarf;
  parts.glasses.visible = !!spec.sunglasses;
  parts.umbrellaGroup.visible = !!spec.umbrella;
}

window.addEventListener("outfit-updated", (e) => applyOutfit(e.detail));
if (window.__lastOutfitSpec) applyOutfit(window.__lastOutfitSpec);

function onResize() {
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (!w || !h) return;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener("resize", onResize);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
