
import * as THREE from 'three';
import { createBox, addACUnit, getCommercialSignTexture, getAdvertisementTexture, getTextSignTexture, getGlowTexture, getCarrefourSignTexture } from './cityHelpers';
// CORREÇÃO AQUI: Adicionado createParkLamp aos imports
import { createDoor, createWindow, createBench, createParkLamp, createVehicle, createGableRoof, createBush, createFence, createStylizedTree } from './rendererHelpers';const createBicycle = (x: number, z: number, rotation: number, isNight: boolean) => {
    const g = new THREE.Group();
    g.position.set(x, 0.2, z);
    g.rotation.y = rotation;
    const w1 = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.02, 4, 8), new THREE.MeshStandardMaterial({color: 0x333333}));
    w1.position.set(-0.25, 0, 0); g.add(w1);
    const w2 = w1.clone(); w2.position.set(0.25, 0, 0); g.add(w2);
    g.add(createBox(0.4, 0.03, 0.03, 0xd32f2f, 0, 0.15, 0, isNight));
    g.add(createBox(0.03, 0.25, 0.03, 0x999999, 0, 0.15, 0, isNight));
    g.add(createBox(0.1, 0.02, 0.05, 0x333333, -0.1, 0.28, 0, isNight));
    g.add(createBox(0.2, 0.02, 0.02, 0x999999, 0.2, 0.25, 0, isNight));
    g.add(createBox(0.02, 0.02, 0.3, 0xcccccc, 0.22, 0.27, 0, isNight));
    return g;
};

const createScooter = (x: number, z: number, rotation: number, isNight: boolean) => {
    const g = new THREE.Group();
    g.position.set(x, 0.15, z);
    g.rotation.y = rotation;
    const bodyColor = 0xff5722;
    g.add(createBox(0.4, 0.15, 0.15, bodyColor, 0, 0.15, 0, isNight)); 
    g.add(createBox(0.1, 0.35, 0.05, 0x333333, 0.2, 0.25, 0, isNight)); 
    g.add(createBox(0.05, 0.02, 0.25, 0xcccccc, 0.2, 0.42, 0, isNight)); 
    g.add(createBox(0.2, 0.2, 0.22, 0xffffff, -0.15, 0.25, 0, isNight)); 
    g.add(createBox(0.21, 0.05, 0.23, 0xd32f2f, -0.15, 0.25, 0, isNight));
    const wGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 8);
    const wMat = new THREE.MeshStandardMaterial({color: 0x111111});
    const w1 = new THREE.Mesh(wGeo, wMat); w1.rotation.x = Math.PI/2; w1.position.set(0.2, 0.05, 0); g.add(w1);
    const w2 = w1.clone(); w2.position.set(-0.2, 0.05, 0); g.add(w2);
    const glass = createBox(0.02, 0.1, 0.1, 0x81d4fa, 0.26, 0.35, 0, isNight); glass.rotation.z = -0.2; g.add(glass);
    return g;
};

// Helper for Commercial Signs
const addComSign = (lot: THREE.Group, x: number, y: number, z: number, rotationY: number, bgColor: string, text: string, scale: number, isCircular: boolean, isNight: boolean) => {
    let signGeo: THREE.BufferGeometry;
    let signMat: THREE.MeshStandardMaterial; 

    if (isCircular) {
        signGeo = new THREE.CircleGeometry(scale / 1.5, 32);
        signMat = new THREE.MeshStandardMaterial({ 
            map: getTextSignTexture(text, bgColor), 
            side: THREE.DoubleSide, 
            roughness: 0.5, 
            metalness: 0.1,
            emissive: isNight ? 0xffffff : 0x000000,
            emissiveIntensity: isNight ? 0.8 : 0,
            emissiveMap: isNight ? getTextSignTexture(text, bgColor) : null
        });
    } else {
        signGeo = new THREE.PlaneGeometry(scale * 2, scale); 
        signMat = new THREE.MeshStandardMaterial({ 
            map: getTextSignTexture(text, bgColor), 
            side: THREE.DoubleSide, 
            roughness: 0.5, 
            metalness: 0.1,
            emissive: isNight ? 0xffffff : 0x000000,
            emissiveIntensity: isNight ? 0.8 : 0,
            emissiveMap: isNight ? getTextSignTexture(text, bgColor) : null
        });
    }

    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(x, y, z);
    sign.rotation.y = rotationY;
    lot.add(sign);
};

// Helper for Custom Logo Signs
const addCustomLogoSign = (lot: THREE.Group, texture: THREE.Texture, x: number, y: number, z: number, w: number, h: number, rotY: number, isNight: boolean, emissiveColor: number = 0x000000) => {
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        emissive: isNight ? emissiveColor : 0x000000,
        emissiveIntensity: isNight ? 0.8 : 0,
        emissiveMap: isNight ? texture : null
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotY;
    lot.add(mesh);
};

// --- GENERIC COMMERCIAL (EXISTING) ---

export const renderComGeneralStore = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean) => {
  const isBakery = variant === 0;
  const wallColor = isBakery ? 0xfff3e0 : 0x757575;
  const trimColor = isBakery ? 0x8d6e63 : 0xffa726;
  const awningColors = isBakery ? [0x8d6e63, 0xffccbc] : [0x424242, 0xffa726];
  
  lot.add(createBox(1.8, 0.9, 0.8, wallColor, 0, 0.45, -0.1, isNight));
  lot.add(createBox(1.9, 0.1, 0.9, trimColor, 0, 0.95, -0.1, isNight));
  
  const awningZ = 0.45;
  for(let i=-0.8; i<=0.8; i+=0.2) {
      const color = Math.abs(Math.round(i*5)) % 2 === 0 ? awningColors[0] : awningColors[1];
      const segment = createBox(0.2, 0.05, 0.4, color, i, 0.6, awningZ, isNight);
      segment.rotation.x = 0.3;
      lot.add(segment);
  }

  lot.add(createDoor(0.3, 0.6, 0, 0.3, 0.31, isNight, isBakery ? 0x5d4037 : 0x37474f));
  const glass = 0x81d4fa;
  lot.add(createBox(0.5, 0.5, 0.05, glass, -0.5, 0.4, 0.31, isNight));
  lot.add(createBox(0.5, 0.5, 0.05, glass, 0.5, 0.4, 0.31, isNight));
  lot.add(createBox(0.55, 0.05, 0.08, trimColor, -0.5, 0.65, 0.31, isNight));
  lot.add(createBox(0.55, 0.05, 0.08, trimColor, 0.5, 0.65, 0.31, isNight));
  
  if (isBakery) {
      lot.add(createBox(0.4, 0.3, 0.2, 0x8d6e63, -0.6, 0.15, 0.6, isNight));
      lot.add(createBox(0.1, 0.05, 0.1, 0xffb74d, -0.7, 0.32, 0.6, isNight));
      lot.add(createBox(0.1, 0.05, 0.1, 0xffb74d, -0.5, 0.32, 0.6, isNight));
  } else {
      lot.add(createBox(0.4, 0.3, 0.2, 0x424242, -0.6, 0.15, 0.6, isNight));
      lot.add(createBox(0.15, 0.1, 0.1, 0xd32f2f, -0.6, 0.35, 0.6, isNight));
  }

  const signPost = createBox(0.05, 0.05, 0.4, 0x333333, 0.8, 0.7, 0.5, isNight);
  lot.add(signPost);
  addComSign(lot, 0.8, 0.55, 0.7, Math.PI/2, isBakery ? '#5d4037' : '#e65100', isBakery ? "BAKERY" : "TOOLS", 0.3, false, isNight);

  if(isRare) lot.add(createBicycle(0.6, 0.5, -0.2, isNight));
};

export const renderComCafePizza = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean) => {
    const isPizza = variant === 0;
    const wallColor = isPizza ? 0x8d6e63 : 0x4e342e; 
    const awningColor = isPizza ? 0xd32f2f : 0x1b5e20;
    
    lot.add(createBox(1.5, 0.8, 0.8, wallColor, -0.15, 0.4, -0.1, isNight));
    lot.add(createBox(0.6, 0.8, 0.6, wallColor, 0.5, 0.4, 0.4, isNight));
    lot.add(createDoor(0.3, 0.6, 0.5, 0.3, 0.72, isNight, 0x3e2723));
    lot.add(createBox(0.7, 0.05, 0.4, awningColor, 0.5, 0.65, 0.8, isNight));
    
    const addTable = (x: number, z: number) => {
        lot.add(createBox(0.25, 0.2, 0.25, 0xffffff, x, 0.1, z, isNight));
        const pole = createBox(0.02, 0.6, 0.02, 0x5d4037, x, 0.3, z, isNight); lot.add(pole);
        const top = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.15, 8), new THREE.MeshStandardMaterial({color: awningColor}));
        top.position.set(x, 0.6, z); lot.add(top);
    };
    addTable(-0.5, 0.6);
    if (!isRare) addTable(-0.1, 0.6);

    if (isPizza) {
        lot.add(createBox(0.3, 0.8, 0.3, wallColor, -0.6, 0.8, -0.2, isNight));
    } else {
        const vent = createBox(0.2, 0.4, 0.2, 0x9e9e9e, -0.6, 0.8, -0.2, isNight); lot.add(vent);
    }

    const signGeo = new THREE.PlaneGeometry(0.4, 0.4);
    const signTex = getCommercialSignTexture(isPizza ? 'pizza' : 'coffee', isPizza ? '#d32f2f' : '#3e2723');
    const signMat = new THREE.MeshStandardMaterial({ 
        map: signTex, 
        roughness: 0.5, 
        metalness: 0.1,
        emissive: isNight ? 0xffffff : 0x000000,
        emissiveIntensity: isNight ? 0.8 : 0,
        emissiveMap: isNight ? signTex : null
    }); 
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(0.5, 0.9, 0.71); 
    lot.add(signMesh);

    if(isRare) lot.add(createScooter(0.2, 0.7, 0.5, isNight));
};

export const renderComMiniMarket = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean) => {
    const isFresh = variant === 0;
    if (isFresh) {
        const wallColor = 0xf5f5f5;
        const brandColor = 0x00c853; 
        lot.add(createBox(1.95, 0.85, 1.3, wallColor, 0, 0.425, 0, isNight));
        lot.add(createBox(1.6, 0.7, 0.1, 0x81d4fa, 0, 0.35, 0.66, isNight));
        lot.add(createBox(2.0, 0.15, 1.4, brandColor, 0, 0.8, 0, isNight));
        lot.add(createBox(2.0, 0.05, 1.4, 0xff6d00, 0, 0.7, 0, isNight));
        lot.add(createBox(0.05, 0.7, 0.12, 0xeeeeee, 0, 0.35, 0.66, isNight));
        addACUnit(lot, 0.85, isNight);
        lot.add(createBox(0.3, 0.4, 0.3, 0x424242, 1.1, 0.2, 0.2, isNight));
        
        lot.add(createBox(0.3, 0.2, 0.2, 0x8d6e63, -0.6, 0.1, 0.8, isNight));
        lot.add(createBox(0.25, 0.1, 0.15, 0xff9800, -0.6, 0.25, 0.8, isNight));
        lot.add(createBox(0.3, 0.2, 0.2, 0x8d6e63, 0.6, 0.1, 0.8, isNight));
        lot.add(createBox(0.25, 0.1, 0.15, 0x76ff03, 0.6, 0.25, 0.8, isNight));
        addComSign(lot, 0, 0.8, 0.71, 0, '#2e7d32', 'FRESH', 0.4, false, isNight);
    } else {
        const brickColor = 0x4e342e; 
        const rollGateColor = 0x616161; 
        lot.add(createBox(1.9, 0.95, 1.2, brickColor, 0, 0.475, 0, isNight));
        lot.add(createBox(1.6, 0.2, 0.2, rollGateColor, 0, 0.75, 0.6, isNight));
        lot.add(createBox(1.4, 0.6, 0.05, 0x212121, 0, 0.3, 0.61, isNight));
        lot.add(createDoor(0.35, 0.6, 0.3, 0.3, 0.63, isNight, 0x8d6e63));
        lot.add(createWindow(0.5, 0.4, -0.4, 0.45, 0.63, isNight));
        lot.add(createBox(0.5, 0.02, 0.05, 0x333333, -0.4, 0.35, 0.66, isNight));
        lot.add(createBox(0.5, 0.02, 0.05, 0x333333, -0.4, 0.55, 0.66, isNight));
        lot.add(createBox(0.4, 0.5, 0.3, 0xe0e0e0, 0.7, 0.25, 0.7, isNight));
        lot.add(createBox(0.35, 0.15, 0.02, 0x1976d2, 0.7, 0.35, 0.86, isNight));
        lot.add(createBox(0.5, 0.4, 0.3, 0x2e7d32, -0.5, 0.2, -0.7, isNight));
        addComSign(lot, 0, 0.9, 0.61, 0, '#fbc02d', 'MARKET', 0.4, false, isNight);
    }
    
    const adGeo = new THREE.PlaneGeometry(0.4, 0.8);
    const adMat = new THREE.MeshStandardMaterial({ 
        map: getAdvertisementTexture(variant), 
        side: THREE.DoubleSide, 
        roughness: 0.8, 
        metalness: 0.0,
        emissive: isNight ? 0xffffff : 0x000000,
        emissiveIntensity: isNight ? 0.6 : 0,
        emissiveMap: isNight ? getAdvertisementTexture(variant) : null
    });
    const adMesh = new THREE.Mesh(adGeo, adMat);
    adMesh.position.set(-0.98, 0.5, 0.2); 
    adMesh.rotation.y = -Math.PI / 2; 
    lot.add(adMesh);

    if(isRare) {
        const boothX = 1.2; const boothZ = 0.8;
        lot.add(createBox(0.3, 0.05, 0.3, 0x333333, boothX, 0.025, boothZ, isNight));
        lot.add(createBox(0.28, 0.7, 0.28, 0xb71c1c, boothX, 0.35, boothZ, isNight));
        lot.add(createBox(0.26, 0.5, 0.26, 0x81d4fa, boothX, 0.4, boothZ, isNight));
        lot.add(createBox(0.3, 0.05, 0.3, 0xb71c1c, boothX, 0.72, boothZ, isNight));
    }
};

export const renderComOfficeSmall = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean) => {
    const isBank = variant === 0;
    if (isBank) {
        const stone = 0xe0e0e0; const darkStone = 0x9e9e9e;
        lot.add(createBox(1.8, 0.3, 1.2, darkStone, 0, 0.15, 0, isNight));
        lot.add(createBox(1.0, 0.1, 0.4, darkStone, 0, 0.2, 0.7, isNight)); 
        lot.add(createBox(1.6, 1.2, 1.0, stone, 0, 0.8, -0.1, isNight));
        for(let x=-0.6; x<=0.6; x+=0.4) {
            lot.add(createBox(0.15, 1.2, 0.15, stone, x, 0.9, 0.5, isNight));
        }
        const roof = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.5, 4), new THREE.MeshStandardMaterial({color: stone}));
        roof.rotation.y = Math.PI/4; roof.position.set(0, 1.65, 0.1); roof.scale.set(1.5, 1, 0.8);
        lot.add(roof);
        lot.add(createDoor(0.4, 0.8, 0, 0.7, 0.41, isNight, 0x212121));
        lot.add(createWindow(0.2, 0.6, -0.4, 0.9, 0.4, isNight));
        lot.add(createWindow(0.2, 0.6, 0.4, 0.9, 0.4, isNight));
        addComSign(lot, 0, 1.5, 0.5, 0, '#2e7d32', '$', 0.4, true, isNight);
    } else {
        const concrete = 0x616161; 
        lot.add(createBox(1.6, 0.8, 1.0, concrete, 0, 0.4, 0, isNight));
        lot.add(createBox(1.7, 0.1, 1.1, 0x212121, 0, 0.85, 0, isNight)); 
        lot.add(createDoor(0.4, 0.6, 0, 0.3, 0.51, isNight, 0x37474f));
        lot.add(createWindow(0.4, 0.5, -0.5, 0.5, 0.51, isNight));
        lot.add(createWindow(0.4, 0.5, 0.5, 0.5, 0.51, isNight));
        addComSign(lot, 0, 1.1, 0.51, 0, '#1565c0', 'AGENCY', 0.4, false, isNight);
    }
    if(isRare) {
        lot.add(createVehicle('car_random', 1.0, 0.8, -0.2, isNight));
    }
};

export const renderComBigStore = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean) => {
    const isTech = variant === 0;
    const wallColor = isTech ? 0x0277bd : 0xfbc02d; 
    const accentColor = isTech ? 0xffeb3b : 0xd32f2f;
    lot.add(createBox(3.6, 1.2, 3.0, 0xf5f5f5, 0, 0.6, -0.2, isNight));
    lot.add(createBox(1.5, 1.4, 0.8, wallColor, 0, 0.7, 1.31, isNight));
    lot.add(createBox(1.6, 0.1, 1.0, accentColor, 0, 1.0, 1.4, isNight));
    lot.add(createDoor(0.6, 0.8, 0, 0.4, 1.72, isNight, 0x1a237e));
    const signText = isTech ? "MEGA TECH" : "TOY WORLD";
    const signBg = isTech ? "#01579b" : "#f57f17";
    addComSign(lot, 0, 1.2, 1.72, 0, signBg, signText, 0.4, false, isNight);
    for(let x=-1.5; x<=1.5; x+=1.0) {
        if(Math.abs(x) > 0.5) {
             lot.add(createBox(0.05, 0.02, 0.8, 0xffffff, x, 0.02, 1.5, isNight));
        }
    }
    addACUnit(lot, 1.2, isNight);
    if (isRare) {
        const display = new THREE.Group();
        display.position.set(1.2, 0.2, 1.5);
        display.add(createBox(0.4, 0.4, 0.4, 0x212121, 0, 0, 0, isNight)); 
        if(isTech) {
             display.add(createBox(0.2, 0.02, 0.15, 0xc0c0c0, 0, 0.21, 0, isNight));
             const screen = createBox(0.2, 0.15, 0.01, 0xc0c0c0, 0, 0.28, -0.07, isNight);
             screen.rotation.x = -0.2;
             display.add(screen);
        } else {
             display.add(createBox(0.2, 0.3, 0.15, 0x795548, 0, 0.3, 0, isNight));
             display.add(createBox(0.15, 0.15, 0.15, 0x795548, 0, 0.5, 0, isNight));
        }
        lot.add(display);
    }
};

export const renderComOfficeTower = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean) => {
    const isModern = variant === 0;
    const glassColor = isModern ? 0x0288d1 : 0x009688; 
    const frameColor = 0x212121;
    lot.add(createBox(3.0, 0.8, 3.0, 0x616161, 0, 0.4, 0, isNight));
    lot.add(createBox(2.8, 0.1, 2.8, 0xffffff, 0, 0.85, 0, isNight));
    const floors = 6;
    const floorH = 0.6;
    for(let i=0; i<floors; i++) {
        const y = 0.9 + (i * floorH) + floorH/2;
        lot.add(createBox(1.8, floorH, 1.8, glassColor, 0, y, 0, isNight));
        lot.add(createBox(1.9, 0.05, 1.9, frameColor, 0, y + floorH/2, 0, isNight));
    }
    lot.add(createBox(1.0, 0.6, 0.2, 0x424242, 0, 0.3, 1.51, isNight));
    lot.add(createDoor(0.4, 0.5, 0, 0.25, 1.62, isNight, 0x0d47a1));
    lot.add(createBench(1.2, 1.2, -Math.PI/4, isNight, 'stone'));
    lot.add(createBench(-1.2, 1.2, Math.PI/4, isNight, 'stone'));
    lot.add(createBush(1.2, -1.2, 0.8, isNight));
    lot.add(createBush(-1.2, -1.2, 0.8, isNight));
    if (isRare) {
         lot.add(createBox(0.1, 2.0, 0.1, 0xffffff, 0, 0.9 + floors*floorH + 1.0, 0, isNight));
         const light = createBox(0.1, 0.1, 0.1, 0xff0000, 0, 0.9 + floors*floorH + 2.0, 0, isNight);
         if(isNight) (light.material as THREE.MeshStandardMaterial).emissive.setHex(0xff0000);
         lot.add(light);
    } else {
        addACUnit(lot, 0.9 + floors*floorH, isNight);
    }
};

export const renderComMall = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean) => {
    const wallColor = 0xffe0b2;
    lot.add(createBox(3.6, 1.5, 3.0, wallColor, 0, 0.75, -0.2, isNight));
    const atrium = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 0.5, 4), new THREE.MeshStandardMaterial({color: 0x81d4fa, transparent: true, opacity: 0.7}));
    atrium.rotation.y = Math.PI/4; atrium.position.set(0, 1.75, -0.2); lot.add(atrium);
    const anchorColor = 0xd7ccc8;
    lot.add(createBox(1.2, 1.8, 1.2, anchorColor, -1.4, 0.9, -1.2, isNight));
    lot.add(createBox(1.2, 1.8, 1.2, anchorColor, 1.4, 0.9, -1.2, isNight));
    lot.add(createBox(1.6, 1.0, 0.8, 0xffffff, 0, 0.5, 1.4, isNight));
    lot.add(createBox(1.8, 0.1, 1.0, 0xef5350, 0, 1.0, 1.5, isNight)); 
    lot.add(createDoor(0.3, 0.8, -0.4, 0.4, 1.81, isNight, 0x000000));
    lot.add(createDoor(0.3, 0.8, 0.4, 0.4, 1.81, isNight, 0x000000));
    addComSign(lot, 0, 1.1, 2.01, 0, '#c62828', 'MALL', 0.5, false, isNight);
    if(isRare) {
        const fountain = new THREE.Group();
        fountain.position.set(0, 0.1, 2.2);
        fountain.add(createBox(1.2, 0.2, 1.2, 0x9e9e9e, 0, 0, 0, isNight));
        fountain.add(createBox(1.0, 0.1, 1.0, 0x29b6f6, 0, 0.15, 0, isNight));
        fountain.add(createBox(0.1, 0.4, 0.1, 0x616161, 0, 0.2, 0, isNight));
        lot.add(fountain);
    }
};

// --- SPECIAL COMMERCIAL (BRANDED) ---

// 1. McDonald's (2x2) - ULTRA DETAILED
export const renderComMcDonalds = (lot: THREE.Group, isNight: boolean) => {
    // Paleta de Cores
    const mcdRed = 0xd32f2f;
    const mcdYellow = 0xffeb3b;
    const darkGrey = 0x333333; // Estilo moderno
    const woodColor = 0x8d6e63;
    const glassColor = 0x81d4fa;
    const offWhite = 0xf5f5f5;

    // --- ESTRUTURA PRINCIPAL ---
    
    // Base/Calçada do lote
    lot.add(createBox(3.8, 0.05, 3.8, 0x9e9e9e, 0, 0.025, 0, isNight));

    // Bloco Principal (Área de Atendimento) - Moderno Cinza Escuro
    lot.add(createBox(2.2, 1.2, 1.8, darkGrey, -0.6, 0.6, 0.2, isNight));
    
    // Detalhe de Madeira na fachada
    lot.add(createBox(2.3, 0.8, 0.1, woodColor, -0.6, 0.6, 1.11, isNight));
    
    // Bloco Lateral (Salão de Festas/Play) - Vidro e Vermelho
    lot.add(createBox(1.2, 1.0, 1.8, mcdRed, 1.1, 0.5, 0.2, isNight));
    // Janelões de vidro do Play
    lot.add(createBox(1.25, 0.8, 1.4, glassColor, 1.1, 0.6, 0.2, isNight));
    
    // Telhado Flutuante (Signature Roof)
    const roofY = 1.3;
    lot.add(createBox(2.4, 0.1, 2.0, offWhite, -0.6, roofY, 0.2, isNight));
    // Faixa Amarela de LED no telhado (Glow noturno)
    // O argumento 'true' no final provavelmente ativa o emissive, verifique se seu createBox cria clone internamente.
    // Se não criar, este pode ser outro ponto de conflito com outros objetos amarelos.
    lot.add(createBox(2.45, 0.05, 2.05, mcdYellow, -0.6, roofY, 0.2, isNight, true));

    // --- ENTRADA & INTERIOR ---
    
    // Porta Dupla de Vidro
    const doorX = -0.6;
    const doorZ = 1.15;
    lot.add(createDoor(0.6, 0.9, doorX, 0, 1.12, isNight, darkGrey));
    // Toldo de entrada
    lot.add(createBox(0.8, 0.05, 0.4, mcdRed, doorX, 1.0, 1.3, isNight));

    // Interior (Mesas visíveis através do vidro)
    const addTable = (x: number, z: number) => {
        const t = new THREE.Group();
        t.position.set(x, 0, z);
        t.add(createBox(0.05, 0.3, 0.05, 0xeeeeee, 0, 0.15, 0, isNight));
        t.add(createBox(0.3, 0.02, 0.3, 0xffffff, 0, 0.3, 0, isNight));
        // Bancos vermelhos
        t.add(createBox(0.2, 0.2, 0.2, mcdRed, -0.2, 0.1, 0, isNight));
        t.add(createBox(0.2, 0.2, 0.2, mcdRed, 0.2, 0.1, 0, isNight));
        lot.add(t);
    };
    addTable(1.1, 0.8); // Mesa na área do play
    addTable(1.1, 0.0); 

    // --- DRIVE THRU (Lateral Esquerda e Fundo) ---
    
    // Cabine de Pagamento (Bump out)
    lot.add(createBox(0.3, 0.8, 0.5, offWhite, -1.75, 0.4, 0.5, isNight));
    lot.add(createWindow(0.1, 0.4, -1.91, 0.5, 0.5, isNight)); // Janela de atendimento
    lot.add(createBox(0.4, 0.05, 0.6, mcdRed, -1.75, 0.9, 0.5, isNight)); // Telhadinho

    // Menu Board Iluminado (Drive Thru)
    const menuGroup = new THREE.Group();
    menuGroup.position.set(-1.6, 0, 1.5);
    menuGroup.rotation.y = -0.5;
    menuGroup.add(createBox(0.1, 0.6, 0.4, 0x111111, 0, 0.3, 0, isNight));
    
    // Tela iluminada
    const menuScreen = createBox(0.05, 0.5, 0.35, 0xffffff, 0.03, 0.35, 0, isNight);
    if (isNight) {
        // [CORREÇÃO CRÍTICA]: Clonar o material antes de alterar o emissive.
        // Isso impede que outros objetos brancos (como mesas ou faixas) brilhem também.
        const mat = (menuScreen.material as THREE.MeshStandardMaterial).clone();
        mat.emissive.setHex(0xffffff);
        mat.emissiveIntensity = 0.5;
        menuScreen.material = mat;
    }
    menuGroup.add(menuScreen);
    lot.add(menuGroup);

    // Limitador de Altura (Pórtico do Drive Thru)
    const clearanceBar = new THREE.Group();
    clearanceBar.position.set(-1.5, 0, 1.8);
    clearanceBar.add(createBox(0.1, 1.2, 0.1, mcdYellow, 0, 0.6, -0.5, isNight)); // Poste 1
    clearanceBar.add(createBox(0.1, 1.2, 0.1, mcdYellow, 0, 0.6, 0.5, isNight));  // Poste 2
    clearanceBar.add(createBox(0.1, 0.2, 1.1, mcdRed, 0, 1.1, 0, isNight));        // Barra
    // Texto "CLEARANCE" (simulado com faixa branca)
    clearanceBar.add(createBox(0.11, 0.1, 0.8, 0xffffff, 0, 1.1, 0, isNight));
    lot.add(clearanceBar);

    // --- OS ARCOS DOURADOS (Golden Arches) ---
    
    const archMat = new THREE.MeshStandardMaterial({ 
        color: mcdYellow, 
        roughness: 0.2, 
        metalness: 0.5,
        emissive: mcdYellow,
        emissiveIntensity: isNight ? 0.8 : 0
    });
    
    // Arco Grande no Topo (Estilo M)
    const createArch = (x: number, z: number, s: number) => {
        const arch = new THREE.Group();
        arch.position.set(x, 1.35, z); // No topo do telhado
        const geo = new THREE.TorusGeometry(0.5 * s, 0.08 * s, 8, 16, Math.PI);
        const leftArc = new THREE.Mesh(geo, archMat);
        const rightArc = new THREE.Mesh(geo, archMat);
        rightArc.position.x = 0.55 * s; // Desloca para formar o M
        
        arch.add(leftArc);
        arch.add(rightArc);
        lot.add(arch);
    };
    createArch(-0.6, 1.1, 0.8); // Fachada Frontal

    // Totem Gigante na Esquina
    const totem = new THREE.Group();
    totem.position.set(1.5, 0, 1.5);
    totem.rotation.y = Math.PI / 4;
    totem.add(createBox(0.15, 2.5, 0.15, darkGrey, 0, 1.25, 0, isNight)); // Poste alto
    
    // Caixa do Logo (PLACA VERMELHA)
    // [CORREÇÃO CRÍTICA]: Separamos a caixa do logo.
    const logoBox = createBox(0.8, 0.6, 0.2, mcdRed, 0, 2.2, 0, isNight);
    
    // Se for noite, queremos que APENAS essa caixa vermelha brilhe.
    if (isNight) {
        // 1. Clonamos o material para criar uma instância única na memória
        const mat = (logoBox.material as THREE.MeshStandardMaterial).clone();
        
        // 2. Aplicamos o brilho apenas neste novo material
        mat.emissive.setHex(mcdRed);
        mat.emissiveIntensity = 0.5; // Brilho suave na caixa vermelha
        
        // 3. Reatribuímos o material clonado ao objeto
        logoBox.material = mat;
    }
    totem.add(logoBox);

    // Mini arcos no totem (Estes usam archMat que já é seguro pois é uma instância nova)
    const miniM = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 8, 16, Math.PI), archMat);
    miniM.position.set(-0.12, 2.2, 0.11);
    const miniM2 = miniM.clone(); miniM2.position.set(0.12, 2.2, 0.11);
    totem.add(miniM); totem.add(miniM2);
    lot.add(totem);

    // --- DETALHES FINAIS ---
    
    // Mesas Externas com Guarda-Sol
    const addPatio = (x: number, z: number) => {
        const p = new THREE.Group();
        p.position.set(x, 0, z);
        p.add(createBox(0.4, 0.3, 0.4, 0xcccccc, 0, 0.15, 0, isNight)); // Mesa
        p.add(createBox(0.05, 0.9, 0.05, 0xeeeeee, 0, 0.45, 0, isNight)); // Haste
        const umbrella = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.2, 8), new THREE.MeshStandardMaterial({color: mcdRed}));
        umbrella.position.y = 0.9;
        p.add(umbrella);
        lot.add(p);
    };
    addPatio(1.5, -0.5);
    addPatio(1.5, -1.2);

    // Arbustos
    lot.add(createBush(-1.2, 1.5, 0.7, isNight));
    lot.add(createBush(0.5, 1.5, 0.7, isNight));
    
    // Lixeiras (Detalhe essencial)
    lot.add(createBox(0.2, 0.4, 0.2, 0x5d4037, 1.0, 0.2, 1.6, isNight));
    lot.add(createBox(0.18, 0.1, 0.18, 0xaaaaaa, 1.0, 0.45, 1.6, isNight)); // Tampa basculante
};

// 2. Starbucks (2x2) - REDESIGNED
export const renderComStarbucks = (lot: THREE.Group, isNight: boolean) => {
    const darkWood = 0x3e2723;
    const darkGrey = 0x212121;
    const cream = 0xffe0b2;
    const starbucksGreen = 0x00704a;

    lot.add(createBox(3.0, 1.2, 2.0, darkGrey, 0, 0.6, 0, isNight));
    
    // Top Band FIX: Slightly larger to avoid Z-fight
    lot.add(createBox(3.05, 0.2, 2.05, darkWood, 0, 1.1, 0, isNight));

    // Corner Entrance
    lot.add(createBox(1.0, 1.2, 1.0, 0x81d4fa, 1.0, 0.6, 1.0, isNight));
    
    // Angled Overhang
    const roof = createBox(1.5, 0.1, 1.5, darkWood, 1.0, 1.3, 1.0, isNight);
    roof.rotation.x = 0.1;
    roof.rotation.z = -0.1;
    lot.add(roof);

    // FIX: Drive Thru Window depth/offset - MOVED FURTHER OUT (-1.55) to avoid z-fighting
    lot.add(createBox(0.5, 0.5, 0.15, 0x81d4fa, -1.55, 0.5, 0, isNight));
    lot.add(createBox(0.6, 0.1, 0.45, darkWood, -1.6, 0.3, 0, isNight)); 

    // Logo Panel FIX: Move slightly forward
    const logoPanel = createBox(0.1, 1.2, 0.8, darkWood, 1.0, 0.6, 1.6, isNight);
    lot.add(logoPanel);
    
    // Round Logo
    const logoGeo = new THREE.CircleGeometry(0.35, 32);
    const logoMat = new THREE.MeshStandardMaterial({ 
        color: starbucksGreen, 
        emissive: isNight ? starbucksGreen : 0x000000, 
        emissiveIntensity: 0.5 
    });
    const logo = new THREE.Mesh(logoGeo, logoMat);
    logo.position.set(1.0, 0.9, 1.65); // Front of panel
    lot.add(logo);
    const logoIn = new THREE.Mesh(new THREE.CircleGeometry(0.2, 16), new THREE.MeshStandardMaterial({color: 0xffffff}));
    logoIn.position.z = 0.01; logo.add(logoIn);

    // Text Sign on Main Facade
    addComSign(lot, -0.5, 1.1, 1.03, 0, '#3e2723', "STARBUCKS", 0.4, false, isNight);

    // Outdoor Seating with Smaller Green Parasols - REPOSITIONED
    const addParasolTable = (x: number, z: number) => {
        lot.add(createBox(0.4, 0.3, 0.4, cream, x, 0.15, z, isNight));
        lot.add(createBox(0.05, 1.0, 0.05, 0x5d4037, x, 0.5, z, isNight));
        // Smaller parasol
        const pTop = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.15, 8), new THREE.MeshStandardMaterial({color: starbucksGreen}));
        pTop.position.set(x, 1.0, z);
        lot.add(pTop);
    };

    // FIX: Move tables further out to avoid clipping
    addParasolTable(-0.5, 1.6);
    addParasolTable(0.5, 1.6);
    addParasolTable(-1.7, 0.8);
};

// 3. Hard Rock Cafe (2x2) - ULTRA DETAILED (Rock Palace)
export const renderComHardRock = (lot: THREE.Group, isNight: boolean) => {
    // Paleta de Cores
    const whiteWall = 0xf5f5f5;
    const gold = 0xffd700;
    const darkGrey = 0x212121;
    const velvetRed = 0xb71c1c; // Tapete vermelho
    const glassColor = 0x81d4fa;
    const neonPink = 0xff4081;

    // --- ESTRUTURA PRINCIPAL (Neoclássico "Grandioso") ---
    
    // Base/Plataforma elevada
    lot.add(createBox(3.6, 0.2, 3.6, 0x424242, 0, 0.1, 0, isNight));
    // Escadaria frontal larga
    lot.add(createBox(2.0, 0.1, 0.4, 0x616161, 0, 0.15, 1.9, isNight));

    // Bloco Central (Templo)
    lot.add(createBox(2.8, 1.4, 2.4, whiteWall, 0, 0.8, -0.2, isNight));
    
    // Colunas Majestosas (Portico Entrada)
    const colX = [-0.8, -0.3, 0.3, 0.8];
    colX.forEach(x => {
        // Coluna
        lot.add(createBox(0.15, 1.4, 0.15, whiteWall, x, 0.9, 1.1, isNight));
        // Base da coluna
        lot.add(createBox(0.2, 0.1, 0.2, darkGrey, x, 0.25, 1.1, isNight));
        // Capitel Dourado
        lot.add(createBox(0.18, 0.1, 0.18, gold, x, 1.6, 1.1, isNight));
    });

    // Frontão (Triângulo do telhado sobre as colunas)
    const pediment = createGableRoof(2.4, 1.0, 0.6, whiteWall, 0, 1.6, 1.1, isNight);
    // Adicionar letreiro "ROCK" no frontão
    const rockSign = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.3), new THREE.MeshStandardMaterial({
        color: 0x000000, transparent: true, opacity: 0.8
    }));
    rockSign.position.set(0, 0, 0.25); // Relativo ao frontão (que já é um grupo ou mesh)
    // O createGableRoof retorna um grupo com um cone girado. É mais fácil adicionar uma caixa de texto na frente.
    lot.add(pediment);
    
    // Texto "HARD ROCK" no frontão
    addComSign(lot, 0, 1.9, 1.36, 0, '#000000', 'HARD ROCK', 0.35, false, isNight);

    // Cúpula / Domo Central (Atrás do frontão)
    const domeGeo = new THREE.SphereGeometry(0.9, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.2 });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.set(0, 1.5, -0.5);
    lot.add(dome);

    // --- A GUITARRA GIGANTE (Landmark Feature) ---
    const guitarGroup = new THREE.Group();
    // Posicionada na diagonal, como se estivesse "fincada" no chão ou flutuando
    guitarGroup.position.set(1.2, 1.2, 1.2);
    guitarGroup.rotation.z = -0.4; // Inclinada
    guitarGroup.rotation.y = -0.3;
    guitarGroup.rotation.x = 0.1;

    // Corpo da Guitarra (Stratocaster estilizada)
    const gBodyColor = 0x6a1b9a; // Roxo Deep Purple
    const gBody = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 0.2, 16), new THREE.MeshStandardMaterial({color: gBodyColor}));
    gBody.scale.set(1, 1.5, 1);
    gBody.rotation.x = Math.PI/2;
    guitarGroup.add(gBody);

    // Escudo Branco
    const pickguard = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 0.05, 16), new THREE.MeshStandardMaterial({color: 0xffffff}));
    pickguard.scale.set(1, 1.4, 1);
    pickguard.rotation.x = Math.PI/2;
    pickguard.position.z = 0.1;
    guitarGroup.add(pickguard);

    // Braço
    const neck = createBox(0.2, 1.8, 0.1, 0xffcc80, 0, 1.0, 0, isNight);
    guitarGroup.add(neck);
    // Headstock
    const head = createBox(0.3, 0.4, 0.1, 0xffcc80, 0, 2.0, 0, isNight);
    guitarGroup.add(head);

    // Cordas (Neon se for noite)
    const strings = createBox(0.12, 1.5, 0.12, gold, 0, 1.0, 0.08, isNight, true); 
    guitarGroup.add(strings);

    // Iluminação da Guitarra
    if (isNight) {
        const guitarLight = new THREE.PointLight(gBodyColor, 2, 5);
        guitarLight.position.set(0, 0.5, 0.5);
        guitarGroup.add(guitarLight);
    }
    lot.add(guitarGroup);

    // --- ENTRADA VIP ---
    
    // Tapete Vermelho
    lot.add(createBox(0.8, 0.02, 1.0, velvetRed, 0, 0.21, 1.4, isNight));

    // Cordões de Isolamento (Velvet Ropes)
    const ropeColor = velvetRed;
    const postColor = gold;
    const addStanchion = (x: number, z: number) => {
        lot.add(createBox(0.05, 0.5, 0.05, postColor, x, 0.45, z, isNight));
    };
    addStanchion(-0.5, 1.0); addStanchion(-0.5, 1.4); addStanchion(-0.5, 1.8);
    addStanchion(0.5, 1.0); addStanchion(0.5, 1.4); addStanchion(0.5, 1.8);
    
    // Cordas conectando (Cubos finos alongados)
    lot.add(createBox(0.03, 0.03, 0.4, ropeColor, -0.5, 0.6, 1.2, isNight));
    lot.add(createBox(0.03, 0.03, 0.4, ropeColor, -0.5, 0.6, 1.6, isNight));
    lot.add(createBox(0.03, 0.03, 0.4, ropeColor, 0.5, 0.6, 1.2, isNight));
    lot.add(createBox(0.03, 0.03, 0.4, ropeColor, 0.5, 0.6, 1.6, isNight));

    // Porta Giratória (Simulada)
    const doorCylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.8, 8), 
        new THREE.MeshStandardMaterial({color: 0x111111, transparent: true, opacity: 0.6})
    );
    doorCylinder.position.set(0, 0.6, 1.1);
    lot.add(doorCylinder);
    // Eixo Dourado
    lot.add(createBox(0.05, 0.8, 0.05, gold, 0, 0.6, 1.1, isNight));
    // Abas da porta
    lot.add(createBox(0.6, 0.8, 0.02, gold, 0, 0.6, 1.1, isNight)); // Lâmina 1
    const blade2 = createBox(0.6, 0.8, 0.02, gold, 0, 0.6, 1.1, isNight); // Lâmina 2
    blade2.rotation.y = Math.PI/2;
    lot.add(blade2);

    // --- DETALHES EXTERNOS & ILUMINAÇÃO ---

    // Cadillac Rosa "Estacionado" ou Meio Carro na Parede (Clássico Hard Rock)
    // Vamos fazer meio carro saindo da parede lateral
    const carGroup = new THREE.Group();
    carGroup.position.set(-1.4, 0.8, 0);
    carGroup.rotation.z = Math.PI / 2; // Saindo da parede
    carGroup.add(createBox(0.8, 0.4, 1.2, 0xe91e63, 0, 0, 0, isNight)); // Corpo Rosa
    carGroup.add(createBox(0.1, 0.1, 0.1, 0xffffff, 0.2, 0.1, 0.5, isNight, true)); // Farol
    carGroup.add(createBox(0.1, 0.1, 0.1, 0xffffff, -0.2, 0.1, 0.5, isNight, true)); // Farol
    carGroup.add(createBox(0.6, 0.1, 0.2, 0xeeeeee, 0, -0.15, 0.6, isNight)); // Para-choque
    lot.add(carGroup);

    // Janelas com "Memorabilia" (Discos de Ouro)
    const addMemoWindow = (x: number, z: number, rotY: number) => {
        const w = createWindow(0.5, 0.6, x, 0.8, z, isNight, darkGrey);
        w.rotation.y = rotY;
        lot.add(w);
        // Disco de Ouro dentro
        const disc = new THREE.Mesh(new THREE.CircleGeometry(0.15, 16), new THREE.MeshStandardMaterial({color: gold}));
        disc.position.set(x, 0.8, z);
        // Ajuste fino para ficar "atrás" do vidro visualmente ou na frente do fundo
        if(rotY === 0) disc.position.z -= 0.02;
        else disc.position.x += 0.02; 
        disc.rotation.y = rotY;
        lot.add(disc);
    };
    addMemoWindow(-0.8, 1.21, 0); // Frente Esq
    addMemoWindow(0.8, 1.21, 0);  // Frente Dir

    // Iluminação Noturna Dramática (Wash Lights nas paredes)
    if (isNight) {
        // Luz Roxa banhando a fachada
        const spotL = new THREE.SpotLight(0x9c27b0, 20);
        spotL.position.set(-2, 0, 3);
        spotL.target.position.set(0, 1, 0);
        spotL.angle = 0.5;
        spotL.penumbra = 0.5;
        lot.add(spotL);
        lot.add(spotL.target);

        // Luz Rosa do outro lado
        const spotR = new THREE.SpotLight(0xe91e63, 20);
        spotR.position.set(2, 0, 3);
        spotR.target.position.set(0, 1, 0);
        spotR.angle = 0.5;
        spotR.penumbra = 0.5;
        lot.add(spotR);
        lot.add(spotR.target);
    }
    
    // Vegetação (Palmeiras pequenas para dar vibe LA/Miami)
    lot.add(createStylizedTree(-1.5, 1.5, 0.8, 'pine', isNight)); // Usando pine como base
    lot.add(createStylizedTree(1.5, -1.2, 0.8, 'pine', isNight));
    
    // Poste de Luz Estiloso
    lot.add(createParkLamp(1.5, 1.5, isNight, 'modern'));
};

// 4. Central Perk (2x2) - REDESIGNED (FIXED: Z-Fighting & Axes)
export const renderComCentralPerk = (lot: THREE.Group, isNight: boolean) => {
    // Paleta de Cores
    const brickColor = 0x8d6e63;   
    const darkBrick = 0x5d4037;    
    const perkGreen = 0x1b5e20;    
    const cream = 0xffe0b2;        
    const couchOrange = 0xf57c00;  
    const glassColor = 0x81d4fa;

    // --- ESTRUTURA PRINCIPAL ---
    
    // 1. Térreo (A Cafeteria)
    // Base de pedra
    lot.add(createBox(3.4, 0.1, 3.4, 0x424242, 0, 0.05, 0, isNight));
    
    // Parede Térreo (Recuada para destacar colunas)
    // Profundidade 3.0 (vai de -1.5 a 1.5)
    lot.add(createBox(3.0, 1.2, 3.0, cream, 0, 0.65, 0, isNight));

    // Colunas (Pillars) - z=1.55 (levemente à frente da parede 1.5)
    const pillars = [
        {x: -1.4, z: 1.55}, {x: -0.5, z: 1.55}, {x: 0.5, z: 1.55}, // Frente
        {x: 1.55, z: 1.55}, // Esquina (Pilar mestre)
        {x: 1.55, z: 0.5}, {x: 1.55, z: -0.5}, {x: 1.55, z: -1.4}  // Lateral
    ];
    
    pillars.forEach(p => {
        lot.add(createBox(0.2, 1.3, 0.2, perkGreen, p.x, 0.65, p.z, isNight));
        lot.add(createBox(0.22, 0.05, 0.22, 0xffd700, p.x, 1.25, p.z, isNight));
    });

    // 2. Andares Superiores
    // Bloco Principal (z vai de -1.6 a 1.6)
    // Z-Fighting Fix: Assegurando que ele não brigue com toldos (que estarão em z=1.75)
    lot.add(createBox(3.2, 1.8, 3.2, brickColor, 0, 2.15, 0, isNight));
    
    // Cornija (Topo)
    lot.add(createBox(3.3, 0.1, 3.3, darkBrick, 0, 3.0, 0, isNight));
    lot.add(createBox(3.4, 0.05, 3.4, 0x3e2723, 0, 3.1, 0, isNight));

    // --- FIX DAS JANELAS (EIXOS CORRETOS) ---
    // Cria a janela na origem (0,0,0) do grupo e DEPOIS move/rotaciona o grupo
    const addAptWindow = (gx: number, gy: number, gz: number, rotY: number) => {
        // Window Box (w=0.6, h=0.7) criado em (0,0,0) local
        const w = createWindow(0.6, 0.7, 0, 0, 0, isNight, 0xeeeeee);
        
        // Ajusta Posição GLOBAL e Rotação GLOBAL
        w.position.set(gx, gy, gz);
        w.rotation.y = rotY;
        
        lot.add(w);

        // Parapeito (Adicionado manualmente relativo à posição global)
        // Precisamos calcular o offset do parapeito baseado na rotação
        const pGroup = new THREE.Group();
        pGroup.position.set(gx, gy - 0.4, gz);
        pGroup.rotation.y = rotY;
        // O parapeito é levemente deslocado em Z local (0.05) para sair da parede
        pGroup.add(createBox(0.7, 0.1, 0.1, darkBrick, 0, 0, 0.05, isNight)); 
        lot.add(pGroup);
    };

    // Janelas Frente (Z = 1.61 para sair levemente da parede 1.6)
    addAptWindow(-0.8, 2.0, 1.61, 0);
    addAptWindow(0.8, 2.0, 1.61, 0);
    
    // Janelas Fundo (Z = -1.61, Rotação PI para virar para trás)
    addAptWindow(-0.8, 2.0, -1.61, Math.PI); 
    
    // Janela Lateral Direita (X = 1.61, Rotação -PI/2 ou PI/2 dependendo da orientação)
    // Se a parede está em X=1.6, queremos X=1.61. Rotação PI/2 aponta para X positivo.
    addAptWindow(1.61, 2.0, -0.8, Math.PI/2);
    
    // Varanda da Mônica (Simulada na lateral)
    const balconyGroup = new THREE.Group();
    balconyGroup.position.set(1.65, 1.6, 0.8); // X=1.65 para sair da parede
    balconyGroup.rotation.y = Math.PI/2;
    balconyGroup.add(createBox(1.0, 0.05, 0.4, 0x424242, 0, 0, 0, isNight)); 
    balconyGroup.add(createBox(1.0, 0.4, 0.05, 0x212121, 0, 0.2, 0.2, isNight)); 
    lot.add(balconyGroup);
    
    // Porta da varanda (Rotação correta)
    const bDoor = createDoor(0.5, 0.9, 0, 0, 0, isNight, 0x5d4037);
    bDoor.position.set(1.61, 2.0, 0.8); // Posição global
    bDoor.rotation.y = Math.PI/2;
    lot.add(bDoor);

    // --- DETALHES TÉRREOS ---

    // 3. Entrada de Esquina (FIX: Placa "enfiada")
    const cornerGroup = new THREE.Group();
    // Movemos um pouco para fora (1.55) para garantir que não corte a quina do prédio
    cornerGroup.position.set(1.55, 0, 1.55); 
    cornerGroup.rotation.y = Math.PI / 4;
    
    // Porta
    cornerGroup.add(createDoor(0.5, 1.0, 0, 0.5, 0, isNight, perkGreen));
    cornerGroup.add(createBox(0.05, 0.05, 0.08, 0xffd700, -0.2, 0.5, 0.05, isNight));
    
    // FIX PLACA: Aumentamos o Z local para 0.15 (ou mais) para desencostar da parede de trás
    const logoMat = new THREE.MeshStandardMaterial({
        map: getTextSignTexture("CENTRAL PERK", "#ffffff", "#1b5e20"),
        transparent: true
    });
    const logoMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), logoMat);
    // Z era 0.1, mudado para 0.2 para evitar clipping
    logoMesh.position.set(0, 1.3, 0.2); 
    cornerGroup.add(logoMesh);
    
    lot.add(cornerGroup);

    // 4. Interior & Vitrine
    lot.add(createBox(2.0, 1.0, 0.05, glassColor, -0.5, 0.6, 1.5, isNight)); // Vidro
    
    const setGroup = new THREE.Group();
    setGroup.position.set(-0.5, 0.1, 1.0);
    setGroup.add(createBox(1.2, 0.02, 0.8, 0x8e24aa, 0, 0, 0, isNight)); // Tapete
    
    // Sofá
    const couchGroup = new THREE.Group();
    couchGroup.position.set(0, 0.1, 0.1);
    couchGroup.add(createBox(0.8, 0.2, 0.3, couchOrange, 0, 0.1, 0, isNight));
    couchGroup.add(createBox(0.8, 0.25, 0.1, couchOrange, 0, 0.25, -0.15, isNight));
    const armGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.3, 8);
    const armMat = new THREE.MeshStandardMaterial({color: couchOrange});
    const armL = new THREE.Mesh(armGeo, armMat); armL.rotation.x = Math.PI/2; armL.position.set(-0.45, 0.2, 0);
    const armR = new THREE.Mesh(armGeo, armMat); armR.rotation.x = Math.PI/2; armR.position.set(0.45, 0.2, 0);
    couchGroup.add(armL); couchGroup.add(armR);
    setGroup.add(couchGroup);

    // Mesa e Caneca
    setGroup.add(createBox(0.5, 0.15, 0.3, 0x5d4037, 0, 0.08, 0.4, isNight));
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.06, 6), new THREE.MeshStandardMaterial({color: 0xffffff}));
    mug.position.set(0.1, 0.18, 0.4);
    setGroup.add(mug);
    setGroup.add(createBox(0.3, 0.2, 0.3, 0x2e7d32, -0.7, 0.1, 0, isNight)); // Poltrona
    if (isNight) {
        const interiorLight = new THREE.PointLight(0xffb74d, 1, 3);
        interiorLight.position.set(0, 1.0, 0);
        setGroup.add(interiorLight);
    }
    lot.add(setGroup);

    // 5. Toldos (FIX: Z-Fighting)
    // Z alterado de 1.6 para 1.75. 
    // A parede do andar de cima está em 1.6. Os toldos precisam estar mais a frente.
    const awningZ = 1.75; 
    for(let i=-1.3; i<=0.3; i+=0.15) {
        const color = Math.abs(Math.round(i*10)) % 2 === 0 ? 0xffffff : perkGreen;
        const segment = createBox(0.15, 0.02, 0.4, color, i, 1.4, awningZ, isNight);
        segment.rotation.x = 0.4;
        lot.add(segment);
    }

    // Neon Sign Lateral
    const neonSign = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), new THREE.MeshStandardMaterial({
        map: getTextSignTexture("COFFEE", "#00000000", "#ff1744"),
        transparent: true,
        emissive: 0xff1744,
        emissiveIntensity: isNight ? 2 : 0,
        side: THREE.DoubleSide
    }));
    // Ajustado X para 1.62 (logo acima da parede 1.6)
    neonSign.position.set(1.62, 1.0, 0);
    neonSign.rotation.y = Math.PI/2;
    lot.add(neonSign);

    // Escada de Incêndio
    const fireEscapeX = -1.65;
    const feColor = 0x212121;
    lot.add(createBox(0.1, 0.05, 1.2, feColor, fireEscapeX, 2.0, 0, isNight));
    lot.add(createBox(0.02, 0.4, 1.2, feColor, fireEscapeX - 0.15, 2.2, 0, isNight));
    const ladder = createBox(0.1, 1.5, 0.3, feColor, fireEscapeX, 1.2, 0.5, isNight);
    ladder.rotation.z = 0.3;
    ladder.rotation.y = Math.PI/2;
    lot.add(ladder);

    // Props de Calçada
    const addBistroTable = (x: number, z: number) => {
        const t = new THREE.Group();
        t.position.set(x, 0, z);
        t.add(createBox(0.05, 0.35, 0.05, 0x212121, 0, 0.17, 0, isNight));
        t.add(createBox(0.3, 0.02, 0.3, 0xffffff, 0, 0.35, 0, isNight));
        t.add(createBox(0.15, 0.2, 0.15, 0x4caf50, -0.2, 0.1, 0, isNight));
        t.add(createBox(0.15, 0.2, 0.15, 0x4caf50, 0.2, 0.1, 0, isNight));
        lot.add(t);
    };
    addBistroTable(0.5, 1.9);
    
    // Verifica se createParkLamp existe antes de usar (segurança extra)
    // Mas se você atualizou os imports conforme o Passo 1, vai funcionar.
    const lamp = createParkLamp(-1.2, 1.8, isNight, 'classic');
    lamp.scale.set(0.8, 0.8, 0.8);
    lot.add(lamp);

    lot.add(createBush(1.8, 1.8, 0.8, isNight));
    lot.add(createBox(0.3, 0.3, 0.3, 0x5d4037, 1.8, 0.15, 1.8, isNight));

    const mailbox = new THREE.Group();
    mailbox.position.set(-1.6, 0, 1.8);
    mailbox.add(createBox(0.25, 0.4, 0.25, 0x0d47a1, 0, 0.2, 0, isNight));
    mailbox.add(createBox(0.3, 0.1, 0.3, 0x0d47a1, 0, 0.4, 0, isNight));
    lot.add(mailbox);
};

// 5. Carrefour (2x2) - REDESIGNED
export const renderComCarrefour = (lot: THREE.Group, isNight: boolean) => {
    const concreteWhite = 0xf5f5f5;
    const carrefourBlue = 0x1e88e5;
    const carrefourRed = 0xe53935;

    lot.add(createBox(3.6, 1.2, 3.0, concreteWhite, 0, 0.6, -0.2, isNight));
    
    // Top strip FIX: Slightly wider/deeper
    lot.add(createBox(3.65, 0.15, 3.05, concreteWhite, 0, 1.1, -0.2, isNight));
    // Lines FIX: Even wider
    lot.add(createBox(3.7, 0.05, 3.1, carrefourBlue, 0, 1.15, -0.2, isNight, true));
    lot.add(createBox(3.7, 0.05, 3.1, carrefourRed, 0, 1.05, -0.2, isNight, true));
    
    // Atrium FIX: Z position
    lot.add(createBox(1.2, 1.0, 0.5, 0xeeeeee, 0, 0.5, 1.35, isNight)); 
    lot.add(createWindow(1.0, 0.8, 0, 0.5, 1.61, isNight)); 
    
    const signTexture = getCarrefourSignTexture();
    addCustomLogoSign(lot, signTexture, 0, 1.4, 1.32, 2.0, 0.5, 0, isNight);

    const cartBay = new THREE.Group();
    cartBay.position.set(1.2, 0.1, 1.5);
    cartBay.add(createBox(0.6, 0.4, 0.4, 0x90a4ae, 0, 0.2, 0, isNight)); 
    cartBay.add(createBox(0.3, 0.2, 0.3, 0xbdbdbd, 0, 0.1, 0, isNight));
    lot.add(cartBay);

    const flag1 = new THREE.Group();
    flag1.position.set(-1.6, 0, 1.6);
    flag1.add(createBox(0.05, 2.0, 0.05, 0xdddddd, 0, 1.0, 0, isNight));
    flag1.add(createBox(0.5, 0.3, 0.02, carrefourBlue, 0.25, 1.8, 0, isNight));
    lot.add(flag1);

    const flag2 = new THREE.Group();
    flag2.position.set(-1.4, 0, 1.6);
    flag2.add(createBox(0.05, 2.0, 0.05, 0xdddddd, 0, 1.0, 0, isNight));
    flag2.add(createBox(0.5, 0.3, 0.02, carrefourRed, 0.25, 1.8, 0, isNight));
    lot.add(flag2);
};