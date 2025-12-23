
import * as THREE from 'three';
import { createBox, addACUnit, getGlowTexture, createPumpkin, createEasterEgg, random } from './cityHelpers';
import { createStylizedTree, createGableRoof, createWindow, createDoor, createFence, createBench, createBush } from './rendererHelpers';
import { EventType } from './timeHelpers';

// --- HELPER: YARD DECORATION ---
const decorateYard = (lot: THREE.Group, activeEvent: EventType, isNight: boolean, width: number, depth: number) => {
    if (activeEvent !== 'halloween' && activeEvent !== 'easter') return;

    if (random() > 0.6) return;

    const margin = 0.2;
    const houseSafeRadius = 0.6; 

    const spawnProp = (type: 'pumpkin' | 'egg') => {
        let x = 0, z = 0;
        let safe = false;
        let tries = 0;
        while (!safe && tries < 10) {
            x = (random() - 0.5) * (width * 2 - margin);
            z = (random() - 0.5) * (depth * 2 - margin);
            const dist = Math.sqrt(x*x + z*z);
            if (dist > houseSafeRadius) {
                safe = true;
            }
            tries++;
        }
        if (safe) {
            if (type === 'pumpkin') {
                const pumpkin = createPumpkin(x, z, isNight);
                pumpkin.rotation.y = random() * Math.PI * 2;
                lot.add(pumpkin);
            } else {
                const egg = createEasterEgg(x, z, isNight);
                lot.add(egg);
            }
        }
    };

    if (activeEvent === 'halloween') {
        spawnProp('pumpkin');
    } else if (activeEvent === 'easter') {
        const count = 1 + Math.floor(random() * 3); 
        for(let i=0; i<count; i++) spawnProp('egg');
    }
};

export const renderResCottage = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean, season: string, activeEvent: EventType) => {
    const isV1 = variant === 1;
    const wallColor = isV1 ? 0xe8f5e9 : 0xffe0b2; 
    const roofColor = isV1 ? 0x2e7d32 : 0x5d4037; 
    const deckColor = isV1 ? 0xa5d6a7 : 0x8d6e63;
    const doorColor = isV1 ? 0x1b5e20 : 0x5d4037; 
    lot.add(createBox(1.2, 0.2, 1.2, deckColor, 0, 0.1, 0, isNight));
    lot.add(createBox(1.0, 0.8, 0.8, wallColor, 0, 0.6, -0.1, isNight));
    const roofGeo = new THREE.ConeGeometry(0.9, 0.7, 4);
    const roof = new THREE.Mesh(roofGeo, new THREE.MeshStandardMaterial({color: roofColor, flatShading: true}));
    roof.rotation.y = Math.PI / 4; 
    roof.position.set(0, 1.36, -0.1); 
    lot.add(roof);
    lot.add(createDoor(0.25, 0.5, 0, 0.45, 0.31, isNight, doorColor));
    lot.add(createBox(0.3, 0.1, 0.15, deckColor, 0, 0.25, 0.35, isNight)); 
    lot.add(createWindow(0.3, 0.3, -0.3, 0.7, 0.31, isNight));
    lot.add(createWindow(0.3, 0.3, 0.3, 0.7, 0.31, isNight));
    const chimX = isV1 ? -0.3 : 0.3;
    lot.add(createBox(0.15, 0.6, 0.15, 0x4e342e, chimX, 1.2, -0.3, isNight)); 
    decorateYard(lot, activeEvent, isNight, 1, 1);
    if (isRare) {
        lot.add(createFence(1.8, 1.8, 0, 0, isNight));
        lot.add(createBox(0.3, 0.1, 0.1, 0x5d4037, -0.3, 0.5, 0.35, isNight));
        lot.add(createBox(0.25, 0.05, 0.05, 0xe91e63, -0.3, 0.55, 0.35, isNight)); 
    } else {
        lot.add(createStylizedTree(0.6, 0.6, 0.5, 'round', isNight, season));
    }
};

export const renderResModern = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean, season: string, activeEvent: EventType) => {
    const isV1 = variant === 1;
    const wallColor = isV1 ? 0x9e9e9e : 0xf5f5f5; 
    const accentColor = isV1 ? 0x546e7a : 0x78909c; 
    const woodColor = isV1 ? 0x616161 : 0x8d6e63;
    const doorColor = isV1 ? 0x263238 : 0x3e2723; 
    lot.add(createBox(1.0, 0.9, 0.9, wallColor, 0, 0.5, 0, isNight));
    lot.add(createBox(0.4, 0.9, 0.3, woodColor, 0.4, 0.5, 0.4, isNight));
    lot.add(createDoor(0.25, 0.6, 0.4, 0.35, 0.56, isNight, doorColor));
    lot.add(createBox(0.05, 0.7, 0.6, 0x455a64, -0.51, 0.5, 0, isNight));
    lot.add(createBox(0.02, 0.65, 0.55, 0x81d4fa, -0.52, 0.5, 0, isNight)); 
    lot.add(createBox(1.2, 0.05, 1.1, accentColor, 0, 0.96, 0, isNight)); 
    decorateYard(lot, activeEvent, isNight, 1, 1);
    if (isRare) {
        const panel = createBox(0.6, 0.05, 0.4, 0x4fc3f7, -0.1, 1.0, 0, isNight, true);
        panel.rotation.x = 0.1;
        lot.add(panel);
    }
    lot.add(createBox(0.3, 0.02, 0.3, 0x9e9e9e, 0.4, 0.02, 0.8, isNight));
};

export const renderResBarn = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean, season: string, activeEvent: EventType) => {
    const isV1 = variant === 1;
    const wallColor = isV1 ? 0xffccbc : 0xc5cae9; 
    const roofColor = 0x546e7a;
    lot.add(createBox(1.1, 0.6, 0.8, wallColor, -0.2, 0.3, -0.1, isNight));
    lot.add(createBox(0.6, 0.5, 0.8, wallColor, 0.6, 0.25, 0.1, isNight));
    lot.add(createBox(0.5, 0.4, 0.05, 0xe0e0e0, 0.6, 0.2, 0.51, isNight));
    lot.add(createGableRoof(1.3, 1.0, 0.6, roofColor, -0.2, 0.6, -0.1, isNight));
    const garageRoof = createBox(0.7, 0.05, 0.9, roofColor, 0.6, 0.55, 0.1, isNight);
    garageRoof.rotation.x = 0.1;
    lot.add(garageRoof);
    lot.add(createDoor(0.2, 0.4, -0.2, 0.2, 0.31, isNight, 0x3e2723));
    lot.add(createWindow(0.3, 0.3, -0.5, 0.4, 0.31, isNight));
    decorateYard(lot, activeEvent, isNight, 1, 1);
    if(isRare) {
        lot.add(createBox(0.6, 0.1, 0.6, 0x5d4037, 0.7, 0.05, 0.7, isNight));
        lot.add(createBox(0.15, 0.1, 0.15, 0x4caf50, 0.55, 0.15, 0.55, isNight));
        lot.add(createBox(0.05, 0.5, 0.05, 0x8d6e63, 0.7, 0.25, 0.7, isNight));
        lot.add(createBox(0.3, 0.05, 0.05, 0xffe082, 0.7, 0.4, 0.7, isNight));
        lot.add(createBox(0.1, 0.15, 0.1, 0xff5722, 0.7, 0.55, 0.7, isNight));
    } else {
        lot.add(createBox(0.6, 0.02, 0.6, 0x9e9e9e, 0.6, 0.02, 0.6, isNight));
    }
};

export const renderResEuropean = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean, season: string, activeEvent: EventType) => {
    const color = variant === 0 ? 0xffe082 : 0xf48fb1; 
    lot.add(createBox(0.7, 1.4, 0.8, color, 0, 0.7, 0, isNight));
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.6, 4), new THREE.MeshStandardMaterial({color: 0x8d6e63}));
    roof.rotation.y = Math.PI/4;
    roof.position.set(0, 1.7, 0);
    lot.add(roof);
    lot.add(createWindow(0.3, 0.35, 0, 1.2, 0.41, isNight, 0xffffff)); 
    lot.add(createWindow(0.3, 0.35, 0, 0.8, 0.41, isNight, 0xffffff)); 
    lot.add(createDoor(0.25, 0.5, 0, 0.25, 0.41, isNight, 0x1b5e20));
    decorateYard(lot, activeEvent, isNight, 1, 1);
    if(isRare) {
        lot.add(createBox(0.4, 0.05, 0.2, 0x8d6e63, 0, 0.65, 0.5, isNight)); 
        lot.add(createBox(0.4, 0.2, 0.02, 0x5d4037, 0, 0.75, 0.6, isNight));
    }
};

export const renderResLuxury = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean, season: string, activeEvent: EventType) => {
    const isV1 = variant === 1;
    const wall = isV1 ? 0xffffff : 0xffecb3; 
    const roof = isV1 ? 0x546e7a : 0x795548;
    const garageDoor = isV1 ? 0x90a4ae : 0xffffff;
    const doorColor = isV1 ? 0x263238 : 0x3e2723;
    lot.add(createBox(1.4, 0.9, 0.8, wall, -0.2, 0.45, -0.2, isNight));
    lot.add(createBox(0.7, 0.7, 0.8, wall, 0.3, 0.35, 0.4, isNight));
    lot.add(createBox(0.5, 0.5, 0.05, garageDoor, 0.3, 0.25, 0.81, isNight));
    lot.add(createBox(0.8, 0.8, 0.8, wall, -0.3, 1.3, -0.2, isNight));
    lot.add(createGableRoof(1.5, 0.9, 0.4, roof, -0.2, 0.9, -0.2, isNight)); 
    lot.add(createGableRoof(0.9, 0.9, 0.4, roof, -0.3, 1.7, -0.2, isNight)); 
    lot.add(createDoor(0.3, 0.6, -0.3, 0.3, 0.21, isNight, doorColor));
    lot.add(createStylizedTree(-0.8, 0.6, 0.6, 'pine', isNight, season));
    decorateYard(lot, activeEvent, isNight, 1, 1);
    if(isRare) {
        lot.add(createBox(0.5, 0.1, 0.8, 0x4fc3f7, 0.5, 0.06, -0.4, isNight));
        lot.add(createBox(0.6, 0.05, 1.0, 0xe0e0e0, 0.5, 0.05, -0.4, isNight));
    }
};

export const renderResCondoLow = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean, season: string, activeEvent: EventType) => {
    const isV1 = variant === 1;
    const brickColor = isV1 ? 0x757575 : 0x8d6e63;
    const trim = 0xffffff;
    const doorColor = isV1 ? 0x263238 : 0x3e2723;
    [-0.6, 0, 0.6].forEach((xOffset) => {
        lot.add(createBox(0.55, 1.4, 0.8, brickColor, xOffset, 0.7, 0, isNight));
        lot.add(createBox(0.6, 0.1, 0.9, trim, xOffset, 1.45, 0, isNight));
        lot.add(createBox(0.2, 0.3, 0.3, 0x9e9e9e, xOffset, 0.15, 0.5, isNight));
        lot.add(createDoor(0.2, 0.5, xOffset, 0.55, 0.41, isNight, doorColor));
        lot.add(createWindow(0.25, 0.35, xOffset, 1.0, 0.41, isNight, trim));
    });
    decorateYard(lot, activeEvent, isNight, 2, 1);
    if(isRare) {
        lot.add(createBench(1.2, 0.6, -Math.PI/2, isNight, 'wood')); 
        lot.add(createBox(0.05, 0.8, 0.05, 0x546e7a, 1.0, 0.4, 0.6, isNight));
        lot.add(createBox(0.15, 0.15, 0.15, 0xffeb3b, 1.0, 0.8, 0.6, isNight));
    }
};

export const renderResMansion = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean, season: string, activeEvent: EventType) => {
    const isV1 = variant === 1;
    const wall = isV1 ? 0xffffff : 0xfff9c4;
    const roof = isV1 ? 0x795548 : 0x546e7a; 
    const doorColor = 0x5d4037;
    lot.add(createBox(1.2, 1.2, 1.0, wall, 0, 0.6, -0.2, isNight));
    lot.add(createBox(0.8, 0.8, 0.8, wall, -0.9, 0.4, -0.2, isNight));
    lot.add(createBox(0.8, 0.8, 0.8, wall, 0.9, 0.4, -0.2, isNight));
    lot.add(createBox(0.6, 1.4, 0.4, wall, 0, 0.7, 0.3, isNight));
    lot.add(createDoor(0.3, 0.7, 0, 0.35, 0.51, isNight, doorColor));
    lot.add(createGableRoof(1.3, 1.0, 0.6, roof, 0, 1.2, -0.2, isNight)); 
    lot.add(createGableRoof(0.9, 0.8, 0.4, roof, -0.9, 0.8, -0.2, isNight)); 
    lot.add(createGableRoof(0.9, 0.8, 0.4, roof, 0.9, 0.8, -0.2, isNight)); 
    decorateYard(lot, activeEvent, isNight, 2, 1);
    if (isRare) {
        lot.add(createBox(1.8, 0.02, 0.8, 0x9e9e9e, 0, 0.02, 0.6, isNight));
        const f = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 8), new THREE.MeshStandardMaterial({color: 0xffffff}));
        f.position.set(1.2, 0.08, 0.6); lot.add(f);
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 8), new THREE.MeshStandardMaterial({color: 0x4fc3f7}));
        w.position.set(1.2, 0.14, 0.6); lot.add(w);
    }
};

export const renderResCondoMed = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean, season: string, activeEvent: EventType) => {
    const isV1 = variant === 1;
    const color = isV1 ? 0xffcc80 : 0xcfcfcf;
    const accent = isV1 ? 0xe65100 : 0x546e7a; 
    lot.add(createBox(1.6, 3.0, 1.0, color, 0, 1.5, 0, isNight));
    
    // Z-FIGHTING FIX: Faixa decorativa com profundidade aumentada de 1.05 para 1.08
    lot.add(createBox(0.4, 3.0, 1.08, accent, -0.5, 1.5, 0, isNight));
    
    for(let y=0.8; y<2.8; y+=0.6) {
        lot.add(createBox(0.6, 0.1, 0.3, 0xffffff, 0.4, y, 0.55, isNight)); 
        lot.add(createBox(0.6, 0.2, 0.02, 0x546e7a, 0.4, y+0.15, 0.71, isNight)); 
        lot.add(createBox(0.4, 0.4, 0.05, 0x81d4fa, 0.4, y+0.25, 0.5, isNight));
    }
    lot.add(createBox(0.8, 0.1, 0.5, 0x546e7a, 0, 0.4, 0.7, isNight));
    lot.add(createDoor(0.4, 0.4, 0, 0.2, 0.5, isNight, 0x81d4fa));
    addACUnit(lot, 3.0, isNight);
    decorateYard(lot, activeEvent, isNight, 2, 1);
    if (isRare) {
        lot.add(createBox(0.1, 1.5, 0.1, 0xeeeeee, 0.5, 3.75, 0, isNight));
        lot.add(createBox(0.5, 0.1, 0.1, 0xeeeeee, 0.5, 4.2, 0, isNight));
    }
};

export const renderResCondoHigh = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean, season: string, activeEvent: EventType) => {
    const isV1 = variant === 1;
    const glass = isV1 ? 0x80cbc4 : 0x90caf9;
    const frame = isV1 ? 0x37474f : 0x546e7a; 
    lot.add(createBox(1.8, 0.8, 1.2, frame, 0, 0.4, 0, isNight));
    lot.add(createBox(1.0, 0.6, 0.1, 0x81d4fa, 0, 0.3, 0.65, isNight)); 
    lot.add(createBox(1.2, 0.1, 0.6, frame, 0, 0.7, 0.6, isNight)); 
    
    // Z-FIGHTING FIX: Estruturas internas milimetricamente mais baixas que o topo
    // A altura original era 4.0, reduzida para 3.98
    lot.add(createBox(0.7, 3.98, 1.0, glass, -0.4, 2.39, 0, isNight));
    lot.add(createBox(0.7, 3.48, 1.0, glass, 0.4, 2.14, 0, isNight));
    
    lot.add(createBox(0.1, 3.98, 1.05, frame, -0.4, 2.39, 0, isNight));
    lot.add(createBox(0.1, 3.48, 1.05, frame, 0.4, 2.14, 0, isNight));
    
    for(let y=1.2; y<3.8; y+=0.8) {
        lot.add(createBox(0.5, 0.05, 0.2, 0xffffff, -0.4, y, 0.6, isNight));
        if(y < 3.2) lot.add(createBox(0.5, 0.05, 0.2, 0xffffff, 0.4, y, 0.6, isNight));
    }
    decorateYard(lot, activeEvent, isNight, 2, 1);
    if (isRare) {
        lot.add(createBox(0.8, 0.1, 0.8, 0x546e7a, -0.4, 4.45, 0, isNight));
        const H = createBox(0.4, 0.05, 0.4, 0xffeb3b, -0.4, 4.48, 0, isNight); lot.add(H);
    }
};

export const renderResSkyscraper = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean, season: string, activeEvent: EventType) => {
    const isRedGrey = variant === 1;
    if (isRedGrey) {
        const concrete = 0xeeeeee; const steel = 0xd32f2f; const darkGlass = 0x424242; 
        lot.add(createBox(3.5, 1.0, 3.5, concrete, 0, 0.5, 0, isNight));
        lot.add(createBox(3.0, 0.1, 3.0, steel, 0, 1.05, 0, isNight));
        const towerH = 7.0;
        lot.add(createBox(2.0, towerH, 2.0, concrete, 0, 1.0 + towerH/2, 0, isNight));
        lot.add(createBox(2.2, towerH, 1.5, concrete, 0, 1.0 + towerH/2, 0, isNight));
        lot.add(createBox(1.5, towerH, 2.2, concrete, 0, 1.0 + towerH/2, 0, isNight));
        for(let y = 1.5; y < 8.0; y += 1.5) {
            lot.add(createBox(2.3, 0.1, 1.6, steel, 0, y, 0, isNight));
            lot.add(createBox(1.6, 0.1, 2.3, steel, 0, y, 0, isNight));
        }
        lot.add(createBox(0.1, towerH, 0.1, steel, 1.15, 1.0 + towerH/2, 0.7, isNight));
        lot.add(createBox(0.1, towerH, 0.1, steel, -1.15, 1.0 + towerH/2, 0.7, isNight));
        lot.add(createBox(0.1, towerH, 0.1, steel, 1.15, 1.0 + towerH/2, -0.7, isNight));
        lot.add(createBox(0.1, towerH, 0.1, steel, -1.15, 1.0 + towerH/2, -0.7, isNight));
        lot.add(createBox(2.05, towerH - 0.5, 0.5, darkGlass, 0, 1.0 + towerH/2, 0, isNight));
        lot.add(createBox(0.5, towerH - 0.5, 2.05, darkGlass, 0, 1.0 + towerH/2, 0, isNight));
        lot.add(createBox(0.1, 2.0, 0.1, steel, 0, 8.5, 0, isNight));
        if (isNight) {
            const spriteMaterial = new THREE.SpriteMaterial({ map: getGlowTexture(), color: 0xff0000, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
            const glow = new THREE.Sprite(spriteMaterial); glow.scale.set(4, 4, 4); glow.position.set(0, 9.5, 0); lot.add(glow);
        }
    } else {
        const white = 0xffffff; const blueGlass = 0x81d4fa; const blueSolid = 0x0288d1; 
        lot.add(createBox(3.0, 0.8, 2.0, white, 0, 0.4, 0.5, isNight));
        lot.add(createBox(2.0, 0.5, 3.0, white, 0, 0.25, 0, isNight));
        const floors = 10; const floorH = 0.6;
        for(let i=0; i<floors; i++) {
            const y = 0.8 + (i * floorH) + (floorH/2); const w = 2.5 - (i * 0.1); const d = 1.5;
            lot.add(createBox(w, floorH - 0.05, d, blueGlass, 0, y, 0, isNight));
            lot.add(createBox(w + 0.2, 0.05, d + 0.2, white, 0, y - floorH/2, 0, isNight));
            if (i % 2 === 0) { lot.add(createBox(0.1, floorH, 0.8, blueSolid, w/2 + 0.05, y, 0, isNight)); } 
            else { lot.add(createBox(0.1, floorH, 0.8, blueSolid, -w/2 - 0.05, y, 0, isNight)); }
        }
        lot.add(createBox(1.5, 0.2, 1.0, white, 0, 0.8 + floors*floorH, 0, isNight));
    }
    decorateYard(lot, activeEvent, isNight, 2, 2);
    if (isRare) {
        const padY = isRedGrey ? 8.0 : 7.0; const padSize = 1.5;
        lot.add(createBox(padSize, 0.1, padSize, 0x424242, 0, padY, 0, isNight));
        lot.add(createBox(0.8, 0.05, 0.2, 0xffeb3b, 0, padY+0.05, 0, isNight));
        lot.add(createBox(0.2, 0.05, 0.8, 0xffeb3b, -0.3, padY+0.05, 0, isNight));
        lot.add(createBox(0.2, 0.05, 0.8, 0xffeb3b, 0.3, padY+0.05, 0, isNight));
    }
};
