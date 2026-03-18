import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API, { getMediaUrl } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import RichTextEditor from '../components/RichTextEditor';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Plus, Trash2, Image, Film, Youtube, Type, QrCode, Timer,
  Eye, EyeOff, Save, ArrowLeft, Copy, GripVertical,
  Columns, Edit2, X, Rss, FileText, CalendarIcon, Clock
} from 'lucide-react';
import { toast } from 'sonner';

const TRANSITIONS = [
  { value: 'fade', label: 'Fondu' },
  { value: 'slide', label: 'Glissement' },
  { value: 'random', label: 'Aleatoire' },
  { value: 'none', label: 'Aucune' },
];
const LAYOUTS = [
  { value: 'full', label: '100%' },
  { value: 'split', label: '50/50' },
  { value: 'immersion', label: 'Full Screen' },
];
const FIT_MODES = [
  { value: 'fit', label: 'Ajuster' },
  { value: 'fill', label: 'Remplir' },
];
const CONTENT_TYPES = [
  { value: 'media', label: 'Media', icon: Image },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'qrcode', label: 'QR Code', icon: QrCode },
  { value: 'countdown', label: 'Compte a rebours', icon: Timer },
  { value: 'text', label: 'Texte', icon: Type },
  { value: 'rss', label: 'Flux RSS', icon: Rss },
  { value: 'pdf', label: 'PDF', icon: FileText },
];
const TYPE_META = {
  media: { label: 'Media', icon: Image, color: 'bg-blue-500' },
  youtube: { label: 'YouTube', icon: Youtube, color: 'bg-red-500' },
  qrcode: { label: 'QR Code', icon: QrCode, color: 'bg-emerald-500' },
  countdown: { label: 'Compte a rebours', icon: Timer, color: 'bg-amber-500' },
  text: { label: 'Texte', icon: Type, color: 'bg-purple-500' },
  rss: { label: 'Flux RSS', icon: Rss, color: 'bg-orange-500' },
  pdf: { label: 'PDF', icon: FileText, color: 'bg-rose-500' },
};

/* ── DateTimePicker ── */
function DateTimePicker({ value, onChange, label }) {
  const dateVal = value ? new Date(value) : null;
  const timeStr = dateVal ? format(dateVal, 'HH:mm') : '';
  const setDate = (d) => {
    if (!d) { onChange(null); return; }
    const current = dateVal || new Date();
    d.setHours(current.getHours(), current.getMinutes());
    onChange(d.toISOString());
  };
  const setTime = (t) => {
    const [h, m] = t.split(':').map(Number);
    const d = dateVal ? new Date(dateVal) : new Date();
    d.setHours(h, m, 0, 0);
    onChange(d.toISOString());
  };
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-slate-500">{label}</Label>
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1 justify-start text-xs font-normal h-9">
              <CalendarIcon className="h-3.5 w-3.5 mr-2 text-slate-400" />
              {dateVal ? format(dateVal, 'dd MMM yyyy', { locale: fr }) : 'Date...'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateVal} onSelect={setDate} locale={fr} />
          </PopoverContent>
        </Popover>
        <div className="relative">
          <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input type="time" value={timeStr} onChange={e => setTime(e.target.value)} className="h-9 w-28 pl-8 text-xs" />
        </div>
        {value && <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-400" onClick={() => onChange(null)}><X className="h-3.5 w-3.5" /></Button>}
      </div>
    </div>
  );
}

/* ── MediaGrid: shows ALL media types ── */
function MediaGrid({ media, selected, onSelect, className }) {
  const getIcon = (m) => {
    if (m.type === 'image') return Image;
    if (m.type === 'video') return Film;
    if (m.type === 'pdf') return FileText;
    if (m.type === 'youtube') return Youtube;
    return FileText;
  };
  return (
    <div className={`grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 max-h-52 overflow-y-auto ${className || ''}`}>
      {media.map(m => {
        const Icon = getIcon(m);
        const isSelected = selected?.media_id === m.id || selected?.url === m.url;
        return (
          <div key={m.id} onClick={() => onSelect({ url: m.url, name: m.name, type: m.type, media_id: m.id })}
            className={`aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all relative group ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-slate-300'}`}>
            {m.type === 'image' ? (
              <img src={getMediaUrl(m.url)} alt={m.name} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full flex flex-col items-center justify-center gap-1 ${m.type === 'pdf' ? 'bg-rose-50' : m.type === 'video' ? 'bg-slate-100' : 'bg-slate-50'}`}>
                <Icon className={`h-5 w-5 ${m.type === 'pdf' ? 'text-rose-400' : m.type === 'video' ? 'text-blue-400' : 'text-slate-400'}`} />
                <span className="text-[8px] uppercase font-bold tracking-wider text-slate-400">{m.type}</span>
              </div>
            )}
            <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1.5 py-0.5 text-[9px] text-white truncate opacity-0 group-hover:opacity-100 transition">{m.name}</div>
          </div>
        );
      })}
      {media.length === 0 && <p className="col-span-6 text-sm text-slate-400 py-6 text-center">Aucun media. Importez des fichiers d'abord.</p>}
    </div>
  );
}

/* ── ContentPicker ── */
function ContentPicker({ type, content, onTypeChange, onContentChange, media, label }) {
  return (
    <div className="space-y-3">
      {label && <Label className="text-sm font-semibold text-slate-700">{label}</Label>}
      <Select value={type} onValueChange={onTypeChange}>
        <SelectTrigger className="h-9" data-testid={`content-type-${label || 'main'}`}>
          <SelectValue placeholder="Type de contenu" />
        </SelectTrigger>
        <SelectContent>
          {CONTENT_TYPES.map(ct => (
            <SelectItem key={ct.value} value={ct.value}>
              <div className="flex items-center gap-2"><ct.icon className="h-3.5 w-3.5" /> {ct.label}</div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {type === 'media' && <MediaGrid media={media} selected={content} onSelect={onContentChange} />}
      {type === 'youtube' && <Input value={content?.url || ''} onChange={e => onContentChange({ ...content, url: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />}
      {type === 'qrcode' && (
        <div className="space-y-2">
          <Input value={content?.url || ''} onChange={e => onContentChange({ ...content, url: e.target.value })} placeholder="https://votre-site.com" />
          {content?.url && <div className="flex justify-center p-3 bg-white rounded-lg border"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(content.url)}`} alt="QR" className="w-24 h-24" /></div>}
        </div>
      )}
      {type === 'countdown' && (
        <div className="space-y-2">
          <Input value={content?.label || ''} onChange={e => onContentChange({ ...content, label: e.target.value })} placeholder="Titre" />
          <Input type="datetime-local" value={content?.target_date || ''} onChange={e => onContentChange({ ...content, target_date: e.target.value })} />
        </div>
      )}
      {type === 'text' && (
        <div className="min-h-[200px]">
          <RichTextEditor value={content?.html || ''} onChange={html => onContentChange({ ...content, html, text: html.replace(/<[^>]+>/g, '') })} />
        </div>
      )}
      {type === 'rss' && (
        <div className="space-y-2">
          <Input value={content?.rss_url || ''} onChange={e => onContentChange({ ...content, rss_url: e.target.value })} placeholder="https://example.com/rss.xml" />
          <p className="text-[11px] text-slate-400">Les titres du flux RSS seront affiches dans la zone de contenu.</p>
        </div>
      )}
      {type === 'pdf' && (
        <div className="space-y-3">
          <Label className="text-xs text-slate-500">Selectionnez un PDF depuis la mediatheque</Label>
          <MediaGrid media={media.filter(m => m.type === 'pdf')} selected={content} onSelect={onContentChange} />
          <div className="space-y-2">
            <Label className="text-xs">Duree par page (secondes)</Label>
            <Input type="number" value={content?.page_duration || 8} onChange={e => onContentChange({ ...content, page_duration: parseInt(e.target.value) || 8 })} min="2" max="120" className="w-32" />
          </div>
          <p className="text-[11px] text-slate-400">Toutes les pages du PDF seront affichees avant le passage a la diapo suivante.</p>
        </div>
      )}
    </div>
  );
}

/* ── SortableSlide ── */
function SortableSlide({ slide, index, onEdit, onRemove, onDuplicate, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slide.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, zIndex: isDragging ? 50 : 'auto' };
  const meta = TYPE_META[slide.type] || TYPE_META.media;
  const Icon = meta.icon;
  const hasSchedule = slide.schedule_start || slide.schedule_end;
  const isSplit = slide.layout === 'split';

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`group transition-all ${!slide.is_active ? 'opacity-40' : ''} ${isDragging ? 'shadow-2xl ring-2 ring-primary/30' : 'hover:shadow-md'}`}>
        <CardContent className="p-0">
          <div className="flex items-stretch">
            <div {...attributes} {...listeners}
              className="flex items-center px-2 cursor-grab active:cursor-grabbing hover:bg-slate-50 transition-colors border-r border-slate-100"
              data-testid={`drag-handle-${slide.id}`}>
              <GripVertical className="h-4 w-4 text-slate-300" />
            </div>
            <div className="w-28 h-20 shrink-0 relative overflow-hidden bg-slate-900 flex items-center justify-center cursor-pointer"
              onClick={() => onEdit(slide)}>
              {isSplit ? (
                <div className="flex w-full h-full">
                  <div className="w-1/2 h-full border-r border-white/20 flex items-center justify-center"><Columns className="h-4 w-4 text-white/40" /></div>
                  <div className="w-1/2 h-full flex items-center justify-center"><Columns className="h-4 w-4 text-white/40" /></div>
                </div>
              ) : slide.type === 'media' && slide.content?.type === 'image' ? (
                <img src={getMediaUrl(slide.content.url)} alt="" className="w-full h-full object-cover" />
              ) : slide.type === 'text' ? (
                <div className="w-full h-full p-1.5 overflow-hidden text-[8px] text-white" dangerouslySetInnerHTML={{ __html: slide.content?.html || '' }} />
              ) : (
                <Icon className="h-6 w-6 text-white/60" />
              )}
              <span className="absolute top-1 left-1 text-[9px] font-mono font-bold bg-black/70 text-white px-1 rounded">{index + 1}</span>
              <span className={`absolute bottom-1 left-1 h-1.5 w-1.5 rounded-full ${meta.color}`} />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <Edit2 className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="flex-1 p-2.5 min-w-0 cursor-pointer" onClick={() => onEdit(slide)}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm font-medium truncate">
                  {slide.content?.name || slide.content?.label || (slide.content?.text || slide.content?.html || '').replace(/<[^>]+>/g, '').substring(0, 35) || `Diapo ${index + 1}`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{isSplit ? '50/50' : meta.label}</Badge>
                <Badge variant="outline" className="text-[9px] h-4 px-1.5">{slide.duration}s</Badge>
                <Badge variant="outline" className="text-[9px] h-4 px-1.5">{TRANSITIONS.find(t => t.value === slide.transition)?.label}</Badge>
                {isSplit && (
                  <Badge className="text-[9px] h-4 px-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                    <Columns className="h-2.5 w-2.5 mr-0.5" /> {TYPE_META[slide.split_left_type]?.label || '?'} | {TYPE_META[slide.split_right_type]?.label || '?'}
                  </Badge>
                )}
                {slide.type === 'pdf' && <Badge className="text-[9px] h-4 px-1.5 bg-rose-100 text-rose-700 hover:bg-rose-100"><FileText className="h-2.5 w-2.5 mr-0.5" /> {slide.content?.page_duration || 8}s/page</Badge>}
                {hasSchedule && <Badge className="text-[9px] h-4 px-1.5 bg-amber-100 text-amber-700 hover:bg-amber-100"><CalendarIcon className="h-2.5 w-2.5 mr-0.5" /> Programme</Badge>}
              </div>
            </div>
            <div className="flex items-center gap-0.5 px-2 border-l border-slate-50">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onToggle(slide.id)} data-testid={`toggle-slide-${slide.id}`}>
                {slide.is_active ? <Eye className="h-3.5 w-3.5 text-emerald-500" /> : <EyeOff className="h-3.5 w-3.5 text-slate-300" />}
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onDuplicate(slide)} data-testid={`dup-slide-${slide.id}`}>
                <Copy className="h-3.5 w-3.5 text-slate-400" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-300 hover:text-red-600" onClick={() => onRemove(slide.id)} data-testid={`remove-slide-${slide.id}`}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Main PlaylistEditor ── */
export default function PlaylistEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [media, setMedia] = useState([]);
  const [showAddSlide, setShowAddSlide] = useState(false);
  const [editSlide, setEditSlide] = useState(null);
  const [previewSlide, setPreviewSlide] = useState(null);
  const [saving, setSaving] = useState(false);

  const [addType, setAddType] = useState('media');
  const [addContent, setAddContent] = useState({});
  const [addLayout, setAddLayout] = useState('full');
  const [addDuration, setAddDuration] = useState(10);
  const [addTransition, setAddTransition] = useState('fade');
  const [addFitMode, setAddFitMode] = useState('fit');
  const [addLeftType, setAddLeftType] = useState('media');
  const [addLeftContent, setAddLeftContent] = useState({});
  const [addRightType, setAddRightType] = useState('text');
  const [addRightContent, setAddRightContent] = useState({});

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    API.get(`/playlists/${id}`).then(r => setPlaylist(r.data)).catch(() => navigate('/playlists'));
    API.get('/media').then(r => setMedia(r.data)).catch(() => {});
  }, [id, navigate]);

  const savePlaylist = async () => {
    setSaving(true);
    try {
      await API.put(`/playlists/${id}`, { slides: playlist.slides, name: playlist.name });
      toast.success('Playlist sauvegardee');
    } catch { toast.error('Erreur de sauvegarde'); }
    finally { setSaving(false); }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = playlist.slides.findIndex(s => s.id === active.id);
    const newIdx = playlist.slides.findIndex(s => s.id === over.id);
    setPlaylist({ ...playlist, slides: arrayMove(playlist.slides, oldIdx, newIdx).map((s, i) => ({ ...s, order: i })) });
  };

  const resetAddForm = () => {
    setAddType('media'); setAddContent({}); setAddLayout('full');
    setAddDuration(10); setAddTransition('fade'); setAddFitMode('fit');
    setAddLeftType('media'); setAddLeftContent({});
    setAddRightType('text'); setAddRightContent({});
  };

  const addSlide = () => {
    const isSplit = addLayout === 'split';
    const s = {
      id: crypto.randomUUID(),
      type: isSplit ? 'split' : addType,
      content: isSplit ? {} : { ...addContent },
      duration: parseInt(addDuration) || 10,
      transition: addTransition,
      layout: addLayout,
      fit_mode: addFitMode,
      is_active: true,
      order: playlist.slides.length,
      schedule_start: null, schedule_end: null,
    };
    if (isSplit) {
      s.split_left_type = addLeftType;
      s.split_left_content = { ...addLeftContent };
      s.split_right_type = addRightType;
      s.split_right_content = { ...addRightContent };
    }
    setPlaylist({ ...playlist, slides: [...playlist.slides, s] });
    setShowAddSlide(false);
    resetAddForm();
    toast.success('Diapo ajoutee');
  };

  const saveEditSlide = () => {
    setPlaylist({
      ...playlist,
      slides: playlist.slides.map(s => s.id === editSlide.id ? editSlide : s)
    });
    setEditSlide(null);
    toast.success('Diapo modifiee');
  };

  const removeSlide = (sid) => setPlaylist({ ...playlist, slides: playlist.slides.filter(s => s.id !== sid).map((s, i) => ({ ...s, order: i })) });
  const duplicateSlide = (sl) => {
    setPlaylist({ ...playlist, slides: [...playlist.slides, { ...JSON.parse(JSON.stringify(sl)), id: crypto.randomUUID(), order: playlist.slides.length }] });
    toast.success('Diapo dupliquee');
  };
  const toggleSlide = (sid) => setPlaylist({ ...playlist, slides: playlist.slides.map(s => s.id === sid ? { ...s, is_active: !s.is_active } : s) });

  if (!playlist) return <div className="flex items-center justify-center h-64 text-slate-400">Chargement...</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => navigate('/playlists')} data-testid="back-playlists-btn">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <Input value={playlist.name} onChange={e => setPlaylist({ ...playlist, name: e.target.value })}
              className="text-xl font-bold border-0 p-0 h-auto focus-visible:ring-0 bg-transparent" data-testid="playlist-name-edit" />
            <p className="text-xs text-slate-400">{playlist.slides.length} diapo(s) &middot; Glissez pour reordonner</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button onClick={() => { resetAddForm(); setShowAddSlide(true); }} data-testid="add-slide-btn">
            <Plus className="h-4 w-4 mr-2" /> Ajouter
          </Button>
          <Button variant="outline" onClick={savePlaylist} disabled={saving} data-testid="save-playlist-btn">
            <Save className="h-4 w-4 mr-2" /> {saving ? '...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      {playlist.slides.length === 0 ? (
        <Card className="p-12 text-center">
          <Image className="h-10 w-10 mx-auto text-slate-200 mb-3" />
          <p className="text-slate-400 font-medium">Playlist vide</p>
          <Button className="mt-4" size="sm" onClick={() => setShowAddSlide(true)}><Plus className="h-4 w-4 mr-1" /> Ajouter une diapo</Button>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={playlist.slides.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {playlist.slides.map((slide, i) => (
                <SortableSlide key={slide.id} slide={slide} index={i} onEdit={setEditSlide} onRemove={removeSlide} onDuplicate={duplicateSlide} onToggle={toggleSlide} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* ═══ ADD SLIDE DIALOG - FULL WIDTH ═══ */}
      <Dialog open={showAddSlide} onOpenChange={setShowAddSlide}>
        <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-y-auto" data-testid="add-slide-dialog">
          <DialogHeader><DialogTitle>Ajouter une diapo</DialogTitle></DialogHeader>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div><Label className="text-xs">Disposition</Label>
              <Select value={addLayout} onValueChange={setAddLayout}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{LAYOUTS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">Duree (s)</Label><Input type="number" className="mt-1" value={addDuration} onChange={e => setAddDuration(parseInt(e.target.value) || 10)} min="1" data-testid="slide-duration-input" /></div>
            <div><Label className="text-xs">Transition</Label>
              <Select value={addTransition} onValueChange={setAddTransition}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{TRANSITIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">Affichage</Label>
              <Select value={addFitMode} onValueChange={setAddFitMode}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{FIT_MODES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent></Select></div>
          </div>

          {addLayout === 'split' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 border rounded-xl bg-slate-50/50">
                <ContentPicker label="Gauche" type={addLeftType} content={addLeftContent} onTypeChange={setAddLeftType} onContentChange={setAddLeftContent} media={media} />
              </div>
              <div className="p-5 border rounded-xl bg-slate-50/50">
                <ContentPicker label="Droite" type={addRightType} content={addRightContent} onTypeChange={setAddRightType} onContentChange={setAddRightContent} media={media} />
              </div>
            </div>
          ) : (
            <Tabs value={addType} onValueChange={v => { setAddType(v); setAddContent({}); }}>
              <TabsList className="w-full grid grid-cols-7">
                {CONTENT_TYPES.map(ct => (
                  <TabsTrigger key={ct.value} value={ct.value} data-testid={`slide-type-${ct.value}`}>
                    <ct.icon className="h-3.5 w-3.5 mr-1.5" /> <span className="hidden sm:inline">{ct.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="media" className="mt-4">
                <Label className="mb-2 block text-sm">Choisir un media (images, videos, PDF)</Label>
                <MediaGrid media={media} selected={addContent} onSelect={setAddContent} />
              </TabsContent>
              <TabsContent value="youtube" className="mt-4 space-y-3">
                <Label>URL YouTube</Label>
                <Input value={addContent.url || ''} onChange={e => setAddContent({ ...addContent, url: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." data-testid="slide-youtube-url" className="max-w-xl" />
              </TabsContent>
              <TabsContent value="qrcode" className="mt-4 space-y-3">
                <Label>URL a encoder</Label>
                <Input value={addContent.url || ''} onChange={e => setAddContent({ ...addContent, url: e.target.value })} placeholder="https://votre-site.com" data-testid="slide-qrcode-url" className="max-w-xl" />
                {addContent.url && <div className="flex justify-center p-4 bg-white rounded-lg border w-fit"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(addContent.url)}`} alt="QR" className="w-32 h-32" /></div>}
              </TabsContent>
              <TabsContent value="countdown" className="mt-4 space-y-3 max-w-xl">
                <Label>Titre</Label>
                <Input value={addContent.label || ''} onChange={e => setAddContent({ ...addContent, label: e.target.value })} placeholder="Evenement" data-testid="slide-countdown-label" />
                <Label>Date cible</Label>
                <Input type="datetime-local" value={addContent.target_date || ''} onChange={e => setAddContent({ ...addContent, target_date: e.target.value })} data-testid="slide-countdown-date" />
              </TabsContent>
              <TabsContent value="text" className="mt-4 space-y-3">
                <Label>Contenu (WYSIWYG)</Label>
                <div className="min-h-[300px]">
                  <RichTextEditor value={addContent.html || ''} onChange={html => setAddContent({ ...addContent, html, text: html.replace(/<[^>]+>/g, '') })} />
                </div>
              </TabsContent>
              <TabsContent value="rss" className="mt-4 space-y-3">
                <Label>URL du flux RSS</Label>
                <Input value={addContent.rss_url || ''} onChange={e => setAddContent({ ...addContent, rss_url: e.target.value })} placeholder="https://example.com/rss.xml" data-testid="slide-rss-url" className="max-w-xl" />
                <p className="text-[11px] text-slate-400">Les titres du flux RSS seront affiches en plein ecran.</p>
              </TabsContent>
              <TabsContent value="pdf" className="mt-4 space-y-3">
                <Label>Selectionnez un PDF depuis la mediatheque</Label>
                <MediaGrid media={media.filter(m => m.type === 'pdf')} selected={addContent} onSelect={setAddContent} />
                {media.filter(m => m.type === 'pdf').length === 0 && (
                  <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed">
                    <FileText className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-400">Aucun PDF dans la mediatheque.</p>
                    <p className="text-xs text-slate-400 mt-1">Importez un fichier PDF via la Mediatheque d'abord.</p>
                  </div>
                )}
                <div className="flex items-center gap-3 max-w-xs">
                  <Label className="text-xs whitespace-nowrap">Duree par page</Label>
                  <Input type="number" value={addContent.page_duration || 8} onChange={e => setAddContent({ ...addContent, page_duration: parseInt(e.target.value) || 8 })} min="2" max="120" className="w-20" />
                  <span className="text-xs text-slate-400">sec</span>
                </div>
                <p className="text-[11px] text-slate-400">Chaque page du PDF sera affichee automatiquement avant le passage a la diapo suivante.</p>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowAddSlide(false)}>Annuler</Button>
            <Button onClick={addSlide} data-testid="confirm-add-slide-btn">Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ EDIT SLIDE DIALOG - FULL WIDTH ═══ */}
      <Dialog open={!!editSlide} onOpenChange={() => setEditSlide(null)}>
        <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-y-auto" data-testid="edit-slide-dialog">
          <DialogHeader><DialogTitle>Modifier la diapo</DialogTitle></DialogHeader>
          {editSlide && (
            <div className="space-y-5">
              {editSlide.layout === 'split' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 border rounded-xl bg-slate-50/50">
                    <ContentPicker label="Gauche"
                      type={editSlide.split_left_type || 'media'} content={editSlide.split_left_content || {}}
                      onTypeChange={v => setEditSlide({ ...editSlide, split_left_type: v, split_left_content: {} })}
                      onContentChange={c => setEditSlide({ ...editSlide, split_left_content: c })} media={media} />
                  </div>
                  <div className="p-5 border rounded-xl bg-slate-50/50">
                    <ContentPicker label="Droite"
                      type={editSlide.split_right_type || 'text'} content={editSlide.split_right_content || {}}
                      onTypeChange={v => setEditSlide({ ...editSlide, split_right_type: v, split_right_content: {} })}
                      onContentChange={c => setEditSlide({ ...editSlide, split_right_content: c })} media={media} />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    {(() => { const M = TYPE_META[editSlide.type]; return M ? <><M.icon className="h-4 w-4" /><span className="text-sm font-medium">{M.label}</span></> : null; })()}
                  </div>
                  {editSlide.type === 'media' && (
                    <div><Label className="mb-2 block">Changer le media</Label>
                      <MediaGrid media={media} selected={editSlide.content} onSelect={c => setEditSlide({ ...editSlide, content: c })} /></div>
                  )}
                  {editSlide.type === 'youtube' && (
                    <div><Label>URL YouTube</Label><Input className="mt-1 max-w-xl" value={editSlide.content?.url || ''} onChange={e => setEditSlide({ ...editSlide, content: { ...editSlide.content, url: e.target.value } })} data-testid="edit-youtube-url" /></div>
                  )}
                  {editSlide.type === 'qrcode' && (
                    <div className="space-y-3">
                      <div><Label>URL du QR Code</Label><Input className="mt-1 max-w-xl" value={editSlide.content?.url || ''} onChange={e => setEditSlide({ ...editSlide, content: { ...editSlide.content, url: e.target.value } })} data-testid="edit-qrcode-url" /></div>
                      {editSlide.content?.url && <div className="flex justify-center p-3 bg-white rounded-lg border w-fit"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(editSlide.content.url)}`} alt="QR" className="w-28 h-28" /></div>}
                    </div>
                  )}
                  {editSlide.type === 'countdown' && (
                    <div className="space-y-3 max-w-xl">
                      <div><Label>Titre</Label><Input className="mt-1" value={editSlide.content?.label || ''} onChange={e => setEditSlide({ ...editSlide, content: { ...editSlide.content, label: e.target.value } })} /></div>
                      <div><Label>Date cible</Label><Input type="datetime-local" className="mt-1" value={editSlide.content?.target_date || ''} onChange={e => setEditSlide({ ...editSlide, content: { ...editSlide.content, target_date: e.target.value } })} /></div>
                    </div>
                  )}
                  {editSlide.type === 'text' && (
                    <div className="min-h-[300px]">
                      <RichTextEditor value={editSlide.content?.html || ''} onChange={html => setEditSlide({ ...editSlide, content: { ...editSlide.content, html, text: html.replace(/<[^>]+>/g, '') } })} />
                    </div>
                  )}
                  {editSlide.type === 'rss' && (
                    <div className="space-y-2 max-w-xl">
                      <Label>URL du flux RSS</Label>
                      <Input value={editSlide.content?.rss_url || ''} onChange={e => setEditSlide({ ...editSlide, content: { ...editSlide.content, rss_url: e.target.value } })} placeholder="https://example.com/rss.xml" />
                    </div>
                  )}
                  {editSlide.type === 'pdf' && (
                    <div className="space-y-3">
                      <Label>PDF depuis la mediatheque</Label>
                      <MediaGrid media={media.filter(m => m.type === 'pdf')} selected={editSlide.content} onSelect={c => setEditSlide({ ...editSlide, content: c })} />
                      <div className="flex items-center gap-3 max-w-xs">
                        <Label className="text-xs whitespace-nowrap">Duree par page</Label>
                        <Input type="number" value={editSlide.content?.page_duration || 8} onChange={e => setEditSlide({ ...editSlide, content: { ...editSlide.content, page_duration: parseInt(e.target.value) || 8 } })} min="2" max="120" className="w-20" />
                        <span className="text-xs text-slate-400">sec</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t">
                <div><Label className="text-xs">Duree (s)</Label><Input type="number" className="mt-1" value={editSlide.duration} onChange={e => setEditSlide({ ...editSlide, duration: parseInt(e.target.value) || 5 })} min="1" data-testid="edit-duration" /></div>
                <div><Label className="text-xs">Transition</Label><Select value={editSlide.transition} onValueChange={v => setEditSlide({ ...editSlide, transition: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{TRANSITIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs">Disposition</Label><Select value={editSlide.layout || 'full'} onValueChange={v => setEditSlide({ ...editSlide, layout: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{LAYOUTS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs">Affichage</Label><Select value={editSlide.fit_mode || 'fit'} onValueChange={v => setEditSlide({ ...editSlide, fit_mode: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{FIT_MODES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent></Select></div>
              </div>

              <div className="pt-3 border-t">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-primary" /> Programmation</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DateTimePicker label="Debut" value={editSlide.schedule_start} onChange={v => setEditSlide({ ...editSlide, schedule_start: v })} />
                  <DateTimePicker label="Fin" value={editSlide.schedule_end} onChange={v => setEditSlide({ ...editSlide, schedule_end: v })} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-2">
                  <Switch checked={editSlide.is_active} onCheckedChange={v => setEditSlide({ ...editSlide, is_active: v })} data-testid="edit-active-toggle" />
                  <Label>{editSlide.is_active ? 'Active' : 'Desactivee'}</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSlide(null)}>Annuler</Button>
            <Button onClick={saveEditSlide} data-testid="save-edit-slide-btn">Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
