import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiErrorMessage } from '../../lib/api';
import { createCategory, createGrade, fetchCategories, fetchGradesAdmin } from '../../lib/queries';
import { Alert, Badge, Button, Card, EmptyState, Field, Input, Spinner } from '../../components/ui';

interface GradeForm {
  name: string;
  cycle: string;
  order: number;
}

interface CategoryForm {
  name: string;
  slug: string;
}

const EMPTY_GRADE: GradeForm = { name: '', cycle: '', order: 0 };
const EMPTY_CATEGORY: CategoryForm = { name: '', slug: '' };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function GradesSection() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<GradeForm>(EMPTY_GRADE);
  const [error, setError] = useState('');

  const grades = useQuery({ queryKey: ['grades', 'admin'], queryFn: fetchGradesAdmin });

  const createMutation = useMutation({
    mutationFn: () =>
      createGrade({ name: form.name, cycle: form.cycle || undefined, order: Number(form.order) || 0 }),
    onSuccess: () => {
      setForm(EMPTY_GRADE);
      queryClient.invalidateQueries({ queryKey: ['grades'] });
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive ? api.delete(`/grades/${id}`) : api.patch(`/grades/${id}`, { isActive: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['grades'] }),
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <Card>
      <h2 className="font-bold text-brand-800">Niveaux scolaires</h2>
      <form
        className="mt-4 grid gap-4 sm:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError('');
          createMutation.mutate();
        }}
      >
        <Field label="Nom (ex: CP, 6ème)">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </Field>
        <Field label="Cycle (Primaire, Collège…)">
          <Input value={form.cycle} onChange={(e) => setForm({ ...form, cycle: e.target.value })} />
        </Field>
        <Field label="Ordre d'affichage">
          <Input
            type="number"
            value={form.order}
            onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
          />
        </Field>
        <div className="flex items-end">
          <Button type="submit" variant="accent" disabled={createMutation.isPending} className="w-full">
            {createMutation.isPending ? 'Création…' : 'Ajouter'}
          </Button>
        </div>
        {error && (
          <div className="sm:col-span-4">
            <Alert>{error}</Alert>
          </div>
        )}
      </form>

      <div className="mt-6">
        {grades.isLoading ? (
          <Spinner />
        ) : grades.data && grades.data.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-100 text-left text-brand-500">
                <th className="px-2 py-2">Niveau</th>
                <th className="px-2 py-2">Cycle</th>
                <th className="px-2 py-2 text-center">Statut</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {grades.data.map((g) => (
                <tr key={g.id} className="border-b border-brand-50">
                  <td className="px-2 py-2 font-medium text-brand-800">{g.name}</td>
                  <td className="px-2 py-2 text-brand-500">{g.cycle ?? '—'}</td>
                  <td className="px-2 py-2 text-center">
                    <Badge className={g.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {g.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </td>
                  <td className="px-2 py-2 text-right">
                    <button
                      onClick={() => toggleMutation.mutate({ id: g.id, isActive: g.isActive })}
                      className={`text-sm hover:underline ${g.isActive ? 'text-red-500' : 'text-green-600'}`}
                    >
                      {g.isActive ? 'Désactiver' : 'Réactiver'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState title="Aucun niveau" description="Ajoutez un niveau scolaire ci-dessus." />
        )}
      </div>
    </Card>
  );
}

function CategoriesSection() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CategoryForm>(EMPTY_CATEGORY);
  const [error, setError] = useState('');

  const categories = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

  const createMutation = useMutation({
    mutationFn: () => createCategory({ name: form.name, slug: form.slug || slugify(form.name) }),
    onSuccess: () => {
      setForm(EMPTY_CATEGORY);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <Card>
      <h2 className="font-bold text-brand-800">Catégories de produits</h2>
      <form
        className="mt-4 grid gap-4 sm:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          setError('');
          createMutation.mutate();
        }}
      >
        <Field label="Nom">
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })}
            required
          />
        </Field>
        <Field label="Slug (URL)">
          <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
        </Field>
        <div className="flex items-end">
          <Button type="submit" variant="accent" disabled={createMutation.isPending} className="w-full">
            {createMutation.isPending ? 'Création…' : 'Ajouter'}
          </Button>
        </div>
        {error && (
          <div className="sm:col-span-3">
            <Alert>{error}</Alert>
          </div>
        )}
      </form>

      <div className="mt-6">
        {categories.isLoading ? (
          <Spinner />
        ) : categories.data && categories.data.length > 0 ? (
          <ul className="divide-y divide-brand-50 text-sm">
            {categories.data.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2">
                <span className="font-medium text-brand-800">{c.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-brand-400">{c.slug}</span>
                  <button
                    onClick={() => removeMutation.mutate(c.id)}
                    className="text-red-500 hover:underline"
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Aucune catégorie" description="Ajoutez une catégorie ci-dessus." />
        )}
      </div>
    </Card>
  );
}

export function AdminCatalogRefsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-brand-900">Catégories & niveaux</h1>
      <GradesSection />
      <CategoriesSection />
    </div>
  );
}
