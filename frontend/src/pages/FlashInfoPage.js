import { useEffect, useState } from 'react';
import API from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { AlertTriangle, Send, X, History } from 'lucide-react';
import { toast } from 'sonner';

export default function FlashInfoPage() {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const [history, setHistory] = useState([]);

  const fetchAlerts = async () => {
    try {
      const r = await API.get('/flash-alerts');
      const alerts = r.data || [];
      setHistory(alerts);
      setActiveAlert(alerts.find(a => a.is_active) || null);
    } catch {}
  };

  useEffect(() => { fetchAlerts(); }, []);

  const sendAlert = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await API.post('/flash-alert', { message: message.trim() });
      toast.success('Alerte Flash envoyee sur tous les ecrans');
      setMessage('');
      fetchAlerts();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    } finally { setSending(false); }
  };

  const dismissAlert = async () => {
    try {
      await API.delete('/flash-alert');
      toast.success('Alerte desactivee');
      setActiveAlert(null);
      fetchAlerts();
    } catch { toast.error('Erreur'); }
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="flash-info-title">Flash Info</h1>
        <p className="text-slate-500 mt-1">Envoyez une alerte en plein ecran sur tous vos ecrans instantanement.</p>
      </div>

      {/* Active alert */}
      {activeAlert && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-red-600 uppercase tracking-wider">Alerte active</p>
                  <p className="text-sm font-semibold text-red-900 mt-0.5">{activeAlert.message}</p>
                </div>
              </div>
              <Button variant="destructive" size="sm" onClick={dismissAlert} data-testid="dismiss-alert-btn">
                <X className="h-4 w-4 mr-1" /> Desactiver
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Send new alert */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" /> Envoyer une alerte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Input
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Ex: Evacuation immediate - Sortie de secours B"
                className="text-base"
                data-testid="flash-message-input"
                onKeyDown={e => e.key === 'Enter' && sendAlert()}
              />
              <p className="text-[10px] text-slate-400 mt-1.5">Ce message s'affichera en plein ecran sur fond rouge sur tous vos ecrans.</p>
            </div>
            <Button onClick={sendAlert} disabled={sending || !message.trim()} className="bg-red-600 hover:bg-red-700" data-testid="send-alert-btn">
              <Send className="h-4 w-4 mr-2" /> {sending ? 'Envoi...' : 'Envoyer l\'alerte'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-slate-500" /> Historique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${a.is_active ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
                    <p className="text-sm truncate">{a.message}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 ml-3">
                    {new Date(a.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
