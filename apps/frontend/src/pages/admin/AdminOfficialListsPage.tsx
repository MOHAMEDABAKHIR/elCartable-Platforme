import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '../../lib/api';
import {
  createOfficialList,
  fetchGrades,
  fetchProductsAdmin,
  fetchSchoolList,
  fetchSchoolsAdmin,
} from '../../lib/queries';
import { formatMAD } from '../../lib/format';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Select,
  Spinner,
} from '../../components/ui';

/**
 * Liste officielle = import d'articles catalogués. L'admin choisit une école +
 * un niveau, puis sélectionne des produits du catalogue (jamais de libellé
 * libre) : l'API valide que chaque productId existe et est actif.
 */
export function AdminOfficialListsPage() {
  const queryClient = useQueryClient();
  const [schoolId, setSchoolId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const schools = useQuery({ queryKey: ['schools', 'admin'], queryFn: fetchSchoolsAdmin });
  const grades = useQuery({ queryKey: ['grades'], queryFn: fetchGrades });
  const products = useQuery({ queryKey: ['products', 'admin'], queryFn: fetchProductsAdmin });

  const existing = useQuery({
    queryKey: ['school-list', schoolId, gradeId],
    queryFn: () => fetchSchoolList(schoolId, gradeId),
    enabled: Boolean(schoolId && gradeId),
  });

  const activeProducts = useMemo(
    () => (products.data ?? []).filter((p) => p.isActive),
    [products.data],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeProducts;
    return activeProducts.filter((p) => p.name.toLowerCase().includes(q));
  }, [activeProducts, search]);

  const selectedEntries = Object.entries(selected).filter(([, qty]) => qty > 0);
  const productById = useMemo(
    () => new Map(activeProducts.map((p) => [p.id, p])),
    [activeProducts],
  );
  const estimatedTotal = selectedEntries.reduce((sum, [id, qty]) => {
    const price = Number(productById.get(id)?.price ?? 0);
    return sum + price * qty;
  }, 0);

  const setQty = (id: string, qty: number) =>
    setSelected((prev) => ({ ...prev, [id]: Math.max(0, qty) }));

  const saveMutation = useMutation({
    mutationFn: () =>
      createOfficialList({
        schoolId,
        gradeId,
        items: selectedEntries.map(([productId, quantity]) => ({ productId, quantity })),
      }),
    onSuccess: () => {
      setSuccess('Liste officielle enregistrée.');
      setSelected({});
      queryClient.invalidateQueries({ queryKey: ['school-list', schoolId, gradeId] });
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const ready = Boolean(schoolId && gradeId) && selectedEntries.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-900">Listes officielles</h1>
        <p className="text-sm text-brand-500">
          Importez les articles depuis le catalogue pour une école et un niveau donnés.
        </p>
      </div>

      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="École">
            <Select value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
              <option value="">Choisir une école</option>
              {schools.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.city ? ` - ${s.city}` : ''}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Niveau">
            <Select value={gradeId} onChange={(e) => setGradeId(e.target.value)}>
              <option value="">Choisir un niveau</option>
              {grades.data?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {schoolId && gradeId && (
          <div className="mt-4">
            {existing.isLoading ? (
              <Spinner label="Chargement de la liste existante…" />
            ) : existing.data && existing.data.items.length > 0 ? (
              <Alert kind="info">
                Une liste officielle existe déjà ({existing.data.items.length} article(s)).
                L'enregistrement la remplacera intégralement.
              </Alert>
            ) : (
              <Alert kind="info">Aucune liste officielle pour ce couple école / niveau.</Alert>
            )}
          </div>
        )}
      </Card>

      {!schoolId || !gradeId ? (
        <EmptyState
          title="Sélectionnez une école et un niveau"
          description="Puis choisissez les articles du catalogue à inclure dans la liste."
        />
      ) : (
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-bold text-brand-800">Articles du catalogue</h2>
            <Input
              className="sm:max-w-xs"
              placeholder="Rechercher un article…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {products.isLoading ? (
            <div className="mt-4">
              <Spinner />
            </div>
          ) : filtered.length === 0 ? (
            <p className="mt-4 text-sm text-brand-500">Aucun produit actif ne correspond.</p>
          ) : (
            <ul className="mt-4 divide-y divide-brand-50">
              {filtered.map((p) => {
                const qty = selected[p.id] ?? 0;
                return (
                  <li key={p.id} className="flex items-center gap-3 py-2">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-xs text-brand-400">—</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-brand-800">{p.name}</p>
                      <p className="text-xs text-brand-500">{formatMAD(p.price)}</p>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      className="w-20"
                      value={qty}
                      onChange={(e) => setQty(p.id, Number(e.target.value))}
                    />
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-6 flex flex-col gap-3 border-t border-brand-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-brand-600">
              {selectedEntries.length} article(s) — total estimé {formatMAD(estimatedTotal)}
            </span>
            <Button
              variant="accent"
              disabled={!ready || saveMutation.isPending}
              onClick={() => {
                setError('');
                setSuccess('');
                saveMutation.mutate();
              }}
            >
              {saveMutation.isPending ? 'Enregistrement…' : 'Enregistrer la liste officielle'}
            </Button>
          </div>

          {error && <div className="mt-4"><Alert>{error}</Alert></div>}
          {success && <div className="mt-4"><Alert kind="success">{success}</Alert></div>}
        </Card>
      )}
    </div>
  );
}
