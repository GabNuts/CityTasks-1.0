
import * as THREE from 'three';
import { createBox, getSignMaterial, addACUnit } from './cityHelpers';
import { createDoor, createVehicle, createFlag, createGableRoof, createBush, createWindow, createFence } from './rendererHelpers';

export const renderGovPolice = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean) => {
    const isV1 = variant === 1;

    if (isV1) {
        const brick = 0x8d6e63; 
        const stone = 0xbdbdbd; 

        lot.add(createBox(2.6, 1.5, 2.0, brick, 0, 0.75, -0.5, isNight));
        
        // FIX: Rotate side windows 90 degrees (PI/2) and adjust X position to sit slightly outside the wall (-1.33)
        const w1 = createWindow(0.4, 0.5, -1.33, 1.0, 0, isNight);
        w1.rotation.y = -Math.PI / 2;
        lot.add(w1);
        
        const w2 = createWindow(0.4, 0.5, 1.33, 1.0, 0, isNight);
        w2.rotation.y = Math.PI / 2;
        lot.add(w2);

        lot.add(createBox(1.5, 0.3, 0.8, stone, 0, 0.15, 0.9, isNight));
        
        lot.add(createBox(0.2, 0.8, 0.2, stone, -0.5, 0.7, 0.9, isNight));
        lot.add(createBox(0.2, 0.8, 0.2, stone, 0.5, 0.7, 0.9, isNight));
        lot.add(createBox(1.5, 0.1, 0.8, stone, 0, 1.15, 0.9, isNight)); 
        
        lot.add(createDoor(0.4, 0.7, 0, 0.5, 0.51, isNight, 0x81d4fa));

        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), new THREE.MeshStandardMaterial({color: 0xffffff, emissive: 0xffffff, emissiveIntensity: isNight ? 1 : 0}));
        lamp.position.set(-0.5, 1.3, 0.9);
        lot.add(lamp.clone());
        lamp.position.set(0.5, 1.3, 0.9);
        lot.add(lamp);

    } else {
        const concrete = 0xf5f5f5; 
        const glass = 0x42a5f5; 

        lot.add(createBox(2.8, 1.2, 2.5, concrete, 0, 0.6, -0.5, isNight));
        lot.add(createBox(2.85, 0.3, 2.55, glass, 0, 0.8, -0.5, isNight));
        
        const tower = new THREE.Group();
        tower.position.set(0.8, 1.2, -1.0);
        tower.add(createBox(0.05, 1.5, 0.05, 0xbdbdbd, 0, 0.75, 0, isNight));
        tower.add(createBox(0.3, 0.05, 0.05, 0xbdbdbd, 0, 1.4, 0, isNight));
        lot.add(tower);

        lot.add(createDoor(0.6, 0.6, 0, 0.3, 0.76, isNight, 0x546e7a));

        const siren = createBox(0.4, 0.2, 0.4, 0x0d47a1, -0.8, 1.3, 0.5, isNight);
        if(isNight) (siren.material as THREE.MeshStandardMaterial).emissive.setHex(0x0d47a1);
        lot.add(siren);
    }
    
    const sign = getSignMaterial('police_' + variant, '#0d47a1', 'POLICIA');
    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.4), sign);
    signMesh.position.set(0, 1.0, isV1 ? 1.31 : 0.8);
    lot.add(signMesh);

    if (isRare) {
        const truck = createVehicle('police', 1.2, 1.2, -0.3, isNight);
        lot.add(truck);
    }
};

export const renderGovFire = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean) => {
    const isV1 = variant === 1;

    const truck = createVehicle('fire', 1.3, 1.3, -Math.PI/4, isNight);
    lot.add(truck);

    for(let i=0; i<5; i++) {
        // FIX: Raise Y coordinate to 0.06 to avoid Z-fighting with ground (0.05)
        lot.add(createBox(0.4, 0.02, 0.1, 0xffeb3b, 0.5 + (i*0.2), 0.06, 1.0, isNight)); 
        lot.add(createBox(0.4, 0.02, 0.1, 0x212121, 0.5 + (i*0.2) + 0.1, 0.06, 1.0, isNight)); 
    }

    if (isV1) {
        const brick = 0xb71c1c;
        const stone = 0xeeeeee;

        lot.add(createBox(2.5, 1.5, 2.5, brick, -0.5, 0.75, -0.2, isNight));
        
        const tX = 1.2; const tZ = -0.8;
        lot.add(createBox(0.8, 3.5, 0.8, brick, tX, 1.75, tZ, isNight));
        
        // Fixed syntax error: removed extra closing parenthesis
        const winFrame = createBox(0.4, 0.4, 0.1, stone, tX, 2.5, tZ+0.41, isNight); 
        winFrame.rotation.z = Math.PI / 4; 
        lot.add(winFrame);
        
        // Fixed syntax error: removed extra closing parenthesis
        const vertWindow = createBox(0.2, 0.6, 0.05, 0x81d4fa, tX, 1.5, tZ+0.42, isNight);
        vertWindow.rotation.z = Math.PI / 2; 
        lot.add(vertWindow);

        lot.add(createBox(0.4, 0.6, 0.1, 0x333333, tX, 0.8, tZ+0.4, isNight));

        for(let z of [-0.6, 0.6]) {
             const doorX = 0.75; 
             lot.add(createBox(0.2, 1.0, 0.2, stone, doorX + 0.05, 0.5, z - 0.75, isNight));
             lot.add(createBox(0.2, 1.0, 0.2, stone, doorX + 0.05, 0.5, z + 0.35, isNight));
             lot.add(createBox(0.2, 0.3, 1.3, stone, doorX + 0.05, 1.15, z - 0.2, isNight));
             lot.add(createBox(0.1, 1.0, 1.0, 0x616161, doorX - 0.05, 0.5, z - 0.2, isNight)); 
             lot.add(createBox(0.11, 0.2, 0.8, 0x81d4fa, doorX, 0.7, z - 0.2, isNight)); 
        }
        
        // Fixed syntax error: removed extra closing parenthesis
        const siren1 = createBox(0.2, 0.2, 0.2, 0xff0000, -1.0, 1.6, 0.5, isNight);
        if(isNight) (siren1.material as THREE.MeshStandardMaterial).emissive.setHex(0xff0000);
        lot.add(siren1);
        addACUnit(lot, 1.5, isNight);

    } else {
        const metal = 0xe0e0e0; 
        const redAccent = 0xd32f2f;

        lot.add(createBox(3.5, 1.2, 1.2, metal, 0, 0.6, -1.0, isNight));
        lot.add(createBox(1.2, 1.2, 2.0, metal, -1.15, 0.6, 0.0, isNight));
        
        // Garage Doors
        lot.add(createBox(0.1, 1.0, 1.5, 0x81d4fa, -0.54, 0.5, 0.2, isNight));
        lot.add(createBox(0.12, 1.0, 0.1, 0x333333, -0.54, 0.5, 0.2, isNight));
        
        lot.add(createBox(3.6, 0.2, 1.3, redAccent, 0, 1.2, -1.0, isNight));
        lot.add(createBox(1.3, 0.2, 2.1, redAccent, -1.15, 1.2, 0.0, isNight));

        const rackX = 1.0; const rackZ = -1.0;
        lot.add(createBox(0.1, 1.5, 0.1, 0x616161, rackX, 0.75, rackZ - 0.3, isNight));
        lot.add(createBox(0.1, 1.5, 0.1, 0x616161, rackX, 0.75, rackZ + 0.3, isNight));
        lot.add(createBox(0.1, 0.1, 0.7, 0x616161, rackX, 1.4, rackZ, isNight));

        // Fixed syntax error: removed extra closing parenthesis
        const siren = createBox(0.3, 0.3, 0.3, 0xff0000, -1.15, 1.4, 0.5, isNight);
        if(isNight) (siren.material as THREE.MeshStandardMaterial).emissive.setHex(0xff0000);
        lot.add(siren);
        
        addACUnit(lot, 1.3, isNight);
    }

    const flag = createFlag(-1.5, 1.5, isNight);
    lot.add(flag);
};

export const renderGovSchool = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean) => {
    const isV1 = variant === 1;

    const playX = 1.2; const playZ = 1.2;
    lot.add(createBox(0.1, 0.8, 0.1, 0xffeb3b, playX, 0.4, playZ, isNight)); 
    lot.add(createBox(0.6, 0.1, 0.2, 0x2196f3, playX - 0.3, 0.2, playZ, isNight));
    (lot.children[lot.children.length-1] as THREE.Mesh).rotation.z = 0.5;
    
    lot.add(createBox(1.5, 0.05, 1.0, 0x4caf50, -1.0, 0.05, 1.0, isNight));
    lot.add(createBox(1.4, 0.05, 0.9, 0xffffff, -1.0, 0.06, 1.0, isNight)); 
    lot.add(createBox(1.3, 0.05, 0.8, 0x4caf50, -1.0, 0.07, 1.0, isNight)); 

    if (isV1) {
        const wall = 0xf5f5f5;
        const yellow = 0xfbc02d;

        lot.add(createBox(3.0, 1.0, 1.5, wall, 0, 0.5, -0.8, isNight)); 
        lot.add(createBox(1.5, 1.5, 1.5, yellow, -0.8, 0.75, 0.0, isNight)); 
        
        lot.add(createWindow(0.5, 0.5, 0.5, 0.6, -0.04, isNight));
        lot.add(createWindow(0.5, 0.5, 1.2, 0.6, -0.04, isNight));
        
        const panel = createBox(2.0, 0.05, 1.0, 0x1565c0, 0.5, 1.05, -0.8, isNight, true);
        panel.rotation.x = 0.1;
        lot.add(panel);

    } else {
        const brick = 0xbf360c;
        
        lot.add(createBox(3.5, 1.0, 1.2, brick, 0, 0.5, -1.0, isNight)); 
        lot.add(createGableRoof(3.6, 1.2, 0.6, 0x3e2723, 0, 1.0, -1.0, isNight));

        lot.add(createBox(1.0, 2.0, 1.0, brick, 0, 1.0, -0.5, isNight));
        // Fixed syntax error: removed extra closing parenthesis
        const clock = createBox(0.6, 0.6, 0.05, 0xffffff, 0, 1.6, -0.0, isNight); 
        lot.add(clock);
        // Fixed syntax error: removed extra closing parenthesis
        lot.add(createBox(0.05, 0.25, 0.06, 0x000000, 0, 1.65, -0.0, isNight)); 
        
        lot.add(createWindow(0.4, 0.5, -1.2, 0.6, -0.39, isNight));
        lot.add(createWindow(0.4, 0.5, 1.2, 0.6, -0.39, isNight));
    }

    const flag = createFlag(0.8, 0.8, isNight);
    lot.add(flag);

    lot.add(createFence(3.8, 1.8, 0, 1.0, isNight)); 

    if (isRare) {
        const bus = createVehicle('bus', -0.5, 1.8, -0.2, isNight); 
        lot.add(bus);
    }
};

export const renderGovClinic = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean) => {
    const isV1 = variant === 1;

    if (isV1) {
        const brick = 0x8d6e63;
        const roof = 0x3e2723;

        lot.add(createBox(3.0, 0.8, 1.0, brick, 0, 0.4, -0.5, isNight)); 
        lot.add(createBox(1.0, 0.8, 2.0, brick, -1.0, 0.4, 0, isNight)); 
        lot.add(createBox(1.0, 0.8, 2.0, brick, 1.0, 0.4, 0, isNight)); 
        
        lot.add(createWindow(0.4, 0.4, -1.0, 0.5, 1.01, isNight));
        lot.add(createWindow(0.4, 0.4, 1.0, 0.5, 1.01, isNight));

        lot.add(createGableRoof(3.1, 0.8, 0.5, roof, 0, 0.8, -0.5, isNight)); 
        lot.add(createGableRoof(1.1, 2.1, 0.5, roof, -1.0, 0.8, 0, isNight));
        lot.add(createGableRoof(1.1, 2.1, 0.5, roof, 1.0, 0.8, 0, isNight));
        
        lot.add(createBush(0, 0.5, 0.8, isNight));

    } else {
        const white = 0xf5f5f5; 
        const concrete = 0xeeeeee; 

        lot.add(createBox(3.0, 1.5, 1.5, white, 0, 0.75, -0.5, isNight));
        lot.add(createBox(1.2, 1.0, 1.5, white, -0.9, 0.5, 0.5, isNight));
        
        lot.add(createWindow(0.5, 0.5, 0.0, 1.0, 0.26, isNight));
        lot.add(createWindow(0.5, 0.5, 0.8, 1.0, 0.26, isNight));
        
        lot.add(createBox(1.2, 0.1, 1.2, white, 0.8, 0.6, 0.5, isNight));
        lot.add(createBox(0.1, 0.6, 0.1, 0xbdbdbd, 1.3, 0.3, 1.0, isNight)); 
        
        const cGroup = new THREE.Group();
        cGroup.position.set(-0.9, 1.2, 1.26);
        cGroup.add(createBox(0.6, 0.2, 0.1, 0xff0000, 0, 0, 0, isNight));
        cGroup.add(createBox(0.2, 0.6, 0.1, 0xff0000, 0, 0, 0, isNight));
        if(isNight) {
            (cGroup.children[0] as THREE.Mesh).material = new THREE.MeshStandardMaterial({color: 0xff0000, emissive: 0xff0000});
            (cGroup.children[1] as THREE.Mesh).material = new THREE.MeshStandardMaterial({color: 0xff0000, emissive: 0xff0000});
        }
        lot.add(cGroup);
    }

    if (isRare) {
        const amb = createVehicle('ambulance', 0, 1.2, 0.3, isNight);
        lot.add(amb);
    }
};
