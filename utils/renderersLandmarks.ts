
import * as THREE from 'three';
import { createBox, addACUnit, getSignMaterial, getGlowTexture, getStadiumLedTexture, getSoccerFieldTexture, getHighQualityGlassMaterial, getCorinthiansLogoTexture, getAvengersLogoTexture, getNASALogoTexture, getUSAFlagTexture } from './cityHelpers';
import { createGableRoof, createWindow, createDoor, createVehicle, createFlag, createBush, createFence } from './rendererHelpers';
import { AnimatedObjectDef } from '../components/City3D';
import { EventType } from './timeHelpers';

// Type for the registration function
type RegisterAnimFn = (def: AnimatedObjectDef) => void;

export const renderLandmarkSimpsons = (lot: THREE.Group, isNight: boolean) => {
    // 2x1 - Simpson's House
    const wallColor = 0xffca88; // Pinkish-Orange
    const roofColor = 0x6d4c41; // Brown
    const garageColor = 0x8d6e63;
    const garageDoorColor = 0xba68c8; // Purple-ish
    
    lot.add(createBox(1.2, 0.8, 1.0, wallColor, 0.8, 0.4, 0.2, isNight));
    lot.add(createBox(1.3, 0.1, 1.1, roofColor, 0.8, 0.85, 0.2, isNight));
    lot.add(createBox(1.0, 0.6, 0.05, garageDoorColor, 0.8, 0.3, 0.71, isNight));

    lot.add(createBox(1.8, 0.8, 1.0, wallColor, -0.7, 0.4, 0.2, isNight));
    lot.add(createBox(1.8, 0.8, 1.0, wallColor, -0.7, 1.2, 0.2, isNight));

    const mainRoof = new THREE.Mesh(
        new THREE.ConeGeometry(1.2, 0.6, 4),
        new THREE.MeshStandardMaterial({ color: roofColor, flatShading: true })
    );
    mainRoof.rotation.y = Math.PI / 4;
    mainRoof.position.set(-0.7, 1.9, 0.2);
    mainRoof.scale.set(1.5, 1, 1);
    lot.add(mainRoof);

    lot.add(createDoor(0.3, 0.6, 0, 0.3, 0.71, isNight, 0x8d6e63));
    
    // Porch Light
    if (isNight) {
        const porchLight = new THREE.PointLight(0xffb74d, 1, 4);
        porchLight.position.set(0, 0.8, 0.8);
        lot.add(porchLight);
        
        // Window Glow (Internal Light)
        const internalLight = new THREE.PointLight(0xffeb3b, 0.5, 3);
        internalLight.position.set(-1.0, 0.5, 0.2);
        lot.add(internalLight);
    }

    const arch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8, 1, false, 0, Math.PI),
        new THREE.MeshStandardMaterial({color: wallColor})
    );
    arch.rotation.x = Math.PI/2;
    arch.position.set(0, 0.75, 0.72);
    lot.add(arch);

    lot.add(createBox(0.6, 0.5, 0.3, wallColor, -1.0, 0.3, 0.7, isNight));
    lot.add(createWindow(0.2, 0.3, -1.0, 0.3, 0.86, isNight));
    lot.add(createWindow(0.2, 0.3, -1.2, 0.3, 0.8, isNight));
    lot.add(createWindow(0.2, 0.3, -0.8, 0.3, 0.8, isNight));

    lot.add(createWindow(0.3, 0.3, -1.2, 1.2, 0.71, isNight));
    lot.add(createWindow(0.3, 0.3, -0.2, 1.2, 0.71, isNight));

    lot.add(createBox(0.2, 0.6, 0.2, 0x8d6e63, -0.2, 2.0, 0.2, isNight));

    const sedan = new THREE.Group();
    sedan.position.set(0.8, 0.1, 1.2);
    sedan.add(createBox(0.7, 0.2, 0.35, 0xe91e63, 0, 0.1, 0, isNight));
    sedan.add(createBox(0.4, 0.15, 0.3, 0xe91e63, 0, 0.25, 0, isNight));
    sedan.add(createBox(0.1, 0.1, 0.4, 0x333333, -0.2, 0.05, 0, isNight));
    sedan.add(createBox(0.1, 0.1, 0.4, 0x333333, 0.2, 0.05, 0, isNight));
    lot.add(sedan);
};

export const renderLandmarkStonehenge = (lot: THREE.Group, isNight: boolean) => {
    // 2x2
    lot.add(createBox(3.8, 0.1, 3.8, 0x556b2f, 0, 0.05, 0, isNight));
    const stoneColor = 0x9e9e9e;
    const radius = 1.2;
    for(let i=0; i<8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const stone = createBox(0.3, 1.2, 0.3, stoneColor, x, 0.6, z, isNight);
        stone.rotation.y = angle;
        lot.add(stone);
        if (i % 2 === 0) {
           const lintel = createBox(0.3, 0.3, 1.0, stoneColor, x, 1.25, z, isNight);
           lintel.rotation.y = angle + Math.PI/2; 
           lot.add(lintel);
        }
    }
    lot.add(createBox(0.8, 0.2, 0.5, 0x757575, 0, 0.15, 0, isNight));
    
    // Mystical Glow
    if (isNight) {
        const light = new THREE.PointLight(0x81d4fa, 0.8, 5);
        light.position.set(0, 0.5, 0);
        lot.add(light);
    }
};

export const renderLandmarkDelphi = (lot: THREE.Group, isNight: boolean) => {
    // 4x2 - Templo de Delphos
    const stoneColor = 0xf5f5f5;
    
    // Base principal (Ruins)
    lot.add(createBox(7.6, 0.2, 3.6, stoneColor, 0, 0.1, 0, isNight)); 
    lot.add(createBox(7.4, 0.2, 3.4, stoneColor, 0, 0.3, 0, isNight));
    lot.add(createBox(7.2, 0.2, 3.2, stoneColor, 0, 0.5, 0, isNight));
    
    const width = 6.8; const depth = 2.8; const zOffset = 0;
    const colGeo = new THREE.CylinderGeometry(0.15, 0.18, 1.5, 8);
    const colMat = new THREE.MeshStandardMaterial({ color: stoneColor });
    const placeColumn = (x: number, z: number) => {
        const col = new THREE.Mesh(colGeo, colMat);
        col.position.set(x, 1.35, z + zOffset);
        col.castShadow = true; col.receiveShadow = true;
        lot.add(col);
    };
    const xSteps = 6;
    for (let i = 0; i < xSteps; i++) {
        const x = -width/2 + (i * (width/(xSteps-1)));
        placeColumn(x, -depth/2); placeColumn(x, depth/2);
    }
    
    // Roof bits
    lot.add(createBox(7.0, 0.3, 3.0, stoneColor, 0, 2.25, zOffset, isNight));
    const roofColor = 0xeeeeee; const roofLen = 7.2; const roofThickness = 0.1; const roofWidth = 2.0; const slopeAngle = Math.PI / 6;
    const s1 = createBox(roofLen, roofThickness, roofWidth, roofColor, 0, 2.8, 0.8 + zOffset, isNight);
    s1.rotation.x = slopeAngle; lot.add(s1);
    const s2 = createBox(roofLen, roofThickness, roofWidth, roofColor, 0, 2.8, -0.8 + zOffset, isNight);
    s2.rotation.x = -slopeAngle; lot.add(s2);
    
    // Pediments
    const pedimentMat = new THREE.MeshStandardMaterial({color: stoneColor});
    const createPediment = (xPos: number) => {
        const boxSize = 2.2;
        const square = new THREE.Mesh(new THREE.BoxGeometry(0.2, boxSize, boxSize), pedimentMat);
        square.rotation.x = Math.PI / 4; square.position.set(xPos, 2.4, zOffset); return square;
    };
    lot.add(createPediment(-3.4)); lot.add(createPediment(3.4));
    
    // Uplights for columns
    if (isNight) {
        for (let i = 0; i < xSteps; i+=2) {
            const x = -width/2 + (i * (width/(xSteps-1)));
            const light = new THREE.PointLight(0xffe0b2, 0.5, 3);
            light.position.set(x, 0.6, depth/2 + 0.5);
            lot.add(light);
        }
    }
};

export const renderLandmarkStark = (lot: THREE.Group, isNight: boolean, registerAnim?: RegisterAnimFn) => {
    // 2x2
    const glassColor = 0x81d4fa; const structureColor = 0xeeeeee;
    lot.add(createBox(2.5, 2.5, 2.5, structureColor, 0, 1.25, 0, isNight));
    const towerGeo = new THREE.CylinderGeometry(1.0, 2.5, 9.0, 8); 
    const tower = new THREE.Mesh(towerGeo, new THREE.MeshStandardMaterial({ color: glassColor, transparent: true, opacity: 0.9, metalness: 0.5, roughness: 0.1, emissive: isNight ? 0x004d40 : 0x000000 }));
    tower.position.set(0, 5.5, 0); tower.scale.set(1, 1, 0.7); lot.add(tower);
    lot.add(createBox(0.8, 9.5, 0.8, structureColor, 0, 5.0, -0.6, isNight));
    lot.add(createBox(1.5, 0.8, 1.5, structureColor, 0, 9.5, 0, isNight));
    const padGroup = new THREE.Group(); padGroup.position.set(1.2, 9.2, 0); 
    padGroup.add(createBox(1.5, 0.3, 1.5, structureColor, 0, 0, 0, isNight));
    const landingCircle = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.1, 16), new THREE.MeshStandardMaterial({color: 0x90a4ae}));
    landingCircle.position.set(0.5, 0.2, 0); padGroup.add(landingCircle); lot.add(padGroup);
    const signGeo = new THREE.PlaneGeometry(2.0, 2.0); 
    const signTex = getAvengersLogoTexture();
    const signMat = new THREE.MeshStandardMaterial({ map: signTex, transparent: true, emissive: 0x00ffff, emissiveMap: signTex, emissiveIntensity: 2.0, side: THREE.DoubleSide });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 9.5, 0.8); sign.rotation.x = -0.1; lot.add(sign);
    lot.add(createBox(0.1, 2.5, 0.1, 0x999999, 0, 11.0, 0, isNight));
    
    if (isNight && registerAnim) {
        const spotLight = new THREE.SpotLight(0x00e5ff, 20, 50, 0.5, 0.5, 1);
        spotLight.position.set(0, 12.2, 0);
        lot.add(spotLight);
        lot.add(spotLight.target);
        registerAnim({ mesh: spotLight, type: 'spotlight_sweep', speed: 2.0 });
    }
};

export const renderLandmarkCorinthians = (lot: THREE.Group, isNight: boolean, registerAnim?: RegisterAnimFn) => {
    // 4x4 Arena
    const concreteColor = 0xeeeeee;
    lot.add(createBox(7.8, 0.3, 7.8, 0x999999, 0, 0.15, 0, isNight)); 
    
    // Pitch Lighting (Internal)
    if (isNight) {
        // Main Pitch Floodlight (Simulated with Point Light floating above)
        const floodLight = new THREE.PointLight(0xffffff, 2, 8);
        floodLight.position.set(0, 4, 0);
        lot.add(floodLight);

        // Exterior Facade Wash (Corner Spotlights)
        const createWashLight = (x: number, z: number, color: number) => {
            const spot = new THREE.SpotLight(color, 10, 10, 0.6, 0.5, 1);
            spot.position.set(x, 0.2, z);
            spot.target.position.set(x * 0.5, 2, z * 0.5); // Point up towards center wall
            lot.add(spot);
            lot.add(spot.target);
            
            // Glow Sprite for the source
            const spriteMaterial = new THREE.SpriteMaterial({ 
                map: getGlowTexture(), 
                color: color, 
                transparent: true, 
                opacity: 0.6, 
                blending: THREE.AdditiveBlending 
            });
            const glow = new THREE.Sprite(spriteMaterial);
            glow.scale.set(2, 2, 2);
            glow.position.set(x, 0.5, z);
            lot.add(glow);
        };

        createWashLight(-3.5, 3.5, 0xffffff);
        createWashLight(3.5, 3.5, 0xffffff);
        createWashLight(-3.5, -3.5, 0xffffff);
        createWashLight(3.5, -3.5, 0xffffff);
    }

    const fieldGeo = new THREE.PlaneGeometry(5.0, 3.4);
    const fieldMat = new THREE.MeshStandardMaterial({ 
        map: getSoccerFieldTexture(), 
        roughness: 0.8,
        emissive: isNight ? 0xffffff : 0x000000, // Glow pitch slightly
        emissiveIntensity: isNight ? 0.1 : 0
    });
    const field = new THREE.Mesh(fieldGeo, fieldMat);
    field.rotation.x = -Math.PI / 2; field.position.set(0, 0.31, 0); field.receiveShadow = true; lot.add(field);
    
    lot.add(createBox(1.5, 2.0, 5.0, concreteColor, -2.8, 1.3, 0, isNight));
    const glassGeo = new THREE.BoxGeometry(0.2, 1.5, 4.8);
    
    // Glass facade
    const glassMat = getHighQualityGlassMaterial(0x81d4fa, isNight);
    if (isNight) {
        glassMat.emissive = new THREE.Color(0x001133);
        glassMat.emissiveIntensity = 0.5;
    }
    
    const glassFacade = new THREE.Mesh(glassGeo, glassMat); glassFacade.position.set(-2.0, 1.3, 0); lot.add(glassFacade);
    const logoGeo = new THREE.PlaneGeometry(1.5, 1.5);
    const logoMat = new THREE.MeshStandardMaterial({ map: getCorinthiansLogoTexture(), transparent: true, side: THREE.DoubleSide });
    const logoMesh = new THREE.Mesh(logoGeo, logoMat); logoMesh.position.set(-2.15, 1.3, 0); logoMesh.rotation.y = -Math.PI / 2; lot.add(logoMesh);
    lot.add(createBox(1.5, 1.8, 5.0, concreteColor, 2.8, 1.2, 0, isNight));
    const ledGeo = new THREE.PlaneGeometry(5.0, 1.0);
    const ledMat = new THREE.MeshStandardMaterial({ map: getStadiumLedTexture(), emissiveMap: getStadiumLedTexture(), emissive: 0xffffff, emissiveIntensity: isNight ? 1.5 : 0.8, color: 0xffffff });
    const ledScreen = new THREE.Mesh(ledGeo, ledMat);
    ledScreen.rotation.y = Math.PI / 2; ledScreen.rotation.z = Math.PI; ledScreen.rotation.x = Math.PI; ledScreen.position.set(3.56, 1.5, 0); lot.add(ledScreen);
    const standColor = 0xffffff;
    lot.add(createBox(3.0, 0.8, 1.2, standColor, 0, 0.7, -2.5, isNight));
    lot.add(createBox(3.0, 0.8, 1.2, standColor, 0, 0.7, 2.5, isNight));
    const roofColor = 0xf5f5f5; 
    lot.add(createBox(3.0, 0.2, 6.5, roofColor, -2.2, 2.5, 0, isNight));
    lot.add(createBox(3.0, 0.2, 6.5, roofColor, 2.2, 2.5, 0, isNight));
    lot.add(createBox(1.4, 0.2, 0.8, roofColor, 0, 2.5, -2.85, isNight));
    lot.add(createBox(1.4, 0.2, 0.8, roofColor, 0, 2.5, 2.85, isNight));
    const trussColor = 0x333333;
    lot.add(createBox(0.2, 2.5, 0.2, trussColor, -3.0, 1.25, 2.0, isNight));
    lot.add(createBox(0.2, 2.5, 0.2, trussColor, -3.0, 1.25, -2.0, isNight));
    lot.add(createBox(0.2, 2.5, 0.2, trussColor, 3.0, 1.25, 2.0, isNight));
    lot.add(createBox(0.2, 2.5, 0.2, trussColor, 3.0, 1.25, -2.0, isNight));
    
    if (isNight && registerAnim) {
        const createCannon = (x: number, z: number, offset: number) => {
            const spot = new THREE.SpotLight(0xffffff, 50, 60, 0.1, 0.5, 1);
            spot.position.set(x, 2.5, z);
            lot.add(spot);
            lot.add(spot.target);
            registerAnim({ mesh: spot, type: 'spotlight_sweep', speed: 1.5, offset: offset });
        };
        createCannon(-3, 3, 0);
        createCannon(3, 3, 2);
        createCannon(-3, -3, 4);
        createCannon(3, -3, 1);
    }
};

export const renderLandmarkSphere = (lot: THREE.Group, isNight: boolean, registerAnim?: RegisterAnimFn, activeEvent?: EventType) => {
    // 4x4 Sphere
    lot.add(createBox(7.8, 0.2, 7.8, 0x111111, 0, 0.1, 0, isNight)); // Base preta
    
    const sphereGeo = new THREE.IcosahedronGeometry(3.0, 32);
    
    // UPDATED SHADER
    const sphereMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float uTime;
            varying vec2 vUv;

            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }

            float noise(vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                float a = random(i);
                float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0));
                float d = random(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }

            void main() {
                float cycle = mod(uTime, 30.0);
                
                vec3 yellow = vec3(1.0, 0.8, 0.0); 
                vec3 red = vec3(0.8, 0.0, 0.0);
                
                vec3 color = yellow;

                // --- 1. EYES PHASE ---
                if (cycle > 5.0) {
                    bool isEye = false;
                    vec2 gridUV = fract(vUv * 8.0);
                    vec2 gridID = floor(vUv * 8.0);
                    float blinkSpeed = 5.0;
                    float blinkTime = uTime * blinkSpeed + random(gridID) * 10.0;
                    float lid = smoothstep(0.9, 0.95, sin(blinkTime)); 
                    float dist = distance(gridUV, vec2(0.5));
                    if (dist < 0.25) {
                        if (abs(gridUV.y - 0.5) < (0.25 * (1.0 - lid))) {
                            isEye = true;
                        }
                    }
                    if (isEye) {
                        float eyeAlpha = smoothstep(5.0, 8.0, cycle);
                        color = mix(color, vec3(0.0), eyeAlpha);
                    }
                }

                // --- 2. RED LIQUID PHASE (Top to Bottom) ---
                if (cycle > 10.0) {
                    float liquidProgress = (cycle - 10.0) / 8.0; 
                    float liquidLevel = clamp(liquidProgress * 1.2, 0.0, 1.2);
                    float wave = sin(vUv.x * 15.0 + uTime * 5.0) * 0.02;
                    if (vUv.y > (1.0 - liquidLevel + wave)) {
                        color = red;
                    }
                }

                // --- 3. FIRE PHASE ---
                if (cycle > 18.0) {
                    float fireProgress = (cycle - 18.0) / 8.0;
                    float fireLevel = clamp(fireProgress * 1.3, 0.0, 1.5);
                    float n = noise(vUv * 10.0 + vec2(0.0, uTime * 4.0));
                    if (vUv.y < fireLevel + n * 0.2) {
                        float fireNoise = noise(vUv * 20.0 - vec2(0.0, uTime * 10.0));
                        vec3 fireColor = mix(vec3(1.0, 0.3, 0.0), vec3(1.0, 0.9, 0.0), fireNoise);
                        color = fireColor; 
                    }
                }

                // --- 4. RESET PHASE ---
                if (cycle > 26.0) {
                    float fadeOut = (cycle - 26.0) / 4.0;
                    color = mix(color, yellow, fadeOut);
                }

                gl_FragColor = vec4(color, 1.0);
            }
        `
    });

    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(0, 3.2, 0);
    if(isNight) {
        const light = new THREE.PointLight(0xffaa00, 1, 10);
        sphere.add(light);
    }
    lot.add(sphere);
    if(registerAnim) registerAnim({ mesh: sphere, type: 'sphere_shader' });
};

export const renderLandmarkMASP = (lot: THREE.Group, isNight: boolean) => {
    // 4x4 MASP
    lot.add(createBox(7.8, 0.1, 7.8, 0x9e9e9e, 0, 0.05, 0, isNight)); 

    lot.add(createBox(0.5, 0.2, 0.5, 0x424242, 1.0, 0.15, 1.0, isNight)); 
    const redColor = 0xd32f2f; const pillarW = 0.6; const pillarD = 0.6; const pillarH = 2.2; const spanX = 2.8; const spanZ = 1.5; 
    lot.add(createBox(pillarW, pillarH, pillarD, redColor, -spanX, pillarH/2, -spanZ, isNight));
    lot.add(createBox(pillarW, pillarH, pillarD, redColor, -spanX, pillarH/2, spanZ, isNight));
    lot.add(createBox(pillarW, pillarH, pillarD, redColor, spanX, pillarH/2, -spanZ, isNight));
    lot.add(createBox(pillarW, pillarH, pillarD, redColor, spanX, pillarH/2, spanZ, isNight));
    lot.add(createBox(pillarW, 0.6, (spanZ * 2) + pillarD, redColor, -spanX, pillarH + 0.3, 0, isNight));
    lot.add(createBox(pillarW, 0.6, (spanZ * 2) + pillarD, redColor, spanX, pillarH + 0.3, 0, isNight));
    const bodyW = 5.6; const bodyH = 2.0; const bodyD = 4.0; const suspendY = 1.0; 
    
    // FIX: Using isNight for correct glass brightness
    const glassMat = getHighQualityGlassMaterial(0x81d4fa, isNight);
    
    const bodyGeo = new THREE.BoxGeometry(bodyW, bodyH, bodyD);
    const body = new THREE.Mesh(bodyGeo, glassMat);
    body.position.set(0, suspendY + bodyH/2, 0); lot.add(body);
    const concreteColor = 0x424242;
    lot.add(createBox(bodyW + 0.2, 0.2, bodyD + 0.2, concreteColor, 0, suspendY, 0, isNight));
    lot.add(createBox(bodyW + 0.2, 0.2, bodyD + 0.2, concreteColor, 0, suspendY + bodyH, 0, isNight));
    for(let i = -2.5; i <= 2.5; i += 0.5) {
        lot.add(createBox(0.05, bodyH, 0.1, concreteColor, i, suspendY + bodyH/2, bodyD/2, isNight));
        lot.add(createBox(0.05, bodyH, 0.1, concreteColor, i, suspendY + bodyH/2, -bodyD/2, isNight));
    }

    // SPAN LIGHTING (Under the museum)
    if (isNight) {
        const spanLight1 = new THREE.PointLight(0xffe0b2, 0.5, 4);
        spanLight1.position.set(-1.5, 0.8, 0);
        lot.add(spanLight1);
        
        const spanLight2 = new THREE.PointLight(0xffe0b2, 0.5, 4);
        spanLight2.position.set(1.5, 0.8, 0);
        lot.add(spanLight2);
    }
};

export const renderLandmarkNASA = (lot: THREE.Group, isNight: boolean) => {
    // 4x4 NASA
    lot.add(createBox(7.8, 0.1, 7.8, 0x4caf50, 0, 0.05, 0, isNight));

    const vabWhite = 0xf5f5f5; const vabDoor = 0x212121; 
    const buildingW = 4.0; const buildingH = 5.0; const buildingD = 4.0;
    lot.add(createBox(buildingW, buildingH, buildingD, vabWhite, 0, buildingH/2, 0, isNight));
    lot.add(createBox(0.8, buildingH * 0.9, 0.1, vabDoor, -1.0, buildingH/2, buildingD/2 + 0.05, isNight));
    lot.add(createBox(0.8, buildingH * 0.9, 0.1, vabDoor, 1.0, buildingH/2, buildingD/2 + 0.05, isNight));
    lot.add(createBox(0.8, buildingH * 0.9, 0.1, vabDoor, -1.0, buildingH/2, -buildingD/2 - 0.05, isNight));
    lot.add(createBox(0.8, buildingH * 0.9, 0.1, vabDoor, 1.0, buildingH/2, -buildingD/2 - 0.05, isNight));
    lot.add(createBox(0.05, 1.0, 0.05, 0xeeeeee, 1.5, buildingH + 0.5, 1.5, isNight)); 
    const flagGeo = new THREE.PlaneGeometry(0.8, 0.5); 
    const flagMat = new THREE.MeshStandardMaterial({ map: getUSAFlagTexture(), side: THREE.DoubleSide });
    const flag = new THREE.Mesh(flagGeo, flagMat); flag.position.set(1.5 + 0.4, buildingH + 0.8, 1.5); flag.rotation.y = 0.2; lot.add(flag);
    const teleGroup = new THREE.Group(); teleGroup.position.set(-1.0, buildingH, -1.0);
    teleGroup.add(createBox(1.0, 0.2, 1.0, 0x9e9e9e, 0, 0.1, 0, isNight));
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8, 0, Math.PI * 2, 0, 0.5), new THREE.MeshStandardMaterial({color: 0xffffff})); dome.position.y = 0.2; teleGroup.add(dome);
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.8, 0.2, 8), new THREE.MeshStandardMaterial({color: 0xeeeeee})); dish.position.set(0.5, 0.5, 0.5); dish.rotation.x = Math.PI / 4; teleGroup.add(dish); lot.add(teleGroup);
    const logoGeo = new THREE.PlaneGeometry(1.5, 1.5);
    const logoMat = new THREE.MeshStandardMaterial({ map: getNASALogoTexture(), transparent: true, side: THREE.DoubleSide });
    const logoMesh = new THREE.Mesh(logoGeo, logoMat); logoMesh.position.set(buildingW/2 + 0.06, buildingH - 1.5, 0); logoMesh.rotation.y = Math.PI / 2; lot.add(logoMesh);
    // Crawler way
    lot.add(createBox(2.0, 0.05, 3.0, 0x9e9e9e, 0, 0.1, 3.0, isNight));

    if (isNight) {
        // Up-lights for logo
        const spot = new THREE.SpotLight(0xffffff, 5, 10, 0.5, 0.5);
        spot.position.set(buildingW/2 + 1, 0.2, 0);
        spot.target.position.set(buildingW/2, buildingH - 1.5, 0);
        lot.add(spot);
        lot.add(spot.target);

        // Aviation Warning Lights
        const warning = new THREE.PointLight(0xff0000, 1, 5);
        warning.position.set(-1.9, buildingH + 0.2, 1.9);
        lot.add(warning);
        const warning2 = new THREE.PointLight(0xff0000, 1, 5);
        warning2.position.set(1.9, buildingH + 0.2, -1.9);
        lot.add(warning2);
    }
};

export const renderLandmarkDisney = (lot: THREE.Group, isNight: boolean, registerAnim?: RegisterAnimFn) => {
    // 4x4 Disney
    const wallColor = 0xfce4ec; const roofColor = 0x1565c0; const goldColor = 0xffd700; 
    lot.add(createBox(7.8, 0.2, 7.8, 0x81c784, 0, 0.1, 0, isNight)); 
    lot.add(createFence(7.6, 7.6, 0, 0, isNight));
    
    const pathGeo = new THREE.CylinderGeometry(3.5, 3.5, 0.05, 16);
    const pathMat = new THREE.MeshStandardMaterial({color: 0xe0e0e0});
    const path = new THREE.Mesh(pathGeo, pathMat); path.position.y = 0.15; lot.add(path);
    const createStall = (x: number, z: number, color: number) => {
        const g = new THREE.Group(); g.position.set(x, 0.15, z);
        g.add(createBox(0.6, 0.5, 0.4, 0xffffff, 0, 0.25, 0, isNight)); g.add(createBox(0.65, 0.1, 0.45, color, 0, 0.6, 0, isNight)); return g;
    };
    lot.add(createStall(2.5, 2.5, 0xd32f2f)); lot.add(createStall(-2.5, 2.5, 0xffeb3b));
    lot.add(createBox(1.0, 0.1, 0.5, 0xe91e63, 2.0, 0.16, -1.0, isNight)); 
    lot.add(createBox(1.0, 0.1, 0.5, 0x9c27b0, -2.0, 0.16, -1.0, isNight)); 
    lot.add(createBox(3.0, 1.5, 2.5, wallColor, 0, 0.9, 0, isNight));
    lot.add(createBox(1.0, 1.0, 0.5, wallColor, 0, 0.6, 1.4, isNight));
    lot.add(createDoor(0.6, 0.8, 0, 0.4, 1.66, isNight, 0x5d4037));
    const createRoyalTurret = (x: number, z: number, h: number, w: number = 0.5) => {
        const tGroup = new THREE.Group(); tGroup.position.set(x, 0, z);
        const body = new THREE.Mesh(new THREE.CylinderGeometry(w, w, h, 8), new THREE.MeshStandardMaterial({color: wallColor})); body.position.y = h/2 + 0.2; tGroup.add(body);
        const cone = new THREE.Mesh(new THREE.ConeGeometry(w + 0.1, w * 2.5, 8), new THREE.MeshStandardMaterial({color: roofColor})); cone.position.y = h + w + 0.2; tGroup.add(cone);
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 8), new THREE.MeshStandardMaterial({color: goldColor, emissive: goldColor, emissiveIntensity: 0.5})); tip.position.y = h + w * 2.5 + 0.2; tGroup.add(tip); return tGroup;
    };
    lot.add(createRoyalTurret(0, 0, 4.5, 0.7)); lot.add(createRoyalTurret(-1.2, -1.0, 2.5, 0.4)); lot.add(createRoyalTurret(1.2, -1.0, 2.5, 0.4));
    lot.add(createRoyalTurret(-1.2, 1.0, 2.5, 0.4)); lot.add(createRoyalTurret(1.2, 1.0, 2.5, 0.4)); lot.add(createRoyalTurret(-0.8, 1.5, 1.8, 0.3)); lot.add(createRoyalTurret(0.8, 1.5, 1.8, 0.3));
    lot.add(createBush(2.5, 2.5, 1.0, isNight)); lot.add(createBush(-2.5, 2.5, 1.0, isNight)); lot.add(createBush(2.5, -2.5, 1.0, isNight)); lot.add(createBush(-2.5, -2.5, 1.0, isNight));
    if (isNight) {
        const firework = new THREE.Points(
            new THREE.BufferGeometry().setFromPoints([ new THREE.Vector3(0, 6, 0), new THREE.Vector3(1, 5.5, 0), new THREE.Vector3(-1, 5.8, 0), new THREE.Vector3(0, 5.2, 1), new THREE.Vector3(0, 6.5, -1) ]),
            new THREE.PointsMaterial({color: 0xff4081, size: 0.5})
        ); lot.add(firework);
    }

    // --- ANIMATED FERRIS WHEEL ---
    if (registerAnim) {
        const wheelGroup = new THREE.Group();
        wheelGroup.position.set(-2.5, 2.0, 2.5); // Back left corner
        
        // Supports
        const supportMat = new THREE.MeshStandardMaterial({color: 0xffffff});
        const s1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.5), supportMat);
        s1.rotation.x = 0.3; s1.position.z = 0.5; wheelGroup.add(s1);
        const s2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.5), supportMat);
        s2.rotation.x = -0.3; s2.position.z = -0.5; wheelGroup.add(s2);

        // Add Light for Wheel at Night
        if (isNight) {
            const wheelLight = new THREE.PointLight(0xffd700, 1.5, 8);
            wheelLight.position.set(0, 1.5, 0); // Center of wheel
            wheelGroup.add(wheelLight);
        }

        // Rotating Part
        const rotPart = new THREE.Group();
        rotPart.position.y = 1.5;
        
        // Rim
        const rim = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.1, 8, 16), new THREE.MeshStandardMaterial({color: 0xe91e63}));
        rotPart.add(rim);
        
        // Spokes
        for(let i=0; i<8; i++) {
            const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.0), supportMat);
            spoke.rotation.z = (i/8) * Math.PI;
            rotPart.add(spoke);
            
            // Cabins
            const angle = (i/8) * Math.PI * 2;
            const cx = Math.cos(angle) * 1.5;
            const cy = Math.sin(angle) * 1.5;
            const cabin = createBox(0.4, 0.4, 0.3, 0x00bcd4, cx, cy, 0, isNight);
            // Counter-rotate cabins logic would be complex here without updating every frame individually
            // For now they are rigid attached
            rotPart.add(cabin);
        }
        
        wheelGroup.add(rotPart);
        lot.add(wheelGroup);
        
        registerAnim({ mesh: rotPart, type: 'rotation_z', speed: 0.5 });
    }
};

export const renderLandmarkPentagon = (lot: THREE.Group, isNight: boolean) => {
    // 4x4 Pentagon
    lot.add(createBox(7.8, 0.1, 7.8, 0x2e7d32, 0, 0.05, 0, isNight)); 

    const pentagonGroup = new THREE.Group();
    const radius = 2.8; const sideLen = 3.2; const height = 0.8; const wallColor = 0xe0e0e0; const windowColor = 0x212121; 
    for(let i=0; i<5; i++) {
        const angle = (i / 5) * Math.PI * 2; const x = Math.cos(angle) * radius; const z = Math.sin(angle) * radius;
        const wing = createBox(0.8, height, sideLen, wallColor, 0, 0, 0, isNight); wing.position.set(x, height/2, z); wing.rotation.y = -angle; 
        const win = createBox(0.05, height * 0.4, sideLen * 0.8, windowColor, 0.4, 0, 0, isNight); wing.add(win); pentagonGroup.add(wing);
    }
    const innerRadius = 1.8; const innerSideLen = 2.0;
    for(let i=0; i<5; i++) {
        const angle = (i / 5) * Math.PI * 2; const x = Math.cos(angle) * innerRadius; const z = Math.sin(angle) * innerRadius;
        const wing = createBox(0.6, height, innerSideLen, wallColor, 0, 0, 0, isNight); wing.position.set(x, height/2, z); wing.rotation.y = -angle; pentagonGroup.add(wing);
    }
    lot.add(pentagonGroup);
    lot.add(createBox(1.5, 0.1, 1.5, 0x5d4037, 0, 0.1, 0, isNight));
    const H = createBox(0.5, 0.05, 0.5, 0xffeb3b, 0, 0.12, 0, isNight); lot.add(H);
    const flag = createFlag(0, 0, isNight);
    const flagMesh = flag.children[1] as THREE.Mesh; 
    if (flagMesh) { flagMesh.material = new THREE.MeshStandardMaterial({ map: getUSAFlagTexture(), side: THREE.DoubleSide }); }
    lot.add(flag);

    if (isNight) {
        // Courtyard Light
        const courtLight = new THREE.PointLight(0xffe0b2, 1, 5);
        courtLight.position.set(0, 0.5, 0);
        lot.add(courtLight);
    }
};
