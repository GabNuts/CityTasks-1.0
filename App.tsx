
import React, { useState, useEffect, useRef, useCallback } from 'react';
import TaskList from './components/TaskList';
import CityDisplay from './components/CityDisplay';
import ClockWidget from './components/ClockWidget';
import MediaPlayer from './components/MediaPlayer';
import { Task, TaskDifficulty, CityStats, Building, BuildingType, GameState } from './types';
import { calculateCityMaintenance } from './utils/cityHelpers';
import { getGameDateString } from './utils/timeHelpers';

// Simple ID generator
const generateId = () => Math.random().toString(36).substring(2, 9);

const INITIAL_STATS: CityStats = {
  population: 0,
  budget: 100,
  level: 1,
  residentialCount: 0,
  commercialCount: 0,
  industrialCount: 0,
  parksCount: 0,
  govCount: 0,
  // Usa o dia ajustado para inicialização
  lastLoginDate: getGameDateString(), 
  dailyCost: 150 // Updated Base cost
};

const INITIAL_GAME_STATE: GameState = {
  createdAt: Date.now(),
  lastPerfectDay: null,
  perfectDayStreak: 0,
  totalPerfectDays: 0,
  claimedMilestones: [],
  unlockedLandmarks: [],
  landmarkInventory: [],
  budgetMilestonesReached: [], 
  specialBuildingQueue: [],
  unlockedVehicles: [] // Init empty
};

// Limite lógico do mapa
const MAP_LIMIT = 120;
const BLOCK_SIZE = 3; // OBRIGATÓRIO: Ruas a cada 3 tiles. Área útil interna: 2x2.

// --- CATALOGS ---

const LANDMARK_CATALOG = [
  { id: 'corinthians_arena', name: 'Estádio do Corinthians', w: 4, d: 4 },
  { id: 'temple_delphi', name: 'Templo de Delphos', w: 4, d: 2 },
  { id: 'stonehenge', name: 'Stonehenge', w: 2, d: 2 },
  { id: 'simpsons_house', name: 'Casa dos Simpsons', w: 2, d: 1 },
  { id: 'stark_tower', name: 'Torre Stark', w: 2, d: 2 },
  { id: 'disney_castle', name: 'Disney Orlando', w: 4, d: 4 },
  { id: 'nasa_hq', name: 'NASA Building', w: 4, d: 4 },
  { id: 'pentagon', name: 'O Pentágono', w: 4, d: 4 },
  { id: 'vegas_sphere', name: 'The Sphere', w: 4, d: 4 },
  { id: 'masp_museum', name: 'MASP', w: 4, d: 4 }
];

const SPECIAL_BUILDINGS = [
    // Commercial
    { id: 'com_mcdonalds', type: 'com' as BuildingType, name: "McDonald's" },
    { id: 'com_starbucks', type: 'com' as BuildingType, name: "Starbucks" },
    { id: 'com_hardrock', type: 'com' as BuildingType, name: "Hard Rock Cafe" },
    { id: 'com_centralperk', type: 'com' as BuildingType, name: "Central Perk" },
    { id: 'com_carrefour', type: 'com' as BuildingType, name: "Carrefour" },
    
    // Industrial
    { id: 'ind_coca', type: 'ind' as BuildingType, name: "Coca-Cola Factory" },
    { id: 'ind_nike', type: 'ind' as BuildingType, name: "Nike Factory" },
    { id: 'ind_apple', type: 'ind' as BuildingType, name: "Apple Factory" },
    { id: 'ind_ford', type: 'ind' as BuildingType, name: "Ford Factory" },
    { id: 'ind_nvidia', type: 'ind' as BuildingType, name: "NVidia Factory" }
];

const RARE_CARS_LIST = [
    { id: 'delorean', name: 'DeLorean (Back to the Future)' },
    { id: 'ecto1', name: 'Ecto-1 (Caça-Fantasmas)' },
    { id: 'jp_jeep', name: 'Jipe do Parque dos Dinossauros' },
    { id: 'tron_bike', name: 'Moto de Luz (Tron)' },
    { id: 'batmobile', name: 'Batmóvel' },    
    { id: 'ghost_rider', name: 'Moto do Motoqueiro Fantasma' },
    { id: 'mystery_machine', name: 'Van do Scooby Doo' },
    { id: 'mcqueen', name: 'Relâmpago McQueen' },
    { id: 'bumblebee', name: 'Bumblebee' },
    { id: 'optimus', name: 'Optimus Prime' },
    { id: 'skyline', name: 'Nissan Skyline GT-R (2F2F)' },
    { id: 'penelope', name: 'Carro da Penélope Charmosa' },
    { id: 'ae86', name: 'AE86 Trueno (Initial D)' }
];

const BUILDING_CATALOG = {
  gov: {
    1: [
      { id: 'police_station', w: 2, d: 2 },
      { id: 'fire_station', w: 2, d: 2 },
      { id: 'school', w: 2, d: 2 },
      { id: 'medical_clinic', w: 2, d: 2 }
    ]
  },
  res: {
    1: [
      { id: 'cottage', w: 1, d: 1 },
      { id: 'modern', w: 1, d: 1 },
      { id: 'barn', w: 1, d: 1 },
      { id: 'european', w: 1, d: 1 }
    ],
    2: [
      { id: 'luxury_home', w: 1, d: 1 }, 
      { id: 'condo_low', w: 2, d: 1 },   
      { id: 'mansion', w: 2, d: 1 }      
    ],
    3: [
      { id: 'condo_med', w: 2, d: 1 },    
      { id: 'condo_high', w: 2, d: 1 },   
      { id: 'skyscraper_res', w: 2, d: 2 } 
    ]
  },
  com: {
    1: [
      { id: 'general_store', w: 2, d: 1 }, 
      { id: 'cafe_pizza', w: 2, d: 1 },
      { id: 'mini_market', w: 2, d: 1 }
    ],
    2: [
      { id: 'office_small', w: 2, d: 1 }, 
      { id: 'big_store', w: 2, d: 2 }     
    ],
    3: [
      { id: 'office_tower', w: 2, d: 2 }, 
      { id: 'mall', w: 2, d: 2 }          
    ]
  },
  ind: {
    1: [
      { id: 'workshop', w: 2, d: 1 }, 
      { id: 'textile', w: 2, d: 1 }
    ],
    2: [
      { id: 'clean_factory', w: 2, d: 1 }, 
      { id: 'logistics', w: 2, d: 2 }      
    ],
    3: [
      { id: 'hightech', w: 2, d: 2 } 
    ]
  },
  park: {
    1: [
      { id: 'plaza', w: 1, d: 1 },
      { id: 'nature', w: 1, d: 1 }
    ],
    2: [
      { id: 'sports', w: 2, d: 1 }, 
    ],
    3: [
      { id: 'botanical', w: 2, d: 1 }, 
      { id: 'central_park', w: 2, d: 2 } 
    ]
  }
};

export default function App() {
  // --- STATE ---
  const [isLoaded, setIsLoaded] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<CityStats>(INITIAL_STATS);
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [buildings, setBuildings] = useState<Building[]>([]);
  
  // Placement Mode State
  const [placementMode, setPlacementMode] = useState<{ active: boolean, landmarkId: string | null }>({ active: false, landmarkId: null });

  // --- OPTIMIZATION: OCCUPANCY GRID ---
  const occupiedTilesRef = useRef<Set<string>>(new Set());
  const roadTilesRef = useRef<Set<string>>(new Set()); 

  const rebuildOccupancyMap = useCallback((currentBuildings: Building[]) => {
      const newSet = new Set<string>();
      const newRoadSet = new Set<string>();
      
      currentBuildings.forEach(b => {
          let effW = b.width;
          let effD = b.depth;
          if (b.rotation % 2 !== 0) { effW = b.depth; effD = b.width; }
          
          for (let i = 0; i < effW; i++) {
              for (let j = 0; j < effD; j++) {
                  const key = `${b.x + i},${b.z + j}`;
                  newSet.add(key);
                  if (b.type === 'road') newRoadSet.add(key);
              }
          }
      });
      occupiedTilesRef.current = newSet;
      roadTilesRef.current = newRoadSet;
  }, []);

  useEffect(() => {
      if (buildings.length > 0) {
          rebuildOccupancyMap(buildings);
          const currentDailyCost = calculateCityMaintenance(buildings);
          setStats(prev => ({...prev, dailyCost: currentDailyCost}));
      }
  }, [buildings, rebuildOccupancyMap]);

  const markOccupied = (x: number, z: number, w: number, d: number, rotation: number, type: BuildingType) => {
      let effW = w;
      let effD = d;
      if (rotation % 2 !== 0) { effW = d; effD = w; }
      for (let i = 0; i < effW; i++) {
          for (let j = 0; j < effD; j++) {
              const key = `${x + i},${z + j}`;
              occupiedTilesRef.current.add(key);
              if (type === 'road') roadTilesRef.current.add(key);
          }
      }
  };

  // --- PERSISTENCE & MAINTENANCE LOGIC ---
  useEffect(() => {
    // LOAD GAME
    const savedData = localStorage.getItem('citytask_save_v1');
    const todayGameDate = getGameDateString(); // <--- Changed: Uses Virtual Day (Start 7 AM)

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.tasks) setTasks(parsed.tasks);
        
        let loadedStats = parsed.stats || INITIAL_STATS;
        if (!loadedStats.lastLoginDate) loadedStats.lastLoginDate = todayGameDate; 
        if (loadedStats.dailyCost === undefined) loadedStats.dailyCost = 150;

        let loadedGameState = parsed.gameState || INITIAL_GAME_STATE;
        if (!loadedGameState.unlockedVehicles) loadedGameState.unlockedVehicles = [];

        // --- MAINTENANCE & DAILY EVENTS ---
        if (loadedStats.lastLoginDate !== todayGameDate) {
            const lastLogin = new Date(loadedStats.lastLoginDate);
            const now = new Date(todayGameDate);
            const diffTime = Math.abs(now.getTime() - lastLogin.getTime());
            const daysMissed = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            const currentBuildings = parsed.buildings || [];
            const dailyCost = calculateCityMaintenance(currentBuildings);
            
            const totalDeduction = dailyCost * daysMissed;
            loadedStats.budget -= totalDeduction;
            loadedStats.dailyCost = dailyCost;
            loadedStats.lastLoginDate = todayGameDate;

            if (daysMissed >= 4 && loadedStats.budget < 0) {
                const popLoss = Math.floor(loadedStats.population * 0.10); 
                loadedStats.population = Math.max(0, loadedStats.population - popLoss);
                if (popLoss > 0) {
                    console.warn(`A cidade sofreu com o abandono! -${popLoss} habitantes.`);
                }
            }

            // --- RARE CAR SPAWN CHANCE (1% DAILY) ---
            const unlocked = loadedGameState.unlockedVehicles || [];
            const availableCars = RARE_CARS_LIST.filter(c => !unlocked.includes(c.id));
            
            if (availableCars.length > 0) {
                // Chance: 1%
                if (Math.random() < 0.03) {
                    const wonCar = availableCars[Math.floor(Math.random() * availableCars.length)];
                    loadedGameState.unlockedVehicles.push(wonCar.id);
                    alert(`🚗 EVENTO RARO! Um veículo lendário apareceu na cidade: ${wonCar.name}!`);
                }
            }
        }

        setStats(loadedStats);
        setGameState(loadedGameState);

        if (parsed.buildings) {
            setBuildings(parsed.buildings);
            rebuildOccupancyMap(parsed.buildings);
        }
      } catch (e) {
        console.error("Erro ao carregar save:", e);
      }
    } else {
        const initialRoads: Building[] = [];
        for(let x=0; x<=3; x++) initialRoads.push({id: generateId(), type: 'road', x: x, z: 0, rotation: 0, width: 1, depth: 1, levelTier: 1, style: 'road', variant: 0, isRare: false});
        for(let x=0; x<=3; x++) initialRoads.push({id: generateId(), type: 'road', x: x, z: 3, rotation: 0, width: 1, depth: 1, levelTier: 1, style: 'road', variant: 0, isRare: false});
        for(let z=1; z<3; z++) initialRoads.push({id: generateId(), type: 'road', x: 0, z: z, rotation: 0, width: 1, depth: 1, levelTier: 1, style: 'road', variant: 0, isRare: false});
        for(let z=1; z<3; z++) initialRoads.push({id: generateId(), type: 'road', x: 3, z: z, rotation: 0, width: 1, depth: 1, levelTier: 1, style: 'road', variant: 0, isRare: false});
        
        setBuildings(initialRoads);
        rebuildOccupancyMap(initialRoads);
    }
    setIsLoaded(true);
  }, [rebuildOccupancyMap]);

  useEffect(() => {
    // SAVE GAME
    if (isLoaded) {
      const dataToSave = {
        tasks,
        stats,
        buildings,
        gameState
      };
      localStorage.setItem('citytask_save_v1', JSON.stringify(dataToSave));
    }
  }, [tasks, stats, buildings, gameState, isLoaded]);

  // --- SAVE BACKUP MANAGEMENT ---
  const handleExportSave = () => {
      const saveString = localStorage.getItem('citytask_save_v1');
      if (!saveString) { alert("Sem dados para salvar."); return; }
      const blob = new Blob([saveString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `citytask_backup_${getGameDateString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleImportSave = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      if (!confirm("Isso irá sobrescrever seu progresso atual. Deseja continuar?")) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const json = ev.target?.result as string;
          // Basic validation
          const parsed = JSON.parse(json);
          if (parsed && parsed.stats && parsed.buildings) {
              localStorage.setItem('citytask_save_v1', json);
              alert("Backup restaurado com sucesso! A página será recarregada.");
              window.location.reload();
          } else {
              throw new Error("Invalid structure");
          }
        } catch (err) {
          alert("Erro: Arquivo de save inválido ou corrompido.");
        }
      };
      reader.readAsText(file);
  };

  // --- CHEAT FUNCTIONS ---
  const handleCheatBudget = () => {
      setStats(prev => ({ ...prev, budget: prev.budget + 10000 }));
      alert("CHEAT ATIVADO: +10.000 no Orçamento!");
  };

  const handleCheatPopulation = () => {
      setStats(prev => ({ ...prev, population: prev.population + 5000 }));
      alert("CHEAT ATIVADO: +5.000 Habitantes!");
  };

  const handleUnlockVehicles = () => {
      const allCarIds = RARE_CARS_LIST.map(c => c.id);
      setGameState(prev => ({
          ...prev,
          unlockedVehicles: Array.from(new Set([...prev.unlockedVehicles, ...allCarIds]))
      }));
      alert("CHEAT ATIVADO: Todos os veículos raros foram desbloqueados e aparecerão nas ruas!");
  };

  // --- CITY BUILDING LOGIC ---
  const checkCollisionFast = (x: number, z: number, width: number, depth: number, rotation: number) => {
    let effectiveW = width;
    let effectiveD = depth;
    if (rotation % 2 !== 0) { effectiveW = depth; effectiveD = width; }
    
    if (x < -MAP_LIMIT || x + effectiveW > MAP_LIMIT || z < -MAP_LIMIT || z + effectiveD > MAP_LIMIT) return true;

    for (let i = 0; i < effectiveW; i++) {
        for (let j = 0; j < effectiveD; j++) {
            if (occupiedTilesRef.current.has(`${x + i},${z + j}`)) {
                return true;
            }
        }
    }
    return false;
  };

  const ensureBlockRoads = (originX: number, originZ: number, bList: Building[]) => {
      const roadCandidates = [];
      for(let x = 0; x <= BLOCK_SIZE; x++) roadCandidates.push({x: originX + x, z: originZ});
      for(let x = 0; x <= BLOCK_SIZE; x++) roadCandidates.push({x: originX + x, z: originZ + BLOCK_SIZE});
      for(let z = 1; z < BLOCK_SIZE; z++) roadCandidates.push({x: originX, z: originZ + z});
      for(let z = 1; z < BLOCK_SIZE; z++) roadCandidates.push({x: originX + BLOCK_SIZE, z: originZ + z});

      roadCandidates.forEach(cand => {
          if (!checkCollisionFast(cand.x, cand.z, 1, 1, 0)) {
              bList.push({
                  id: generateId(), type: 'road', x: cand.x, z: cand.z, rotation: 0, width: 1, depth: 1,
                  levelTier: 1, style: 'road', variant: 0, isRare: false
              });
              markOccupied(cand.x, cand.z, 1, 1, 0, 'road'); 
          }
      });
  };

  const getSmartRotation = (x: number, z: number, w: number, d: number) => {
      const isRoad = (tx: number, tz: number) => roadTilesRef.current.has(`${tx},${tz}`);
      for (let i=0; i<w; i++) if (isRoad(x+i, z+d)) return 0;
      for (let i=0; i<w; i++) if (isRoad(x+i, z-1)) return 2;
      for (let i=0; i<d; i++) if (isRoad(x-1, z+i)) return 1;
      for (let i=0; i<d; i++) if (isRoad(x+d, z+i)) return 3; 
      return 0; 
  };

  const findGridSpot = (width: number, depth: number, candidateType: BuildingType, currentList: Building[]) => {
    let bx = 0; let bz = 0; let dx = 0; let dz = -1;
    let t = Math.max(Math.abs(bx), Math.abs(bz));
    
    const maxIter = 1000; 

    for (let i = 0; i < maxIter; i++) {
        const originX = bx * BLOCK_SIZE;
        const originZ = bz * BLOCK_SIZE;
        
        const buildingsInBlock = currentList.filter(b => 
            b.x > originX && b.x < originX + BLOCK_SIZE &&
            b.z > originZ && b.z < originZ + BLOCK_SIZE &&
            b.type !== 'road'
        );

        let isCompatible = true;
        if (buildingsInBlock.length > 0) {
            const hasRes = buildingsInBlock.some(b => b.type === 'res');
            const hasPark = buildingsInBlock.some(b => b.type === 'park');
            const hasCom = buildingsInBlock.some(b => b.type === 'com');
            const hasInd = buildingsInBlock.some(b => b.type === 'ind');

            if (candidateType === 'res' || candidateType === 'park') {
                if (hasCom || hasInd) isCompatible = false;
            }
            else if (candidateType === 'com') {
                if (hasRes || hasPark || hasInd) isCompatible = false;
            }
            else if (candidateType === 'ind') {
                if (hasRes || hasPark || hasCom) isCompatible = false;
            }
        }

        if (isCompatible) {
            const zoneX = originX + 1;
            const zoneZ = originZ + 1;
            const zoneW = 2;
            const zoneH = 2;

            const candidates = [];
            for (let oz = 0; oz < zoneH; oz++) {
                for (let ox = 0; ox < zoneW; ox++) {
                    candidates.push({x: zoneX + ox, z: zoneZ + oz});
                }
            }
            
            for (let j = candidates.length - 1; j > 0; j--) {
                const k = Math.floor(Math.random() * (j + 1));
                [candidates[j], candidates[k]] = [candidates[k], candidates[j]];
            }

            for (const pos of candidates) {
                if (pos.x >= zoneX && pos.x + width <= zoneX + zoneW &&
                    pos.z >= zoneZ && pos.z + depth <= zoneZ + zoneH) {
                    if (!checkCollisionFast(pos.x, pos.z, width, depth, 0)) {
                        const smartRot = getSmartRotation(pos.x, pos.z, width, depth);
                        if (smartRot === 0 || smartRot === 2) {
                            return { x: pos.x, z: pos.z, rotation: smartRot, blockOriginX: originX, blockOriginZ: originZ };
                        }
                    }
                }

                if (pos.x >= zoneX && pos.x + depth <= zoneX + zoneW &&
                    pos.z >= zoneZ && pos.z + width <= zoneZ + zoneH) {
                    if (!checkCollisionFast(pos.x, pos.z, width, depth, 1)) {
                         const isRoad = (tx:number, tz:number) => roadTilesRef.current.has(`${tx},${tz}`);
                         for(let k=0; k<width; k++) if(isRoad(pos.x-1, pos.z+k)) {
                             return { x: pos.x, z: pos.z, rotation: 1, blockOriginX: originX, blockOriginZ: originZ };
                         }
                         for(let k=0; k<width; k++) if(isRoad(pos.x+depth, pos.z+k)) {
                             return { x: pos.x, z: pos.z, rotation: 3, blockOriginX: originX, blockOriginZ: originZ };
                         }
                         return { x: pos.x, z: pos.z, rotation: 1, blockOriginX: originX, blockOriginZ: originZ };
                    }
                }
            }
        }

        if ((bx === bz) || ((bx < 0) && (bx === -bz)) || ((bx > 0) && (bx === 1 - bz))) {
            t = dx; dx = -dz; dz = t;
        }
        bx += dx; bz += dz;
    }
    return null;
  };

  const generateBuildingData = (type: BuildingType, currentPopulation: number): { level: 1|2|3, style: string, variant: 0|1, isRare: boolean, w: number, d: number } => {
    if (type === 'road') return { level: 1, style: 'road', variant: 0, isRare: false, w: 1, d: 1 };
    if (type === 'landmark') return { level: 3, style: 'unknown', variant: 0, isRare: true, w: 4, d: 4 };

    if (type === 'gov') {
        // @ts-ignore
        const govBuildings = BUILDING_CATALOG.gov[1];
        const selected = govBuildings[Math.floor(Math.random() * govBuildings.length)];
        const roll = Math.random();
        let isRare = false; let variant: 0 | 1 = 0;
        if (roll < 0.01) { isRare = true; variant = Math.random() > 0.5 ? 1 : 0; } 
        else if (roll < 0.31) { variant = 1; }
        return { level: 1, style: selected.id, variant, isRare, w: selected.w, d: selected.d };
    }

    let maxLevel = 1;
    if (currentPopulation >= 25000) maxLevel = 3;
    else if (currentPopulation >= 10000) maxLevel = 2;

    const level = Math.ceil(Math.random() * maxLevel) as 1 | 2 | 3;
    const catalogType = BUILDING_CATALOG[type as keyof typeof BUILDING_CATALOG];
    // @ts-ignore
    const levelBuildings = catalogType[level] || catalogType[1];
    
    if (!levelBuildings || levelBuildings.length === 0) {
         const fallback = BUILDING_CATALOG[type as keyof typeof BUILDING_CATALOG][1];
         const selected = fallback[Math.floor(Math.random() * fallback.length)];
         return { level: 1, style: selected.id, variant: 0, isRare: false, w: selected.w, d: selected.d };
    }

    const selectedBuilding = levelBuildings[Math.floor(Math.random() * levelBuildings.length)];
    const variant = Math.random() > 0.5 ? 1 : 0;
    const isRare = Math.random() < 0.001;

    return { level, style: selectedBuilding.id, variant, isRare, w: selectedBuilding.w, d: selectedBuilding.d };
  };

  const handleStartPlacement = (landmarkId: string) => {
    setPlacementMode({ active: true, landmarkId });
  };

  const handleCancelPlacement = () => {
    setPlacementMode({ active: false, landmarkId: null });
  };

  const handleConfirmPlacement = (x: number, z: number) => {
    if (!placementMode.active || !placementMode.landmarkId) return;

    const landmarkDef = LANDMARK_CATALOG.find(l => l.id === placementMode.landmarkId);
    if (!landmarkDef) return;

    const smartRot = getSmartRotation(x, z, landmarkDef.w, landmarkDef.d);

    const newBuilding: Building = {
        id: generateId(),
        type: 'landmark',
        x: x,
        z: z,
        rotation: smartRot, 
        width: landmarkDef.w,
        depth: landmarkDef.d,
        levelTier: 3,
        style: landmarkDef.id,
        landmarkId: landmarkDef.id,
        variant: 0,
        isRare: true
    };

    const newBuildingsList = buildings.filter(b => {
        let bW = b.width; let bD = b.depth;
        if(b.rotation % 2 !== 0) { bW = b.depth; bD = b.width; }
        const collideX = (x < b.x + bW) && (x + landmarkDef.w > b.x);
        const collideZ = (z < b.z + bD) && (z + landmarkDef.d > b.z);
        if (collideX && collideZ) return false;
        return true; 
    });

    const updatedWithLandmark = [...newBuildingsList, newBuilding];
    
    const effectiveW = smartRot % 2 !== 0 ? landmarkDef.d : landmarkDef.w;
    const effectiveD = smartRot % 2 !== 0 ? landmarkDef.w : landmarkDef.d;
    
    const roadCandidates = [];
    for (let px = x; px < x + effectiveW; px++) { roadCandidates.push({x: px, z: z - 1}); roadCandidates.push({x: px, z: z + effectiveD}); }
    for (let pz = z; pz < z + effectiveD; pz++) { roadCandidates.push({x: x - 1, z: pz}); roadCandidates.push({x: x + effectiveW, z: pz}); }
    
    roadCandidates.forEach(cand => {
        updatedWithLandmark.push({id: generateId(), type: 'road', x: cand.x, z: cand.z, rotation: 0, width: 1, depth: 1, levelTier: 1, style: 'road', variant: 0, isRare: false});
    });

    setBuildings(updatedWithLandmark);
    
    setGameState(prev => ({
        ...prev,
        unlockedLandmarks: [...prev.unlockedLandmarks, placementMode.landmarkId!],
        landmarkInventory: prev.landmarkInventory.filter(id => id !== placementMode.landmarkId)
    }));

    setPlacementMode({ active: false, landmarkId: null });
  };

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      completed: false,
      createdAt: Date.now()
    };
    setTasks([...tasks, newTask]);
  };

  const unlockLandmark = (currentGameState: GameState) => {
    const allUnlocked = [...currentGameState.unlockedLandmarks, ...currentGameState.landmarkInventory];
    const available = LANDMARK_CATALOG.filter(l => !allUnlocked.includes(l.id));
    if (available.length === 0) return currentGameState; 
    const selectedLandmark = available[Math.floor(Math.random() * available.length)];
    const newGameState = {
        ...currentGameState,
        landmarkInventory: [...currentGameState.landmarkInventory, selectedLandmark.id]
    };
    alert(`🎉 NOVA CONSTRUÇÃO LENDÁRIA DESBLOQUEADA: ${selectedLandmark.name}!\n\nAcesse o menu de troféus na barra superior para posicioná-la no mapa.`);
    return newGameState;
  };

  const completeTask = async (id: string) => {
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return;
    
    const task = tasks[taskIndex];
    if (task.completed && !task.isRepeatable) return; 

    let updatedTasks = [...tasks];
    if (!task.isRepeatable) {
      updatedTasks[taskIndex] = { ...task, completed: true };
      setTasks(updatedTasks);
    } 

    let popGain = 0;
    let budgetGain = 0;
    let guaranteedRes = 0;
    let chanceResExtra = 0;
    let guaranteedPark = 0;
    let chancePark = 0;
    let guaranteedCom = 0;
    let chanceCom = 0;
    let guaranteedInd = 0;
    let chanceInd = 0;

    switch (task.difficulty) {
      case TaskDifficulty.TRIVIAL:
        popGain = 1 + Math.floor(Math.random() * 4); 
        budgetGain = 3; 
        guaranteedRes = 1; chanceResExtra = 0.01;
        break;
      case TaskDifficulty.EASY:
        popGain = 10 + Math.floor(Math.random() * 5);
        budgetGain = 32; 
        guaranteedRes = 1; chanceResExtra = 0.25; chancePark = 0.50; chanceCom = 0.25;
        break;
      case TaskDifficulty.MEDIUM:
        popGain = 30 + Math.floor(Math.random() * 10);
        budgetGain = 94; 
        guaranteedRes = 1; chanceResExtra = 0.50; guaranteedPark = 1; chanceCom = 0.50; chanceInd = 0.25;
        break;
      case TaskDifficulty.HARD:
        popGain = 100 + Math.floor(Math.random() * 20);
        budgetGain = 250; 
        guaranteedRes = 2; chanceResExtra = 0.25; guaranteedPark = 1; guaranteedCom = 1; chanceInd = 0.50;
        break;
    }

    let newStats = { ...stats };
    let newBuildings = [...buildings];
    let newGameState = { ...gameState };

    if (newStats.budget < 0) {
        popGain = Math.floor(popGain * 0.5);
    }

    newStats.population += popGain;
    newStats.budget += budgetGain;
    newStats.level = newStats.population >= 25000 ? 3 : newStats.population >= 10000 ? 2 : 1;

    // REMOVIDO: Lógica de slots de veículos por população (5k).
    // Agora os veículos são obtidos apenas pelo evento diário de sorte (1%).

    const checkBudgetMilestone = () => {
        const threshold = 5000;
        const currentMilestone = Math.floor(newStats.budget / threshold) * threshold;
        
        if (currentMilestone >= 5000 && !newGameState.budgetMilestonesReached.includes(currentMilestone)) {
            newGameState.budgetMilestonesReached.push(currentMilestone);
            const randomSpecial = SPECIAL_BUILDINGS[Math.floor(Math.random() * SPECIAL_BUILDINGS.length)];
            newGameState.specialBuildingQueue.push(randomSpecial.id);
            alert(`💰 Marco de Orçamento Atingido: $${currentMilestone}!\n\nUma nova franquia (${randomSpecial.name}) obteve licença para construir na sua cidade. Ela foi adicionada à fila de construção e aparecerá assim que houver um espaço adequado.`);
        }
    };
    checkBudgetMilestone();

    const checkAndAwardMilestone = (milestoneId: string) => {
        if (!newGameState.claimedMilestones.includes(milestoneId)) {
            newGameState = unlockLandmark(newGameState);
            newGameState.claimedMilestones = [...newGameState.claimedMilestones, milestoneId];
        }
    };

    if (newStats.population >= 2500) checkAndAwardMilestone('pop_2500');
    if (newStats.population >= 5000) checkAndAwardMilestone('pop_5000');
    if (newStats.population >= 10000) checkAndAwardMilestone('pop_10000');
    if (newStats.population >= 20000) checkAndAwardMilestone('pop_20000');
    if (newStats.population >= 30000) checkAndAwardMilestone('pop_30000');

    // --- PERFECT DAY LOGIC (Using Virtual Game Day) ---
    // If you complete tasks at 2 AM, they count for "Yesterday"
    const todayGameDate = getGameDateString(); // "YYYY-MM-DD" adjusted -7h
    const tasksForToday = updatedTasks.filter(t => t.dueDate === todayGameDate);
    const totalToday = tasksForToday.length;
    const completedToday = tasksForToday.filter(t => t.completed).length;

    if (totalToday > 0 && completedToday === totalToday) {
        if (newGameState.lastPerfectDay !== todayGameDate) {
            const govData = generateBuildingData('gov', newStats.population);
            const spot = findGridSpot(govData.w, govData.d, 'gov', newBuildings);
            if(spot) {
                newBuildings.push({
                    id: generateId(), type: 'gov', x: spot.x, z: spot.z, rotation: spot.rotation, width: govData.w, depth: govData.d,
                    levelTier: 1, style: govData.style, variant: govData.variant, isRare: govData.isRare
                });
                markOccupied(spot.x, spot.z, govData.w, govData.d, spot.rotation, 'gov'); 
                ensureBlockRoads(spot.blockOriginX, spot.blockOriginZ, newBuildings);
                newStats.govCount += 1;
            }
            newStats.budget += 1000;
            newGameState.totalPerfectDays += 1;
            
            // Check streak using Date objects based on Game Day Strings
            const yesterdayDate = new Date(todayGameDate);
            yesterdayDate.setDate(yesterdayDate.getDate() - 1);
            const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

            if (newGameState.lastPerfectDay === yesterdayStr) {
                newGameState.perfectDayStreak += 1;
            } else {
                newGameState.perfectDayStreak = 1;
            }
            newGameState.lastPerfectDay = todayGameDate;
            if (newGameState.perfectDayStreak >= 5) checkAndAwardMilestone('streak_5');
            if (newGameState.perfectDayStreak >= 10) checkAndAwardMilestone('streak_10');
            if (newGameState.totalPerfectDays >= 15) checkAndAwardMilestone('total_15');
            if (newGameState.totalPerfectDays >= 30) checkAndAwardMilestone('total_30');
            if (newGameState.totalPerfectDays >= 60) checkAndAwardMilestone('total_60');
        }
    }

    const add = (type: BuildingType) => {
       if (newGameState.specialBuildingQueue.length > 0) {
           const specialId = newGameState.specialBuildingQueue[0];
           const specialDef = SPECIAL_BUILDINGS.find(b => b.id === specialId);
           
           if (specialDef && specialDef.type === type) {
               const spot = findGridSpot(2, 2, specialDef.type, newBuildings);
               if (spot) {
                   newBuildings.push({
                       id: generateId(),
                       type: specialDef.type,
                       x: spot.x, z: spot.z, rotation: spot.rotation,
                       width: 2, depth: 2,
                       levelTier: 3, 
                       style: specialDef.id,
                       variant: 0, isRare: true 
                   });
                   markOccupied(spot.x, spot.z, 2, 2, spot.rotation, specialDef.type);
                   ensureBlockRoads(spot.blockOriginX, spot.blockOriginZ, newBuildings);
                   
                   newGameState.specialBuildingQueue.shift();
                   return;
               }
           }
       }

       const data = generateBuildingData(type, newStats.population);
       let pos = findGridSpot(data.w, data.d, type, newBuildings);
       
       if (pos) {
          newBuildings.push({
              id: generateId(),
              type,
              x: pos.x, z: pos.z, rotation: pos.rotation,
              width: data.w, depth: data.d, 
              levelTier: data.level, style: data.style,
              variant: data.variant, isRare: data.isRare
           });
           
           markOccupied(pos.x, pos.z, data.w, data.d, pos.rotation, type); 
           ensureBlockRoads(pos.blockOriginX, pos.blockOriginZ, newBuildings);
       }
    };

    if (newStats.budget >= 0) {
        for(let i=0; i<guaranteedRes; i++) { add('res'); newStats.residentialCount++; }
        if(Math.random() < chanceResExtra) { add('res'); newStats.residentialCount++; }
        for(let i=0; i<guaranteedCom; i++) { add('com'); newStats.commercialCount++; }
        if(Math.random() < chanceCom) { add('com'); newStats.commercialCount++; }
        for(let i=0; i<guaranteedInd; i++) { add('ind'); newStats.industrialCount++; }
        if(Math.random() < chanceInd) { add('ind'); newStats.industrialCount++; }
        for(let i=0; i<guaranteedPark; i++) { add('park'); newStats.parksCount++; }
        if(Math.random() < chancePark) { add('park'); newStats.parksCount++; }
    }

    setStats(newStats);
    setBuildings(newBuildings); 
    setGameState(newGameState);
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: t.subtasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st)
        };
      }
      return t;
    }));
  };

  const debugGenerateCatalog = () => {
    const newBuildings: Building[] = [];
    occupiedTilesRef.current.clear(); 
    roadTilesRef.current.clear();

    let currentX = -MAP_LIMIT + 5;
    let currentZ = -MAP_LIMIT + 5;
    const rowHeight = 10; 
    
    const place = (partial: any) => {
        if (currentX + partial.width > MAP_LIMIT - 2) {
            currentX = -MAP_LIMIT + 5;
            currentZ += rowHeight;
        }
        
        newBuildings.push({
            id: generateId(),
            x: currentX,
            z: currentZ,
            rotation: 0,
            ...partial
        });
        
        for(let i=0; i<partial.width; i++) {
            for(let j=0; j<partial.depth; j++) {
                occupiedTilesRef.current.add(`${currentX+i},${currentZ+j}`);
            }
        }

        const roadX = currentX + Math.floor((partial.width - 1) / 2);
        const roadZ = currentZ + partial.depth;

        newBuildings.push({
            id: generateId(), type: 'road', x: roadX, z: roadZ, rotation: 0, width: 1, depth: 1,
            levelTier: 1, style: 'road', variant: 0, isRare: false
        });
        occupiedTilesRef.current.add(`${roadX},${roadZ}`);
        roadTilesRef.current.add(`${roadX},${roadZ}`);
        
        currentX += partial.width + 3; 
    };

    LANDMARK_CATALOG.forEach(l => {
        place({ 
            type: 'landmark', 
            width: l.w, 
            depth: l.d, 
            style: l.id, 
            landmarkId: l.id, 
            levelTier: 3, 
            variant: 0, 
            isRare: true 
        });
    });

    currentZ += rowHeight + 5;
    currentX = -MAP_LIMIT + 5;

    SPECIAL_BUILDINGS.forEach(s => {
        place({
            type: s.type,
            width: 2, depth: 2,
            style: s.id,
            levelTier: 3,
            variant: 0, isRare: true
        });
    });
    
    currentZ += rowHeight + 5;
    currentX = -MAP_LIMIT + 5;

    const types: BuildingType[] = ['gov', 'res', 'com', 'ind', 'park'];
    types.forEach(type => {
        // @ts-ignore
        const tiers = BUILDING_CATALOG[type];
        if (!tiers) return;

        Object.keys(tiers).forEach(tierLevel => {
            const list = tiers[tierLevel];
            list.forEach((item: any) => {
                [0, 1].forEach(v => {
                    [false, true].forEach(r => {
                        place({ 
                            type, 
                            width: item.w, 
                            depth: item.d, 
                            style: item.id, 
                            levelTier: parseInt(tierLevel), 
                            variant: v, 
                            isRare: r 
                        });
                    });
                });
            });
        });
        currentX = -MAP_LIMIT + 5;
        currentZ += rowHeight + 5;
    });

    setBuildings(newBuildings);
    setStats({ ...stats, population: 999999, budget: 99999999 });
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-gray-900">
      
      <MediaPlayer />

      {/* CITY DISPLAY */}
      <div className="w-full md:w-[72%] lg:w-[82%] h-1/2 md:h-full relative order-2 md:order-1">
        <CityDisplay 
          stats={stats} 
          buildings={buildings}
          onDebugGenerate={debugGenerateCatalog}
          landmarkInventory={gameState.landmarkInventory}
          landmarkCatalog={LANDMARK_CATALOG}
          onStartPlacement={handleStartPlacement}
          placementMode={placementMode}
          onCancelPlacement={handleCancelPlacement}
          onConfirmPlacement={handleConfirmPlacement}
          onCheatBudget={handleCheatBudget}
          onCheatPopulation={handleCheatPopulation}
          onUnlockVehicles={handleUnlockVehicles}
          unlockedVehicles={gameState.unlockedVehicles}
          onExportSave={handleExportSave}
          onImportSave={handleImportSave}
        />
        <ClockWidget gameCreatedAt={gameState.createdAt} />
      </div>

      {/* TASK LIST */}
      <div className="w-full md:w-[28%] lg:w-[18%] h-1/2 md:h-full z-20 order-1 md:order-2">
        <TaskList 
          tasks={tasks} 
          onAddTask={addTask} 
          onCompleteTask={completeTask} 
          onDeleteTask={deleteTask}
          onToggleSubtask={toggleSubtask}
        />
      </div>

    </div>
  );
}
