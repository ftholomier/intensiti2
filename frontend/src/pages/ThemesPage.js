import { useEffect, useState } from 'react';
import API from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Check, Palette } from 'lucide-react';
import { toast } from 'sonner';

const THEMES = [
  {
    id: 'lumiere-pure',
    name: 'Lumiere Pure',
    desc: 'Fond blanc, accents bleu doux',
    preview: { header: '#F8FAFC', footer: '#F1F5F9', content: '#FFFFFF', text: '#1E293B', block: 'rgba(30,41,59,0.06)', blockText: '#334155' },
    settings: {
      header_bg: '#F8FAFC', footer_bg: '#F1F5F9', content_bg: '#FFFFFF',
      text_color: '#1E293B', block_bg: 'rgba(30,41,59,0.06)', block_text_color: '#334155',
      primary_color: '#3B82F6',
    },
    css: `/* Lumiere Pure */
.display-text-content { color: #1E293B; }
[data-testid="display-header"] > div,
[data-testid="display-footer"] > div {
  background: linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%) !important;
}
[data-testid="display-main"] {
  background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 50%, #F1F5F9 100%) !important;
}`,
  },
  {
    id: 'ciel-clair',
    name: 'Ciel Clair',
    desc: 'Bleu pastel, nuages lents',
    preview: { header: '#DBEAFE', footer: '#BFDBFE', content: '#EFF6FF', text: '#1E3A5F', block: 'rgba(30,58,95,0.08)', blockText: '#1E3A5F' },
    settings: {
      header_bg: '#DBEAFE', footer_bg: '#BFDBFE', content_bg: '#EFF6FF',
      text_color: '#1E3A5F', block_bg: 'rgba(30,58,95,0.08)', block_text_color: '#1E3A5F',
      primary_color: '#2563EB',
    },
    css: `/* Ciel Clair */
.display-text-content { color: #1E3A5F; }
[data-testid="display-main"] {
  background: linear-gradient(170deg, #EFF6FF 0%, #DBEAFE 40%, #BFDBFE 100%) !important;
  overflow: hidden;
}
[data-testid="display-main"]::before {
  content: ''; position: absolute; top: -50%; left: -50%;
  width: 200%; height: 200%;
  background: radial-gradient(ellipse at 30% 50%, rgba(147,197,253,0.3) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 30%, rgba(191,219,254,0.25) 0%, transparent 50%);
  animation: cloud-drift 60s ease-in-out infinite alternate;
  z-index: 0; pointer-events: none;
}
@keyframes cloud-drift {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(5%, 3%) scale(1.05); }
}`,
  },
  {
    id: 'nature',
    name: 'Nature',
    desc: 'Vert foret, feuillage subtil',
    preview: { header: '#14532D', footer: '#166534', content: '#052E16', text: '#D1FAE5', block: 'rgba(209,250,229,0.08)', blockText: '#D1FAE5' },
    settings: {
      header_bg: '#14532D', footer_bg: '#166534', content_bg: '#052E16',
      text_color: '#D1FAE5', block_bg: 'rgba(209,250,229,0.08)', block_text_color: '#D1FAE5',
      primary_color: '#10B981',
    },
    css: `/* Nature */
.display-text-content { color: #D1FAE5; }
[data-testid="display-main"] {
  background: linear-gradient(160deg, #052E16 0%, #14532D 50%, #064E3B 100%) !important;
  overflow: hidden;
}
[data-testid="display-main"]::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse at 20% 80%, rgba(16,185,129,0.08) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, rgba(52,211,153,0.06) 0%, transparent 50%);
  animation: nature-pulse 30s ease-in-out infinite alternate;
  z-index: 0; pointer-events: none;
}
@keyframes nature-pulse {
  0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; }
}`,
  },
  {
    id: 'sable-dore',
    name: 'Sable Dore',
    desc: 'Beige chaud, particules dorees',
    preview: { header: '#78350F', footer: '#92400E', content: '#451A03', text: '#FEF3C7', block: 'rgba(254,243,199,0.08)', blockText: '#FEF3C7' },
    settings: {
      header_bg: '#78350F', footer_bg: '#92400E', content_bg: '#451A03',
      text_color: '#FEF3C7', block_bg: 'rgba(254,243,199,0.08)', block_text_color: '#FEF3C7',
      primary_color: '#F59E0B',
    },
    css: `/* Sable Dore */
.display-text-content { color: #FEF3C7; }
[data-testid="display-main"] {
  background: linear-gradient(150deg, #451A03 0%, #78350F 50%, #92400E 100%) !important;
  overflow: hidden;
}
[data-testid="display-main"]::before {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(1.5px 1.5px at 10% 30%, rgba(251,191,36,0.4) 50%, transparent 50%),
    radial-gradient(1px 1px at 40% 70%, rgba(253,224,71,0.3) 50%, transparent 50%),
    radial-gradient(1.5px 1.5px at 70% 20%, rgba(251,191,36,0.35) 50%, transparent 50%),
    radial-gradient(1px 1px at 90% 60%, rgba(253,224,71,0.25) 50%, transparent 50%);
  animation: gold-shimmer 20s ease-in-out infinite alternate;
  z-index: 0; pointer-events: none;
}
@keyframes gold-shimmer {
  0% { opacity: 0.4; transform: translateY(0); }
  100% { opacity: 0.8; transform: translateY(-5px); }
}`,
  },
  {
    id: 'crepuscule',
    name: 'Crepuscule',
    desc: 'Violet et rose, aurore lente',
    preview: { header: '#4C1D95', footer: '#5B21B6', content: '#2E1065', text: '#EDE9FE', block: 'rgba(237,233,254,0.08)', blockText: '#EDE9FE' },
    settings: {
      header_bg: '#4C1D95', footer_bg: '#5B21B6', content_bg: '#2E1065',
      text_color: '#EDE9FE', block_bg: 'rgba(237,233,254,0.08)', block_text_color: '#EDE9FE',
      primary_color: '#8B5CF6',
    },
    css: `/* Crepuscule */
.display-text-content { color: #EDE9FE; }
[data-testid="display-main"] {
  background: linear-gradient(135deg, #2E1065 0%, #4C1D95 30%, #7C3AED 60%, #A78BFA 100%) !important;
  overflow: hidden;
}
[data-testid="display-main"]::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(45deg, rgba(139,92,246,0.15) 0%, transparent 50%, rgba(236,72,153,0.1) 100%);
  animation: aurora-shift 40s ease-in-out infinite alternate;
  z-index: 0; pointer-events: none;
}
@keyframes aurora-shift {
  0% { transform: rotate(0deg) scale(1); opacity: 0.5; }
  50% { transform: rotate(2deg) scale(1.1); opacity: 0.8; }
  100% { transform: rotate(-1deg) scale(1); opacity: 0.5; }
}`,
  },
  {
    id: 'ocean-profond',
    name: 'Ocean Profond',
    desc: 'Bleu marine, vagues douces',
    preview: { header: '#0C4A6E', footer: '#075985', content: '#082F49', text: '#E0F2FE', block: 'rgba(224,242,254,0.08)', blockText: '#E0F2FE' },
    settings: {
      header_bg: '#0C4A6E', footer_bg: '#075985', content_bg: '#082F49',
      text_color: '#E0F2FE', block_bg: 'rgba(224,242,254,0.08)', block_text_color: '#E0F2FE',
      primary_color: '#0EA5E9',
    },
    css: `/* Ocean Profond */
.display-text-content { color: #E0F2FE; }
[data-testid="display-main"] {
  background: linear-gradient(180deg, #082F49 0%, #0C4A6E 50%, #075985 100%) !important;
  overflow: hidden;
}
[data-testid="display-main"]::before {
  content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 40%;
  background: linear-gradient(0deg, rgba(14,165,233,0.08) 0%, transparent 100%);
  animation: wave-rise 25s ease-in-out infinite alternate;
  z-index: 0; pointer-events: none;
}
[data-testid="display-main"]::after {
  content: ''; position: absolute; bottom: 0; left: -10%; right: -10%; height: 30%;
  background: radial-gradient(ellipse at 50% 100%, rgba(56,189,248,0.06) 0%, transparent 70%);
  animation: wave-sway 15s ease-in-out infinite alternate;
  z-index: 0; pointer-events: none;
}
@keyframes wave-rise { 0% { height: 35%; opacity: 0.5; } 100% { height: 45%; opacity: 0.8; } }
@keyframes wave-sway { 0% { transform: translateX(-3%); } 100% { transform: translateX(3%); } }`,
  },
  {
    id: 'nuit-etoilee',
    name: 'Nuit Etoilee',
    desc: 'Bleu nuit, etoiles scintillantes',
    preview: { header: '#0F172A', footer: '#1E293B', content: '#020617', text: '#E2E8F0', block: 'rgba(226,232,240,0.06)', blockText: '#E2E8F0' },
    settings: {
      header_bg: '#0F172A', footer_bg: '#1E293B', content_bg: '#020617',
      text_color: '#E2E8F0', block_bg: 'rgba(226,232,240,0.06)', block_text_color: '#E2E8F0',
      primary_color: '#6366F1',
    },
    css: `/* Nuit Etoilee */
.display-text-content { color: #E2E8F0; }
[data-testid="display-main"] {
  background: linear-gradient(180deg, #020617 0%, #0F172A 60%, #1E293B 100%) !important;
  overflow: hidden;
}
[data-testid="display-main"]::before {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(1px 1px at 15% 25%, rgba(255,255,255,0.7) 50%, transparent 50%),
    radial-gradient(1.5px 1.5px at 45% 15%, rgba(255,255,255,0.5) 50%, transparent 50%),
    radial-gradient(1px 1px at 75% 35%, rgba(255,255,255,0.6) 50%, transparent 50%),
    radial-gradient(1px 1px at 25% 65%, rgba(255,255,255,0.4) 50%, transparent 50%),
    radial-gradient(1.5px 1.5px at 85% 75%, rgba(255,255,255,0.5) 50%, transparent 50%),
    radial-gradient(1px 1px at 55% 85%, rgba(255,255,255,0.6) 50%, transparent 50%),
    radial-gradient(1px 1px at 35% 45%, rgba(255,255,255,0.3) 50%, transparent 50%),
    radial-gradient(1.5px 1.5px at 65% 55%, rgba(255,255,255,0.4) 50%, transparent 50%);
  animation: stars-twinkle 8s ease-in-out infinite alternate;
  z-index: 0; pointer-events: none;
}
@keyframes stars-twinkle {
  0% { opacity: 0.4; } 25% { opacity: 0.7; } 50% { opacity: 0.5; } 75% { opacity: 0.8; } 100% { opacity: 0.4; }
}`,
  },
  {
    id: 'charbon-elegant',
    name: 'Charbon Elegant',
    desc: 'Noir anthracite, reflets subtils',
    preview: { header: '#18181B', footer: '#27272A', content: '#09090B', text: '#FAFAFA', block: 'rgba(250,250,250,0.05)', blockText: '#FAFAFA' },
    settings: {
      header_bg: '#18181B', footer_bg: '#27272A', content_bg: '#09090B',
      text_color: '#FAFAFA', block_bg: 'rgba(250,250,250,0.05)', block_text_color: '#FAFAFA',
      primary_color: '#A1A1AA',
    },
    css: `/* Charbon Elegant */
.display-text-content { color: #FAFAFA; }
[data-testid="display-main"] {
  background: linear-gradient(135deg, #09090B 0%, #18181B 50%, #27272A 100%) !important;
  overflow: hidden;
}
[data-testid="display-main"]::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg, transparent 40%, rgba(161,161,170,0.03) 50%, transparent 60%);
  animation: carbon-shine 20s linear infinite;
  z-index: 0; pointer-events: none;
}
@keyframes carbon-shine {
  0% { transform: translateX(-100%) rotate(45deg); }
  100% { transform: translateX(200%) rotate(45deg); }
}`,
  },
];

export default function ThemesPage() {
  const [s, setS] = useState(null);
  const [activeTheme, setActiveTheme] = useState(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    API.get('/settings').then(r => {
      setS(r.data);
      // Detect current theme
      const css = r.data?.custom_css || '';
      const match = THEMES.find(t => css.includes(`/* ${t.name} */`));
      if (match) setActiveTheme(match.id);
    }).catch(() => {});
  }, []);

  const applyTheme = async (theme) => {
    setApplying(true);
    try {
      const update = {
        ...theme.settings,
        custom_css: theme.css,
      };
      await API.put('/settings', update);
      setS({ ...s, ...update });
      setActiveTheme(theme.id);
      toast.success(`Theme "${theme.name}" applique`);
    } catch { toast.error('Erreur'); }
    finally { setApplying(false); }
  };

  if (!s) return <div className="flex items-center justify-center h-64 text-slate-400">Chargement...</div>;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="themes-title">Themes</h1>
        <p className="text-slate-500 mt-1">Choisissez un theme harmonieux pour vos ecrans. Personnalisable ensuite via le CSS dans Parametres.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {THEMES.map(theme => {
          const isActive = activeTheme === theme.id;
          const p = theme.preview;
          return (
            <Card key={theme.id}
              className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${isActive ? 'ring-2 ring-primary shadow-lg' : 'hover:ring-1 hover:ring-slate-300'}`}
              onClick={() => !applying && applyTheme(theme)}
              data-testid={`theme-${theme.id}`}>
              <CardContent className="p-0">
                {/* Mini preview */}
                <div className="aspect-video rounded-t-lg overflow-hidden relative">
                  {/* Header bar */}
                  <div className="h-[14%] flex items-center justify-between px-2" style={{ background: p.header }}>
                    <div className="h-2 w-6 rounded-sm" style={{ background: p.blockText, opacity: 0.3 }} />
                    <div className="flex gap-1">
                      <div className="h-2 w-8 rounded-sm" style={{ background: p.block }} />
                      <div className="h-2 w-6 rounded-sm" style={{ background: p.block }} />
                    </div>
                  </div>
                  {/* Content zone */}
                  <div className="flex-1 flex items-center justify-center" style={{ background: p.content, height: '76%' }}>
                    <div className="text-center">
                      <div className="h-1.5 w-16 mx-auto rounded-full mb-1" style={{ background: p.text, opacity: 0.2 }} />
                      <div className="h-1 w-10 mx-auto rounded-full" style={{ background: p.text, opacity: 0.1 }} />
                    </div>
                  </div>
                  {/* Footer bar */}
                  <div className="h-[10%]" style={{ background: p.footer }} />
                  {/* Active badge */}
                  {isActive && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-primary text-white text-[9px] px-1.5 py-0.5 gap-1">
                        <Check className="h-2.5 w-2.5" /> Actif
                      </Badge>
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold">{theme.name}</h3>
                    <div className="flex gap-1">
                      {[p.header, p.content, p.footer].map((c, i) => (
                        <div key={i} className="h-3 w-3 rounded-full border border-slate-200" style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">{theme.desc}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-start gap-3">
          <Palette className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-slate-700">Personnalisation avancee</p>
            <p className="text-xs text-slate-500 mt-1">
              Apres avoir applique un theme, vous pouvez ajuster les couleurs dans <strong>Parametres</strong> et modifier le CSS dans la zone <strong>CSS personnalise</strong> pour un rendu unique.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
