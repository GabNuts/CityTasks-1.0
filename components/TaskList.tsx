
import React, { useState, useMemo, useRef } from 'react';
import { Task, TaskDifficulty, FrequencyType, SubTask } from '../types';
import { Plus, Check, Trash2, Zap, AlertTriangle, Calendar, Repeat, ChevronDown, ChevronUp, Tag, Filter, X, ListFilter, Pencil, GripVertical } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { getGameDateString } from '../utils/timeHelpers';

interface TaskListProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void;
  onCompleteTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onEditTask?: (task: Task) => void;
  onReorderTasks?: (tasks: Task[]) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onAddTask, onCompleteTask, onDeleteTask, onToggleSubtask, onEditTask, onReorderTasks }) => {
  // --- States ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'today' | 'tomorrow' | 'urgent' | 'tag'>('today');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [openDetailId, setOpenDetailId] = useState<string | null>(null);
  
  // Edit Mode State
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Drag & Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // --- Form State ---
  const initialFormState = {
    title: '',
    description: '',
    difficulty: TaskDifficulty.EASY,
    dueDate: getGameDateString(), 
    isUrgent: false,
    isRepeatable: false,
    tags: [] as string[],
    subtasks: [] as SubTask[],
    frequency: 'once' as FrequencyType,
    freqCustomValue: 1,
    freqCustomUnit: 'day' as 'day' | 'week' | 'month',
    freqWeekDays: [] as number[],
    freqMonthDay: 1
  };
  const [formData, setFormData] = useState(initialFormState);
  const [newTagInput, setNewTagInput] = useState('');
  const [newSubtaskInput, setNewSubtaskInput] = useState('');

  // --- Helpers ---
  const resetForm = () => {
      setFormData({ ...initialFormState, dueDate: getGameDateString() });
      setEditingTask(null);
  };

  const openEditModal = (task: Task) => {
      setEditingTask(task);
      setFormData({
          title: task.title,
          description: task.description || '',
          difficulty: task.difficulty,
          dueDate: task.dueDate || getGameDateString(),
          isUrgent: task.isUrgent,
          isRepeatable: task.isRepeatable,
          tags: task.tags,
          subtasks: task.subtasks,
          frequency: task.recurrence.type,
          freqWeekDays: task.recurrence.weekDays || [],
          freqMonthDay: task.recurrence.monthDay || 1,
          freqCustomValue: task.recurrence.customValue || 1,
          freqCustomUnit: task.recurrence.customUnit || 'day'
      });
      setIsModalOpen(true);
  };

  // Extract all unique tags from existing tasks for the suggestion list
  const existingTags = useMemo(() => {
    const tags = new Set<string>();
    tasks.forEach(t => t.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags);
  }, [tasks]);

  const handleAddSubtask = () => {
    if (!newSubtaskInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      subtasks: [...prev.subtasks, { id: uuidv4(), title: newSubtaskInput, completed: false }]
    }));
    setNewSubtaskInput('');
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      addTagToForm(newTagInput.trim());
    }
  };

  const addTagToForm = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setNewTagInput('');
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingTask && onEditTask) {
        // Update existing task
        onEditTask({
            ...editingTask,
            title: formData.title,
            description: formData.description,
            difficulty: formData.difficulty,
            dueDate: formData.dueDate,
            isUrgent: formData.isUrgent,
            isRepeatable: formData.isRepeatable,
            tags: formData.tags,
            subtasks: formData.subtasks,
            recurrence: {
                type: formData.frequency,
                weekDays: formData.frequency === 'weekly' ? formData.freqWeekDays : undefined,
                monthDay: formData.frequency === 'monthly' ? formData.freqMonthDay : undefined,
                customValue: formData.frequency === 'custom' ? formData.freqCustomValue : undefined,
                customUnit: formData.frequency === 'custom' ? formData.freqCustomUnit : undefined,
            }
        });
    } else {
        // Create new task
        onAddTask({
            title: formData.title,
            description: formData.description,
            difficulty: formData.difficulty,
            dueDate: formData.dueDate,
            isUrgent: formData.isUrgent,
            isRepeatable: formData.isRepeatable,
            tags: formData.tags,
            subtasks: formData.subtasks,
            recurrence: {
                type: formData.frequency,
                weekDays: formData.frequency === 'weekly' ? formData.freqWeekDays : undefined,
                monthDay: formData.frequency === 'monthly' ? formData.freqMonthDay : undefined,
                customValue: formData.frequency === 'custom' ? formData.freqCustomValue : undefined,
                customUnit: formData.frequency === 'custom' ? formData.freqCustomUnit : undefined,
            }
        });
    }
    setIsModalOpen(false);
    resetForm();
  };

  const toggleWeekDay = (day: number) => {
    setFormData(prev => {
      const days = prev.freqWeekDays.includes(day) 
        ? prev.freqWeekDays.filter(d => d !== day)
        : [...prev.freqWeekDays, day];
      return { ...prev, freqWeekDays: days };
    });
  };

  // --- Drag & Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
      setDraggedTaskId(id);
      e.dataTransfer.effectAllowed = "move";
      // Opacity hack for drag ghost if needed
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      if (!draggedTaskId || !onReorderTasks || draggedTaskId === targetId) return;

      const sourceIndex = tasks.findIndex(t => t.id === draggedTaskId);
      const targetIndex = tasks.findIndex(t => t.id === targetId);

      if (sourceIndex === -1 || targetIndex === -1) return;

      const newTasks = [...tasks];
      const [removed] = newTasks.splice(sourceIndex, 1);
      newTasks.splice(targetIndex, 0, removed);

      onReorderTasks(newTasks);
      setDraggedTaskId(null);
  };

  // --- Filtering Logic (Modified) ---
  const getFilteredTasks = () => {
    const todayStr = getGameDateString();
    
    // Create Date objects correctly avoiding timezone issues by splitting
    const [y, m, d] = todayStr.split('-').map(Number);
    const todayDate = new Date(y, m - 1, d);
    const currentWeekDay = todayDate.getDay(); // 0-6

    // Calculate Tomorrow
    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tmY = tomorrowDate.getFullYear();
    const tmM = String(tomorrowDate.getMonth() + 1).padStart(2, '0');
    const tmD = String(tomorrowDate.getDate()).padStart(2, '0');
    const tomorrowStr = `${tmY}-${tmM}-${tmD}`;
    const tomorrowWeekDay = tomorrowDate.getDay();

    let filtered = tasks;

    // Filter Logic
    if (filterType === 'today') {
      filtered = tasks.filter(t => {
        if (t.completed && !t.isRepeatable) return false;
        if (t.recurrence.type === 'weekly' && t.recurrence.weekDays) return t.recurrence.weekDays.includes(currentWeekDay);
        if (t.recurrence.type === 'daily') return true;
        if (t.dueDate) return t.dueDate <= todayStr;
        return true;
      });
    } else if (filterType === 'tomorrow') {
      filtered = tasks.filter(t => {
        if (t.recurrence.type === 'weekly' && t.recurrence.weekDays) return t.recurrence.weekDays.includes(tomorrowWeekDay);
        if (t.recurrence.type === 'daily') return true;
        return t.dueDate === tomorrowStr;
      });
    } else if (filterType === 'urgent') {
      filtered = tasks.filter(t => t.isUrgent);
    } else if (filterType === 'tag' && selectedTag) {
      filtered = tasks.filter(t => t.tags.includes(selectedTag));
    }

    // Sorting Logic
    // If viewing "All" or "Manual", we respect the user's Drag & Drop order (array order).
    // If viewing Today/Tomorrow/Urgent, we apply a helpful sort but keep D&D disabled visually if needed or allow reorder within filter.
    // For now, let's only auto-sort if NOT in 'all' mode to allow manual override.
    if (filterType !== 'all') {
        return filtered.sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
            const dateA = a.dueDate || '9999-99-99';
            const dateB = b.dueDate || '9999-99-99';
            return dateA.localeCompare(dateB);
        });
    }
    
    return filtered;
  };

  const getDifficultyColor = (diff: TaskDifficulty) => {
    switch (diff) {
      case TaskDifficulty.TRIVIAL: return 'text-gray-400 border-gray-400/30 bg-gray-400/10';
      case TaskDifficulty.EASY: return 'text-green-400 border-green-400/30 bg-green-400/10';
      case TaskDifficulty.MEDIUM: return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
      case TaskDifficulty.HARD: return 'text-red-400 border-red-400/30 bg-red-400/10';
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (val.startsWith('tag:')) {
          setFilterType('tag');
          setSelectedTag(val.replace('tag:', ''));
      } else {
          setFilterType(val as any);
          setSelectedTag('');
      }
  };

  const displayTasks = getFilteredTasks();

  return (
    <div className="flex flex-col h-full bg-gray-800/50 backdrop-blur-md border-l border-gray-700 shadow-2xl overflow-hidden relative">
      
      {/* Header & Unified Filter Control */}
      <div className="p-4 border-b border-gray-700 bg-gray-900/50">
        <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-bold flex items-center gap-2 text-cyan-400 whitespace-nowrap">
                <Zap className="w-5 h-5" /> Tarefas
            </h2>
            
            {/* COMPACT FILTER SELECT */}
            <div className="flex-1 max-w-[180px] relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-gray-400">
                    <ListFilter size={14} />
                </div>
                <select 
                    value={filterType === 'tag' ? `tag:${selectedTag}` : filterType}
                    onChange={handleFilterChange}
                    className="w-full bg-gray-800 border border-gray-600 text-white text-xs rounded-lg pl-8 pr-2 py-2 appearance-none focus:border-cyan-500 focus:outline-none cursor-pointer hover:bg-gray-700 transition-colors"
                >
                    <option value="today">📅 Hoje</option>
                    <option value="tomorrow">🌅 Amanhã</option>
                    <option value="urgent">🚨 Urgente</option>
                    <option value="all">📚 Todas (Manual)</option>
                    {existingTags.length > 0 && <optgroup label="Tags">
                        {existingTags.map(tag => (
                            <option key={tag} value={`tag:${tag}`}>🏷️ {tag}</option>
                        ))}
                    </optgroup>}
                </select>
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-gray-500">
                    <ChevronDown size={12} />
                </div>
            </div>

            <button 
                onClick={() => { resetForm(); setIsModalOpen(true); }}
                className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-lg transition-colors shadow-lg shadow-cyan-900/20"
                title="Nova Tarefa"
            >
                <Plus className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {displayTasks.length === 0 && (
          <div className="text-center text-gray-500 italic mt-10 flex flex-col items-center gap-2">
            <Check className="w-10 h-10 opacity-20" />
            <p>Nada por aqui...</p>
          </div>
        )}
        
        {displayTasks.map((task) => (
          <div 
            key={task.id} 
            draggable={onReorderTasks && filterType === 'all'}
            onDragStart={(e) => handleDragStart(e, task.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, task.id)}
            className={`group bg-gray-900 border ${task.isUrgent && !task.completed ? 'border-red-900/60 shadow-red-900/10' : 'border-gray-700'} rounded-xl transition-all hover:border-cyan-500/30 ${task.completed ? 'opacity-50 order-last' : ''} ${draggedTaskId === task.id ? 'opacity-30 border-dashed border-cyan-500' : ''}`}
          >
            
            {/* Task Card Header (Compact) */}
            <div className="p-3 flex items-start gap-3">
              {/* Drag Handle (Visible only in All mode or if reorder enabled) */}
              {filterType === 'all' && (
                  <div className="mt-1.5 text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing">
                      <GripVertical size={14} />
                  </div>
              )}

              <button
                onClick={() => onCompleteTask(task.id)}
                className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${task.completed ? 'bg-green-500/20 border-green-500 text-green-500' : 'border-gray-500 hover:border-cyan-500 text-transparent hover:text-cyan-500'}`}
              >
                {task.isRepeatable && !task.completed ? <Repeat className="w-3 h-3" /> : <Check className="w-3 h-3" />}
              </button>
              
              <div className="flex-1 min-w-0" onClick={() => setOpenDetailId(openDetailId === task.id ? null : task.id)}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-medium truncate cursor-pointer ${task.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                    {task.title}
                  </span>
                  {task.isUrgent && !task.completed && <AlertTriangle className="w-4 h-4 text-red-400" />}
                  {task.isRepeatable && (
                    <span title="Repetível">
                      <Repeat className="w-3 h-3 text-blue-400" />
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 items-center text-xs">
                  <span className={`px-1.5 py-0.5 rounded border ${getDifficultyColor(task.difficulty)}`}>
                    {task.difficulty}
                  </span>
                  
                  {/* DATA: SÓ MOSTRA SE FOR URGENTE */}
                  {task.isUrgent && task.dueDate && (
                     <span className="text-red-400 flex items-center gap-1 font-bold">
                       <Calendar className="w-3 h-3" />
                       {new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                     </span>
                  )}

                  {task.tags.slice(0, 2).map(t => (
                    <span key={t} className="text-purple-300 bg-purple-900/30 px-1.5 py-0.5 rounded">#{t}</span>
                  ))}
                  {task.subtasks.length > 0 && (
                    <span className="text-gray-500 ml-auto flex items-center gap-1">
                      {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                      {openDetailId === task.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(task)}
                    className="p-1.5 text-gray-600 hover:text-blue-400 transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
              </div>
            </div>

            {/* Collapsible Details */}
            {openDetailId === task.id && (
              <div className="px-3 pb-3 pt-0 border-t border-gray-800/50 bg-black/20 text-sm animate-in slide-in-from-top-2 duration-200">
                {task.description && (
                  <p className="text-gray-400 mb-3 mt-2 italic">{task.description}</p>
                )}
                
                {task.subtasks.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {task.subtasks.map(st => (
                      <div key={st.id} className="flex items-center gap-2 group/st">
                        <button 
                          onClick={() => onToggleSubtask(task.id, st.id)}
                          className={`w-3 h-3 rounded border flex items-center justify-center ${st.completed ? 'bg-gray-600 border-gray-600' : 'border-gray-600'}`}
                        >
                          {st.completed && <Check className="w-2 h-2 text-white" />}
                        </button>
                        <span className={st.completed ? 'line-through text-gray-600' : 'text-gray-300'}>{st.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CREATE/EDIT TASK MODAL */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 bg-gray-900/95 backdrop-blur-sm p-4 flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Título</label>
              <input 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-cyan-500 focus:outline-none"
                placeholder="Ex: Correr 5km"
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Descrição</label>
              <textarea 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white text-sm focus:border-cyan-500 focus:outline-none h-20 resize-none"
                placeholder="Detalhes da tarefa..."
              />
            </div>

            {/* Difficulty & Date Row */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Dificuldade</label>
                <select 
                  value={formData.difficulty}
                  onChange={e => setFormData({...formData, difficulty: e.target.value as TaskDifficulty})}
                  className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                >
                  {Object.values(TaskDifficulty).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Data (Dia Virtual)</label>
                <input 
                  type="date"
                  value={formData.dueDate}
                  onChange={e => setFormData({...formData, dueDate: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Options Row */}
            <div className="flex gap-3">
               <button 
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isUrgent: !prev.isUrgent }))}
                className={`flex-1 py-2 rounded border text-sm font-medium transition-colors ${formData.isUrgent ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
               >
                 Urgente
               </button>
               <button 
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isRepeatable: !prev.isRepeatable }))}
                className={`flex-1 py-2 rounded border text-sm font-medium transition-colors ${formData.isRepeatable ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
               >
                 Repete (Grind)
               </button>
            </div>

            {/* Frequency */}
            <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
              <label className="block text-xs text-gray-400 mb-2">Frequência</label>
              <select 
                value={formData.frequency}
                onChange={e => setFormData({...formData, frequency: e.target.value as FrequencyType})}
                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm text-white mb-2"
              >
                <option value="once">Única</option>
                <option value="daily">Diária</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
                <option value="custom">Personalizada</option>
              </select>

              {/* Conditional Frequency Inputs */}
              {formData.frequency === 'weekly' && (
                <div className="flex justify-between mt-2">
                  {['D','S','T','Q','Q','S','S'].map((d, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleWeekDay(i)}
                      className={`w-8 h-8 rounded-full text-xs font-bold ${formData.freqWeekDays.includes(i) ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}

              {formData.frequency === 'monthly' && (
                 <div className="flex items-center gap-2 mt-2">
                   <span className="text-xs text-gray-400">Dia do mês:</span>
                   <input 
                    type="number" min="1" max="31"
                    value={formData.freqMonthDay}
                    onChange={e => setFormData({...formData, freqMonthDay: parseInt(e.target.value)})}
                    className="w-16 bg-gray-900 border border-gray-600 rounded p-1 text-center"
                   />
                 </div>
              )}

              {formData.frequency === 'custom' && (
                 <div className="flex gap-2 mt-2">
                   <span className="text-xs text-gray-400 self-center">A cada</span>
                   <input 
                    type="number" min="1"
                    value={formData.freqCustomValue}
                    onChange={e => setFormData({...formData, freqCustomValue: parseInt(e.target.value)})}
                    className="w-12 bg-gray-900 border border-gray-600 rounded p-1 text-center"
                   />
                   <select 
                     value={formData.freqCustomUnit}
                     onChange={e => setFormData({...formData, freqCustomUnit: e.target.value as any})}
                     className="bg-gray-900 border border-gray-600 rounded p-1 text-sm"
                   >
                     <option value="day">Dias</option>
                     <option value="week">Semanas</option>
                     <option value="month">Meses</option>
                   </select>
                 </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tags (Enter para adicionar)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map(tag => (
                  <span key={tag} className="bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded text-xs flex items-center gap-1 border border-purple-500/30">
                    {tag} <button onClick={() => removeTag(tag)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <input 
                value={newTagInput}
                onChange={e => setNewTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                placeholder="Ex: trabalho, saúde..."
              />
              {/* Tag Suggestions (Existing Tags Cloud) */}
              {existingTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                      {existingTags.filter(t => !formData.tags.includes(t)).map(tag => (
                          <button
                            key={tag}
                            onClick={() => addTagToForm(tag)}
                            className="text-[10px] bg-gray-800 border border-gray-600 text-gray-400 px-2 py-1 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
                          >
                              {tag}
                          </button>
                      ))}
                  </div>
              )}
            </div>

            {/* Subtasks */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Subtarefas</label>
              <div className="flex gap-2 mb-2">
                 <input 
                  value={newSubtaskInput}
                  onChange={e => setNewSubtaskInput(e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="Nova subtarefa..."
                 />
                 <button onClick={handleAddSubtask} className="bg-gray-700 hover:bg-gray-600 p-2 rounded"><Plus className="w-4 h-4" /></button>
              </div>
              <ul className="space-y-1">
                {formData.subtasks.map((st, idx) => (
                  <li key={st.id} className="text-sm text-gray-300 flex items-center gap-2 pl-1 border-l-2 border-gray-700">
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                    {st.title}
                  </li>
                ))}
              </ul>
            </div>

          </div>

          <button 
            onClick={handleSubmit}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg mt-4 shadow-lg shadow-cyan-900/20"
          >
            {editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskList;
