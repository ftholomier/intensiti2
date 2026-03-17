import { useEffect, useState } from 'react';
import API from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Trash2, Monitor, Copy, Wifi, WifiOff, Tag, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function Screens() {
  const [screens, setScreens] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', weather_city: 'Paris', group: '', tags: [] });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = () => {
    API.get('/screens').then(r => setScreens(r.data)).catch(() => {});
    API.get('/playlists').then(r => setPlaylists(r.data)).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/screens', form);
      toast.success('Ecran cree');
      setShowCreate(false);
      setForm({ name: '', weather_city: 'Paris', group: '', tags: [] });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet ecran ?')) return;
    try {
      await API.delete(`/screens/${id}`);
      toast.success('Ecran supprime');
      loadData();
    } catch {
      toast.error('Erreur');
    }
  };

  const assignPlaylist = async (screenId, playlistId) => {
    try {
      await API.put(`/screens/${screenId}`, { playlist_id: playlistId || null });
      toast.success('Playlist assignee');
      loadData();
    } catch {
      toast.error('Erreur');
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copie');
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="screens-title">Ecrans</h1>
          <p className="text-slate-500 mt-1">Gerez votre parc d'ecrans</p>
        </div>
        <Button onClick={() => setShowCreate(true)} data-testid="create-screen-btn">
          <Plus className="h-4 w-4 mr-2" />
          Nouvel ecran
        </Button>
      </div>

      {screens.length === 0 ? (
        <Card className="p-12 text-center">
          <Monitor className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Aucun ecran configure</p>
          <p className="text-sm text-slate-400 mt-1">Creez votre premier ecran pour commencer</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {screens.map(screen => (
            <Card key={screen.id} className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Monitor className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{screen.name}</h3>
                      <p className="text-xs text-slate-400">{screen.weather_city}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {screen.is_online ? (
                      <Badge variant="default" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">
                        <Wifi className="h-3 w-3 mr-1" /> En ligne
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <WifiOff className="h-3 w-3 mr-1" /> Hors ligne
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Pairing Code */}
                <div className="bg-slate-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Code d'appairage</p>
                      <p className="text-xl font-mono font-bold tracking-[0.3em] text-primary mt-0.5">
                        {screen.pairing_code}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyCode(screen.pairing_code)}
                      data-testid={`copy-code-${screen.id}`}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Playlist assignment */}
                <div className="mb-4">
                  <Label className="text-xs text-slate-500 mb-1.5 block">Playlist</Label>
                  <Select
                    value={screen.playlist_id || 'none'}
                    onValueChange={(val) => assignPlaylist(screen.id, val === 'none' ? null : val)}
                  >
                    <SelectTrigger className="h-9 text-sm" data-testid={`playlist-select-${screen.id}`}>
                      <SelectValue placeholder="Aucune playlist" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune playlist</SelectItem>
                      {playlists.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags */}
                {screen.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {screen.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        <Tag className="h-2.5 w-2.5" /> {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/display/${screen.pairing_code}`, '_blank')}
                    data-testid={`preview-screen-${screen.id}`}
                    className="gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Voir l'ecran
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(screen.id)}
                    data-testid={`delete-screen-${screen.id}`}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel ecran</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de l'ecran</Label>
              <Input
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                placeholder="Ex: Hall d'accueil"
                data-testid="screen-name-input"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Ville (meteo)</Label>
              <Input
                value={form.weather_city}
                onChange={e => setForm({...form, weather_city: e.target.value})}
                placeholder="Paris"
                data-testid="screen-city-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Groupe</Label>
              <Input
                value={form.group}
                onChange={e => setForm({...form, group: e.target.value})}
                placeholder="Ex: Etage 2"
                data-testid="screen-group-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  placeholder="Ajouter un tag"
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  data-testid="screen-tag-input"
                />
                <Button type="button" variant="outline" onClick={addTag} size="sm">+</Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {form.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {tag}
                    <button type="button" onClick={() => setForm({...form, tags: form.tags.filter(t => t !== tag)})} className="hover:text-red-500">&times;</button>
                  </span>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
              <Button type="submit" disabled={loading} data-testid="submit-screen-btn">
                {loading ? 'Creation...' : 'Creer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
