
import * as THREE from 'three';
import { createBox, addACUnit, getCommercialSignTexture, getAdvertisementTexture, getTextSignTexture, getGlowTexture, getCarrefourSignTexture } from './cityHelpers';
import { createDoor, createWindow, createBench, createVehicle, createGableRoof, createBush, createFence, createStylizedTree } from './rendererHelpers';

const createBicycle = (x: number, z: number, rotation: number, isNight: boolean) => {
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

// 1. McDonald's (2x2)
export const renderComMcDonalds = (lot: THREE.Group, isNight: boolean) => {
    const red = 0xd32f2f;
    const yellow = 0xffeb3b;
    const darkGrey = 0x424242;

    lot.add(createBox(3.0, 1.0, 2.0, red, 0, 0.5, 0, isNight));
    lot.add(createBox(3.1, 0.1, 2.1, darkGrey, 0, 1.05, 0, isNight));
    lot.add(createBox(2.8, 0.3, 1.8, darkGrey, 0, 1.2, 0, isNight));

    const archMat = new THREE.MeshStandardMaterial({ color: yellow, emissive: isNight ? yellow : 0x000000, emissiveIntensity: isNight ? 0.5 : 0 });
    const createArch = (x: number) => {
        const arch = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.1, 8, 16, Math.PI), archMat);
        arch.position.set(x, 1.0, 1.05); // Front of roof
        lot.add(arch);
    };
    createArch(-0.6);
    createArch(0.6);

    // FIX: Move Glass Front slightly out to prevent z-fighting with red base
    lot.add(createBox(2.5, 0.8, 0.12, 0x81d4fa, 0, 0.4, 1.02, isNight)); // Adjusted depth and Z
    
    // Side Windows - ROTATED
    const w1 = createWindow(0.6, 0.5, -1.52, 0.5, 0, isNight);
    w1.rotation.y = -Math.PI / 2;
    lot.add(w1);

    const w2 = createWindow(0.6, 0.5, 1.52, 0.5, 0, isNight);
    w2.rotation.y = Math.PI / 2;
    lot.add(w2);

    // Side Text
    addComSign(lot, -1.53, 0.8, 0, -Math.PI/2, '#d32f2f', "McDonalds", 0.3, false, isNight);

    // Drive Thru Side
    lot.add(createBox(0.8, 0.6, 0.5, 0xffffff, -1.6, 0.3, -0.5, isNight)); 
    lot.add(createBox(0.1, 0.4, 0.4, 0x81d4fa, -1.9, 0.4, -0.5, isNight)); 

    const signPost = createBox(0.1, 2.0, 0.1, 0xeeeeee, 1.5, 1.0, 1.5, isNight);
    lot.add(signPost);
    const bigM = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.05, 8, 16, Math.PI), archMat);
    bigM.position.set(1.5, 2.0, 1.55);
    const bigM2 = bigM.clone(); bigM2.position.set(1.8, 2.0, 1.55); 
    lot.add(bigM); lot.add(bigM2);
    
    const addTable = (x: number, z: number) => {
        lot.add(createBox(0.3, 0.2, 0.3, 0xffffff, x, 0.1, z, isNight));
        const top = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 8), new THREE.MeshStandardMaterial({color: red}));
        top.position.set(x, 0.3, z); lot.add(top);
    };
    addTable(1.0, 1.5);
    addTable(0.5, 1.5);
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

// 3. Hard Rock Cafe (2x2) - REDESIGNED
export const renderComHardRock = (lot: THREE.Group, isNight: boolean) => {
    const creamWall = 0xfdf5e6; 
    const gold = 0xffd700;
    const roofColor = 0x3e2723;

    lot.add(createBox(3.4, 1.5, 2.5, creamWall, 0, 0.75, -0.2, isNight));
    
    // Cornice FIX: Slightly larger
    lot.add(createBox(3.5, 0.1, 2.6, roofColor, 0, 1.55, -0.2, isNight)); 
    lot.add(createGableRoof(3.4, 1.2, 0.8, roofColor, 0, 1.55, -0.2, isNight));

    // Portico Roof FIX: Ensure Z offset
    lot.add(createBox(1.8, 0.1, 1.2, creamWall, 0, 1.0, 1.4, isNight)); 
    
    // FIX: Columns Y position raised to 0.7 so they sit ON TOP of the steps (0.2 height) instead of clipping through
    lot.add(createBox(0.2, 1.0, 0.2, creamWall, -0.7, 0.7, 1.8, isNight));
    lot.add(createBox(0.2, 1.0, 0.2, creamWall, 0.7, 0.7, 1.8, isNight));
    
    // Steps
    lot.add(createBox(2.0, 0.2, 1.0, 0x8d6e63, 0, 0.1, 1.4, isNight));

    const guitarGroup = new THREE.Group();
    guitarGroup.position.set(-1.2, 1.5, 1.5);
    guitarGroup.rotation.z = -0.3;
    guitarGroup.rotation.y = 0.2;
    
    const bodyColor = 0x6a1b9a; 
    const gBody = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 1.2, 8), new THREE.MeshStandardMaterial({color: bodyColor}));
    gBody.scale.set(1, 1, 0.3);
    guitarGroup.add(gBody);
    const neck = createBox(0.15, 1.5, 0.1, 0x333333, 0, 1.0, 0, isNight);
    guitarGroup.add(neck);
    const head = createBox(0.3, 0.4, 0.1, bodyColor, 0, 1.8, 0, isNight);
    guitarGroup.add(head);
    const strings = createBox(0.05, 1.2, 0.12, gold, 0, 1.0, 0.05, isNight, true);
    guitarGroup.add(strings);
    
    if(isNight) {
        const glow = new THREE.PointLight(bodyColor, 1, 4);
        guitarGroup.add(glow);
    }
    lot.add(guitarGroup);

    // Marquee Sign FIX: Z positioning
    const signBox = createBox(1.2, 0.3, 0.2, 0x000000, 0, 1.2, 1.95, isNight);
    lot.add(signBox);
    addComSign(lot, 0, 1.2, 2.06, 0, '#000000', 'HARD ROCK', 0.4, false, isNight);
    
    // Gold Trim Lines FIX: Offset
    lot.add(createBox(3.45, 0.05, 0.05, gold, 0, 0.5, 1.06, isNight, true));
};

// 4. Central Perk (2x2)
export const renderComCentralPerk = (lot: THREE.Group, isNight: boolean) => {
    const brick = 0x5d4037; 
    const green = 0x2e7d32; 

    lot.add(createBox(3.0, 1.5, 3.0, brick, 0, 0.75, 0, isNight));
    
    const corner = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.5, 0.2), new THREE.MeshStandardMaterial({color: brick}));
    corner.rotation.y = Math.PI/4;
    corner.position.set(1.4, 0.75, 1.4);
    lot.add(corner);
    
    const door = createDoor(0.5, 0.8, 0, -0.3, 0.1, isNight, green);
    door.rotation.y = Math.PI/4;
    door.position.set(1.4, 0.4, 1.4);
    lot.add(door);

    lot.add(createWindow(1.5, 0.8, 0, 0.6, 1.51, isNight));
    
    const logoText = getTextSignTexture("CENTRAL PERK", "#ffffff", "#2e7d32");
    const logoMat = new THREE.MeshStandardMaterial({map: logoText, transparent: true, opacity: 0.9});
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), logoMat);
    logo.position.set(0, 0.6, 1.56);
    lot.add(logo);

    const couch = new THREE.Group();
    couch.position.set(-0.8, 0.1, 1.2);
    couch.add(createBox(1.0, 0.3, 0.4, 0xff9800, 0, 0.15, 0, isNight)); 
    couch.add(createBox(1.0, 0.4, 0.1, 0xff9800, 0, 0.2, -0.2, isNight));
    couch.add(createBox(0.1, 0.3, 0.4, 0xff9800, -0.5, 0.2, 0, isNight));
    couch.add(createBox(0.1, 0.3, 0.4, 0xff9800, 0.5, 0.2, 0, isNight));
    lot.add(couch);
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
