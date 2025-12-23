
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CityStats, Building } from '../types';
import { Users, Coins, Home, Building2, Factory, TreeDeciduous, Bug, X, Moon, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, Thermometer, Calendar, Globe, Search, MapPin, Landmark, Trophy, ArrowRight, Hammer, AlertTriangle, Plus, Trash2, Umbrella, ArrowDown, ArrowUp, Download, Car, Save, Upload, Music, RotateCcw, Key, CloudSun, CloudMoon } from 'lucide-react';
import City3D from './City3D';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentHoliday, EventType } from '../utils/timeHelpers';

interface CityDisplayProps {
  stats: CityStats;
  buildings: Building[];
  onDebugGenerate?: () => void;
  landmarkInventory: string[];
  landmarkCatalog: any[];
  onStartPlacement: (id: string) => void;
  placementMode: { active: boolean, landmarkId: string | null };
  onCancelPlacement: () => void;
  onConfirmPlacement: (x: number, z: number) => void;
  onCheatBudget?: () => void;
  onCheatPopulation?: () => void;
  onUnlockVehicles?: () => void;
  unlockedVehicles?: string[];
  onExportSave?: () => void;
  onImportSave?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNewGame?: () => void;
}

// ... (Rest of imports and interfaces unchanged)

// Mapeamento simples de respostas da API para tipos internos
type WeatherCondition = 'Clear' | 'Clouds' | 'Rain' | 'Drizzle' | 'Thunderstorm' | 'Snow' | 'Atmosphere';

interface ForecastItem {
  date: string; // YYYY-MM-DD
  temp_max: number;
  temp_min: number;
  pop: number; // Probability of precipitation (0-100)
  condition: WeatherCondition;
  description: string;
  weekday: string;
}

interface WorldCityData {
  id: string; // 'slot1' | 'slot2'
  name: string;
  temp: number | null;
  condition: WeatherCondition | null;
  loading: boolean;
  error: boolean;
}

// ... (API constants and translation functions unchanged)
const SUGGESTED_CITIES = [
  "Dublin, IE", 
  "Orlando, US", 
  "New York, US", 
  "San Francisco, US", 
  "Beijing, CN", 
  "Tokyo, JP",
  "Paris, FR",
  "London, GB",
  "Rome, IT",
  "Sydney, AU"
];

// Tradução de categorias principais (Main)
const translateMainCondition = (condition: string): string => {
    const map: {[key: string]: string} = {
        'Clear': 'Céu Limpo',
        'Clouds': 'Nuvens',
        'Rain': 'Chuva',
        'Drizzle': 'Garoa',
        'Thunderstorm': 'Tempestade',
        'Snow': 'Neve',
        'Atmosphere': 'Neblina',
        'Mist': 'Névoa',
        'Fog': 'Nevoeiro'
    };
    return map[condition] || condition;
};

// Tradução de condições climáticas detalhadas (Description)
const translateCondition = (desc: string): string => {
    const map: {[key: string]: string} = {
        'clear sky': 'Céu Limpo',
        'few clouds': 'Poucas Nuvens',
        'scattered clouds': 'Nuvens Esparsas',
        'broken clouds': 'Nuvens Quebradas', 
        'overcast clouds': 'Nublado',
        'mist': 'Névoa',
        'smoke': 'Fumaça',
        'haze': 'Neblina Seca',
        'dust': 'Poeira',
        'fog': 'Nevoeiro',
        'sand': 'Areia',
        'ash': 'Cinza Vulcânica',
        'squall': 'Rajada de Vento',
        'tornado': 'Tornado',
        'light rain': 'Chuva Leve',
        'moderate rain': 'Chuva Moderada',
        'heavy intensity rain': 'Chuva Forte',
        'very heavy rain': 'Chuva Muito Forte',
        'extreme rain': 'Chuva Extrema',
        'freezing rain': 'Chuva Congelante',
        'light intensity shower rain': 'Aguaceiro Leve',
        'shower rain': 'Aguaceiro',
        'heavy intensity shower rain': 'Aguaceiro Forte',
        'ragged shower rain': 'Aguaceiro Irregular',
        'light snow': 'Neve Leve',
        'snow': 'Neve',
        'heavy snow': 'Neve Forte',
        'sleet': 'Granizo Miúdo',
        'light shower sleet': 'Chuva com Granizo Leve',
        'shower sleet': 'Chuva com Granizo',
        'light rain and snow': 'Chuva e Neve Leve',
        'rain and snow': 'Chuva e Neve',
        'light shower snow': 'Aguaceiro de Neve Leve',
        'shower snow': 'Aguaceiro de Neve',
        'heavy shower snow': 'Aguaceiro de Neve Forte',
        'thunderstorm with light rain': 'Tempestade com Chuva Leve',
        'thunderstorm with rain': 'Tempestade com Chuva',
        'thunderstorm with heavy rain': 'Tempestade com Chuva Forte',
        'light thunderstorm': 'Tempestade Leve',
        'thunderstorm': 'Tempestade',
        'heavy thunderstorm': 'Tempestade Forte',
        'ragged thunderstorm': 'Tempestade Irregular',
        'thunderstorm with light drizzle': 'Tempestade com Garoa Leve',
        'thunderstorm with drizzle': 'Tempestade com Garoa',
        'thunderstorm with heavy drizzle': 'Tempestade com Garoa Forte'
    };
    return map[desc.toLowerCase()] || desc;
};

export default function CityDisplay({ 
  stats, buildings, onDebugGenerate, 
  landmarkInventory, landmarkCatalog, onStartPlacement, 
  placementMode, onCancelPlacement, onConfirmPlacement,
  onCheatBudget, onCheatPopulation, onUnlockVehicles, unlockedVehicles,
  onExportSave, onImportSave, onNewGame
}: CityDisplayProps) {
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [isLandmarkMenuOpen, setIsLandmarkMenuOpen] = useState(false);

  // -- API KEY STATE --
  const [openWeatherKey, setOpenWeatherKey] = useState<string>(() => {
      return localStorage.getItem('citytask_weather_key') || '';
  });
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  // -- CLIMA PRINCIPAL (LONDRINA) --
  const [weatherData, setWeatherData] = useState<{ 
    temp: number, 
    feels_like: number,
    humidity: number,
    wind_speed: number,
    condition: WeatherCondition, 
    city: string,
    description: string
  } | null>(null);
  
  // Override manual do clima (Debug)
  const [weatherOverride, setWeatherOverride] = useState<WeatherCondition | null>(null);
  const [weatherDescOverride, setWeatherDescOverride] = useState<string>('');
  
  // Override Evento (Debug)
  const [eventOverride, setEventOverride] = useState<EventType | null>(null);

  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [loadingWeather, setLoadingWeather] = useState(true);

  // -- CIDADES DO MUNDO --
  const [worldCities, setWorldCities] = useState<WorldCityData[]>(() => {
      try {
          const saved = localStorage.getItem('citytask_world_cities_ui');
          if (saved) {
              const parsed = JSON.parse(saved);
              return parsed.map((c: any) => ({ ...c, loading: true, error: false }));
          }
      } catch (e) {
          console.error("Failed to load world cities", e);
      }
      return [
        { id: 'slot1', name: 'Dublin, IE', temp: null, condition: null, loading: true, error: false },
        { id: 'slot2', name: 'Orlando, US', temp: null, condition: null, loading: true, error: false }
      ];
  });
  const [newCityInput, setNewCityInput] = useState('');

  // Persist World Cities changes
  useEffect(() => {
      const toSave = worldCities.map(({ id, name }) => ({ id, name }));
      localStorage.setItem('citytask_world_cities_ui', JSON.stringify(toSave));
  }, [worldCities]);

  // Inicializa baseado no horário real
  const [isNight, setIsNight] = useState(() => {
    const hour = new Date().getHours();
    return hour >= 18 || hour < 6;
  });

  // Calculate Event Logic
  const [currentEvent, setCurrentEvent] = useState<EventType>('none');
  useEffect(() => {
      if (eventOverride) {
          setCurrentEvent(eventOverride);
      } else {
          setCurrentEvent(getCurrentHoliday(new Date()));
      }
  }, [eventOverride]);

  // Condição ativa (Override ou API)
  const activeCondition = weatherOverride || weatherData?.condition || 'Clear';
  const activeDescription = weatherDescOverride ? weatherDescOverride : (weatherData ? translateCondition(weatherData.description) : '');

  // Calculando Landmarks dinamicamente
  const landmarkCount = buildings.filter(b => b.type === 'landmark').length;

  // --- API KEY HANDLING ---
  const handleSaveApiKey = () => {
      if (tempApiKey.trim()) {
          const key = tempApiKey.trim();
          setOpenWeatherKey(key);
          localStorage.setItem('citytask_weather_key', key);
          setIsApiKeyModalOpen(false);
      }
  };

  useEffect(() => {
      if (!openWeatherKey) {
          setIsApiKeyModalOpen(true);
      }
  }, [openWeatherKey]);

  // --- FETCHING LOGIC ---
  const fetchMainWeather = async () => {
    if (!openWeatherKey) {
        setLoadingWeather(false);
        return;
    }

    setLoadingWeather(true);
    try {
        const CITY = 'Londrina,BR'; 
        // 1. Current Weather
        const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=metric&appid=${openWeatherKey}`);
        
        if (currentRes.status === 401) {
            throw new Error("API Key Inválida");
        }

        const currentData = await currentRes.json();
        
        if (currentData.weather && currentData.weather[0]) {
            setWeatherData({
                temp: Math.round(currentData.main.temp),
                feels_like: Math.round(currentData.main.feels_like),
                humidity: currentData.main.humidity,
                wind_speed: currentData.wind.speed,
                condition: currentData.weather[0].main as WeatherCondition,
                city: currentData.name,
                description: currentData.weather[0].description
            });
        }

        // 2. Forecast (5 day / 3 hour)
        const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${CITY}&units=metric&appid=${openWeatherKey}`);
        const forecastData = await forecastRes.json();

        if (forecastData.list) {
            const dailyData: {[key: string]: { 
                min: number, 
                max: number, 
                pop: number, 
                condition: WeatherCondition,
                description: string,
                timestamp: number
            }} = {};

            forecastData.list.forEach((item: any) => {
                const date = item.dt_txt.split(' ')[0];
                const temp = item.main.temp;
                const pop = item.pop || 0;

                if (!dailyData[date]) {
                    dailyData[date] = {
                        min: temp,
                        max: temp,
                        pop: pop,
                        condition: item.weather[0].main,
                        description: item.weather[0].description,
                        timestamp: item.dt
                    };
                } else {
                    dailyData[date].min = Math.min(dailyData[date].min, temp);
                    dailyData[date].max = Math.max(dailyData[date].max, temp);
                    dailyData[date].pop = Math.max(dailyData[date].pop, pop);
                    
                    if (item.dt_txt.includes("12:00:00")) {
                        dailyData[date].condition = item.weather[0].main;
                        dailyData[date].description = item.weather[0].description;
                    }
                }
            });

            const dailyList = Object.keys(dailyData).slice(0, 5).map(date => {
                const day = dailyData[date];
                const d = new Date(date);
                const weekday = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' });
                
                return {
                    date,
                    temp_max: Math.round(day.max),
                    temp_min: Math.round(day.min),
                    pop: Math.round(day.pop * 100),
                    condition: day.condition,
                    description: translateCondition(day.description),
                    weekday: weekday.replace('.', '')
                };
            });

            setForecast(dailyList);
        }

    } catch (error: any) {
        console.error("Erro ao buscar clima principal:", error);
        setWeatherData({ temp: 25, feels_like: 26, humidity: 60, wind_speed: 5, condition: 'Clear', city: 'Offline', description: 'Sem conexão' });
        if (error.message === "API Key Inválida") {
            // Se a chave for inválida, pedir novamente
            setOpenWeatherKey('');
            localStorage.removeItem('citytask_weather_key');
            setIsApiKeyModalOpen(true);
        }
    } finally {
        setLoadingWeather(false);
    }
  };

  const fetchWorldCity = async (slotId: string, cityName: string) => {
      if (!openWeatherKey) return;

      setWorldCities(prev => prev.map(c => c.id === slotId ? { ...c, loading: true, error: false, name: cityName } : c));
      
      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&units=metric&appid=${openWeatherKey}&_t=${Date.now()}`);
        if (!res.ok) throw new Error("City not found");
        const data = await res.json();
        
        setWorldCities(prev => prev.map(c => c.id === slotId ? {
            ...c,
            loading: false,
            temp: Math.round(data.main.temp),
            condition: data.weather[0].main as WeatherCondition,
            error: false
        } : c));

      } catch (err) {
        setWorldCities(prev => prev.map(c => c.id === slotId ? { ...c, loading: false, error: true, temp: null, condition: null } : c));
      }
  };

  useEffect(() => {
    if (openWeatherKey) {
        fetchMainWeather();
        worldCities.forEach(city => {
            fetchWorldCity(city.id, city.name);
        });
    }
    const interval = setInterval(() => {
        if(openWeatherKey) fetchMainWeather();
    }, 600000); 
    return () => clearInterval(interval);
  }, [openWeatherKey]); // Dependência atualizada

  const handleAddWorldCity = (nameOverride?: string) => {
      const cityToAdd = nameOverride || newCityInput;
      if (!cityToAdd.trim()) return;
      
      const newId = uuidv4();
      const newCity = { id: newId, name: cityToAdd, temp: null, condition: null, loading: true, error: false };
      setWorldCities(prev => [...prev, newCity]);
      fetchWorldCity(newId, cityToAdd);
      if(!nameOverride) setNewCityInput('');
  };

  const handleRemoveWorldCity = (id: string) => {
      setWorldCities(prev => prev.filter(c => c.id !== id));
  };

  const getWeatherIcon = (condition: string | null, description: string | null, className = "w-6 h-6", useNightLogic = false) => {
      const effectiveNight = useNightLogic ? isNight : false;

      if (!condition) return <Sun className={`${className} text-gray-500`} />;

      // Ícones específicos baseados na descrição para "Nuvens"
      if (condition === 'Clouds' && description) {
          const desc = description.toLowerCase();
          if (desc.includes('poucas') || desc.includes('esparsas') || desc.includes('few') || desc.includes('scattered')) {
              return effectiveNight ? <CloudMoon className={`${className} text-gray-300`} /> : <CloudSun className={`${className} text-gray-300`} />;
          }
      }

      switch (condition) {
          case 'Clear': return effectiveNight ? <Moon className={`${className} text-blue-200`} /> : <Sun className={`${className} text-yellow-400`} />;
          case 'Clouds': return <Cloud className={`${className} text-gray-300`} />;
          case 'Rain': 
          case 'Drizzle': return <CloudRain className={`${className} text-blue-400`} />;
          case 'Thunderstorm': return <CloudLightning className={`${className} text-purple-400`} />;
          case 'Snow': return <CloudSnow className={`${className} text-white`} />;
          default: return <Wind className={`${className} text-gray-400`} />;
      }
  };

  // --- BUDGET HELPERS ---
  const autonomyDays = stats.budget > 0 ? Math.floor(stats.budget / Math.max(1, stats.dailyCost)) : 0;
  const isDeficit = stats.budget < 0;
  const isWarning = !isDeficit && autonomyDays < 3;
  
  let budgetColor = "text-yellow-400";
  let autonomyLabel = "Saudável";
  let autonomyColor = "text-green-400";

  if (isDeficit) {
      budgetColor = "text-red-500";
      autonomyLabel = "Déficit";
      autonomyColor = "text-red-500";
  } else if (isWarning) {
      budgetColor = "text-orange-400";
      autonomyLabel = "Atenção";
      autonomyColor = "text-orange-400";
  }

  const handleDebugWeatherChange = (val: string) => {
      if (!val) {
          setWeatherOverride(null);
          setWeatherDescOverride('');
          return;
      }
      
      const [main, desc] = val.split('|');
      setWeatherOverride(main as WeatherCondition);
      setWeatherDescOverride(desc);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 p-6 relative overflow-hidden">
      
      {/* ... (Existing Weather Widget Code) ... */}
      
      {/* WEATHER WIDGET (Top Left) */}
      <div className="absolute top-6 left-6 z-20 pointer-events-auto group">
        <button 
            onClick={() => {
                if (!openWeatherKey) setIsApiKeyModalOpen(true);
                else setIsWeatherModalOpen(true);
            }}
            className="flex flex-col gap-4 bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] shadow-2xl hover:bg-black/60 hover:scale-105 transition-all cursor-pointer min-w-[280px]"
        >
            <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-900 to-slate-900 flex items-center justify-center border-2 border-white/20 shadow-inner">
                    {!openWeatherKey ? (
                        <Key className="w-10 h-10 text-gray-400 animate-pulse" />
                    ) : loadingWeather ? (
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"/> 
                    ) : (
                        getWeatherIcon(activeCondition, activeDescription, "w-14 h-14", true)
                    )}
                </div>
                <div className="flex flex-col text-left">
                    {!openWeatherKey ? (
                        <>
                            <span className="text-xl font-bold text-white leading-none">Configurar</span>
                            <span className="text-sm text-gray-300 font-bold mt-1">API CLIMA</span>
                        </>
                    ) : (
                        <>
                            <span className="text-6xl font-bold text-white leading-none tracking-tighter shadow-black drop-shadow-lg">
                                {weatherData ? `${weatherData.temp}°` : '--'}
                            </span>
                            <span className="text-sm text-gray-300 uppercase tracking-widest font-bold mt-1">
                                {activeDescription || translateMainCondition(activeCondition)}
                            </span>
                            {weatherOverride && <span className="text-[10px] text-red-400 font-mono">*DEBUG*</span>}
                        </>
                    )}
                </div>
            </div>
            <div className="w-full h-px bg-white/10"></div>
            <div className="w-full flex justify-between gap-2 px-1 overflow-x-auto scrollbar-hide">
                {worldCities.map(city => (
                    <div key={city.id} className="flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-white/5 min-w-[80px] justify-center">
                         {city.loading ? (
                             <div className="w-3 h-3 border-2 border-white/50 border-t-transparent rounded-full animate-spin"/>
                         ) : city.error ? (
                             <X className="w-4 h-4 text-red-400" />
                         ) : (
                             <>
                                {getWeatherIcon(city.condition, null, "w-5 h-5")}
                                <div className="flex flex-col text-left">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[60px]">{city.name.split(',')[0]}</span>
                                    <span className="text-sm font-bold text-white leading-none">{city.temp}°</span>
                                </div>
                             </>
                         )}
                    </div>
                ))}
            </div>
        </button>
        <div className="absolute top-full left-6 mt-3 px-3 py-1.5 bg-black/90 text-sm text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
            {openWeatherKey ? `${weatherData?.city} - Clique para previsão completa` : 'Clique para configurar chave API'}
        </div>
      </div>

      {/* API KEY MODAL */}
      {isApiKeyModalOpen && (
          <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-gray-800 border border-gray-600 rounded-2xl shadow-2xl w-full max-w-md p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Key className="text-cyan-400" /> Configurar Clima
                  </h2>
                  <p className="text-gray-400 text-sm mb-4">
                      Para que o clima da cidade funcione, você precisa de uma chave gratuita da <strong>OpenWeatherMap</strong>.
                  </p>
                  <input 
                      type="text" 
                      placeholder="Cole sua API Key aqui (ex: fc1f...)" 
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white mb-4 focus:border-cyan-500 focus:outline-none font-mono text-sm"
                      value={tempApiKey}
                      onChange={(e) => setTempApiKey(e.target.value)}
                  />
                  <div className="flex gap-2">
                      <button 
                        onClick={() => setIsApiKeyModalOpen(false)}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-lg"
                      >
                          Cancelar (Offline)
                      </button>
                      <button 
                        onClick={handleSaveApiKey}
                        className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded-lg"
                      >
                          Salvar Chave
                      </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-4 text-center">
                      A chave é salva apenas no seu navegador.
                  </p>
              </div>
          </div>
      )}

      {/* ... (Weather Modal Code) ... */}
      {isWeatherModalOpen && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-gray-800/90 border border-gray-600 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gradient-to-r from-blue-900/50 to-gray-800">
                      <div className="flex items-center gap-2">
                          <MapPin className="text-cyan-400 w-5 h-5" />
                          <h2 className="text-xl font-bold text-white">{weatherData?.city || 'Londrina'}</h2>
                          <span className="text-sm text-gray-400 capitalize bg-gray-900/50 px-2 py-0.5 rounded-full">
                            {activeDescription}
                          </span>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={() => setIsApiKeyModalOpen(true)} className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-gray-300 flex items-center gap-1">
                              <Key size={12}/> Config API
                          </button>
                          <button onClick={() => setIsWeatherModalOpen(false)} className="text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors">
                              <X className="w-6 h-6" />
                          </button>
                      </div>
                  </div>
                  <div className="p-6 space-y-8">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-black/30 p-3 rounded-xl flex flex-col items-center justify-center border border-white/5">
                              <Thermometer className="text-red-400 w-6 h-6 mb-1" />
                              <span className="text-gray-400 text-xs uppercase">Temperatura</span>
                              <span className="text-2xl font-bold">{weatherData?.temp}°</span>
                          </div>
                          <div className="bg-black/30 p-3 rounded-xl flex flex-col items-center justify-center border border-white/5">
                              <Users className="text-orange-400 w-6 h-6 mb-1" />
                              <span className="text-gray-400 text-xs uppercase">Sensação</span>
                              <span className="text-2xl font-bold">{weatherData?.feels_like}°</span>
                          </div>
                          <div className="bg-black/30 p-3 rounded-xl flex flex-col items-center justify-center border border-white/5">
                              <Droplets className="text-blue-400 w-6 h-6 mb-1" />
                              <span className="text-gray-400 text-xs uppercase">Umidade</span>
                              <span className="text-2xl font-bold">{weatherData?.humidity}%</span>
                          </div>
                          <div className="bg-black/30 p-3 rounded-xl flex flex-col items-center justify-center border border-white/5">
                              <Wind className="text-green-400 w-6 h-6 mb-1" />
                              <span className="text-gray-400 text-xs uppercase">Vento</span>
                              <span className="text-2xl font-bold">{weatherData?.wind_speed} <span className="text-xs">m/s</span></span>
                          </div>
                      </div>
                      <div className="border-t border-gray-700 pt-6">
                          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-cyan-400"/> Previsão 5 Dias</h3>
                          <div className="grid grid-cols-5 gap-2">
                              {forecast.length > 0 ? forecast.map((day, idx) => (
                                  <div key={idx} className="bg-gray-700/30 p-3 rounded-xl flex flex-col items-center border border-white/5 justify-between min-h-[140px]">
                                      <span className="text-xs text-gray-400 font-bold uppercase mb-1">{day.weekday}</span>
                                      
                                      <div className="flex flex-col items-center gap-1">
                                        {getWeatherIcon(day.condition, day.description, "w-8 h-8")}
                                        <span className="text-[10px] text-gray-400 text-center leading-tight h-6 overflow-hidden line-clamp-2">{day.description}</span>
                                      </div>

                                      <div className="w-full flex flex-col gap-1 mt-2">
                                          <div className="flex justify-between w-full px-2 text-sm">
                                              <span className="text-red-400 font-bold flex items-center gap-0.5"><ArrowUp size={10}/>{day.temp_max}°</span>
                                              <span className="text-blue-400 font-bold flex items-center gap-0.5"><ArrowDown size={10}/>{day.temp_min}°</span>
                                          </div>
                                          {day.pop > 0 && (
                                              <div className="flex items-center justify-center gap-1 text-xs text-blue-300 bg-blue-900/30 w-full rounded py-0.5">
                                                  <Umbrella size={10} />
                                                  <span>{day.pop}%</span>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              )) : (
                                <div className="col-span-5 text-center text-gray-500 italic">Carregando previsão...</div>
                              )}
                          </div>
                      </div>
                      <div className="border-t border-gray-700 pt-6">
                          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-green-400"/> Cidades do Mundo</h3>
                          <div className="flex gap-2 mb-4">
                              <input 
                                value={newCityInput}
                                onChange={(e) => setNewCityInput(e.target.value)}
                                placeholder="Nome da cidade (ex: Paris, FR)"
                                className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddWorldCity()}
                              />
                              <button onClick={() => handleAddWorldCity()} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                                  <Plus className="w-4 h-4" /> Adicionar
                              </button>
                          </div>
                          <div className="mb-4">
                              <span className="text-xs text-gray-400 block mb-2">Sugestões Rápidas:</span>
                              <div className="flex flex-wrap gap-2">
                                  {SUGGESTED_CITIES.map(city => (
                                      <button 
                                        key={city}
                                        onClick={() => handleAddWorldCity(city)}
                                        className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs px-3 py-1 rounded-full border border-gray-600 transition-colors"
                                      >
                                          {city.split(',')[0]}
                                      </button>
                                  ))}
                              </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                              {worldCities.map(city => (
                                  <div key={city.id} className="flex justify-between items-center bg-gray-900 p-3 rounded-lg border border-gray-700">
                                      <div className="flex items-center gap-3">
                                          {city.loading ? (
                                              <div className="w-4 h-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin"/>
                                          ) : city.error ? (
                                              <X className="w-4 h-4 text-red-400" />
                                          ) : (
                                              getWeatherIcon(city.condition, null, "w-5 h-5")
                                          )}
                                          <div>
                                              <div className="font-bold text-white text-sm">{city.name}</div>
                                              {city.temp !== null && <div className="text-xs text-gray-400">{city.temp}°C</div>}
                                          </div>
                                      </div>
                                      <button onClick={() => handleRemoveWorldCity(city.id)} className="text-gray-500 hover:text-red-400 p-1">
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* ... (Top Stats Bar - Unchanged) ... */}
      <div className="flex flex-wrap items-center justify-end gap-6 bg-gray-800/90 backdrop-blur rounded-2xl p-4 mb-6 border border-gray-700 shadow-lg z-10 absolute top-6 right-6 pointer-events-none ml-48">
        
        {/* Population & Budget */}
        <div className="flex items-center gap-6 pointer-events-auto">
          <div className="flex items-center gap-2 text-cyan-400">
            <Users className="w-5 h-5" />
            <div>
              <p className="text-xs text-cyan-200/60 uppercase font-bold">População</p>
              <p className="text-xl font-bold font-mono">{stats.population.toLocaleString()}</p>
            </div>
          </div>
          
          <div className={`flex items-center gap-2 ${budgetColor} group relative cursor-help`}>
            {isDeficit ? <AlertTriangle className="w-5 h-5 animate-pulse" /> : <Coins className="w-5 h-5" />}
            <div>
              <p className="text-xs opacity-60 uppercase font-bold">Orçamento</p>
              <p className="text-xl font-bold font-mono">${stats.budget.toLocaleString()}</p>
            </div>

            <div className="absolute top-full right-0 mt-3 w-48 bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
               <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 border-b border-gray-700 pb-1">Finanças Municipais</h4>
               <div className="space-y-1 text-sm">
                   <div className="flex justify-between">
                       <span className="text-gray-300">Manutenção:</span>
                       <span className="text-red-400 font-mono">-${stats.dailyCost}/dia</span>
                   </div>
                   <div className="flex justify-between">
                       <span className="text-gray-300">Autonomia:</span>
                       <span className={`font-bold ${isDeficit ? 'text-red-500' : 'text-white'}`}>{isDeficit ? '0' : autonomyDays} Dias</span>
                   </div>
                   <div className="mt-2 pt-2 border-t border-gray-700 text-center">
                       <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${isDeficit ? 'bg-red-900/50 text-red-300' : isWarning ? 'bg-orange-900/50 text-orange-300' : 'bg-green-900/50 text-green-300'}`}>
                           {autonomyLabel}
                       </span>
                   </div>
               </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pointer-events-auto pl-4 border-l border-gray-700">
           <div className="px-4 py-1 bg-gray-700 rounded-full border border-gray-600">
              <span className="text-sm text-gray-300 font-semibold">Nível: {stats.level}</span>
           </div>

           <div className="relative border-l border-gray-700 pl-4">
                <button
                    onClick={() => setIsLandmarkMenuOpen(!isLandmarkMenuOpen)}
                    className="p-2 bg-yellow-900/50 hover:bg-yellow-800 border border-yellow-700/50 rounded-lg text-yellow-300 transition-colors relative"
                    title="Construções Lendárias (Inventário)"
                >
                    <Trophy className="w-5 h-5" />
                    {landmarkInventory.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-bounce">
                            {landmarkInventory.length}
                        </span>
                    )}
                </button>

                {isLandmarkMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-gray-900">
                            <span className="text-xs font-bold text-yellow-400 uppercase flex items-center gap-2">
                                <Trophy className="w-3 h-3" /> Inventário
                            </span>
                            <button onClick={() => setIsLandmarkMenuOpen(false)}><X className="w-3 h-3 text-gray-500" /></button>
                        </div>
                        <div className="max-h-64 overflow-y-auto p-2 space-y-2">
                            {landmarkInventory.length === 0 ? (
                                <div className="text-center py-4 text-gray-500 text-sm italic">
                                    Nenhuma construção desbloqueada ainda. Continue completando tarefas!
                                </div>
                            ) : (
                                landmarkInventory.map(id => {
                                    const item = landmarkCatalog.find(l => l.id === id);
                                    if(!item) return null;
                                    return (
                                        <div key={id} className="bg-gray-700/50 p-2 rounded border border-gray-600 hover:border-yellow-500 transition-colors flex flex-col gap-2">
                                            <div className="flex justify-between items-start">
                                                <span className="font-bold text-sm text-white">{item.name}</span>
                                                <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded text-gray-400">{item.w}x{item.d}</span>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    onStartPlacement(id);
                                                    setIsLandmarkMenuOpen(false);
                                                }}
                                                className="w-full py-1.5 bg-yellow-700 hover:bg-yellow-600 text-white text-xs font-bold rounded flex items-center justify-center gap-1"
                                            >
                                                <Hammer className="w-3 h-3" /> Posicionar
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
           </div>

           <div className="relative flex gap-2">
             <button 
                onClick={() => window.dispatchEvent(new Event('citytask-toggle-player'))}
                className="p-2 bg-blue-900/50 hover:bg-blue-800 border border-blue-700/50 rounded-lg text-blue-300 transition-colors"
                title="Media Player"
             >
                <Music className="w-5 h-5" />
             </button>

             <button 
               onClick={() => setIsDebugOpen(!isDebugOpen)}
               className="p-2 bg-red-900/50 hover:bg-red-800 border border-red-700/50 rounded-lg text-red-300 transition-colors"
               title="Menu de Debug"
             >
               <Bug className="w-5 h-5" />
             </button>
             
             {isDebugOpen && (
               <div className="absolute right-0 top-full mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                 <div className="p-2 border-b border-gray-700 flex justify-between items-center">
                   <span className="text-xs font-bold text-gray-400 uppercase">Ferramentas de Jogo</span>
                   <button onClick={() => setIsDebugOpen(false)}><X className="w-3 h-3 text-gray-500" /></button>
                 </div>
                 
                 <div className="flex flex-col">
                    {/* BACKUP SECTION */}
                    <div className="px-4 py-3 bg-blue-900/30 border-b border-gray-700/50">
                        <span className="text-xs font-bold text-blue-300 uppercase mb-2 block">Backup e Segurança</span>
                        <div className="flex gap-2">
                            <button 
                                onClick={onExportSave} 
                                className="flex-1 bg-blue-700 hover:bg-blue-600 text-white text-xs py-2 rounded flex items-center justify-center gap-1 transition-colors"
                                title="Baixar arquivo de backup (.json)"
                            >
                                <Save className="w-3 h-3"/> Exportar Save
                            </button>
                            <label className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 rounded flex items-center justify-center gap-1 cursor-pointer transition-colors" title="Carregar backup (.json)">
                                <Upload className="w-3 h-3"/> Importar Save
                                <input type="file" accept=".json" className="hidden" onChange={onImportSave} />
                            </label>
                        </div>
                    </div>

                    <button 
                        onClick={() => {
                        if(onDebugGenerate) onDebugGenerate();
                        setIsDebugOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors border-b border-gray-700/50"
                    >
                        Gerar Catálogo (Todos os Prédios)
                    </button>

                    <button 
                        onClick={() => {
                            if(onCheatBudget) onCheatBudget();
                            setIsDebugOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-yellow-300 hover:bg-gray-700 hover:text-yellow-100 transition-colors border-b border-gray-700/50 flex items-center gap-2"
                    >
                        <Coins className="w-4 h-4" /> +10.000 Dinheiro
                    </button>

                    <button 
                        onClick={() => {
                            if(onCheatPopulation) onCheatPopulation();
                            setIsDebugOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-cyan-300 hover:bg-gray-700 hover:text-cyan-100 transition-colors border-b border-gray-700/50 flex items-center gap-2"
                    >
                        <Users className="w-4 h-4" /> +5.000 População
                    </button>

                    <button 
                        onClick={() => {
                            if(onUnlockVehicles) onUnlockVehicles();
                            setIsDebugOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-purple-300 hover:bg-gray-700 hover:text-purple-100 transition-colors border-b border-gray-700/50 flex items-center gap-2"
                    >
                        <Car className="w-4 h-4" /> Desbloquear Veículos Raros
                    </button>

                    <button 
                        onClick={() => setIsNight(!isNight)}
                        className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2 border-b border-gray-700/50"
                    >
                        {isNight ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
                        Alternar para {isNight ? 'Dia' : 'Noite'}
                    </button>

                    {/* EXPORT BUTTON */}
                    <button 
                        onClick={() => window.dispatchEvent(new Event('citytask-export-glb'))}
                        className="w-full text-left px-4 py-3 text-sm text-green-300 hover:bg-gray-700 hover:text-green-100 transition-colors border-b border-gray-700/50 flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" /> Exportar Cidade 3D (.glb)
                    </button>

                    {/* NEW GAME BUTTON */}
                    <button 
                        onClick={() => {
                            if(onNewGame) onNewGame();
                            setIsDebugOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors border-b border-gray-700/50 flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" /> Criar Novo Jogo
                    </button>

                    {/* WEATHER OVERRIDE */}
                    <div className="px-4 py-3 bg-gray-900/50 border-b border-gray-700/50">
                        <label className="block text-xs text-gray-400 mb-1 font-bold">Forçar Clima</label>
                        <select 
                            className="w-full bg-gray-800 border border-gray-700 rounded text-sm text-white p-1 focus:outline-none focus:border-cyan-500"
                            value={weatherOverride ? `${weatherOverride}|${weatherDescOverride}` : ''}
                            onChange={(e) => handleDebugWeatherChange(e.target.value)}
                        >
                            <option value="">Automático (API)</option>
                            <optgroup label="Céu Limpo">
                                <option value="Clear|clear sky">Céu Limpo (Clear)</option>
                            </optgroup>
                            <optgroup label="Nuvens">
                                <option value="Clouds|few clouds">Poucas Nuvens (11-25%)</option>
                                <option value="Clouds|scattered clouds">Nuvens Esparsas (25-50%)</option>
                                <option value="Clouds|broken clouds">Nuvens Quebradas (51-84%)</option>
                                <option value="Clouds|overcast clouds">Nublado (85-100%)</option>
                            </optgroup>
                            <optgroup label="Chuva / Tempestade">
                                <option value="Rain|light rain">Chuva Leve</option>
                                <option value="Rain|moderate rain">Chuva Moderada</option>
                                <option value="Thunderstorm|thunderstorm">Tempestade</option>
                            </optgroup>
                            <optgroup label="Atmosfera">
                                <option value="Atmosphere|mist">Névoa</option>
                                <option value="Atmosphere|fog">Nevoeiro</option>
                            </optgroup>
                            <optgroup label="Neve">
                                <option value="Snow|snow">Neve</option>
                            </optgroup>
                        </select>
                    </div>

                    {/* EVENT OVERRIDE */}
                    <div className="px-4 py-3 bg-gray-900/50">
                        <label className="block text-xs text-gray-400 mb-1 font-bold">Eventos Especiais</label>
                        <select 
                            className="w-full bg-gray-800 border border-gray-700 rounded text-sm text-white p-1 focus:outline-none focus:border-cyan-500"
                            value={eventOverride || ''}
                            onChange={(e) => setEventOverride(e.target.value as EventType || null)}
                        >
                            <option value="">Automático (Data)</option>
                            <option value="christmas">Natal (Luzes)</option>
                            <option value="new_year">Ano Novo (Fogos)</option>
                            <option value="carnival">Carnaval (Desfile)</option>
                            <option value="easter">Páscoa (Ovos)</option>
                            <option value="junina">Festa Junina (Bandeiras/Fogueira)</option>
                            <option value="independence">Independência (Militar)</option>
                            <option value="halloween">Halloween (Monstros/Abóboras)</option>
                        </select>
                    </div>
                 </div>
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Main City View Area (3D) */}
      <div className="flex-1 bg-black rounded-2xl overflow-hidden border border-gray-700 shadow-2xl relative">
        <MemoizedCity3D 
            buildings={buildings} 
            isNight={isNight} 
            weatherCondition={activeCondition}
            weatherDescription={activeDescription}
            placementMode={placementMode}
            landmarkCatalog={landmarkCatalog}
            onConfirmPlacement={onConfirmPlacement}
            onCancelPlacement={onCancelPlacement}
            activeEvent={currentEvent}
            population={stats.population}
            unlockedVehicles={unlockedVehicles}
        />
        
        {/* Placement Mode Overlay */}
        {placementMode.active && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-900/80 border border-yellow-600 text-yellow-100 px-6 py-3 rounded-full backdrop-blur-md shadow-lg flex items-center gap-4 z-40 animate-pulse">
                <span className="font-bold flex items-center gap-2"><Hammer className="w-4 h-4"/> Modo de Construção</span>
                <span className="text-sm opacity-80 border-l border-yellow-700 pl-4">Clique para posicionar • ESC para cancelar</span>
                <button onClick={onCancelPlacement} className="bg-black/20 p-1 rounded-full hover:bg-black/40"><X className="w-4 h-4"/></button>
            </div>
        )}
      </div>

    </div>
  );
}

// Simple Memoization wrapper to prevent re-renders of the heavy 3D canvas when Clock ticks
const MemoizedCity3D = React.memo(City3D, (prev, next) => {
    return (
        prev.buildings === next.buildings && 
        prev.isNight === next.isNight && 
        prev.weatherCondition === next.weatherCondition &&
        prev.weatherDescription === next.weatherDescription &&
        prev.activeEvent === next.activeEvent &&
        prev.placementMode.active === next.placementMode.active &&
        prev.population === next.population &&
        prev.unlockedVehicles === next.unlockedVehicles
    );
});
