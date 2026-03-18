import { useRef, useCallback, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type } from 'lucide-react';

export default function RichTextEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null);
  const initialized = useRef(false);

  // Only set HTML once on mount — never re-inject to avoid cursor reset
  useEffect(() => {
    if (editorRef.current && !initialized.current) {
      editorRef.current.innerHTML = value || '';
      initialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = useCallback((cmd, val = null) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    if (onChange) onChange(editorRef.current?.innerHTML || '');
  }, [onChange]);

  const handleInput = () => {
    if (onChange) onChange(editorRef.current?.innerHTML || '');
  };

  const Btn = ({ onClick, children, title }) => (
    <button type="button" onMouseDown={e => { e.preventDefault(); onClick(); }} title={title}
      className="h-8 w-8 flex items-center justify-center rounded-md text-xs bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors">
      {children}
    </button>
  );

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden" data-testid="rich-text-editor">
      <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 flex-wrap">
        <Btn onClick={() => exec('bold')} title="Gras"><Bold className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => exec('italic')} title="Italique"><Italic className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => exec('underline')} title="Souligner"><Underline className="h-3.5 w-3.5" /></Btn>
        <div className="w-px h-6 bg-slate-200 mx-1" />
        <Btn onClick={() => exec('justifyLeft')} title="Gauche"><AlignLeft className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => exec('justifyCenter')} title="Centre"><AlignCenter className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => exec('justifyRight')} title="Droite"><AlignRight className="h-3.5 w-3.5" /></Btn>
        <div className="w-px h-6 bg-slate-200 mx-1" />
        <select className="h-8 text-xs border border-slate-200 rounded-md px-2 bg-white" onChange={e => exec('fontSize', e.target.value)} defaultValue="4" data-testid="font-size-select">
          <option value="2">Petit</option>
          <option value="3">Normal</option>
          <option value="4">Moyen</option>
          <option value="5">Grand</option>
          <option value="6">Tres grand</option>
          <option value="7">Enorme</option>
        </select>
        <div className="w-px h-6 bg-slate-200 mx-1" />
        <div className="flex items-center gap-1">
          <Type className="h-3 w-3 text-slate-400" />
          <input type="color" defaultValue="#FFFFFF" onChange={e => exec('foreColor', e.target.value)} className="h-7 w-7 rounded cursor-pointer border border-slate-200" title="Couleur texte" />
          <input type="color" defaultValue="#1E293B" onChange={e => exec('hiliteColor', e.target.value)} className="h-7 w-7 rounded cursor-pointer border border-slate-200" title="Couleur fond" />
        </div>
      </div>
      <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={handleInput}
        className="min-h-[120px] p-4 text-sm focus:outline-none bg-slate-900 text-white"
        style={{ lineHeight: '1.6' }} data-testid="rich-text-content" data-placeholder={placeholder || 'Saisissez votre texte...'} />
    </div>
  );
}
