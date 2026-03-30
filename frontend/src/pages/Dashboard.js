import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { getMediaUrl } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Monitor, ListVideo, Image, Zap, Settings, ArrowRight, Clock, FileText, Film, Eye, AlertTriangle, BarChart3 } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color, onClick }) => (
  <Card className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 group" onClick={onClick} data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <div className="flex items-center gap-1 mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        <span>Voir</span><ArrowRight className="h-3 w-3" />
      </div>
    </CardContent>
  </Card>
);

function MiniBar({ data, max }) {
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((v, i) => (
        <div key={i} className="flex-1 rounded-t-sm bg-primary/20 relative overflow-hidden" style={{ height: `${Math.max((v / Math.max(max, 1)) * 100, 4)}%` }}>
          <div className="absolute bottom-0 inset-x-0 bg-primary rounded-t-sm" style={{ height: '100%', opacity: 0.6 + (i / data.length) * 0.4 }} />
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ screens: 0, playlists: 0, media: 0, slides: 0, activeAlerts: 0, mediaByType: {} });
  const [recentPlaylists, setRecentPlaylists] = useState([]);
  const [screens, setScreens] = useState([]);

  useEffect(() => {
    Promise.all([
      API.get('/screens'),
      API.get('/playlists'),
      API.get('/media'),
      API.get('/flash-alerts').catch(() => ({ data: [] })),
    ]).then(([sr, pr, mr, ar]) => {
      const s = sr.data || [];
      const p = pr.data || [];
      const m = mr.data || [];
      const a = ar.data || [];
      const totalSlides = p.reduce((acc, pl) => acc + (pl.slides?.length || 0), 0);
      const mediaByType = m.reduce((acc, item) => { acc[item.type] = (acc[item.type] || 0) + 1; return acc; }, {});
      setStats({ screens: s.length, playlists: p.length, media: m.length, slides: totalSlides, activeAlerts: a.filter(x => x.is_active).length, mediaByType });
      setRecentPlaylists(p.slice(0, 5));
      setScreens(s);
    }).catch(() => {});
  }, []);

  const mediaTypes = [
    { key: 'image', label: 'Images', icon: Image, color: 'text-blue-500' },
    { key: 'video', label: 'Videos', icon: Film, color: 'text-purple-500' },
    { key: 'pdf', label: 'PDFs', icon: FileText, color: 'text-red-500' },
    { key: 'youtube', label: 'YouTube', icon: Eye, color: 'text-pink-500' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="dashboard-title">Tableau de bord</h1>
          <p className="text-slate-500 mt-1">Vue d'ensemble de votre signalisation numerique</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/settings')} data-testid="goto-settings">
          <Settings className="h-4 w-4 mr-2" /> Parametres
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Monitor} label="Ecrans" value={stats.screens} color="bg-blue-500" onClick={() => navigate('/screens')} />
        <StatCard icon={ListVideo} label="Playlists" value={stats.playlists} color="bg-violet-500" onClick={() => navigate('/playlists')} />
        <StatCard icon={Image} label="Medias" value={stats.media} color="bg-emerald-500" onClick={() => navigate('/media')} />
        <StatCard icon={Zap} label="Diapos" value={stats.slides} color="bg-amber-500" onClick={() => navigate('/playlists')} />
      </div>

      {/* Alert banner */}
      {stats.activeAlerts > 0 && (
        <Card className="mb-6 border-red-200 bg-red-50 cursor-pointer hover:bg-red-100 transition-colors" onClick={() => navigate('/flash-info')}>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
            <span className="text-sm font-medium text-red-700">{stats.activeAlerts} alerte(s) Flash Info active(s)</span>
            <ArrowRight className="h-4 w-4 text-red-400 ml-auto" />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Media distribution */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Repartition des medias</CardTitle></CardHeader>
          <CardContent>
            {stats.media === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Aucun media importe</p>
            ) : (
              <div className="space-y-3">
                <MiniBar data={mediaTypes.map(t => stats.mediaByType[t.key] || 0)} max={Math.max(...mediaTypes.map(t => stats.mediaByType[t.key] || 0))} />
                <div className="grid grid-cols-2 gap-2">
                  {mediaTypes.map(t => (
                    <div key={t.key} className="flex items-center gap-2 text-xs">
                      <t.icon className={`h-3.5 w-3.5 ${t.color}`} />
                      <span className="text-slate-500">{t.label}</span>
                      <span className="font-semibold ml-auto">{stats.mediaByType[t.key] || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Button variant="ghost" size="sm" className="w-full mt-3 text-xs" onClick={() => navigate('/media')}>
              Voir la mediatheque <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Recent playlists */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ListVideo className="h-4 w-4 text-violet-500" /> Playlists recentes</CardTitle></CardHeader>
          <CardContent>
            {recentPlaylists.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Aucune playlist creee</p>
            ) : (
              <div className="space-y-2">
                {recentPlaylists.map(pl => (
                  <div key={pl.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                    onClick={() => navigate(`/playlists/${pl.id}`)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{pl.name}</p>
                      <p className="text-[10px] text-slate-400">{pl.slides?.length || 0} diapo(s)</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                  </div>
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" className="w-full mt-3 text-xs" onClick={() => navigate('/playlists')}>
              Toutes les playlists <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Screens */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Monitor className="h-4 w-4 text-blue-500" /> Ecrans</CardTitle></CardHeader>
          <CardContent>
            {screens.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Aucun ecran configure</p>
            ) : (
              <div className="space-y-2">
                {screens.map(sc => (
                  <div key={sc.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                    onClick={() => navigate('/screens')}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`h-2 w-2 rounded-full shrink-0 ${sc.is_online ? 'bg-green-500' : 'bg-slate-300'}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{sc.name}</p>
                        <p className="text-[10px] text-slate-400">Code: {sc.pairing_code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {sc.playlist_id && <Clock className="h-3 w-3 text-green-400" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" className="w-full mt-3 text-xs" onClick={() => navigate('/screens')}>
              Gerer les ecrans <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
