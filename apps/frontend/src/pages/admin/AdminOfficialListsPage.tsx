import { useEffect, useMemo, useState } from 'react';
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
import { SearchableSelect } from '../../components/SearchableSelect';
import { Pagination } from '../../components/Pagination';
import type { Product } from '../../lib/types';

const PAGE_SIZE = 20;

/**
 * Liste officielle = import d'articles catalogués. L'admin choisit une école +
 * un niveau, puis sélectionne des produits du catalogue (jamais de libellé
 * libre) : l'API valide que chaque productId existe et est actif.
 *
 * École et produits sont recherchés côté serveur (paginé/plafonné) plutôt que
 * chargés en intégralité — la table peut contenir un très grand nombre d'écoles
 * ou de produits.
 */
export function AdminOfficialListsPage() {
  const queryClient = useQueryClient();
  const [schoolId, setSchoolId] = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Record<string, number>>({});
  // Accumule les produits déjà vus (page courante + articles d'une liste existante)
  // pour garder le bon prix/nom même quand un article n'est plus sur la page affichée.
  const [knownProducts, setKnownProducts] = useState<Record<string, Product>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Nouveau couple école/niveau : on repart d'une sélection vierge, la liste
  // existante (si elle existe) sera rechargée dans `selected` ci-dessous.
  useEffect(() => {
    setSelected({});
    setPage(1);
  }, [schoolId, gradeId]);

  const schoolResults = useQuery({
    queryKey: ['schools', 'admin', 'picker', schoolSearch],
    queryFn: () => fetchSchoolsAdmin({ search: schoolSearch || undefined, limit: 20 }),
    placeholderData: (previous) => previous,
  });
  const grades = useQuery({ queryKey: ['grades'], queryFn: fetchGrades });
  const products = useQuery({
    queryKey: ['products', 'admin', 'picker', page, debouncedSearch],
    queryFn: () => fetchProductsAdmin({ page, limit: PAGE_SIZE, search: debouncedSearch || undefined }),
    placeholderData: (previous) => previous,
  });

  const existing = useQuery({
    queryKey: ['school-list', schoolId, gradeId],
    queryFn: () => fetchSchoolList(schoolId, gradeId),
    enabled: Boolean(schoolId && gradeId),
  });

  // Le picker ne montre que les produits actifs (les inactifs restent visibles
  // dans /admin/produits mais ne doivent pas atterrir dans une nouvelle liste).
  const activeProducts = useMemo(
    () => (products.data?.data ?? []).filter((p) => p.isActive),
    [products.data],
  );

  // Mémorise les produits de la page courante...
  useEffect(() => {
    if (activeProducts.length === 0) return;
    setKnownProducts((prev) => {
      const next = { ...prev };
      for (const p of activeProducts) next[p.id] = p;
      return next;
    });
  }, [activeProducts]);

  // ...et pré-remplit la sélection avec la liste déjà existante pour ce
  // couple école/niveau, afin de pouvoir la modifier directement.
  useEffect(() => {
    const items = existing.data?.items ?? [];
    if (items.length === 0) return;
    const prefilled: Record<string, number> = {};
    const productsFromList: Record<string, Product> = {};
    for (const item of items) {
      if (!item.productId) continue; // article personnalisé sans référence catalogue
      prefilled[item.productId] = item.quantity;
      if (item.product) productsFromList[item.productId] = item.product;
    }
    setSelected(prefilled);
    if (Object.keys(productsFromList).length > 0) {
      setKnownProducts((prev) => ({ ...prev, ...productsFromList }));
    }
  }, [existing.data]);

  const selectedEntries = Object.entries(selected).filter(([, qty]) => qty > 0);
  const customItemsCount = (existing.data?.items ?? []).filter((i) => !i.productId).length;
  const estimatedTotal = selectedEntries.reduce((sum, [id, qty]) => {
    const price = Number(knownProducts[id]?.price ?? 0);
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
            <SearchableSelect
              value={schoolId}
              onChange={setSchoolId}
              onSearch={setSchoolSearch}
              loading={schoolResults.isLoading}
              options={(schoolResults.data?.data ?? []).map((s) => ({
                id: s.id,
                label: s.name,
                subtitle: s.city ?? undefined,
                iconUrl: s.logoUrl,
              }))}
              placeholder="Choisir une école"
              searchPlaceholder="Rechercher une école..."
              emptyLabel="Aucune école trouvée"
            />
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
                Une liste officielle existe déjà ({existing.data.items.length} article(s)) — elle a
                été chargée ci-dessous, vous pouvez la modifier puis l'enregistrer pour la remplacer.
                {customItemsCount > 0 && (
                  <>
                    {' '}
                    ({customItemsCount} article(s) personnalisé(s) sans référence catalogue ne sont
                    pas repris automatiquement.)
                  </>
                )}
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
          ) : activeProducts.length === 0 ? (
            <p className="mt-4 text-sm text-brand-500">Aucun produit actif ne correspond.</p>
          ) : (
            <ul className="mt-4 divide-y divide-brand-50">
              {activeProducts.map((p) => {
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
                      className="max-w-50 flex-2"
                      value={qty}
                      onChange={(e) => setQty(p.id, Number(e.target.value))}
                    />
                  </li>
                );
              })}
            </ul>
          )}

          {products.data && products.data.meta.totalPages > 1 && (
            <Pagination meta={products.data.meta} onPageChange={setPage} />
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