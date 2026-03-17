import { useEffect, useState, useRef } from 'react';
import API, { getMediaUrl } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Upload, Trash2, Image, Film, Youtube, FileText, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const typeIcons = { image: Image, video: Film, youtube: Youtube, pdf: FileText, other: FileText };

export default function MediaLibrary() {
  const [media, setMedia] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showYoutube, setShowYoutube] = useState(false);
  const [ytForm, setYtForm] = useState({ name: '', url: '' });
  const fileRef = useRef(null);

  const loadMedia = () => API.get('/media').then(r => setMedia(r.data)).catch(() => {});
  useEffect(() => { loadMedia(); }, []);

  const handleUpload = async (files) => {
    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        await API.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      toast.success(`${files.length} fichier(s) importe(s)`);
      loadMedia();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur d\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce media ?')) return;
    try {
      await API.delete(`/media/${id}`);
      toast.success('Media supprime');
      loadMedia();
    } catch {
      toast.error('Erreur');
    }
  };

  const addYoutube = async (e) => {
    e.preventDefault();
    try {
      await API.post('/media/youtube', ytForm);
      toast.success('Video YouTube ajoutee');
      setShowYoutube(false);
      setYtForm({ name: '', url: '' });
      loadMedia();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleUpload(files);
  };

  const filtered = media
    .filter(m => filter === 'all' || m.type === filter)
    .filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="media-title">Mediatheque</h1>
          <p className="text-slate-500 mt-1">{media.length} fichier(s)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowYoutube(true)} data-testid="add-youtube-btn">
            <Youtube className="h-4 w-4 mr-2" /> YouTube
          </Button>
          <Button onClick={() => fileRef.current?.click()} data-testid="upload-media-btn">
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Import...' : 'Importer'}
          </Button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,video/*,application/pdf"
            className="hidden"
            onChange={e => handleUpload(Array.from(e.target.files))}
          />
        </div>
      </div>

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center mb-6 hover:border-primary/40 transition-colors cursor-pointer"
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        data-testid="media-dropzone"
      >
        <Upload className="h-8 w-8 mx-auto text-slate-300 mb-2" />
        <p className="text-sm text-slate-500">Glissez vos fichiers ici ou cliquez pour importer</p>
        <p className="text-xs text-slate-400 mt-1">Images, videos, PDF</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            className="pl-10"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid="media-search"
          />
        </div>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all" data-testid="filter-all">Tous</TabsTrigger>
            <TabsTrigger value="image" data-testid="filter-image">Images</TabsTrigger>
            <TabsTrigger value="video" data-testid="filter-video">Videos</TabsTrigger>
            <TabsTrigger value="youtube" data-testid="filter-youtube">YouTube</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Media Grid */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Image className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Aucun media</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(item => {
            const Icon = typeIcons[item.type] || FileText;
            return (
              <Card key={item.id} className="group overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-video bg-slate-100 relative flex items-center justify-center overflow-hidden">
                  {item.type === 'image' ? (
                    <img src={getMediaUrl(item.url)} alt={item.name} className="w-full h-full object-cover" />
                  ) : item.type === 'youtube' ? (
                    <div className="flex flex-col items-center gap-2">
                      <Youtube className="h-8 w-8 text-red-500" />
                      <span className="text-xs text-slate-500">YouTube</span>
                    </div>
                  ) : (
                    <Icon className="h-10 w-10 text-slate-400" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(item.id)}
                      data-testid={`delete-media-${item.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-xs font-medium truncate">{item.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <Badge variant="secondary" className="text-[10px]">{item.type}</Badge>
                    {item.size > 0 && <span className="text-[10px] text-slate-400">{formatSize(item.size)}</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* YouTube Dialog */}
      <Dialog open={showYoutube} onOpenChange={setShowYoutube}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une video YouTube</DialogTitle>
          </DialogHeader>
          <form onSubmit={addYoutube} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input
                value={ytForm.name}
                onChange={e => setYtForm({...ytForm, name: e.target.value})}
                placeholder="Nom de la video"
                data-testid="youtube-name-input"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>URL YouTube</Label>
              <Input
                value={ytForm.url}
                onChange={e => setYtForm({...ytForm, url: e.target.value})}
                placeholder="https://www.youtube.com/watch?v=..."
                data-testid="youtube-url-input"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowYoutube(false)}>Annuler</Button>
              <Button type="submit" data-testid="submit-youtube-btn">Ajouter</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
