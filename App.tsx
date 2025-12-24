
import React, { useState, useEffect, useRef, useCallback } from 'react';
import TaskList from './components/TaskList';
import CityDisplay from './components/CityDisplay';
import ClockWidget from './components/ClockWidget';
import MediaPlayer from './components/MediaPlayer';
import { Task, TaskDifficulty, CityStats, Building, BuildingType, GameState } from './types';
import { calculateCityMaintenance } from './utils/cityHelpers';
import { getGameDateString } from './utils/timeHelpers';
import { AlertTriangle, CheckCircle, Info, X, Save, Upload, Trophy, RotateCcw } from 'lucide-react';

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

// --- GRID CONSTANTS ---
// BLOCO 3x3: 0=Rua, 1=Construção, 2=Construção, 3=Rua
const BLOCK_SIZE = 3; 

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

// --- MILESTONE RULES ---
const GAME_MILESTONES = [
    // Streak
    { id: 'streak_3', type: 'streak', target: 3, label: '3 Dias Perfeitos seguidos' },
    { id: 'streak_7', type: 'streak', target: 7, label: '7 Dias Perfeitos seguidos' },
    // Total Perfect Days
    { id: 'total_15', type: 'total_perfect', target: 15, label: '15 Dias Perfeitos (Total)' },
    { id: 'total_30', type: 'total_perfect', target: 30, label: '30 Dias Perfeitos (Total)' },
    { id: 'total_60', type: 'total_perfect', target: 60, label: '60 Dias Perfeitos (Total)' },
    // Population
    { id: 'pop_3000', type: 'population', target: 3000, label: '3.000 Habitantes' },
    { id: 'pop_6000', type: 'population', target: 6000, label: '6.000 Habitantes' },
    { id: 'pop_12000', type: 'population', target: 12000, label: '12.000 Habitantes' },
    { id: 'pop_20000', type: 'population', target: 20000, label: '20.000 Habitantes' },
    { id: 'pop_35000', type: 'population', target: 35000, label: '35.000 Habitantes' }
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

  // --- MODAL STATES ---
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isNewGameModalOpen, setIsNewGameModalOpen] = useState(false);

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

  // --- LIVE MAINTENANCE CHECKER ---
  // Verifica se o dia mudou ENQUANTO o jogo está aberto
  useEffect(() => {
      if (!isLoaded) return;
      const interval = setInterval(() => {
          const currentGameDate = getGameDateString();
          // Verifica se o dia atual do jogo é diferente da última data salva
          if (stats.lastLoginDate && currentGameDate !== stats.lastLoginDate) {
              const cost = stats.dailyCost;
              setStats(prev => ({
                  ...prev,
                  budget: prev.budget - cost,
                  lastLoginDate: currentGameDate
              }));
              showToast("Novo Dia", `Manutenção diária cobrada: -$${cost}`, "info");
          }
      }, 30000); // Checa a cada 30 segundos
      return () => clearInterval(interval);
  }, [isLoaded, stats.lastLoginDate, stats.dailyCost]);

  // --- MILESTONE CHECKER ---
  useEffect(() => {
      if (!isLoaded) return;

      const checkMilestones = () => {
          let newClaimed = [...gameState.claimedMilestones];
          let milestonesHit = 0;

          GAME_MILESTONES.forEach(milestone => {
              if (newClaimed.includes(milestone.id)) return;

              let achieved = false;
              if (milestone.type === 'population' && stats.population >= milestone.target) achieved = true;
              if (milestone.type === 'streak' && gameState.perfectDayStreak >= milestone.target) achieved = true;
              if (milestone.type === 'total_perfect' && gameState.totalPerfectDays >= milestone.target) achieved = true;

              if (achieved) {
                  newClaimed.push(milestone.id);
                  milestonesHit++;
                  
                  // Unlock Random Landmark
                  const unlockedIds = gameState.unlockedLandmarks;
                  const inventory = gameState.landmarkInventory;
                  // Filter landmarks that are NOT built AND NOT in inventory
                  const availableLandmarks = LANDMARK_CATALOG.filter(l => !unlockedIds.includes(l.id) && !inventory.includes(l.id));

                  if (availableLandmarks.length > 0) {
                      const winner = availableLandmarks[Math.floor(Math.random() * availableLandmarks.length)];
                      setGameState(prev => ({
                          ...prev,
                          landmarkInventory: [...prev.landmarkInventory, winner.id],
                          claimedMilestones: newClaimed
                      }));
                      setTimeout(() => {
                          showToast("🏆 MARCO ATINGIDO!", `${milestone.label} alcançado! Recompensa: ${winner.name}`, "success");
                      }, milestonesHit * 2000); // Stagger notifications
                  } else {
                      // Se não tem mais landmarks, só marca como claimed
                      setGameState(prev => ({ ...prev, claimedMilestones: newClaimed }));
                      setTimeout(() => {
                          showToast("🏆 MARCO ATINGIDO!", `${milestone.label} alcançado! (Todos os monumentos já desbloqueados)`, "success");
                      }, milestonesHit * 2000);
                  }
              }
          });
      };

      checkMilestones();
  }, [stats.population, gameState.perfectDayStreak, gameState.totalPerfectDays, isLoaded]);


  // --- PERSISTENCE & INITIAL LOAD MAINTENANCE ---
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

        // --- MAINTENANCE FOR CLOSED DAYS ---
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

            if (daysMissed > 1) { 
                 loadedGameState.perfectDayStreak = 0;
            }

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
        // Initial Grid Setup (Center Block)
        const initialRoads: Building[] = [];
        // Center Block: x [0..3], z [0..3]. Roads at 0 and 3.
        // We ensure roads at x=0, x=3, z=0, z=3
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

  // --- CITY BUILDING LOGIC (GRID SYSTEM) ---
  
  const checkCollisionFast = (x: number, z: number, width: number, depth: number, rotation: number, ignoreRoads = false) => {
    let effectiveW = width;
    let effectiveD = depth;
    if (rotation % 2 !== 0) { effectiveW = depth; effectiveD = width; }
    
    if (x < -MAP_LIMIT || x + effectiveW > MAP_LIMIT || z < -MAP_LIMIT || z + effectiveD > MAP_LIMIT) return true;

    for (let i = 0; i < effectiveW; i++) {
        for (let j = 0; j < effectiveD; j++) {
            const key = `${x + i},${z + j}`;
            // If ignoreRoads is true, we only collide if it's occupied AND NOT a road
            if (occupiedTilesRef.current.has(key)) {
                if (ignoreRoads && roadTilesRef.current.has(key)) {
                    continue;
                }
                return true;
            }
        }
    }
    return false;
  };

  const ensureBlockRoads = (blockX: number, blockZ: number, bList: Building[]) => {
      // Calculates road coordinates for a 3x3 block based on block indices
      // A block at (bx, bz) starts at world (bx*3, bz*3)
      // Roads are at local x=0 and z=0 of the block, plus the far edge of the entire grid if needed
      
      const baseX = blockX * BLOCK_SIZE;
      const baseZ = blockZ * BLOCK_SIZE;

      // We need to ensure the PERIMETER of this block has roads
      // Top (z=baseZ), Bottom (z=baseZ+3), Left (x=baseX), Right (x=baseX+3)
      // Note: We only strictly need x=0 and z=0 of the block to form the grid, 
      // but to ensure connectivity we verify the "closing" roads too.
      
      const roadCandidates = [];
      
      // Horizontal Roads (Top and Bottom of block)
      for(let x = 0; x <= BLOCK_SIZE; x++) {
          roadCandidates.push({x: baseX + x, z: baseZ}); // Top Edge
          roadCandidates.push({x: baseX + x, z: baseZ + BLOCK_SIZE}); // Bottom Edge
      }
      
      // Vertical Roads (Left and Right of block)
      for(let z = 0; z <= BLOCK_SIZE; z++) {
          roadCandidates.push({x: baseX, z: baseZ + z}); // Left Edge
          roadCandidates.push({x: baseX + BLOCK_SIZE, z: baseZ + z}); // Right Edge
      }

      roadCandidates.forEach(cand => {
          // Check if already a road there
          const key = `${cand.x},${cand.z}`;
          // Only place if not occupied by a BUILDING (we can overlap existing roads, or skip if exists)
          // Actually, if it's already occupied, we check if it's a road. If so, skip.
          // If it's a building, we have a problem (but grid logic shouldn't allow this overlap)
          if (!occupiedTilesRef.current.has(key)) {
              bList.push({
                  id: generateId(), type: 'road', x: cand.x, z: cand.z, rotation: 0, width: 1, depth: 1,
                  levelTier: 1, style: 'road', variant: 0, isRare: false
              });
              markOccupied(cand.x, cand.z, 1, 1, 0, 'road'); 
          }
      });
  };

  const findSmartGridSpot = (width: number, depth: number, currentList: Building[]) => {
    // Spiral search but via BLOCKS (strides of 3)
    let bx = 0;
    let bz = 0;
    let d = 1;
    let m = 1;
    
    // Safety break
    for (let i = 0; i < 1000; i++) {
        while (2 * bx * d < m) {
            const result = checkBlockForSpot(bx, bz, width, depth);
            if (result) return result;
            bx = bx + d;
        }
        while (2 * bz * d < m) {
            const result = checkBlockForSpot(bx, bz, width, depth);
            if (result) return result;
            bz = bz + d;
        }
        d = -1 * d;
        m = m + 1;
    }
    return null;
  };

  const checkBlockForSpot = (bx: number, bz: number, w: number, d: number) => {
      // World coordinates of the "Buildable Area" inside the block
      // Block starts at bx*3, bz*3 (Roads). 
      // Inner area starts at bx*3 + 1, bz*3 + 1. 
      // Size is 2x2.
      const originX = bx * BLOCK_SIZE + 1;
      const originZ = bz * BLOCK_SIZE + 1;
      
      // We try to fit the building (w, d) into (2, 2) available space.
      // Possible internal offsets: (0,0), (1,0), (0,1), (1,1) if object is 1x1
      
      // Iterate through the 2x2 internal grid
      for (let lx = 0; lx <= 2 - w; lx++) { // 2 is max width of block
          for (let lz = 0; lz <= 2 - d; lz++) {
              // Try Normal Rotation
              if (!checkCollisionFast(originX + lx, originZ + lz, w, d, 0)) {
                  return { x: originX + lx, z: originZ + lz, rotation: 0, bx, bz };
              }
          }
      }
      
      // Try Rotated (if not square)
      if (w !== d) {
          // Rotated: effective width is d, effective depth is w
          for (let lx = 0; lx <= 2 - d; lx++) { 
              for (let lz = 0; lz <= 2 - w; lz++) {
                  if (!checkCollisionFast(originX + lx, originZ + lz, w, d, 1)) {
                      return { x: originX + lx, z: originZ + lz, rotation: 1, bx, bz };
                  }
              }
          }
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

  // --- NEW: SPAWN GOVERNMENT BUILDING FUNCTION ---
  const spawnGovernmentBuilding = () => {
      const govOptions = BUILDING_CATALOG.gov[1]; // [{id: 'police_station', ...}, ...]
      const selectedModel = govOptions[Math.floor(Math.random() * govOptions.length)];

      // 5% Chance for Rare
      const isRare = Math.random() < 0.05;
      // 50/50 Chance for Variant (0 or 1)
      const variant = Math.random() > 0.5 ? 1 : 0;

      // Access current state via refs/clones to ensure freshness if state updates are pending
      const currentBuildings = [...buildings];
      const spot = findSmartGridSpot(selectedModel.w, selectedModel.d, currentBuildings);

      if (spot) {
          ensureBlockRoads(spot.bx, spot.bz, currentBuildings);
          
          const newB: Building = {
              id: generateId(),
              type: 'gov',
              x: spot.x,
              z: spot.z,
              rotation: spot.rotation,
              width: selectedModel.w,
              depth: selectedModel.d,
              levelTier: 1,
              style: selectedModel.id,
              variant: variant as 0 | 1,
              isRare: isRare
          };
          
          const updatedBuildings = [...currentBuildings, newB];
          setBuildings(updatedBuildings);
          markOccupied(spot.x, spot.z, selectedModel.w, selectedModel.d, spot.rotation, 'gov');
          
          setStats(s => ({
              ...s,
              govCount: s.govCount + 1
          }));
          
          showToast("Serviço Público!", `Novo ${isRare ? 'Raro ' : ''}${selectedModel.id.replace('_', ' ')} construído!`, "success");
      } else {
          showToast("Sem espaço", "A prefeitura não encontrou terreno para o novo prédio.", "warning");
      }
  };

  const handleCompleteTask = (id: string) => {
      setTasks(prev => {
          const newTasks = prev.map(t => {
              if (t.id === id) {
                  const newStatus = !t.completed;
                  if (newStatus) {
                      // Reward logic
                      let reward = 50; 
                      if (t.difficulty === TaskDifficulty.EASY) reward = 100;
                      if (t.difficulty === TaskDifficulty.MEDIUM) reward = 250;
                      if (t.difficulty === TaskDifficulty.HARD) reward = 500;
                      
                      // Update stats
                      setStats(s => ({
                          ...s,
                          budget: s.budget + reward,
                          population: s.population + Math.floor(reward / 10)
                      }));

                      // --- NEW SPAWN LOGIC (STANDARD BUILDINGS ONLY) ---
                      const typesToSpawn: BuildingType[] = [];
                      const r = Math.random; 

                      if (t.difficulty === TaskDifficulty.TRIVIAL) {
                          if (r() < 0.50) typesToSpawn.push('res');
                          if (r() < 0.10) typesToSpawn.push('park');
                      }
                      else if (t.difficulty === TaskDifficulty.EASY) {
                          typesToSpawn.push('res'); // 100%
                          if (r() < 0.50) typesToSpawn.push('park');
                          if (r() < 0.25) typesToSpawn.push('com');
                      }
                      else if (t.difficulty === TaskDifficulty.MEDIUM) {
                          typesToSpawn.push('res'); // 100%
                          if (r() < 0.50) typesToSpawn.push('res'); // Additional 50%
                          typesToSpawn.push('park'); // 100%
                          if (r() < 0.75) typesToSpawn.push('com');
                          if (r() < 0.25) typesToSpawn.push('ind');
                      }
                      else if (t.difficulty === TaskDifficulty.HARD) {
                          typesToSpawn.push('res'); // 100%
                          typesToSpawn.push('res'); // Additional 100%
                          typesToSpawn.push('park'); // 100%
                          typesToSpawn.push('com'); // 100%
                          if (r() < 0.50) typesToSpawn.push('ind');
                      }

                      if (typesToSpawn.length > 0) {
                          handleBatchSpawn(typesToSpawn);
                      }
                      
                      showToast("Tarefa Concluída", `+${reward} moedas!`, "success");
                  }
                  return { ...t, completed: newStatus };
              }
              return t;
          });

          // --- PERFECT DAY CHECK LOGIC ---
          // Check if ALL tasks for TODAY are completed
          const todayStr = getGameDateString();
          
          const todaysTasks = newTasks.filter(t => {
              if (t.recurrence.type === 'daily') return true;
              if (t.dueDate === todayStr) return true;
              return false; // Only consider tasks explicit for today
          });

          if (todaysTasks.length > 0 && todaysTasks.every(t => t.completed)) {
              // If we haven't already marked today as perfect
              if (gameState.lastPerfectDay !== todayStr) {
                  setGameState(g => ({
                      ...g,
                      lastPerfectDay: todayStr,
                      perfectDayStreak: g.perfectDayStreak + 1,
                      totalPerfectDays: g.totalPerfectDays + 1
                  }));
                  setTimeout(() => showToast("DIA PERFEITO!", "Todas as tarefas de hoje concluídas! +Streak", "success"), 1000);
                  
                  // --- TRIGGER GOV BUILDING SPAWN ---
                  // Must use setTimeout to ensure state updates have flushed if relying on refs, 
                  // or just call it directly since spawnGovernmentBuilding pulls fresh refs where possible or uses functional updates.
                  // However, buildings state is not a ref in App, it's a state variable. 
                  // spawnGovernmentBuilding reads 'buildings' from closure. 
                  // The 'buildings' in closure might be stale inside this setTask callback? 
                  // Actually yes. But since we are inside setTask, we can't easily access the latest buildings 
                  // unless we used a ref for buildings or useEffect.
                  // BETTER APPROACH: Use a useEffect to watch perfect day changes, or just fire it and hope the closure isn't too stale 
                  // (it usually isn't if handleCompleteTask is recreated on render, but strict mode might be tricky).
                  // Best safe bet: Move this logic to a useEffect that watches gameState.lastPerfectDay
                  // BUT for simplicity in this specific request structure:
                  // I will add the logic to a useEffect below.
              }
          }

          return newTasks;
      });
  };

  // --- EFFECT FOR PERFECT DAY REWARD ---
  useEffect(() => {
      // This effect triggers when lastPerfectDay changes to today
      const todayStr = getGameDateString();
      if (gameState.lastPerfectDay === todayStr) {
          // Check if we just hit it (simple check to avoid double firing on load if saved today)
          // We can use a ref to track if we already rewarded this session, or just rely on the fact 
          // that the user action triggers the state change. 
          // However, on load, if it is already perfect day, we shouldn't spawn again.
          // The handleCompleteTask sets the state. 
          // Let's actually execute the spawn INSIDE handleCompleteTask but use a ref to access latest buildings if needed,
          // OR better: Just put the spawn logic here, but guard it.
          // Since I can't easily detect "just happened" vs "loaded state" without more state,
          // I will use a ref "perfectDayTriggeredRef" that defaults to true on load if match, false otherwise?
          // Actually, simply adding the call to handleCompleteTask is safer if we fix the stale closure.
          // But I can't easily fix the stale closure of 'buildings' inside the functional update of 'setTasks'.
          
          // SOLUTION:
          // I will use a specialized useEffect that listens to `gameState.totalPerfectDays`.
          // When it increments, we spawn.
      }
  }, [gameState.lastPerfectDay]);

  // Use a ref to track total perfect days to detect increment
  const prevTotalPerfectDays = useRef(gameState.totalPerfectDays);
  
  useEffect(() => {
      if (gameState.totalPerfectDays > prevTotalPerfectDays.current) {
          // Increment detected! Spawn reward.
          spawnGovernmentBuilding();
      }
      prevTotalPerfectDays.current = gameState.totalPerfectDays;
  }, [gameState.totalPerfectDays]);


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

  // Helper function to handle batch spawning safely
  const handleBatchSpawn = (types: BuildingType[]) => {
      let currentBuildings = [...buildings];
      let addedRes = 0, addedCom = 0, addedInd = 0, addedPark = 0, addedGov = 0;

      // 1. Resolver Modelos
      const candidates: { type: BuildingType, model: any }[] = [];

      types.forEach(type => {
          const level = 1;
          const catalog = BUILDING_CATALOG[type as keyof typeof BUILDING_CATALOG];
          // @ts-ignore
          const options = catalog[level];
          if (!options) return;
          
          const model = options[Math.floor(Math.random() * options.length)];
          candidates.push({ type, model });
      });

      // 2. Sort largest to smallest to fill blocks better
      candidates.sort((a, b) => (b.model.w * b.model.d) - (a.model.w * a.model.d));

      // 3. Try to place
      candidates.forEach(cand => {
          const { type, model } = cand;
          
          // SMART GRID PLACEMENT
          const spot = findSmartGridSpot(model.w, model.d, currentBuildings);
          
          if (spot) {
              // Ensure Roads exist for this block
              ensureBlockRoads(spot.bx, spot.bz, currentBuildings);
              
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
              currentBuildings.push(newB);
              markOccupied(spot.x, spot.z, model.w, model.d, spot.rotation, type);
              
              if(type === 'res') addedRes++;
              if(type === 'com') addedCom++;
              if(type === 'ind') addedInd++;
              if(type === 'park') addedPark++;
              if(type === 'gov') addedGov++;
          }
      });

      setBuildings(currentBuildings);
      setStats(s => ({
          ...s,
          residentialCount: s.residentialCount + addedRes,
          commercialCount: s.commercialCount + addedCom,
          industrialCount: s.industrialCount + addedInd,
          parksCount: s.parksCount + addedPark,
          govCount: s.govCount + addedGov
      }));
  };

  const handleDebugGenerate = () => {
      const types: BuildingType[] = ['res', 'com', 'ind', 'park'];
      const type = types[Math.floor(Math.random() * types.length)];
      handleBatchSpawn([type]);
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

      // Special Logic for Large Landmarks (> 2x2): They can overwrite roads
      const isMega = item.w > 2 || item.d > 2;
      
      // Check collision (if mega, ignore roads)
      if (checkCollisionFast(x, z, item.w, item.d, 0, isMega)) {
          showToast("Erro", "Local inválido ou ocupado.", "error");
          return;
      }

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
      
      let newBuildings = [...buildings];
      
      // IF MEGA: Remove underlying roads
      if (isMega) {
          newBuildings = newBuildings.filter(b => {
              if (b.type !== 'road') return true; // Keep buildings (collision check handled above)
              // Remove road if it overlaps
              const roadX = b.x; const roadZ = b.z;
              if (roadX >= x && roadX < x + item.w && roadZ >= z && roadZ < z + item.d) {
                  return false; // DELETE ROAD
              }
              return true;
          });
          
          // Rebuild map after deletion to prevent stale data
          rebuildOccupancyMap(newBuildings);
          
          // Ensure perimeter roads
          // Loop around the landmark rect and add roads if missing
          for (let i = -1; i <= item.w; i++) {
              for (let j = -1; j <= item.d; j++) {
                  // Only check perimeter
                  if (i === -1 || i === item.w || j === -1 || j === item.d) {
                      const rx = x + i;
                      const rz = z + j;
                      if (!checkCollisionFast(rx, rz, 1, 1, 0, false)) {
                          newBuildings.push({
                              id: generateId(), type: 'road', x: rx, z: rz, rotation: 0, width: 1, depth: 1,
                              levelTier: 1, style: 'road', variant: 0, isRare: false
                          });
                      }
                  }
              }
          }
      }
      
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

  const handleNewGameRequest = () => {
      setIsNewGameModalOpen(true);
  };

  const confirmNewGame = () => {
      localStorage.removeItem('citytask_save_v1');
      window.location.reload();
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
            onNewGame={handleNewGameRequest}
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

      {/* NEW GAME MODAL */}
      {isNewGameModalOpen && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-gray-800 border border-gray-600 p-6 rounded-xl shadow-2xl max-w-sm w-full text-center">
                  <div className="w-16 h-16 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-500">
                      <RotateCcw className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Novo Jogo?</h3>
                  <p className="text-gray-400 text-sm mb-6">
                      Você perderá <b>TODA</b> a sua cidade e tarefas atuais. Essa ação é irreversível.
                  </p>
                  <div className="flex gap-3">
                      <button 
                        onClick={() => setIsNewGameModalOpen(false)}
                        className="flex-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium transition-colors"
                      >
                          Cancelar
                      </button>
                      <button 
                        onClick={confirmNewGame}
                        className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition-colors shadow-lg shadow-red-900/20"
                      >
                          Reiniciar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
