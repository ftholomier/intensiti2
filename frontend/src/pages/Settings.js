import { useEffect, useState } from 'react';
import API, { getMediaUrl } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Upload, Save, Palette } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    API.get('/settings').then(r => setSettings(r.data)).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upload logo if changed
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        const logoRes = await API.post('/settings/logo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        settings.logo_url = logoRes.data.logo_url;
      }
      // Save other settings
      const { client_id, ...settingsData } = settings;
      await API.put('/settings', settingsData);
      toast.success('Parametres sauvegardes');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <div className="p-8 text-center text-slate-400">Chargement...</div>;

  const ColorInput = ({ label, field }) => (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={settings[field] || '#000000'}
          onChange={e => setSettings({ ...settings, [field]: e.target.value })}
          className="h-10 w-12 rounded-md border border-slate-200 cursor-pointer"
          data-testid={`color-${field}`}
        />
        <Input
          value={settings[field] || ''}
          onChange={e => setSettings({ ...settings, [field]: e.target.value })}
          className="font-mono text-sm"
          placeholder="#000000"
        />
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="settings-title">Parametres</h1>
          <p className="text-slate-500 mt-1">Personnalisez l'affichage de vos ecrans</p>
        </div>
        <Button onClick={handleSave} disabled={saving} data-testid="save-settings-btn">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Logo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                {settings.logo_url ? (
                  <img src={getMediaUrl(settings.logo_url)} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Palette className="h-8 w-8 text-slate-300" />
                )}
              </div>
              <div>
                <Button variant="outline" asChild>
                  <label className="cursor-pointer" data-testid="upload-logo-btn">
                    <Upload className="h-4 w-4 mr-2" />
                    {logoFile ? logoFile.name : 'Changer le logo'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => setLogoFile(e.target.files[0])}
                    />
                  </label>
                </Button>
                <p className="text-xs text-slate-400 mt-2">PNG, SVG ou JPG recommande</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Charte graphique</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ColorInput label="Couleur primaire" field="primary_color" />
              <ColorInput label="Couleur secondaire" field="secondary_color" />
              <ColorInput label="Fond bandeau superieur" field="header_bg" />
              <ColorInput label="Fond bandeau inferieur" field="footer_bg" />
              <ColorInput label="Couleur du texte" field="text_color" />
            </div>
          </CardContent>
        </Card>

        {/* Footer Text */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bandeau defilant (Footer)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Texte defilant</Label>
              <Input
                value={settings.footer_text || ''}
                onChange={e => setSettings({ ...settings, footer_text: e.target.value })}
                placeholder="Texte qui defilera en bas de l'ecran"
                data-testid="footer-text-input"
              />
            </div>
            <div className="space-y-2">
              <Label>URL du flux RSS (optionnel)</Label>
              <Input
                value={settings.footer_rss_url || ''}
                onChange={e => setSettings({ ...settings, footer_rss_url: e.target.value })}
                placeholder="https://example.com/rss"
                data-testid="footer-rss-input"
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Apercu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg overflow-hidden border border-slate-200 aspect-video relative">
              {/* Header preview */}
              <div
                className="h-[15%] flex items-center px-4 justify-between"
                style={{ backgroundColor: settings.header_bg, color: settings.text_color }}
              >
                <div className="flex items-center gap-2">
                  {settings.logo_url ? (
                    <img src={getMediaUrl(settings.logo_url)} alt="" className="h-6 object-contain" />
                  ) : (
                    <div className="h-6 w-16 bg-white/20 rounded" />
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: settings.text_color }}>
                  <span>12:00</span>
                  <span>Lun. 15 Jan</span>
                  <span>18C Paris</span>
                </div>
              </div>

              {/* Main zone preview */}
              <div className="h-[75%] bg-slate-900 flex items-center justify-center">
                <p className="text-white/40 text-sm">Zone de diffusion</p>
              </div>

              {/* Footer preview */}
              <div
                className="h-[10%] flex items-center px-4 overflow-hidden"
                style={{ backgroundColor: settings.footer_bg, color: settings.text_color }}
              >
                <p className="text-xs whitespace-nowrap animate-marquee">
                  {settings.footer_text || 'Texte defilant...'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
