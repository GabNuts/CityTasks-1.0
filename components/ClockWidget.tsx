
import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Cloud, Leaf, Snowflake, Flower, Clock, Calendar, Timer, Hourglass, Globe, X, Settings, Play, Square, RotateCcw, Plus, Trash2, Volume2, Upload, AlertCircle, Repeat, Bell, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMoonPhase, getSeasonSouthernHemisphere, getGameDay, formatTime, formatDateFull, getWorldTime, getAstronomicalEvents, getMonthlyMoonPhases } from '../utils/timeHelpers';
import { saveAudioBlob, getAudioBlob, deleteAudioBlob } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import RichTextEditor from './RichTextEditor';

interface ClockWidgetProps {
  gameCreatedAt: number;
}

type AlarmType = 'fixed' | 'interval';

interface Alarm {
  id: string;
  type: AlarmType;
  time: string; 
  days: number[];
  intervalMinutes: number;
  windowStart: string;
  windowEnd: string;
  lastTriggered: number;
  label: string;
  isActive: boolean;
  hasCustomAudio: boolean;
  gradualWakeup: boolean;
  gradualDuration: number;
  descriptionHtml: string;
}

interface WorldCity {
    id: string;
    name: string;
    offset: number;
}

const DEFAULT_DESC = '<p>Descrição...</p>';
const DEFAULT_LABEL = 'Novo Alarme';

const ClockWidget: React.FC<ClockWidgetProps> = ({ gameCreatedAt }) => {
  const [now, setNow] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'clock' | 'moon'>('clock');
  
  // State para navegação do calendário lunar
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  const lastCheckedMinuteRef = useRef<string>('');

  // --- ALARMS STATE ---
  const [alarms, setAlarms] = useState<Alarm[]>(() => {
    try {
      const saved = localStorage.getItem('citytask_alarms_v2'); 
      if (!saved) {
          const old = localStorage.getItem('citytask_alarms');
          if (old) {
              const oldAlarms = JSON.parse(old);
              return oldAlarms.map((a: any) => ({
                  ...a,
                  type: 'fixed',
                  intervalMinutes: 120,
                  windowStart: '08:00',
                  windowEnd: '20:00',
                  lastTriggered: Date.now()
              }));
          }
          return [];
      }
      return JSON.parse(saved);
    } catch (e) {
      console.error("Erro ao carregar alarmes:", e);
      return [];
    }
  });

  const [isEditingAlarm, setIsEditingAlarm] = useState<string | null>(null);
  
  const [alarmForm, setAlarmForm] = useState<Alarm>({
      id: '', type: 'fixed', time: '08:00', days: [], intervalMinutes: 60,
      windowStart: '09:00', windowEnd: '18:00', lastTriggered: Date.now(),
      label: DEFAULT_LABEL, isActive: true, hasCustomAudio: false, 
      gradualWakeup: false, gradualDuration: 30, descriptionHtml: DEFAULT_DESC
  });
  
  // Audio Playback State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeAlarmId, setActiveAlarmId] = useState<string | null>(null);
  const [currentVolume, setCurrentVolume] = useState(1);
  const gradualIntervalRef = useRef<number | null>(null);

  // --- WORLD CITIES ---
  const [worldCities, setWorldCities] = useState<WorldCity[]>(() => {
      try {
        const saved = localStorage.getItem('citytask_world_cities');
        return saved ? JSON.parse(saved) : [
            { id: '1', name: 'Nova York', offset: -5 },
            { id: '2', name: 'Tóquio', offset: 9 }
        ];
      } catch {
        return [
            { id: '1', name: 'Nova York', offset: -5 },
            { id: '2', name: 'Tóquio', offset: 9 }
        ];
      }
  });

  // --- TIMERS ---
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const stopwatchRef = useRef<number | null>(null);

  const [timerInput, setTimerInput] = useState(5);
  const [timerTimeLeft, setTimerTimeLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerFinished, setTimerFinished] = useState(false); // State para o alerta do timer
  const timerRef = useRef<number | null>(null);

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('citytask_alarms_v2', JSON.stringify(alarms));
  }, [alarms]);

  useEffect(() => {
    localStorage.setItem('citytask_world_cities', JSON.stringify(worldCities));
  }, [worldCities]);

  // --- CLOCK TICK & ALARM CHECK ---
  useEffect(() => {
    const interval = setInterval(() => {
      const current = new Date();
      setNow(current);

      const currentTimeStr = current.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const currentTimestamp = current.getTime();

      // 1. Check Fixed Alarms
      if (currentTimeStr !== lastCheckedMinuteRef.current) {
        lastCheckedMinuteRef.current = currentTimeStr;
        const currentDay = current.getDay();

        setAlarms(prevAlarms => {
            const newAlarms = prevAlarms.map(alarm => {
                if (!alarm.isActive) return alarm;

                if (alarm.type === 'fixed') {
                    if (alarm.time === currentTimeStr) {
                        if (alarm.days.length === 0 || alarm.days.includes(currentDay)) {
                            triggerAlarm(alarm);
                            if (alarm.days.length === 0) {
                                return { ...alarm, isActive: false };
                            }
                        }
                    }
                }
                return alarm;
            });
            return newAlarms;
        });
      }

      // 2. Check Interval Alarms
      alarms.forEach(alarm => {
          if (!alarm.isActive || alarm.type !== 'interval') return;

          const [hNow, mNow] = currentTimeStr.split(':').map(Number);
          const nowMins = hNow * 60 + mNow;
          
          const [hStart, mStart] = alarm.windowStart.split(':').map(Number);
          const startMins = hStart * 60 + mStart;
          
          const [hEnd, mEnd] = alarm.windowEnd.split(':').map(Number);
          const endMins = hEnd * 60 + mEnd;

          if (nowMins >= startMins && nowMins <= endMins) {
              const elapsedMs = currentTimestamp - alarm.lastTriggered;
              const intervalMs = alarm.intervalMinutes * 60 * 1000;
              
              if (elapsedMs >= intervalMs) {
                  triggerAlarm(alarm);
                  setAlarms(prev => prev.map(a => a.id === alarm.id ? { ...a, lastTriggered: currentTimestamp } : a));
              }
          }
      });

    }, 1000);
    return () => clearInterval(interval);
  }, [alarms]);

  // --- ALARM LOGIC ---

  const triggerAlarm = async (alarm: Alarm) => {
      if (activeAlarmId === alarm.id) return;
      if (timerFinished) stopTimerAlert(); // Prioridade para alarme se timer estiver tocando

      setActiveAlarmId(alarm.id);
      setIsOpen(true);

      if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
      }

      let audioSrc = "https://actions.google.com/sounds/v1/alarms/digital_watch.ogg"; 
      
      if (alarm.hasCustomAudio) {
          try {
              const blob = await getAudioBlob(alarm.id);
              if (blob) {
                  audioSrc = URL.createObjectURL(blob);
              }
          } catch (e) {
              console.error("Error loading custom audio", e);
          }
      }

      const audio = new Audio(audioSrc);
      audio.loop = true;
      audioRef.current = audio;

      if (alarm.gradualWakeup) {
          audio.volume = 0; 
          audio.play().catch(e => console.log("Autoplay blocked", e));
          
          const durationSeconds = Math.max(5, Math.min(30, alarm.gradualDuration));
          let currentSecond = 0;
          
          if (gradualIntervalRef.current) clearInterval(gradualIntervalRef.current);
          
          gradualIntervalRef.current = window.setInterval(() => {
              currentSecond++;
              const newVol = Math.min(1, currentSecond / durationSeconds);
              
              if (audioRef.current) audioRef.current.volume = newVol;
              setCurrentVolume(newVol);
              
              if (currentSecond >= durationSeconds) {
                  if (gradualIntervalRef.current) clearInterval(gradualIntervalRef.current);
              }
          }, 1000);
      } else {
          audio.volume = 1;
          audio.play().catch(e => console.log("Autoplay blocked", e));
      }
  };

  const stopAlarm = () => {
      if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = ""; 
      }
      if (gradualIntervalRef.current) clearInterval(gradualIntervalRef.current);
      setActiveAlarmId(null);
  };

  const handleSaveAlarm = async () => {
      if (!alarmForm.id) {
         const newAlarm = { ...alarmForm, id: uuidv4(), lastTriggered: Date.now() };
         setAlarms(prev => [...prev, newAlarm]);
      } else {
         setAlarms(prev => prev.map(a => a.id === alarmForm.id ? alarmForm : a));
      }
      setIsEditingAlarm(null);
  };

  const handleDeleteAlarm = async (id: string) => {
      if (confirm('Deletar este alarme?')) {
          await deleteAudioBlob(id);
          setAlarms(prev => prev.filter(a => a.id !== id));
      }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const tempId = alarmForm.id || uuidv4();
          await saveAudioBlob(tempId, file);
          setAlarmForm({ ...alarmForm, id: tempId, hasCustomAudio: true });
      }
  };

  // --- TIMER/STOPWATCH LOGIC ---
  useEffect(() => {
    if (stopwatchRunning) stopwatchRef.current = window.setInterval(() => setStopwatchTime(p => p + 10), 10);
    else if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    return () => { if (stopwatchRef.current) clearInterval(stopwatchRef.current); };
  }, [stopwatchRunning]);

  useEffect(() => {
    if (timerRunning && timerTimeLeft > 0) {
        timerRef.current = window.setInterval(() => setTimerTimeLeft(p => p - 1), 1000);
    } else if (timerTimeLeft === 0 && timerRunning) {
        // TIMER FINISHED LOGIC
        setTimerRunning(false);
        setTimerFinished(true);
        setIsOpen(true); // Abre o modal para mostrar o alerta

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
        // Som padrão de alarme para o timer
        const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
        audio.loop = true;
        audioRef.current = audio;
        audio.play().catch(e => console.log("Timer audio blocked", e));

    } else if (!timerRunning && timerRef.current) {
        clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning, timerTimeLeft]);

  const stopTimerAlert = () => {
      setTimerFinished(false);
      if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
      }
  };

  const formatStopwatch = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const c = Math.floor((ms % 1000) / 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${c.toString().padStart(2, '0')}`;
  };
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- WORLD CITY LOGIC ---
  const addWorldCity = () => {
      setWorldCities(prev => [...prev, { id: uuidv4(), name: 'Nova Cidade', offset: 0 }]);
  };
  const removeWorldCity = (id: string) => {
      setWorldCities(prev => prev.filter(c => c.id !== id));
  };
  const updateWorldCity = (id: string, field: 'name'|'offset', value: string|number) => {
      setWorldCities(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  // --- CALENDAR NAVIGATION ---
  const changeMonth = (delta: number) => {
    const newDate = new Date(calendarViewDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCalendarViewDate(newDate);
  };

  // --- HELPERS RENDER ---
  const moonPhase = getMoonPhase(now);
  const season = getSeasonSouthernHemisphere(now);
  
  // Use calendarViewDate for the Astronomy tab data
  const astroEvents = getAstronomicalEvents(calendarViewDate.getFullYear());
  const moonCalendar = getMonthlyMoonPhases(calendarViewDate.getFullYear(), calendarViewDate.getMonth());

  return (
    <>
      {/* MINIMIZED WIDGET */}
      <div 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-2xl p-4 shadow-2xl cursor-pointer hover:bg-gray-800 transition-all group z-30 min-w-[260px]"
      >
        <div className="flex flex-col items-center mb-2">
           <span className="text-8xl font-bold text-white tracking-tighter font-mono drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] leading-none">
             {formatTime(now)}
           </span>
           <div className="flex items-center gap-2 mt-2">
             <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Dia de Jogo</span>
             <span className="text-cyan-400 font-bold text-xl leading-none">#{getGameDay(gameCreatedAt)}</span>
           </div>
        </div>
        
        <div className="text-lg font-medium text-green-400 border-t border-gray-700 pt-3 mb-3 text-center">
          {formatDateFull(now)}
        </div>

        <div className="flex justify-between items-center text-xs text-gray-400">
           <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-lg" title={moonPhase.name}>
              <span className="text-lg leading-none">{moonPhase.emoji}</span>
              <span>{moonPhase.name}</span>
           </div>
           <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-lg">
              {season.icon === 'sun' && <Sun className="w-4 h-4 text-yellow-500"/>}
              {season.icon === 'snowflake' && <Snowflake className="w-4 h-4 text-blue-300"/>}
              <span>{season.name}</span>
           </div>
        </div>
        <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-gray-700 text-[10px] text-gray-500">
            {worldCities.slice(0, 3).map((city) => (
              <div key={city.id} className="flex justify-between"><span>{city.name}:</span><span className="text-gray-300">{getWorldTime(city.offset)}</span></div>
            ))}
            {worldCities.length > 3 && <div className="text-center text-gray-600">...</div>}
        </div>
      </div>

      {/* ACTIVE ALARM / TIMER OVERLAY */}
      {(activeAlarmId || timerFinished) && (
          <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
              <div className="w-full max-w-2xl bg-gray-900 border-2 border-cyan-500 rounded-3xl p-8 shadow-[0_0_50px_rgba(6,182,212,0.5)] text-center relative overflow-hidden flex flex-col items-center">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-pulse"/>
                  
                  {timerFinished ? (
                      <Hourglass className="w-20 h-20 text-orange-400 mx-auto mb-6 animate-spin-slow" />
                  ) : (
                      <Clock className="w-20 h-20 text-cyan-400 mx-auto mb-6 animate-bounce" />
                  )}
                  
                  <h1 className="text-6xl font-bold text-white mb-2">{timerFinished ? "00:00" : formatTime(now)}</h1>
                  <h2 className="text-2xl text-cyan-300 mb-8 font-light">
                      {timerFinished ? "Tempo Esgotado!" : alarms.find(a => a.id === activeAlarmId)?.label}
                  </h2>

                  {!timerFinished && (
                    <div className="bg-gray-800/80 rounded-xl p-6 text-left text-gray-200 mb-8 w-full max-h-[40vh] overflow-y-auto prose prose-invert prose-img:rounded-lg prose-img:mx-auto prose-p:my-2">
                        <div dangerouslySetInnerHTML={{ __html: alarms.find(a => a.id === activeAlarmId)?.descriptionHtml || '' }} />
                    </div>
                  )}

                  <button 
                    onClick={timerFinished ? stopTimerAlert : stopAlarm}
                    className={`${timerFinished ? 'bg-orange-600 hover:bg-orange-500' : 'bg-cyan-600 hover:bg-cyan-500'} text-white font-bold text-xl py-4 px-12 rounded-full shadow-lg transform transition hover:scale-105`}
                  >
                      {timerFinished ? "Parar Timer" : "Acordar / Parar"}
                  </button>
              </div>
          </div>
      )}

      {/* MAIN MODAL */}
      {isOpen && !activeAlarmId && !timerFinished && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-gray-800 border border-gray-600 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
              
              <div className="flex justify-between items-center p-4 bg-gray-900 border-b border-gray-700">
                <div className="flex gap-4">
                  <button onClick={() => setActiveTab('clock')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'clock' ? 'bg-cyan-600 text-white' : 'hover:bg-gray-700 text-gray-400'}`}>
                    <Clock className="w-4 h-4" /> Relógio & Alarmes
                  </button>
                  <button onClick={() => { setActiveTab('moon'); setCalendarViewDate(new Date()); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'moon' ? 'bg-purple-600 text-white' : 'hover:bg-gray-700 text-gray-400'}`}>
                    <Moon className="w-4 h-4" /> Astronomia
                  </button>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-gray-900/50">
                 
                 {/* --- TAB CLOCK --- */}
                 {activeTab === 'clock' && (
                   <div className="flex flex-col gap-6">
                      
                      {/* ALARMS SECTION */}
                      <div className="w-full bg-gray-800 p-6 rounded-xl border border-gray-700">
                         {/* ... (Alarm code remains the same) ... */}
                         <div className="flex justify-between items-center mb-4">
                             <h3 className="text-lg font-bold text-white flex items-center gap-2"><Clock className="w-5 h-5 text-cyan-400"/> Alarmes</h3>
                             <button 
                                onClick={() => {
                                    setAlarmForm({ 
                                        id: '', type: 'fixed', time: '08:00', label: DEFAULT_LABEL, isActive: true, 
                                        days: [], intervalMinutes: 60, windowStart: '08:00', windowEnd: '20:00', lastTriggered: Date.now(),
                                        hasCustomAudio: false, gradualWakeup: false, gradualDuration: 30, descriptionHtml: DEFAULT_DESC 
                                    });
                                    setIsEditingAlarm('new');
                                }}
                                className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                             >
                                 <Plus size={16}/> Novo
                             </button>
                         </div>

                         {/* EDIT FORM (Hidden for brevity if not editing) */}
                         {isEditingAlarm && (
                             <div className="bg-gray-900 p-4 rounded-lg border border-gray-600 mb-4 animate-in slide-in-from-top-2">
                                 {/* Alarm Type Switch */}
                                 <div className="flex gap-2 mb-4 border-b border-gray-700 pb-2">
                                     <button 
                                        onClick={() => setAlarmForm({...alarmForm, type: 'fixed'})}
                                        className={`flex-1 py-1.5 text-sm rounded ${alarmForm.type === 'fixed' ? 'bg-cyan-700 text-white' : 'bg-gray-800 text-gray-400'}`}
                                     >Horário Fixo</button>
                                     <button 
                                        onClick={() => setAlarmForm({...alarmForm, type: 'interval'})}
                                        className={`flex-1 py-1.5 text-sm rounded ${alarmForm.type === 'interval' ? 'bg-cyan-700 text-white' : 'bg-gray-800 text-gray-400'}`}
                                     >Lembrete (Intervalo)</button>
                                 </div>

                                 <div className="grid grid-cols-2 gap-4 mb-4">
                                     {alarmForm.type === 'fixed' ? (
                                        <div>
                                            <label className="text-xs text-gray-400">Horário</label>
                                            <input type="time" value={alarmForm.time} onChange={e => setAlarmForm({...alarmForm, time: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-xl text-white font-mono" />
                                        </div>
                                     ) : (
                                        <div className="col-span-2 grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="text-xs text-gray-400">A cada (min)</label>
                                                <input type="number" min="1" value={alarmForm.intervalMinutes} onChange={e => setAlarmForm({...alarmForm, intervalMinutes: parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-400">Início Janela</label>
                                                <input type="time" value={alarmForm.windowStart} onChange={e => setAlarmForm({...alarmForm, windowStart: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-400">Fim Janela</label>
                                                <input type="time" value={alarmForm.windowEnd} onChange={e => setAlarmForm({...alarmForm, windowEnd: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white" />
                                            </div>
                                        </div>
                                     )}
                                     
                                     {alarmForm.type === 'fixed' && (
                                         <div>
                                            <label className="text-xs text-gray-400">Nome</label>
                                            <input 
                                                type="text" 
                                                value={alarmForm.label} 
                                                onFocus={() => { if(alarmForm.label === DEFAULT_LABEL) setAlarmForm({...alarmForm, label: ''}) }}
                                                onChange={e => setAlarmForm({...alarmForm, label: e.target.value})} 
                                                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white" 
                                            />
                                         </div>
                                     )}
                                 </div>
                                 
                                 {alarmForm.type === 'fixed' ? (
                                     <div className="mb-4">
                                         <label className="text-xs text-gray-400 block mb-1">Recorrência (Deixe vazio para tocar uma vez)</label>
                                         <div className="flex gap-1">
                                             {['D','S','T','Q','Q','S','S'].map((d, i) => (
                                                 <button 
                                                    key={i}
                                                    onClick={() => setAlarmForm(prev => ({...prev, days: prev.days.includes(i) ? prev.days.filter(day => day !== i) : [...prev.days, i]}))}
                                                    className={`w-8 h-8 rounded text-sm font-bold ${alarmForm.days.includes(i) ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}
                                                 >{d}</button>
                                             ))}
                                         </div>
                                     </div>
                                 ) : (
                                    <div className="mb-4">
                                        <label className="text-xs text-gray-400">Nome do Lembrete</label>
                                        <input 
                                            type="text" 
                                            value={alarmForm.label} 
                                            onFocus={() => { if(alarmForm.label === DEFAULT_LABEL) setAlarmForm({...alarmForm, label: ''}) }}
                                            onChange={e => setAlarmForm({...alarmForm, label: e.target.value})} 
                                            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white" 
                                        />
                                    </div>
                                 )}

                                 <div className="grid md:grid-cols-2 gap-4 mb-4">
                                     <div className="bg-gray-800 p-3 rounded border border-gray-700">
                                         <label className="text-xs text-gray-400 flex items-center gap-2 mb-2">
                                             <Volume2 size={14}/> Som do Alarme
                                         </label>
                                         <div className="flex items-center gap-2">
                                             <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-xs flex items-center gap-1 text-white">
                                                 <Upload size={12}/> {alarmForm.hasCustomAudio ? 'Alterar Audio' : 'Upload Audio'}
                                                 <input type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
                                             </label>
                                             {alarmForm.hasCustomAudio && <span className="text-xs text-green-400">Audio Customizado Ativo</span>}
                                         </div>
                                     </div>
                                     
                                     <div className="bg-gray-800 p-3 rounded border border-gray-700">
                                         <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-gray-400">Despertar Gradual</span>
                                            <input type="checkbox" checked={alarmForm.gradualWakeup} onChange={e => setAlarmForm({...alarmForm, gradualWakeup: e.target.checked})} />
                                         </div>
                                         {alarmForm.gradualWakeup && (
                                             <div className="flex items-center gap-2">
                                                 <input 
                                                    type="range" min="5" max="30" 
                                                    value={alarmForm.gradualDuration} 
                                                    onChange={e => setAlarmForm({...alarmForm, gradualDuration: parseInt(e.target.value)})} 
                                                    className="flex-1" 
                                                 />
                                                 <span className="text-xs text-white whitespace-nowrap">{alarmForm.gradualDuration} seg</span>
                                             </div>
                                         )}
                                     </div>
                                 </div>

                                 <div className="mb-4">
                                     <label className="text-xs text-gray-400 block mb-1">Descrição (Rich Text)</label>
                                     <RichTextEditor 
                                        initialContent={alarmForm.descriptionHtml}
                                        onFocus={() => { 
                                            if(alarmForm.descriptionHtml === DEFAULT_DESC) setAlarmForm({...alarmForm, descriptionHtml: ''});
                                        }}
                                        onChange={(html) => setAlarmForm({...alarmForm, descriptionHtml: html})}
                                     />
                                 </div>

                                 <div className="flex justify-end gap-2">
                                     <button onClick={() => setIsEditingAlarm(null)} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
                                     <button onClick={handleSaveAlarm} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold">Salvar Alarme</button>
                                 </div>
                             </div>
                         )}

                         {/* ALARMS LIST */}
                         <div className="space-y-2 max-h-60 overflow-y-auto">
                             {alarms.length === 0 && <div className="text-gray-500 text-sm italic text-center py-4">Nenhum alarme configurado.</div>}
                             {alarms.map(alarm => (
                                 <div key={alarm.id} className="bg-gray-900 border border-gray-700 p-3 rounded-lg flex items-center justify-between group">
                                     <div className="flex items-center gap-4">
                                         <div className="flex flex-col">
                                             {alarm.type === 'fixed' ? (
                                                <>
                                                    <span className="text-2xl font-mono font-bold text-white">{alarm.time}</span>
                                                    <span className="text-xs text-gray-500">
                                                        {alarm.days.length === 0 ? 'Uma vez' : (alarm.days.length === 7 ? 'Todos os dias' : alarm.days.map(d => ['D','S','T','Q','Q','S','S'][d]).join(' '))}
                                                    </span>
                                                </>
                                             ) : (
                                                <>
                                                    <span className="text-lg font-mono font-bold text-white flex items-center gap-1"><Bell size={16}/> {alarm.intervalMinutes}m</span>
                                                    <span className="text-xs text-gray-500">{alarm.windowStart} - {alarm.windowEnd}</span>
                                                </>
                                             )}
                                         </div>
                                         <div className="border-l border-gray-700 pl-4">
                                             <div className="text-sm font-bold text-cyan-200">{alarm.label}</div>
                                             {alarm.gradualWakeup && <div className="text-[10px] text-orange-400 flex items-center gap-1"><Volume2 size={10}/> Gradual {alarm.gradualDuration}s</div>}
                                         </div>
                                     </div>
                                     <div className="flex items-center gap-3">
                                         <button 
                                            onClick={() => {
                                                setAlarms(alarms.map(a => a.id === alarm.id ? {...a, isActive: !a.isActive} : a));
                                            }}
                                            className={`w-10 h-6 rounded-full relative transition-colors ${alarm.isActive ? 'bg-green-600' : 'bg-gray-700'}`}
                                         >
                                             <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${alarm.isActive ? 'left-5' : 'left-1'}`} />
                                         </button>
                                         <button onClick={() => { setAlarmForm(alarm); setIsEditingAlarm(alarm.id); }} className="p-2 hover:bg-gray-800 rounded text-blue-400"><Settings size={16}/></button>
                                         <button 
                                            onClick={() => handleDeleteAlarm(alarm.id)} 
                                            className="p-2 hover:bg-gray-800 rounded text-red-400"
                                         ><Trash2 size={16}/></button>
                                     </div>
                                 </div>
                             ))}
                         </div>
                      </div>

                      {/* UTILS (Timer/Stopwatch GRID) */}
                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 aspect-square flex flex-col justify-center items-center relative">
                             <div className="absolute top-4 left-4 font-bold text-white flex gap-2 text-sm"><Hourglass size={16} className="text-orange-400"/> Timer</div>
                             
                             <div className="text-6xl font-mono text-white mb-6 mt-4">{timerRunning || timerTimeLeft > 0 ? formatTimer(timerTimeLeft) : `${timerInput}m`}</div>
                             
                             <div className="flex gap-4 justify-center w-full items-center">
                                <input type="number" value={timerInput} onChange={e => setTimerInput(parseInt(e.target.value)||0)} className="w-20 h-10 bg-gray-900 border border-gray-600 rounded px-1 text-center text-white text-lg" disabled={timerRunning}/>
                                {!timerRunning ? 
                                    <button onClick={() => {if(timerTimeLeft===0) setTimerTimeLeft(timerInput*60); setTimerRunning(true)}} className="bg-green-600 p-3 rounded text-white hover:bg-green-500 transition-colors"><Play size={24}/></button> : 
                                    <button onClick={() => setTimerRunning(false)} className="bg-yellow-600 p-3 rounded text-white hover:bg-yellow-500 transition-colors"><Square size={24}/></button>
                                }
                                <button onClick={() => {setTimerRunning(false); setTimerTimeLeft(0)}} className="bg-red-600 p-3 rounded text-white hover:bg-red-500 transition-colors"><RotateCcw size={24}/></button>
                             </div>
                          </div>

                          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 aspect-square flex flex-col justify-center items-center relative">
                             <div className="absolute top-4 left-4 font-bold text-white flex gap-2 text-sm"><Timer size={16} className="text-blue-400"/> Cronômetro</div>
                             
                             <div className="text-6xl font-mono text-white mb-6 mt-4">{formatStopwatch(stopwatchTime).split(':').slice(0,2).join(':')}<span className="text-2xl text-gray-500">.{formatStopwatch(stopwatchTime).split(':')[2]}</span></div>
                             
                             <div className="flex gap-4 justify-center w-full">
                                {!stopwatchRunning ? 
                                    <button onClick={() => setStopwatchRunning(true)} className="bg-green-600 px-8 py-3 rounded text-white hover:bg-green-500 transition-colors"><Play size={24}/></button> : 
                                    <button onClick={() => setStopwatchRunning(false)} className="bg-yellow-600 px-8 py-3 rounded text-white hover:bg-yellow-500 transition-colors"><Square size={24}/></button>
                                }
                                <button onClick={() => {setStopwatchRunning(false); setStopwatchTime(0)}} className="bg-red-600 px-8 py-3 rounded text-white hover:bg-red-500 transition-colors"><RotateCcw size={24}/></button>
                             </div>
                          </div>
                      </div>
                      
                      {/* WORLD CLOCK */}
                      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                             <div className="flex justify-between items-center mb-2">
                                 <h3 className="font-bold text-white flex gap-2 text-sm"><Globe size={16} className="text-green-400"/> Mundo</h3>
                                 <button onClick={addWorldCity} className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-2 py-1 rounded flex items-center gap-1"><Plus size={12}/> Cidade</button>
                             </div>
                             <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                                {worldCities.map((city) => (
                                    <div key={city.id} className="flex justify-between items-center text-sm bg-gray-900 p-3 rounded group">
                                        <div className="flex items-center gap-2 flex-1">
                                            <button onClick={() => removeWorldCity(city.id)} className="text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={12}/></button>
                                            <input value={city.name} onChange={e=>updateWorldCity(city.id, 'name', e.target.value)} className="bg-transparent text-gray-300 w-full focus:outline-none"/>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="number" value={city.offset} onChange={e=>updateWorldCity(city.id, 'offset', Number(e.target.value))} className="bg-gray-800 text-center w-12 rounded text-gray-500 text-xs py-1"/>
                                            <span className="font-mono text-cyan-400 font-bold w-12 text-right">{getWorldTime(city.offset)}</span>
                                        </div>
                                    </div>
                                ))}
                             </div>
                      </div>

                   </div>
                 )}

                 {/* --- TAB ASTRONOMY --- */}
                 {activeTab === 'moon' && (
                    <div className="space-y-6">
                       
                       {/* Moon Calendar */}
                       <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                           <div className="flex justify-between items-center mb-4">
                               <h3 className="text-xl font-bold text-white flex items-center gap-2"><Moon className="w-5 h-5 text-purple-400"/> Calendário Lunar</h3>
                               <div className="flex items-center gap-4 text-sm font-bold text-gray-300">
                                   <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-700 rounded"><ChevronLeft size={20}/></button>
                                   <span className="min-w-[140px] text-center capitalize">{calendarViewDate.toLocaleDateString('pt-BR', {month:'long', year: 'numeric'})}</span>
                                   <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-700 rounded"><ChevronRight size={20}/></button>
                               </div>
                           </div>
                           
                           <div className="grid grid-cols-7 gap-2">
                               {['Dom','Seg','Ter','Qua','Qui','Sex','Sab'].map(d => (
                                   <div key={d} className="text-center text-xs font-bold text-gray-500 uppercase py-2">{d}</div>
                               ))}
                               
                               {Array.from({length: new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), 1).getDay()}).map((_, i) => (
                                   <div key={`empty-${i}`} className="bg-transparent" />
                               ))}

                               {moonCalendar.map((day) => (
                                   <div key={day.day} className={`aspect-square rounded-lg border flex flex-col items-center justify-center p-1 relative ${day.isToday ? 'bg-cyan-900/40 border-cyan-500' : 'bg-gray-900 border-gray-700'} hover:border-gray-500 transition-colors cursor-default group`}>
                                       <span className={`absolute top-1 left-2 text-[10px] font-bold ${day.isToday ? 'text-cyan-400' : 'text-gray-500'}`}>{day.day}</span>
                                       
                                       <div className="text-2xl" title={day.phase.name}>
                                            {day.phase.emoji}
                                       </div>
                                       
                                       {/* Events in Bottom Right */}
                                       <div className="absolute bottom-1 right-1 flex gap-0.5 justify-end">
                                           {day.holidayEmoji && <span className="text-lg leading-none hover:scale-125 transition-transform" title="Feriado">{day.holidayEmoji}</span>}
                                           {day.astroEmoji && <span className="text-lg leading-none hover:scale-125 transition-transform" title={day.astroName || ''}>{day.astroEmoji}</span>}
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </div>

                       {/* Year Events */}
                       <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">Solstícios e Equinócios ({calendarViewDate.getFullYear()})</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {astroEvents.map((evt, i) => (
                                  <div key={i} className="bg-gray-900 p-4 rounded-lg flex flex-col items-center text-center border border-gray-700 hover:border-cyan-500 transition-colors">
                                      <div className="text-4xl mb-2">{evt.emoji}</div>
                                      <span className="text-sm font-bold text-gray-200">{evt.name}</span>
                                      <span className="text-base text-gray-300 mt-2 font-mono">{evt.date.toLocaleDateString('pt-BR')}</span>
                                      <span className="text-sm text-gray-500 font-mono">{evt.date.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</span>
                                  </div>
                              ))}
                          </div>
                       </div>

                    </div>
                 )}

              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default ClockWidget;
