import { useEffect, useState } from 'react';
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
import {
  Plus, Trash2, ArrowUp, ArrowDown, Image, Film, Youtube, Type, QrCode,
  Timer, Eye, EyeOff, Save, ArrowLeft, Copy, GripVertical
} from 'lucide-react';
import { toast } from 'sonner';

const TRANSITIONS = [
  { value: 'fade', label: 'Fondu' },
  { value: 'slide', label: 'Glissement' },
  { value: 'random', label: 'Aleatoire' },
  { value: 'none', label: 'Aucune' },
];

export default function PlaylistEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [media, setMedia] = useState([]);
  const [showAddSlide, setShowAddSlide] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slideType, setSlideType] = useState('media');
  const [slideForm, setSlideForm] = useState({
    media_id: '', duration: 10, transition: 'fade', content: {}
  });

  useEffect(() => {
    API.get(`/playlists/${id}`).then(r => setPlaylist(r.data)).catch(() => navigate('/playlists'));
    API.get('/media').then(r => setMedia(r.data)).catch(() => {});
  }, [id, navigate]);

  const savePlaylist = async () => {
    setSaving(true);
    try {
      await API.put(`/playlists/${id}`, { slides: playlist.slides, name: playlist.name });
      toast.success('Playlist sauvegardee');
    } catch {
      toast.error('Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const addSlide = () => {
    const newSlide = {
      id: crypto.randomUUID(),
      type: slideType,
      media_id: slideForm.media_id || null,
      content: { ...slideForm.content },
      duration: parseInt(slideForm.duration) || 10,
      transition: slideForm.transition,
      is_active: true,
      order: playlist.slides.length,
      schedule_start: null,
      schedule_end: null,
      fit_mode: 'fit',
    };

    if (slideType === 'media' && slideForm.media_id) {
      const m = media.find(x => x.id === slideForm.media_id);
      if (m) {
        newSlide.content = { url: m.url, name: m.name, type: m.type };
      }
    } else if (slideType === 'youtube') {
      newSlide.content = { url: slideForm.content.url || '' };
    } else if (slideType === 'qrcode') {
      newSlide.content = { url: slideForm.content.url || '' };
    } else if (slideType === 'countdown') {
      newSlide.content = { target_date: slideForm.content.target_date || '', label: slideForm.content.label || 'Compte a rebours' };
    } else if (slideType === 'text') {
      newSlide.content = { text: slideForm.content.text || '', bg_color: '#1E293B', text_color: '#FFFFFF' };
    }

    setPlaylist({ ...playlist, slides: [...playlist.slides, newSlide] });
    setShowAddSlide(false);
    setSlideForm({ media_id: '', duration: 10, transition: 'fade', content: {} });
  };

  const removeSlide = (slideId) => {
    setPlaylist({
      ...playlist,
      slides: playlist.slides.filter(s => s.id !== slideId).map((s, i) => ({ ...s, order: i }))
    });
  };

  const duplicateSlide = (slide) => {
    const dup = { ...slide, id: crypto.randomUUID(), order: playlist.slides.length };
    setPlaylist({ ...playlist, slides: [...playlist.slides, dup] });
    toast.success('Diapo dupliquee');
  };

  const toggleSlide = (slideId) => {
    setPlaylist({
      ...playlist,
      slides: playlist.slides.map(s => s.id === slideId ? { ...s, is_active: !s.is_active } : s)
    });
  };

  const moveSlide = (index, dir) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= playlist.slides.length) return;
    const slides = [...playlist.slides];
    [slides[index], slides[newIndex]] = [slides[newIndex], slides[index]];
    setPlaylist({ ...playlist, slides: slides.map((s, i) => ({ ...s, order: i })) });
  };

  const updateSlide = (slideId, field, value) => {
    setPlaylist({
      ...playlist,
      slides: playlist.slides.map(s => s.id === slideId ? { ...s, [field]: value } : s)
    });
  };

  if (!playlist) return <div className="p-8 text-center text-slate-400">Chargement...</div>;

  const slideTypeIcon = (type) => {
    const icons = { media: Image, youtube: Youtube, qrcode: QrCode, countdown: Timer, text: Type };
    const Icon = icons[type] || Image;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="animate-fade-in">
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
            <p className="text-xs text-slate-400 mt-0.5">{playlist.slides.length} diapo(s)</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddSlide(true)} data-testid="add-slide-btn">
            <Plus className="h-4 w-4 mr-2" /> Ajouter
          </Button>
          <Button variant="outline" onClick={savePlaylist} disabled={saving} data-testid="save-playlist-btn">
            <Save className="h-4 w-4 mr-2" /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      {/* Slides List */}
      {playlist.slides.length === 0 ? (
        <Card className="p-12 text-center">
          <Image className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Aucune diapo</p>
          <p className="text-sm text-slate-400 mt-1">Ajoutez des contenus a votre playlist</p>
          <Button className="mt-4" onClick={() => setShowAddSlide(true)}>
            <Plus className="h-4 w-4 mr-2" /> Ajouter une diapo
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {playlist.slides.map((slide, index) => (
            <Card key={slide.id} className={`transition-all duration-200 ${!slide.is_active ? 'opacity-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Order + Move */}
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveSlide(index, -1)} data-testid={`move-up-${slide.id}`}>
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <span className="text-xs font-mono text-slate-400">{index + 1}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveSlide(index, 1)} data-testid={`move-down-${slide.id}`}>
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Preview */}
                  <div className="w-24 h-16 rounded-md bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                    {slide.type === 'media' && slide.content?.type === 'image' ? (
                      <img src={getMediaUrl(slide.content.url)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        {slideTypeIcon(slide.type)}
                        <span className="text-[10px] text-slate-400 capitalize">{slide.type}</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate">
                        {slide.content?.name || slide.content?.text?.substring(0, 30) || slide.content?.url?.substring(0, 30) || `Diapo ${index + 1}`}
                      </span>
                      <Badge variant="secondary" className="text-[10px] shrink-0">{slide.type}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>{slide.duration}s</span>
                      <span>{TRANSITIONS.find(t => t.value === slide.transition)?.label || slide.transition}</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={slide.transition}
                      onValueChange={v => updateSlide(slide.id, 'transition', v)}
                    >
                      <SelectTrigger className="h-8 w-[110px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRANSITIONS.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      value={slide.duration}
                      onChange={e => updateSlide(slide.id, 'duration', parseInt(e.target.value) || 5)}
                      className="h-8 w-16 text-xs text-center"
                      min="1"
                      max="300"
                    />

                    <Button
                      variant="ghost" size="sm"
                      onClick={() => toggleSlide(slide.id)}
                      data-testid={`toggle-slide-${slide.id}`}
                      className={slide.is_active ? 'text-emerald-500' : 'text-slate-400'}
                    >
                      {slide.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>

                    <Button variant="ghost" size="sm" onClick={() => duplicateSlide(slide)} data-testid={`dup-slide-${slide.id}`}>
                      <Copy className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost" size="sm"
                      onClick={() => removeSlide(slide.id)}
                      data-testid={`remove-slide-${slide.id}`}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Slide Dialog */}
      <Dialog open={showAddSlide} onOpenChange={setShowAddSlide}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter une diapo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Tabs value={slideType} onValueChange={setSlideType}>
              <TabsList className="w-full">
                <TabsTrigger value="media" className="flex-1" data-testid="slide-type-media">Media</TabsTrigger>
                <TabsTrigger value="youtube" className="flex-1" data-testid="slide-type-youtube">YouTube</TabsTrigger>
                <TabsTrigger value="qrcode" className="flex-1" data-testid="slide-type-qrcode">QR Code</TabsTrigger>
                <TabsTrigger value="countdown" className="flex-1" data-testid="slide-type-countdown">Compte a rebours</TabsTrigger>
                <TabsTrigger value="text" className="flex-1" data-testid="slide-type-text">Texte</TabsTrigger>
              </TabsList>

              <TabsContent value="media" className="space-y-3">
                <Label>Choisir un media</Label>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {media.filter(m => m.type === 'image' || m.type === 'video').map(m => (
                    <div
                      key={m.id}
                      className={`aspect-video rounded-md overflow-hidden cursor-pointer border-2 transition-all ${
                        slideForm.media_id === m.id ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-slate-300'
                      }`}
                      onClick={() => setSlideForm({ ...slideForm, media_id: m.id })}
                    >
                      {m.type === 'image' ? (
                        <img src={getMediaUrl(m.url)} alt={m.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                          <Film className="h-5 w-5 text-slate-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="youtube" className="space-y-3">
                <Label>URL YouTube</Label>
                <Input
                  value={slideForm.content.url || ''}
                  onChange={e => setSlideForm({ ...slideForm, content: { ...slideForm.content, url: e.target.value } })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  data-testid="slide-youtube-url"
                />
              </TabsContent>

              <TabsContent value="qrcode" className="space-y-3">
                <Label>URL du QR Code</Label>
                <Input
                  value={slideForm.content.url || ''}
                  onChange={e => setSlideForm({ ...slideForm, content: { ...slideForm.content, url: e.target.value } })}
                  placeholder="https://votre-site.com"
                  data-testid="slide-qrcode-url"
                />
              </TabsContent>

              <TabsContent value="countdown" className="space-y-3">
                <Label>Date cible</Label>
                <Input
                  type="datetime-local"
                  value={slideForm.content.target_date || ''}
                  onChange={e => setSlideForm({ ...slideForm, content: { ...slideForm.content, target_date: e.target.value } })}
                  data-testid="slide-countdown-date"
                />
                <Label>Titre</Label>
                <Input
                  value={slideForm.content.label || ''}
                  onChange={e => setSlideForm({ ...slideForm, content: { ...slideForm.content, label: e.target.value } })}
                  placeholder="Evenement a venir"
                  data-testid="slide-countdown-label"
                />
              </TabsContent>

              <TabsContent value="text" className="space-y-3">
                <Label>Texte a afficher</Label>
                <textarea
                  className="w-full h-24 rounded-md border border-slate-300 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  value={slideForm.content.text || ''}
                  onChange={e => setSlideForm({ ...slideForm, content: { ...slideForm.content, text: e.target.value } })}
                  placeholder="Votre message..."
                  data-testid="slide-text-input"
                />
              </TabsContent>
            </Tabs>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duree (secondes)</Label>
                <Input
                  type="number"
                  value={slideForm.duration}
                  onChange={e => setSlideForm({ ...slideForm, duration: parseInt(e.target.value) || 10 })}
                  min="1"
                  data-testid="slide-duration-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Transition</Label>
                <Select value={slideForm.transition} onValueChange={v => setSlideForm({ ...slideForm, transition: v })}>
                  <SelectTrigger data-testid="slide-transition-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSITIONS.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSlide(false)}>Annuler</Button>
            <Button onClick={addSlide} data-testid="confirm-add-slide-btn">Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
