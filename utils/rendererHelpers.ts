
import * as THREE from 'three';
import { createBox, getGlowTexture, random } from './cityHelpers';

// --- HELPERS GERAIS ---

// Cria uma árvore estilizada (Low Poly) com variações sazonais
export const createStylizedTree = (x: number, z: number, scale: number = 1, type: 'round' | 'pine' = 'round', isNight: boolean, season: string = 'Verão'): THREE.Group => {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    const s = scale * (0.8 + random() * 0.4); // Variação de escala

    // Tronco
    const trunkColor = 0x5d4037;
    const trunkGeo = new THREE.CylinderGeometry(0.08 * s, 0.12 * s, 0.6 * s, 6);
    // Use MeshStandardMaterial explicitly without re-using cache to prevent merging errors in optimize
    const trunkMat = new THREE.MeshStandardMaterial({ color: trunkColor, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = (0.3 * s);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    // --- SEASONAL LOGIC ---
    let leafColors = [0x2e7d32, 0x388e3c, 0x43a047, 0x1b5e20]; // Default Verão
    let hasFlowers = false;
    let hasSnow = false;

    if (season === 'Outono') {
        // Tons quentes: Laranja, Vermelho, Amarelo, Marrom
        leafColors = [0xd84315, 0xff6f00, 0xf9a825, 0xbf360c, 0x8d6e63];
    } else if (season === 'Inverno') {
        // Verde desbotado e branco
        leafColors = [0xffffff, 0xe0f2f1, 0x81c784];
        hasSnow = true;
    } else if (season === 'Primavera') {
        // Verde vivo
        leafColors = [0x4caf50, 0x66bb6a, 0x81c784, 0x2e7d32];
        if (type === 'round') hasFlowers = true; // Pinheiros não florescem
    }

    // Explicitly select color using Math.random instead of PRNG to ensure fresh value for new material
    const leafColor = leafColors[Math.floor(Math.random() * leafColors.length)];
    const leafMat = new THREE.MeshStandardMaterial({ color: leafColor, flatShading: true, roughness: 0.8 });

    if (type === 'round') {
        // Árvore "Fofinha" (Dodecaedro)
        const geo = new THREE.DodecahedronGeometry(0.4 * s, 0);
        const leaves = new THREE.Mesh(geo, leafMat);
        leaves.position.y = (0.7 * s);
        leaves.rotation.y = random() * Math.PI;
        leaves.rotation.x = random() * 0.2;
        leaves.castShadow = true;
        leaves.receiveShadow = true;
        tree.add(leaves);

        // Flores da Primavera
        if (hasFlowers) {
            // Cores de flores: Rosa, Amarelo, Branco, Roxo, Vermelho
            const flowerColors = [0xe91e63, 0xffeb3b, 0xffffff, 0x9c27b0, 0xf44336];
            const treeFlowerColor = flowerColors[Math.floor(Math.random() * flowerColors.length)];
            const flowerMat = new THREE.MeshStandardMaterial({ color: treeFlowerColor, emissive: 0x000000 });
            
            const numFlowers = 5 + Math.floor(random() * 5);
            const flowerGeo = new THREE.BoxGeometry(0.08 * s, 0.08 * s, 0.08 * s);
            
            for(let i=0; i<numFlowers; i++) {
                const flower = new THREE.Mesh(flowerGeo, flowerMat);
                // Posiciona aleatoriamente na "superfície" aproximada
                const theta = random() * Math.PI * 2;
                const phi = random() * Math.PI;
                const rad = 0.35 * s; // Um pouco menor que o raio da copa
                
                flower.position.set(
                    Math.sin(phi) * Math.cos(theta) * rad,
                    (0.7 * s) + Math.cos(phi) * rad, // Centro da copa + offset
                    Math.sin(phi) * Math.sin(theta) * rad
                );
                // Evita flores dentro do tronco/muito baixas
                if (flower.position.y > 0.5 * s) {
                    tree.add(flower);
                }
            }
        }

    } else {
        // Pinheiro (Cones empilhados)
        const coneGeo = new THREE.ConeGeometry(0.4 * s, 0.7 * s, 6);
        const l1 = new THREE.Mesh(coneGeo, leafMat);
        l1.position.y = 0.6 * s;
        l1.castShadow = true;
        
        const l2 = new THREE.Mesh(coneGeo, leafMat);
        l2.position.y = 0.9 * s;
        l2.scale.set(0.8, 0.8, 0.8);
        l2.castShadow = true;

        tree.add(l1);
        tree.add(l2);

        // Neve no topo do pinheiro (Inverno)
        if (hasSnow) {
            const snowMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
            const snowTop = new THREE.Mesh(new THREE.ConeGeometry(0.33 * s, 0.2 * s, 6), snowMat);
            snowTop.position.y = 1.15 * s;
            tree.add(snowTop);
        }
    }

    return tree;
};

// Cria um arbusto (Escala reduzida)
export const createBush = (x: number, z: number, scale: number = 1, isNight: boolean): THREE.Mesh => {
    // Arbustos seguem a cor padrão verde por enquanto, ou poderiam mudar também, 
    // mas vamos manter simples para focar nas árvores.
    const geo = new THREE.DodecahedronGeometry(0.15 * scale, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0x66bb6a, flatShading: true });
    const bush = new THREE.Mesh(geo, mat);
    bush.position.set(x, 0.1 * scale, z);
    bush.rotation.set(random(), random(), random());
    bush.castShadow = true;
    bush.receiveShadow = true;
    return bush;
};

// ... (Rest of the file helpers remain unchanged)
export const createRock = (x: number, z: number, scale: number = 1): THREE.Mesh => {
    const geo = new THREE.DodecahedronGeometry(0.15 * scale, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0x9e9e9e, flatShading: true });
    const rock = new THREE.Mesh(geo, mat);
    rock.position.set(x, 0.05, z);
    rock.rotation.set(random(), random(), random());
    rock.castShadow = true;
    rock.receiveShadow = true;
    return rock;
};

export const createBench = (x: number, z: number, rotY: number, isNight: boolean, type: 'wood' | 'stone' = 'wood'): THREE.Group => {
    const bench = new THREE.Group();
    bench.position.set(x, 0, z);
    bench.rotation.y = rotY;

    const legColor = 0x3e2723; // Marrom escuro em vez de preto
    const seatColor = type === 'wood' ? 0x8d6e63 : 0xbdbdbd;
    
    // Pés
    bench.add(createBox(0.05, 0.15, 0.2, legColor, -0.2, 0.075, 0, isNight));
    bench.add(createBox(0.05, 0.15, 0.2, legColor, 0.2, 0.075, 0, isNight));
    
    // Assento
    bench.add(createBox(0.5, 0.03, 0.22, seatColor, 0, 0.16, 0, isNight));
    // Encosto
    bench.add(createBox(0.5, 0.15, 0.03, seatColor, 0, 0.25, -0.1, isNight));

    return bench;
};

export const createParkLamp = (x: number, z: number, isNight: boolean, style: 'classic' | 'modern' = 'classic'): THREE.Group => {
    const lamp = new THREE.Group();
    lamp.position.set(x, 0, z);

    const poleColor = style === 'classic' ? 0x263238 : 0x546e7a; // Cinza chumbo/azulado
    
    // Poste mais fino
    lamp.add(createBox(0.05, 1.2, 0.05, poleColor, 0, 0.6, 0, isNight));
    
    // Luminária
    const bulbColor = 0xffeb3b;
    const bulbY = 1.2;
    
    let bulb: THREE.Mesh;
    if (style === 'classic') {
        bulb = createBox(0.2, 0.2, 0.2, 0xffffff, 0, bulbY, 0, isNight);
    } else {
        // Moderno: Barra horizontal
        bulb = createBox(0.4, 0.05, 0.1, 0xffffff, 0.15, bulbY, 0, isNight);
    }

    if(isNight) {
        bulb.material = (bulb.material as THREE.Material).clone();
        (bulb.material as THREE.MeshStandardMaterial).emissive.setHex(bulbColor);
        (bulb.material as THREE.MeshStandardMaterial).emissiveIntensity = 2;
        
        // Glow Sprite
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: getGlowTexture(), 
            color: bulbColor,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending 
        });
        const glowSprite = new THREE.Sprite(spriteMaterial);
        glowSprite.scale.set(1.0, 1.0, 1.0);
        glowSprite.position.set(style === 'modern' ? 0.15 : 0, bulbY, 0);
        lamp.add(glowSprite);
    }
    lamp.add(bulb);

    return lamp;
};

export const createGableRoof = (w: number, d: number, h: number, color: number, x: number, y: number, z: number, isNight: boolean) => {
    const r = new THREE.Group();
    const mesh = new THREE.Mesh(
        new THREE.ConeGeometry(Math.max(w, d) * 0.8, h, 4),
        new THREE.MeshStandardMaterial({ color: color, flatShading: true })
    );
    mesh.rotation.y = Math.PI / 4;
    mesh.position.set(x, y + h/2, z);
    r.add(mesh);
    return r;
};

export const createWindow = (w: number, h: number, x: number, y: number, z: number, isNight: boolean, frameColor: number = 0xffffff) => {
    const g = new THREE.Group();
    g.add(createBox(w, h, 0.05, frameColor, x, y, z, isNight));
    g.add(createBox(w * 0.8, h * 0.8, 0.06, 0x81d4fa, x, y, z, isNight));
    g.add(createBox(w + 0.1, 0.05, 0.1, frameColor, x, y - h/2, z + 0.03, isNight));
    return g;
};

export const createDoor = (w: number, h: number, x: number, y: number, z: number, isNight: boolean, color: number) => {
    const g = new THREE.Group();
    g.add(createBox(w + 0.1, h + 0.05, 0.05, 0x5d4037, x, y + 0.025, z, isNight));
    g.add(createBox(w, h, 0.06, color, x, y, z, isNight));
    g.add(createBox(0.05, 0.05, 0.08, 0xffd700, x + w/3, y, z + 0.02, isNight));
    return g;
};

export const createFence = (w: number, d: number, x: number, z: number, isNight: boolean) => {
    const g = new THREE.Group();
    const color = 0xffffff;
    g.add(createBox(w, 0.4, 0.05, color, x, 0.2, z + d/2, isNight));
    g.add(createBox(w, 0.4, 0.05, color, x, 0.2, z - d/2, isNight));
    g.add(createBox(0.05, 0.4, d, color, x - w/2, 0.2, z, isNight));
    g.add(createBox(0.05, 0.4, d, color, x + w/2, 0.2, z, isNight));
    return g;
};

export const createFlag = (x: number, z: number, isNight: boolean, color: number = 0x4caf50) => {
    const g = new THREE.Group();
    g.add(createBox(0.05, 2.5, 0.05, 0xeeeeee, x, 1.25, z, isNight));
    const flagColor = color; 
    const flag = createBox(0.6, 0.4, 0.02, flagColor, x + 0.3, 2.3, z, isNight);
    flag.rotation.y = 0.2;
    g.add(flag);
    return g;
};

export const createVehicle = (type: 'police' | 'fire' | 'bus' | 'ambulance' | 'car_random', x: number, z: number, rotationY: number, isNight: boolean) => {
    const v = new THREE.Group();
    v.position.set(x, 0.15, z);
    v.rotation.y = rotationY;

    const wheelColor = 0x1a1a1a; 
    const addWheels = (wOffset: number, lOffset: number) => {
        v.add(createBox(0.1, 0.2, 0.2, wheelColor, wOffset, 0, lOffset, isNight));
        v.add(createBox(0.1, 0.2, 0.2, wheelColor, -wOffset, 0, lOffset, isNight));
        v.add(createBox(0.1, 0.2, 0.2, wheelColor, wOffset, 0, -lOffset, isNight));
        v.add(createBox(0.1, 0.2, 0.2, wheelColor, -wOffset, 0, -lOffset, isNight));
    };

    if (type === 'police') {
        addWheels(0.25, 0.35);
        v.add(createBox(0.6, 0.3, 1.0, 0x111111, 0, 0.2, 0, isNight)); 
        v.add(createBox(0.55, 0.35, 0.8, 0xffffff, 0, 0.5, -0.05, isNight));
        v.add(createBox(0.56, 0.2, 0.4, 0x111111, 0, 0.45, 0, isNight));
        const bar = createBox(0.4, 0.05, 0.1, 0x263238, 0, 0.7, 0.2, isNight);
        v.add(bar);
        const l1 = createBox(0.15, 0.06, 0.11, 0xff0000, -0.15, 0.7, 0.2, isNight);
        const l2 = createBox(0.15, 0.06, 0.11, 0x0000ff, 0.15, 0.7, 0.2, isNight);
        if(isNight) {
            l1.material = (l1.material as THREE.Material).clone();
            (l1.material as THREE.MeshStandardMaterial).emissive.setHex(0xff0000);
            l2.material = (l2.material as THREE.Material).clone();
            (l2.material as THREE.MeshStandardMaterial).emissive.setHex(0x0000ff);
        }
        v.add(l1); v.add(l2);
        v.add(createBox(0.5, 0.15, 0.05, 0x1a237e, 0, 0.55, 0.36, isNight));
    } else if (type === 'fire') {
        addWheels(0.25, 0.5);
        v.add(createBox(0.6, 0.4, 1.4, 0xd32f2f, 0, 0.25, 0, isNight));
        v.add(createBox(0.6, 0.3, 0.4, 0xd32f2f, 0, 0.6, 0.4, isNight));
        v.add(createBox(0.5, 0.2, 0.05, 0x81d4fa, 0, 0.6, 0.61, isNight));
        const ladder = createBox(0.3, 0.1, 1.0, 0xe0e0e0, 0, 0.55, -0.1, isNight);
        ladder.rotation.x = -0.1; v.add(ladder);
    } else if (type === 'bus') {
        addWheels(0.25, 0.5);
        v.add(createBox(0.6, 0.5, 1.3, 0xfbc02d, 0, 0.35, 0, isNight));
        v.add(createBox(0.61, 0.2, 1.0, 0x263238, 0, 0.45, 0, isNight));
        v.add(createBox(0.6, 0.05, 1.3, 0xffeb3b, 0, 0.62, 0, isNight));
    } else if (type === 'ambulance') {
        addWheels(0.25, 0.35);
        v.add(createBox(0.5, 0.3, 0.3, 0xf0f0f0, 0, 0.25, 0.4, isNight));
        v.add(createBox(0.6, 0.5, 0.6, 0xf0f0f0, 0, 0.35, -0.1, isNight));
        v.add(createBox(0.61, 0.1, 0.6, 0xff0000, 0, 0.35, -0.1, isNight));
        const l1 = createBox(0.1, 0.05, 0.05, 0xff0000, -0.15, 0.62, -0.1, isNight);
        if(isNight) {
            l1.material = (l1.material as THREE.Material).clone();
            (l1.material as THREE.MeshStandardMaterial).emissive.setHex(0xff0000);
        }
        v.add(l1);
        v.add(createBox(0.48, 0.15, 0.02, 0x1a237e, 0, 0.45, 0.55, isNight));
    } else {
        const colors = [0xd32f2f, 0x1976d2, 0x388e3c, 0xfbc02d, 0xeeeeee, 0x212121];
        const carColor = colors[Math.floor(random() * colors.length)];
        addWheels(0.25, 0.3);
        v.add(createBox(0.6, 0.25, 1.0, carColor, 0, 0.2, 0, isNight));
        v.add(createBox(0.5, 0.2, 0.6, 0x333333, 0, 0.4, -0.1, isNight));
        v.add(createBox(0.52, 0.05, 0.4, carColor, 0, 0.52, -0.1, isNight));
    }

    return v;
};

export const createParkingLot = (w: number, d: number, x: number, z: number, isNight: boolean): THREE.Group => {
    const group = new THREE.Group();
    group.position.set(x, 0.02, z);
    group.add(createBox(w, 0.05, d, 0x333333, 0, 0, 0, isNight));
    const spotW = 0.7; const spotD = 1.3; const isHorizontal = w > d; const margin = 0.2;
    if (isHorizontal) {
        const rows = Math.floor((d - margin*2) / spotD); const cols = Math.floor((w - margin*2) / spotW);
        for(let r = 0; r < rows; r++) {
            const rowZ = -d/2 + margin + spotD/2 + (r * spotD);
            for(let c = 0; c < cols; c++) {
                const colX = -w/2 + margin + spotW/2 + (c * spotW);
                group.add(createBox(0.05, 0.01, spotD * 0.8, 0xffffff, colX - spotW/2, 0.03, rowZ, isNight));
                group.add(createBox(0.05, 0.01, spotD * 0.8, 0xffffff, colX + spotW/2, 0.03, rowZ, isNight));
                if (random() > 0.5) {
                    const car = createVehicle('car_random', colX, rowZ, 0, isNight); 
                    car.scale.set(0.9, 0.9, 0.9); if(random() > 0.5) car.rotation.y = Math.PI; group.add(car);
                }
            }
        }
    } else {
        const rows = Math.floor((d - margin*2) / spotW); const cols = Math.floor((w - margin*2) / spotD); 
        for(let c = 0; c < cols; c++) {
            const colX = -w/2 + margin + spotD/2 + (c * spotD);
            for(let r = 0; r < rows; r++) {
                const rowZ = -d/2 + margin + spotW/2 + (r * spotW);
                group.add(createBox(spotD * 0.8, 0.01, 0.05, 0xffffff, colX, 0.03, rowZ - spotW/2, isNight));
                group.add(createBox(spotD * 0.8, 0.01, 0.05, 0xffffff, colX, 0.03, rowZ + spotW/2, isNight));
                if (random() > 0.5) {
                    const car = createVehicle('car_random', colX, rowZ, Math.PI/2, isNight); 
                    car.scale.set(0.9, 0.9, 0.9); if(random() > 0.5) car.rotation.y = -Math.PI/2; group.add(car);
                }
            }
        }
    }
    return group;
};
