import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { Building } from '../types';
import { createBox, createRoad, optimizeBuildingGeometry, setSeed, createRareVehicleMesh, getBoxGeometry, disposeHierarchy } from '../utils/cityHelpers';
import { getSeasonSouthernHemisphere, EventType } from '../utils/timeHelpers';
import * as Renderers from '../utils/buildingRenderers';

interface City3DProps {
  buildings: Building[];
  isNight: boolean;
  weatherCondition: 'Clear' | 'Clouds' | 'Rain' | 'Drizzle' | 'Thunderstorm' | 'Snow' | 'Atmosphere';
  weatherDescription?: string;
  placementMode?: { active: boolean, landmarkId: string | null };
  landmarkCatalog?: any[];
  onConfirmPlacement?: (x: number, z: number) => void;
  onCancelPlacement?: () => void;
  activeEvent: EventType;
  population: number;
  unlockedVehicles?: string[];
}

export interface AnimatedObjectDef {
    mesh: THREE.Object3D;
    type: 'sphere_shader' | 'rotation_z' | 'spotlight_sweep' | 'agent' | 'bounce_rotate' | 'santa' | 'bunny' | 'simpson' | 'rare_car' | 'blink' | 'iron_man' | 'sync_follower';
    speed?: number;
    offset?: number;
    squadId?: string;
    rank?: number;
    targetMesh?: THREE.Object3D;
    flightData?: {
        target: THREE.Vector3;
    };
    agentData?: {
        currentX: number;
        currentZ: number;
        targetX: number;
        targetZ: number;
        progress: number;
        type: 'float' | 'military' | 'monster' | 'crowd' | 'santa' | 'bunny' | 'simpson' | 'rare_car';
        subtype?: string;
        state?: 'moving' | 'waiting' | 'hopping' | 'idle' | 'planning_hop';
        waitTimer?: number;
        targetBuildingId?: string;
        hopStartPos?: THREE.Vector3;
        hopEndPos?: THREE.Vector3;
        originX?: number;
        originZ?: number;
        path?: {x: number, z: number}[];
        parkedUntil?: number;
    };
}

interface IronManState {
    state: 'IDLE_TOWER' | 'FLYING_OUT' | 'HOVERING' | 'FLYING_BACK';
    nextActionTime: number;
    towerPos: THREE.Vector3;
    targetPos: THREE.Vector3 | null;
    currentPos: THREE.Vector3;
    currentRot: number;
    flightProgress: number;
}

// --- HELPER: LABEL TRANSLATION ---
const getBuildingLabel = (type: string, style: string, variant: number): string => {
    if (style === 'com_mcdonalds') return "McDonald's";
    if (style === 'com_starbucks') return "Starbucks";
    if (style === 'com_hardrock') return "Hard Rock Cafe";
    if (style === 'com_centralperk') return "Central Perk";
    if (style === 'com_carrefour') return "Carrefour";
    if (style === 'ind_coca') return "Fábrica Coca-Cola";
    if (style === 'ind_nike') return "Fábrica Nike";
    if (style === 'ind_apple') return "Fábrica Apple";
    if (style === 'ind_ford') return "Fábrica Ford";
    if (style === 'ind_nvidia') return "Fábrica NVidia";
    if (type === 'landmark') {
        const names: {[key: string]: string} = {
            'corinthians_arena': 'Neo Química Arena',
            'temple_delphi': 'Templo de Delphos',
            'stonehenge': 'Stonehenge',
            'simpsons_house': 'Casa dos Simpsons',
            'stark_tower': 'Torre Stark',
            'disney_castle': 'Castelo da Disney',
            'nasa_hq': 'NASA Headquarters',
            'pentagon': 'O Pentágono',
            'vegas_sphere': 'The Sphere',
            'masp_museum': 'MASP'
        };
        return names[style] || 'Monumento Lendário';
    }
    if (type === 'gov') {
        const names: {[key: string]: string} = {
            'police_station': variant === 1 ? 'Delegacia de Polícia' : 'Central de Operações',
            'fire_station': variant === 1 ? 'Corpo de Bombeiros' : 'Posto de Emergência',
            'school': variant === 1 ? 'Colégio Moderno' : 'Escola Municipal',
            'medical_clinic': variant === 1 ? 'Clínica da Família' : 'Pronto Socorro'
        };
        return names[style] || 'Prédio Governamental';
    }
    if (type === 'res') {
        switch (style) {
            case 'cottage': return variant === 1 ? 'Chalé Rústico' : 'Casa de Campo';
            case 'modern': return variant === 1 ? 'Casa Minimalista' : 'Casa Moderna';
            case 'barn': return variant === 1 ? 'Casa Suburbana' : 'Estilo Celeiro';
            case 'european': return variant === 1 ? 'Sobrado Europeu' : 'Townhouse';
            case 'luxury_home': return variant === 1 ? 'Villa de Luxo' : 'Residência Premium';
            case 'condo_low': return variant === 1 ? 'Condomínio Baixo' : 'Vila Residencial';
            case 'mansion': return variant === 1 ? 'Mansão Clássica' : 'Mansão Moderna';
            case 'condo_med': return variant === 1 ? 'Apartamentos Médios' : 'Residencial Executivo';
            case 'condo_high': return variant === 1 ? 'Torre de Vidro' : 'Condomínio Alto Padrão';
            case 'skyscraper_res': return variant === 1 ? 'Mega Torre Residencial' : 'Arranha-Céu Moderno';
            default: return 'Residencial';
        }
    }
    if (type === 'com') {
        switch (style) {
            case 'general_store': return variant === 0 ? 'Padaria' : 'Loja de Ferramentas';
            case 'cafe_pizza': return variant === 0 ? 'Pizzaria' : 'Cafeteria';
            case 'mini_market': return variant === 0 ? 'Hortifruti' : 'Mercadinho';
            case 'office_small': return variant === 0 ? 'Banco Local' : 'Agência de Seguros';
            case 'big_store': return variant === 0 ? 'Mega Loja Eletrônicos' : 'Loja de Brinquedos';
            case 'office_tower': return variant === 0 ? 'Torre Corporativa' : 'Sede Empresarial';
            case 'mall': return variant === 0 ? 'Shopping Center' : 'Galeria Comercial';
            default: return 'Comercial';
        }
    }
    if (type === 'ind') {
        switch (style) {
            case 'workshop': return variant === 1 ? 'Oficina Mecânica' : 'Oficina de Artesão';
            case 'textile': return variant === 1 ? 'Fábrica de Móveis' : 'Indústria Têxtil';
            case 'clean_factory': return variant === 1 ? 'Fábrica de Eletrônicos' : 'Processamento de Alimentos';
            case 'logistics': return variant === 1 ? 'Data Center' : 'Centro de Distribuição';
            case 'hightech': return variant === 1 ? 'Engenharia Aeroespacial' : 'Laboratório Bio-Tech';
            default: return 'Indústria';
        }
    }
    if (type === 'park') {
        switch (style) {
            case 'plaza': return variant === 0 ? 'Praça com Fonte' : 'Praça Moderna';
            case 'nature': return variant === 0 ? 'Bosque de Pinheiros' : 'Jardim de Pedras';
            case 'sports': return variant === 0 ? 'Quadra de Basquete' : 'Quadra de Tênis';
            case 'botanical': return variant === 0 ? 'Estufa Vitoriana' : 'Bio-Domo Moderno';
            case 'central_park': return variant === 0 ? 'Parque do Lago' : 'Parque Central';
            default: return 'Parque';
        }
    }
    if (type === 'road') return 'Rua';
    return style;
};

const createIronManMesh = (isNight: boolean): THREE.Object3D => {
    const group = new THREE.Group(); const s = 0.6; const red = 0xb71c1c; const gold = 0xffd700; const glow = 0x00e5ff;
    group.add(createBox(0.25*s, 0.7*s, 0.25*s, red, -0.15*s, 0.35*s, 0, isNight));
    group.add(createBox(0.25*s, 0.7*s, 0.25*s, red, 0.15*s, 0.35*s, 0, isNight));
    group.add(createBox(0.6*s, 0.7*s, 0.3*s, red, 0, 1.05*s, 0, isNight));
    group.add(createBox(0.4*s, 0.4*s, 0.05*s, gold, 0, 0.9*s, 0.15*s, isNight, true));
    const reactor = new THREE.Mesh(new THREE.CircleGeometry(0.1*s, 16), new THREE.MeshStandardMaterial({color: glow, emissive: glow, emissiveIntensity: 2.0}));
    reactor.position.set(0, 1.2*s, 0.16*s); group.add(reactor);
    return group;
};

// --- HASH HELPER ---
const stringToHash = (s: string) => {
    let hash = 0;
    for (let i = 0; i < s.length; i++) { hash = ((hash << 5) - hash) + s.charCodeAt(i); hash |= 0; }
    return Math.abs(hash);
};

const City3D: React.FC<City3DProps> = ({ 
    buildings, isNight, weatherCondition, weatherDescription,
    placementMode, landmarkCatalog, onConfirmPlacement, onCancelPlacement, activeEvent, population, unlockedVehicles
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const buildingsGroupRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  
  // Refs for logic
  const animatedObjectsRef = useRef<AnimatedObjectDef[]>([]);
  const renderedBuildingsRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const roadSetRef = useRef<Set<string>>(new Set());
  const roadCoordsRef = useRef<{x:number, z:number}[]>([]);
  const prevVisualStateRef = useRef({ isNight, activeEvent });
  const ironManStateRef = useRef<IronManState | null>(null);
  
  // Particle Systems
  const rainSystemRef = useRef<THREE.Points | null>(null);
  const starSystemRef = useRef<THREE.Points | null>(null);
  
  // Environment
  const startTimeRef = useRef(Date.now());
  const skyRef = useRef<Sky | null>(null);
  const sunPositionRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const ghostRef = useRef<THREE.Mesh | null>(null);
  const groundRef = useRef<THREE.Mesh | null>(null);
  
  // Interaction
  const [tooltip, setTooltip] = useState<{x: number, y: number, text: string} | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  
  // Dynamic Props Refs (to avoid stale closures in animation loop)
  const weatherRef = useRef(weatherCondition);
  const weatherDescRef = useRef(weatherDescription || '');
  const isNightRef = useRef(isNight);
  const eventRef = useRef(activeEvent);
  const unlockedVehiclesRef = useRef(unlockedVehicles || []);
  const currentElevationRef = useRef(isNight ? -5 : 45);

  useEffect(() => {
    weatherRef.current = weatherCondition;
    weatherDescRef.current = weatherDescription || '';
    isNightRef.current = isNight;
    eventRef.current = activeEvent;
    unlockedVehiclesRef.current = unlockedVehicles || [];
  }, [weatherCondition, weatherDescription, isNight, activeEvent, unlockedVehicles]);

  useEffect(() => {
      const handleExport = () => {
          if (!sceneRef.current) return;
          const exporter = new GLTFExporter();
          const exportGroup = buildingsGroupRef.current;
          if (!exportGroup) { alert("Erro: Cena não encontrada."); return; }
          exporter.parse(
              exportGroup,
              (gltf) => {
                  const output = JSON.stringify(gltf, null, 2);
                  const blob = new Blob([output], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.style.display = 'none'; link.href = url; link.download = `citytask_export_${Date.now()}.gltf`; 
                  document.body.appendChild(link); link.click(); document.body.removeChild(link);
              },
              (error) => { console.error('An error happened during export:', error); alert('Erro ao exportar a cidade.'); },
              { trs: true, onlyVisible: true, truncateDrawRange: true, binary: false, maxTextureSize: 1024 }
          );
      };
      window.addEventListener('citytask-export-glb', handleExport);
      return () => window.removeEventListener('citytask-export-glb', handleExport);
  }, []);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Scene Setup
    const width = mountRef.current.clientWidth || window.innerWidth;
    const height = mountRef.current.clientHeight || window.innerHeight;
    
    const scene = new THREE.Scene(); 
    sceneRef.current = scene; 
    scene.fog = new THREE.FogExp2(0xcccccc, 0.002);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 5000); 
    camera.position.set(80, 60, 80); 
    camera.lookAt(scene.position); 
    cameraRef.current = camera; 

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(width, height); 
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); 
    renderer.shadowMap.enabled = true; 
    renderer.shadowMap.type = THREE.PCFShadowMap; 
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    
    // Append to DOM
    mountRef.current.innerHTML = ''; // Clear potentially stale canvases
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement); 
    controls.enableDamping = true; 
    controls.dampingFactor = 0.05; 
    controls.screenSpacePanning = false; 
    controls.maxPolarAngle = Math.PI / 2 - 0.05; 
    controls.minDistance = 5; 
    controls.maxDistance = 800; 
    controlsRef.current = controls;

    // 5. Lighting & Environment
    const sky = new Sky(); 
    sky.scale.setScalar(450000); 
    scene.add(sky); 
    skyRef.current = sky;
    const skyUniforms = sky.material.uniforms; 
    skyUniforms['turbidity'].value = 0.5; 
    skyUniforms['rayleigh'].value = 0.5; 
    skyUniforms['mieCoefficient'].value = 0.005; 
    skyUniforms['mieDirectionalG'].value = 0.7;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); 
    scene.add(ambientLight); 
    ambientLightRef.current = ambientLight;

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6); 
    hemiLight.position.set(0, 50, 0); 
    scene.add(hemiLight); 

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0); 
    dirLight.castShadow = true; 
    dirLight.shadow.mapSize.width = 1024; 
    dirLight.shadow.mapSize.height = 1024;
    const dLight = 800; 
    dirLight.shadow.camera.left = -dLight; 
    dirLight.shadow.camera.right = dLight; 
    dirLight.shadow.camera.top = dLight; 
    dirLight.shadow.camera.bottom = -dLight; 
    dirLight.shadow.bias = -0.0005; 
    scene.add(dirLight); 
    dirLightRef.current = dirLight;

    // 6. Groups
    const buildingsGroup = new THREE.Group(); 
    scene.add(buildingsGroup); 
    buildingsGroupRef.current = buildingsGroup;

    const mapGroup = new THREE.Group();
    const grass = createBox(500, 2, 500, 0x57a85d, 0, -1, 0, false); mapGroup.add(grass);
    const dirt = createBox(500, 15, 500, 0x5d4037, 0, -9.5, 0, false); mapGroup.add(dirt);
    scene.add(mapGroup);

    const groundGeo = new THREE.PlaneGeometry(500, 500); 
    const groundMat = new THREE.MeshBasicMaterial({ visible: false });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat); 
    groundMesh.rotation.x = -Math.PI / 2; 
    groundMesh.position.y = 0.1; 
    scene.add(groundMesh); 
    groundRef.current = groundMesh;

    const ghostGeo = new THREE.BoxGeometry(1, 1, 1); 
    const ghostMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5, wireframe: false });
    const ghostMesh = new THREE.Mesh(ghostGeo, ghostMat); 
    ghostMesh.visible = false; 
    scene.add(ghostMesh); 
    ghostRef.current = ghostMesh;

    // 7. Systems (Stars, Rain, etc)
    const starsGeo = new THREE.BufferGeometry(); const starsCount = 1000; const starsPos = new Float32Array(starsCount * 3);
    for(let i=0; i<starsCount*3; i+=3) {
        const r = 3000 + Math.random() * 2000; const theta = 2 * Math.PI * Math.random(); const phi = Math.acos(2 * Math.random() - 1);
        starsPos[i] = r * Math.sin(phi) * Math.cos(theta); starsPos[i+1] = r * Math.sin(phi) * Math.sin(theta); starsPos[i+2] = r * Math.cos(phi);
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
    const starSystem = new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 8, sizeAttenuation: true, transparent: true, opacity: 0 }));
    scene.add(starSystem); starSystemRef.current = starSystem;

    const rainGeo = new THREE.BufferGeometry(); const rainCount = 5000; const rainPos = new Float32Array(rainCount * 3);
    for(let i=0; i<rainCount*3; i+=3) { rainPos[i] = (Math.random() - 0.5) * 400; rainPos[i+1] = Math.random() * 200; rainPos[i+2] = (Math.random() - 0.5) * 400; }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainSystem = new THREE.Points(rainGeo, new THREE.PointsMaterial({color: 0xaaaaaa, size: 0.4, transparent: true})); 
    rainSystem.visible = false; scene.add(rainSystem); rainSystemRef.current = rainSystem;

    // 8. Animation Loop
    let animationFrameId: number;
    let isRunning = true;

    const processMovement = () => {
        if (!keysPressed.current || !cameraRef.current || !controlsRef.current) return;
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable)) return;

        const height = Math.max(5, cameraRef.current.position.y); 
        const moveSpeed = height * 0.05 + 0.5;
        const forward = new THREE.Vector3(); cameraRef.current.getWorldDirection(forward); forward.y = 0; forward.normalize();
        const right = new THREE.Vector3(); right.crossVectors(forward, cameraRef.current.up).normalize();
        const moveVector = new THREE.Vector3(0, 0, 0);
        
        if (keysPressed.current['w']) moveVector.add(forward); 
        if (keysPressed.current['s']) moveVector.sub(forward); 
        if (keysPressed.current['a']) moveVector.sub(right); 
        if (keysPressed.current['d']) moveVector.add(right);
        
        if (moveVector.lengthSq() > 0) { 
            moveVector.normalize().multiplyScalar(moveSpeed); 
            cameraRef.current.position.add(moveVector); 
            controlsRef.current.target.add(moveVector); 
        }
    };

    const animate = () => {
        if (!isRunning) return;
        animationFrameId = requestAnimationFrame(animate);
        
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

        try {
            const night = isNightRef.current; 
            const weather = weatherRef.current; 
            const time = (Date.now() - startTimeRef.current) * 0.001;

            processMovement();

            // Sky & Sun
            const targetElevation = night ? -5 : 45; 
            currentElevationRef.current += (targetElevation - currentElevationRef.current) * 0.02;
            const phi = THREE.MathUtils.degToRad(90 - currentElevationRef.current); 
            const theta = THREE.MathUtils.degToRad(180);
            sunPositionRef.current.setFromSphericalCoords(1, phi, theta);
            if (skyRef.current) { skyRef.current.material.uniforms['sunPosition'].value.copy(sunPositionRef.current); }

            // Lights
            if (dirLightRef.current) { 
                dirLightRef.current.position.setFromSphericalCoords(100, phi, theta); 
                dirLightRef.current.intensity = night ? 0.5 : 1.2; 
                dirLightRef.current.color.setHex(night ? 0x8888ff : 0xffffff); 
            }
            if (ambientLightRef.current) { 
                ambientLightRef.current.intensity = night ? 0.2 : 0.6; 
            }
            if (starSystemRef.current) { 
                (starSystemRef.current.material as THREE.PointsMaterial).opacity = night ? Math.min(1, (starSystemRef.current.material as THREE.PointsMaterial).opacity + 0.02) : Math.max(0, (starSystemRef.current.material as THREE.PointsMaterial).opacity - 0.05); 
            }

            // Weather particles
            if (rainSystemRef.current) {
                const isRain = weather === 'Rain' || weather === 'Thunderstorm';
                rainSystemRef.current.visible = isRain;
                if (isRain) {
                    const positions = rainSystemRef.current.geometry.attributes.position.array as Float32Array;
                    for(let i=0; i<positions.length; i+=3) { 
                        positions[i+1] -= 2.0; 
                        if(positions[i+1] < 0) { 
                            positions[i+1] = 200; 
                            positions[i] = (Math.random() - 0.5) * 400; 
                            positions[i+2] = (Math.random() - 0.5) * 400; 
                        } 
                    }
                    rainSystemRef.current.geometry.attributes.position.needsUpdate = true;
                }
            }

            // Animations
            animatedObjectsRef.current.forEach(anim => {
                if (anim.mesh && anim.mesh.parent) { // Ensure mesh is still in scene
                    if (anim.type === 'rotation_z') { anim.mesh.rotation.z += (anim.speed || 1) * 0.02; } 
                    else if (anim.type === 'blink' && anim.mesh instanceof THREE.Mesh) {
                        const mat = anim.mesh.material as THREE.MeshStandardMaterial;
                        const speed = 2.0;
                        const intensity = 0.5 + 0.5 * Math.sin(time * speed);
                        if (night) mat.emissiveIntensity = 1.0 + intensity * 2.0; else mat.emissiveIntensity = 0;
                    }
                }
            });

            if (controlsRef.current) controlsRef.current.update();
            rendererRef.current.render(sceneRef.current, cameraRef.current);
        } catch (e) {
            console.error("Animation Loop Error:", e);
            // Don't stop loop, try to recover next frame
        }
    };
    animate();

    // 9. Handlers
    const handleResize = () => { 
        if (!mountRef.current || !rendererRef.current || !cameraRef.current) return; 
        const w = mountRef.current.clientWidth; 
        const h = mountRef.current.clientHeight; 
        if (w === 0 || h === 0) return;
        cameraRef.current.aspect = w / h; 
        cameraRef.current.updateProjectionMatrix(); 
        rendererRef.current.setSize(w, h); 
    };
    
    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(mountRef.current);
    
    // Force initial resize
    setTimeout(handleResize, 100);

    const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key.toLowerCase()] = true; if(e.key === 'Escape' && onCancelPlacement) onCancelPlacement(); };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key.toLowerCase()] = false; };

    window.addEventListener('keydown', handleKeyDown); 
    window.addEventListener('keyup', handleKeyUp);

    // 10. Cleanup
    return () => { 
        isRunning = false;
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('keydown', handleKeyDown); 
        window.removeEventListener('keyup', handleKeyUp); 
        resizeObserver.disconnect();
        
        if (mountRef.current && rendererRef.current) { 
            // Check if child exists before removing
            if (mountRef.current.contains(rendererRef.current.domElement)) {
                mountRef.current.removeChild(rendererRef.current.domElement); 
            }
        } 
        if (rendererRef.current) rendererRef.current.dispose(); 
        if (controlsRef.current) controlsRef.current.dispose();
        
        // Clear refs
        sceneRef.current = null;
        rendererRef.current = null;
        cameraRef.current = null;
    };
  }, []); // Mounts once

  // --- INTERACTION ---
  useEffect(() => {
      if(!ghostRef.current) return;
      if (!placementMode?.active || !placementMode.landmarkId || !landmarkCatalog) { 
          ghostRef.current.visible = false; 
          document.body.style.cursor = 'default'; 
          return; 
      }
      document.body.style.cursor = 'crosshair';
      const item = landmarkCatalog.find(l => l.id === placementMode.landmarkId); 
      if(item) { 
          ghostRef.current.scale.set(item.w * 2, 5, item.d * 2); 
          ghostRef.current.visible = true; 
      }
  }, [placementMode, landmarkCatalog]);

  const checkPlacementValidity = (gx: number, gz: number, w: number, d: number) => {
      let overlapsNonRoad = false; let touchesRoad = false;
      for (const b of buildings) {
          let bW = b.width; let bD = b.depth; if(b.rotation % 2 !== 0) { bW = b.depth; bD = b.width; }
          const collideX = (gx < b.x + bW) && (gx + w > b.x); const collideZ = (gz < b.z + bD) && (gz + d > b.z);
          if (collideX && collideZ) { if (b.type !== 'road') { overlapsNonRoad = true; } else { touchesRoad = true; } }
          if (!touchesRoad) { const isAdjacentX = (gx === b.x + bW || gx + w === b.x) && (gz < b.z + bD && gz + d > b.z); const isAdjacentZ = (gz === b.z + bD || gz + d === b.z) && (gx < b.x + bW && gx + w > b.x); if ((isAdjacentX || isAdjacentZ) && b.type === 'road') { touchesRoad = true; } }
      }
      return !overlapsNonRoad && touchesRoad;
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!mountRef.current || !cameraRef.current || !raycasterRef.current) return;
    const rect = mountRef.current.getBoundingClientRect(); 
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1; 
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycasterRef.current.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);
    
    if (placementMode?.active && groundRef.current && ghostRef.current && landmarkCatalog) {
        const intersects = raycasterRef.current.intersectObject(groundRef.current);
        if (intersects.length > 0) {
            const hit = intersects[0].point; const gridX = Math.floor(hit.x / 2); const gridZ = Math.floor(hit.z / 2);
            const item = landmarkCatalog.find(l => l.id === placementMode.landmarkId); 
            const w = item ? item.w : 1; const d = item ? item.d : 1;
            ghostRef.current.position.set(gridX * 2 + w - 1, 2.5, gridZ * 2 + d - 1);
            const isValid = checkPlacementValidity(gridX, gridZ, w, d); 
            (ghostRef.current.material as THREE.MeshBasicMaterial).color.setHex(isValid ? 0x00ff00 : 0xff0000);
        }
        return; 
    }
    
    if (hoverTimeoutRef.current) { clearTimeout(hoverTimeoutRef.current); hoverTimeoutRef.current = null; }
    if (buildingsGroupRef.current) {
        const intersects = raycasterRef.current.intersectObjects(buildingsGroupRef.current.children, true);
        if (intersects.length > 0) {
            let object = intersects[0].object; while (object.parent && object.parent !== buildingsGroupRef.current) { object = object.parent; }
            if (object.userData && object.userData.label) { hoverTimeoutRef.current = setTimeout(() => { setTooltip({ x: event.clientX, y: event.clientY, text: object.userData.label }); }, 100); return; }
        }
    }
    setTooltip(null);
  };

  const handleClick = (event: React.MouseEvent) => {
      if (placementMode?.active && onConfirmPlacement && groundRef.current && landmarkCatalog) {
        const rect = mountRef.current!.getBoundingClientRect(); 
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1; 
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycasterRef.current.setFromCamera(new THREE.Vector2(x, y), cameraRef.current!);
        const intersects = raycasterRef.current.intersectObject(groundRef.current);
        if (intersects.length > 0) {
            const hit = intersects[0].point; const gridX = Math.floor(hit.x / 2); const gridZ = Math.floor(hit.z / 2);
            const item = landmarkCatalog.find(l => l.id === placementMode.landmarkId); 
            if (item) { const isValid = checkPlacementValidity(gridX, gridZ, item.w, item.d); if (isValid) { onConfirmPlacement(gridX, gridZ); } }
        }
      }
  };

  // --- RENDER BUILDINGS LOGIC (Decoupled from init) ---
  useEffect(() => {
    if (!buildingsGroupRef.current) return;
    const group = buildingsGroupRef.current;
    
    // Register Anim Helper
    const registerAnim = (def: AnimatedObjectDef) => { animatedObjectsRef.current.push(def); };

    // Reset logic if visual state changes significantly
    const visualStateChanged = prevVisualStateRef.current.isNight !== isNight || prevVisualStateRef.current.activeEvent !== activeEvent;
    if (visualStateChanged) { 
        renderedBuildingsRef.current.forEach((obj) => { group.remove(obj); disposeHierarchy(obj); }); 
        renderedBuildingsRef.current.clear(); 
        animatedObjectsRef.current = []; 
    }
    prevVisualStateRef.current = { isNight, activeEvent };

    // Cleanup Removed Buildings
    const currentIds = new Set(buildings.map(b => b.id));
    for (const [id, object] of renderedBuildingsRef.current.entries()) { 
        if (!currentIds.has(id)) { 
            group.remove(object); 
            disposeHierarchy(object); 
            renderedBuildingsRef.current.delete(id);
        } 
    }
    
    // Clean animations of removed objects (Garbage collection)
    animatedObjectsRef.current = animatedObjectsRef.current.filter(anim => anim.mesh && anim.mesh.parent);

    // Add New Buildings
    const now = new Date(); const season = getSeasonSouthernHemisphere(now).name;
    const roadSet = new Set<string>(); const roadCoords: {x:number, z:number}[] = [];
    buildings.forEach(b => { if (b.type === 'road') { roadSet.add(`${b.x},${b.z}`); roadCoords.push({x: b.x, z: b.z}); } });
    roadSetRef.current = roadSet; roadCoordsRef.current = roadCoords;

    buildings.forEach(building => {
      if (renderedBuildingsRef.current.has(building.id)) return;
      setSeed(building.x * 1234 + building.z * 5678);
      const x = building.x * 2; const z = building.z * 2; const rotation = building.rotation * (Math.PI / 2);
      let lot = new THREE.Group(); lot.userData = { type: building.type, label: getBuildingLabel(building.type, building.style, building.variant) };
      
      // ... Building Generation Logic (Simplified Call) ...
      if (building.type === 'road') {
          const neighbors = { left: roadSet.has(`${building.x - 1},${building.z}`), right: roadSet.has(`${building.x + 1},${building.z}`), top: roadSet.has(`${building.x},${building.z - 1}`), bottom: roadSet.has(`${building.x},${building.z + 1}`) };
          createRoad(lot, building.x, building.z, neighbors, isNight, activeEvent);
          if (activeEvent === 'christmas') { lot.traverse((child) => { if (child instanceof THREE.Mesh && child.userData && child.userData.type === 'xmas_light') { registerAnim({ mesh: child, type: 'blink' }); } }); }
          lot = optimizeBuildingGeometry(lot); 
      } else {
          // Standard Building Rendering
          let effectiveW = building.width; let effectiveD = building.depth; if (building.rotation % 2 !== 0) { effectiveW = building.depth; effectiveD = building.width; }
          const centerX = x + (effectiveW - 1); const centerZ = z + (effectiveD - 1);
          const sizeW = building.width * 1.95; const sizeD = building.depth * 1.95;
          const lotGrassColor = 0x4a7c4a;
          lot.add(createBox(sizeW, 0.05, sizeD, lotGrassColor, 0, 0.03, 0, isNight));
          
          const { style, variant, isRare } = building;
          // Dispatch to renderers
          switch(style) {
              case 'com_mcdonalds': Renderers.renderComMcDonalds(lot, isNight); break;
              case 'com_starbucks': Renderers.renderComStarbucks(lot, isNight); break;
              case 'com_hardrock': Renderers.renderComHardRock(lot, isNight); break;
              case 'com_centralperk': Renderers.renderComCentralPerk(lot, isNight); break;
              case 'com_carrefour': Renderers.renderComCarrefour(lot, isNight); break;
              case 'ind_coca': Renderers.renderIndCocaCola(lot, isNight); break;
              case 'ind_nike': Renderers.renderIndNike(lot, isNight); break;
              case 'ind_apple': Renderers.renderIndApple(lot, isNight, season); break;
              case 'ind_ford': Renderers.renderIndFord(lot, isNight); break;
              case 'ind_nvidia': Renderers.renderIndNVidia(lot, isNight); break;
              case 'simpsons_house': Renderers.renderLandmarkSimpsons(lot, isNight); break;
              case 'stonehenge': Renderers.renderLandmarkStonehenge(lot, isNight); break;
              case 'temple_delphi': Renderers.renderLandmarkDelphi(lot, isNight); break;
              case 'stark_tower': Renderers.renderLandmarkStark(lot, isNight, registerAnim); break;
              case 'corinthians_arena': Renderers.renderLandmarkCorinthians(lot, isNight, registerAnim); break;
              case 'vegas_sphere': Renderers.renderLandmarkSphere(lot, isNight, registerAnim, activeEvent); break;
              case 'masp_museum': Renderers.renderLandmarkMASP(lot, isNight); break;
              case 'nasa_hq': Renderers.renderLandmarkNASA(lot, isNight); break;
              case 'disney_castle': Renderers.renderLandmarkDisney(lot, isNight, registerAnim); break;
              case 'pentagon': Renderers.renderLandmarkPentagon(lot, isNight); break;
              case 'cottage': Renderers.renderResCottage(lot, variant, isRare, isNight, season, activeEvent); break;
              case 'modern': Renderers.renderResModern(lot, variant, isRare, isNight, season, activeEvent); break;
              case 'barn': Renderers.renderResBarn(lot, variant, isRare, isNight, season, activeEvent); break;
              case 'european': Renderers.renderResEuropean(lot, variant, isRare, isNight, season, activeEvent); break;
              case 'luxury_home': Renderers.renderResLuxury(lot, variant, isRare, isNight, season, activeEvent); break;
              case 'condo_low': Renderers.renderResCondoLow(lot, variant, isRare, isNight, season, activeEvent); break;
              case 'mansion': Renderers.renderResMansion(lot, variant, isRare, isNight, season, activeEvent); break;
              case 'condo_med': Renderers.renderResCondoMed(lot, variant, isRare, isNight, season, activeEvent); break;
              case 'condo_high': Renderers.renderResCondoHigh(lot, variant, isRare, isNight, season, activeEvent); break;
              case 'skyscraper_res': Renderers.renderResSkyscraper(lot, variant, isRare, isNight, season, activeEvent); break;
              case 'general_store': Renderers.renderComGeneralStore(lot, variant, isRare, isNight); break;
              case 'cafe_pizza': Renderers.renderComCafePizza(lot, variant, isRare, isNight); break;
              case 'mini_market': Renderers.renderComMiniMarket(lot, variant, isRare, isNight); break;
              case 'office_small': Renderers.renderComOfficeSmall(lot, variant, isRare, isNight); break;
              case 'big_store': Renderers.renderComBigStore(lot, variant, isRare, isNight); break;
              case 'office_tower': Renderers.renderComOfficeTower(lot, variant, isRare, isNight); break;
              case 'mall': Renderers.renderComMall(lot, variant, isRare, isNight); break;
              case 'workshop': Renderers.renderIndWorkshop(lot, variant, isRare, isNight, season); break;
              case 'textile': Renderers.renderIndTextile(lot, variant, isRare, isNight, season); break;
              case 'clean_factory': Renderers.renderIndClean(lot, variant, isRare, isNight, season); break;
              case 'logistics': Renderers.renderIndLogistics(lot, variant, isRare, isNight, season); break;
              case 'hightech': Renderers.renderIndHighTech(lot, variant, isRare, isNight, season); break;
              case 'plaza': Renderers.renderParkPlaza(lot, variant, isRare, isNight, season); break;
              case 'nature': Renderers.renderParkNature(lot, variant, isRare, isNight, season); break;
              case 'sports': Renderers.renderParkSports(lot, variant, isRare, isNight, season); break;
              case 'botanical': Renderers.renderParkBotanical(lot, variant, isRare, isNight, season); break;
              case 'central_park': Renderers.renderParkCentral(lot, variant, isRare, isNight, season); break;
              case 'police_station': Renderers.renderGovPolice(lot, variant, isRare, isNight); break;
              case 'fire_station': Renderers.renderGovFire(lot, variant, isRare, isNight); break;
              case 'school': Renderers.renderGovSchool(lot, variant, isRare, isNight); break;
              case 'medical_clinic': Renderers.renderGovClinic(lot, variant, isRare, isNight); break;
              default: Renderers.renderResCottage(lot, 0, false, isNight, season, activeEvent);
          }
          if (activeEvent === 'junina') { lot.traverse((child) => { if (child.userData && child.userData.type === 'caipira') { registerAnim({ mesh: child, type: 'bounce_rotate', speed: 2 + Math.random(), offset: child.userData.offset || 0 }); } }); }
          if (building.type !== 'landmark' && !isNight && activeEvent !== 'easter') { lot = optimizeBuildingGeometry(lot); }
          
          lot.position.set(centerX, 0, centerZ); lot.rotation.y = rotation;
      }
      
      group.add(lot); renderedBuildingsRef.current.set(building.id, lot);
    });

    // Agents Logic
    let agentGroup = group.getObjectByName('agents') as THREE.Group;
    if (!agentGroup) { agentGroup = new THREE.Group(); agentGroup.name = 'agents'; group.add(agentGroup); }
    // Clean old agents (simplified)
    if(animatedObjectsRef.current.length === 0) { // Only if cleared above
        while(agentGroup.children.length > 0) { agentGroup.remove(agentGroup.children[0]); }
    }
    
    // Add Iron Man if Stark Tower exists
    const starkTower = buildings.find(b => b.style === 'stark_tower');
    if (starkTower) {
        const ironManMesh = createIronManMesh(isNight); agentGroup.add(ironManMesh);
        const towerX = starkTower.x * 2 + 1; const towerZ = starkTower.z * 2 + 1;
        if (!ironManStateRef.current) { const waitTime = (45 + Math.random() * 15) * 60 * 1000; ironManStateRef.current = { state: 'IDLE_TOWER', nextActionTime: Date.now() + waitTime, towerPos: new THREE.Vector3(towerX, 12.0, towerZ), targetPos: null, currentPos: new THREE.Vector3(towerX, 12.0, towerZ), currentRot: 0, flightProgress: 0 }; } else { ironManStateRef.current.towerPos.set(towerX, 12.0, towerZ); }
        ironManMesh.position.copy(ironManStateRef.current.currentPos); registerAnim({ mesh: ironManMesh, type: 'iron_man' });
    }

    // Add Vehicles
    if (unlockedVehiclesRef.current.length > 0 && roadCoordsRef.current.length > 0) {
        unlockedVehiclesRef.current.forEach(carType => {
            const mesh = createRareVehicleMesh(carType, isNight); const spawnPoint = roadCoordsRef.current[Math.floor(Math.random() * roadCoordsRef.current.length)]; mesh.position.set(spawnPoint.x * 2, 0.2, spawnPoint.z * 2); agentGroup.add(mesh); registerAnim({ mesh, type: 'rare_car', agentData: { currentX: spawnPoint.x, currentZ: spawnPoint.z, targetX: spawnPoint.x, targetZ: spawnPoint.z, progress: 0, type: 'rare_car', subtype: carType, path: [] } });
        });
    }

    // Re-trigger render
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
    }

  }, [buildings, isNight, activeEvent, population, unlockedVehicles]); 

  return (
    <>
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-move active:cursor-grabbing focus:outline-none" 
        tabIndex={0}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        onClick={handleClick}
        onMouseEnter={(e) => e.currentTarget.focus()}
        title="Clique e arraste para mover, Scroll para zoom, WASD para navegar"
      />
      {tooltip && !placementMode?.active && (
          <div 
              className="fixed z-[60] bg-black/80 text-white text-xs font-medium px-3 py-1.5 rounded-lg pointer-events-none transform -translate-x-1/2 -translate-y-full border border-white/20 shadow-lg backdrop-blur-sm whitespace-nowrap"
              style={{ left: tooltip.x, top: tooltip.y - 15 }}
          >
              {tooltip.text}
          </div>
      )}
    </>
  );
};
export default City3D;