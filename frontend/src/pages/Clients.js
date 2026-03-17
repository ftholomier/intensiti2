import { useEffect, useState } from 'react';
import API from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Trash2, Edit, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', company_name: '', max_screens: 10 });
  const [loading, setLoading] = useState(false);

  const loadClients = () => API.get('/clients').then(r => setClients(r.data)).catch(() => {});

  useEffect(() => { loadClients(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/clients', form);
      toast.success('Client cree avec succes');
      setShowCreate(false);
      setForm({ email: '', password: '', company_name: '', max_screens: 10 });
      loadClients();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce client et toutes ses donnees ?')) return;
    try {
      await API.delete(`/clients/${id}`);
      toast.success('Client supprime');
      loadClients();
    } catch {
      toast.error('Erreur de suppression');
    }
  };

  const toggleActive = async (client) => {
    try {
      await API.put(`/clients/${client.id}`, { is_active: !client.is_active });
      toast.success(client.is_active ? 'Client suspendu' : 'Client reactive');
      loadClients();
    } catch {
      toast.error('Erreur');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="clients-title">Clients</h1>
          <p className="text-slate-500 mt-1">Gestion des comptes clients</p>
        </div>
        <Button onClick={() => setShowCreate(true)} data-testid="create-client-btn">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau client
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entreprise</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Ecrans</TableHead>
                <TableHead>Quota</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    Aucun client
                  </TableCell>
                </TableRow>
              ) : clients.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.company_name}</TableCell>
                  <TableCell className="text-slate-500">{c.email}</TableCell>
                  <TableCell>{c.screen_count || 0}</TableCell>
                  <TableCell>{c.max_screens}</TableCell>
                  <TableCell>
                    <Badge
                      variant={c.is_active ? 'default' : 'destructive'}
                      className="cursor-pointer"
                      onClick={() => toggleActive(c)}
                      data-testid={`toggle-client-${c.id}`}
                    >
                      {c.is_active ? 'Actif' : 'Suspendu'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(c.id)}
                      data-testid={`delete-client-${c.id}`}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau client</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de l'entreprise</Label>
              <Input
                value={form.company_name}
                onChange={e => setForm({...form, company_name: e.target.value})}
                placeholder="Nom de l'entreprise"
                data-testid="client-company-input"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                placeholder="client@email.com"
                data-testid="client-email-input"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Mot de passe</Label>
              <Input
                type="password"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                placeholder="Mot de passe"
                data-testid="client-password-input"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Quota d'ecrans</Label>
              <Input
                type="number"
                value={form.max_screens}
                onChange={e => setForm({...form, max_screens: parseInt(e.target.value) || 0})}
                data-testid="client-quota-input"
                min="1"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
              <Button type="submit" disabled={loading} data-testid="submit-client-btn">
                {loading ? 'Creation...' : 'Creer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
