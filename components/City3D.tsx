
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { Building } from '../types';
/* Added getBoxGeometry to imports */
import { createBox, createRoad, optimizeBuildingGeometry, setSeed, getCloudTexture, createPumpkin, createEasterEgg, disposeHierarchy, createRareVehicleMesh, getGlowTexture, getBoxGeometry } from '../utils/cityHelpers';
import { getSeasonSouthernHemisphere, EventType } from '../utils/timeHelpers';
import * as Renderers from '../utils/buildingRenderers';

interface City3DProps {
  buildings: Building[];
  isNight: boolean;
  weatherCondition: 'Clear' | 'Clouds' | 'Rain' | 'Drizzle' | 'Thunderstorm' | 'Snow' | 'Atmosphere';
  weatherDescription?: string; // e.g. "broken clouds", "mist"
  placementMode?: { active: boolean, landmarkId: string | null };
  landmarkCatalog?: any[];
  onConfirmPlacement?: (x: number, z: number) => void;
  onCancelPlacement?: () => void;
  activeEvent: EventType;
  population: number; // Added population prop for dynamic scaling
  unlockedVehicles?: string[]; // IDs of rare cars
}

// Interface para objetos animados genericamente
export interface AnimatedObjectDef {
    mesh: THREE.Object3D;
    type: 'sphere_shader' | 'rotation_z' | 'spotlight_sweep' | 'agent' | 'bounce_rotate' | 'santa' | 'bunny' | 'simpson' | 'rare_car' | 'blink' | 'iron_man' | 'sync_follower' | 'jesus_group' | 'caipira_dance';
    speed?: number; // Velocidade da animação
    offset?: number; // Deslocamento de tempo para desincronizar
    squadId?: string; // ID for grouped movement
    rank?: number; // Order in squad (0 = leader)
    targetMesh?: THREE.Object3D; // For sync_follower
    flightData?: { // Estado para voo livre (Santa)
        target: THREE.Vector3;
    };
    agentData?: {
        currentX: number; // Grid coordinates (or World X for free movers)
        currentZ: number; // Grid coordinates (or World Z for free movers)
        targetX: number;
        targetZ: number;
        progress: number; // 0 to 1
        type: 'float' | 'military' | 'monster' | 'crowd' | 'santa' | 'bunny' | 'simpson' | 'rare_car';
        subtype?: string; // For Simpsons character name
        state?: 'moving' | 'waiting' | 'hopping' | 'idle' | 'planning_hop'; // For Bunny
        waitTimer?: number; // For Bunny
        targetBuildingId?: string; // For Bunny
        hopStartPos?: THREE.Vector3; // For Bunny
        hopEndPos?: THREE.Vector3; // For Bunny
        originX?: number; // For Simpson local movement
        originZ?: number; // For Simpson local movement
        
        // Pathfinding specific
        path?: {x: number, z: number}[];
        parkedUntil?: number;
    };
}

// State persistente do Iron Man (para sobreviver a re-renders do React/Three)
interface IronManState {
    state: 'IDLE_TOWER' | 'FLYING_OUT' | 'HOVERING' | 'FLYING_BACK';
    nextActionTime: number; // Timestamp para próxima mudança de estado
    towerPos: THREE.Vector3; // Posição de descanso (Topo da torre)
    targetPos: THREE.Vector3 | null; // Posição do alvo atual
    currentPos: THREE.Vector3; // Posição atual para persistência visual
    currentRot: number; // Rotação Y
    flightProgress: number; // 0 a 1
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

// --- AGENT FACTORIES ---
const createHelicopterMesh = (isNight: boolean): THREE.Object3D => {
    const group = new THREE.Group();
    const s = 0.28; 
    const camoGreen = 0x2e7d32;
    const darkGrey = 0x212121;
    const black = 0x000000;
    const metal = 0x90a4ae;
    const skidGeo = new THREE.BoxGeometry(0.1*s, 0.1*s, 2.5*s);
    const skidMat = new THREE.MeshStandardMaterial({color: darkGrey});
    const skidL = new THREE.Mesh(skidGeo, skidMat); skidL.position.set(-0.6*s, 0.1*s, 0); group.add(skidL);
    const skidR = new THREE.Mesh(skidGeo, skidMat); skidR.position.set(0.6*s, 0.1*s, 0); group.add(skidR);
    const strutGeo = new THREE.BoxGeometry(1.4*s, 0.1*s, 0.1*s);
    const strutF = new THREE.Mesh(strutGeo, skidMat); strutF.position.set(0, 0.3*s, 0.6*s); group.add(strutF);
    const strutB = new THREE.Mesh(strutGeo, skidMat); strutB.position.set(0, 0.3*s, -0.6*s); group.add(strutB);
    const bodyGroup = new THREE.Group(); bodyGroup.position.y = 0.6 * s;
    bodyGroup.add(createBox(1.0*s, 0.6*s, 1.8*s, camoGreen, 0, 0, 0, isNight));
    bodyGroup.add(createBox(0.8*s, 0.3*s, 1.0*s, camoGreen, 0, 0.45*s, 0, isNight));
    bodyGroup.add(createBox(0.9*s, 0.5*s, 0.5*s, camoGreen, 0, -0.05*s, 1.15*s, isNight));
    bodyGroup.add(createBox(0.8*s, 0.3*s, 0.1*s, 0x81d4fa, 0, 0, 1.4*s, isNight));
    const winGeo = new THREE.BoxGeometry(0.1*s, 0.3*s, 0.6*s); const winMat = new THREE.MeshStandardMaterial({color: black});
    const winL = new THREE.Mesh(winGeo, winMat); winL.position.set(-0.51*s, 0, 0.2*s); bodyGroup.add(winL);
    const winR = new THREE.Mesh(winGeo, winMat); winR.position.set(0.51*s, 0, 0.2*s); bodyGroup.add(winR);
    const tail = createBox(0.3*s, 0.3*s, 2.0*s, camoGreen, 0, 0.1*s, -1.8*s, isNight); bodyGroup.add(tail);
    const tailFin = createBox(0.1*s, 0.8*s, 0.4*s, camoGreen, 0, 0.5*s, -2.6*s, isNight); tailFin.rotation.x = 0.3; bodyGroup.add(tailFin);
    const rotorGroup = new THREE.Group(); rotorGroup.position.set(0, 0.7*s, 0); rotorGroup.name = "main_rotor";
    rotorGroup.add(createBox(0.1*s, 0.2*s, 0.1*s, metal, 0, 0, 0, isNight));
    const bladeGeo = new THREE.BoxGeometry(0.2*s, 0.02*s, 5.0*s); const bladeMat = new THREE.MeshStandardMaterial({color: darkGrey});
    const b1 = new THREE.Mesh(bladeGeo, bladeMat); rotorGroup.add(b1);
    const b2 = new THREE.Mesh(bladeGeo, bladeMat); b2.rotation.y = Math.PI / 2; rotorGroup.add(b2); bodyGroup.add(rotorGroup);
    const tailRotorGroup = new THREE.Group(); tailRotorGroup.position.set(0.1*s, 0.6*s, -2.6*s); tailRotorGroup.name = "tail_rotor";
    const tailBladeGeo = new THREE.BoxGeometry(0.05*s, 1.0*s, 0.1*s);
    const tb1 = new THREE.Mesh(tailBladeGeo, bladeMat); tailRotorGroup.add(tb1);
    const tb2 = new THREE.Mesh(tailBladeGeo, bladeMat); tb2.rotation.x = Math.PI / 2; tailRotorGroup.add(tb2); bodyGroup.add(tailRotorGroup);
    group.add(bodyGroup);
    if (isNight) {
        const spot = new THREE.SpotLight(0xffffff, 5, 20, 0.6, 0.5, 1); spot.position.set(0, 0.3*s, 1.0*s);
        const targetObj = new THREE.Object3D(); targetObj.position.set(0, -10, 2.0); group.add(targetObj); spot.target = targetObj; group.add(spot);
    }
    return group;
};

const createIronManMesh = (isNight: boolean): THREE.Object3D => {
    const group = new THREE.Group(); const s = 0.6; const red = 0xb71c1c; const gold = 0xffd700; const glow = 0x00e5ff;
    group.add(createBox(0.25*s, 0.7*s, 0.25*s, red, -0.15*s, 0.35*s, 0, isNight));
    group.add(createBox(0.25*s, 0.7*s, 0.25*s, red, 0.15*s, 0.35*s, 0, isNight));
    group.add(createBox(0.6*s, 0.7*s, 0.3*s, red, 0, 1.05*s, 0, isNight));
    group.add(createBox(0.4*s, 0.4*s, 0.05*s, gold, 0, 0.9*s, 0.15*s, isNight, true));
    const reactor = new THREE.Mesh(new THREE.CircleGeometry(0.1*s, 16), new THREE.MeshStandardMaterial({color: glow, emissive: glow, emissiveIntensity: 2.0}));
    reactor.position.set(0, 1.2*s, 0.16*s); group.add(reactor);
    group.add(createBox(0.2*s, 0.7*s, 0.2*s, red, -0.4*s, 1.05*s, 0, isNight));
    group.add(createBox(0.2*s, 0.7*s, 0.2*s, red, 0.4*s, 1.05*s, 0, isNight));
    group.add(createBox(0.35*s, 0.45*s, 0.35*s, red, 0, 1.6*s, 0, isNight));
    group.add(createBox(0.25*s, 0.35*s, 0.05*s, gold, 0, 1.6*s, 0.18*s, isNight, true));
    const eyeMat = new THREE.MeshStandardMaterial({color: glow, emissive: glow, emissiveIntensity: 2.0});
    const leftEye = new THREE.Mesh(new THREE.PlaneGeometry(0.08*s, 0.02*s), eyeMat); leftEye.position.set(-0.08*s, 1.65*s, 0.21*s); group.add(leftEye);
    const rightEye = new THREE.Mesh(new THREE.PlaneGeometry(0.08*s, 0.02*s), eyeMat); rightEye.position.set(0.08*s, 1.65*s, 0.21*s); group.add(rightEye);
    if(isNight) { const point = new THREE.PointLight(glow, 1, 3); point.position.set(0, 1.2*s, 0.5*s); group.add(point); }
    return group;
};

const createAgentMesh = (type: 'float' | 'military' | 'monster' | 'crowd' | 'santa' | 'bunny' | 'simpson', isNight: boolean, subtype?: string): THREE.Object3D => {
    const group = new THREE.Group();
    const s = 0.4; 

    if (type === 'float') {
        const themes = ['royal', 'nature', 'cyber', 'samba', 'ocean'];
        const theme = themes[Math.floor(Math.random() * themes.length)];
        let baseColor = 0xffeb3b; let secondaryColor = 0xd32f2f; let accentColor = 0xffffff; let glowColor = 0xffa000;
        if (theme === 'nature') { baseColor = 0x2e7d32; secondaryColor = 0x8bc34a; accentColor = 0xffeb3b; glowColor = 0x00e676; } 
        else if (theme === 'cyber') { baseColor = 0x212121; secondaryColor = 0x00bcd4; accentColor = 0xe040fb; glowColor = 0x00e5ff; } 
        else if (theme === 'samba') { baseColor = 0xe91e63; secondaryColor = 0xff9800; accentColor = 0xffeb3b; glowColor = 0xd500f9; } 
        else if (theme === 'ocean') { baseColor = 0x0277bd; secondaryColor = 0x26c6da; accentColor = 0xffffff; glowColor = 0x00e5ff; }
        group.add(createBox(1.8 * s, 0.3 * s, 3.6 * s, baseColor, 0, 0.15 * s, 0, isNight));
        group.add(createBox(1.9 * s, 0.15 * s, 3.7 * s, secondaryColor, 0, 0.1 * s, 0, isNight));
        group.add(createBox(1.4 * s, 0.3 * s, 2.8 * s, baseColor, 0, 0.45 * s, 0, isNight));
        group.add(createBox(1.0 * s, 0.3 * s, 1.8 * s, secondaryColor, 0, 0.75 * s, 0, isNight));
        if (theme === 'royal') {
            const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.4*s, 0.4*s, 0.2*s, 8), new THREE.MeshStandardMaterial({color: 0xffd700}));
            crownBase.position.set(0, 1.0*s, 0); group.add(crownBase);
            for(let i=0; i<4; i++) {
                const angle = (i/4) * Math.PI * 2;
                const spike = createBox(0.1*s, 0.4*s, 0.1*s, 0xffd700, Math.cos(angle)*0.3*s, 1.2*s, Math.sin(angle)*0.3*s, isNight);
                group.add(spike);
            }
            group.add(createBox(0.2*s, 0.05*s, 3.0*s, 0xb71c1c, 0, 0.31*s, 0, isNight));
        } else if (theme === 'nature') {
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1*s, 0.15*s, 0.8*s), new THREE.MeshStandardMaterial({color: 0x5d4037}));
            trunk.position.set(0, 1.1*s, 0); group.add(trunk);
            const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5*s, 0), new THREE.MeshStandardMaterial({color: 0x43a047}));
            leaves.position.set(0, 1.6*s, 0); group.add(leaves);
            group.add(createBox(0.2*s, 0.2*s, 0.2*s, accentColor, 0.5*s, 0.6*s, 0.5*s, isNight));
            group.add(createBox(0.2*s, 0.2*s, 0.2*s, accentColor, -0.5*s, 0.6*s, -0.5*s, isNight));
        } else if (theme === 'cyber') {
            const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.4*s, 0.05*s, 8, 16), new THREE.MeshStandardMaterial({color: secondaryColor, emissive: secondaryColor}));
            ring1.position.set(0, 1.2*s, 0); group.add(ring1);
            const ring2 = ring1.clone(); ring2.rotation.x = Math.PI/2; group.add(ring2);
            group.add(createBox(0.05*s, 1.0*s, 0.05*s, 0xffffff, 0, 1.2*s, 0, isNight, true));
        } else if (theme === 'samba') {
            const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.6*s, 0.6*s, 0.4*s, 16), new THREE.MeshStandardMaterial({color: 0xffffff}));
            drum.rotation.x = Math.PI/2; drum.position.set(0, 1.1*s, -0.2*s); group.add(drum);
            const rimA = new THREE.Mesh(new THREE.TorusGeometry(0.6*s, 0.05*s, 8, 16), new THREE.MeshStandardMaterial({color: secondaryColor}));
            rimA.position.set(0, 1.1*s, 0); group.add(rimA);
            const rimB = rimA.clone(); rimB.position.set(0, 1.1*s, -0.4*s); group.add(rimB);
            for(let i=0; i<5; i++) {
                const angle = (i/4) * Math.PI - Math.PI/2;
                const feather = createBox(0.2*s, 0.8*s, 0.05*s, accentColor, Math.sin(angle)*0.8*s, 1.2*s, Math.cos(angle)*0.2*s - 0.8*s, isNight);
                feather.rotation.z = -angle; group.add(feather);
            }
        } else if (theme === 'ocean') {
            const shellColor = 0xe0f7fa;
            const shell = new THREE.Mesh(new THREE.SphereGeometry(0.6*s, 16, 16, 0, Math.PI), new THREE.MeshStandardMaterial({color: shellColor, side: THREE.DoubleSide}));
            shell.rotation.x = -Math.PI/2; shell.position.set(0, 1.0*s, -0.2*s); group.add(shell);
            const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.25*s, 16, 16), new THREE.MeshStandardMaterial({color: 0xffffff, emissive: 0x222222, emissiveIntensity: 0.5}));
            pearl.position.set(0, 1.0*s, -0.2*s); group.add(pearl);
            const w1 = new THREE.Mesh(new THREE.TorusGeometry(0.4*s, 0.1*s, 8, 16, Math.PI), new THREE.MeshStandardMaterial({color: secondaryColor}));
            w1.rotation.z = Math.PI/2; w1.position.set(0.6*s, 0.6*s, 0); group.add(w1);
            const w2 = w1.clone(); w2.position.set(-0.6*s, 0.6*s, 0); group.add(w2);
        }
        const addDancer = (x: number, y: number, z: number) => {
            const dColor = Math.random() > 0.5 ? accentColor : glowColor;
            const body = createBox(0.15*s, 0.4*s, 0.15*s, dColor, x, y+0.2*s, z, isNight);
            const feather = new THREE.Mesh(new THREE.PlaneGeometry(0.4*s, 0.4*s), new THREE.MeshStandardMaterial({color: dColor, side: THREE.DoubleSide, transparent:true, opacity:0.8}));
            feather.position.set(x, y+0.5*s, z-0.05*s); group.add(feather); group.add(body);
        };
        addDancer(0, 0.9*s, 0.8*s); addDancer(0.6*s, 0.3*s, 0); addDancer(-0.6*s, 0.3*s, 0); addDancer(0.6*s, 0.3*s, -1.0*s); addDancer(-0.6*s, 0.3*s, -1.0*s);
        if(isNight) {
            const light = new THREE.PointLight(glowColor, 2, 6); light.position.set(0, 1.0, 0); group.add(light);
            group.add(createBox(1.9*s, 0.05*s, 0.05*s, glowColor, 0, 0.2*s, 1.85*s, isNight, true));
            group.add(createBox(1.9*s, 0.05*s, 0.05*s, glowColor, 0, 0.2*s, -1.85*s, isNight, true));
        }
    } else if (type === 'military') {
        const camo = 0x33691e; const treadColor = 0x212121;
        const treadGeo = new THREE.BoxGeometry(0.3*s, 0.5*s, 2.4*s);
        const treadMat = new THREE.MeshStandardMaterial({color: treadColor});
        const leftTread = new THREE.Mesh(treadGeo, treadMat); leftTread.position.set(-0.6*s, 0.25*s, 0); group.add(leftTread);
        const rightTread = new THREE.Mesh(treadGeo, treadMat); rightTread.position.set(0.6*s, 0.25*s, 0); group.add(rightTread);
        group.add(createBox(1.0*s, 0.4*s, 2.0*s, camo, 0, 0.45*s, 0, isNight));
        const turret = new THREE.Group(); turret.position.set(0, 0.7*s, -0.1*s);
        turret.add(createBox(0.7*s, 0.35*s, 0.9*s, camo, 0, 0, 0, isNight));
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.08*s, 0.08*s, 2.0*s), new THREE.MeshStandardMaterial({color: 0x2e7d32}));
        barrel.rotation.x = Math.PI/2; barrel.position.set(0, 0, 1.0*s); turret.add(barrel);
        group.add(turret);
        if (isNight) {
            const spriteMaterial = new THREE.SpriteMaterial({ map: getGlowTexture(), color: 0xccff90, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending });
            const glow = new THREE.Sprite(spriteMaterial); glow.scale.set(5.0 * s, 5.0 * s, 1.0); glow.position.y = 0.05; group.add(glow);
        }
    } else if (type === 'monster') {
        const gScale = s * 0.6; 
        const ghostMat = new THREE.MeshStandardMaterial({
            color: 0xffffff, 
            transparent: true, 
            opacity: 0.8, 
            emissive: 0xffffff, 
            emissiveIntensity: 0.2, 
            side: THREE.DoubleSide
        });
        const sheet = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35*gScale, 0.5*gScale, 1.0*gScale, 12, 1, true),
            ghostMat
        );
        sheet.position.y = 0.5*gScale;
        group.add(sheet);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.35*gScale, 12, 8), ghostMat);
        head.position.y = 1.0*gScale;
        group.add(head);
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const eyeL = new THREE.Mesh(getBoxGeometry(0.08*gScale, 0.08*gScale, 0.02*gScale), eyeMat);
        eyeL.position.set(-0.12*gScale, 1.1*gScale, 0.3*gScale);
        group.add(eyeL);
        const eyeR = eyeL.clone();
        eyeR.position.x = 0.12*gScale;
        group.add(eyeR);
        const armL = new THREE.Mesh(getBoxGeometry(0.15*gScale, 0.1*gScale, 0.1*gScale), ghostMat);
        armL.position.set(-0.45*gScale, 0.7*gScale, 0);
        armL.rotation.z = 0.2;
        group.add(armL);
        const armR = armL.clone();
        armR.position.x = 0.45*gScale;
        armR.rotation.z = -0.2;
        group.add(armR);
    } else if (type === 'santa') {
        const sleighRed = 0xb71c1c; const gold = 0xffd700; const sackColor = 0x8d6e63; const deerColor = 0x5d4037;
        const sleighGroup = new THREE.Group();
        const runnerGeo = new THREE.BoxGeometry(0.1*s, 0.05*s, 2.0*s); const runnerMat = new THREE.MeshStandardMaterial({color: gold});
        const curlGeo = new THREE.BoxGeometry(0.1*s, 0.4*s, 0.05*s);
        [-0.5, 0.5].forEach(x => {
            const runner = new THREE.Mesh(runnerGeo, runnerMat); runner.position.set(x*s, 0.1*s, 0); sleighGroup.add(runner);
            const curl = new THREE.Mesh(curlGeo, runnerMat); curl.position.set(x*s, 0.3*s, 1.0*s); curl.rotation.x = -Math.PI/4; sleighGroup.add(curl);
            sleighGroup.add(createBox(0.05*s, 0.3*s, 0.05*s, gold, x*s, 0.25*s, 0.5*s, isNight));
            sleighGroup.add(createBox(0.05*s, 0.3*s, 0.05*s, gold, x*s, 0.25*s, -0.5*s, isNight));
        });
        const carriage = new THREE.Group(); carriage.position.y = 0.4*s;
        carriage.add(createBox(1.2*s, 0.4*s, 1.5*s, sleighRed, 0, 0.2*s, 0, isNight)); 
        carriage.add(createBox(1.3*s, 0.6*s, 0.1*s, sleighRed, 0, 0.4*s, -0.7*s, isNight)); 
        carriage.add(createBox(1.3*s, 0.4*s, 0.1*s, sleighRed, 0, 0.3*s, 0.7*s, isNight)); 
        carriage.add(createBox(0.1*s, 0.5*s, 1.4*s, sleighRed, 0.6*s, 0.35*s, 0, isNight)); 
        carriage.add(createBox(0.1*s, 0.5*s, 1.4*s, sleighRed, -0.6*s, 0.35*s, 0, isNight)); 
        carriage.add(createBox(1.35*s, 0.05*s, 1.55*s, gold, 0, 0.6*s, 0, isNight)); 
        sleighGroup.add(carriage);
        const santa = new THREE.Group(); santa.position.set(0, 0.6*s, 0.2*s);
        santa.add(createBox(0.5*s, 0.6*s, 0.4*s, 0xd32f2f, 0, 0.3*s, 0, isNight));
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.2*s, 8, 8), new THREE.MeshStandardMaterial({color: 0xffcc80})); head.position.y = 0.7*s; santa.add(head);
        const beard = new THREE.Mesh(new THREE.SphereGeometry(0.15*s, 8, 8, 0, Math.PI*2, 0, Math.PI/2), new THREE.MeshStandardMaterial({color: 0xffffff})); beard.position.set(0, 0.65*s, 0.15*s); santa.add(beard);
        const hat = new THREE.Mesh(new THREE.ConeGeometry(0.2*s, 0.4*s, 8), new THREE.MeshStandardMaterial({color: 0xd32f2f})); hat.position.set(0, 0.95*s, 0); hat.rotation.x = 0.2; santa.add(hat);
        const pompom = new THREE.Mesh(new THREE.SphereGeometry(0.08*s), new THREE.MeshStandardMaterial({color: 0xffffff})); pompom.position.set(0, 1.15*s, -0.1*s); santa.add(pompom);
        sleighGroup.add(santa);
        const sack = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5*s, 0), new THREE.MeshStandardMaterial({color: sackColor})); sack.scale.set(1, 0.8, 1); sack.position.set(0, 0.8*s, -0.4*s); sleighGroup.add(sack);
        const createReindeer = (xPos: number, zPos: number) => {
            const deer = new THREE.Group(); deer.position.set(xPos, 0.3*s, zPos);
            deer.add(createBox(0.3*s, 0.35*s, 0.6*s, deerColor, 0, 0.2*s, 0, isNight));
            deer.add(createBox(0.15*s, 0.3*s, 0.2*s, deerColor, 0, 0.5*s, 0.3*s, isNight));
            deer.add(createBox(0.2*s, 0.2*s, 0.3*s, deerColor, 0, 0.6*s, 0.4*s, isNight)); 
            deer.add(createBox(0.08*s, 0.3*s, 0.08*s, deerColor, -0.1*s, 0, 0.2*s, isNight)); deer.add(createBox(0.08*s, 0.3*s, 0.08*s, deerColor, 0.1*s, 0, 0.2*s, isNight));
            deer.add(createBox(0.08*s, 0.3*s, 0.08*s, deerColor, -0.1*s, 0, -0.2*s, isNight)); deer.add(createBox(0.08*s, 0.3*s, 0.08*s, deerColor, 0.1*s, 0, -0.2*s, isNight));
            deer.add(createBox(0.4*s, 0.05*s, 0.05*s, 0x3e2723, 0, 0.75*s, 0.35*s, isNight));
            if (Math.random() < 0.5) {
                const nose = createBox(0.05*s, 0.05*s, 0.05*s, 0xff0000, 0, 0.6*s, 0.56*s, isNight, true);
                if(isNight) (nose.material as THREE.MeshStandardMaterial).emissive.setHex(0xff0000);
                deer.add(nose);
            }
            return deer;
        };
        const deer1 = createReindeer(-0.4*s, 2.0*s); const deer2 = createReindeer(0.4*s, 2.0*s);
        sleighGroup.add(deer1); sleighGroup.add(deer2);
        const ropeGeo = new THREE.CylinderGeometry(0.01*s, 0.01*s, 2.0*s); const ropeMat = new THREE.MeshStandardMaterial({color: 0x8d6e63});
        const ropeL = new THREE.Mesh(ropeGeo, ropeMat); ropeL.position.set(-0.3*s, 0.6*s, 1.0*s); ropeL.rotation.x = Math.PI/2; sleighGroup.add(ropeL);
        const ropeR = new THREE.Mesh(ropeGeo, ropeMat); ropeR.position.set(0.3*s, 0.6*s, 1.0*s); ropeR.rotation.x = Math.PI/2; sleighGroup.add(ropeR);
        group.add(sleighGroup);
    } else if (type === 'bunny') {
        const bS = s * 0.6; 
        const furColor = 0xffffff; const bunnyMat = new THREE.MeshStandardMaterial({ color: furColor, emissive: isNight ? 0xffffff : 0x000000, emissiveIntensity: isNight ? 0.3 : 0 });
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.6*bS, 16, 16), bunnyMat); body.scale.set(1, 1.2, 1.1); body.position.y = 0.6*bS; group.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.4*bS, 16, 16), bunnyMat); head.position.set(0, 1.2*bS, 0.2*bS); group.add(head);
        const earGeo = new THREE.CapsuleGeometry(0.12*bS, 0.6*bS, 4, 8); 
        const lEar = new THREE.Mesh(earGeo, bunnyMat); lEar.position.set(-0.2*bS, 1.6*bS, 0.2*bS); lEar.rotation.z = 0.2; group.add(lEar);
        const rEar = new THREE.Mesh(earGeo, bunnyMat); rEar.position.set(0.2*bS, 1.6*bS, 0.2*bS); rEar.rotation.z = -0.2; group.add(rEar);
        const tail = new THREE.Mesh(new THREE.SphereGeometry(0.2*bS, 8, 8), bunnyMat); tail.position.set(0, 0.4*bS, -0.6*bS); group.add(tail);
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05*bS, 8, 8), new THREE.MeshStandardMaterial({color: 0xff69b4})); nose.position.set(0, 1.2*bS, 0.55*bS); group.add(nose);
    } else if (type === 'crowd') {
        const count = 5 + Math.floor(Math.random() * 8);
        for(let i=0; i<count; i++) {
            const color = Math.random() * 0xffffff; const px = (Math.random()-0.5) * 1.5 * s; const pz = (Math.random()-0.5) * 1.5 * s;
            const p = createBox(0.2*s, 0.6*s, 0.2*s, color, px, 0.3*s, pz, isNight); group.add(p);
        }
    } else if (type === 'simpson') {
        const skin = 0xffeb3b; const vS = s * 0.8; 
        group.add(createBox(0.35*vS, 0.5*vS, 0.35*vS, skin, 0, 1.0*vS, 0, isNight)); 
    }
    return group;
};



// --- JESUS & APOSTLES LOGIC ---
interface JesusGroupState {
    active: boolean;
    jesusMesh: THREE.Object3D | null;
    apostles: { mesh: THREE.Object3D, offset: THREE.Vector2 }[];
    state: 'WALKING' | 'PREACHING';
    targetPos: THREE.Vector3 | null;
    currentPos: THREE.Vector3;
    preachTimerEnd: number;
    facingAngle: number;
}

const createJesusMesh = (isNight: boolean): THREE.Object3D => {
    const group = new THREE.Group();
    const s = 0.55; 
    const white = 0xffffff; const red = 0xb71c1c; const skin = 0xffd1aa; const hair = 0xeeeeee; const blue = 0x2196f3;
    group.add(createBox(0.5*s, 0.95*s, 0.3*s, white, 0, 0.475*s, 0, isNight, isNight)); 
    const mantle = createBox(0.52*s, 0.6*s, 0.32*s, red, 0, 0.6*s, 0, isNight);
    mantle.rotation.z = -0.2; mantle.rotation.y = 0.1; group.add(mantle);
    group.add(createBox(0.25*s, 0.3*s, 0.25*s, skin, 0, 1.1*s, 0, isNight, isNight));
    group.add(createBox(0.3*s, 0.4*s, 0.1*s, hair, 0, 1.1*s, -0.1*s, isNight, isNight));
    group.add(createBox(0.1*s, 0.4*s, 0.2*s, hair, -0.15*s, 1.1*s, 0, isNight, isNight));
    group.add(createBox(0.1*s, 0.4*s, 0.2*s, hair, 0.15*s, 1.1*s, 0, isNight, isNight));
    group.add(createBox(0.26*s, 0.15*s, 0.1*s, hair, 0, 0.95*s, 0.12*s, isNight, isNight));
    group.add(createBox(0.05*s, 0.02*s, 0.02*s, blue, -0.06*s, 1.15*s, 0.13*s, isNight, true));
    group.add(createBox(0.05*s, 0.02*s, 0.02*s, blue, 0.06*s, 1.15*s, 0.13*s, isNight, true));
    if (isNight) { const light = new THREE.PointLight(0xffd700, 1, 4); light.position.set(0, 2, 0); group.add(light); }
    return group;
};

const createApostleMesh = (index: number, isNight: boolean): THREE.Object3D => {
    const group = new THREE.Group();
    const s = 0.45; 
    const colors = [0x8d6e63, 0x5d4037, 0x795548, 0xa1887f, 0x4e342e, 0x6d4c41, 0x3e2723, 0x795548, 0x8d6e63, 0x5d4037, 0xa1887f, 0x4e342e];
    const robeColor = colors[index % colors.length];
    group.add(createBox(0.5*s, 0.9*s, 0.3*s, robeColor, 0, 0.45*s, 0, isNight));
    group.add(createBox(0.25*s, 0.25*s, 0.25*s, 0xffd1aa, 0, 1.0*s, 0, isNight));
    group.add(createBox(0.26*s, 0.1*s, 0.1*s, 0x333333, 0, 0.9*s, 0.1*s, isNight));
    return group;
};


// --- PATHFINDING UTILS (BFS) ---
const findPath = (startX: number, startZ: number, endX: number, endZ: number, roadSet: Set<string>): {x:number, z:number}[] | null => {
    const queue: {x:number, z:number, path:{x:number, z:number}[]}[] = [{x: startX, z: startZ, path: []}];
    const visited = new Set<string>();
    visited.add(`${startX},${startZ}`);
    const MAX_ITER = 500; let iterations = 0;
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    while(queue.length > 0 && iterations < MAX_ITER) {
        iterations++;
        const {x, z, path} = queue.shift()!;
        if(x === endX && z === endZ) { return [...path, {x, z}]; }
        for (let i = dirs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
        }
        for(const [dx, dz] of dirs) {
            const nx = x + dx; const nz = z + dz; const key = `${nx},${nz}`;
            if(roadSet.has(key) && !visited.has(key)) {
                visited.add(key);
                queue.push({x: nx, z: nz, path: [...path, {x: nx, z: nz}]});
            }
        }
    }
    return null; 
};
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
  const animatedObjectsRef = useRef<AnimatedObjectDef[]>([]);
  const renderedBuildingsRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const roadSetRef = useRef<Set<string>>(new Set());
  const roadCoordsRef = useRef<{x:number, z:number}[]>([]);
  const buildingsRef = useRef<Building[]>([]);
  const prevVisualStateRef = useRef({ isNight, activeEvent });
  const ironManStateRef = useRef<IronManState | null>(null);
  const jesusStateRef = useRef<JesusGroupState>({
      active: false, jesusMesh: null, apostles: [], state: 'WALKING',
      targetPos: null, currentPos: new THREE.Vector3(0, 0, 0), preachTimerEnd: 0, facingAngle: 0
  });
  const rainSystemRef = useRef<THREE.Points | null>(null);
  const snowSystemRef = useRef<THREE.Points | null>(null);
  const starSystemRef = useRef<THREE.Points | null>(null);
  const cloudSystemRef = useRef<THREE.Points | null>(null);
  const fireworksSystemRef = useRef<THREE.Points | null>(null);
  const startTimeRef = useRef(Date.now());
  const skyRef = useRef<Sky | null>(null);
  const sunPositionRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null); 
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const ghostRef = useRef<THREE.Mesh | null>(null);
  const groundRef = useRef<THREE.Mesh | null>(null);
  const [tooltip, setTooltip] = useState<{x: number, y: number, text: string} | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentElevationRef = useRef(isNight ? -5 : 45);
  const lightningIntensityRef = useRef(0);
  const weatherRef = useRef(weatherCondition);
  const weatherDescRef = useRef(weatherDescription || '');
  const isNightRef = useRef(isNight);
  const eventRef = useRef(activeEvent);
  const unlockedVehiclesRef = useRef(unlockedVehicles || []);
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    weatherRef.current = weatherCondition;
    weatherDescRef.current = weatherDescription || '';
    isNightRef.current = isNight;
    eventRef.current = activeEvent;
    buildingsRef.current = buildings;
    unlockedVehiclesRef.current = unlockedVehicles || [];
  }, [weatherCondition, weatherDescription, isNight, activeEvent, buildings, unlockedVehicles]);

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

  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth; const height = mountRef.current.clientHeight;
    const scene = new THREE.Scene(); sceneRef.current = scene; scene.fog = new THREE.FogExp2(0xcccccc, 0.002);
    const sky = new Sky(); sky.scale.setScalar(450000); scene.add(sky); skyRef.current = sky;
    const skyUniforms = sky.material.uniforms; skyUniforms['turbidity'].value = 0.5; skyUniforms['rayleigh'].value = 0.5; skyUniforms['mieCoefficient'].value = 0.005; skyUniforms['mieDirectionalG'].value = 0.7;
    const starsGeo = new THREE.BufferGeometry(); const starsCount = 1000; const starsPos = new Float32Array(starsCount * 3);
    for(let i=0; i<starsCount*3; i+=3) {
        const r = 3000 + Math.random() * 2000; const theta = 2 * Math.PI * Math.random(); const phi = Math.acos(2 * Math.random() - 1);
        starsPos[i] = r * Math.sin(phi) * Math.cos(theta); starsPos[i+1] = r * Math.sin(phi) * Math.sin(theta); starsPos[i+2] = r * Math.cos(phi);
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 8, sizeAttenuation: true, transparent: true, opacity: 0 });
    const starSystem = new THREE.Points(starsGeo, starsMat); scene.add(starSystem); starSystemRef.current = starSystem;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 5000); camera.position.set(80, 60, 80); camera.lookAt(scene.position); cameraRef.current = camera; 
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(width, height); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); 
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.5;
    mountRef.current.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.dampingFactor = 0.05; controls.screenSpacePanning = false; controls.maxPolarAngle = Math.PI / 2 - 0.05; controls.minDistance = 5; controls.maxDistance = 800; controlsRef.current = controls;
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); scene.add(ambientLight); ambientLightRef.current = ambientLight;
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6); hemiLight.position.set(0, 50, 0); scene.add(hemiLight); hemiLightRef.current = hemiLight;
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0); dirLight.castShadow = true; dirLight.shadow.mapSize.width = 512; dirLight.shadow.mapSize.height = 512;
    const dLight = 800; dirLight.shadow.camera.left = -dLight; dirLight.shadow.camera.right = dLight; dirLight.shadow.camera.top = dLight; dirLight.shadow.camera.bottom = -dLight; dirLight.shadow.bias = -0.0005; scene.add(dirLight); dirLightRef.current = dirLight;
    const rainGeo = new THREE.BufferGeometry(); const rainCount = 5000; const rainPos = new Float32Array(rainCount * 3);
    for(let i=0; i<rainCount*3; i+=3) { rainPos[i] = (Math.random() - 0.5) * 400; rainPos[i+1] = Math.random() * 200; rainPos[i+2] = (Math.random() - 0.5) * 400; }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainSystem = new THREE.Points(rainGeo, new THREE.PointsMaterial({color: 0xaaaaaa, size: 0.4, transparent: true})); rainSystem.visible = false; scene.add(rainSystem); rainSystemRef.current = rainSystem;
    const snowGeo = new THREE.BufferGeometry(); const snowPos = new Float32Array(rainCount * 3);
    for(let i=0; i<rainCount*3; i+=3) { snowPos[i] = (Math.random() - 0.5) * 400; snowPos[i+1] = Math.random() * 200; snowPos[i+2] = (Math.random() - 0.5) * 400; }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
    const snowSystem = new THREE.Points(snowGeo, new THREE.PointsMaterial({color: 0xffffff, size: 0.6, transparent: true})); snowSystem.visible = false; scene.add(snowSystem); snowSystemRef.current = snowSystem;
    const cloudGeo = new THREE.BufferGeometry(); const cloudCount = 300; const cloudPos = new Float32Array(cloudCount * 3);
    for(let i=0; i<cloudCount*3; i+=3) { cloudPos[i] = (Math.random() - 0.5) * 800; cloudPos[i+1] = 60 + Math.random() * 20; cloudPos[i+2] = (Math.random() - 0.5) * 800; }
    cloudGeo.setAttribute('position', new THREE.BufferAttribute(cloudPos, 3));
    const cloudMat = new THREE.PointsMaterial({ size: 80, map: getCloudTexture(), transparent: true, opacity: 0.4, depthWrite: false, sizeAttenuation: true, color: 0xffffff });
    const cloudSystem = new THREE.Points(cloudGeo, cloudMat); cloudSystem.visible = false; scene.add(cloudSystem); cloudSystemRef.current = cloudSystem;
    const fwGeo = new THREE.BufferGeometry(); const fwCount = 800; const fwPos = new Float32Array(fwCount * 3); const fwColor = new Float32Array(fwCount * 3); const fwVel = new Float32Array(fwCount * 3); const fwLife = new Float32Array(fwCount);
    fwGeo.setAttribute('position', new THREE.BufferAttribute(fwPos, 3)); fwGeo.setAttribute('color', new THREE.BufferAttribute(fwColor, 3));
    const fwMat = new THREE.PointsMaterial({ size: 1.5, vertexColors: true, transparent: true, opacity: 1, sizeAttenuation: true, blending: THREE.AdditiveBlending });
    const fireworksSystem = new THREE.Points(fwGeo, fwMat); for(let i=0; i<fwCount; i++) { fwLife[i] = 0; }
    fireworksSystem.visible = false; fireworksSystem.userData = { velocities: fwVel, lifetimes: fwLife }; scene.add(fireworksSystem); fireworksSystemRef.current = fireworksSystem;
    const MAP_SIZE = 500; const mapGroup = new THREE.Group();
    const grass = createBox(MAP_SIZE, 2, MAP_SIZE, 0x57a85d, 0, -1, 0, isNight); mapGroup.add(grass);
    const dirt = createBox(MAP_SIZE, 15, MAP_SIZE, 0x5d4037, 0, -9.5, 0, isNight); mapGroup.add(dirt);
    scene.add(mapGroup);
    const groundGeo = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE); const groundMat = new THREE.MeshBasicMaterial({ visible: false });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat); groundMesh.rotation.x = -Math.PI / 2; groundMesh.position.y = 0.1; scene.add(groundMesh); groundRef.current = groundMesh;
    const buildingsGroup = new THREE.Group(); scene.add(buildingsGroup); buildingsGroupRef.current = buildingsGroup;
    const ghostGeo = new THREE.BoxGeometry(1, 1, 1); const ghostMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5, wireframe: false });
    const ghostMesh = new THREE.Mesh(ghostGeo, ghostMat); ghostMesh.visible = false; scene.add(ghostMesh); ghostRef.current = ghostMesh;
    const processMovement = () => {
      if (!keysPressed.current) return;
      
      // FIX: Disable WASD map movement if the user is currently typing in an input field
      const activeEl = document.activeElement;
      if (activeEl && (
          activeEl.tagName === 'INPUT' || 
          activeEl.tagName === 'TEXTAREA' || 
          (activeEl as HTMLElement).isContentEditable
      )) {
          return;
      }

      const height = Math.max(5, camera.position.y); const moveSpeed = height * 0.05 + 0.5;
      const forward = new THREE.Vector3(); camera.getWorldDirection(forward); forward.y = 0; forward.normalize();
      const right = new THREE.Vector3(); right.crossVectors(forward, camera.up).normalize();
      const moveVector = new THREE.Vector3(0, 0, 0);
      if (keysPressed.current['w']) moveVector.add(forward); if (keysPressed.current['s']) moveVector.sub(forward); if (keysPressed.current['a']) moveVector.sub(right); if (keysPressed.current['d']) moveVector.add(right);
      if (moveVector.lengthSq() > 0) { moveVector.normalize().multiplyScalar(moveSpeed); camera.position.add(moveVector); controls.target.add(moveVector); }
    };
    const animate = () => {
      requestAnimationFrame(animate); processMovement();
      const night = isNightRef.current; const weather = weatherRef.current; const desc = weatherDescRef.current.toLowerCase(); const event = eventRef.current;
      const targetElevation = night ? -5 : 45; currentElevationRef.current += (targetElevation - currentElevationRef.current) * 0.02;
      const phi = THREE.MathUtils.degToRad(90 - currentElevationRef.current); const theta = THREE.MathUtils.degToRad(180);
      sunPositionRef.current.setFromSphericalCoords(1, phi, theta);
      if (skyRef.current) { skyRef.current.material.uniforms['sunPosition'].value.copy(sunPositionRef.current); }
      let cloudCoverMod = 1.0;
      if (desc.includes("broken") || desc.includes("scattered")) { const time = Date.now() * 0.0005; cloudCoverMod = 0.7 + Math.sin(time) * 0.3; } else if (desc.includes("overcast")) { cloudCoverMod = 0.4; }
      if (dirLightRef.current) { dirLightRef.current.position.setFromSphericalCoords(100, phi, theta); dirLightRef.current.intensity = (night ? 0.5 : 1.2) * cloudCoverMod; dirLightRef.current.color.setHex(night ? 0x8888ff : 0xffffff); dirLightRef.current.castShadow = !desc.includes("overcast") && !desc.includes("fog") && !desc.includes("mist"); }
      if (ambientLightRef.current) { const baseAmb = night ? 0.2 : 0.6; ambientLightRef.current.intensity = desc.includes("overcast") ? baseAmb * 1.2 : baseAmb; }
      if (hemiLightRef.current) { hemiLightRef.current.intensity = night ? 0.2 : 0.6; hemiLightRef.current.color.setHex(night ? 0x1e293b : 0xffffff); hemiLightRef.current.groundColor.setHex(night ? 0x0f172a : 0x5d4037); }
      if (starSystemRef.current) { (starSystemRef.current.material as THREE.PointsMaterial).opacity = night ? Math.min(1, (starSystemRef.current.material as THREE.PointsMaterial).opacity + 0.02) : Math.max(0, (starSystemRef.current.material as THREE.PointsMaterial).opacity - 0.05); }
      if (cloudSystemRef.current) {
          const hasClouds = weather === 'Clouds' || weather === 'Rain' || weather === 'Thunderstorm' || weather === 'Drizzle';
          cloudSystemRef.current.visible = hasClouds;
          if (hasClouds) {
              const positions = cloudSystemRef.current.geometry.attributes.position.array as Float32Array;
              let cloudSpeed = 0.1;
              if (desc.includes('light rain') || weather === 'Drizzle') { cloudSpeed = 0.05; } else if (weather === 'Rain') { cloudSpeed = 0.2; } else if (weather === 'Thunderstorm') { cloudSpeed = 0.8; } else if (desc.includes('overcast')) { cloudSpeed = 0.05; } else if (desc.includes('broken')) { cloudSpeed = 0.08; }
              for(let i=0; i<positions.length; i+=3) { positions[i] += cloudSpeed; if(positions[i] > 400) positions[i] = -400; }
              cloudSystemRef.current.geometry.attributes.position.needsUpdate = true;
              const mat = cloudSystemRef.current.material as THREE.PointsMaterial;
              if (desc.includes('overcast') || weather === 'Rain' || weather === 'Thunderstorm') { mat.color.setHex(0x888888); mat.opacity = 0.8; } else if (desc.includes('broken')) { mat.color.setHex(0xdddddd); mat.opacity = 0.6; } else { mat.color.setHex(0xffffff); mat.opacity = 0.4; }
          }
      }
      if (fireworksSystemRef.current) {
          const fwSys = fireworksSystemRef.current; fwSys.visible = event === 'new_year';
          if (fwSys.visible) {
              const positions = fwSys.geometry.attributes.position.array as Float32Array; const colors = fwSys.geometry.attributes.color.array as Float32Array; const velocities = fwSys.userData.velocities; const lifetimes = fwSys.userData.lifetimes; const spawnRate = night ? 0.02 : 0.005; 
              if (Math.random() < spawnRate) {
                  let startIdx = -1; let count = 0; const burstSize = 40;
                  for(let i=0; i<lifetimes.length; i++) { if (lifetimes[i] <= 0) { if (startIdx === -1) startIdx = i; count++; if (count >= burstSize) break; } }
                  if (startIdx !== -1 && count > 10) {
                      const originX = (Math.random() - 0.5) * 150; const originY = 10 + Math.random() * 15; const originZ = (Math.random() - 0.5) * 150; const color = new THREE.Color().setHSL(Math.random(), 1, 0.5);
                      for(let k=0; k<count; k++) {
                          const idx = startIdx + k; lifetimes[idx] = 1.0; positions[idx*3] = originX; positions[idx*3+1] = originY; positions[idx*3+2] = originZ;
                          const angle = Math.random() * Math.PI * 2; const speed = 0.2 + Math.random() * 0.5;
                          velocities[idx*3] = Math.cos(angle) * speed; velocities[idx*3+1] = (Math.random() - 0.5) * speed; velocities[idx*3+2] = Math.sin(angle) * speed;
                          colors[idx*3] = color.r; colors[idx*3+1] = color.g; colors[idx*3+2] = color.b;
                      }
                  }
              }
              for(let i=0; i<lifetimes.length; i++) {
                  if (lifetimes[i] > 0) { positions[i*3] += velocities[i*3]; positions[i*3+1] += velocities[i*3+1]; positions[i*3+2] += velocities[i*3+2]; velocities[i*3+1] -= 0.01; lifetimes[i] -= 0.02; if (lifetimes[i] < 0) positions[i*3+1] = -1000; }
              }
              fwSys.geometry.attributes.position.needsUpdate = true; fwSys.geometry.attributes.color.needsUpdate = true;
          }
      }
      let fogColor = 0xcccccc; let fogDensity = 0;
      if (weather === 'Atmosphere' || desc.includes("mist") || desc.includes("fog") || desc.includes("haze")) { fogDensity = 0.015; fogColor = 0xbfbfbf; } else if (weather === 'Rain' || weather === 'Thunderstorm') { fogDensity = 0.008; fogColor = 0x607d8b; } else if (weather === 'Snow') { fogDensity = 0.005; fogColor = 0xe0e0e0; } else if (desc.includes("overcast")) { fogDensity = 0.002; fogColor = 0x999999; } else { fogDensity = 0.0005; }
      if (scene.fog instanceof THREE.FogExp2) { scene.fog.density += (fogDensity - scene.fog.density) * 0.05; scene.fog.color.setHex(fogColor); if (desc.includes("overcast")) scene.background = new THREE.Color(0x999999); else if (fogDensity > 0.002) scene.background = new THREE.Color(fogColor); else if (!night) scene.background = null; else scene.background = null; }
      if (rainSystemRef.current) {
          const isRainy = (weather === 'Rain' || weather === 'Drizzle' || weather === 'Thunderstorm'); rainSystemRef.current.visible = isRainy;
          if (isRainy) {
              let speed = 2.0; let opacity = 0.6; const color = new THREE.Color(0xaaaaaa); let xWind = 0;
              if (weather === 'Drizzle') { speed = 1.0; opacity = 0.3; } else if (weather === 'Thunderstorm') { speed = 4.0; opacity = 0.8; color.setHex(0x607d8b); xWind = 0.5; }
              const mat = rainSystemRef.current.material as THREE.PointsMaterial; mat.opacity = opacity; mat.color = color;
              const positions = rainSystemRef.current.geometry.attributes.position.array as Float32Array;
              for(let i=0; i<positions.length; i+=3) { positions[i+1] -= speed; positions[i] += xWind; if(positions[i+1] < 0) { positions[i+1] = 200; positions[i] = (Math.random() - 0.5) * 400; } if(positions[i] > 200) positions[i] = -200; }
              rainSystemRef.current.geometry.attributes.position.needsUpdate = true;
          }
      }
      if (snowSystemRef.current) { snowSystemRef.current.visible = (weather === 'Snow'); if (snowSystemRef.current.visible) { const positions = snowSystemRef.current.geometry.attributes.position.array as Float32Array; for(let i=1; i<positions.length; i+=3) { positions[i] -= 0.5; if(positions[i] < 0) positions[i] = 200; } snowSystemRef.current.geometry.attributes.position.needsUpdate = true; } }
      if (weather === 'Thunderstorm') { if (Math.random() < 0.01) lightningIntensityRef.current = 1.0; } if (lightningIntensityRef.current > 0) { lightningIntensityRef.current *= 0.9; if (ambientLightRef.current) ambientLightRef.current.intensity = 0.2 + lightningIntensityRef.current * 2.0; scene.background = new THREE.Color().setScalar(lightningIntensityRef.current * 0.5); }
      const time = (Date.now() - startTimeRef.current) * 0.001; const nowTs = Date.now(); const roadSet = roadSetRef.current;
      animatedObjectsRef.current.forEach(anim => {
          if (anim.type === 'sphere_shader' && anim.mesh instanceof THREE.Mesh) { const mat = anim.mesh.material as THREE.ShaderMaterial; if(mat.uniforms) mat.uniforms.uTime.value = time; } 
          else if (anim.type === 'rotation_z') { anim.mesh.rotation.z += (anim.speed || 1) * 0.02; } 
          else if (anim.type === 'spotlight_sweep') { const t = time * (anim.speed || 1) + (anim.offset || 0); anim.mesh.rotation.z = Math.sin(t) * 0.5; anim.mesh.rotation.x = Math.cos(t * 0.7) * 0.5; } 
          else if (anim.type === 'bounce_rotate') { const jumpSpeed = (anim.speed || 1) * 5; const rotSpeed = 0.1; const offset = anim.offset || 0; const jump = Math.abs(Math.sin(time * jumpSpeed + offset)) * 0.2; anim.mesh.position.y = (0.25 * 0.4) + jump; if (jump > 0.1) { anim.mesh.rotation.y += rotSpeed; } } 
          else if (anim.type === 'santa') { 
              if (!anim.flightData) { anim.flightData = { target: new THREE.Vector3((Math.random() - 0.5) * 200, 20 + Math.random() * 10, (Math.random() - 0.5) * 200) }; }
              const currentPos = anim.mesh.position; const target = anim.flightData.target; const dist = currentPos.distanceTo(target);
              if (dist < 10) { anim.flightData.target.set((Math.random() - 0.5) * 300, 15 + Math.random() * 25, (Math.random() - 0.5) * 300); }
              const speed = 0.15; const dir = new THREE.Vector3().subVectors(target, currentPos).normalize(); currentPos.add(dir.multiplyScalar(speed));
              const targetAngle = Math.atan2(dir.x, dir.z) + Math.PI / 2; let angleDiff = targetAngle - anim.mesh.rotation.y;
              while (angleDiff > Math.PI) angleDiff -= Math.PI * 2; while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
              anim.mesh.rotation.y += angleDiff * 0.02; anim.mesh.rotation.z = Math.sin(time * 1.5) * 0.15; anim.mesh.rotation.x = -dir.y * 0.5;
          } 
          else if (anim.type === 'blink') { if (anim.mesh instanceof THREE.Mesh) { const mat = anim.mesh.material as THREE.MeshStandardMaterial; const colorType = anim.mesh.userData.colorType || 'red'; const offset = colorType === 'green' ? Math.PI : 0; const speed = 2.0; const intensity = 0.5 + 0.5 * Math.sin(time * speed + offset); if (night) { mat.emissiveIntensity = 1.0 + intensity * 2.0; } else { mat.emissiveIntensity = 0; } } } 
          else if (anim.type === 'iron_man') {
              const state = ironManStateRef.current;
              if (state) {
                  if (state.state === 'IDLE_TOWER') { anim.mesh.position.copy(state.towerPos); anim.mesh.rotation.y = state.currentRot; if (nowTs > state.nextActionTime) { const validTargets = buildingsRef.current.filter(b => b.type !== 'road' && b.type !== 'landmark'); if (validTargets.length > 0) { const target = validTargets[Math.floor(Math.random() * validTargets.length)]; state.targetPos = new THREE.Vector3(target.x * 2 + target.width, 5, target.z * 2 + target.depth); state.state = 'FLYING_OUT'; state.flightProgress = 0; } else { state.nextActionTime = nowTs + 60000; } } } 
                  else if (state.state === 'FLYING_OUT' && state.targetPos) { state.flightProgress += 0.005; if (state.flightProgress >= 1) { state.state = 'HOVERING'; state.nextActionTime = nowTs + 60000; state.currentPos.copy(state.targetPos); } else { state.currentPos.lerpVectors(state.towerPos, state.targetPos, state.flightProgress); state.currentPos.y += Math.sin(state.flightProgress * Math.PI) * 10; anim.mesh.rotation.y = Math.atan2(state.targetPos.x - state.towerPos.x, state.targetPos.z - state.towerPos.z); anim.mesh.rotation.x = 0.5; } anim.mesh.position.copy(state.currentPos); } 
                  else if (state.state === 'HOVERING' && state.targetPos) { anim.mesh.position.set(state.targetPos.x, state.targetPos.y + Math.sin(time * 2) * 0.5, state.targetPos.z); anim.mesh.rotation.x = 0; anim.mesh.rotation.y += 0.01; if (nowTs > state.nextActionTime) { state.state = 'FLYING_BACK'; state.flightProgress = 0; } } 
                  else if (state.state === 'FLYING_BACK' && state.targetPos) { state.flightProgress += 0.005; if (state.flightProgress >= 1) { state.state = 'IDLE_TOWER'; state.nextActionTime = nowTs + 60000; state.currentPos.copy(state.towerPos); anim.mesh.rotation.x = 0; } else { state.currentPos.lerpVectors(state.targetPos, state.towerPos, state.flightProgress); state.currentPos.y += Math.sin(state.flightProgress * Math.PI) * 10; anim.mesh.rotation.y = Math.atan2(state.towerPos.x - state.targetPos.x, state.towerPos.z - state.towerPos.z); anim.mesh.rotation.x = 0.5; } anim.mesh.position.copy(state.currentPos); }
              }
          } 
          else if (anim.type === 'sync_follower' && anim.targetMesh) { const tMesh = anim.targetMesh; anim.mesh.position.x = tMesh.position.x; anim.mesh.position.z = tMesh.position.z; anim.mesh.position.y = 2.5; anim.mesh.rotation.y = tMesh.rotation.y; anim.mesh.rotation.x = 0.15; const rotor = anim.mesh.getObjectByName('main_rotor'); if (rotor) rotor.rotation.y += 0.5; const tailRotor = anim.mesh.getObjectByName('tail_rotor'); if (tailRotor) tailRotor.rotation.x += 0.5; } 
          else if (anim.type === 'agent' && anim.agentData) {
              const data = anim.agentData;
              if (data.type === 'bunny') {
                  const waitTime = data.waitTimer || 0; const state = data.state || 'idle';
                  if (state === 'waiting') { if (waitTime > 0) { data.waitTimer = waitTime - 1; anim.mesh.rotation.y += 0.05; } else { data.state = 'idle'; } } 
                  else if (state === 'idle') { const residences = buildingsRef.current.filter(b => b.type === 'res'); if (residences.length > 0) { const candidates = residences.filter(b => b.id !== data.targetBuildingId); const nextHouse = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : residences[0]; data.targetBuildingId = nextHouse.id; data.targetX = nextHouse.x * 2; data.targetZ = nextHouse.z * 2; data.hopStartPos = anim.mesh.position.clone(); data.state = 'moving'; data.progress = 0; const dx = data.targetX - anim.mesh.position.x; const dz = data.targetZ - anim.mesh.position.z; anim.mesh.rotation.y = Math.atan2(dx, dz); } } 
                  else if (state === 'moving') { const speed = 0.02; const dx = data.targetX - anim.mesh.position.x; const dz = data.targetZ - anim.mesh.position.z; const dist = Math.sqrt(dx*dx + dz*dz); if (dist < 0.2) { data.state = 'waiting'; data.waitTimer = 100; anim.mesh.position.x = data.targetX; anim.mesh.position.z = data.targetZ; anim.mesh.position.y = 0.2; } else { const moveStep = Math.min(speed, dist); const angle = Math.atan2(dx, dz); anim.mesh.position.x += Math.sin(angle) * moveStep; anim.mesh.position.z += Math.cos(angle) * moveStep; const hopFreq = 3.0; const hopHeight = 0.3; anim.mesh.position.y = 0.12 + Math.abs(Math.sin(time * hopFreq)) * hopHeight; } }
                  return; 
              }
              if (data.type === 'simpson' && data.originX !== undefined && data.originZ !== undefined) { const patrolSpeed = 0.5; const patrolRadius = 2.0; const patrolX = data.originX + Math.cos(time * patrolSpeed) * patrolRadius; const patrolZ = data.originZ + Math.sin(time * patrolSpeed) * patrolRadius; anim.mesh.position.x = patrolX; anim.mesh.position.z = patrolZ; const dx = -Math.sin(time * patrolSpeed); const dz = Math.cos(time * patrolSpeed); anim.mesh.rotation.y = Math.atan2(dx, dz); anim.mesh.position.y = 0.15 + Math.abs(Math.sin(time * 5)) * 0.1; return; }
              if (data.type === 'rare_car') { return; }
              let baseSpeed = 0.01; if (data.type === 'military') baseSpeed = 0.003; else if (data.type === 'monster') baseSpeed = 0.003; else if (data.type === 'crowd') baseSpeed = 0.003; else if (data.type === 'float') baseSpeed = 0.005;
              const moveSpeed = baseSpeed * (anim.speed || 1); 
              if (data.progress < 0) { data.progress += moveSpeed; anim.mesh.position.set(data.currentX * 2, 0.2, data.currentZ * 2); const dx = data.targetX - data.currentX; const dz = data.targetZ - data.currentZ; if (dx > 0) anim.mesh.rotation.y = Math.PI / 2; else if (dx < 0) anim.mesh.rotation.y = -Math.PI / 2; else if (dz > 0) anim.mesh.rotation.y = 0; else if (dz < 0) anim.mesh.rotation.y = Math.PI; return; }
              data.progress += moveSpeed;
              if (data.progress >= 1) {
                  data.progress = 0; const prevX = data.currentX; const prevZ = data.currentZ; data.currentX = data.targetX; data.currentZ = data.targetZ;
                  const neighbors = [ {x: data.currentX+1, z: data.currentZ}, {x: data.currentX-1, z: data.currentZ}, {x: data.currentX, z: data.currentZ+1}, {x: data.currentX, z: data.currentZ-1} ].filter(n => roadSet.has(`${n.x},${n.z}`));
                  const dx = data.targetX - prevX; const dz = data.targetZ - prevZ; const forward = {x: data.targetX + dx, z: data.targetZ + dz};
                  let next = null; const isSquad = anim.squadId !== undefined;
                  if (isSquad) { const possibleNext = neighbors.filter(n => !(n.x === prevX && n.z === prevZ)); const squadHash = stringToHash(anim.squadId!.split('-')[1]); const locHash = Math.abs(Math.sin(data.currentX * 12.9898 + data.currentZ * 78.233 + squadHash) * 43758.5453); if (possibleNext.length > 0) { const pickIndex = Math.floor(locHash * possibleNext.length) % possibleNext.length; next = possibleNext[pickIndex]; } else { next = {x: prevX, z: prevZ}; } } 
                  else { const momentumChance = 0.4; if (neighbors.some(n => n.x === forward.x && n.z === forward.z) && Math.random() < momentumChance) { next = forward; } else if (neighbors.length > 0) { const others = neighbors.filter(n => !(n.x === prevX && n.z === prevZ)); if (others.length > 0) { next = others[Math.floor(Math.random() * others.length)]; } else { next = neighbors[0]; } } else { next = {x: data.currentX, z: data.currentZ}; } }
                  data.targetX = next.x; data.targetZ = next.z;
                  const ndx = data.targetX - data.currentX; const ndz = data.targetZ - data.currentZ; if (ndx > 0) anim.mesh.rotation.y = Math.PI / 2; else if (ndx < 0) anim.mesh.rotation.y = -Math.PI / 2; else if (ndz > 0) anim.mesh.rotation.y = 0; else if (ndz < 0) anim.mesh.rotation.y = Math.PI;
              }
              const wx = (data.currentX * 2) + (data.targetX - data.currentX) * 2 * data.progress; const wz = (data.currentZ * 2) + (data.targetZ - data.currentZ) * 2 * data.progress;
              if (data.type === 'monster') { const wobbleX = Math.sin(time * 2 + (anim.offset || 0)) * 0.3; const wobbleY = Math.cos(time * 3 + (anim.offset || 0)) * 0.2; anim.mesh.position.set(wx + wobbleX, 0.35 + wobbleY, wz); anim.mesh.rotation.y += Math.sin(time * 5) * 0.05; } 
              else { anim.mesh.position.x = wx; anim.mesh.position.z = wz; if (data.type === 'crowd') { anim.mesh.position.y = 0.2 + Math.abs(Math.sin(time * 5)) * 0.1; } }
          }
          else if (anim.type === 'jesus_group') {
            const jState = jesusStateRef.current;
            if (jState.active && jState.jesusMesh) {
                const nowTs = Date.now();
                const jesusPos = jState.currentPos;
                if (jState.state === 'WALKING') {
                    if (!jState.targetPos) {
                        if (roadCoordsRef.current.length > 0) {
                            const rnd = roadCoordsRef.current[Math.floor(Math.random() * roadCoordsRef.current.length)];
                            jState.targetPos = new THREE.Vector3(rnd.x * 2, 0.2, rnd.z * 2);
                        } else { jState.targetPos = new THREE.Vector3(0, 0.2, 0); }
                    }
                    const dist = jesusPos.distanceTo(jState.targetPos);
                    if (dist < 0.2) {
                        jState.state = 'PREACHING'; jState.preachTimerEnd = nowTs + 120000; jState.targetPos = null;
                    } else {
                        const dir = new THREE.Vector3().subVectors(jState.targetPos, jesusPos).normalize();
                        jesusPos.add(dir.multiplyScalar(0.02));
                        const targetAngle = Math.atan2(dir.x, dir.z);
                        let angleDiff = targetAngle - jState.facingAngle;
                        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                        jState.facingAngle += angleDiff * 0.1;
                    }
                } else if (jState.state === 'PREACHING') {
                    if (nowTs > jState.preachTimerEnd) { jState.state = 'WALKING'; }
                    jState.facingAngle += Math.sin(time * 1.5) * 0.002;
                }
                jState.jesusMesh.position.copy(jesusPos); jState.jesusMesh.rotation.y = jState.facingAngle;
                jState.apostles.forEach((ap, idx) => {
                    const row = Math.floor(idx / 3) + 1; const col = (idx % 3) - 1; const spacing = 1.0;
                    const idealLocalX = col * spacing + Math.sin(time + idx) * 0.2;
                    const idealLocalZ = -(row * spacing * 1.1);
                    const cosR = Math.cos(jState.facingAngle); const sinR = Math.sin(jState.facingAngle);
                    const worldOffX = idealLocalX * cosR + idealLocalZ * sinR;
                    const worldOffZ = -idealLocalX * sinR + idealLocalZ * cosR;
                    ap.mesh.position.x += ((jesusPos.x + worldOffX) - ap.mesh.position.x) * 0.04;
                    ap.mesh.position.z += ((jesusPos.z + worldOffZ) - ap.mesh.position.z) * 0.04;
                    ap.mesh.lookAt(jesusPos);
                });
            }
        }
        // DANÇA DA FESTA JUNINA (Quadrilha em volta da fogueira)
        else if (anim.type === 'caipira_dance') {
            const data = anim.mesh.userData;
            if (data.centerX !== undefined && data.centerZ !== undefined) {
                const danceSpeed = 0.75; // Velocidade da roda
                const angle = time * danceSpeed + data.offset;
                const radius = 0.8 + Math.sin(time * 4 + data.offset) * 0.1; // Vai e volta levemente
                
                // Orbitar a fogueira
                anim.mesh.position.x = data.centerX + Math.cos(angle) * radius;
                anim.mesh.position.z = data.centerZ + Math.sin(angle) * radius;
                
                // Pulinho da dança
                anim.mesh.position.y = 0.1 + Math.abs(Math.sin(time * 8 + data.offset)) * 0.15;
                
                // Olhar para a fogueira (Centro)
                anim.mesh.lookAt(data.centerX, 0.25, data.centerZ);
            }
        }
      });
      controls.update(); renderer.render(scene, camera);
    };
    animate();
    const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key.toLowerCase()] = true; if(e.key === 'Escape' && onCancelPlacement) onCancelPlacement(); };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key.toLowerCase()] = false; };
    const handleResize = () => { if (!mountRef.current) return; const w = mountRef.current.clientWidth; const h = mountRef.current.clientHeight; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); };
    window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp); window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); window.removeEventListener('resize', handleResize); if (mountRef.current && renderer.domElement) { mountRef.current.removeChild(renderer.domElement); } renderer.dispose(); controls.dispose(); };
  }, []); 
  useEffect(() => {
      if(!ghostRef.current) return;
      if (!placementMode?.active || !placementMode.landmarkId || !landmarkCatalog) { ghostRef.current.visible = false; document.body.style.cursor = 'default'; return; }
      document.body.style.cursor = 'crosshair';
      const item = landmarkCatalog.find(l => l.id === placementMode.landmarkId); if(item) { ghostRef.current.scale.set(item.w * 2, 5, item.d * 2); ghostRef.current.visible = true; }
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
    if (!mountRef.current || !cameraRef.current) return;
    const rect = mountRef.current.getBoundingClientRect(); const x = ((event.clientX - rect.left) / rect.width) * 2 - 1; const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycasterRef.current.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);
    if (placementMode?.active && groundRef.current && ghostRef.current && landmarkCatalog) {
        const intersects = raycasterRef.current.intersectObject(groundRef.current);
        if (intersects.length > 0) {
            const hit = intersects[0].point; const gridX = Math.floor(hit.x / 2); const gridZ = Math.floor(hit.z / 2);
            const item = landmarkCatalog.find(l => l.id === placementMode.landmarkId); const w = item ? item.w : 1; const d = item ? item.d : 1;
            ghostRef.current.position.set(gridX * 2 + w - 1, 2.5, gridZ * 2 + d - 1);
            const isValid = checkPlacementValidity(gridX, gridZ, w, d); (ghostRef.current.material as THREE.MeshBasicMaterial).color.setHex(isValid ? 0x00ff00 : 0xff0000);
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
        const rect = mountRef.current!.getBoundingClientRect(); const x = ((event.clientX - rect.left) / rect.width) * 2 - 1; const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycasterRef.current.setFromCamera(new THREE.Vector2(x, y), cameraRef.current!);
        const intersects = raycasterRef.current.intersectObject(groundRef.current);
        if (intersects.length > 0) {
            const hit = intersects[0].point; const gridX = Math.floor(hit.x / 2); const gridZ = Math.floor(hit.z / 2);
            const item = landmarkCatalog.find(l => l.id === placementMode.landmarkId); if (item) { const isValid = checkPlacementValidity(gridX, gridZ, item.w, item.d); if (isValid) { onConfirmPlacement(gridX, gridZ); } }
        }
      }
  };
  const handleMouseLeave = () => { if (hoverTimeoutRef.current) { clearTimeout(hoverTimeoutRef.current); hoverTimeoutRef.current = null; } setTooltip(null); };
  useEffect(() => {
    if (!buildingsGroupRef.current) return;
    const group = buildingsGroupRef.current;
    const registerAnim = (def: AnimatedObjectDef) => { animatedObjectsRef.current.push(def); };
    const visualStateChanged = prevVisualStateRef.current.isNight !== isNight || prevVisualStateRef.current.activeEvent !== activeEvent;
    if (visualStateChanged) { renderedBuildingsRef.current.forEach((obj) => { group.remove(obj); disposeHierarchy(obj); }); renderedBuildingsRef.current.clear(); animatedObjectsRef.current = []; }
    prevVisualStateRef.current = { isNight, activeEvent };
    const currentIds = new Set(buildings.map(b => b.id));
    for (const [id, object] of renderedBuildingsRef.current.entries()) { if (!currentIds.has(id)) { group.remove(object); disposeHierarchy(object); renderedBuildingsRef.current.delete(id); } }
    const now = new Date(); const season = getSeasonSouthernHemisphere(now).name;
    const roadSet = new Set<string>(); const roadCoords: {x:number, z:number}[] = [];
    buildings.forEach(b => { if (b.type === 'road') { roadSet.add(`${b.x},${b.z}`); roadCoords.push({x: b.x, z: b.z}); } });
    roadSetRef.current = roadSet; roadCoordsRef.current = roadCoords;
    buildings.forEach(building => {
      if (renderedBuildingsRef.current.has(building.id)) return;
      setSeed(building.x * 1234 + building.z * 5678);
      const x = building.x * 2; const z = building.z * 2; const rotation = building.rotation * (Math.PI / 2);
      let lot = new THREE.Group(); lot.userData = { type: building.type, label: getBuildingLabel(building.type, building.style, building.variant) };
      if (building.type === 'road') {
          const neighbors = { left: roadSet.has(`${building.x - 1},${building.z}`), right: roadSet.has(`${building.x + 1},${building.z}`), top: roadSet.has(`${building.x},${building.z - 1}`), bottom: roadSet.has(`${building.x},${building.z + 1}`) };
          createRoad(lot, building.x, building.z, neighbors, isNight, activeEvent);
          
          // Lógica de Natal
          if (activeEvent === 'christmas') { lot.traverse((child) => { if (child instanceof THREE.Mesh && child.userData && child.userData.type === 'xmas_light') { registerAnim({ mesh: child, type: 'blink' }); } }); }
          
          // Lógica de Festa Junina: Extrair caipiras para animar (evita que fiquem estáticos na otimização)
          if (activeEvent === 'junina') {
              const caipiras: THREE.Object3D[] = [];
              lot.traverse((c) => { if (c.userData && c.userData.type === 'caipira') caipiras.push(c); });
              
              // Remove do lote bruto
              caipiras.forEach(c => lot.remove(c));
              
              // Otimiza o lote (rua + postes + fogueira viram um mesh só)
              lot = optimizeBuildingGeometry(lot);
              
              // Readiciona os caipiras como objetos independentes no lote final
              caipiras.forEach(c => {
                  lot.add(c);
                  registerAnim({ mesh: c, type: 'caipira_dance' });
              });
          } else {
              lot = optimizeBuildingGeometry(lot);
          }

          group.add(lot); renderedBuildingsRef.current.set(building.id, lot); return; 
      }
      let effectiveW = building.width; let effectiveD = building.depth; if (building.rotation % 2 !== 0) { effectiveW = building.depth; effectiveD = building.width; }
      const centerX = x + (effectiveW - 1); const centerZ = z + (effectiveD - 1);
      const sizeW = building.width * 1.95; const sizeD = building.depth * 1.95;
      const lotGrassColor = 0x4a7c4a;
      lot.add(createBox(sizeW, 0.05, sizeD, lotGrassColor, 0, 0.03, 0, isNight));
      const { style, variant, isRare } = building;
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
      group.add(lot); renderedBuildingsRef.current.set(building.id, lot);
    });
    let agentGroup = group.getObjectByName('agents') as THREE.Group;
    if (!agentGroup) { agentGroup = new THREE.Group(); agentGroup.name = 'agents'; group.add(agentGroup); }
    while(agentGroup.children.length > 0) { agentGroup.remove(agentGroup.children[0]); }
    animatedObjectsRef.current = animatedObjectsRef.current.filter(ao => ao.type !== 'agent' && ao.type !== 'santa' && ao.type !== 'bunny' && ao.type !== 'simpson' && ao.type !== 'rare_car' && ao.type !== 'iron_man' && ao.type !== 'sync_follower');
    const starkTower = buildings.find(b => b.style === 'stark_tower');
    if (starkTower) {
        const ironManMesh = createIronManMesh(isNight); agentGroup.add(ironManMesh);
        const towerX = starkTower.x * 2 + 1; const towerZ = starkTower.z * 2 + 1;
        if (!ironManStateRef.current) { const waitTime = (45 + Math.random() * 15) * 60 * 1000; ironManStateRef.current = { state: 'IDLE_TOWER', nextActionTime: Date.now() + waitTime, towerPos: new THREE.Vector3(towerX, 12.0, towerZ), targetPos: null, currentPos: new THREE.Vector3(towerX, 12.0, towerZ), currentRot: 0, flightProgress: 0 }; } else { ironManStateRef.current.towerPos.set(towerX, 12.0, towerZ); }
        ironManMesh.position.copy(ironManStateRef.current.currentPos); registerAnim({ mesh: ironManMesh, type: 'iron_man' });
    } else { ironManStateRef.current = null; }
    animatedObjectsRef.current = animatedObjectsRef.current.filter(ao => ao.type !== 'jesus_group');
    const savedData = localStorage.getItem('citytask_save_v1');
    let totalPerfectDays = 0;
    if (savedData) { try { totalPerfectDays = JSON.parse(savedData).gameState?.totalPerfectDays || 0; } catch (e) {} }

    if (totalPerfectDays >= 33 && roadCoordsRef.current.length > 0) {
        const prevJesus = agentGroup.getObjectByName('jesus_main'); if (prevJesus) agentGroup.remove(prevJesus);
        for(let i=0; i<12; i++) { const prevAp = agentGroup.getObjectByName(`apostle_${i}`); if(prevAp) agentGroup.remove(prevAp); }

        const jMesh = createJesusMesh(isNight); jMesh.name = 'jesus_main';
        const spawnPoint = roadCoordsRef.current[0];
        const spawnX = spawnPoint.x * 2; const spawnZ = spawnPoint.z * 2;
        
        if (jesusStateRef.current.active && jesusStateRef.current.currentPos) {
            jMesh.position.copy(jesusStateRef.current.currentPos);
        } else {
            jMesh.position.set(spawnX, 0.2, spawnZ); jesusStateRef.current.currentPos.set(spawnX, 0.2, spawnZ);
        }
        agentGroup.add(jMesh);

        const apostlesData = [];
        for(let i=0; i<12; i++) {
            const apMesh = createApostleMesh(i, isNight); apMesh.name = `apostle_${i}`;
            apMesh.position.set(jMesh.position.x + (Math.random()-0.5)*2, 0.2, jMesh.position.z + (Math.random()-0.5)*2);
            agentGroup.add(apMesh);
            apostlesData.push({ mesh: apMesh, offset: new THREE.Vector2(0, 0) });
        }
        jesusStateRef.current.active = true; jesusStateRef.current.jesusMesh = jMesh; jesusStateRef.current.apostles = apostlesData;
        if (!jesusStateRef.current.targetPos) jesusStateRef.current.state = 'WALKING';
        registerAnim({ mesh: jMesh, type: 'jesus_group' });
    }
    if (unlockedVehiclesRef.current.length > 0 && roadCoordsRef.current.length > 0) {
        unlockedVehiclesRef.current.forEach(carType => {
            const mesh = createRareVehicleMesh(carType, isNight); const spawnPoint = roadCoordsRef.current[Math.floor(Math.random() * roadCoordsRef.current.length)]; mesh.position.set(spawnPoint.x * 2, 0.2, spawnPoint.z * 2); agentGroup.add(mesh); registerAnim({ mesh, type: 'rare_car', agentData: { currentX: spawnPoint.x, currentZ: spawnPoint.z, targetX: spawnPoint.x, targetZ: spawnPoint.z, progress: 0, type: 'rare_car', subtype: carType, path: [] } });
        });
    }
    const simpsonsHouse = buildings.find(b => b.style === 'simpsons_house');
    if (simpsonsHouse) {
        const characters = ['Homer', 'Marge', 'Bart', 'Lisa', 'Maggie']; const selectedChar = characters[new Date().getDay() % characters.length];
        const simpsonMesh = createAgentMesh('simpson', isNight, selectedChar); const houseWorldX = simpsonsHouse.x * 2 + 1; const houseWorldZ = simpsonsHouse.z * 2; simpsonMesh.position.set(houseWorldX, 0.2, houseWorldZ + 1.5); agentGroup.add(simpsonMesh); registerAnim({ mesh: simpsonMesh, type: 'agent', agentData: { currentX: houseWorldX, currentZ: houseWorldZ, targetX: 0, targetZ: 0, progress: 0, type: 'simpson', originX: houseWorldX, originZ: houseWorldZ } });
    }
    if (activeEvent === 'christmas') { const santaMesh = createAgentMesh('santa', isNight); agentGroup.add(santaMesh); registerAnim({ mesh: santaMesh, type: 'santa' }); }
    else if (activeEvent === 'easter') {
        const residences = buildings.filter(b => b.type === 'res'); let spawnX = 0, spawnZ = 0; if (residences.length > 0) { const startHouse = residences[Math.floor(Math.random() * residences.length)]; spawnX = startHouse.x * 2; spawnZ = startHouse.z * 2; }
        const bunnyMesh = createAgentMesh('bunny', isNight); bunnyMesh.position.set(spawnX, 0, spawnZ); agentGroup.add(bunnyMesh); registerAnim({ mesh: bunnyMesh, type: 'agent', agentData: { currentX: spawnX, currentZ: spawnZ, targetX: spawnX, targetZ: spawnZ, progress: 0, type: 'bunny', state: 'idle', waitTimer: 0 } });
    }
    else if (activeEvent !== 'none' && roadCoords.length > 0) {
        const spawnPool = roadCoords; 
        const spawnAgents = (type: 'float'|'military'|'monster'|'crowd', count: number) => {
            const isSquad = type === 'military' || type === 'float';
            const sharedStartNode = spawnPool[Math.floor(Math.random() * spawnPool.length)];
            const sharedNeighbors = [ {x: sharedStartNode.x+1, z: sharedStartNode.z}, {x: sharedStartNode.x-1, z: sharedStartNode.z}, {x: sharedStartNode.x, z: sharedStartNode.z+1}, {x: sharedStartNode.x, z: sharedStartNode.z-1} ].filter(n => roadSet.has(`${n.x},${n.z}`));
            const sharedTarget = sharedNeighbors.length > 0 ? sharedNeighbors[0] : sharedStartNode;
            for(let i=0; i<count; i++) {
                const startNode = isSquad ? sharedStartNode : spawnPool[Math.floor(Math.random() * spawnPool.length)];
                const possibleTargets = [ {x: startNode.x+1, z: startNode.z}, {x: startNode.x-1, z: startNode.z}, {x: startNode.x, z: sharedStartNode.z+1}, {x: startNode.x, z: sharedStartNode.z-1} ].filter(n => roadSet.has(`${n.x},${n.z}`));
                const targetNode = isSquad ? sharedTarget : (possibleTargets.length > 0 ? possibleTargets[0] : startNode);
                const agentMesh = createAgentMesh(type, isNight); agentMesh.position.set(startNode.x * 2, 0.2, startNode.z * 2); agentGroup.add(agentMesh);
                registerAnim({ 
                    mesh: agentMesh, 
                    type: 'agent', 
                    squadId: isSquad ? `squad-${type}-${i}` : undefined, 
                    rank: 0, 
                    offset: Math.random() * 10, 
                    agentData: { currentX: startNode.x, currentZ: startNode.z, targetX: targetNode.x, targetZ: targetNode.z, progress: isSquad ? -i * 0.75 : 0, type } 
                });
                if (type === 'military') {
                    let spawnHeli = false;
                    if (i === 0) spawnHeli = true; else if (i === 2 && count >= 4) spawnHeli = true; else if (i === 4 && count >= 6) spawnHeli = true; else if (i === 6 && count >= 8) spawnHeli = true;
                    if (spawnHeli) { const heliMesh = createHelicopterMesh(isNight); heliMesh.position.set(startNode.x * 2, 2.5, startNode.z * 2); agentGroup.add(heliMesh); registerAnim({ mesh: heliMesh, type: 'sync_follower', targetMesh: agentMesh, offset: Math.random() * 10 }); }
                }
            }
        };
        const scaledCount = Math.min(8, 3 + Math.floor(population / 10000));
        if (activeEvent === 'carnival') { spawnAgents('float', scaledCount); spawnAgents('crowd', 50); } 
        else if (activeEvent === 'independence') { spawnAgents('military', scaledCount); } 
        else if (activeEvent === 'halloween') { const baseGhosts = 20; const extraGhosts = Math.floor(population / 10000) * 20; const ghostCount = Math.min(120, baseGhosts + extraGhosts); spawnAgents('monster', ghostCount); }
    }
  }, [buildings, isNight, activeEvent, population, unlockedVehicles]); 
  return (
    <>
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-move active:cursor-grabbing focus:outline-none" 
        tabIndex={0}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onMouseEnter={(e) => e.currentTarget.focus()}
        title="Clique e arraste para mover, Scroll para zoom, WASD para navegar"
      />
      {tooltip && !placementMode?.active && (
          <div 
              className="fixed z-[60] bg-black/80 text-white text-xs font-medium px-3 py-1.5 rounded-lg pointer-events-none transform -translate-x-1/2 -translate-y-full border border-white/20 shadow-lg backdrop-blur-sm whitespace-nowrap animate-in fade-in zoom-in duration-200"
              style={{ left: tooltip.x, top: tooltip.y - 15 }}
          >
              {tooltip.text}
          </div>
      )}
    </>
  );
};
export default City3D;
