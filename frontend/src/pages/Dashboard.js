import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import API from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Monitor, Wifi, Image, ListVideo, Users, Activity } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <Card className="hover:shadow-md transition-shadow duration-200">
    <CardContent className="p-6 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${accent || 'bg-primary/10 text-primary'}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight">{value ?? '-'}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    API.get('/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  if (user?.role === 'super_admin') {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight" data-testid="dashboard-title">
            Tableau de bord
          </h1>
          <p className="text-slate-500 mt-1">Vue globale du parc Intensiti</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard icon={Users} label="Clients" value={stats?.total_clients} accent="bg-blue-50 text-blue-600" />
          <StatCard icon={Monitor} label="Ecrans total" value={stats?.total_screens} accent="bg-slate-100 text-slate-700" />
          <StatCard icon={Wifi} label="En ligne" value={stats?.online_screens} accent="bg-emerald-50 text-emerald-600" />
          <StatCard icon={ListVideo} label="Playlists" value={stats?.total_playlists} accent="bg-purple-50 text-purple-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="dashboard-title">
          Tableau de bord
        </h1>
        <p className="text-slate-500 mt-1">
          Bienvenue, {user?.company_name || user?.email}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={Monitor} label="Mes ecrans" value={stats?.total_screens} accent="bg-primary/10 text-primary" />
        <StatCard icon={Activity} label="En ligne" value={stats?.online_screens} accent="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Image} label="Medias" value={stats?.total_media} accent="bg-amber-50 text-amber-600" />
        <StatCard icon={ListVideo} label="Playlists" value={stats?.total_playlists} accent="bg-purple-50 text-purple-600" />
      </div>
    </div>
  );
}
