import { useState, useRef, useCallback } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function RichTextEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null);

  const exec = useCallback((command, val = null) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    if (onChange) {
      onChange(editorRef.current?.innerHTML || '');
    }
  }, [onChange]);

  const handleInput = () => {
    if (onChange) onChange(editorRef.current?.innerHTML || '');
  };

  const ToolBtn = ({ onClick, active, children, title }) => (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      className={`h-8 w-8 flex items-center justify-center rounded-md text-xs transition-colors
        ${active ? 'bg-primary text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden" data-testid="rich-text-editor">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 flex-wrap">
        <ToolBtn onClick={() => exec('bold')} title="Gras">
          <Bold className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => exec('italic')} title="Italique">
          <Italic className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => exec('underline')} title="Souligner">
          <Underline className="h-3.5 w-3.5" />
        </ToolBtn>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <ToolBtn onClick={() => exec('justifyLeft')} title="Aligner a gauche">
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => exec('justifyCenter')} title="Centrer">
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => exec('justifyRight')} title="Aligner a droite">
          <AlignRight className="h-3.5 w-3.5" />
        </ToolBtn>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <select
          className="h-8 text-xs border border-slate-200 rounded-md px-2 bg-white"
          onChange={e => exec('fontSize', e.target.value)}
          defaultValue="4"
          data-testid="font-size-select"
        >
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
          <input
            type="color"
            defaultValue="#FFFFFF"
            onChange={e => exec('foreColor', e.target.value)}
            className="h-7 w-7 rounded cursor-pointer border border-slate-200"
            title="Couleur du texte"
            data-testid="text-color-picker"
          />
          <input
            type="color"
            defaultValue="#1E293B"
            onChange={e => exec('hiliteColor', e.target.value)}
            className="h-7 w-7 rounded cursor-pointer border border-slate-200"
            title="Couleur de fond"
            data-testid="bg-color-picker"
          />
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className="min-h-[120px] p-4 text-sm focus:outline-none bg-slate-900 text-white"
        style={{ lineHeight: '1.6' }}
        data-testid="rich-text-content"
        data-placeholder={placeholder || 'Saisissez votre texte...'}
        dangerouslySetInnerHTML={{ __html: value || '' }}
      />
    </div>
  );
}
