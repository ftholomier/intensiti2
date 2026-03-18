import { useEffect, useState } from 'react';
import API, { getMediaUrl } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Upload, Save, Palette, Plus, Trash2, ArrowUp, ArrowDown, Rss } from 'lucide-react';
import { toast } from 'sonner';

const ColorField = ({ label, value, onChange }) => (
  <div className="space-y-1.5">
    <Label className="text-xs">{label}</Label>
    <div className="flex items-center gap-2">
      <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)}
        className="h-9 w-11 rounded-md border border-slate-200 cursor-pointer shrink-0" />
      <Input value={value || ''} onChange={e => onChange(e.target.value)} className="font-mono text-xs" placeholder="#000000" />
    </div>
  </div>
);

const NumField = ({ label, value, onChange, unit, min, max }) => (
  <div className="space-y-1.5">
    <Label className="text-xs">{label}</Label>
    <div className="flex items-center gap-1.5">
      <Input type="number" value={value ?? ''} onChange={e => onChange(parseInt(e.target.value) || 0)}
        min={min} max={max} className="text-xs" />
      {unit && <span className="text-[10px] text-slate-400 shrink-0">{unit}</span>}
    </div>
  </div>
);

export default function SettingsPage() {
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [newFooterText, setNewFooterText] = useState('');
  const [newRssUrl, setNewRssUrl] = useState('');
  const [newRssName, setNewRssName] = useState('');

  useEffect(() => { API.get('/settings').then(r => setS(r.data)).catch(() => {}); }, []);

  const up = (field, val) => setS({ ...s, [field]: val });

  const handleSave = async () => {
    setSaving(true);
    try {
      if (logoFile) {
        const fd = new FormData(); fd.append('file', logoFile);
        const lr = await API.post('/settings/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        s.logo_url = lr.data.logo_url;
      }
      const { client_id, ...data } = s;
      await API.put('/settings', data);
      toast.success('Parametres sauvegardes');
    } catch (err) { toast.error(err.response?.data?.detail || 'Erreur'); }
    finally { setSaving(false); }
  };

  // Footer items helpers
  const footerItems = s?.footer_items || [];
  const addFooterItem = () => {
    if (!newFooterText.trim()) return;
    const items = [...footerItems, { id: crypto.randomUUID(), text: newFooterText.trim(), is_active: true, order: footerItems.length }];
    up('footer_items', items);
    setNewFooterText('');
  };
  const removeFooterItem = (id) => up('footer_items', footerItems.filter(i => i.id !== id).map((i, idx) => ({ ...i, order: idx })));
  const toggleFooterItem = (id) => up('footer_items', footerItems.map(i => i.id === id ? { ...i, is_active: !i.is_active } : i));
  const updateFooterItemText = (id, text) => up('footer_items', footerItems.map(i => i.id === id ? { ...i, text } : i));
  const moveFooterItem = (idx, dir) => {
    const ni = idx + dir;
    if (ni < 0 || ni >= footerItems.length) return;
    const items = [...footerItems];
    [items[idx], items[ni]] = [items[ni], items[idx]];
    up('footer_items', items.map((i, x) => ({ ...i, order: x })));
  };

  // RSS items helpers
  const rssItems = s?.rss_items || [];
  const addRssItem = () => {
    if (!newRssUrl.trim()) return;
    const items = [...rssItems, { id: crypto.randomUUID(), url: newRssUrl.trim(), name: newRssName.trim() || newRssUrl.trim(), is_active: true, order: rssItems.length }];
    up('rss_items', items);
    setNewRssUrl('');
    setNewRssName('');
  };
  const removeRssItem = (id) => up('rss_items', rssItems.filter(i => i.id !== id).map((i, idx) => ({ ...i, order: idx })));
  const toggleRssItem = (id) => up('rss_items', rssItems.map(i => i.id === id ? { ...i, is_active: !i.is_active } : i));

  if (!s) return <div className="flex items-center justify-center h-64 text-slate-400">Chargement...</div>;

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="settings-title">Parametres</h1>
          <p className="text-slate-500 mt-1">Personnalisez l'affichage de vos ecrans</p>
        </div>
        <Button onClick={handleSave} disabled={saving} data-testid="save-settings-btn">
          <Save className="h-4 w-4 mr-2" /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Logo */}
        <Card>
          <CardHeader><CardTitle className="text-base">Logo</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-xl bg-slate-100 border flex items-center justify-center overflow-hidden">
                {s.logo_url ? <img src={getMediaUrl(s.logo_url)} alt="" className="w-full h-full object-contain" /> : <Palette className="h-6 w-6 text-slate-300" />}
              </div>
              <div>
                <Button variant="outline" size="sm" asChild>
                  <label className="cursor-pointer" data-testid="upload-logo-btn">
                    <Upload className="h-4 w-4 mr-2" /> {logoFile ? logoFile.name : 'Changer le logo'}
                    <input type="file" accept="image/*" className="hidden" onChange={e => setLogoFile(e.target.files[0])} />
                  </label>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Colors */}
        <Card>
          <CardHeader><CardTitle className="text-base">Couleurs</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <ColorField label="Fond bandeau haut" value={s.header_bg} onChange={v => up('header_bg', v)} />
              <ColorField label="Fond bandeau bas" value={s.footer_bg} onChange={v => up('footer_bg', v)} />
              <ColorField label="Texte general" value={s.text_color} onChange={v => up('text_color', v)} />
              <ColorField label="Fond zone centrale" value={s.content_bg} onChange={v => up('content_bg', v)} />
              <ColorField label="Fond blocs info" value={s.block_bg} onChange={v => up('block_bg', v)} />
              <ColorField label="Texte blocs info" value={s.block_text_color} onChange={v => up('block_text_color', v)} />
              <ColorField label="Couleur primaire" value={s.primary_color} onChange={v => up('primary_color', v)} />
            </div>
          </CardContent>
        </Card>

        {/* Sizes */}
        <Card>
          <CardHeader><CardTitle className="text-base">Tailles et dimensions</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <NumField label="Taille police heure" value={s.time_font_size} onChange={v => up('time_font_size', v)} unit="px" min={12} max={80} />
              <NumField label="Taille police date" value={s.date_font_size} onChange={v => up('date_font_size', v)} unit="px" min={8} max={40} />
              <NumField label="Taille police meteo" value={s.weather_font_size} onChange={v => up('weather_font_size', v)} unit="px" min={10} max={50} />
              <NumField label="Taille bandeau bas" value={s.footer_font_size} onChange={v => up('footer_font_size', v)} unit="px" min={8} max={40} />
              <NumField label="Hauteur bandeau haut" value={s.header_height} onChange={v => up('header_height', v)} unit="px" min={40} max={200} />
              <NumField label="Hauteur bandeau bas" value={s.footer_height} onChange={v => up('footer_height', v)} unit="px" min={24} max={120} />
              <NumField label="Padding vertical blocs" value={s.block_padding_v} onChange={v => up('block_padding_v', v)} unit="px" min={0} max={40} />
              <NumField label="Padding horizontal blocs" value={s.block_padding_h} onChange={v => up('block_padding_h', v)} unit="px" min={0} max={60} />
            </div>
          </CardContent>
        </Card>

        {/* Diffusion settings */}
        <Card>
          <CardHeader><CardTitle className="text-base">Diffusion</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <NumField label="Duree par defaut des diapos" value={s.default_slide_duration} onChange={v => up('default_slide_duration', v)} unit="sec" min={1} max={300} />
              <div className="space-y-1.5">
                <Label className="text-xs">Vitesse du bandeau defilant</Label>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-slate-400">Rapide</span>
                  <input type="range" min="10" max="120" value={s.ticker_speed || 30}
                    onChange={e => up('ticker_speed', parseInt(e.target.value))}
                    className="flex-1 h-2 accent-primary cursor-pointer" data-testid="ticker-speed-slider" />
                  <span className="text-[10px] text-slate-400">Lent</span>
                </div>
                <p className="text-[10px] text-slate-400 text-center">{s.ticker_speed || 30}s par cycle</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Bandeau defilant (textes)</CardTitle>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-slate-500">Actif</Label>
                <Switch checked={s.ticker_text_enabled !== false} onCheckedChange={v => up('ticker_text_enabled', v)} data-testid="ticker-text-toggle" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={newFooterText} onChange={e => setNewFooterText(e.target.value)} placeholder="Ajouter un texte defilant..."
                onKeyDown={e => e.key === 'Enter' && addFooterItem()} data-testid="footer-item-input" className="flex-1" />
              <Button size="sm" onClick={addFooterItem} data-testid="add-footer-item-btn"><Plus className="h-4 w-4" /></Button>
            </div>
            {footerItems.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Aucun texte. Ajoutez-en un ci-dessus.</p>
            ) : (
              <div className="space-y-1.5">
                {footerItems.map((item, idx) => (
                  <div key={item.id} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${item.is_active ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button className="h-4 w-4 flex items-center justify-center text-slate-300 hover:text-slate-600" onClick={() => moveFooterItem(idx, -1)}><ArrowUp className="h-3 w-3" /></button>
                      <button className="h-4 w-4 flex items-center justify-center text-slate-300 hover:text-slate-600" onClick={() => moveFooterItem(idx, 1)}><ArrowDown className="h-3 w-3" /></button>
                    </div>
                    <span className="text-[10px] text-slate-300 font-mono w-4">{idx + 1}</span>
                    <Input value={item.text} onChange={e => updateFooterItemText(item.id, e.target.value)} className="flex-1 h-8 text-sm" />
                    <Switch checked={item.is_active} onCheckedChange={() => toggleFooterItem(item.id)} />
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-300 hover:text-red-600" onClick={() => removeFooterItem(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* RSS feeds */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Rss className="h-4 w-4 text-orange-500" /> Flux RSS (bandeau defilant)</CardTitle>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-slate-500">Actif</Label>
                <Switch checked={s.ticker_rss_enabled !== false} onCheckedChange={v => up('ticker_rss_enabled', v)} data-testid="ticker-rss-toggle" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-[11px] text-slate-400">Les titres de tous les flux RSS actifs seront ajoutes automatiquement au bandeau defilant.</p>
            <div className="flex gap-2">
              <Input value={newRssName} onChange={e => setNewRssName(e.target.value)} placeholder="Nom (ex: Le Monde)"
                className="w-36" data-testid="rss-name-input" />
              <Input value={newRssUrl} onChange={e => setNewRssUrl(e.target.value)} placeholder="https://example.com/rss.xml"
                onKeyDown={e => e.key === 'Enter' && addRssItem()} data-testid="rss-url-input" className="flex-1" />
              <Button size="sm" onClick={addRssItem} data-testid="add-rss-item-btn"><Plus className="h-4 w-4" /></Button>
            </div>
            {rssItems.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Aucun flux RSS. Ajoutez-en un ci-dessus.</p>
            ) : (
              <div className="space-y-1.5">
                {rssItems.map(item => (
                  <div key={item.id} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${item.is_active ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
                    <Rss className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                    <span className="text-xs font-medium w-24 truncate shrink-0">{item.name}</span>
                    <span className="text-xs text-slate-400 truncate flex-1">{item.url}</span>
                    <Switch checked={item.is_active} onCheckedChange={() => toggleRssItem(item.id)} />
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-300 hover:text-red-600" onClick={() => removeRssItem(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Legacy single RSS URL - keep for backward compat */}
            {s.footer_rss_url && (
              <div className="pt-3 border-t border-dashed">
                <Label className="text-xs text-slate-400">URL RSS heritee (migrez vers la liste ci-dessus)</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={s.footer_rss_url || ''} onChange={e => up('footer_rss_url', e.target.value)} className="flex-1 text-xs" />
                  <Button variant="outline" size="sm" onClick={() => {
                    if (s.footer_rss_url) {
                      const items = [...rssItems, { id: crypto.randomUUID(), url: s.footer_rss_url, name: 'RSS migre', is_active: true, order: rssItems.length }];
                      setS({ ...s, rss_items: items, footer_rss_url: '' });
                    }
                  }}>Migrer</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader><CardTitle className="text-base">Apercu</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-lg overflow-hidden border border-slate-200 aspect-video relative">
              <div className="flex items-center justify-between px-4" style={{ backgroundColor: s.header_bg || '#0F172A', color: s.text_color, height: `${Math.min(s.header_height || 72, 100)}px` }}>
                <div style={{ background: s.block_bg || 'rgba(255,255,255,0.06)', padding: `${s.block_padding_v || 6}px ${s.block_padding_h || 14}px`, borderRadius: '8px', color: s.block_text_color || '#fff' }}>
                  {s.logo_url ? <img src={getMediaUrl(s.logo_url)} alt="" className="h-5 object-contain" /> : <span className="text-xs font-bold">Logo</span>}
                </div>
                <div className="flex items-center gap-2">
                  {['12:00', 'Lun 15 Jan', '18C'].map((t, i) => (
                    <div key={i} style={{ background: s.block_bg || 'rgba(255,255,255,0.06)', padding: `${s.block_padding_v || 6}px ${s.block_padding_h || 14}px`, borderRadius: '8px', color: s.block_text_color || '#fff', fontSize: `${Math.min([s.time_font_size, s.date_font_size, s.weather_font_size][i] || 14, 20)}px` }}>
                      {t}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: s.content_bg || '#000', height: 'calc(100% - 100px)' }}>
                <p className="text-white/30 text-xs">Zone de diffusion</p>
              </div>
              <div className="flex items-center px-4 overflow-hidden" style={{ backgroundColor: s.footer_bg || '#0F172A', color: s.text_color, height: `${Math.min(s.footer_height || 44, 60)}px`, fontSize: `${Math.min(s.footer_font_size || 15, 18)}px` }}>
                <p className="text-xs whitespace-nowrap">{footerItems.filter(i => i.is_active).map(i => i.text).join('   •   ') || 'Texte defilant...'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
