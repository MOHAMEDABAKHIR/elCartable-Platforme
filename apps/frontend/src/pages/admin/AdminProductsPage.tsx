import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiErrorMessage } from '../../lib/api';
import { fetchCategories, fetchProductsAdmin } from '../../lib/queries';
import { formatMAD } from '../../lib/format';
import { Alert, Badge, Button, Card, EmptyState, Field, Input, Select, Spinner, Textarea } from '../../components/ui';

interface ProductForm {
  name: string;
  price: number;
  description: string;
  categoryId: string;
  stock: number;
}

const EMPTY: ProductForm = { name: '', price: 0, description: '', categoryId: '', stock: 0 };

export function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProductForm>(EMPTY);
  const [error, setError] = useState('');

  const categories = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const products = useQuery({ queryKey: ['products', 'admin'], queryFn: fetchProductsAdmin });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/products', {
        name: form.name,
        price: Number(form.price),
        description: form.description || undefined,
        categoryId: form.categoryId || undefined,
        stock: Number(form.stock) || 0,
      }),
    onSuccess: () => {
      setForm(EMPTY);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive ? api.delete(`/products/${id}`) : api.patch(`/products/${id}`, { isActive: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-brand-900">Produits</h1>

      <Card>
        <h2 className="font-bold text-brand-800">Nouveau produit</h2>
        <form
          className="mt-4 grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            setError('');
            createMutation.mutate();
          }}
        >
          <Field label="Nom">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Prix (MAD)">
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              required
            />
          </Field>
          <Field label="Catégorie">
            <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">—</option>
              {categories.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Stock">
            <Input
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
          </div>
          {error && (
            <div className="sm:col-span-2">
              <Alert>{error}</Alert>
            </div>
          )}
          <div className="sm:col-span-2">
            <Button type="submit" variant="accent" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Création…' : 'Créer le produit'}
            </Button>
          </div>
        </form>
      </Card>

      {products.isLoading ? (
        <Spinner />
      ) : products.data && products.data.length > 0 ? (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-100 text-left text-brand-500">
                <th className="px-4 py-3">Produit</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3 text-right">Prix</th>
                <th className="px-4 py-3 text-center">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.data.map((p) => (
                <tr key={p.id} className="border-b border-brand-50">
                  <td className="px-4 py-3 font-medium text-brand-800">{p.name}</td>
                  <td className="px-4 py-3 text-brand-500">{p.category?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right">{formatMAD(p.price)}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge className={p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {p.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleMutation.mutate({ id: p.id, isActive: p.isActive })}
                      className={`text-sm hover:underline ${p.isActive ? 'text-red-500' : 'text-green-600'}`}
                    >
                      {p.isActive ? 'Désactiver' : 'Réactiver'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <EmptyState title="Aucun produit" description="Créez votre premier produit ci-dessus." />
      )}
    </div>
  );
}
