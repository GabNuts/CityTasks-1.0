import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { Building } from '../types';
import { EventType } from './timeHelpers';

// --- SEEDED RANDOM ---
let seed = 12345;
export const setSeed = (s: number) => { seed = s; };
export const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};

// --- DISPOSE HELPER ---
export const disposeHierarchy = (node: THREE.Object3D) => {
    if (!node) return;
    node.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach((m: THREE.Material) => {
                        // @ts-ignore
                        if(m.map) m.map.dispose();
                        m.dispose();
                    });
                } else {
                    // @ts-ignore
                    if(child.material.map) child.material.map.dispose();
                    child.material.dispose();
                }
            }
        }
    });
};

// --- MAINTENANCE CALCULATOR ---
export const calculateCityMaintenance = (buildings: Building[]): number => {
    let cost = 0;
    const costs: {[key: string]: number} = {
        'road': 1,
        'res': 5,
        'com': 10,
        'ind': 15,
        'park': 8,
        'gov': 50,
        'landmark': 100
    };
    
    buildings.forEach(b => {
        const base = costs[b.type] || 0;
        const levelMult = b.levelTier || 1; 
        cost += base * levelMult;
    });
    
    return Math.floor(cost);
};

// --- CACHING SYSTEMS ---
const boxGeoCache: {[key: string]: THREE.BoxGeometry} = {};
const matCache: {[key: string]: THREE.MeshStandardMaterial} = {};

export const getBoxGeometry = (w: number, h: number, d: number) => {
    const key = `${w.toFixed(2)},${h.toFixed(2)},${d.toFixed(2)}`;
    if (!boxGeoCache[key]) boxGeoCache[key] = new THREE.BoxGeometry(w, h, d);
    return boxGeoCache[key];
};

export const getStandardMaterial = (color: number, transparent = false, opacity = 1.0, emissive = 0x000000, emissiveIntensity = 0) => {
    const key = `${color}-${transparent}-${opacity}-${emissive}-${emissiveIntensity}`;
    if (!matCache[key]) {
        matCache[key] = new THREE.MeshStandardMaterial({
            color, 
            flatShading: true,
            transparent,
            opacity,
            emissive,
            emissiveIntensity
        });
    }
    return matCache[key];
};

let glowTexture: THREE.Texture | null = null;
let cloudTexture: THREE.Texture | null = null;
const texCache: {[key: string]: THREE.Texture} = {};

// --- GEOMETRY OPTIMIZATION ---
export const optimizeBuildingGeometry = (group: THREE.Group): THREE.Group => {
    const meshesByMaterial = new Map<string, { material: THREE.Material, geometries: THREE.BufferGeometry[] }>();
    group.updateMatrixWorld(true); 
    group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            const mesh = child;
            if (mesh.geometry && mesh.material) {
                const geom = mesh.geometry.clone();
                geom.applyMatrix4(mesh.matrixWorld);
                let matKey = mesh.material.uuid;
                if (Array.isArray(mesh.material)) return;
                if (!meshesByMaterial.has(matKey)) {
                    meshesByMaterial.set(matKey, { material: mesh.material, geometries: [] });
                }
                meshesByMaterial.get(matKey)!.geometries.push(geom);
            }
        }
    });
    const optimizedGroup = new THREE.Group();
    optimizedGroup.userData = group.userData;
    meshesByMaterial.forEach((entry) => {
        if (entry.geometries.length > 0) {
            try {
                const mergedGeometry = BufferGeometryUtils.mergeGeometries(entry.geometries, false);
                const mesh = new THREE.Mesh(mergedGeometry, entry.material);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                optimizedGroup.add(mesh);
            } catch (e) {
                console.warn("Falha ao fundir geometria", e);
            }
        }
    });
    if (optimizedGroup.children.length === 0) return group;
    return optimizedGroup;
};

// --- BASIC SHAPES ---
export const createBox = (w: number, h: number, d: number, color: number, x: number, y: number, z: number, isNight: boolean, forceNoGlow: boolean = false): THREE.Mesh => {
    const isWindow = !forceNoGlow && (color === 0x81d4fa || color === 0x80cbc4 || color === 0x90caf9 || color === 0x0288d1 || color === 0xe0f7fa);
    let emissive = 0x000000;
    let intensity = 0;
    if (isWindow && isNight) {
        if (random() > 0.2) {
            emissive = color;
            intensity = 0.5;
        }
    }
    const mat = getStandardMaterial(color, isWindow && !isNight, isWindow && !isNight ? 0.6 : 1.0, emissive, intensity);
    const mesh = new THREE.Mesh(getBoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
};

export const getGlowTexture = (): THREE.Texture => {
    if (glowTexture) return glowTexture;
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        g.addColorStop(0, 'rgba(255, 255, 255, 1)');
        g.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
        g.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 32, 32);
    }
    glowTexture = new THREE.CanvasTexture(canvas);
    return glowTexture;
};

export const getCloudTexture = (): THREE.Texture => {
    if (cloudTexture) return cloudTexture;
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        g.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)');
        g.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 64, 64);
    }
    cloudTexture = new THREE.CanvasTexture(canvas);
    return cloudTexture;
};

export const createTextureFromCanvas = (drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, width = 64, height = 64): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) drawFn(ctx, width, height);
    return new THREE.CanvasTexture(canvas);
};

// --- ROAD & PROPS ---
export const createRoad = (group: THREE.Group, x: number, z: number, neighbors: { left: boolean, right: boolean, top: boolean, bottom: boolean }, isNight: boolean, activeEvent: EventType = 'none') => {
    const tileSize = 2.0;
    const roadWidth = 1.3;
    const sidewalkColor = 0x9e9e9e; 
    const asphaltColor = 0x555555;
    // Bugfix: Dim the marking color at night so it doesn't look "lit"
    const markingColor = isNight ? 0x333333 : 0xffffff;

    group.add(createBox(tileSize, 0.1, tileSize, sidewalkColor, x*2, 0.05, z*2, isNight));
    group.add(createBox(roadWidth, 0.06, roadWidth, asphaltColor, x*2, 0.08, z*2, isNight));

    const armLen = (tileSize - roadWidth) / 2 + 0.05; 
    const armOffset = roadWidth/2 + armLen/2 - 0.02;

    if (neighbors.left) {
        group.add(createBox(armLen, 0.06, roadWidth, asphaltColor, x*2 - armOffset, 0.08, z*2, isNight));
        group.add(createBox(0.4, 0.02, 0.1, markingColor, x*2 - 0.5, 0.12, z*2, isNight));
    }
    if (neighbors.right) {
        group.add(createBox(armLen, 0.06, roadWidth, asphaltColor, x*2 + armOffset, 0.08, z*2, isNight));
        group.add(createBox(0.4, 0.02, 0.1, markingColor, x*2 + 0.5, 0.12, z*2, isNight));
    }
    if (neighbors.top) {
        group.add(createBox(roadWidth, 0.06, armLen, asphaltColor, x*2, 0.08, z*2 - armOffset, isNight));
        group.add(createBox(0.1, 0.02, 0.4, markingColor, x*2, 0.12, z*2 - 0.5, isNight));
    }
    if (neighbors.bottom) {
        group.add(createBox(roadWidth, 0.06, armLen, asphaltColor, x*2, 0.08, z*2 + armOffset, isNight));
        group.add(createBox(0.1, 0.02, 0.4, markingColor, x*2, 0.12, z*2 + 0.5, isNight));
    }

    const poleX = x*2 + 0.8;
    const poleZ = z*2 + 0.8;
    const poleHeight = 1.5;

    const lampGroup = new THREE.Group();
    lampGroup.position.set(poleX, 0, poleZ);

    if ((neighbors.left || neighbors.right) && !neighbors.top && !neighbors.bottom) {
        lampGroup.rotation.y = -Math.PI / 2;
    }

    lampGroup.add(createBox(0.1, poleHeight, 0.1, 0x263238, 0, poleHeight/2, 0, isNight));
    lampGroup.add(createBox(0.6, 0.05, 0.05, 0x263238, -0.3, poleHeight - 0.1, 0, isNight));
    
    const bulb = createBox(0.2, 0.05, 0.1, 0xffeb3b, -0.6, poleHeight - 0.15, 0, isNight);
    
    if (isNight) {
        bulb.material = (bulb.material as THREE.Material).clone();
        (bulb.material as THREE.MeshStandardMaterial).emissive.setHex(0xffeb3b);
        (bulb.material as THREE.MeshStandardMaterial).emissiveIntensity = 2;
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: getGlowTexture(), 
            color: 0xffaa00, 
            transparent: true, 
            opacity: 0.35, 
            blending: THREE.AdditiveBlending 
        });
        const glow = new THREE.Sprite(spriteMaterial);
        glow.scale.set(1.5, 1.5, 1.5); 
        glow.position.set(-0.6, poleHeight - 0.15, 0);
        lampGroup.add(glow);
        const spot = new THREE.SpotLight(0xffaa00, 10, 8, 0.8, 0.5, 1);
        spot.position.set(-0.6, poleHeight - 0.2, 0);
        const targetObj = new THREE.Object3D();
        targetObj.position.set(-2.0, 0, 0); 
        lampGroup.add(targetObj);
        spot.target = targetObj;
        spot.castShadow = false; 
        lampGroup.add(spot);
        const groundLightGeo = new THREE.PlaneGeometry(3.0, 3.0);
        const groundLightMat = new THREE.MeshBasicMaterial({
            map: getGlowTexture(),
            color: 0xffaa00,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const groundLight = new THREE.Mesh(groundLightGeo, groundLightMat);
        groundLight.rotation.x = -Math.PI / 2;
        groundLight.position.set(-2.0, 0.15, 0); 
        lampGroup.add(groundLight);
    }
    lampGroup.add(bulb);
    group.add(lampGroup);

    if (activeEvent === 'christmas' || activeEvent === 'junina' || activeEvent === 'independence') {
        const stringHeight = poleHeight - 0.3;
        const targets = [];
        if (neighbors.left) targets.push({x: x*2 - 1.0, z: poleZ});
        if (neighbors.right) targets.push({x: x*2 + 1.0, z: poleZ});
        if (neighbors.top) targets.push({x: poleX, z: z*2 - 1.0});
        if (neighbors.bottom) targets.push({x: poleX, z: z*2 + 1.0});

        targets.forEach(target => {
            const centerX = (poleX + target.x) / 2;
            const centerZ = (poleZ + target.z) / 2;
            const dist = Math.sqrt(Math.pow(target.x - poleX, 2) + Math.pow(target.z - poleZ, 2));
            const angle = Math.atan2(target.z - poleZ, target.x - poleX);
            const wire = createBox(dist, 0.01, 0.01, 0x111111, centerX, stringHeight, centerZ, isNight);
            wire.rotation.y = -angle; 
            group.add(wire);
            const numItems = 5; 
            for(let i=1; i<numItems; i++) {
                const ratio = i / numItems;
                const lx = poleX + (target.x - poleX) * ratio;
                const lz = poleZ + (target.z - poleZ) * ratio;
                if (activeEvent === 'christmas') {
                    const isGreen = i % 2 !== 0;
                    const color = isGreen ? 0x00ff00 : 0xff0000;
                    const light = createBox(0.08, 0.08, 0.08, color, lx, stringHeight - 0.05, lz, isNight);
                    light.userData = { type: 'xmas_light', colorType: isGreen ? 'green' : 'red' };
                    if (isNight) {
                        light.material = (light.material as THREE.Material).clone();
                        (light.material as THREE.MeshStandardMaterial).emissive.setHex(color);
                        (light.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.0;
                    }
                    group.add(light);
                } else if (activeEvent === 'junina') {
                    const colors = [0xffeb3b, 0x2196f3, 0xff9800, 0xf44336];
                    const color = colors[i % colors.length];
                    const flag = createBox(0.12, 0.15, 0.01, color, lx, stringHeight - 0.08, lz, isNight);
                    flag.rotation.y = -angle + Math.PI/2;
                    group.add(flag);
                } else if (activeEvent === 'independence') {
                    // Bugfix: Remove "lit" effect at night by manually dimming the flag colors
                    let color = i % 2 !== 0 ? 0x4caf50 : 0xffeb3b; 
                    if (isNight) {
                        const c = new THREE.Color(color);
                        c.multiplyScalar(0.2); // Escurece em 80% para simular falta de luz
                        color = c.getHex();
                    }
                    const flag = createBox(0.25, 0.15, 0.02, color, lx, stringHeight - 0.08, lz, isNight, true);
                    flag.rotation.y = -angle; 
                    group.add(flag);
                }
            }
        });
        const isBonfireSpot = (Math.abs(x * 7 + z * 17) % 30 === 0);
        if (activeEvent === 'junina' && isBonfireSpot) {
            group.add(createBonfire(x*2, z*2, isNight));
            createCaipiraCrowd(group, x*2, z*2, isNight);
        }
    }
};

export const createBonfire = (x: number, z: number, isNight: boolean): THREE.Group => {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    const woodColor = 0x5d4037;
    for(let i=0; i<3; i++) {
        const log = createBox(0.6, 0.1, 0.1, woodColor, 0, 0.05 + (i*0.05), 0, isNight);
        log.rotation.y = (Math.PI/3) * i;
        group.add(log);
    }
    const fireColor = 0xff5722;
    const core = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 0.5, 4),
        new THREE.MeshStandardMaterial({
            color: fireColor, 
            emissive: fireColor,
            emissiveIntensity: isNight ? 2 : 0.5
        })
    );
    core.position.y = 0.25;
    group.add(core);
    if (isNight) {
        const light = new THREE.PointLight(0xff9800, 1, 5);
        light.position.y = 0.5;
        group.add(light);
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: getGlowTexture(), 
            color: 0xff5722, 
            transparent: true, 
            opacity: 0.6, 
            blending: THREE.AdditiveBlending 
        });
        const glow = new THREE.Sprite(spriteMaterial);
        glow.scale.set(3, 3, 3);
        glow.position.y = 0.5;
        group.add(glow);
        const groundLightGeo = new THREE.PlaneGeometry(3.5, 3.5);
        const groundLightMat = new THREE.MeshBasicMaterial({
            map: getGlowTexture(),
            color: 0xff5722,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const groundLight = new THREE.Mesh(groundLightGeo, groundLightMat);
        groundLight.rotation.x = -Math.PI / 2;
        groundLight.position.y = 0.15;
        group.add(groundLight);
    }
    return group;
};

const createCaipiraCrowd = (group: THREE.Group, centerX: number, centerZ: number, isNight: boolean) => {
    const numPeople = 3 + Math.floor(random() * 5); 
    const shirtColors = [0xd32f2f, 0x1976d2, 0x388e3c, 0xffeb3b, 0xff9800]; 
    const scale = 0.4; 
    for(let i=0; i<numPeople; i++) {
        const angle = (i / numPeople) * Math.PI * 2 + random();
        const dist = 0.8 + random() * 0.4;
        const px = centerX + Math.cos(angle) * dist;
        const pz = centerZ + Math.sin(angle) * dist;
        const shirtColor = shirtColors[Math.floor(random() * shirtColors.length)];
        const pGroup = new THREE.Group();
        pGroup.position.set(px, 0.25 * scale, pz);
        pGroup.lookAt(centerX, 0.25 * scale, centerZ);
        pGroup.userData = { type: 'caipira', offset: random() * Math.PI };
        pGroup.add(createBox(0.3 * scale, 0.5 * scale, 0.2 * scale, shirtColor, 0, 0, 0, isNight));
        pGroup.add(createBox(0.12 * scale, 0.5 * scale, 0.15 * scale, 0x1565c0, -0.08*scale, -0.4*scale, 0, isNight));
        pGroup.add(createBox(0.12 * scale, 0.5 * scale, 0.15 * scale, 0x1565c0, 0.08*scale, -0.4*scale, 0, isNight));
        pGroup.add(createBox(0.2 * scale, 0.2 * scale, 0.2 * scale, 0xffcc80, 0, 0.35 * scale, 0, isNight));
        const hatColor = 0xffeb3b;
        const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.25*scale, 0.25*scale, 0.02*scale, 8), new THREE.MeshStandardMaterial({color: hatColor}));
        hatBrim.position.y = 0.45 * scale;
        pGroup.add(hatBrim);
        const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.15*scale, 0.15*scale, 0.15*scale, 8), new THREE.MeshStandardMaterial({color: hatColor}));
        hatTop.position.y = 0.52 * scale;
        pGroup.add(hatTop);
        const armColor = shirtColor;
        const arm1 = createBox(0.08 * scale, 0.4 * scale, 0.08 * scale, armColor, -0.2*scale, 0.2*scale, 0.1*scale, isNight);
        arm1.rotation.z = 2.5; 
        pGroup.add(arm1);
        const arm2 = createBox(0.08 * scale, 0.4 * scale, 0.08 * scale, armColor, 0.2*scale, 0.2*scale, 0.1*scale, isNight);
        arm2.rotation.z = -2.5; 
        pGroup.add(arm2);
        group.add(pGroup);
    }
};

export const createPumpkin = (x: number, z: number, isNight: boolean): THREE.Mesh => {
    const pumpkin = new THREE.Group();
    pumpkin.position.set(x, 0, z);
    const bodyColor = 0xff6d00;
    const body = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.18, 0), 
        new THREE.MeshStandardMaterial({
            color: bodyColor,
            flatShading: true,
            emissive: isNight ? 0xff6d00 : 0x000000,
            emissiveIntensity: isNight ? 0.5 : 0
        })
    );
    body.scale.set(1, 0.8, 1);
    body.position.y = 0.15; 
    pumpkin.add(body);
    const stem = createBox(0.04, 0.08, 0.04, 0x33691e, 0, 0.3, 0, isNight);
    pumpkin.add(stem);
    if (isNight) {
        const eyeColor = 0xffeb3b;
        const e1 = createBox(0.04, 0.04, 0.04, eyeColor, -0.06, 0.18, 0.15, isNight);
        const e2 = createBox(0.04, 0.04, 0.04, eyeColor, 0.06, 0.18, 0.15, isNight);
        (e1.material as THREE.MeshStandardMaterial).emissive.setHex(eyeColor);
        (e1.material as THREE.MeshStandardMaterial).emissiveIntensity = 2;
        (e2.material as THREE.MeshStandardMaterial).emissive.setHex(eyeColor);
        (e2.material as THREE.MeshStandardMaterial).emissiveIntensity = 2;
        pumpkin.add(e1);
        pumpkin.add(e2);
    }
    return pumpkin as unknown as THREE.Mesh; 
};

export const createEasterEgg = (x: number, z: number, isNight: boolean): THREE.Mesh => {
    const colorPairs = [
        [0xe91e63, 0xffeb3b], [0x9c27b0, 0x00e676], [0x03a9f4, 0xff5722],
        [0xffeb3b, 0x6200ea], [0x4caf50, 0xd500f9], [0xff9800, 0x2962ff]
    ];
    const pair = colorPairs[Math.floor(random() * colorPairs.length)];
    const eggColor = pair[0];
    const ribbonColor = pair[1];
    const group = new THREE.Group();
    group.position.set(x, 0.12, z); 
    const baseRadius = 0.08; 
    const geo = new THREE.SphereGeometry(baseRadius, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
        color: eggColor, 
        roughness: 0.5, 
        metalness: 0.1,
        emissive: isNight ? eggColor : 0x000000,
        emissiveIntensity: isNight ? 0.8 : 0
    }); 
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.set(0.8, 1.2, 0.8);
    group.add(mesh);
    const ribGeo = new THREE.CylinderGeometry(baseRadius * 0.82, baseRadius * 0.82, baseRadius * 2.45, 16);
    const ribMat = new THREE.MeshStandardMaterial({
        color: ribbonColor,
        emissive: isNight ? ribbonColor : 0x000000,
        emissiveIntensity: isNight ? 0.8 : 0
    });
    const rib = new THREE.Mesh(ribGeo, ribMat);
    rib.scale.set(1.05, 1, 0.2); 
    group.add(rib);
    const ribH = rib.clone();
    ribH.rotation.y = Math.PI / 2;
    group.add(ribH);
    const bowGeo = new THREE.SphereGeometry(baseRadius * 0.4, 8, 8);
    const bowL = new THREE.Mesh(bowGeo, ribMat);
    bowL.position.set(-baseRadius*0.3, baseRadius * 1.2, 0);
    bowL.scale.set(1, 0.5, 1);
    group.add(bowL);
    const bowR = new THREE.Mesh(bowGeo, ribMat);
    bowR.position.set(baseRadius*0.3, baseRadius * 1.2, 0);
    bowR.scale.set(1, 0.5, 1);
    group.add(bowR);
    group.rotation.z = (random() - 0.5) * 0.5;
    group.rotation.x = (random() - 0.5) * 0.5;
    group.rotation.y = random() * Math.PI;
    return group as unknown as THREE.Mesh;
};

export const addACUnit = (lot: THREE.Group, y: number, isNight: boolean) => {
    const ac = new THREE.Group();
    ac.position.set(0.5, y, 0.5);
    const housing = createBox(0.4, 0.3, 0.4, 0x90a4ae, 0, 0.15, 0, isNight);
    const fan = createBox(0.3, 0.05, 0.3, 0x263238, 0, 0.3, 0, isNight);
    ac.add(housing);
    ac.add(fan);
    lot.add(ac);
};

export const createRareVehicleMesh = (id: string, isNight: boolean): THREE.Object3D => {
    const group = new THREE.Group();
    let s = 0.35; 
    const createLitBox = (w: number, h: number, d: number, color: number, x: number, y: number, z: number, forceNoGlow: boolean = false) => {
        const mesh = createBox(w, h, d, color, x, y, z, isNight, forceNoGlow);
        if (isNight && id !== 'ghost_rider') {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            mat.emissive.setHex(color);
            mat.emissiveIntensity = Math.max(mat.emissiveIntensity, 0.3);
        }
        return mesh;
    };

    if (id === 'ghost_rider') s = 0.2;

    if (id === 'delorean') {
        const silver = 0xc0c0c0; const black = 0x111111; const blueGlow = 0x00e5ff;
        group.add(createLitBox(2.2*s, 0.25*s, 1.0*s, silver, 0, 0.26*s, 0));
        group.add(createLitBox(2.25*s, 0.05*s, 1.05*s, black, 0, 0.1*s, 0));
        const cab = createLitBox(1.0*s, 0.35*s, 0.9*s, silver, 0.1*s, 0.55*s, 0);
        group.add(cab);
        group.add(createLitBox(0.5*s, 0.3*s, 0.85*s, 0x222222, 0.6*s, 0.55*s, 0));
        group.add(createLitBox(0.6*s, 0.05*s, 0.8*s, silver, 0.1*s, 0.73*s, 0));
        for(let i=0; i<4; i++) { group.add(createLitBox(0.1*s, 0.05*s, 0.8*s, black, -0.5*s - (i*0.15*s), 0.5*s, 0)); }
        group.add(createLitBox(1.8*s, 0.05*s, 1.1*s, black, 0, 0.35*s, 0));
        group.add(createLitBox(0.2*s, 0.1*s, 0.2*s, 0xffffff, -0.9*s, 0.45*s, 0));
        group.add(createLitBox(0.15*s, 0.2*s, 0.15*s, 0xffffff, -0.9*s, 0.6*s, 0));
        group.add(createLitBox(0.2*s, 0.2*s, 0.1*s, black, -1.1*s, 0.35*s, 0.3*s));
        group.add(createLitBox(0.2*s, 0.2*s, 0.1*s, black, -1.1*s, 0.35*s, -0.3*s));
        if (isNight) {
            const glowMat = new THREE.MeshStandardMaterial({ color: blueGlow, emissive: blueGlow, emissiveIntensity: 2.0 });
            const glowL = new THREE.Mesh(new THREE.BoxGeometry(0.05*s, 0.15*s, 0.05*s), glowMat); glowL.position.set(-1.11*s, 0.35*s, 0.3*s); group.add(glowL);
            const glowR = glowL.clone(); glowR.position.set(-1.11*s, 0.35*s, -0.3*s); group.add(glowR);
            const bandL = new THREE.Mesh(new THREE.BoxGeometry(1.8*s, 0.02*s, 0.02*s), glowMat); bandL.position.set(0, 0.25*s, 0.51*s); group.add(bandL);
            const bandR = bandL.clone(); bandR.position.set(0, 0.25*s, -0.51*s); group.add(bandR);
        }
        const wheelColor = 0x333333;
        const addWheel = (x: number, z: number) => { const w = createLitBox(0.4*s, 0.4*s, 0.15*s, wheelColor, x, 0.2*s, z); const h = createLitBox(0.2*s, 0.2*s, 0.2*s, 0xdddddd, x, 0.2*s, z); group.add(w); group.add(h); };
        addWheel(0.7*s, 0.45*s); addWheel(0.7*s, -0.45*s); addWheel(-0.7*s, 0.45*s); addWheel(-0.7*s, -0.45*s);
    } 
    else if (id === 'mystery_machine') {
        const cyan = 0x00bcd4; const green = 0x76ff03; const orange = 0xff9800; const black = 0x111111;
        group.add(createLitBox(2.2*s, 1.0*s, 1.0*s, cyan, 0, 0.6*s, 0));
        group.add(createLitBox(2.25*s, 0.3*s, 1.02*s, green, 0, 0.5*s, 0));
        const addFlower = (x: number, y: number, z: number) => { const f = createLitBox(0.3*s, 0.3*s, 0.05*s, orange, x, y, z); f.rotation.z = Math.PI / 4; group.add(f); };
        addFlower(0.5*s, 0.7*s, 0.51*s); addFlower(-0.5*s, 0.6*s, 0.51*s); addFlower(0.5*s, 0.7*s, -0.51*s); addFlower(-0.5*s, 0.6*s, -0.51*s);
        group.add(createLitBox(1.2*s, 0.2*s, 1.06*s, orange, 0, 0.85*s, 0));
        group.add(createLitBox(0.1*s, 0.4*s, 0.9*s, 0x81d4fa, 1.11*s, 0.7*s, 0));
        group.add(createLitBox(0.12*s, 0.4*s, 0.05*s, cyan, 1.12*s, 0.7*s, 0)); 
        group.add(createLitBox(1.8*s, 0.05*s, 0.8*s, 0x999999, -0.1*s, 1.12*s, 0));
        const spare = new THREE.Mesh(new THREE.CylinderGeometry(0.25*s, 0.25*s, 0.15*s, 16), new THREE.MeshStandardMaterial({color: green, emissive: isNight? green:0, emissiveIntensity: isNight?0.4:0}));
        spare.rotation.z = Math.PI/2; spare.position.set(1.15*s, 0.4*s, 0); group.add(spare);
        group.add(createLitBox(0.05*s, 0.2*s, 0.2*s, orange, 1.2*s, 0.4*s, 0));
        const addFunkyWheel = (x: number, z: number) => { const w = createLitBox(0.4*s, 0.4*s, 0.2*s, black, x, 0.2*s, z); const rim = createLitBox(0.25*s, 0.25*s, 0.22*s, green, x, 0.2*s, z); const hub = createLitBox(0.1*s, 0.1*s, 0.24*s, orange, x, 0.2*s, z); group.add(w); group.add(rim); group.add(hub); };
        addFunkyWheel(0.7*s, 0.5*s); addFunkyWheel(0.7*s, -0.5*s); addFunkyWheel(-0.7*s, 0.5*s); addFunkyWheel(-0.7*s, -0.5*s);
    }
    else if (id === 'mcqueen') {
        const red = 0xd50000; const yellow = 0xffeb3b; const black = 0x111111; const white = 0xffffff;
        group.add(createLitBox(2.2*s, 0.3*s, 1.1*s, red, 0, 0.3*s, 0));
        group.add(createLitBox(1.2*s, 0.3*s, 1.0*s, red, -0.1*s, 0.55*s, 0));
        group.add(createLitBox(0.8*s, 0.1*s, 0.9*s, red, -0.1*s, 0.75*s, 0));
        const hood = createLitBox(0.6*s, 0.1*s, 1.0*s, red, 0.8*s, 0.45*s, 0); hood.rotation.z = 0.2; group.add(hood);
        const spoiler = new THREE.Group(); spoiler.position.set(-1.1*s, 0.7*s, 0);
        spoiler.add(createLitBox(0.1*s, 0.3*s, 0.1*s, red, 0, -0.1*s, 0.3*s));
        spoiler.add(createLitBox(0.1*s, 0.3*s, 0.1*s, red, 0, -0.1*s, -0.3*s));
        spoiler.add(createLitBox(0.4*s, 0.05*s, 1.2*s, red, 0, 0.1*s, 0)); group.add(spoiler);
        const boltL = createLitBox(1.0*s, 0.15*s, 0.05*s, yellow, 0, 0.4*s, 0.56*s); boltL.rotation.z = -0.1; group.add(boltL);
        const boltR = createLitBox(1.0*s, 0.15*s, 0.05*s, yellow, 0, 0.4*s, -0.56*s); boltR.rotation.z = -0.1; group.add(boltR);
        const windshield = createLitBox(0.1*s, 0.35*s, 0.9*s, white, 0.5*s, 0.65*s, 0); windshield.rotation.z = -0.5; group.add(windshield);
        const eyeL = createLitBox(0.02*s, 0.1*s, 0.1*s, 0x2196f3, 0.56*s, 0.65*s, 0.2*s); eyeL.rotation.z = -0.5; group.add(eyeL);
        const eyeR = createLitBox(0.02*s, 0.1*s, 0.1*s, 0x2196f3, 0.56*s, 0.65*s, -0.2*s); eyeR.rotation.z = -0.5; group.add(eyeR);
        const mouthY = 0.2*s; const mouthX = 1.11*s;
        group.add(createLitBox(0.02*s, 0.05*s, 0.4*s, 0xeeeeee, mouthX, mouthY, 0));
        group.add(createLitBox(0.02*s, 0.05*s, 0.1*s, 0xeeeeee, mouthX-0.02*s, mouthY+0.05*s, 0.25*s));
        group.add(createLitBox(0.02*s, 0.05*s, 0.1*s, 0xeeeeee, mouthX-0.02*s, mouthY+0.05*s, -0.25*s));
        const addRaceWheel = (x: number, z: number) => { const w = createLitBox(0.45*s, 0.45*s, 0.2*s, black, x, 0.22*s, z); const rim = createLitBox(0.2*s, 0.2*s, 0.22*s, red, x, 0.22*s, z); group.add(w); group.add(rim); };
        addRaceWheel(0.7*s, 0.5*s); addRaceWheel(0.7*s, -0.5*s); addRaceWheel(-0.7*s, 0.52*s); addRaceWheel(-0.7*s, -0.52*s);
    }
    else if (id === 'bumblebee') {
        const yellow = 0xffc400; const black = 0x111111; const silver = 0xc0c0c0;
        group.add(createLitBox(2.2*s, 0.45*s, 1.1*s, yellow, 0, 0.3*s, 0)); 
        group.add(createLitBox(1.1*s, 0.35*s, 0.9*s, yellow, -0.2*s, 0.7*s, 0));
        group.add(createLitBox(0.1*s, 0.32*s, 0.85*s, 0x111111, 0.36*s, 0.7*s, 0)); 
        const stripeW = 0.15*s; const stripeZ1 = 0.2*s; const stripeZ2 = -0.2*s;
        group.add(createLitBox(0.95*s, 0.02*s, stripeW, black, 0.65*s, 0.53*s, stripeZ1));
        group.add(createLitBox(0.95*s, 0.02*s, stripeW, black, 0.65*s, 0.53*s, stripeZ2));
        group.add(createLitBox(1.11*s, 0.02*s, stripeW, black, -0.2*s, 0.88*s, stripeZ1));
        group.add(createLitBox(1.11*s, 0.02*s, stripeW, black, -0.2*s, 0.88*s, stripeZ2));
        group.add(createLitBox(0.5*s, 0.02*s, stripeW, black, -0.85*s, 0.53*s, stripeZ1));
        group.add(createLitBox(0.5*s, 0.02*s, stripeW, black, -0.85*s, 0.53*s, stripeZ2));
        group.add(createLitBox(0.6*s, 0.08*s, 0.5*s, yellow, 0.5*s, 0.53*s, 0));
        group.add(createLitBox(0.15*s, 0.3*s, 1.05*s, black, 1.11*s, 0.35*s, 0));
        const headLight = createLitBox(0.05*s, 0.1*s, 0.2*s, 0x81d4fa, 1.12*s, 0.4*s, 0.4*s);
        if(isNight) (headLight.material as THREE.MeshStandardMaterial).emissiveIntensity = 2;
        group.add(headLight); const headLight2 = headLight.clone(); headLight2.position.z = -0.4*s; group.add(headLight2);
        const spoiler = new THREE.Group(); spoiler.position.set(-1.1*s, 0.6*s, 0);
        spoiler.add(createLitBox(0.3*s, 0.05*s, 1.1*s, yellow, 0, 0.1*s, 0)); 
        spoiler.add(createLitBox(0.1*s, 0.15*s, 0.1*s, yellow, 0, 0, 0.4*s)); 
        spoiler.add(createLitBox(0.1*s, 0.15*s, 0.1*s, yellow, 0, 0, -0.4*s)); group.add(spoiler);
        const addMuscleWheel = (x: number, z: number) => {
            const w = createLitBox(0.48*s, 0.48*s, 0.25*s, black, x, 0.24*s, z);
            const rim = createLitBox(0.28*s, 0.28*s, 0.27*s, silver, x, 0.24*s, z);
            group.add(w); group.add(rim);
        };
        addMuscleWheel(0.75*s, 0.5*s); addMuscleWheel(0.75*s, -0.5*s); addMuscleWheel(-0.75*s, 0.5*s); addMuscleWheel(-0.75*s, -0.5*s);
    }
    else if (id === 'optimus') {
        const primeRed = 0xd32f2f; const primeBlue = 0x1565c0; const chrome = 0xe0e0e0; const glass = 0x81d4fa;
        group.add(createLitBox(1.0*s, 1.2*s, 1.4*s, primeRed, 0.8*s, 0.8*s, 0));
        group.add(createLitBox(0.05*s, 0.4*s, 0.6*s, glass, 1.31*s, 0.9*s, 0.35*s));
        group.add(createLitBox(0.05*s, 0.4*s, 0.6*s, glass, 1.31*s, 0.9*s, -0.35*s));
        group.add(createLitBox(0.1*s, 0.6*s, 0.8*s, chrome, 1.32*s, 0.4*s, 0));
        group.add(createLitBox(0.3*s, 0.2*s, 1.5*s, chrome, 1.35*s, 0.1*s, 0));
        const stackGeo = new THREE.CylinderGeometry(0.08*s, 0.08*s, 1.8*s, 8); const stackMat = new THREE.MeshStandardMaterial({color: chrome, metalness: 0.6, roughness: 0.2, emissive: isNight?chrome:0, emissiveIntensity: isNight?0.4:0});
        const s1 = new THREE.Mesh(stackGeo, stackMat); s1.position.set(0.4*s, 1.4*s, 0.8*s); group.add(s1);
        const s2 = new THREE.Mesh(stackGeo, stackMat); s2.position.set(0.4*s, 1.4*s, -0.8*s); group.add(s2);
        const visor = createLitBox(0.4*s, 0.05*s, 1.42*s, primeRed, 1.15*s, 1.15*s, 0); visor.rotation.z = 0.2; group.add(visor);
        group.add(createLitBox(1.01*s, 0.1*s, 1.41*s, chrome, 0.8*s, 0.6*s, 0));
        group.add(createLitBox(1.6*s, 0.3*s, 1.2*s, primeBlue, -0.6*s, 0.4*s, 0));
        group.add(createLitBox(0.8*s, 0.05*s, 0.8*s, 0x111111, -0.8*s, 0.56*s, 0));
        const wheelGeo = new THREE.CylinderGeometry(0.3*s, 0.3*s, 0.25*s, 12); const wheelMat = new THREE.MeshStandardMaterial({color: 0x111111, emissive: isNight?0x111111:0, emissiveIntensity: isNight?0.3:0});
        const rimGeo = new THREE.CylinderGeometry(0.15*s, 0.15*s, 0.26*s, 8); const rimMat = new THREE.MeshStandardMaterial({color: chrome, emissive: isNight?chrome:0, emissiveIntensity: isNight?0.3:0});
        const addTruckWheel = (x: number, z: number) => { const w = new THREE.Mesh(wheelGeo, wheelMat); w.rotation.x = Math.PI/2; w.position.set(x, 0.3*s, z); const r = new THREE.Mesh(rimGeo, rimMat); r.rotation.x = Math.PI/2; r.position.set(x, 0.3*s, z); group.add(w); group.add(r); };
        addTruckWheel(0.8*s, 0.65*s); addTruckWheel(0.8*s, -0.65*s); addTruckWheel(-0.4*s, 0.65*s); addTruckWheel(-0.4*s, -0.65*s); addTruckWheel(-1.1*s, 0.65*s); addTruckWheel(-1.1*s, -0.65*s);
    }
    else if (id === 'ghost_rider') {
        const black = 0x111111; const fire = 0xff5722; const silver = 0xcccccc;
        group.add(createBox(1.8*s, 0.3*s, 0.4*s, black, -0.2*s, 0.4*s, 0, isNight));
        group.add(createBox(0.5*s, 0.5*s, 0.3*s, silver, 0, 0.4*s, 0, isNight));
        const forkGroup = new THREE.Group(); forkGroup.position.set(0.6*s, 0.6*s, 0); forkGroup.rotation.z = -0.5;
        forkGroup.add(createBox(0.1*s, 1.5*s, 0.1*s, silver, 0, 0, 0.1*s, isNight));
        forkGroup.add(createBox(0.1*s, 1.5*s, 0.1*s, silver, 0, 0, -0.1*s, isNight)); group.add(forkGroup);
        const createFireWheel = (r: number, w: number, x: number) => {
            const geo = new THREE.TorusGeometry(r, w, 8, 16);
            const mat = new THREE.MeshStandardMaterial({ color: fire, emissive: fire, emissiveIntensity: 3.0 });
            const mesh = new THREE.Mesh(geo, mat); mesh.rotation.set(0, 0, 0); mesh.position.set(x, r, 0); return mesh;
        };
        group.add(createFireWheel(0.5*s, 0.15*s, -1.0*s));
        group.add(createFireWheel(0.4*s, 0.1*s, 1.2*s));
        const skull = new THREE.Mesh(new THREE.SphereGeometry(0.25*s, 8, 8), new THREE.MeshStandardMaterial({color: 0xffffff}));
        skull.position.set(0.4*s, 1.1*s, 0); group.add(skull);
        if(isNight) {
            const light = new THREE.PointLight(fire, 2, 8); light.position.y = 0.5; group.add(light);
            group.add(createBox(0.2*s, 0.2*s, 0.2*s, fire, -1.2*s, 0.6*s, 0, isNight, true));
            group.add(createBox(0.3*s, 0.4*s, 0.1*s, fire, 0.4*s, 1.4*s, 0, isNight, true));
        }
    }
    else if (id === 'ae86') {
        const white = 0xffffff; const black = 0x212121; const glass = 0x1a237e;
        const lightYellow = 0xffff8d; const lightRed = 0xff5252; const chrome = 0xc0c0c0;
        group.add(createLitBox(2.2 * s, 0.15 * s, 1.05 * s, black, 0, 0.15 * s, 0));
        group.add(createLitBox(2.2 * s, 0.25 * s, 1.0 * s, white, 0, 0.35 * s, 0));
        group.add(createLitBox(2.21 * s, 0.08 * s, 1.01 * s, black, 0, 0.3 * s, 0));
        group.add(createLitBox(1.1 * s, 0.05 * s, 0.85 * s, white, -0.15 * s, 0.85 * s, 0));
        const frontGlass = createLitBox(0.02 * s, 0.58 * s, 0.8 * s, glass, 0.41 * s, 0.62 * s, 0);
        frontGlass.rotation.z = -0.65;
        group.add(frontGlass);
        const rearGlass = createLitBox(0.02 * s, 0.72 * s, 0.8 * s, glass, -0.71 * s, 0.58 * s, 0);
        rearGlass.rotation.z = 0.85;
        group.add(rearGlass);
        group.add(createLitBox(1.0 * s, 0.35 * s, 0.82 * s, glass, -0.15 * s, 0.65 * s, 0));
        const hood = createLitBox(0.6 * s, 0.1 * s, 1.0 * s, white, 0.8 * s, 0.45 * s, 0); hood.rotation.z = 0.15; group.add(hood);
        const leftHead = createLitBox(0.25 * s, 0.12 * s, 0.25 * s, white, 1.0 * s, 0.45 * s, 0.3 * s);
        leftHead.rotation.z = 0.2; group.add(leftHead);
        const rightHead = leftHead.clone(); rightHead.position.z = -0.3 * s; group.add(rightHead);
        const frontSignalL = createLitBox(0.05 * s, 0.08 * s, 0.2 * s, 0xffa000, 1.1 * s, 0.32 * s, 0.38 * s); group.add(frontSignalL);
        const frontSignalR = frontSignalL.clone(); frontSignalR.position.z = -0.38 * s; group.add(frontSignalR);
        if (isNight) {
            (leftHead.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.0; (leftHead.material as THREE.MeshStandardMaterial).emissive.setHex(lightYellow);
            (rightHead.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.0; (rightHead.material as THREE.MeshStandardMaterial).emissive.setHex(lightYellow);
            (frontSignalL.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.0;
        }
        const tailBar = createLitBox(0.05 * s, 0.2 * s, 0.9 * s, 0x333333, -1.1 * s, 0.4 * s, 0); group.add(tailBar);
        const tailLightL = createLitBox(0.02 * s, 0.12 * s, 0.35 * s, 0xd32f2f, -1.13 * s, 0.4 * s, 0.25 * s); group.add(tailLightL);
        const tailLightR = tailLightL.clone(); tailLightR.position.z = -0.25 * s; group.add(tailLightR);
        if (isNight) {
            (tailLightL.material as THREE.MeshStandardMaterial).emissive.setHex(lightRed); (tailLightL.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5;
            (tailLightR.material as THREE.MeshStandardMaterial).emissive.setHex(lightRed); (tailLightR.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.5;
        }
        const decalTex = createTextureFromCanvas((ctx, w, h) => {
            ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#000000'; ctx.font = 'bold 12px serif'; ctx.textAlign = 'right'; ctx.fillText('藤原とうfu店', w - 5, h/2 + 4);
        }, 128, 32);
        const decalGeo = new THREE.PlaneGeometry(0.8 * s, 0.15 * s);
        const decalMat = new THREE.MeshStandardMaterial({ map: decalTex, transparent: true, opacity: 0.9, side: THREE.DoubleSide, emissive: isNight?0xffffff:0, emissiveIntensity: isNight?0.3:0 });
        const decalL = new THREE.Mesh(decalGeo, decalMat); decalL.position.set(-0.1 * s, 0.45 * s, 0.51 * s); group.add(decalL);
        const decalR = decalL.clone(); decalR.position.z = -0.51 * s; decalR.rotation.y = Math.PI; group.add(decalR);
        group.add(createLitBox(0.3 * s, 0.1 * s, 0.1 * s, chrome, -1.1 * s, 0.15 * s, -0.3 * s));
        const addWatanabeWheel = (x: number, z: number) => {
            const wGroup = new THREE.Group(); wGroup.position.set(x, 0.2 * s, z);
            wGroup.add(createLitBox(0.42 * s, 0.42 * s, 0.22 * s, 0x111111, 0, 0, 0));
            wGroup.add(createLitBox(0.3 * s, 0.3 * s, 0.25 * s, 0x424242, 0, 0, 0));
            wGroup.add(createLitBox(0.1 * s, 0.1 * s, 0.28 * s, white, 0, 0, 0)); group.add(wGroup);
        };
        addWatanabeWheel(0.7 * s, 0.45 * s); addWatanabeWheel(0.7 * s, -0.45 * s); addWatanabeWheel(-0.7 * s, 0.45 * s); addWatanabeWheel(-0.7 * s, -0.45 * s);
        group.add(createLitBox(0.1 * s, 0.05 * s, 0.85 * s, white, -1.05 * s, 0.5 * s, 0));
    }
    else if (id === 'skyline') {
        const silver = 0xe0e0e0; const blue = 0x01579b; const black = 0x111111; const glass = 0x1a237e;
        const neonBlue = 0x00e5ff;
        group.add(createLitBox(2.4*s, 0.2*s, 1.1*s, silver, 0, 0.2*s, 0));
        group.add(createLitBox(1.2*s, 0.4*s, 1.0*s, silver, -0.2*s, 0.5*s, 0));
        group.add(createLitBox(1.21*s, 0.02*s, 0.15*s, blue, -0.2*s, 0.71*s, 0.2*s));
        group.add(createLitBox(1.21*s, 0.02*s, 0.15*s, blue, -0.2*s, 0.71*s, -0.2*s));
        group.add(createLitBox(1.0*s, 0.02*s, 0.15*s, blue, 0.7*s, 0.31*s, 0.2*s));
        group.add(createLitBox(1.0*s, 0.02*s, 0.15*s, blue, 0.7*s, 0.31*s, -0.2*s));
        group.add(createLitBox(0.9*s, 0.35*s, 0.92*s, glass, -0.2*s, 0.5*s, 0));
        const windshield = createLitBox(0.02*s, 0.6*s, 0.9*s, glass, 0.4*s, 0.45*s, 0); windshield.rotation.z = -0.7; group.add(windshield);
        const rearGlass = createLitBox(0.02*s, 0.65*s, 0.9*s, glass, -0.7*s, 0.45*s, 0); rearGlass.rotation.z = 0.8; group.add(rearGlass);
        const spoilerMat = isNight ? new THREE.MeshStandardMaterial({color: silver, emissive: silver, emissiveIntensity: 0.2}) : new THREE.MeshStandardMaterial({color: silver});
        const spoilerL = new THREE.Mesh(new THREE.BoxGeometry(0.1*s, 0.4*s, 0.1*s), spoilerMat); spoilerL.position.set(-1.0*s, 0.5*s, 0.4*s); group.add(spoilerL);
        const spoilerR = spoilerL.clone(); spoilerR.position.z = -0.4*s; group.add(spoilerR);
        const spoilerTop = new THREE.Mesh(new THREE.BoxGeometry(0.3*s, 0.05*s, 1.2*s), spoilerMat); spoilerTop.position.set(-1.0*s, 0.7*s, 0); group.add(spoilerTop);
        const hlL = createLitBox(0.05*s, 0.12*s, 0.25*s, 0xffffff, 1.2*s, 0.3*s, 0.35*s);
        const hlR = hlL.clone(); hlR.position.z = -0.35*s; group.add(hlL); group.add(hlR);
        if(isNight) {
            (hlL.material as THREE.MeshStandardMaterial).emissive.setHex(0xe0f7fa); (hlL.material as THREE.MeshStandardMaterial).emissiveIntensity = 4.0;
            (hlR.material as THREE.MeshStandardMaterial).emissive.setHex(0xe0f7fa); (hlR.material as THREE.MeshStandardMaterial).emissiveIntensity = 4.0;
        }
        for(let i=0; i<2; i++) {
            const tlL = createLitBox(0.02*s, 0.1*s, 0.1*s, 0xff0000, -1.21*s, 0.3*s, 0.2*s + (i*0.18*s));
            const tlR = createLitBox(0.02*s, 0.1*s, 0.1*s, 0xff0000, -1.21*s, 0.3*s, -0.2*s - (i*0.18*s));
            group.add(tlL); group.add(tlR);
            if(isNight) {
                (tlL.material as THREE.MeshStandardMaterial).emissive.setHex(0xff0000); (tlL.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.0;
                (tlR.material as THREE.MeshStandardMaterial).emissive.setHex(0xff0000); (tlR.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.0;
            }
        }
        const pipeGeo = new THREE.CylinderGeometry(0.05*s, 0.05*s, 0.3*s, 8); const pipeMat = new THREE.MeshStandardMaterial({color: 0x999999, metalness: 0.9, roughness: 0.1});
        const p1 = new THREE.Mesh(pipeGeo, pipeMat); p1.rotation.x = Math.PI/2; p1.position.set(-1.1*s, 0.15*s, 0.35*s); group.add(p1);
        const p2 = p1.clone(); p2.position.z = 0.25*s; group.add(p2);
        const addWheel = (x: number, z: number) => {
            const w = createLitBox(0.5*s, 0.5*s, 0.25*s, black, x, 0.15*s, z); 
            const rim = createLitBox(0.3*s, 0.3*s, 0.27*s, 0x666666, x, 0.15*s, z); 
            group.add(w); group.add(rim);
        };
        addWheel(0.8*s, 0.5*s); addWheel(0.8*s, -0.5*s); addWheel(-0.8*s, 0.5*s); addWheel(-0.8*s, -0.5*s);
        if(isNight) {
            const neonMat = new THREE.MeshStandardMaterial({color: neonBlue, emissive: neonBlue, emissiveIntensity: 5.0, transparent: true, opacity: 0.8});
            const neonL = new THREE.Mesh(new THREE.PlaneGeometry(1.8*s, 0.05*s), neonMat); neonL.rotation.x = -Math.PI/2; neonL.position.set(0, 0.08, 0.5*s); group.add(neonL);
            const neonR = neonL.clone(); neonR.position.z = -0.5*s; group.add(neonR);
            const neonP = new THREE.PointLight(neonBlue, 2, 3); neonP.position.y = 0.1; group.add(neonP);
        }
    }
    else if (id === 'penelope') {
        const pink = 0xff4081; const deepPink = 0xe91e63; const white = 0xffffff; const gold = 0xffd700; const yellow = 0xffeb3b;
        const bodyMat = isNight ? new THREE.MeshStandardMaterial({color: pink, emissive: pink, emissiveIntensity: 0.2}) : new THREE.MeshStandardMaterial({color: pink});
        
        const mainBody = new THREE.Mesh(new THREE.SphereGeometry(0.8*s, 16, 16), bodyMat); 
        mainBody.scale.set(2.4, 0.45, 1.1); 
        mainBody.position.set(0, 0.3*s, 0); 
        group.add(mainBody);
        
        group.add(createLitBox(2.2*s, 0.04*s, 0.05*s, yellow, 0, 0.3*s, 0.55*s, true));
        group.add(createLitBox(2.2*s, 0.04*s, 0.05*s, yellow, 0, 0.3*s, -0.55*s, true));

        const addFender = (x: number, z: number) => {
            const fender = new THREE.Mesh(new THREE.SphereGeometry(0.35*s, 8, 8), bodyMat);
            fender.scale.set(1.4, 0.5, 0.8); fender.position.set(x, 0.25*s, z); group.add(fender);
        };
        addFender(0.9*s, 0.6*s); addFender(0.9*s, -0.6*s); addFender(-0.9*s, 0.6*s); addFender(-0.9*s, -0.6*s);
        
        group.add(createLitBox(0.1*s, 0.15*s, 1.3*s, white, 1.5*s, 0.2*s, 0));
        group.add(createLitBox(0.1*s, 0.15*s, 1.3*s, white, -1.5*s, 0.2*s, 0));
        
        const grill = new THREE.Mesh(new THREE.BoxGeometry(0.05*s, 0.25*s, 0.6*s), new THREE.MeshStandardMaterial({color: gold}));
        grill.position.set(1.55*s, 0.25*s, 0); group.add(grill);
        
        const glassMat = new THREE.MeshPhysicalMaterial({color: 0xffffff, transparent: true, opacity: 0.4, transmission: 0.7});
        const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.6*s, 16, 16), glassMat); 
        bubble.scale.set(1.0, 0.9, 0.85); bubble.position.set(-0.4*s, 0.6*s, 0); 
        group.add(bubble);
        
        const umbrellaPole = createBox(0.04*s, 1.2*s, 0.04*s, gold, -0.4*s, 0.9*s, 0, isNight); group.add(umbrellaPole);
        const umbrellaGeo = new THREE.ConeGeometry(1.0*s, 0.3*s, 12);
        const umbrellaMat = new THREE.MeshStandardMaterial({color: pink, side: THREE.DoubleSide});
        const umbrella = new THREE.Mesh(umbrellaGeo, umbrellaMat); umbrella.position.set(-0.4*s, 1.6*s, 0); group.add(umbrella);
        for(let i=0; i<12; i++) {
            const angle = (i/12) * Math.PI * 2;
            const fringe = createBox(0.015*s, 0.12*s, 0.015*s, white, -0.4*s + Math.cos(angle)*0.98*s, 1.45*s, Math.sin(angle)*0.98*s, isNight, true);
            group.add(fringe);
        }
        
        const eyeGeo = new THREE.SphereGeometry(0.12*s, 8, 8); const eyeMat = new THREE.MeshStandardMaterial({color: white, emissive: isNight? white:0, emissiveIntensity: isNight? 3:0});
        const fl = new THREE.Mesh(eyeGeo, eyeMat); fl.position.set(1.3*s, 0.3*s, 0.4*s); group.add(fl);
        const fr = fl.clone(); fr.position.z = -0.4*s; group.add(fr);
        
        const rl = createLitBox(0.1*s, 0.15*s, 0.1*s, deepPink, -1.5*s, 0.3*s, 0.45*s); group.add(rl);
        const rr = rl.clone(); rr.position.z = -0.45*s; group.add(rr);
        
        const addPinkWheel = (x: number, z: number) => {
            const w = createLitBox(0.35*s, 0.35*s, 0.2*s, 0x111111, x, 0.15*s, z);
            const wall = createLitBox(0.25*s, 0.25*s, 0.22*s, white, x, 0.15*s, z);
            const rim = createLitBox(0.1*s, 0.1*s, 0.24*s, gold, x, 0.15*s, z);
            group.add(w); group.add(wall); group.add(rim);
        };
        addPinkWheel(1.0*s, 0.6*s); addPinkWheel(1.0*s, -0.6*s); addPinkWheel(-1.0*s, 0.6*s); addPinkWheel(-1.0*s, -0.6*s);
    }
    return group;
};

// --- EXPORTED HELPERS ---
export type IndSignType = 'gear' | 'hammer' | 'chair' | 'spool' | 'chip' | 'leaf' | 'cloud' | 'box' | 'rocket' | 'dna';
export const getTextSignTexture = (text: string, bg: string, textColor: string = '#ffffff'): THREE.Texture => {
    const key = `text_${text}_${bg}_${textColor}`;
    if (texCache[key]) return texCache[key];
    texCache[key] = createTextureFromCanvas((ctx, w, h) => {
        ctx.fillStyle = bg; ctx.fillRect(0,0,w,h); ctx.fillStyle = textColor; ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, w/2, h/2);
    }, 128, 64);
    return texCache[key];
};
export const getSignMaterial = (key: string, bgColor: string, text: string): THREE.MeshStandardMaterial => {
    const tex = getTextSignTexture(text, bgColor); return new THREE.MeshStandardMaterial({ map: tex });
};
export const getCommercialSignTexture = (type: 'pizza' | 'coffee', bgColor: string): THREE.Texture => {
    const key = `com_${type}_${bgColor}`;
    if (texCache[key]) return texCache[key];
    texCache[key] = createTextureFromCanvas((ctx, w, h) => {
        ctx.fillStyle = bgColor; ctx.fillRect(0,0,w,h); ctx.fillStyle = '#ffffff'; ctx.font = 'bold 30px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(type === 'pizza' ? 'PIZZA' : 'CAFE', w/2, h/2);
    });
    return texCache[key];
};
export const getAdvertisementTexture = (variant: number): THREE.Texture => {
    const key = `ad_${variant}`;
    if (texCache[key]) return texCache[key];
    texCache[key] = createTextureFromCanvas((ctx, w, h) => {
        ctx.fillStyle = variant === 0 ? '#ffeb3b' : '#03a9f4'; ctx.fillRect(0,0,w,h); ctx.fillStyle = '#000000'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SALE', w/2, h/2);
    });
    return texCache[key];
};
export const getCarrefourSignTexture = (): THREE.Texture => {
    const key = 'carrefour_logo';
    if (texCache[key]) return texCache[key];
    texCache[key] = createTextureFromCanvas((ctx, w, h) => {
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,w,h); ctx.fillStyle = '#1e88e5'; ctx.beginPath(); ctx.moveTo(10, h/2); ctx.lineTo(w/2, 10); ctx.lineTo(w/2, h-10); ctx.fill(); ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.moveTo(w-10, h/2); ctx.lineTo(w/2, 10); ctx.lineTo(w/2, h-10); ctx.fill();
    });
    return texCache[key];
};
export const getIndustrialSignTexture = (type: IndSignType, bgColor: string): THREE.Texture => {
    const key = `ind_${type}_${bgColor}`;
    if (texCache[key]) return texCache[key];
    texCache[key] = createTextureFromCanvas((ctx, w, h) => {
        ctx.fillStyle = bgColor; ctx.fillRect(0,0,w,h); ctx.fillStyle = '#ffffff'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        let symbol = '';
        switch(type) {
            case 'gear': symbol = '⚙️'; break;
            case 'hammer': symbol = '🔨'; break;
            case 'chair': symbol = '🪑'; break;
            case 'spool': symbol = '🧵'; break;
            case 'chip': symbol = '💾'; break;
            case 'leaf': symbol = '🍃'; break;
            case 'cloud': symbol = '☁️'; break;
            case 'box': symbol = '📦'; break;
            case 'rocket': symbol = '🚀'; break;
            case 'dna': symbol = '🧬'; break;
        }
        ctx.fillText(symbol, w/2, h/2);
    });
    return texCache[key];
};
export const getCocaColaLogoTexture = (): THREE.Texture => {
    const key = 'coca_logo';
    if (texCache[key]) return texCache[key];
    texCache[key] = createTextureFromCanvas((ctx, w, h) => {
        ctx.fillStyle = '#f40009'; ctx.fillRect(0,0,w,h); ctx.fillStyle = '#ffffff'; ctx.font = 'italic bold 20px Serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Coca-Cola', w/2, h/2);
    }, 128, 64);
    return texCache[key];
};
export const getNikeLogoTexture = (): THREE.Texture => {
    const key = 'nike_logo';
    if (texCache[key]) return texCache[key];
    texCache[key] = createTextureFromCanvas((ctx, w, h) => {
        ctx.fillStyle = '#000000'; ctx.fillRect(0,0,w,h); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(10, h/2); ctx.quadraticCurveTo(w/2, h, w-10, 10); ctx.stroke();
    }, 128, 64);
    return texCache[key];
};
export const getAppleLogoTexture = (): THREE.Texture => {
    const key = 'apple_logo';
    if (texCache[key]) return texCache[key];
    texCache[key] = createTextureFromCanvas((ctx, w, h) => {
        ctx.fillStyle = '#c0c0c0'; ctx.fillRect(0,0,w,h); ctx.fillStyle = '#ffffff'; ctx.font = '40px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('', w/2, h/2);
    }, 64, 64);
    return texCache[key];
};
export const getFordLogoTexture = (): THREE.Texture => {
    const key = 'ford_logo';
    if (texCache[key]) return texCache[key];
    texCache[key] = createTextureFromCanvas((ctx, w, h) => {
        ctx.fillStyle = '#1e88e5'; ctx.beginPath(); ctx.ellipse(w/2, h/2, w/2-5, h/2-10, 0, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.font = 'italic bold 20px Serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Ford', w/2, h/2);
    }, 128, 64);
    return texCache[key];
};
export const getNVidiaLogoTexture = (): THREE.Texture => {
    const key = 'nvidia_logo';
    if (texCache[key]) return texCache[key];
    texCache[key] = createTextureFromCanvas((ctx, w, h) => {
        ctx.fillStyle = '#000000'; ctx.fillRect(0,0,w,h); ctx.fillStyle = '#76b900'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('NVIDIA', w/2, h/2);
    }, 128, 64);
    return texCache[key];
};
export const getStadiumLedTexture = (): THREE.Texture => {
    const key = 'stadium_led';
    if (texCache[key]) return texCache[key];
    texCache[key] = createTextureFromCanvas((ctx, w, h) => {
        ctx.fillStyle = '#000000'; ctx.fillRect(0,0,w,h); ctx.fillStyle = '#ff0000'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('GOAL!!!', w/2, h/2);
    }, 256, 64);
    return texCache[key];
};
export const getSoccerFieldTexture = (): THREE.Texture => {
    const key = 'soccer_field';
    if (texCache[key]) return texCache[key];
    texCache[key] = createTextureFromCanvas((ctx, w, h) => {
        ctx.fillStyle = '#2e7d32'; ctx.fillRect(0,0,w,h); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(10, 10, w-20, h-20); ctx.beginPath(); ctx.moveTo(w/2, 10); ctx.lineTo(w/2, h-10); ctx.stroke(); ctx.beginPath(); ctx.arc(w/2, h/2, 20, 0, Math.PI*2); ctx.stroke();
    }, 256, 128);
    return texCache[key];
};
export const getHighQualityGlassMaterial = (color: number, isNight: boolean): THREE.MeshPhysicalMaterial => {
    return new THREE.MeshPhysicalMaterial({
        color: color, metalness: 0.1, roughness: 0.05, transmission: 0.6, transparent: true, opacity: 0.7, emissive: isNight ? color : 0x000000, emissiveIntensity: isNight ? 0.3 : 0
    });
};
export const getCorinthiansLogoTexture = (): THREE.Texture => {
    const key = 'corinthians_logo';
    if (texCache[key]) return texCache[key];
    texCache[key] = createTextureFromCanvas((ctx, w, h) => {
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(w/2, h/2, h/2-2, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = '#000000'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#000000'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SCCP', w/2, h/2);
    }, 64, 64);
    return texCache[key];
};
export const getAvengersLogoTexture = (): THREE.Texture => {
    const key = 'avengers_logo';
    if (texCache[key]) return texCache[key];
    texCache[key] = createTextureFromCanvas((ctx, w, h) => {
        ctx.clearRect(0,0,w,h); ctx.fillStyle = '#00e5ff'; ctx.font = 'bold 60px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('A', w/2, h/2);
    }, 64, 64);
    return texCache[key];
};
export const getNASALogoTexture = (): THREE.Texture => {
    const key = 'nasa_logo';
    if (texCache[key]) return texCache[key];
    texCache[key] = createTextureFromCanvas((ctx, w, h) => {
        ctx.fillStyle = '#0b3d91'; ctx.beginPath(); ctx.arc(w/2, h/2, h/2-2, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#fc3d21'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffffff'; ctx.fillText('NASA', w/2, h/2);
    }, 64, 64);
    return texCache[key];
};
export const getUSAFlagTexture = (): THREE.Texture => {
    const key = 'usa_flag';
    if (texCache[key]) return texCache[key];
    texCache[key] = createTextureFromCanvas((ctx, w, h) => {
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,w,h); ctx.fillStyle = '#b22234'; for(let i=0; i<13; i+=2) { ctx.fillRect(0, i*(h/13), w, h/13); } ctx.fillStyle = '#3c3b6e'; ctx.fillRect(0,0, w*0.4, h*(7/13)); ctx.fillStyle = '#ffffff'; ctx.fillText('★', w*0.2, h*0.25);
    }, 64, 40);
    return texCache[key];
};