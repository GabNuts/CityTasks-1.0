
import * as THREE from 'three';
import { createBox, addACUnit, getIndustrialSignTexture, IndSignType, getTextSignTexture, getCocaColaLogoTexture, getNikeLogoTexture, getAppleLogoTexture, getFordLogoTexture, getNVidiaLogoTexture, getGlowTexture } from './cityHelpers';
import { createGableRoof, createWindow, createDoor, createBush, createVehicle, createFence, createStylizedTree } from './rendererHelpers';

// Helper: Create Industrial Sign (Variação de Formato e Texto)
const addIndSign = (lot: THREE.Group, type: IndSignType, x: number, y: number, z: number, rotationY: number, bgColor: string, scale: number = 0.4, useText: boolean = false, textLabel: string = "FACTORY") => {
    let signGeo: THREE.BufferGeometry;
    let signMat: THREE.MeshStandardMaterial; 

    const isCircle = !useText && Math.random() > 0.5;

    if (isCircle) {
        signGeo = new THREE.CircleGeometry(scale / 1.5, 32);
    } else {
        signGeo = new THREE.PlaneGeometry(useText ? scale * 2 : scale, scale);
    }

    if (useText) {
        signMat = new THREE.MeshStandardMaterial({
            map: getTextSignTexture(textLabel, bgColor),
            side: THREE.DoubleSide,
            roughness: 0.5,
            metalness: 0.1
        });
    } else {
        signMat = new THREE.MeshStandardMaterial({
            map: getIndustrialSignTexture(type, bgColor),
            side: THREE.DoubleSide,
            roughness: 0.5,
            metalness: 0.1
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

// --- LEVEL 1: WORKSHOP (2x1) ---
export const renderIndWorkshop = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean, season: string) => {
    const isMechanic = variant === 1; 
    const wallColor = isMechanic ? 0xb0bec5 : 0x8d6e63;
    const roofColor = isMechanic ? 0x546e7a : 0x4e342e;
    const doorColor = isMechanic ? 0x37474f : 0x3e2723;
    const signType: IndSignType = isMechanic ? 'gear' : 'hammer';
    const signBg = isMechanic ? '#37474f' : '#5d4037';

    lot.add(createBox(1.9, 0.8, 0.9, wallColor, 0, 0.4, 0, isNight));
    
    const roof = createBox(2.0, 0.1, 1.1, roofColor, 0, 0.85, 0, isNight);
    roof.rotation.x = 0.1;
    lot.add(roof);
    
    lot.add(createWindow(1.0, 0.5, -0.4, 0.5, 0.46, isNight));
    lot.add(createDoor(0.4, 0.6, 0.6, 0.3, 0.46, isNight, doorColor));
    
    addIndSign(lot, signType, 0.6, 0.8, 0.47, 0, signBg, 0.3, false); 

    if (isMechanic) {
        const tireGeo = new THREE.TorusGeometry(0.1, 0.05, 6, 12);
        const tireMat = new THREE.MeshStandardMaterial({color: 0x111111});
        for(let i=0; i<3; i++) {
            const tire = new THREE.Mesh(tireGeo, tireMat);
            tire.rotation.x = Math.PI/2;
            tire.position.set(-1.2, 0.05 + (i*0.1), 0.7);
            lot.add(tire);
        }
        const jack = new THREE.Group();
        jack.position.set(1.3, 0.2, 0); 
        jack.add(createBox(0.6, 0.2, 0.4, 0x1976d2, 0, 0.3, 0, isNight));
        jack.add(createBox(0.4, 0.15, 0.35, 0x1976d2, 0, 0.5, 0, isNight));
        jack.add(createBox(0.1, 0.2, 0.1, 0x333333, -0.2, 0.1, 0.1, isNight));
        jack.add(createBox(0.1, 0.2, 0.1, 0x333333, 0.2, 0.1, -0.1, isNight));
        lot.add(jack);
    } else {
        lot.add(createBox(0.4, 0.4, 0.2, 0x8d6e63, -1.2, 0.2, 0.6, isNight));
        lot.add(createBox(0.5, 0.3, 0.3, 0x5d4037, 1.3, 0.15, 0.2, isNight));
        lot.add(createBox(0.1, 0.05, 0.1, 0x9e9e9e, 1.2, 0.32, 0.2, isNight));
    }

    if (isRare) {
        const armGroup = new THREE.Group();
        armGroup.position.set(1.2, 0, 0.6); 
        armGroup.add(createBox(0.3, 0.4, 0.3, 0x424242, 0, 0.2, 0, isNight)); 
        const armSeg1 = createBox(0.1, 0.6, 0.1, 0xffeb3b, 0, 0.6, 0, isNight);
        armSeg1.rotation.z = -0.2;
        armGroup.add(armSeg1);
        const armSeg2 = createBox(0.4, 0.1, 0.1, 0xffeb3b, 0.2, 0.8, 0, isNight);
        armGroup.add(armSeg2);
        lot.add(armGroup);
    }
};

// --- LEVEL 1: MANUFACTURING PLANT (2x1) ---
export const renderIndTextile = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean, season: string) => {
    // 2x1 Sawtooth Roof Factory
    const isFurniture = variant === 1;
    const wallColor = isFurniture ? 0xd7ccc8 : 0xf5f5f5;
    const roofColor = isFurniture ? 0x3e2723 : 0x5d4037;
    const accentColor = isFurniture ? 0x8d6e63 : 0x1976d2;
    const signType: IndSignType = isFurniture ? 'chair' : 'spool';
    const signBg = isFurniture ? '#5d4037' : '#0277bd';

    // FIX: Base dimensions slightly smaller to avoid overlap
    lot.add(createBox(1.95, 1.0, 0.95, wallColor, 0, 0.5, 0, isNight));
    
    // Sawtooth Roof - FIX: Adjust position
    const roof = new THREE.Group();
    roof.position.y = 1.0;
    for(let i=-0.8; i<0.9; i+=0.4) {
        const saw = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.95, 4), new THREE.MeshStandardMaterial({color: roofColor}));
        saw.rotation.z = Math.PI/4; saw.rotation.y = Math.PI/4; saw.position.x = i;
        roof.add(saw);
        // Glass skylight (Z-Fighting Fix: Move slightly up)
        const glass = createBox(0.05, 0.25, 0.8, 0x81d4fa, i + 0.15, 0.12, 0, isNight, true);
        glass.rotation.z = -Math.PI/4;
        roof.add(glass);
    }
    lot.add(roof);
    
    // Loading Dock area - FIX: Move slightly out
    lot.add(createBox(0.8, 0.1, 0.5, 0x757575, 0, 0.1, 0.65, isNight));
    lot.add(createBox(0.6, 0.6, 0.05, accentColor, 0, 0.3, 0.48, isNight)); 
    
    addIndSign(lot, signType, 1.2, 0.7, 0.48, 0, signBg, 0.3, isFurniture, isFurniture ? "MOVEIS" : "TEXTIL");

    lot.add(createBox(0.2, 1.0, 0.2, 0x424242, -0.8, 0.5, -0.5, isNight));
    
    if (!isFurniture) {
        const rollGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.4, 16);
        const rollMat1 = new THREE.MeshStandardMaterial({color: 0xe91e63});
        const rollMat2 = new THREE.MeshStandardMaterial({color: 0x00bcd4});
        const r1 = new THREE.Mesh(rollGeo, rollMat1);
        r1.rotation.z = Math.PI/2; r1.position.set(-1.2, 0.1, 0.5); lot.add(r1);
        const r2 = new THREE.Mesh(rollGeo, rollMat2);
        r2.rotation.z = Math.PI/2; r2.position.set(-1.2, 0.1, 0.8); lot.add(r2);
    } else {
        lot.add(createBox(0.4, 0.1, 0.4, 0x8d6e63, -1.2, 0.05, 0.6, isNight));
    }

    if (isRare) {
        const forklift = new THREE.Group();
        forklift.position.set(-1.2, 0.15, 0.6); 
        if (!isFurniture) forklift.position.z = 0.2; 
        forklift.add(createBox(0.4, 0.3, 0.6, 0xffeb3b, 0, 0.15, 0, isNight)); 
        forklift.add(createBox(0.05, 0.5, 0.05, 0x212121, 0.2, 0.25, 0.3, isNight)); 
        forklift.add(createBox(0.3, 0.3, 0.3, 0x8d6e63, 0.2, 0.2, 0.5, isNight));
        lot.add(forklift);
    }
};

// --- LEVEL 2: PRECISION FACTORY (2x1) ---
export const renderIndClean = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean, season: string) => {
    // 2x1 Modern Clean Facility
    const isElectronics = variant === 1;
    const wallColor = 0xf5f5f5; 
    const stripeColor = isElectronics ? 0x0277bd : 0xff9800;
    const glassColor = 0x81d4fa;
    const signType: IndSignType = isElectronics ? 'chip' : 'leaf';
    const signBg = isElectronics ? '#01579b' : '#33691e';

    lot.add(createBox(1.9, 1.2, 0.9, wallColor, 0, 0.6, 0, isNight));
    // Stripe FIX: Slightly larger to avoid Z-fight
    lot.add(createBox(1.95, 0.1, 0.95, stripeColor, 0, 1.1, 0, isNight));

    lot.add(createBox(0.6, 0.8, 0.1, glassColor, -0.6, 0.5, 0.46, isNight));
    
    const siloGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.2, 16);
    const siloMat = new THREE.MeshStandardMaterial({color: 0xcfcfcf, metalness: 0.6, roughness: 0.2});
    const s1 = new THREE.Mesh(siloGeo, siloMat); s1.position.set(1.2, 0.6, -0.2); lot.add(s1);
    const s2 = new THREE.Mesh(siloGeo, siloMat); s2.position.set(1.5, 0.6, 0.1); lot.add(s2);
    
    lot.add(createBox(0.3, 0.05, 0.05, 0x9e9e9e, 1.35, 1.0, -0.05, isNight));
    addACUnit(lot, 1.2, isNight);
    addIndSign(lot, signType, 0.5, 0.8, 0.46, 0, signBg, 0.25, true, isElectronics ? "TECH" : "BIO-FOOD");

    // Piping FIX: Offset from wall
    lot.add(createBox(1.0, 0.05, 0.05, 0x757575, 0, 0.3, 0.48, isNight));
    lot.add(createBox(0.05, 0.8, 0.05, 0x757575, 0.5, 0.7, 0.48, isNight));

    if (isRare) {
        const filterGroup = new THREE.Group();
        filterGroup.position.set(-1.2, 0, 0); 
        filterGroup.add(createBox(0.5, 0.5, 0.5, 0x616161, 0, 0.25, 0, isNight));
        filterGroup.add(createBox(0.4, 0.1, 0.1, 0x9e9e9e, 0.4, 0.4, 0, isNight));
        const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.2, 8), new THREE.MeshStandardMaterial({color: 0xeeeeee}));
        vent.position.y = 0.6;
        filterGroup.add(vent);
        lot.add(filterGroup);
    }
};

// --- LEVEL 2: LOGISTICS CENTER (2x2) ---
export const renderIndLogistics = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean, season: string) => {
    // 2x2 Warehouse / Data Center
    const isDataCenter = variant === 1; 
    const wallColor = isDataCenter ? 0xcfd8dc : 0xd7ccc8; 
    const accentColor = isDataCenter ? 0x00b0ff : 0xffeb3b;
    const signType: IndSignType = isDataCenter ? 'cloud' : 'box';
    const signBg = isDataCenter ? '#01579b' : '#fbc02d';

    if (isDataCenter) {
        lot.add(createBox(3.5, 1.2, 2.5, wallColor, 0, 0.6, -0.5, isNight));
        
        // Security Annex FIX: Separate mesh
        lot.add(createBox(1.0, 0.8, 1.0, 0xb0bec5, 1.2, 0.4, 1.0, isNight));
        lot.add(createDoor(0.4, 0.6, 1.2, 0.3, 1.51, isNight, 0x455a64)); 
        
        lot.add(createWindow(0.4, 0.4, 1.2, 0.5, 1.51, isNight));
        
        const frameColor = 0x546e7a;
        [-1.0, 0, 1.0].forEach(x => {
            lot.add(createBox(0.5, 0.5, 0.05, frameColor, x, 0.8, 0.76, isNight));
            // Dark Glass
            lot.add(createBox(0.4, 0.4, 0.06, 0x263238, x, 0.8, 0.76, isNight));
            if (isNight) {
                const led = createBox(0.05, 0.05, 0.07, 0x00e5ff, x, 0.9, 0.76, isNight);
                (led.material as THREE.MeshStandardMaterial).emissive.setHex(0x00e5ff);
                lot.add(led);
            }
        });

        // Accent Stripe FIX: Slightly wider and taller to avoid Z-fight with main block
        lot.add(createBox(3.55, 0.05, 2.55, accentColor, 0, 1.15, -0.5, isNight));

        for(let x=-1.2; x<=0.5; x+=0.8) {
            const fanBox = createBox(0.6, 0.3, 0.6, 0x78909c, x, 1.35, -0.5, isNight);
            lot.add(fanBox);
            const blade = createBox(0.4, 0.02, 0.4, 0x263238, x, 1.51, -0.5, isNight);
            lot.add(blade);
        }

        lot.add(createBox(0.1, 1.0, 0.1, 0x90a4ae, -1.7, 0.5, 0.5, isNight));
        lot.add(createBox(0.1, 1.0, 0.1, 0x90a4ae, -1.6, 0.5, 0.5, isNight));

        lot.add(createBox(3.0, 0.02, 0.1, 0xffeb3b, 0, 0.05, 1.0, isNight));
        lot.add(createBox(0.1, 0.02, 1.0, 0xffeb3b, -1.5, 0.05, 1.0, isNight)); 

        addIndSign(lot, signType, 1.2, 0.9, 1.51, 0, signBg, 0.4, true, "DATA");

    } else {
        lot.add(createBox(3.5, 1.2, 2.5, wallColor, 0, 0.6, -0.5, isNight));
        lot.add(createBox(3.6, 0.05, 2.6, accentColor, 0, 1.1, -0.5, isNight));
        
        for(let x=-1.0; x<=1.0; x+=1.0) {
            lot.add(createBox(0.7, 0.7, 0.1, 0x424242, x, 0.35, 0.8, isNight)); 
            lot.add(createBox(0.6, 0.6, 0.12, 0xffffff, x, 0.3, 0.8, isNight)); 
            lot.add(createBox(0.6, 0.05, 1.0, 0x9e9e9e, x, 0.05, 1.3, isNight)); 
        }
        addIndSign(lot, signType, 1.5, 1.0, 0.81, 0, signBg, 0.4, false); 
    }
    
    if (isRare) {
        const truckGroup = new THREE.Group();
        truckGroup.position.set(-1.2, 0.15, 1.8);
        truckGroup.rotation.y = -0.3;
        truckGroup.add(createBox(0.6, 0.6, 1.4, 0xeeeeee, 0, 0.45, 0, isNight)); 
        truckGroup.add(createBox(0.6, 0.5, 0.4, 0xef5350, 0, 0.4, 0.9, isNight));
        truckGroup.add(createBox(0.5, 0.2, 0.05, 0x81d4fa, 0, 0.5, 1.11, isNight)); 
        truckGroup.add(createBox(0.65, 0.2, 0.2, 0x212121, 0, 0.1, 0.7, isNight));
        truckGroup.add(createBox(0.65, 0.2, 0.2, 0x212121, 0, 0.1, -0.4, isNight));
        lot.add(truckGroup);
    } 
};

// --- LEVEL 3: INNOVATION CAMPUS (2x2) ---
export const renderIndHighTech = (lot: THREE.Group, variant: number, isRare: boolean, isNight: boolean, season: string) => {
    // 2x2 Hangar Style Lab
    const isAero = variant === 1;
    const shellColor = isAero ? 0xd7d7d7 : 0xffffff; 
    const stripeColor = isAero ? 0xff6d00 : 0x00c853; 
    const floorColor = 0xeeeeee;
    const signType: IndSignType = isAero ? 'rocket' : 'dna';
    const signBg = isAero ? '#212121' : '#1b5e20';

    const hangar = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 3.5, 32, 1, false, 0, Math.PI),
        new THREE.MeshStandardMaterial({color: shellColor, metalness: 0.3, roughness: 0.4})
    );
    hangar.rotation.z = Math.PI/2; hangar.position.set(0, 0, -0.5);
    lot.add(hangar);
    
    lot.add(createBox(3.5, 0.1, 3.0, floorColor, 0, 0.05, -0.5, isNight));
    
    // Stripe FIX: Offset Y
    lot.add(createBox(3.6, 0.1, 0.2, stripeColor, 0, 1.52, -0.5, isNight));
    
    // Side Office Annex (Lighter Grey) FIX: Z position to avoid fighting with hangar
    lot.add(createBox(2.5, 0.8, 1.0, 0xbdbdbd, 0, 0.4, 1.25, isNight));
    lot.add(createWindow(2.0, 0.4, 0, 0.5, 1.76, isNight));
    
    addIndSign(lot, signType, 1.0, 1.0, 1.76, 0, signBg, 0.4, false);

    if (isRare) {
        const coreGroup = new THREE.Group();
        coreGroup.position.set(1.0, 0.5, 0.5); 
        coreGroup.add(createBox(0.6, 0.2, 0.6, 0x616161, 0, 0, 0, isNight));
        const orb = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 16, 16),
            new THREE.MeshStandardMaterial({
                color: 0x00e5ff, 
                emissive: 0x00e5ff, 
                emissiveIntensity: isNight ? 2.0 : 0.8,
                transparent: true,
                opacity: 0.9
            })
        );
        orb.position.y = 0.4;
        coreGroup.add(orb);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.02, 8, 16), new THREE.MeshStandardMaterial({color: 0xffffff}));
        ring.position.y = 0.4;
        coreGroup.add(ring);
        lot.add(coreGroup);
    }
};

// --- SPECIAL INDUSTRIAL (BRANDED) ---

// 1. Coca-Cola Factory (2x2)
export const renderIndCocaCola = (lot: THREE.Group, isNight: boolean) => {
    const red = 0xf40009;
    const white = 0xffffff;
    const grey = 0xe0e0e0;

    lot.add(createBox(3.5, 1.2, 2.5, red, 0, 0.6, -0.5, isNight));
    lot.add(createBox(3.6, 0.1, 2.6, white, 0, 1.1, -0.5, isNight));

    const tankGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 16);
    const tankMat = new THREE.MeshStandardMaterial({color: 0xcccccc, metalness: 0.5});
    const t1 = new THREE.Mesh(tankGeo, tankMat); t1.position.set(1.5, 0.75, 1.2); lot.add(t1);
    const t2 = new THREE.Mesh(tankGeo, tankMat); t2.position.set(0.4, 0.75, 1.2); lot.add(t2);
    
    lot.add(createBox(1.2, 0.1, 0.1, 0x999999, 0.95, 1.3, 1.2, isNight)); 
    lot.add(createBox(0.1, 0.5, 0.1, 0x999999, 0.4, 1.0, 0.8, isNight)); 

    lot.add(createBox(1.5, 0.6, 0.8, grey, -1.2, 0.3, 1.0, isNight));
    lot.add(createBox(1.2, 0.4, 0.05, 0x333333, -1.2, 0.2, 1.41, isNight)); 

    addCustomLogoSign(lot, getCocaColaLogoTexture(), 0, 1.5, 0.81, 1.5, 0.75, 0, isNight);

    lot.add(createWindow(2.0, 0.5, 0, 0.5, 0.76, isNight));
    if (isNight) {
        const bottles = new THREE.Points(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-0.8, 0.3, 0.7), new THREE.Vector3(-0.4, 0.3, 0.7),
                new THREE.Vector3(0, 0.3, 0.7), new THREE.Vector3(0.4, 0.3, 0.7)
            ]),
            new THREE.PointsMaterial({color: 0x000000, size: 0.1})
        );
        lot.add(bottles);
    }
};

// 2. Nike Factory (2x2)
export const renderIndNike = (lot: THREE.Group, isNight: boolean) => {
    const black = 0x111111;
    const orange = 0xff5722;

    lot.add(createBox(3.0, 1.5, 2.5, black, 0, 0.75, 0, isNight));
    
    lot.add(createBox(2.8, 0.05, 2.3, 0x333333, 0, 1.55, 0, isNight));
    const track = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.2, 32), new THREE.MeshStandardMaterial({color: orange}));
    track.rotation.x = -Math.PI/2;
    track.position.y = 1.56;
    lot.add(track);

    lot.add(createBox(1.5, 1.0, 0.5, 0x81d4fa, 0, 0.5, 1.3, isNight)); 
    lot.add(createDoor(0.6, 0.8, 0, 0.4, 1.56, isNight, 0x000000));

    const boxGroup = new THREE.Group();
    boxGroup.position.set(-1.2, 0.4, 1.2);
    boxGroup.add(createBox(0.8, 0.4, 0.5, orange, 0, 0, 0, isNight));
    boxGroup.rotation.y = 0.3;
    lot.add(boxGroup);

    // FIX: Backlit Lightbox style to prevent Z-Fighting and improve visibility
    const signBox = createBox(1.1, 0.6, 0.1, 0x000000, 1.0, 1.0, 1.26, isNight);
    lot.add(signBox);
    addCustomLogoSign(lot, getNikeLogoTexture(), 1.0, 1.0, 1.32, 1.0, 0.5, 0, isNight, 0xffffff);
};

// 3. Apple Factory (2x2) - REDESIGNED: APPLE PARK STYLE
export const renderIndApple = (lot: THREE.Group, isNight: boolean, season: string) => {
    const white = 0xf5f5f5;
    const glass = 0x81d4fa;
    const silver = 0xc0c0c0;

    // --- APPLE PARK RING ---
    const radius = 1.6;
    const tubeRadius = 0.4;
    
    // 1. Concrete Floors (White Rings)
    const floorGeo = new THREE.TorusGeometry(radius, 0.4, 16, 48); // Main volume
    // We flatten it to look like floors
    floorGeo.scale(1, 0.5, 1);
    
    const floorMesh = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({color: white}));
    floorMesh.rotation.x = Math.PI/2;
    floorMesh.position.y = 0.6;
    lot.add(floorMesh);

    // 2. Glass Exterior Walls (Slightly larger, transparent)
    const glassRing = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.41, 16, 48), 
        new THREE.MeshPhysicalMaterial({
            color: glass, transmission: 0.6, opacity: 0.6, transparent: true,
            roughness: 0.1, metalness: 0.1
        })
    );
    glassRing.scale.set(1, 0.45, 1); // Keep it within floor height
    glassRing.rotation.x = Math.PI/2;
    glassRing.position.y = 0.6;
    lot.add(glassRing);

    // 3. Vertical Fins (Louvers)
    const numFins = 24;
    for (let i = 0; i < numFins; i++) {
        const angle = (i / numFins) * Math.PI * 2;
        const finX = Math.cos(angle) * (radius + 0.35); // Stick out slightly
        const finZ = Math.sin(angle) * (radius + 0.35);
        
        const fin = createBox(0.05, 0.6, 0.2, white, finX, 0.6, finZ, isNight);
        fin.rotation.y = -angle; // Face outward
        lot.add(fin);
    }

    // 4. Central Park (Inner Circle)
    lot.add(createBox(3.8, 0.1, 3.8, 0x4caf50, 0, 0.05, 0, isNight)); // Grass base
    
    // Trees inside the ring
    lot.add(createStylizedTree(0, 0, 0.9, 'round', isNight, season));
    lot.add(createStylizedTree(0.5, 0.5, 0.7, 'round', isNight, season));
    lot.add(createStylizedTree(-0.5, -0.4, 0.7, 'round', isNight, season));

    // 5. Solar Roof (Dark grey top)
    const solarGeo = new THREE.RingGeometry(radius - 0.4, radius + 0.4, 48);
    const solar = new THREE.Mesh(solarGeo, new THREE.MeshStandardMaterial({color: 0x111111}));
    solar.rotation.x = -Math.PI/2;
    solar.position.y = 0.81; // Top of ring
    lot.add(solar);

    // 6. Signage (Silver Stele) - MOVED INSIDE BOUNDS
    const stele = createBox(0.8, 1.4, 0.1, silver, 1.6, 0.7, 1.6, isNight); // Adjusted from 2.2 to 1.6
    stele.rotation.y = -Math.PI/4;
    lot.add(stele);
    
    // Logo on Stele - Adjusted Coordinates
    addCustomLogoSign(lot, getAppleLogoTexture(), 1.65, 1.0, 1.65, 0.6, 0.6, -Math.PI/4, isNight);
};

// 4. Ford Factory (2x2)
export const renderIndFord = (lot: THREE.Group, isNight: boolean) => {
    const factoryBlue = 0x2c3e50; 
    const roofGrey = 0x90a4ae;

    lot.add(createBox(3.6, 1.0, 3.0, factoryBlue, 0, 0.5, -0.2, isNight));
    
    for(let z = -1.2; z <= 0.8; z += 0.5) {
        const saw = new THREE.Mesh(new THREE.ConeGeometry(0.2, 3.6, 4), new THREE.MeshStandardMaterial({color: roofGrey}));
        saw.rotation.z = Math.PI/2;
        saw.rotation.x = -Math.PI/4;
        saw.position.set(0, 1.2, z);
        lot.add(saw);
    }

    lot.add(createBox(1.5, 0.8, 1.0, 0xeeeeee, 1.0, 0.4, 1.5, isNight)); 
    lot.add(createBox(1.2, 0.6, 0.1, 0x424242, 1.0, 0.3, 2.0, isNight)); 
    
    const carGroup = new THREE.Group();
    carGroup.position.set(1.0, 0.1, 2.3);
    carGroup.add(createBox(0.8, 0.1, 0.4, 0x8d6e63, 0, 0, 0, isNight)); 
    carGroup.add(createBox(0.6, 0.2, 0.3, 0xcccccc, 0, 0.15, 0, isNight)); 
    lot.add(carGroup);

    addCustomLogoSign(lot, getFordLogoTexture(), -1.0, 1.0, 1.31, 1.0, 0.5, 0, isNight);
};

// 5. NVidia Factory (2x2)
export const renderIndNVidia = (lot: THREE.Group, isNight: boolean) => {
    const black = 0x111111;
    const green = 0x76b900;
    const darkGrey = 0x212121;

    const base = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.5, 2.5), new THREE.MeshStandardMaterial({color: darkGrey}));
    base.position.set(0, 0.75, 0);
    lot.add(base);

    // Stripes FIX: Offset
    lot.add(createBox(3.1, 0.05, 0.05, green, 0, 0.5, 1.26, isNight, true));
    lot.add(createBox(3.1, 0.05, 0.05, green, 0, 1.0, 1.26, isNight, true));
    
    const fanGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 8);
    const fanMat = new THREE.MeshStandardMaterial({color: 0x333333});
    for(let i=0; i<3; i++) {
        const fan = new THREE.Mesh(fanGeo, fanMat);
        fan.rotation.x = Math.PI/2;
        fan.position.set(-1.6, 0.5 + (i*0.5), 0.5);
        lot.add(fan);
        if(isNight) {
            const glow = createBox(0.1, 0.4, 0.4, green, -1.55, 0.5 + (i*0.5), 0.5, isNight, true);
            lot.add(glow);
        }
    }

    const signGroup = new THREE.Group();
    signGroup.position.set(1.0, 1.8, 1.0);
    const post = createBox(0.05, 0.5, 0.05, 0x666666, 0, -0.25, 0, isNight);
    signGroup.add(post);
    addCustomLogoSign(signGroup, getNVidiaLogoTexture(), 0, 0.2, 0, 0.8, 0.8, 0, isNight, 0x76b900);
    lot.add(signGroup);
};
