import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Type, Palette, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon } from 'lucide-react';

interface RichTextEditorProps {
  initialContent: string;
  onChange: (html: string) => void;
  onFocus?: () => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ initialContent, onChange, onFocus }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== initialContent) {
        // Only set if empty to avoid cursor jumping, or strict control needed
        if (editorRef.current.innerHTML === '') {
            editorRef.current.innerHTML = initialContent;
        }
    }
  }, []); // Run once on mount

  const execCmd = (command: string, value: string | undefined = undefined) => {
    if (editorRef.current) {
        editorRef.current.focus();
    }
    document.execCommand(command, false, value);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          // Ensure editor has focus before inserting
          if (editorRef.current) {
              editorRef.current.focus();
          }
          // Insert image at cursor
          const imgHtml = `<img src="${ev.target.result}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; display: block;" />`;
          document.execCommand('insertHTML', false, imgHtml);
          
          if (editorRef.current) {
              onChange(editorRef.current.innerHTML);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col border border-gray-600 rounded-lg overflow-hidden bg-gray-900">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-2 bg-gray-800 border-b border-gray-700">
        <button type="button" onClick={() => execCmd('bold')} className="p-1 hover:bg-gray-700 rounded text-gray-300" title="Negrito"><Bold size={16}/></button>
        <button type="button" onClick={() => execCmd('italic')} className="p-1 hover:bg-gray-700 rounded text-gray-300" title="Itálico"><Italic size={16}/></button>
        
        <div className="w-px h-6 bg-gray-600 mx-1"></div>
        
        <select onChange={(e) => execCmd('fontSize', e.target.value)} className="bg-gray-700 text-white text-xs rounded p-1 border-none focus:ring-0">
            <option value="3">Normal</option>
            <option value="1">Pequeno</option>
            <option value="5">Grande</option>
            <option value="7">Enorme</option>
        </select>

        <div className="relative group">
            <button type="button" className="p-1 hover:bg-gray-700 rounded text-gray-300"><Palette size={16}/></button>
            <input 
                type="color" 
                onChange={(e) => execCmd('foreColor', e.target.value)} 
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
        </div>

        <div className="w-px h-6 bg-gray-600 mx-1"></div>

        <button type="button" onClick={() => execCmd('justifyLeft')} className="p-1 hover:bg-gray-700 rounded text-gray-300"><AlignLeft size={16}/></button>
        <button type="button" onClick={() => execCmd('justifyCenter')} className="p-1 hover:bg-gray-700 rounded text-gray-300"><AlignCenter size={16}/></button>
        
        <div className="w-px h-6 bg-gray-600 mx-1"></div>

        <label className="p-1 hover:bg-gray-700 rounded text-gray-300 cursor-pointer">
            <ImageIcon size={16}/>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>
      </div>

      {/* Editable Area */}
      <div 
        ref={editorRef}
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onFocus={onFocus}
        className="p-3 min-h-[150px] text-white focus:outline-none overflow-y-auto max-h-[300px]"
        style={{ fontFamily: 'sans-serif' }}
      />
    </div>
  );
};

export default RichTextEditor;