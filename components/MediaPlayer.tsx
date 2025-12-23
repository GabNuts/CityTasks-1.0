import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, List, X, Minimize2, GripHorizontal, Upload, Link as LinkIcon, Subtitles, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { MediaItem } from '../types';

export default function MediaPlayer() {
  // --- STATE: WINDOW & PERSISTENCE ---
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ w: 400, h: 300 });
  const [isMinimized, setIsMinimized] = useState(true); // Start minimized by default
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // --- STATE: PLAYER ---
  const [playlist, setPlaylist] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0); // 0 to 1
  const [duration, setDuration] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  
  // Inputs
  const [ytUrlInput, setYtUrlInput] = useState('');
  
  // Fix: Use 'any' for playerRef to avoid type issues with ReactPlayer import as value vs type
  const playerRef = useRef<any>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  // Cast ReactPlayer to any to avoid TypeScript errors with url/ref props
  const Player = ReactPlayer as any;

  // --- PERSISTENCE EFFECT ---
  useEffect(() => {
    const saved = localStorage.getItem('citytask_mediaplayer');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.position) setPosition(parsed.position);
      if (parsed.size) setSize(parsed.size);
      if (parsed.volume !== undefined) setVolume(parsed.volume);
      if (parsed.isShuffle !== undefined) setIsShuffle(parsed.isShuffle);
      // We cannot persist blob URLs for local files, so we start with empty playlist or handle it carefully.
      // For this implementation, we won't persist the playlist to avoid stale blobs.
    }

    // Listen to toggle event from CityDisplay
    const handleToggle = () => setIsMinimized(prev => !prev);
    window.addEventListener('citytask-toggle-player', handleToggle);
    return () => window.removeEventListener('citytask-toggle-player', handleToggle);
  }, []);

  useEffect(() => {
    localStorage.setItem('citytask_mediaplayer', JSON.stringify({
      position, size, volume, isShuffle
    }));
  }, [position, size, volume, isShuffle]);

  // --- WINDOW CONTROLS ---

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof Element && e.target.closest('.no-drag')) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleResizeDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.current.x,
          y: e.clientY - dragStart.current.y
        });
      } else if (isResizing) {
        const deltaX = e.clientX - dragStart.current.x;
        const deltaY = e.clientY - dragStart.current.y;
        setSize(prev => ({
          w: Math.max(300, prev.w + deltaX),
          h: Math.max(200, prev.h + deltaY)
        }));
        dragStart.current = { x: e.clientX, y: e.clientY };
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing]);

  // --- PLAYER LOGIC ---

  const currentTrack = playlist[currentIndex];

  const handleNext = () => {
    if (playlist.length === 0) return;
    let nextIndex;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = (currentIndex + 1) % playlist.length;
    }
    setCurrentIndex(nextIndex);
    setPlayed(0);
    setIsPlaying(true);
  };

  const handlePrev = () => {
     if (playlist.length === 0) return;
     const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
     setCurrentIndex(prevIndex);
     setPlayed(0);
     setIsPlaying(true);
  };

  const handleAddFile = (e: React.ChangeEvent<HTMLInputElement>, replace = false) => {
    if (e.target.files && e.target.files.length > 0) {
      const newItems: MediaItem[] = Array.from(e.target.files).map((file: File) => ({
        id: uuidv4(),
        type: 'file',
        url: URL.createObjectURL(file),
        title: file.name,
        fileObj: file
      }));

      if (replace) {
        setPlaylist(newItems);
        setCurrentIndex(0);
        setIsPlaying(true);
      } else {
        setPlaylist(prev => [...prev, ...newItems]);
      }
    }
  };

  const handleAddYoutube = (replace = false) => {
    if (!ytUrlInput) return;
    const newItem: MediaItem = {
      id: uuidv4(),
      type: 'youtube',
      url: ytUrlInput,
      title: 'YouTube Video' // ReactPlayer fetches title eventually, or user sets it
    };
    
    if (replace) {
      setPlaylist([newItem]);
      setCurrentIndex(0);
      setIsPlaying(true);
    } else {
      setPlaylist(prev => [...prev, newItem]);
    }
    setYtUrlInput('');
  };

  const handleAddSubtitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && currentTrack && currentTrack.type === 'file') {
      const file = e.target.files[0];
      const subUrl = URL.createObjectURL(file);
      
      const updatedPlaylist = [...playlist];
      updatedPlaylist[currentIndex] = { ...currentTrack, subtitleUrl: subUrl };
      setPlaylist(updatedPlaylist);
    }
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= playlist.length) return;
    const newPlaylist = [...playlist];
    const temp = newPlaylist[index];
    newPlaylist[index] = newPlaylist[index + direction];
    newPlaylist[index + direction] = temp;
    
    // Adjust current index if needed
    if (currentIndex === index) setCurrentIndex(index + direction);
    else if (currentIndex === index + direction) setCurrentIndex(index);
    
    setPlaylist(newPlaylist);
  };

  const removeItem = (index: number) => {
    const newPlaylist = playlist.filter((_, i) => i !== index);
    setPlaylist(newPlaylist);
    if (currentIndex >= newPlaylist.length) setCurrentIndex(Math.max(0, newPlaylist.length - 1));
  };

  const formatTime = (seconds: number) => {
    const pad = (num: number) => num.toString().padStart(2, '0');
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${pad(min)}:${pad(sec)}`;
  };

  if (isMinimized) return null;

  return (
    <div 
      ref={windowRef}
      className="fixed z-50 bg-gray-900/95 backdrop-blur-xl border border-cyan-500/50 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden transition-opacity duration-200"
      style={{ 
        left: position.x, 
        top: position.y, 
        width: size.w, 
        height: size.h,
        minWidth: 350,
        minHeight: 300
      }}
    >
      {/* --- HEADER --- */}
      <div 
        className="h-10 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 flex items-center justify-between px-3 cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
         <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <GripHorizontal size={16} />
            <span className="truncate max-w-[150px]">{currentTrack ? currentTrack.title : 'Midia Player'}</span>
         </div>
         <div className="flex items-center gap-2 no-drag">
            <button onClick={() => setIsMinimized(true)} className="hover:text-white text-gray-400"><Minimize2 size={16}/></button>
         </div>
      </div>

      {/* --- SCREEN AREA --- */}
      <div className="flex-1 bg-black relative group">
         {playlist.length > 0 ? (
            <Player
              ref={playerRef}
              url={currentTrack?.url}
              width="100%"
              height="100%"
              playing={isPlaying}
              volume={volume}
              muted={muted}
              onProgress={(p: any) => setPlayed(p.played)}
              onDuration={setDuration}
              onEnded={handleNext}
              config={{
                file: {
                  tracks: currentTrack?.subtitleUrl ? [
                    {kind: 'subtitles', src: currentTrack.subtitleUrl, srcLang: 'pt', label: 'Português', default: true}
                  ] : []
                }
              } as any}
              style={{ position: 'absolute', top: 0, left: 0 }}
            />
         ) : (
             <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-2">
                 <div className="text-6xl opacity-20"><Play /></div>
                 <p>Sem mídia reproduzindo</p>
             </div>
         )}
         
         {/* Subtitle Overlay Button for Local Files */}
         {currentTrack?.type === 'file' && (
             <label className="absolute top-2 right-2 p-1 bg-black/50 rounded hover:bg-black/80 text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" title="Carregar Legenda (.vtt, .srt)">
                 <Subtitles size={16} />
                 <input type="file" accept=".vtt,.srt" className="hidden" onChange={handleAddSubtitle} />
             </label>
         )}
      </div>

      {/* --- TOOLBAR (INPUTS) --- */}
      {/* Moved below the screen area to ensure accessibility */}
      <div className="bg-gray-800 border-t border-gray-700 p-2 flex gap-2 items-center text-xs">
          <label className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded cursor-pointer flex items-center gap-1 whitespace-nowrap transition-colors" title="Carregar Arquivo Local">
              <Upload size={14} />
              <span className="hidden sm:inline">Arquivo</span>
              <input type="file" accept="video/*,audio/*" multiple className="hidden" onChange={(e) => handleAddFile(e, false)} />
          </label>
          
          <div className="flex-1 flex gap-1">
              <input 
                  className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-gray-300 placeholder-gray-500 focus:border-cyan-500 focus:outline-none" 
                  placeholder="YouTube URL..."
                  value={ytUrlInput}
                  onChange={(e) => setYtUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddYoutube(false)}
              />
              <button onClick={() => handleAddYoutube(false)} className="bg-red-900/50 border border-red-900 text-red-400 px-2 rounded hover:bg-red-900/80 transition-colors" title="Adicionar YouTube">
                  <LinkIcon size={14}/>
              </button>
          </div>
      </div>

      {/* --- CONTROLS --- */}
      <div className="bg-gray-900 border-t border-gray-700 p-2 select-none">
         {/* Progress Bar */}
         <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-2">
            <span>{formatTime(played * duration)}</span>
            <input 
                type="range" min={0} max={1} step="any"
                value={played}
                onChange={e => {
                    setPlayed(parseFloat(e.target.value));
                    playerRef.current?.seekTo(parseFloat(e.target.value));
                }}
                className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full"
            />
            <span>{formatTime(duration)}</span>
         </div>

         <div className="flex items-center justify-between">
            {/* Left: Playback */}
            <div className="flex items-center gap-2">
                <button onClick={() => setIsPlaying(!isPlaying)} className="w-8 h-8 flex items-center justify-center bg-cyan-600 hover:bg-cyan-500 rounded-full text-white shadow">
                    {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                </button>
                <button onClick={() => { setIsPlaying(false); playerRef.current?.seekTo(0); }} className="text-gray-400 hover:text-white"><Square size={14} fill="currentColor"/></button>
                <div className="w-px h-6 bg-gray-700 mx-1"></div>
                <button onClick={handlePrev} className="text-gray-400 hover:text-white"><SkipBack size={18} fill="currentColor"/></button>
                <button onClick={handleNext} className="text-gray-400 hover:text-white"><SkipForward size={18} fill="currentColor"/></button>
            </div>

            {/* Center: List/Shuffle */}
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setIsShuffle(!isShuffle)} 
                    className={`${isShuffle ? 'text-green-400' : 'text-gray-500'} hover:text-white transition-colors`}
                    title="Aleatório"
                >
                    <Shuffle size={16} />
                </button>
                <button 
                    onClick={() => setShowPlaylist(!showPlaylist)} 
                    className={`${showPlaylist ? 'text-cyan-400' : 'text-gray-400'} hover:text-white transition-colors`}
                    title="Playlist"
                >
                    <List size={18} />
                </button>
            </div>

            {/* Right: Volume */}
            <div className="flex items-center gap-2 group/vol relative">
                <button onClick={() => setMuted(!muted)} className="text-gray-400 hover:text-white">
                    {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <div className="w-20 bg-gray-800 h-8 rounded absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/vol:flex items-center px-2 border border-gray-700">
                    <input 
                        type="range" min={0} max={1} step="0.05"
                        value={volume}
                        onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
                        className="w-full h-1 bg-gray-600 rounded appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                    />
                </div>
            </div>
         </div>
      </div>

      {/* --- PLAYLIST MODAL (OVERLAY) --- */}
      {showPlaylist && (
          <div className="absolute inset-x-0 bottom-[108px] top-10 bg-gray-900/95 z-20 flex flex-col animate-in fade-in slide-in-from-bottom-5 border-b border-gray-700">
              <div className="p-2 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                  <span className="text-xs font-bold text-gray-400 uppercase">Playlist ({playlist.length})</span>
                  <button onClick={() => setShowPlaylist(false)} className="text-gray-400 hover:text-white"><X size={16}/></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {playlist.map((item, idx) => (
                      <div 
                        key={item.id} 
                        className={`group flex items-center justify-between p-2 rounded text-sm cursor-pointer ${currentIndex === idx ? 'bg-cyan-900/40 text-cyan-300 border border-cyan-500/30' : 'hover:bg-gray-800 text-gray-300 border border-transparent'}`}
                        onDoubleClick={() => { setCurrentIndex(idx); setIsPlaying(true); }}
                      >
                          <div className="flex items-center gap-2 truncate flex-1">
                              {currentIndex === idx && isPlaying && <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
                              <span className="truncate">{idx + 1}. {item.title}</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={(e) => {e.stopPropagation(); moveItem(idx, -1)}} className="p-1 hover:text-white text-gray-500"><ArrowUp size={12}/></button>
                              <button onClick={(e) => {e.stopPropagation(); moveItem(idx, 1)}} className="p-1 hover:text-white text-gray-500"><ArrowDown size={12}/></button>
                              <button onClick={(e) => {e.stopPropagation(); removeItem(idx)}} className="p-1 hover:text-red-400 text-gray-500"><Trash2 size={12}/></button>
                          </div>
                      </div>
                  ))}
                  {playlist.length === 0 && <div className="text-center text-gray-500 text-xs py-4">Lista vazia</div>}
              </div>
          </div>
      )}

      {/* --- RESIZE HANDLE --- */}
      <div 
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-30"
        onMouseDown={handleResizeDown}
      >
        <svg viewBox="0 0 10 10" className="w-full h-full text-gray-500 fill-current opacity-50">
            <path d="M10 10L10 2L2 10Z" />
        </svg>
      </div>
    </div>
  );
}