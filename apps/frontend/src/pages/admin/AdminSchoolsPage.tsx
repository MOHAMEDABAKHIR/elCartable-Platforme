import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { api, apiErrorMessage } from '../../lib/api';
import { fetchSchoolsAdmin, uploadSchoolLogo } from '../../lib/queries';
import { Alert, Badge, Button, Card, EmptyState, Field, Input, Spinner } from '../../components/ui';
import { ImageUploadButton } from '../../components/ImageUploadButton';
import { Pagination } from '../../components/Pagination';

interface SchoolForm {
  name: string;
  city: string;
  address: string;
}

const EMPTY: SchoolForm = { name: '', city: '', address: '' };
const PAGE_SIZE = 20;

export function AdminSchoolsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SchoolForm>(EMPTY);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Debounce la recherche pour ne pas déclencher un appel API à chaque frappe,
  // et revenir en page 1 dès que le filtre change.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const schools = useQuery({
    queryKey: ['schools', 'admin', page, debouncedSearch],
    queryFn: () => fetchSchoolsAdmin({ page, limit: PAGE_SIZE, search: debouncedSearch || undefined }),
    placeholderData: (previous) => previous,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/schools', {
        name: form.name,
        city: form.city || undefined,
        address: form.address || undefined,
      }),
    onSuccess: () => {
      setForm(EMPTY);
      queryClient.invalidateQueries({ queryKey: ['schools'] });
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive ? api.delete(`/schools/${id}`) : api.patch(`/schools/${id}`, { isActive: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schools'] }),
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const logoMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => uploadSchoolLogo(id, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schools'] }),
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-brand-900">Écoles</h1>

      <Card>
        <h2 className="font-bold text-brand-800">Nouvelle école</h2>
        <form
          className="mt-4 grid gap-4 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            setError('');
            createMutation.mutate();
          }}
        >
          <Field label="Nom">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Ville">
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </Field>
          <Field label="Adresse">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          {error && (
            <div className="sm:col-span-3">
              <Alert>{error}</Alert>
            </div>
          )}
          <div className="sm:col-span-3">
            <Button type="submit" variant="accent" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Création…' : "Créer l'école"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou ville..."
          className="pl-9"
        />
      </div>

      {schools.isLoading ? (
        <Spinner />
      ) : schools.data && schools.data.data.length > 0 ? (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-100 text-left text-brand-500">
                <th className="px-4 py-3">Logo</th>
                <th className="px-4 py-3">École</th>
                <th className="px-4 py-3">Ville</th>
                <th className="px-4 py-3 text-center">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {schools.data.data.map((s) => (
                <tr key={s.id} className="border-b border-brand-50">
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      {s.logoUrl ? (
                        <img src={s.logoUrl} alt={s.name} className="h-10 w-10 rounded-lg object-contain" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-xs text-brand-400">—</div>
                      )}
                      <ImageUploadButton
                        label={s.logoUrl ? 'Changer' : 'Ajouter'}
                        onUpload={(file) => logoMutation.mutateAsync({ id: s.id, file })}
                        onError={setError}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-brand-800">{s.name}</td>
                  <td className="px-4 py-3 text-brand-500">{s.city ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge className={s.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleMutation.mutate({ id: s.id, isActive: s.isActive })}
                      className={`text-sm hover:underline ${s.isActive ? 'text-red-500' : 'text-green-600'}`}
                    >
                      {s.isActive ? 'Désactiver' : 'Réactiver'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination meta={schools.data.meta} onPageChange={setPage} />
        </Card>
      ) : (
        <EmptyState
          title="Aucune école"
          description={debouncedSearch ? 'Aucun résultat pour cette recherche.' : 'Ajoutez votre première école ci-dessus.'}
        />
      )}
    </div>
  );
}
