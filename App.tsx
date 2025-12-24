
import React, { useState, useEffect, useRef, useCallback } from 'react';
import TaskList from './components/TaskList';
import CityDisplay from './components/CityDisplay';
import ClockWidget from './components/ClockWidget';
import MediaPlayer from './components/MediaPlayer';
import { Task, TaskDifficulty, CityStats, Building, BuildingType, GameState } from './types';
import { calculateCityMaintenance } from './utils/cityHelpers';
import { getGameDateString } from './utils/timeHelpers';
import { AlertTriangle, CheckCircle, Info, X, Save, Upload } from 'lucide-react';

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

// --- TYPES FOR NOTIFICATIONS ---
interface GameNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

export default function App() {
  // --- STATE ---
  const [isLoaded, setIsLoaded] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<CityStats>(INITIAL_STATS);
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]); // New State for Tags
  
  // Placement Mode State
  const [placementMode, setPlacementMode] = useState<{ active: boolean, landmarkId: string | null }>({ active: false, landmarkId: null });

  // --- NOTIFICATION SYSTEM ---
  const [notification, setNotification] = useState<GameNotification | null>(null);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
      if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
      
      setNotification({ id: generateId(), title, message, type });
      
      notificationTimeoutRef.current = setTimeout(() => {
          setNotification(null);
      }, 6000); // 6 segundos de duração
  };

  // --- CONFIRMATION MODAL STATE ---
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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
    const todayGameDate = getGameDateString(); 

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.tasks) setTasks(parsed.tasks);
        if (parsed.availableTags) setAvailableTags(parsed.availableTags); // Load Tags
        
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
                    showToast("Abandono Urbano", `A cidade sofreu com o abandono! -${popLoss} habitantes.`, "warning");
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
                    setTimeout(() => {
                        showToast("🚗 EVENTO RARO!", `Um veículo lendário apareceu na cidade: ${wonCar.name}!`, "success");
                    }, 2000); 
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
        gameState,
        availableTags
      };
      localStorage.setItem('citytask_save_v1', JSON.stringify(dataToSave));
    }
  }, [tasks, stats, buildings, gameState, isLoaded, availableTags]);

  // --- SAVE BACKUP MANAGEMENT ---
  const handleExportSave = () => {
      const saveString = localStorage.getItem('citytask_save_v1');
      if (!saveString) { 
          showToast("Erro", "Sem dados para salvar.", "error"); 
          return; 
      }
      const blob = new Blob([saveString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `citytask_backup_${getGameDateString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Backup Criado", "Arquivo salvo com sucesso na sua pasta de downloads.", "success");
  };

  const handleImportSaveRequest = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setPendingImportFile(file);
      setIsImportModalOpen(true);
      e.target.value = '';
  };

  const confirmImportSave = () => {
      if (!pendingImportFile) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const json = ev.target?.result as string;
          const parsed = JSON.parse(json);
          if (parsed && parsed.stats && parsed.buildings) {
              localStorage.setItem('citytask_save_v1', json);
              setIsImportModalOpen(false);
              showToast("Sucesso", "Backup restaurado! Recarregando...", "success");
              setTimeout(() => window.location.reload(), 1000);
          } else {
              throw new Error("Invalid structure");
          }
        } catch (err) {
          showToast("Erro", "Arquivo de save inválido ou corrompido.", "error");
          setIsImportModalOpen(false);
        }
      };
      reader.readAsText(pendingImportFile);
  };

  // --- CHEAT FUNCTIONS ---
  const handleCheatBudget = () => {
      setStats(prev => ({ ...prev, budget: prev.budget + 10000 }));
      showToast("Cheat Ativado", "+10.000 no Orçamento!", "warning");
  };

  const handleCheatPopulation = () => {
      setStats(prev => ({ ...prev, population: prev.population + 5000 }));
      showToast("Cheat Ativado", "+5.000 Habitantes!", "warning");
  };

  const handleUnlockVehicles = () => {
      const allCarIds = RARE_CARS_LIST.map(c => c.id);
      setGameState(prev => ({
          ...prev,
          unlockedVehicles: Array.from(new Set([...prev.unlockedVehicles, ...allCarIds]))
      }));
      showToast("Garagem Lendária", "Todos os veículos raros desbloqueados!", "success");
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
    let x = 0;
    let y = 0;
    let d = 1;
    let m = 1;

    for (let i = 0; i < 500; i++) {
        // Spiral square search
        while (2 * x * d < m) {
            // Check block (x, y)
            const originX = x * BLOCK_SIZE;
            const originZ = y * BLOCK_SIZE;
            
            const buildingsInBlock = currentList.filter(b => 
                b.x >= originX && b.x < originX + BLOCK_SIZE &&
                b.z >= originZ && b.z < originZ + BLOCK_SIZE &&
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
                for(let lx = 1; lx < BLOCK_SIZE; lx++) {
                    for(let lz = 1; lz < BLOCK_SIZE; lz++) {
                        const testX = originX + lx;
                        const testZ = originZ + lz;
                        const rot = getSmartRotation(testX, testZ, width, depth);
                        if (!checkCollisionFast(testX, testZ, width, depth, rot)) {
                            return { x: testX, z: testZ, rotation: rot, bx: x, bz: y };
                        }
                    }
                }
            }

            x = x + d;
        }
        while (2 * y * d < m) {
            // Check block (x, y) - Same Logic
            const originX = x * BLOCK_SIZE;
            const originZ = y * BLOCK_SIZE;
            
            const buildingsInBlock = currentList.filter(b => 
                b.x >= originX && b.x < originX + BLOCK_SIZE &&
                b.z >= originZ && b.z < originZ + BLOCK_SIZE &&
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
                for(let lx = 1; lx < BLOCK_SIZE; lx++) {
                    for(let lz = 1; lz < BLOCK_SIZE; lz++) {
                        const testX = originX + lx;
                        const testZ = originZ + lz;
                        const rot = getSmartRotation(testX, testZ, width, depth);
                        if (!checkCollisionFast(testX, testZ, width, depth, rot)) {
                            return { x: testX, z: testZ, rotation: rot, bx: x, bz: y };
                        }
                    }
                }
            }

            y = y + d;
        }
        d = -1 * d;
        m = m + 1;
    }
    return null;
  };

  // --- HANDLERS ---

  const handleAddTask = (taskData: any) => {
      const newTask = { ...taskData, id: generateId(), completed: false, createdAt: Date.now() };
      setTasks(prev => [...prev, newTask]);
      showToast("Nova Tarefa", "Tarefa adicionada com sucesso!", "success");
  };

  const handleEditTask = (updatedTask: Task) => {
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
      showToast("Tarefa Atualizada", "Alterações salvas!", "success");
  };

  const handleReorderTasks = (newOrder: Task[]) => {
      setTasks(newOrder);
  };

  const handleCompleteTask = (id: string) => {
      setTasks(prev => prev.map(t => {
          if (t.id === id) {
              const newStatus = !t.completed;
              if (newStatus) {
                  // Reward logic
                  let reward = 100;
                  if (t.difficulty === TaskDifficulty.MEDIUM) reward = 250;
                  if (t.difficulty === TaskDifficulty.HARD) reward = 500;
                  
                  // Update stats
                  setStats(s => ({
                      ...s,
                      budget: s.budget + reward,
                      population: s.population + Math.floor(reward / 10)
                  }));

                  // Chance to build
                  if (Math.random() < 0.4) {
                      handleDebugGenerate(); // Reuse generator logic
                  }
                  
                  showToast("Tarefa Concluída", `+${reward} moedas!`, "success");
              }
              return { ...t, completed: newStatus };
          }
          return t;
      }));
  };

  const handleDeleteTask = (id: string) => {
      setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
      setTasks(prev => prev.map(t => {
          if (t.id === taskId) {
              return {
                  ...t,
                  subtasks: t.subtasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st)
              };
          }
          return t;
      }));
  };

  const handleDebugGenerate = () => {
      const types: BuildingType[] = ['res', 'com', 'ind', 'park'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      const level = 1;
      const catalog = BUILDING_CATALOG[type as keyof typeof BUILDING_CATALOG];
      // @ts-ignore
      const options = catalog[level];
      if (!options) return;
      
      const model = options[Math.floor(Math.random() * options.length)];
      
      const spot = findGridSpot(model.w, model.d, type, buildings);
      if (spot) {
          const newBuildings = [...buildings];
          ensureBlockRoads(spot.bx * BLOCK_SIZE, spot.bz * BLOCK_SIZE, newBuildings);
          
          const newB: Building = {
              id: generateId(),
              type: type,
              x: spot.x,
              z: spot.z,
              rotation: spot.rotation,
              width: model.w,
              depth: model.d,
              levelTier: 1,
              style: model.id,
              variant: Math.random() > 0.5 ? 1 : 0,
              isRare: Math.random() < 0.05
          };
          newBuildings.push(newB);
          
          setBuildings(newBuildings);
          markOccupied(spot.x, spot.z, model.w, model.d, spot.rotation, type);
          
          setStats(s => ({
              ...s,
              residentialCount: s.residentialCount + (type==='res'?1:0),
              commercialCount: s.commercialCount + (type==='com'?1:0),
              industrialCount: s.industrialCount + (type==='ind'?1:0),
              parksCount: s.parksCount + (type==='park'?1:0),
              govCount: s.govCount + (type==='gov'?1:0),
          }));
      }
  };

  const handleStartPlacement = (landmarkId: string) => {
      setPlacementMode({ active: true, landmarkId });
  };

  const handleCancelPlacement = () => {
      setPlacementMode({ active: false, landmarkId: null });
  };

  const handleConfirmPlacement = (x: number, z: number) => {
      if (!placementMode.landmarkId) return;
      const item = LANDMARK_CATALOG.find(l => l.id === placementMode.landmarkId);
      if (!item) return;

      const newB: Building = {
          id: generateId(),
          type: 'landmark',
          x, z,
          rotation: 0,
          width: item.w,
          depth: item.d,
          levelTier: 3,
          style: item.id,
          variant: 0,
          isRare: true,
          landmarkId: item.id
      };
      
      const newBuildings = [...buildings];
      // Note: Landmarks might need roads around them, but for now we just place them.
      
      newBuildings.push(newB);
      setBuildings(newBuildings);
      markOccupied(x, z, item.w, item.d, 0, 'landmark');
      
      setGameState(prev => ({
          ...prev,
          landmarkInventory: prev.landmarkInventory.filter(id => id !== item.id),
          unlockedLandmarks: [...prev.unlockedLandmarks, item.id]
      }));
      
      setPlacementMode({ active: false, landmarkId: null });
      showToast("Construção", `${item.name} construído!`, "success");
  };

  const handleNewGame = () => {
      if (window.confirm("Tem certeza? Todo o progresso será perdido.")) {
          localStorage.removeItem('citytask_save_v1');
          window.location.reload();
      }
  };

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-white overflow-hidden font-sans select-none relative">
      {/* Background World Map / Grid (Abstract) */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ 
               backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', 
               backgroundSize: '40px 40px' 
           }}>
      </div>

      {/* RIGHT PANEL: City View (Now on Left) */}
      <div className="flex-1 relative h-full flex flex-col min-w-0">
         <CityDisplay 
            stats={stats} 
            buildings={buildings} 
            onDebugGenerate={handleDebugGenerate}
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
            onImportSave={handleImportSaveRequest}
            onNewGame={handleNewGame}
         />
         
         {/* Widgets Overlay */}
         <ClockWidget gameCreatedAt={gameState.createdAt} />
         <MediaPlayer />
      </div>

      {/* LEFT PANEL: Tasks & Management (Now on Right) */}
      <div className="w-96 flex flex-col z-10 h-full border-l border-gray-700 bg-gray-900/90 backdrop-blur">
        <TaskList 
          tasks={tasks}
          onAddTask={handleAddTask}
          onCompleteTask={handleCompleteTask}
          onDeleteTask={handleDeleteTask}
          onToggleSubtask={handleToggleSubtask}
          onEditTask={handleEditTask}
          onReorderTasks={handleReorderTasks}
        />
      </div>

      {/* Notification Toast (Centered at Bottom) */}
      {notification && (
           <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-300 ${
               notification.type === 'success' ? 'bg-green-900/90 border-green-500 text-green-100' :
               notification.type === 'warning' ? 'bg-orange-900/90 border-orange-500 text-orange-100' :
               notification.type === 'error' ? 'bg-red-900/90 border-red-500 text-red-100' :
               'bg-blue-900/90 border-blue-500 text-blue-100'
           }`}>
               {notification.type === 'success' ? <CheckCircle className="w-6 h-6" /> : 
                notification.type === 'warning' ? <AlertTriangle className="w-6 h-6" /> : 
                <Info className="w-6 h-6" />}
               <div>
                   <div className="font-bold text-base">{notification.title}</div>
                   <div className="text-sm opacity-90">{notification.message}</div>
               </div>
           </div>
       )}

      {/* IMPORT MODAL */}
      {isImportModalOpen && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-gray-800 border border-gray-600 p-6 rounded-xl shadow-2xl max-w-sm w-full text-center">
                  <div className="w-16 h-16 bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-blue-500">
                      <Upload className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Restaurar Save?</h3>
                  <p className="text-gray-400 text-sm mb-6">
                      Isso irá sobrescrever todo o progresso atual da cidade com o arquivo selecionado. Tem certeza?
                  </p>
                  <div className="flex gap-3">
                      <button 
                        onClick={() => { setIsImportModalOpen(false); setPendingImportFile(null); }}
                        className="flex-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium transition-colors"
                      >
                          Cancelar
                      </button>
                      <button 
                        onClick={confirmImportSave}
                        className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-lg shadow-blue-900/20"
                      >
                          Confirmar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}