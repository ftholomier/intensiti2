import { useEffect, useState, useCallback } from 'react';
import API, { getMediaUrl } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Upload, Trash2, Image, Film, FileText, Link, Search, Eye, X } from 'lucide-react';
import { toast } from 'sonner';

const TYPE_ICONS = { image: Image, video: Film, pdf: FileText, youtube: Link };

export default function MediaLibrary() {
  const [media, setMedia] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [ytUrl, setYtUrl] = useState('');
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState(null);

  const fetchMedia = useCallback(() => { API.get('/media').then(r => setMedia(r.data || [])); }, []);
  useEffect(fetchMedia, [fetchMedia]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData(); fd.append('file', file);
        await API.post('/media/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      toast.success(`${files.length} fichier(s) importe(s)`);
      fetchMedia();
    } catch (err) { toast.error(err.response?.data?.detail || 'Erreur upload'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const addYt = async () => {
    if (!ytUrl.trim()) return;
    try {
      await API.post('/media/youtube', { url: ytUrl.trim() });
      toast.success('YouTube ajoute');
      setYtUrl('');
      fetchMedia();
    } catch (err) { toast.error(err.response?.data?.detail || 'Erreur'); }
  };

  const deleteMedia = async (id) => {
    if (!window.confirm('Supprimer ce media ?')) return;
    try { await API.delete(`/media/${id}`); toast.success('Supprime'); fetchMedia(); }
    catch { toast.error('Erreur'); }
  };

  const filtered = media.filter(m =>
    !search || m.name?.toLowerCase().includes(search.toLowerCase()) || m.type?.includes(search.toLowerCase())
  );

  const getThumb = (m) => {
    if (m.type === 'image') return getMediaUrl(m.url);
    if (m.type === 'youtube') {
      const match = m.url?.match(/(?:v=|\/embed\/|\.be\/)([a-zA-Z0-9_-]{11})/);
      return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
    }
    return null;
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="media-title">Mediatheque</h1>
          <p className="text-slate-500 mt-1">{media.length} media(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <label className="cursor-pointer" data-testid="upload-media-btn">
              <Upload className="h-4 w-4 mr-2" /> {uploading ? 'Import...' : 'Importer'}
              <input type="file" multiple accept="image/*,video/*,.pdf" className="hidden" onChange={handleUpload} />
            </label>
          </Button>
        </div>
      </div>

      {/* YouTube add */}
      <div className="flex gap-2 mb-4 max-w-lg">
        <Input value={ytUrl} onChange={e => setYtUrl(e.target.value)} placeholder="URL YouTube a ajouter..." data-testid="youtube-url-input" onKeyDown={e => e.key === 'Enter' && addYt()} />
        <Button onClick={addYt} size="sm" variant="outline" data-testid="add-youtube-btn"><Link className="h-4 w-4 mr-1" /> YouTube</Button>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9" data-testid="media-search" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3" data-testid="media-grid">
        {filtered.map(m => {
          const Icon = TYPE_ICONS[m.type] || FileText;
          const thumb = getThumb(m);
          return (
            <Card key={m.id} className="group overflow-hidden hover:shadow-lg transition-all" data-testid={`media-${m.id}`}>
              <CardContent className="p-0">
                {/* Preview area */}
                <div
                  className="aspect-video relative bg-slate-100 cursor-pointer overflow-hidden"
                  onClick={() => setPreview(m)}
                >
                  {thumb ? (
                    <img src={thumb} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Icon className="h-8 w-8 text-slate-300" />
                    </div>
                  )}
                  {m.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Film className="h-8 w-8 text-white/80" />
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="p-2">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[11px] font-medium truncate flex-1">{m.name}</p>
                    <Badge variant="outline" className="text-[8px] px-1 py-0 shrink-0">{m.type}</Badge>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <button onClick={(e) => { e.stopPropagation(); setPreview(m); }}
                      className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                      <Eye className="h-3 w-3" /> Apercu
                    </button>
                    <button onClick={() => deleteMedia(m.id)}
                      className="text-[10px] text-red-400 hover:text-red-600 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid={`delete-media-${m.id}`}>
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Image className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{search ? 'Aucun resultat' : 'La mediatheque est vide'}</p>
        </div>
      )}

      {/* Preview dialog */}
      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="media-preview-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {preview && (() => { const I = TYPE_ICONS[preview.type] || FileText; return <I className="h-4 w-4" />; })()}
              {preview?.name}
            </DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="mt-2">
              {preview.type === 'image' && (
                <img src={getMediaUrl(preview.url)} alt="" className="w-full rounded-lg max-h-[70vh] object-contain bg-slate-100" />
              )}
              {preview.type === 'video' && (
                <video src={getMediaUrl(preview.url)} controls className="w-full rounded-lg max-h-[70vh]" />
              )}
              {preview.type === 'pdf' && (
                <iframe src={getMediaUrl(preview.url)} className="w-full rounded-lg border" style={{ height: '70vh' }} title="PDF" />
              )}
              {preview.type === 'youtube' && (() => {
                const match = preview.url?.match(/(?:v=|\/embed\/|\.be\/)([a-zA-Z0-9_-]{11})/);
                return match ? (
                  <iframe src={`https://www.youtube.com/embed/${match[1]}`} className="w-full aspect-video rounded-lg" frameBorder="0" allow="autoplay" allowFullScreen title="YT" />
                ) : <p className="text-slate-400">URL invalide</p>;
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
