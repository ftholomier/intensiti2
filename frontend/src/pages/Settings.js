import { useEffect, useState } from 'react';
import API, { getMediaUrl } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Upload, Save, Palette, Code, Type, CloudSun, Moon } from 'lucide-react';
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

const TRANSITIONS = [
  { value: 'fade', label: 'Fondu' },
  { value: 'slide', label: 'Glissement' },
  { value: 'random', label: 'Aleatoire' },
  { value: 'none', label: 'Sans transition' },
];

export default function SettingsPage() {
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    API.get('/settings').then(r => {
      const defaults = {
        time_font_size: 32, date_font_size: 22, weather_font_size: 32, footer_font_size: 22,
        header_height: 100, footer_height: 50, block_padding_v: 4, block_padding_h: 14,
        wysiwyg_size_small: 25, wysiwyg_size_normal: 40, wysiwyg_size_medium: 60,
        wysiwyg_size_large: 75, wysiwyg_size_xlarge: 90, wysiwyg_size_huge: 130,
        ticker_speed: 30,
      };
      setS({ ...defaults, ...r.data });
    }).catch(() => {});
  }, []);

  const up = (field, val) => setS(prev => ({ ...prev, [field]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      if (logoFile) {
        const fd = new FormData(); fd.append('file', logoFile);
        const lr = await API.post('/settings/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        s.logo_url = lr.data.logo_url;
      }
      const { client_id, theme_css, selected_theme_id, selected_animation_id, ...data } = s;
      await API.put('/settings', data);
      toast.success('Parametres sauvegardes');
    } catch (err) { toast.error(err.response?.data?.detail || 'Erreur'); }
    finally { setSaving(false); }
  };

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

        {/* Weather city */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CloudSun className="h-4 w-4 text-sky-500" /> Meteo</CardTitle></CardHeader>
          <CardContent>
            <div className="max-w-xs space-y-1.5">
              <Label className="text-xs">Ville pour la meteo</Label>
              <Input
                value={s.weather_city || ''}
                onChange={e => up('weather_city', e.target.value)}
                placeholder="Paris"
                data-testid="weather-city-input"
              />
              <p className="text-[10px] text-slate-400">Nom de la ville affichee dans le widget meteo sur vos ecrans</p>
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
                <Label className="text-xs">Transition par defaut</Label>
                <Select value={s.default_transition || 'fade'} onValueChange={v => up('default_transition', v)}>
                  <SelectTrigger className="mt-1" data-testid="default-transition-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSITIONS.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-slate-400">Applique a toutes les diapos sans transition specifique</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Eco mode */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Moon className="h-4 w-4 text-indigo-500" /> Mode eco</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Activer le mode eco</p>
                  <p className="text-[11px] text-slate-400">L'ecran passe en noir pendant la plage horaire definie</p>
                </div>
                <Switch
                  checked={s.eco_mode_enabled || false}
                  onCheckedChange={v => {
                    up('eco_mode_enabled', v);
                    if (v && !s.eco_mode_start) up('eco_mode_start', '22:00');
                    if (v && !s.eco_mode_end) up('eco_mode_end', '07:00');
                  }}
                  data-testid="eco-mode-switch"
                />
              </div>
              {s.eco_mode_enabled && (
                <div className="flex items-center gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Debut (extinction)</Label>
                    <Input
                      type="time"
                      value={s.eco_mode_start || '22:00'}
                      onChange={e => up('eco_mode_start', e.target.value)}
                      data-testid="eco-mode-start"
                      className="w-32"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Fin (rallumage)</Label>
                    <Input
                      type="time"
                      value={s.eco_mode_end || '07:00'}
                      onChange={e => up('eco_mode_end', e.target.value)}
                      data-testid="eco-mode-end"
                      className="w-32"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* WYSIWYG Font Sizes */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Type className="h-4 w-4 text-primary" /> Tailles des textes WYSIWYG</CardTitle></CardHeader>
          <CardContent>
            <p className="text-[11px] text-slate-400 mb-4">Definissez la taille en pixels de chaque niveau de texte disponible dans l'editeur WYSIWYG. Ces valeurs sont appliquees sur les ecrans.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <NumField label="Petit" value={s.wysiwyg_size_small} onChange={v => up('wysiwyg_size_small', v)} unit="px" min={8} max={40} />
              <NumField label="Normal" value={s.wysiwyg_size_normal} onChange={v => up('wysiwyg_size_normal', v)} unit="px" min={10} max={60} />
              <NumField label="Moyen" value={s.wysiwyg_size_medium} onChange={v => up('wysiwyg_size_medium', v)} unit="px" min={12} max={80} />
              <NumField label="Grand" value={s.wysiwyg_size_large} onChange={v => up('wysiwyg_size_large', v)} unit="px" min={16} max={120} />
              <NumField label="Tres grand" value={s.wysiwyg_size_xlarge} onChange={v => up('wysiwyg_size_xlarge', v)} unit="px" min={20} max={160} />
              <NumField label="Enorme" value={s.wysiwyg_size_huge} onChange={v => up('wysiwyg_size_huge', v)} unit="px" min={24} max={200} />
            </div>
          </CardContent>
        </Card>

        {/* Custom CSS */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Code className="h-4 w-4 text-emerald-500" /> CSS personnalise</CardTitle></CardHeader>
          <CardContent>
            <p className="text-[11px] text-slate-400 mb-3">Collez ici du CSS personnalise qui sera injecte dans la page d'affichage. Ce CSS ecrase les styles par defaut.</p>
            <textarea
              value={s.custom_css || ''}
              onChange={e => up('custom_css', e.target.value)}
              placeholder={`/* Exemple */\n.display-text-content {\n  font-family: 'Georgia', serif;\n  letter-spacing: 0.02em;\n}`}
              className="w-full h-48 p-4 font-mono text-xs bg-slate-900 text-emerald-400 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
              data-testid="custom-css-textarea"
              spellCheck={false}
            />
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
              <div className="flex items-center px-4 overflow-hidden" style={{ backgroundColor: s.footer_bg || '#0F172A', color: s.text_color, height: `${Math.min(s.footer_height || 44, 60)}px` }}>
                <p className="text-xs whitespace-nowrap text-white/50">Texte defilant...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
