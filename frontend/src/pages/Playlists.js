import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import { Plus, ListVideo, Edit, Trash2, Copy, CalendarIcon, Clock, X, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DAYS = [
  { value: 0, label: 'Lun' },
  { value: 1, label: 'Mar' },
  { value: 2, label: 'Mer' },
  { value: 3, label: 'Jeu' },
  { value: 4, label: 'Ven' },
  { value: 5, label: 'Sam' },
  { value: 6, label: 'Dim' },
];
const MONTHS = [
  { value: 1, label: 'Jan' }, { value: 2, label: 'Fev' }, { value: 3, label: 'Mar' },
  { value: 4, label: 'Avr' }, { value: 5, label: 'Mai' }, { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' }, { value: 8, label: 'Aou' }, { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dec' },
];

export default function Playlists() {
  const [playlists, setPlaylists] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showSchedule, setShowSchedule] = useState(null);
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

  const handleDuplicate = async (id) => {
    try {
      await API.post(`/playlists/${id}/duplicate`);
      toast.success('Playlist dupliquee');
      loadPlaylists();
    } catch {
      toast.error('Erreur lors de la duplication');
    }
  };

  const [showRename, setShowRename] = useState(null);
  const [renameName, setRenameName] = useState('');

  const handleRename = async () => {
    if (!showRename || !renameName.trim()) return;
    try {
      await API.put(`/playlists/${showRename.id}`, { name: renameName.trim() });
      toast.success('Playlist renommee');
      setShowRename(null);
      loadPlaylists();
    } catch { toast.error('Erreur'); }
  };

  const saveSchedule = async () => {
    if (!showSchedule) return;
    try {
      await API.put(`/playlists/${showSchedule.id}`, {
        schedule_start: showSchedule.schedule_start || null,
        schedule_end: showSchedule.schedule_end || null,
        schedule_days: showSchedule.schedule_days || [],
        schedule_months: showSchedule.schedule_months || [],
      });
      toast.success('Programmation enregistree');
      setShowSchedule(null);
      loadPlaylists();
    } catch {
      toast.error('Erreur');
    }
  };

  const toggleDay = (day) => {
    const days = showSchedule.schedule_days || [];
    const newDays = days.includes(day) ? days.filter(d => d !== day) : [...days, day];
    setShowSchedule({ ...showSchedule, schedule_days: newDays });
  };

  const toggleMonth = (month) => {
    const months = showSchedule.schedule_months || [];
    const newMonths = months.includes(month) ? months.filter(m => m !== month) : [...months, month];
    setShowSchedule({ ...showSchedule, schedule_months: newMonths });
  };

  const hasSchedule = (pl) => (pl.schedule_days?.length > 0) || (pl.schedule_months?.length > 0) || pl.schedule_start || pl.schedule_end;

  const getScheduleLabel = (pl) => {
    const parts = [];
    if (pl.schedule_days?.length > 0) {
      parts.push(pl.schedule_days.map(d => DAYS.find(x => x.value === d)?.label).filter(Boolean).join(', '));
    }
    if (pl.schedule_months?.length > 0) {
      parts.push(pl.schedule_months.map(m => MONTHS.find(x => x.value === m)?.label).filter(Boolean).join(', '));
    }
    if (pl.schedule_start) {
      try { parts.push('Du ' + format(new Date(pl.schedule_start), 'dd/MM/yy', { locale: fr })); } catch {}
    }
    if (pl.schedule_end) {
      try { parts.push('Au ' + format(new Date(pl.schedule_end), 'dd/MM/yy', { locale: fr })); } catch {}
    }
    return parts.join(' | ');
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
                      <h3 className="font-semibold text-sm flex items-center gap-1.5">
                        {pl.name}
                        <button onClick={() => { setShowRename(pl); setRenameName(pl.name); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600"
                          data-testid={`rename-playlist-${pl.id}`}>
                          <Pencil className="h-3 w-3" />
                        </button>
                      </h3>
                      <p className="text-xs text-slate-400">{pl.slides?.length || 0} diapo(s)</p>
                    </div>
                  </div>
                  <Badge variant={pl.is_active ? 'default' : 'secondary'}>
                    {pl.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {/* Schedule badge */}
                {hasSchedule(pl) && (
                  <div className="mb-3">
                    <Badge className="text-[10px] bg-amber-50 text-amber-700 hover:bg-amber-50 border border-amber-200">
                      <CalendarIcon className="h-2.5 w-2.5 mr-1" /> {getScheduleLabel(pl)}
                    </Badge>
                  </div>
                )}

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
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/playlists/${pl.id}`)} data-testid={`edit-playlist-${pl.id}`}>
                      <Edit className="h-3.5 w-3.5 mr-1.5" /> Editer
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowSchedule(pl)} data-testid={`schedule-playlist-${pl.id}`} title="Programmer">
                      <CalendarIcon className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDuplicate(pl.id)} data-testid={`duplicate-playlist-${pl.id}`} title="Dupliquer">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(pl.id)} data-testid={`delete-playlist-${pl.id}`}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create playlist dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle playlist</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de la playlist</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Accueil visiteurs" data-testid="playlist-name-input" required />
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

      {/* Schedule playlist dialog */}
      <Dialog open={!!showSchedule} onOpenChange={() => setShowSchedule(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Programmer la playlist</DialogTitle>
          </DialogHeader>
          {showSchedule && (
            <div className="space-y-5">
              <p className="text-sm text-slate-500">Definissez quand <strong>{showSchedule.name}</strong> doit etre diffusee. La playlist programmee remplace la playlist par defaut de l'ecran.</p>

              {/* Date range */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Periode de diffusion</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Date de debut</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-start text-xs font-normal" data-testid="schedule-start-date">
                          <CalendarIcon className="h-3.5 w-3.5 mr-2 text-slate-400" />
                          {showSchedule.schedule_start ? format(new Date(showSchedule.schedule_start), 'dd MMM yyyy', { locale: fr }) : 'Aucune'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={showSchedule.schedule_start ? new Date(showSchedule.schedule_start) : null}
                          onSelect={d => setShowSchedule({ ...showSchedule, schedule_start: d ? d.toISOString() : null })} locale={fr} />
                      </PopoverContent>
                    </Popover>
                    {showSchedule.schedule_start && (
                      <Button variant="ghost" size="sm" className="text-xs text-slate-400 h-6 px-1" onClick={() => setShowSchedule({ ...showSchedule, schedule_start: null })}>
                        <X className="h-3 w-3 mr-1" /> Effacer
                      </Button>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Date de fin</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-start text-xs font-normal" data-testid="schedule-end-date">
                          <CalendarIcon className="h-3.5 w-3.5 mr-2 text-slate-400" />
                          {showSchedule.schedule_end ? format(new Date(showSchedule.schedule_end), 'dd MMM yyyy', { locale: fr }) : 'Aucune'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={showSchedule.schedule_end ? new Date(showSchedule.schedule_end) : null}
                          onSelect={d => setShowSchedule({ ...showSchedule, schedule_end: d ? d.toISOString() : null })} locale={fr} />
                      </PopoverContent>
                    </Popover>
                    {showSchedule.schedule_end && (
                      <Button variant="ghost" size="sm" className="text-xs text-slate-400 h-6 px-1" onClick={() => setShowSchedule({ ...showSchedule, schedule_end: null })}>
                        <X className="h-3 w-3 mr-1" /> Effacer
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Days of week */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Jours de la semaine</Label>
                <p className="text-[11px] text-slate-400">Selectionnez les jours ou cette playlist sera diffusee.</p>
                <div className="flex gap-1.5">
                  {DAYS.map(d => (
                    <button key={d.value} onClick={() => toggleDay(d.value)}
                      className={`h-9 w-11 rounded-lg text-xs font-medium transition-all border ${
                        (showSchedule.schedule_days || []).includes(d.value)
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-primary/50'
                      }`}
                      data-testid={`schedule-day-${d.value}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Months */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Mois</Label>
                <p className="text-[11px] text-slate-400">Selectionnez les mois ou cette playlist sera diffusee.</p>
                <div className="grid grid-cols-6 gap-1.5">
                  {MONTHS.map(m => (
                    <button key={m.value} onClick={() => toggleMonth(m.value)}
                      className={`h-8 rounded-lg text-xs font-medium transition-all border ${
                        (showSchedule.schedule_months || []).includes(m.value)
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-primary/50'
                      }`}
                      data-testid={`schedule-month-${m.value}`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              {hasSchedule(showSchedule) && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-800 font-medium">Programmation active:</p>
                  <p className="text-xs text-amber-600 mt-1">{getScheduleLabel(showSchedule)}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSchedule(null)}>Annuler</Button>
            <Button onClick={saveSchedule} data-testid="save-schedule-btn">Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename playlist dialog */}
      <Dialog open={!!showRename} onOpenChange={() => setShowRename(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Renommer la playlist</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Nouveau nom</Label>
            <Input value={renameName} onChange={e => setRenameName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRename()}
              data-testid="rename-playlist-input" autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRename(null)}>Annuler</Button>
            <Button onClick={handleRename} data-testid="confirm-rename-btn">Renommer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
