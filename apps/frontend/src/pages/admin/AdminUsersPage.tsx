import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '../../lib/api';
import { deactivateUser, fetchUsers, inviteAdmin, inviteCommercial, reactivateUser } from '../../lib/queries';
import type { InvitationResult } from '../../lib/queries';
import type { UserRole } from '../../lib/types';
import { useAuth } from '../../store/auth';
import { Alert, Badge, Button, Card, EmptyState, Field, Input, Select, Spinner } from '../../components/ui';

interface InviteForm {
  email: string;
  fullName: string;
  phone: string;
}

const EMPTY: InviteForm = { email: '', fullName: '', phone: '' };

export function AdminUsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Un Admin ne gère que les Commerciaux ; un Super Admin choisit le rôle à inviter.
  const [targetRole, setTargetRole] = useState<UserRole>('COMMERCIAL');
  const [form, setForm] = useState<InviteForm>(EMPTY);
  const [error, setError] = useState('');
  const [lastInvitation, setLastInvitation] = useState<InvitationResult | null>(null);

  const users = useQuery({
    queryKey: ['users', isSuperAdmin ? 'all' : 'commercials'],
    queryFn: () => fetchUsers(),
  });

  const inviteMutation = useMutation({
    mutationFn: () => {
      const payload = { email: form.email, fullName: form.fullName, phone: form.phone || undefined };
      return targetRole === 'ADMIN' ? inviteAdmin(payload) : inviteCommercial(payload);
    },
    onSuccess: (result) => {
      setForm(EMPTY);
      setLastInvitation(result);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive ? deactivateUser(id) : reactivateUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-brand-900">Utilisateurs</h1>

      <Card>
        <h2 className="font-bold text-brand-800">
          {isSuperAdmin ? 'Inviter un administrateur ou un commercial' : 'Inviter un commercial'}
        </h2>
        <p className="mt-1 text-sm text-brand-500">
          Le compte est créé en attente d'activation. Transmettez le code d'invitation généré
          ci-dessous à la personne concernée : elle l'utilisera lors de sa première connexion pour
          définir son mot de passe.
        </p>

        <form
          className="mt-4 grid gap-4 sm:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError('');
            setLastInvitation(null);
            inviteMutation.mutate();
          }}
        >
          {isSuperAdmin && (
            <Field label="Rôle">
              <Select value={targetRole} onChange={(e) => setTargetRole(e.target.value as UserRole)}>
                <option value="COMMERCIAL">Commercial</option>
                <option value="ADMIN">Administrateur</option>
              </Select>
            </Field>
          )}
          <Field label="Nom complet">
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </Field>
          <Field label="Téléphone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>

          {error && (
            <div className="sm:col-span-4">
              <Alert>{error}</Alert>
            </div>
          )}
          {lastInvitation && (
            <div className="sm:col-span-4">
              <Alert kind="success">
                Compte créé pour <strong>{lastInvitation.email}</strong>. Code d'invitation :{' '}
                <code className="rounded bg-white px-2 py-0.5 font-mono">{lastInvitation.invitationCode}</code>{' '}
                (valable jusqu'au {new Date(lastInvitation.expiresAt).toLocaleString('fr-MA')}).
              </Alert>
            </div>
          )}

          <div className="sm:col-span-4">
            <Button type="submit" variant="accent" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? 'Création…' : "Envoyer l'invitation"}
            </Button>
          </div>
        </form>
      </Card>

      {users.isLoading ? (
        <Spinner />
      ) : users.data && users.data.length > 0 ? (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-100 text-left text-brand-500">
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3 text-center">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.data.map((u) => (
                <tr key={u.id} className="border-b border-brand-50">
                  <td className="px-4 py-3 font-medium text-brand-800">{u.fullName}</td>
                  <td className="px-4 py-3 text-brand-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge className="bg-brand-100 text-brand-700">
                      {u.role === 'ADMIN' ? 'Administrateur' : 'Commercial'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {u.mustSetPassword ? (
                      <Badge className="bg-yellow-100 text-yellow-700">En attente d'activation</Badge>
                    ) : (
                      <Badge className={u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {u.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleMutation.mutate({ id: u.id, isActive: u.isActive })}
                      className={`text-sm hover:underline ${u.isActive ? 'text-red-500' : 'text-green-600'}`}
                    >
                      {u.isActive ? 'Désactiver' : 'Réactiver'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <EmptyState title="Aucun utilisateur" description="Invitez votre premier compte ci-dessus." />
      )}
    </div>
  );
}
