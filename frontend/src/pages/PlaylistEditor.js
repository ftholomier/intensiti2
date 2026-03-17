import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API, { getMediaUrl } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import RichTextEditor from '../components/RichTextEditor';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, Trash2, Image, Film, Youtube, Type, QrCode, Timer,
  Eye, EyeOff, Save, ArrowLeft, Copy, GripVertical, Maximize,
  Columns, Monitor, Expand, Shrink, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

const TRANSITIONS = [
  { value: 'fade', label: 'Fondu' },
  { value: 'slide', label: 'Glissement' },
  { value: 'random', label: 'Aleatoire' },
  { value: 'none', label: 'Aucune' },
];

const LAYOUTS = [
  { value: 'full', label: '100%', icon: Maximize, desc: 'Plein ecran dans la zone' },
  { value: 'split-left', label: '50% gauche', icon: Columns, desc: 'Moitie gauche' },
  { value: 'split-right', label: '50% droite', icon: Columns, desc: 'Moitie droite' },
  { value: 'immersion', label: 'Immersion', icon: Monitor, desc: 'Masque les bandeaux' },
];

const FIT_MODES = [
  { value: 'fit', label: 'Ajuster', icon: Shrink, desc: 'Affiche en entier' },
  { value: 'fill', label: 'Remplir', icon: Expand, desc: 'Remplit la zone (rognage)' },
];

// --- Sortable Slide Item ---
function SortableSlide({ slide, index, media, onRemove, onDuplicate, onToggle, onUpdate, onPreview }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slide.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  const typeLabels = { media: 'Media', youtube: 'YouTube', qrcode: 'QR Code', countdown: 'Compte a rebours', text: 'Texte' };
  const typeIcons = { media: Image, youtube: Youtube, qrcode: QrCode, countdown: Timer, text: Type };
  const Icon = typeIcons[slide.type] || Image;

  return (
    <div ref={setNodeRef} style={style} className={`transition-shadow ${!slide.is_active ? 'opacity-40' : ''}`}>
      <Card className={`border-l-4 ${slide.is_active ? 'border-l-primary' : 'border-l-slate-300'} ${isDragging ? 'shadow-xl ring-2 ring-primary/20' : 'hover:shadow-md'}`}>
        <CardContent className="p-0">
          <div className="flex items-stretch">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="flex items-center px-2 cursor-grab active:cursor-grabbing bg-slate-50 hover:bg-slate-100 transition-colors border-r border-slate-100"
              data-testid={`drag-handle-${slide.id}`}
            >
              <GripVertical className="h-5 w-5 text-slate-400" />
            </div>

            {/* Thumbnail */}
            <div className="w-32 h-24 bg-slate-100 shrink-0 flex items-center justify-center overflow-hidden relative">
              {slide.type === 'media' && slide.content?.type === 'image' ? (
                <img src={getMediaUrl(slide.content.url)} alt="" className="w-full h-full object-cover" />
              ) : slide.type === 'text' ? (
                <div className="w-full h-full bg-slate-800 p-2 overflow-hidden" dangerouslySetInnerHTML={{ __html: slide.content?.html || slide.content?.text || '' }} />
              ) : (
                <div className="flex flex-col items-center gap-1 text-slate-400">
                  <Icon className="h-6 w-6" />
                  <span className="text-[9px] uppercase tracking-wider">{typeLabels[slide.type]}</span>
                </div>
              )}
              <div className="absolute top-1 left-1">
                <span className="bg-black/60 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                  {index + 1}
                </span>
              </div>
            </div>

            {/* Info + Controls */}
            <div className="flex-1 p-3 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {slide.content?.name || slide.content?.label || slide.content?.text?.replace(/<[^>]+>/g, '').substring(0, 40) || `Diapo ${index + 1}`}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className="text-[10px] h-5">{typeLabels[slide.type]}</Badge>
                    <Badge variant="outline" className="text-[10px] h-5">
                      {LAYOUTS.find(l => l.value === slide.layout)?.label || '100%'}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] h-5">
                      {FIT_MODES.find(f => f.value === slide.fit_mode)?.label || 'Ajuster'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Inline controls row */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Duration */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 uppercase">Duree</span>
                  <Input
                    type="number"
                    value={slide.duration}
                    onChange={e => onUpdate(slide.id, 'duration', parseInt(e.target.value) || 5)}
                    className="h-7 w-14 text-xs text-center"
                    min="1" max="300"
                  />
                  <span className="text-[10px] text-slate-400">s</span>
                </div>

                {/* Transition */}
                <Select value={slide.transition} onValueChange={v => onUpdate(slide.id, 'transition', v)}>
                  <SelectTrigger className="h-7 w-[100px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSITIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>

                {/* Layout */}
                <Select value={slide.layout || 'full'} onValueChange={v => onUpdate(slide.id, 'layout', v)}>
                  <SelectTrigger className="h-7 w-[110px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LAYOUTS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>

                {/* Fit mode */}
                <Select value={slide.fit_mode || 'fit'} onValueChange={v => onUpdate(slide.id, 'fit_mode', v)}>
                  <SelectTrigger className="h-7 w-[100px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIT_MODES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>

                <div className="flex-1" />

                {/* Action buttons */}
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onPreview(slide)} title="Apercu" data-testid={`preview-slide-${slide.id}`}>
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onToggle(slide.id)} title={slide.is_active ? 'Desactiver' : 'Activer'} data-testid={`toggle-slide-${slide.id}`}>
                  {slide.is_active ? <Eye className="h-3.5 w-3.5 text-emerald-500" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onDuplicate(slide)} title="Dupliquer" data-testid={`dup-slide-${slide.id}`}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-600" onClick={() => onRemove(slide.id)} title="Supprimer" data-testid={`remove-slide-${slide.id}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Main Component ---
export default function PlaylistEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [media, setMedia] = useState([]);
  const [showAddSlide, setShowAddSlide] = useState(false);
  const [previewSlide, setPreviewSlide] = useState(null);
  const [saving, setSaving] = useState(false);
  const [slideType, setSlideType] = useState('media');
  const [slideForm, setSlideForm] = useState({
    media_id: '', duration: 10, transition: 'fade', layout: 'full', fit_mode: 'fit', content: {}
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

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
    const oldIndex = playlist.slides.findIndex(s => s.id === active.id);
    const newIndex = playlist.slides.findIndex(s => s.id === over.id);
    const newSlides = arrayMove(playlist.slides, oldIndex, newIndex).map((s, i) => ({ ...s, order: i }));
    setPlaylist({ ...playlist, slides: newSlides });
  };

  const addSlide = () => {
    const newSlide = {
      id: crypto.randomUUID(),
      type: slideType,
      media_id: slideForm.media_id || null,
      content: { ...slideForm.content },
      duration: parseInt(slideForm.duration) || 10,
      transition: slideForm.transition,
      layout: slideForm.layout,
      fit_mode: slideForm.fit_mode,
      is_active: true,
      order: playlist.slides.length,
      schedule_start: null,
      schedule_end: null,
    };

    if (slideType === 'media' && slideForm.media_id) {
      const m = media.find(x => x.id === slideForm.media_id);
      if (m) newSlide.content = { url: m.url, name: m.name, type: m.type };
    } else if (slideType === 'youtube') {
      newSlide.content = { url: slideForm.content.url || '' };
    } else if (slideType === 'qrcode') {
      newSlide.content = { url: slideForm.content.url || '' };
    } else if (slideType === 'countdown') {
      newSlide.content = { target_date: slideForm.content.target_date || '', label: slideForm.content.label || 'Compte a rebours' };
    } else if (slideType === 'text') {
      newSlide.content = { html: slideForm.content.html || '', text: slideForm.content.text || '' };
    }

    setPlaylist({ ...playlist, slides: [...playlist.slides, newSlide] });
    setShowAddSlide(false);
    setSlideForm({ media_id: '', duration: 10, transition: 'fade', layout: 'full', fit_mode: 'fit', content: {} });
    toast.success('Diapo ajoutee');
  };

  const removeSlide = (slideId) => {
    setPlaylist({
      ...playlist,
      slides: playlist.slides.filter(s => s.id !== slideId).map((s, i) => ({ ...s, order: i }))
    });
  };

  const duplicateSlide = (slide) => {
    const dup = { ...JSON.parse(JSON.stringify(slide)), id: crypto.randomUUID(), order: playlist.slides.length };
    setPlaylist({ ...playlist, slides: [...playlist.slides, dup] });
    toast.success('Diapo dupliquee');
  };

  const toggleSlide = (slideId) => {
    setPlaylist({
      ...playlist,
      slides: playlist.slides.map(s => s.id === slideId ? { ...s, is_active: !s.is_active } : s)
    });
  };

  const updateSlide = (slideId, field, value) => {
    setPlaylist({
      ...playlist,
      slides: playlist.slides.map(s => s.id === slideId ? { ...s, [field]: value } : s)
    });
  };

  if (!playlist) return <div className="p-8 text-center text-slate-400">Chargement...</div>;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/playlists')} data-testid="back-playlists-btn">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <Input
              value={playlist.name}
              onChange={e => setPlaylist({ ...playlist, name: e.target.value })}
              className="text-xl font-bold border-0 p-0 h-auto focus-visible:ring-0 bg-transparent"
              data-testid="playlist-name-edit"
            />
            <p className="text-xs text-slate-400 mt-0.5">{playlist.slides.length} diapo(s) - Glissez pour reordonner</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddSlide(true)} data-testid="add-slide-btn">
            <Plus className="h-4 w-4 mr-2" /> Ajouter une diapo
          </Button>
          <Button variant="outline" onClick={savePlaylist} disabled={saving} data-testid="save-playlist-btn">
            <Save className="h-4 w-4 mr-2" /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      {/* Slides List with DnD */}
      {playlist.slides.length === 0 ? (
        <Card className="p-12 text-center">
          <Image className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">Aucune diapo dans cette playlist</p>
          <p className="text-sm text-slate-400 mt-1">Ajoutez des images, videos, textes ou QR codes</p>
          <Button className="mt-4" onClick={() => setShowAddSlide(true)}>
            <Plus className="h-4 w-4 mr-2" /> Ajouter une diapo
          </Button>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={playlist.slides.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {playlist.slides.map((slide, index) => (
                <SortableSlide
                  key={slide.id}
                  slide={slide}
                  index={index}
                  media={media}
                  onRemove={removeSlide}
                  onDuplicate={duplicateSlide}
                  onToggle={toggleSlide}
                  onUpdate={updateSlide}
                  onPreview={setPreviewSlide}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* === Add Slide Dialog === */}
      <Dialog open={showAddSlide} onOpenChange={setShowAddSlide}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter une diapo</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <Tabs value={slideType} onValueChange={setSlideType}>
              <TabsList className="w-full grid grid-cols-5">
                <TabsTrigger value="media" data-testid="slide-type-media">
                  <Image className="h-3.5 w-3.5 mr-1.5" /> Media
                </TabsTrigger>
                <TabsTrigger value="youtube" data-testid="slide-type-youtube">
                  <Youtube className="h-3.5 w-3.5 mr-1.5" /> YouTube
                </TabsTrigger>
                <TabsTrigger value="qrcode" data-testid="slide-type-qrcode">
                  <QrCode className="h-3.5 w-3.5 mr-1.5" /> QR Code
                </TabsTrigger>
                <TabsTrigger value="countdown" data-testid="slide-type-countdown">
                  <Timer className="h-3.5 w-3.5 mr-1.5" /> Compte a rebours
                </TabsTrigger>
                <TabsTrigger value="text" data-testid="slide-type-text">
                  <Type className="h-3.5 w-3.5 mr-1.5" /> Texte
                </TabsTrigger>
              </TabsList>

              <TabsContent value="media" className="space-y-3 mt-4">
                <Label>Choisir un media de la bibliotheque</Label>
                {media.filter(m => m.type === 'image' || m.type === 'video').length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">Aucun media disponible. Importez des fichiers dans la mediatheque.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto p-1">
                    {media.filter(m => m.type === 'image' || m.type === 'video').map(m => (
                      <div
                        key={m.id}
                        className={`aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all relative group ${
                          slideForm.media_id === m.id ? 'border-primary ring-2 ring-primary/20 scale-[0.97]' : 'border-transparent hover:border-slate-300'
                        }`}
                        onClick={() => setSlideForm({ ...slideForm, media_id: m.id })}
                      >
                        {m.type === 'image' ? (
                          <img src={getMediaUrl(m.url)} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                            <Film className="h-6 w-6 text-slate-400" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[10px] text-white truncate">{m.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="youtube" className="space-y-3 mt-4">
                <Label>URL de la video YouTube</Label>
                <Input
                  value={slideForm.content.url || ''}
                  onChange={e => setSlideForm({ ...slideForm, content: { ...slideForm.content, url: e.target.value } })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  data-testid="slide-youtube-url"
                />
              </TabsContent>

              <TabsContent value="qrcode" className="space-y-3 mt-4">
                <Label>URL a encoder dans le QR Code</Label>
                <Input
                  value={slideForm.content.url || ''}
                  onChange={e => setSlideForm({ ...slideForm, content: { ...slideForm.content, url: e.target.value } })}
                  placeholder="https://votre-site.com"
                  data-testid="slide-qrcode-url"
                />
                {slideForm.content.url && (
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(slideForm.content.url)}`}
                      alt="QR Preview"
                      className="w-32 h-32"
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="countdown" className="space-y-3 mt-4">
                <div className="space-y-2">
                  <Label>Titre du compte a rebours</Label>
                  <Input
                    value={slideForm.content.label || ''}
                    onChange={e => setSlideForm({ ...slideForm, content: { ...slideForm.content, label: e.target.value } })}
                    placeholder="Evenement a venir"
                    data-testid="slide-countdown-label"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date et heure cible</Label>
                  <Input
                    type="datetime-local"
                    value={slideForm.content.target_date || ''}
                    onChange={e => setSlideForm({ ...slideForm, content: { ...slideForm.content, target_date: e.target.value } })}
                    data-testid="slide-countdown-date"
                  />
                </div>
              </TabsContent>

              <TabsContent value="text" className="space-y-3 mt-4">
                <Label>Contenu texte (WYSIWYG)</Label>
                <RichTextEditor
                  value={slideForm.content.html || ''}
                  onChange={html => setSlideForm({
                    ...slideForm,
                    content: { ...slideForm.content, html, text: html.replace(/<[^>]+>/g, '') }
                  })}
                  placeholder="Saisissez et formatez votre texte..."
                />
              </TabsContent>
            </Tabs>

            {/* Common options */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
              <div className="space-y-1.5">
                <Label className="text-xs">Duree (sec)</Label>
                <Input
                  type="number"
                  value={slideForm.duration}
                  onChange={e => setSlideForm({ ...slideForm, duration: parseInt(e.target.value) || 10 })}
                  min="1" max="300"
                  data-testid="slide-duration-input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Transition</Label>
                <Select value={slideForm.transition} onValueChange={v => setSlideForm({ ...slideForm, transition: v })}>
                  <SelectTrigger data-testid="slide-transition-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRANSITIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Disposition</Label>
                <Select value={slideForm.layout} onValueChange={v => setSlideForm({ ...slideForm, layout: v })}>
                  <SelectTrigger data-testid="slide-layout-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LAYOUTS.map(l => <SelectItem key={l.value} value={l.value}>{l.label} - {l.desc}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Mode d'affichage</Label>
                <Select value={slideForm.fit_mode} onValueChange={v => setSlideForm({ ...slideForm, fit_mode: v })}>
                  <SelectTrigger data-testid="slide-fit-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FIT_MODES.map(f => <SelectItem key={f.value} value={f.value}>{f.label} - {f.desc}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowAddSlide(false)}>Annuler</Button>
            <Button onClick={addSlide} data-testid="confirm-add-slide-btn">Ajouter la diapo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === Preview Dialog === */}
      <Dialog open={!!previewSlide} onOpenChange={() => setPreviewSlide(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <div className="aspect-video bg-black relative">
            {previewSlide && (
              <SlidePreview slide={previewSlide} />
            )}
          </div>
          <div className="p-4 flex justify-end">
            <Button variant="outline" onClick={() => setPreviewSlide(null)}>Fermer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SlidePreview({ slide }) {
  const content = slide.content || {};
  const fitMode = slide.fit_mode === 'fill' ? 'cover' : 'contain';

  if (slide.type === 'media' && content.type === 'image') {
    return <img src={getMediaUrl(content.url)} alt="" className="w-full h-full" style={{ objectFit: fitMode }} />;
  }
  if (slide.type === 'media' && content.type === 'video') {
    return <video src={getMediaUrl(content.url)} autoPlay muted loop playsInline className="w-full h-full" style={{ objectFit: fitMode }} />;
  }
  if (slide.type === 'youtube') {
    const match = (content.url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/);
    const ytId = match ? match[1] : null;
    return ytId ? (
      <iframe src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1`} className="w-full h-full" frameBorder="0" allow="autoplay" allowFullScreen title="Preview" />
    ) : <p className="text-white text-center pt-20">URL YouTube invalide</p>;
  }
  if (slide.type === 'qrcode') {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900">
        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(content.url)}&bgcolor=111827&color=ffffff`} alt="QR" className="w-64 h-64" />
      </div>
    );
  }
  if (slide.type === 'countdown') {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-900 text-white">
        <p className="text-2xl mb-4 opacity-70">{content.label || 'Compte a rebours'}</p>
        <p className="text-5xl font-mono font-bold">00 : 00 : 00 : 00</p>
      </div>
    );
  }
  if (slide.type === 'text') {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900 p-8">
        <div className="text-white text-xl" dangerouslySetInnerHTML={{ __html: content.html || content.text || '' }} />
      </div>
    );
  }
  return null;
}
