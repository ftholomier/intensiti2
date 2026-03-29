import { useEffect, useState } from 'react';
import API from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Plus, Trash2, ArrowUp, ArrowDown, Rss, Type, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function TickerPage() {
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newFooterText, setNewFooterText] = useState('');
  const [newRssUrl, setNewRssUrl] = useState('');
  const [newRssName, setNewRssName] = useState('');

  useEffect(() => { API.get('/settings').then(r => setS(r.data)).catch(() => {}); }, []);

  const up = (field, val) => setS({ ...s, [field]: val });

  const handleSave = async () => {
    setSaving(true);
    try {
      const { client_id, ...data } = s;
      await API.put('/settings', data);
      toast.success('Bandeau defilant sauvegarde');
    } catch (err) { toast.error(err.response?.data?.detail || 'Erreur'); }
    finally { setSaving(false); }
  };

  // Footer items
  const footerItems = s?.footer_items || [];
  const addFooterItem = () => {
    if (!newFooterText.trim()) return;
    up('footer_items', [...footerItems, { id: Date.now().toString(36) + Math.random().toString(36).slice(2), text: newFooterText.trim(), is_active: true, order: footerItems.length }]);
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

  // RSS items
  const rssItems = s?.rss_items || [];
  const addRssItem = () => {
    if (!newRssUrl.trim()) return;
    up('rss_items', [...rssItems, { id: Date.now().toString(36) + Math.random().toString(36).slice(2), url: newRssUrl.trim(), name: newRssName.trim() || newRssUrl.trim(), is_active: true, order: rssItems.length }]);
    setNewRssUrl(''); setNewRssName('');
  };
  const removeRssItem = (id) => up('rss_items', rssItems.filter(i => i.id !== id).map((i, idx) => ({ ...i, order: idx })));
  const toggleRssItem = (id) => up('rss_items', rssItems.map(i => i.id === id ? { ...i, is_active: !i.is_active } : i));

  if (!s) return <div className="flex items-center justify-center h-64 text-slate-400">Chargement...</div>;

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="ticker-title">Bandeau defilant</h1>
          <p className="text-slate-500 mt-1">Gerez les textes et flux RSS qui defilent en bas de vos ecrans</p>
        </div>
        <Button onClick={handleSave} disabled={saving} data-testid="save-ticker-btn">
          <Save className="h-4 w-4 mr-2" /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Speed */}
        <Card>
          <CardHeader><CardTitle className="text-base">Vitesse de defilement</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 max-w-md">
              <span className="text-xs text-slate-400 w-12">Rapide</span>
              <input type="range" min="10" max="300" value={s.ticker_speed || 30}
                onChange={e => up('ticker_speed', parseInt(e.target.value))}
                className="flex-1 h-2 accent-primary cursor-pointer" data-testid="ticker-speed-slider" />
              <span className="text-xs text-slate-400 w-12 text-right">Lent</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">{s.ticker_speed || 30}s par cycle complet</p>
          </CardContent>
        </Card>

        {/* Footer text items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Type className="h-4 w-4 text-primary" /> Textes</CardTitle>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-slate-500">Afficher les textes</Label>
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
                  <div key={item.id} className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all ${item.is_active ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
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
              <CardTitle className="text-base flex items-center gap-2"><Rss className="h-4 w-4 text-orange-500" /> Flux RSS</CardTitle>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-slate-500">Afficher les RSS</Label>
                <Switch checked={s.ticker_rss_enabled !== false} onCheckedChange={v => up('ticker_rss_enabled', v)} data-testid="ticker-rss-toggle" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-[11px] text-slate-400">Les titres des flux RSS actifs seront ajoutes au bandeau defilant.</p>
            <div className="flex gap-2">
              <Input value={newRssName} onChange={e => setNewRssName(e.target.value)} placeholder="Nom (ex: Le Monde)"
                className="w-40" data-testid="rss-name-input" />
              <Input value={newRssUrl} onChange={e => setNewRssUrl(e.target.value)} placeholder="https://example.com/rss.xml"
                onKeyDown={e => e.key === 'Enter' && addRssItem()} data-testid="rss-url-input" className="flex-1" />
              <Button size="sm" onClick={addRssItem} data-testid="add-rss-item-btn"><Plus className="h-4 w-4" /></Button>
            </div>
            {rssItems.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Aucun flux RSS.</p>
            ) : (
              <div className="space-y-1.5">
                {rssItems.map(item => (
                  <div key={item.id} className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all ${item.is_active ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
                    <Rss className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                    <span className="text-xs font-medium w-28 truncate shrink-0">{item.name}</span>
                    <span className="text-xs text-slate-400 truncate flex-1">{item.url}</span>
                    <Switch checked={item.is_active} onCheckedChange={() => toggleRssItem(item.id)} />
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-300 hover:text-red-600" onClick={() => removeRssItem(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {s.footer_rss_url && (
              <div className="pt-3 border-t border-dashed">
                <Label className="text-xs text-slate-400">URL RSS heritee</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={s.footer_rss_url || ''} onChange={e => up('footer_rss_url', e.target.value)} className="flex-1 text-xs" />
                  <Button variant="outline" size="sm" onClick={() => {
                    if (s.footer_rss_url) {
                      up('rss_items', [...rssItems, { id: Date.now().toString(36) + Math.random().toString(36).slice(2), url: s.footer_rss_url, name: 'RSS migre', is_active: true, order: rssItems.length }]);
                      up('footer_rss_url', '');
                    }
                  }}>Migrer</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
