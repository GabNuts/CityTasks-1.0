
import * as THREE from 'three';
import { createBox } from './cityHelpers';
import { createStylizedTree, createBench, createParkLamp, createRock, createBush } from './rendererHelpers';

export const renderParkPlaza = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean, season: string) => {
    // 1x1 Urban Plaza
    const baseColor = variant === 0 ? 0xd7ccc8 : 0x8d6e63; // Grey/Beige vs Reddish/Brown
    lot.add(createBox(1.9, 0.1, 1.9, baseColor, 0, 0.05, 0, isNight)); 
    
    if (variant === 0) {
        // --- VARIANT 0: CLASSIC CIRCULAR FOUNTAIN (SCALED DOWN) ---
        // Base reduzida para 0.4 de raio (antes 0.6)
        const fountainBase = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.2, 8), new THREE.MeshStandardMaterial({color: 0x8d6e63}));
        fountainBase.position.y = 0.15;
        lot.add(fountainBase);
        
        // Water
        const water = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 8), new THREE.MeshStandardMaterial({color: 0x29b6f6, transparent: true, opacity: 0.8}));
        water.position.y = 0.25;
        lot.add(water);
        
        // Spout
        lot.add(createBox(0.1, 0.4, 0.1, 0x5d4037, 0, 0.3, 0, isNight));

        // Stone Benches (Small and tucked in)
        lot.add(createBench(-0.7, -0.7, Math.PI/4, isNight, 'stone'));
        lot.add(createBench(0.7, 0.7, Math.PI/4 + Math.PI, isNight, 'stone'));
        
        // Classic Lamp (Corners)
        lot.add(createParkLamp(0.7, -0.7, isNight, 'classic'));
        lot.add(createParkLamp(-0.7, 0.7, isNight, 'classic'));

        // Add trees (Scaled up 50% from 0.6 -> 0.9)
        lot.add(createStylizedTree(0.75, 0, 0.9, 'round', isNight, season));
        lot.add(createStylizedTree(-0.75, 0, 0.9, 'round', isNight, season));
        lot.add(createStylizedTree(0, -0.75, 0.9, 'round', isNight, season)); // New Tree

    } else {
        // --- VARIANT 1: MODERN ABSTRACT PLAZA ---
        // Sculpture base
        lot.add(createBox(0.6, 0.2, 0.6, 0x424242, 0, 0.15, 0, isNight));
        
        // Abstract Art (Not too tall)
        const art = createBox(0.2, 0.8, 0.2, 0xef5350, 0, 0.6, 0, isNight);
        art.rotation.z = 0.2;
        art.rotation.x = 0.2;
        lot.add(art);

        // Wooden Benches (Parallel)
        lot.add(createBench(-0.7, 0, Math.PI/2, isNight, 'wood'));
        lot.add(createBench(0.7, 0, -Math.PI/2, isNight, 'wood'));

        // Modern Lamp
        lot.add(createParkLamp(0, -0.7, isNight, 'modern'));

        // Add trees (Scaled up 50% from 0.72 -> 1.08)
        lot.add(createStylizedTree(0.6, 0.6, 1.08, 'round', isNight, season));
        lot.add(createStylizedTree(-0.6, -0.6, 1.08, 'round', isNight, season)); // New Tree
    }

    if(isRare) {
         // RARE: Street Musician
         const musician = new THREE.Group();
         musician.position.set(0.4, 0.1, -0.4);
         musician.add(createBox(0.15, 0.4, 0.1, 0x3f51b5, 0, 0.2, 0, isNight)); 
         musician.add(createBox(0.1, 0.1, 0.1, 0xffcc80, 0, 0.45, 0, isNight)); 
         musician.add(createBox(0.3, 0.05, 0.2, 0x1a237e, 0.3, 0, 0.1, isNight));
         lot.add(musician);
    }
};

export const renderParkNature = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean, season: string) => {
    // 1x1 Dense Nature
    
    if (variant === 0) {
        // --- VARIANT 0: PINE FOREST (DARK) ---
        lot.add(createBox(1.9, 0.2, 1.9, 0x2e7d32, 0, 0.1, 0, isNight)); 

        const path = createBox(0.4, 0.02, 2.2, 0x5d4037, 0, 0.21, 0, isNight);
        path.rotation.y = Math.PI / 4;
        lot.add(path);

        // Scaled up 50%
        lot.add(createStylizedTree(-0.6, 0.6, 1.2, 'pine', isNight, season)); // 0.8 -> 1.2
        lot.add(createStylizedTree(0.7, -0.5, 0.9, 'pine', isNight, season)); // 0.6 -> 0.9
        lot.add(createStylizedTree(-0.5, -0.7, 1.05, 'pine', isNight, season)); // 0.7 -> 1.05

    } else {
        // --- VARIANT 1: ROCK GARDEN (LIGHT) ---
        lot.add(createBox(1.9, 0.2, 1.9, 0x81c784, 0, 0.1, 0, isNight)); 
        
        const pond = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 7), new THREE.MeshStandardMaterial({color: 0x4fc3f7, transparent:true, opacity:0.8}));
        pond.position.set(0.4, 0.11, 0.4);
        lot.add(pond);

        // Scaled up 50%
        lot.add(createStylizedTree(-0.7, 0.7, 0.9, 'round', isNight, season)); // 0.6 -> 0.9
        lot.add(createStylizedTree(0.6, -0.6, 1.05, 'round', isNight, season)); // 0.7 -> 1.05
        
        lot.add(createRock(0.2, 0.2, 1.5));
        lot.add(createRock(-0.2, -0.2, 1.0));
        lot.add(createRock(-0.6, 0.2, 0.8)); 
        
        lot.add(createBush(0.7, -0.7, 0.8, isNight));
        lot.add(createBush(-0.5, 0.5, 0.8, isNight)); 
        
        lot.add(createBox(0.2, 0.05, 0.2, 0xe91e63, 0.5, 0.1, -0.5, isNight));
    }

    if(isRare) {
        // RARE: Camping Tent
        const tent = new THREE.Mesh(
            new THREE.ConeGeometry(0.3, 0.4, 4), 
            new THREE.MeshStandardMaterial({color: 0xff5722})
        );
        tent.position.set(0.3, 0.4, 0.3);
        tent.rotation.y = Math.PI/4;
        lot.add(tent);
        
        lot.add(createBox(0.15, 0.05, 0.05, 0x5d4037, 0.6, 0.22, 0.6, isNight));
        lot.add(createBox(0.05, 0.05, 0.15, 0x5d4037, 0.6, 0.22, 0.6, isNight));
    }
};

export const renderParkSports = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean, season: string) => {
    // 2x1 Sports Complex
    // Concrete base (Y=0.05)
    lot.add(createBox(2.9, 0.1, 1.5, 0xeeeeee, 0, 0.05, 0, isNight));

    if (variant === 0) {
        // --- VARIANT 0: BASKETBALL ---
        const courtColor = 0x607d8b; // Asphalt
        lot.add(createBox(2.4, 0.05, 1.2, courtColor, 0, 0.1, 0, isNight));
        
        lot.add(createBox(0.5, 0.06, 0.6, 0xff7043, -0.9, 0.1, 0, isNight));
        lot.add(createBox(0.5, 0.06, 0.6, 0xff7043, 0.9, 0.1, 0, isNight));

        const hoopColor = 0x212121;
        lot.add(createBox(0.05, 0.6, 0.05, hoopColor, -1.25, 0.3, 0, isNight)); 
        lot.add(createBox(0.05, 0.25, 0.35, 0xffffff, -1.2, 0.55, 0, isNight)); 
        lot.add(createBox(0.12, 0.02, 0.12, 0xff5722, -1.13, 0.5, 0, isNight)); 

        lot.add(createBox(0.05, 0.6, 0.05, hoopColor, 1.25, 0.3, 0, isNight)); 
        lot.add(createBox(0.05, 0.25, 0.35, 0xffffff, 1.2, 0.55, 0, isNight)); 
        lot.add(createBox(0.12, 0.02, 0.12, 0xff5722, 1.13, 0.5, 0, isNight)); 

    } else {
        // --- VARIANT 1: TENNIS ---
        // Z-FIGHTING FIX: Adjusted heights
        // Base is 0.05 (top surface at 0.1)
        
        // Green surround (Slightly larger area, slightly higher than base)
        lot.add(createBox(2.8, 0.04, 1.4, 0x2e7d32, 0, 0.12, 0, isNight));

        // Clay Court (On top of green, smaller)
        const courtColor = 0xb71c1c; 
        lot.add(createBox(2.4, 0.04, 1.0, courtColor, 0, 0.14, 0, isNight));
        
        // Net
        const net = createBox(0.02, 0.3, 1.0, 0xffffff, 0, 0.25, 0, isNight);
        (net.material as THREE.MeshStandardMaterial).transparent = true;
        (net.material as THREE.MeshStandardMaterial).opacity = 0.5;
        lot.add(net);
        
        lot.add(createBox(0.05, 0.4, 0.05, 0x000000, 0, 0.2, 0.5, isNight));
        lot.add(createBox(0.05, 0.4, 0.05, 0x000000, 0, 0.2, -0.5, isNight));
    }

    lot.add(createBench(0, -0.65, 0, isNight, 'stone'));
    lot.add(createParkLamp(0, 0.65, isNight, 'modern'));

    // Scaled up 50%
    lot.add(createStylizedTree(-1.3, 0.6, 1.125, 'pine', isNight, season)); // 0.75 -> 1.125
    lot.add(createStylizedTree(1.3, 0.6, 1.125, 'pine', isNight, season)); // 0.75 -> 1.125

    if(isRare) {
        lot.add(createBox(0.2, 0.15, 0.15, 0xd32f2f, -0.5, 0.18, -0.6, isNight));
        lot.add(createBox(0.2, 0.05, 0.15, 0xffffff, -0.5, 0.28, -0.6, isNight));
    }
};

export const renderParkBotanical = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean, season: string) => {
    // 2x1 Greenhouse
    lot.add(createBox(2.8, 0.2, 1.4, 0x5d4037, 0, 0.1, 0, isNight)); 
    
    if (variant === 0) {
        // --- VARIANT 0: CLASSIC VICTORIAN ---
        const frameColor = 0x1b5e20;
        const glassColor = 0xa5d6a7;

        // Central Section
        lot.add(createBox(1.0, 1.2, 1.0, glassColor, 0, 0.7, 0, isNight));
        
        // Z-FIGHTING FIX: Pillars slightly larger/outset
        const pSize = 0.12; 
        lot.add(createBox(pSize, 1.2, pSize, frameColor, -0.45, 0.7, -0.45, isNight));
        lot.add(createBox(pSize, 1.2, pSize, frameColor, 0.45, 0.7, -0.45, isNight));
        lot.add(createBox(pSize, 1.2, pSize, frameColor, -0.45, 0.7, 0.45, isNight));
        lot.add(createBox(pSize, 1.2, pSize, frameColor, 0.45, 0.7, 0.45, isNight));
        
        const roof = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.5, 4), new THREE.MeshStandardMaterial({color: glassColor, transparent: true, opacity: 0.6}));
        roof.position.set(0, 1.55, 0);
        roof.rotation.y = Math.PI/4;
        lot.add(roof);

        // Wings
        lot.add(createBox(0.8, 0.8, 0.8, glassColor, -0.9, 0.5, 0, isNight));
        lot.add(createBox(0.85, 0.1, 0.85, frameColor, -0.9, 0.9, 0, isNight)); 
        
        lot.add(createBox(0.8, 0.8, 0.8, glassColor, 0.9, 0.5, 0, isNight));
        lot.add(createBox(0.85, 0.1, 0.85, frameColor, 0.9, 0.9, 0, isNight)); 

        // Scaled up 50%
        lot.add(createStylizedTree(0, 0, 0.6, 'round', isNight, season)); // 0.4 -> 0.6
        
        lot.add(createBush(1.1, 0.5, 0.6, isNight));
        lot.add(createBush(-1.1, 0.5, 0.6, isNight));
        lot.add(createBox(0.3, 0.1, 0.1, 0x5d4037, 0, 0.2, 0.6, isNight)); 
        lot.add(createBox(0.2, 0.2, 0.05, 0xffeb3b, 0, 0.3, 0.6, isNight)); 

    } else {
        // --- VARIANT 1: MODERN BIO-DOME ---
        const frameColor = 0xffffff;
        const glassColor = 0xe0f7fa;

        const domeGeo = new THREE.IcosahedronGeometry(0.8, 0);
        const dome = new THREE.Mesh(domeGeo, new THREE.MeshStandardMaterial({color: glassColor, transparent: true, opacity: 0.5, flatShading: true}));
        dome.position.set(0, 0.5, 0);
        dome.scale.set(1.5, 1, 1); 
        lot.add(dome);

        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.05, 8, 6), new THREE.MeshStandardMaterial({color: frameColor}));
        ring.rotation.x = Math.PI/2;
        ring.position.y = 0.5;
        lot.add(ring);

        lot.add(createBox(0.1, 0.4, 0.1, 0x43a047, -1.0, 0.4, 0.4, isNight));
        lot.add(createBox(0.1, 0.2, 0.1, 0x43a047, -1.0, 0.3, 0.5, isNight)); 
        lot.add(createBox(0.1, 0.6, 0.1, 0x43a047, 1.0, 0.5, -0.4, isNight));
        
        lot.add(createBox(0.15, 0.3, 0.15, 0x2e7d32, 0.8, 0.3, 0.5, isNight));
        lot.add(createRock(-0.8, -0.5, 0.8));
        lot.add(createRock(0.5, -0.5, 0.6));
    }
    
    if (isRare) {
        const flower = new THREE.Group();
        flower.position.set(0.8, 0.3, 0.5);
        flower.add(createBox(0.4, 0.05, 0.4, 0xb71c1c, 0, 0, 0, isNight));
        flower.add(createBox(0.15, 0.1, 0.15, 0xffeb3b, 0, 0.05, 0, isNight));
        lot.add(flower);
    }
};

export const renderParkCentral = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean, season: string) => {
    // 2x2 Large Park
    lot.add(createBox(3.8, 0.1, 3.8, 0x388e3c, 0, 0.05, 0, isNight)); // Base
    
    if (variant === 0) {
        // --- VARIANT 0: LARGE RECESSED LAKE ---
        
        // Raised banks to create depth feeling
        lot.add(createBox(3.8, 0.2, 1.0, 0x2e7d32, 0, 0.1, -1.4, isNight)); // Back bank
        lot.add(createBox(3.8, 0.2, 1.0, 0x2e7d32, 0, 0.1, 1.4, isNight)); // Front bank
        lot.add(createBox(0.8, 0.2, 1.8, 0x2e7d32, -1.5, 0.1, 0, isNight)); // Left bank
        lot.add(createBox(0.8, 0.2, 1.8, 0x2e7d32, 1.5, 0.1, 0, isNight)); // Right bank

        // The Water (Plane)
        const waterGeo = new THREE.PlaneGeometry(2.5, 2.0);
        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x03a9f4, 
            roughness: 0.1, 
            metalness: 0.8, 
            transparent: true, 
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        const lake = new THREE.Mesh(waterGeo, waterMat);
        lake.rotation.x = -Math.PI / 2;
        lake.position.y = 0.06;
        lot.add(lake);
        
        // Bridge
        const bridge = new THREE.Group();
        bridge.position.set(0, 0.2, 0);
        bridge.add(createBox(2.0, 0.05, 0.6, 0x8d6e63, 0, 0, 0, isNight));
        bridge.add(createBox(2.0, 0.05, 0.05, 0x5d4037, 0, 0.15, 0.25, isNight));
        bridge.add(createBox(2.0, 0.05, 0.05, 0x5d4037, 0, 0.15, -0.25, isNight));
        lot.add(bridge);

        // Scaled up 50%
        lot.add(createStylizedTree(-1.2, -1.2, 1.2, 'round', isNight, season)); // 0.8 -> 1.2
        lot.add(createStylizedTree(1.2, 1.2, 1.05, 'pine', isNight, season)); // 0.7 -> 1.05
        lot.add(createStylizedTree(-1.5, 1.5, 1.125, 'round', isNight, season)); // 0.75 -> 1.125
        lot.add(createStylizedTree(1.5, -1.5, 1.125, 'pine', isNight, season));
        lot.add(createStylizedTree(1.6, 0, 1.05, 'round', isNight, season)); // 0.7 -> 1.05
        lot.add(createStylizedTree(-1.6, 0, 1.05, 'round', isNight, season));
        lot.add(createStylizedTree(0, -1.6, 1.05, 'pine', isNight, season));

        // Ducks (Yellow boxes)
        lot.add(createBox(0.1, 0.05, 0.1, 0xffeb3b, -0.5, 0.08, 0.5, isNight));
        lot.add(createBox(0.1, 0.05, 0.1, 0xffeb3b, -0.7, 0.08, 0.4, isNight));

    } else {
        // --- VARIANT 1: GROVE & PATHS ---
        lot.add(createBox(3.0, 0.02, 0.6, 0x795548, 0, 0.11, 0, isNight));
        lot.add(createBox(0.6, 0.02, 3.0, 0x795548, 0, 0.11, 0, isNight));

        const gazebo = new THREE.Group();
        gazebo.position.y = 0.1;
        gazebo.add(createBox(1.0, 0.1, 1.0, 0x8d6e63, 0, 0, 0, isNight));
        const roof = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.4, 4), new THREE.MeshStandardMaterial({color: 0x5d4037}));
        roof.position.y = 1.0;
        roof.rotation.y = Math.PI/4;
        gazebo.add(roof);
        gazebo.add(createBox(0.05, 0.9, 0.05, 0xffffff, -0.4, 0.5, -0.4, isNight));
        gazebo.add(createBox(0.05, 0.9, 0.05, 0xffffff, 0.4, 0.5, -0.4, isNight));
        gazebo.add(createBox(0.05, 0.9, 0.05, 0xffffff, -0.4, 0.5, 0.4, isNight));
        gazebo.add(createBox(0.05, 0.9, 0.05, 0xffffff, 0.4, 0.5, 0.4, isNight));
        lot.add(gazebo);

        // Scaled up 50%
        lot.add(createStylizedTree(-1.2, -1.2, 1.05, 'round', isNight, season)); // 0.7 -> 1.05
        lot.add(createStylizedTree(1.2, -1.2, 1.05, 'round', isNight, season));
        lot.add(createStylizedTree(-1.2, 1.2, 1.05, 'round', isNight, season));
        lot.add(createStylizedTree(1.2, 1.2, 1.05, 'round', isNight, season));
    }
    
    lot.add(createParkLamp(1.5, 1.5, isNight, 'classic'));
    lot.add(createParkLamp(-1.5, -1.5, isNight, 'classic'));
};
