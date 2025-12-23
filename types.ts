
export enum TaskDifficulty {
  TRIVIAL = 'Trivial',
  EASY = 'Fácil',
  MEDIUM = 'Médio',
  HARD = 'Difícil'
}

export type FrequencyType = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface Recurrence {
  type: FrequencyType;
  weekDays?: number[]; // 0-6 (Dom-Sab)
  monthDay?: number; // 1-31
  customValue?: number;
  customUnit?: 'day' | 'week' | 'month';
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  difficulty: TaskDifficulty;
  completed: boolean;
  createdAt: number;
  
  // Novos campos robustos
  subtasks: SubTask[];
  tags: string[];
  dueDate?: string; // YYYY-MM-DD
  isUrgent: boolean;
  isRepeatable: boolean; // Botão "Repete" (Grind infinito)
  recurrence: Recurrence;
}

export type BuildingType = 'res' | 'com' | 'ind' | 'park' | 'road' | 'gov' | 'landmark';

export interface Building {
  id: string;
  type: BuildingType;
  x: number;
  z: number;
  rotation: number; // 0, 1, 2, 3 (multiplicar por PI/2)
  
  // Dimensões em tiles (ex: 1x1, 2x1, 2x2)
  width: number;
  depth: number;
  
  // Novo Sistema de Variações
  levelTier: 1 | 2 | 3; // Nível do prédio
  style: string; // Identificador do modelo (ex: 'cottage', 'modern', 'pizza_shop')
  variant: 0 | 1; // Variação comum (50/50)
  isRare: boolean; // Variação rara (0.1%)
  
  // Campo opcional para identificar qual Landmark específico é
  landmarkId?: string; 
}

export interface CityStats {
  population: number;
  budget: number;
  level: number;
  residentialCount: number;
  commercialCount: number;
  industrialCount: number;
  parksCount: number;
  govCount: number;
  
  // Maintenance Mechanics
  lastLoginDate: string; // YYYY-MM-DD
  dailyCost: number; // Custo diário calculado
}

export interface GameState {
  createdAt: number; // Data de criação do save (timestamp)
  lastPerfectDay: string | null;
  perfectDayStreak: number;
  totalPerfectDays: number;
  claimedMilestones: string[]; // Lista de IDs de marcos já resgatados (ex: 'pop_5000', 'streak_5')
  unlockedLandmarks: string[]; // Lista de IDs de Landmarks já construídos ou disponíveis
  landmarkInventory: string[]; // IDs de Landmarks desbloqueados mas AINDA NÃO construídos
  
  // NEW: Budget Milestones & Queue
  budgetMilestonesReached: number[]; // Armazena os valores já atingidos (ex: [5000, 10000])
  specialBuildingQueue: string[]; // IDs de estilos especiais esperando para serem construídos (ex: ['com_mcdonalds'])
  
  // RARE CARS
  unlockedVehicles: string[]; // IDs dos carros raros desbloqueados (ex: 'delorean', 'mcqueen')
}

export interface MediaItem {
  id: string;
  type: 'file' | 'youtube';
  url: string;
  title: string;
  fileObj?: File; // Para arquivos locais
  subtitleUrl?: string; // Blob URL para legendas locais
}
