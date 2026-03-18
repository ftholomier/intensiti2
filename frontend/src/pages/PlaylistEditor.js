import { useEffect, useState, useMemo } from 'react';
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
  Eye, EyeOff, Save, ArrowLeft, Copy, GripVertical, Maximize,
  Columns, Monitor, Expand, Shrink, CalendarIcon, Clock, Edit2, X
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
const TYPE_META = {
  media: { label: 'Media', icon: Image, color: 'bg-blue-500' },
  youtube: { label: 'YouTube', icon: Youtube, color: 'bg-red-500' },
  qrcode: { label: 'QR Code', icon: QrCode, color: 'bg-emerald-500' },
  countdown: { label: 'Compte a rebours', icon: Timer, color: 'bg-amber-500' },
  text: { label: 'Texte', icon: Type, color: 'bg-purple-500' },
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
            <Button variant="outline" size="sm" className="flex-1 justify-start text-xs font-normal h-9" data-testid={`datepicker-${label}`}>
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
          <Input
            type="time"
            value={timeStr}
            onChange={e => setTime(e.target.value)}
            className="h-9 w-28 pl-8 text-xs"
          />
        </div>
        {value && (
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-400" onClick={() => onChange(null)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
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

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`group transition-all ${!slide.is_active ? 'opacity-40' : ''} ${isDragging ? 'shadow-2xl ring-2 ring-primary/30' : 'hover:shadow-md'}`}>
        <CardContent className="p-0">
          <div className="flex items-stretch">
            {/* Drag handle */}
            <div {...attributes} {...listeners}
              className="flex items-center px-2 cursor-grab active:cursor-grabbing hover:bg-slate-50 transition-colors border-r border-slate-100"
              data-testid={`drag-handle-${slide.id}`}>
              <GripVertical className="h-4 w-4 text-slate-300" />
            </div>

            {/* Thumbnail */}
            <div className="w-28 h-20 shrink-0 relative overflow-hidden bg-slate-900 flex items-center justify-center cursor-pointer"
              onClick={() => onEdit(slide)}>
              {slide.type === 'media' && slide.content?.type === 'image' ? (
                <img src={getMediaUrl(slide.content.url)} alt="" className="w-full h-full object-cover" />
              ) : slide.type === 'text' ? (
                <div className="w-full h-full p-1.5 overflow-hidden text-[8px] text-white" dangerouslySetInnerHTML={{ __html: slide.content?.html || '' }} />
              ) : slide.type === 'qrcode' ? (
                <QrCode className="h-6 w-6 text-white/60" />
              ) : (
                <Icon className="h-6 w-6 text-white/60" />
              )}
              <span className="absolute top-1 left-1 text-[9px] font-mono font-bold bg-black/70 text-white px-1 rounded">{index + 1}</span>
              <span className={`absolute bottom-1 left-1 h-1.5 w-1.5 rounded-full ${meta.color}`} />
              {/* Edit overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <Edit2 className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 p-2.5 min-w-0 cursor-pointer" onClick={() => onEdit(slide)}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm font-medium truncate">
                  {slide.content?.name || slide.content?.label || (slide.content?.text || slide.content?.html || '').replace(/<[^>]+>/g, '').substring(0, 35) || `Diapo ${index + 1}`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="secondary" className="text-[9px] h-4 px-1.5">{meta.label}</Badge>
                <Badge variant="outline" className="text-[9px] h-4 px-1.5">{slide.duration}s</Badge>
                <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                  {TRANSITIONS.find(t => t.value === slide.transition)?.label}
                </Badge>
                <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                  {LAYOUTS.find(l => l.value === slide.layout)?.label || '100%'}
                </Badge>
                {hasSchedule && (
                  <Badge className="text-[9px] h-4 px-1.5 bg-amber-100 text-amber-700 hover:bg-amber-100">
                    <CalendarIcon className="h-2.5 w-2.5 mr-0.5" /> Programme
                  </Badge>
                )}
              </div>
            </div>

            {/* Quick actions */}
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
  const [slideType, setSlideType] = useState('media');
  const [slideForm, setSlideForm] = useState({ media_id: '', duration: 10, transition: 'fade', layout: 'full', fit_mode: 'fit', content: {} });
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

  const addSlide = () => {
    const s = {
      id: crypto.randomUUID(), type: slideType, media_id: slideForm.media_id || null,
      content: { ...slideForm.content }, duration: parseInt(slideForm.duration) || 10,
      transition: slideForm.transition, layout: slideForm.layout, fit_mode: slideForm.fit_mode,
      is_active: true, order: playlist.slides.length, schedule_start: null, schedule_end: null,
    };
    if (slideType === 'media' && slideForm.media_id) {
      const m = media.find(x => x.id === slideForm.media_id);
      if (m) s.content = { url: m.url, name: m.name, type: m.type };
    }
    setPlaylist({ ...playlist, slides: [...playlist.slides, s] });
    setShowAddSlide(false);
    setSlideForm({ media_id: '', duration: 10, transition: 'fade', layout: 'full', fit_mode: 'fit', content: {} });
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
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => navigate('/playlists')} data-testid="back-playlists-btn">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <Input value={playlist.name} onChange={e => setPlaylist({ ...playlist, name: e.target.value })}
              className="text-xl font-bold border-0 p-0 h-auto focus-visible:ring-0 bg-transparent" data-testid="playlist-name-edit" />
            <p className="text-xs text-slate-400">{playlist.slides.length} diapo(s) &middot; Glissez pour reordonner &middot; Cliquez pour editer</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button onClick={() => setShowAddSlide(true)} data-testid="add-slide-btn">
            <Plus className="h-4 w-4 mr-2" /> Ajouter
          </Button>
          <Button variant="outline" onClick={savePlaylist} disabled={saving} data-testid="save-playlist-btn">
            <Save className="h-4 w-4 mr-2" /> {saving ? '...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      {/* Slides list */}
      {playlist.slides.length === 0 ? (
        <Card className="p-12 text-center">
          <Image className="h-10 w-10 mx-auto text-slate-200 mb-3" />
          <p className="text-slate-400 font-medium">Playlist vide</p>
          <Button className="mt-4" size="sm" onClick={() => setShowAddSlide(true)}>
            <Plus className="h-4 w-4 mr-1" /> Ajouter une diapo
          </Button>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={playlist.slides.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {playlist.slides.map((slide, i) => (
                <SortableSlide key={slide.id} slide={slide} index={i}
                  onEdit={setEditSlide} onRemove={removeSlide} onDuplicate={duplicateSlide} onToggle={toggleSlide} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* ═══ ADD SLIDE DIALOG ═══ */}
      <Dialog open={showAddSlide} onOpenChange={setShowAddSlide}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Ajouter une diapo</DialogTitle></DialogHeader>
          <Tabs value={slideType} onValueChange={setSlideType}>
            <TabsList className="w-full grid grid-cols-5">
              {Object.entries(TYPE_META).map(([k, v]) => (
                <TabsTrigger key={k} value={k} data-testid={`slide-type-${k}`}>
                  <v.icon className="h-3.5 w-3.5 mr-1.5" /> {v.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="media" className="mt-4">
              <Label className="mb-2 block text-sm">Choisir un media</Label>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {media.filter(m => m.type === 'image' || m.type === 'video').map(m => (
                  <div key={m.id} onClick={() => setSlideForm({ ...slideForm, media_id: m.id })}
                    className={`aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all relative group ${slideForm.media_id === m.id ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-slate-300'}`}>
                    {m.type === 'image' ? <img src={getMediaUrl(m.url)} alt={m.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center"><Film className="h-5 w-5 text-slate-400" /></div>}
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1.5 py-0.5 text-[9px] text-white truncate opacity-0 group-hover:opacity-100 transition">{m.name}</div>
                  </div>
                ))}
                {media.filter(m => m.type === 'image' || m.type === 'video').length === 0 && <p className="col-span-4 text-sm text-slate-400 py-6 text-center">Aucun media. Importez des fichiers d'abord.</p>}
              </div>
            </TabsContent>
            <TabsContent value="youtube" className="mt-4 space-y-3">
              <Label>URL YouTube</Label>
              <Input value={slideForm.content.url || ''} onChange={e => setSlideForm({ ...slideForm, content: { ...slideForm.content, url: e.target.value } })} placeholder="https://www.youtube.com/watch?v=..." data-testid="slide-youtube-url" />
            </TabsContent>
            <TabsContent value="qrcode" className="mt-4 space-y-3">
              <Label>URL a encoder</Label>
              <Input value={slideForm.content.url || ''} onChange={e => setSlideForm({ ...slideForm, content: { ...slideForm.content, url: e.target.value } })} placeholder="https://votre-site.com" data-testid="slide-qrcode-url" />
              {slideForm.content.url && <div className="flex justify-center p-4 bg-white rounded-lg border"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(slideForm.content.url)}`} alt="QR" className="w-32 h-32" /></div>}
            </TabsContent>
            <TabsContent value="countdown" className="mt-4 space-y-3">
              <Label>Titre</Label>
              <Input value={slideForm.content.label || ''} onChange={e => setSlideForm({ ...slideForm, content: { ...slideForm.content, label: e.target.value } })} placeholder="Evenement" data-testid="slide-countdown-label" />
              <Label>Date cible</Label>
              <Input type="datetime-local" value={slideForm.content.target_date || ''} onChange={e => setSlideForm({ ...slideForm, content: { ...slideForm.content, target_date: e.target.value } })} data-testid="slide-countdown-date" />
            </TabsContent>
            <TabsContent value="text" className="mt-4 space-y-3">
              <Label>Contenu (WYSIWYG)</Label>
              <RichTextEditor value={slideForm.content.html || ''} onChange={html => setSlideForm({ ...slideForm, content: { ...slideForm.content, html, text: html.replace(/<[^>]+>/g, '') } })} />
            </TabsContent>
          </Tabs>

          {/* 50/50 Right side content */}
          {slideForm.layout === 'split' && (
            <div className="pt-4 border-t border-dashed border-slate-200">
              <Label className="text-sm font-semibold mb-2 block">Contenu droite (50/50)</Label>
              <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto">
                {media.filter(m => m.type === 'image' || m.type === 'video').map(m => (
                  <div key={m.id} onClick={() => setSlideForm({ ...slideForm, content: { ...slideForm.content, right_media_id: m.id, right_url: m.url, right_name: m.name, right_type: m.type } })}
                    className={`aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${slideForm.content?.right_media_id === m.id ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-slate-300'}`}>
                    {m.type === 'image' ? <img src={getMediaUrl(m.url)} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center"><Film className="h-5 w-5 text-slate-400" /></div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t">
            <div><Label className="text-xs">Duree (s)</Label><Input type="number" value={slideForm.duration} onChange={e => setSlideForm({ ...slideForm, duration: parseInt(e.target.value) || 10 })} min="1" className="mt-1" data-testid="slide-duration-input" /></div>
            <div><Label className="text-xs">Transition</Label><Select value={slideForm.transition} onValueChange={v => setSlideForm({ ...slideForm, transition: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{TRANSITIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">Disposition</Label><Select value={slideForm.layout} onValueChange={v => setSlideForm({ ...slideForm, layout: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{LAYOUTS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">Affichage</Label><Select value={slideForm.fit_mode} onValueChange={v => setSlideForm({ ...slideForm, fit_mode: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{FIT_MODES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowAddSlide(false)}>Annuler</Button>
            <Button onClick={addSlide} data-testid="confirm-add-slide-btn">Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ EDIT SLIDE DIALOG ═══ */}
      <Dialog open={!!editSlide} onOpenChange={() => setEditSlide(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Modifier la diapo</DialogTitle></DialogHeader>
          {editSlide && (
            <div className="space-y-5">
              {/* Content editing by type */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  {(() => { const M = TYPE_META[editSlide.type]; return M ? <><M.icon className="h-4 w-4" /><span className="text-sm font-medium">{M.label}</span></> : null; })()}
                </div>
                {editSlide.type === 'media' && (
                  <div>
                    <Label className="mb-2 block">Changer le media</Label>
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                      {media.filter(m => m.type === 'image' || m.type === 'video').map(m => (
                        <div key={m.id} onClick={() => setEditSlide({ ...editSlide, media_id: m.id, content: { url: m.url, name: m.name, type: m.type } })}
                          className={`aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${editSlide.media_id === m.id || editSlide.content?.url === m.url ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-slate-300'}`}>
                          {m.type === 'image' ? <img src={getMediaUrl(m.url)} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center"><Film className="h-5 w-5 text-slate-400" /></div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {editSlide.type === 'youtube' && (
                  <div><Label>URL YouTube</Label><Input className="mt-1" value={editSlide.content?.url || ''} onChange={e => setEditSlide({ ...editSlide, content: { ...editSlide.content, url: e.target.value } })} data-testid="edit-youtube-url" /></div>
                )}
                {editSlide.type === 'qrcode' && (
                  <div className="space-y-3">
                    <div><Label>URL du QR Code</Label><Input className="mt-1" value={editSlide.content?.url || ''} onChange={e => setEditSlide({ ...editSlide, content: { ...editSlide.content, url: e.target.value } })} data-testid="edit-qrcode-url" /></div>
                    {editSlide.content?.url && <div className="flex justify-center p-3 bg-white rounded-lg border"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(editSlide.content.url)}`} alt="QR" className="w-28 h-28" /></div>}
                  </div>
                )}
                {editSlide.type === 'countdown' && (
                  <div className="space-y-3">
                    <div><Label>Titre</Label><Input className="mt-1" value={editSlide.content?.label || ''} onChange={e => setEditSlide({ ...editSlide, content: { ...editSlide.content, label: e.target.value } })} /></div>
                    <div><Label>Date cible</Label><Input type="datetime-local" className="mt-1" value={editSlide.content?.target_date || ''} onChange={e => setEditSlide({ ...editSlide, content: { ...editSlide.content, target_date: e.target.value } })} /></div>
                  </div>
                )}
                {editSlide.type === 'text' && (
                  <RichTextEditor value={editSlide.content?.html || ''} onChange={html => setEditSlide({ ...editSlide, content: { ...editSlide.content, html, text: html.replace(/<[^>]+>/g, '') } })} />
                )}
              </div>

              {/* Display options */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t">
                <div><Label className="text-xs">Duree (s)</Label><Input type="number" className="mt-1" value={editSlide.duration} onChange={e => setEditSlide({ ...editSlide, duration: parseInt(e.target.value) || 5 })} min="1" data-testid="edit-duration" /></div>
                <div><Label className="text-xs">Transition</Label><Select value={editSlide.transition} onValueChange={v => setEditSlide({ ...editSlide, transition: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{TRANSITIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs">Disposition</Label><Select value={editSlide.layout || 'full'} onValueChange={v => setEditSlide({ ...editSlide, layout: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{LAYOUTS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs">Affichage</Label><Select value={editSlide.fit_mode || 'fit'} onValueChange={v => setEditSlide({ ...editSlide, fit_mode: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{FIT_MODES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent></Select></div>
              </div>

              {/* Schedule */}
              <div className="pt-3 border-t">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" /> Programmation
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DateTimePicker label="Debut de diffusion" value={editSlide.schedule_start} onChange={v => setEditSlide({ ...editSlide, schedule_start: v })} />
                  <DateTimePicker label="Fin de diffusion" value={editSlide.schedule_end} onChange={v => setEditSlide({ ...editSlide, schedule_end: v })} />
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-2">
                  <Switch checked={editSlide.is_active} onCheckedChange={v => setEditSlide({ ...editSlide, is_active: v })} data-testid="edit-active-toggle" />
                  <Label>{editSlide.is_active ? 'Active' : 'Desactivee'}</Label>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setPreviewSlide(editSlide)} data-testid="edit-preview-btn">
                  <Eye className="h-4 w-4 mr-1.5" /> Apercu
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSlide(null)}>Annuler</Button>
            <Button onClick={saveEditSlide} data-testid="save-edit-slide-btn">Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ PREVIEW DIALOG ═══ */}
      <Dialog open={!!previewSlide} onOpenChange={() => setPreviewSlide(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <div className="aspect-video bg-black relative">
            {previewSlide && <SlidePreview slide={previewSlide} />}
          </div>
          <div className="p-3 flex justify-end"><Button variant="outline" size="sm" onClick={() => setPreviewSlide(null)}>Fermer</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SlidePreview({ slide }) {
  const c = slide.content || {};
  const fit = slide.fit_mode === 'fill' ? 'cover' : 'contain';
  if (slide.type === 'media' && c.type === 'image') return <img src={getMediaUrl(c.url)} alt="" className="w-full h-full" style={{ objectFit: fit }} />;
  if (slide.type === 'media' && c.type === 'video') return <video src={getMediaUrl(c.url)} autoPlay muted loop className="w-full h-full" style={{ objectFit: fit }} />;
  if (slide.type === 'youtube') {
    const m = (c.url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/);
    return m ? <iframe src={`https://www.youtube.com/embed/${m[1]}?autoplay=1&mute=1`} className="w-full h-full" frameBorder="0" allow="autoplay" allowFullScreen title="YT" /> : <p className="text-white text-center pt-20">URL invalide</p>;
  }
  if (slide.type === 'qrcode') return <div className="flex items-center justify-center h-full bg-slate-900"><div className="bg-white p-6 rounded-2xl"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(c.url || '')}`} alt="QR" className="w-56 h-56" /></div></div>;
  if (slide.type === 'countdown') return <div className="flex flex-col items-center justify-center h-full bg-slate-900 text-white"><p className="text-2xl mb-4 opacity-70">{c.label}</p><p className="text-5xl font-mono font-bold">00:00:00:00</p></div>;
  if (slide.type === 'text') return <div className="flex items-center justify-center h-full bg-slate-900 p-8"><div className="text-white text-xl max-w-3xl" dangerouslySetInnerHTML={{ __html: c.html || c.text || '' }} /></div>;
  return null;
}
