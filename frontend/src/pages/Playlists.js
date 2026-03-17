import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Plus, ListVideo, Edit, Trash2, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function Playlists() {
  const [playlists, setPlaylists] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadPlaylists = () => API.get('/playlists').then(r => setPlaylists(r.data)).catch(() => {});
  useEffect(() => { loadPlaylists(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/playlists', { name });
      toast.success('Playlist creee');
      setShowCreate(false);
      setName('');
      navigate(`/playlists/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette playlist ?')) return;
    try {
      await API.delete(`/playlists/${id}`);
      toast.success('Playlist supprimee');
      loadPlaylists();
    } catch {
      toast.error('Erreur');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="playlists-title">Playlists</h1>
          <p className="text-slate-500 mt-1">{playlists.length} playlist(s)</p>
        </div>
        <Button onClick={() => setShowCreate(true)} data-testid="create-playlist-btn">
          <Plus className="h-4 w-4 mr-2" /> Nouvelle playlist
        </Button>
      </div>

      {playlists.length === 0 ? (
        <Card className="p-12 text-center">
          <ListVideo className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Aucune playlist</p>
          <p className="text-sm text-slate-400 mt-1">Creez votre premiere playlist</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {playlists.map(pl => (
            <Card key={pl.id} className="hover:shadow-md transition-shadow duration-200 group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ListVideo className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{pl.name}</h3>
                      <p className="text-xs text-slate-400">{pl.slides?.length || 0} diapo(s)</p>
                    </div>
                  </div>
                  <Badge variant={pl.is_active ? 'default' : 'secondary'}>
                    {pl.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {/* Slide preview strip */}
                <div className="flex gap-1 mb-4 h-12 overflow-hidden rounded-md bg-slate-50 p-1">
                  {(pl.slides || []).slice(0, 6).map((_, i) => (
                    <div key={i} className="h-full aspect-video bg-slate-200 rounded-sm shrink-0" />
                  ))}
                  {(!pl.slides || pl.slides.length === 0) && (
                    <div className="flex items-center justify-center w-full text-xs text-slate-400">
                      Aucune diapo
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/playlists/${pl.id}`)}
                    data-testid={`edit-playlist-${pl.id}`}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" /> Editer
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(pl.id)}
                    data-testid={`delete-playlist-${pl.id}`}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
            <DialogTitle>Nouvelle playlist</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de la playlist</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Accueil visiteurs"
                data-testid="playlist-name-input"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
              <Button type="submit" disabled={loading} data-testid="submit-playlist-btn">
                {loading ? 'Creation...' : 'Creer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
