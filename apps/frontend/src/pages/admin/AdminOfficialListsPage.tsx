import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Minus, Plus, Search, X } from 'lucide-react';
import { apiErrorMessage } from '../../lib/api';
import {
  createOfficialList,
  fetchGrades,
  fetchProductsAdmin,
  fetchSchool,
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

export function AdminOfficialListsPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [schoolId, setSchoolId] = useState(searchParams.get('schoolId') ?? '');
  const [schoolSearch, setSchoolSearch] = useState('');
  const [gradeId, setGradeId] = useState(searchParams.get('gradeId') ?? '');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [knownProducts, setKnownProducts] = useState<Record<string, Product>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Préremplit le nom de l'école arrivée via l'URL, indépendamment de la recherche.
  const preselectedSchool = useQuery({
    queryKey: ['school', schoolId],
    queryFn: () => fetchSchool(schoolId),
    enabled: Boolean(schoolId),
  });

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);


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


  const activeProducts = useMemo(
    () => (products.data?.data ?? []).filter((p) => p.isActive),
    [products.data],
  );


  useEffect(() => {
    if (activeProducts.length === 0) return;
    setKnownProducts((prev) => {
      const next = { ...prev };
      for (const p of activeProducts) next[p.id] = p;
      return next;
    });
  }, [activeProducts]);


  useEffect(() => {
    const items = existing.data?.items ?? [];
    if (items.length === 0) return;
    const prefilled: Record<string, number> = {};
    const productsFromList: Record<string, Product> = {};
    for (const item of items) {
      if (!item.productId) continue;
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
  const totalQuantity = selectedEntries.reduce((sum, [, qty]) => sum + qty, 0);

  const setQty = (id: string, qty: number) =>
    setSelected((prev) => ({ ...prev, [id]: Math.max(0, qty) }));
  const removeItem = (id: string) => setQty(id, 0);

  const saveMutation = useMutation({
    mutationFn: () =>
      createOfficialList({
        schoolId,
        gradeId,
        items: selectedEntries.map(([productId, quantity]) => ({ productId, quantity })),
      }),
    onSuccess: () => {
      setSuccess('Liste officielle enregistrée.');

      queryClient.invalidateQueries({ queryKey: ['school-list', schoolId, gradeId] });
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const ready = Boolean(schoolId && gradeId) && selectedEntries.length > 0;
  const gradeName = grades.data?.find((g) => g.id === gradeId)?.name;

  const schoolOptions = useMemo(() => {
    const base = schoolResults.data?.data ?? [];
    const alreadyThere = base.some((s) => s.id === schoolId);
    const list =
      preselectedSchool.data && !alreadyThere
        ? [preselectedSchool.data, ...base]
        : base;

    return list.map((s) => ({
      id: s.id,
      label: s.name,
      subtitle: s.city ?? undefined,
      iconUrl: s.logoUrl,
    }));
  }, [schoolResults.data, preselectedSchool.data, schoolId]);

  return (
    <div className="space-y-6 pb-24">
      {schoolId && (
        <Link
          to={`/admin/ecoles/${schoolId}`}
          className="inline-flex items-center gap-1 text-sm text-brand-500 hover:underline"
        >
          <ArrowLeft size={14} /> Retour à la fiche école
        </Link>
      )}

      <div>
        <h1 className="text-2xl font-extrabold text-brand-900">
          Liste officielle
          {preselectedSchool.data && (
            <span className="font-medium text-brand-500"> — {preselectedSchool.data.name}</span>
          )}
          {gradeName && <span className="font-medium text-brand-500"> · {gradeName}</span>}
        </h1>
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
              options={schoolOptions}
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
                été chargée ci-dessous, modifiez-la puis enregistrez pour la remplacer.
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
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Catalogue */}
          <Card className="lg:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-bold text-brand-800">Catalogue</h2>
              <div className="relative sm:max-w-xs sm:flex-1">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
                <Input
                  className="pl-8"
                  placeholder="Rechercher un article…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
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
                  const isSelected = qty > 0;
                  return (
                    <li
                      key={p.id}
                      className={`flex items-center gap-3 rounded-lg px-2 py-2 transition-colors ${isSelected ? 'bg-brand-50' : ''
                        }`}
                    >
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-xs text-brand-400">—</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-brand-800">{p.name}</p>
                        <p className="text-xs text-brand-500">{formatMAD(p.price)}</p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setQty(p.id, qty - 1)}
                          disabled={qty === 0}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-brand-200 text-brand-600 hover:bg-brand-100 disabled:opacity-30"
                        >
                          <Minus size={13} />
                        </button>
                        <Input
                          type="number"
                          min={0}
                          className="w-14 text-center"
                          value={qty}
                          onChange={(e) => setQty(p.id, Number(e.target.value))}
                        />
                        <button
                          type="button"
                          onClick={() => setQty(p.id, qty + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-brand-200 text-brand-600 hover:bg-brand-100"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {products.data && products.data.meta.totalPages > 1 && (
              <Pagination meta={products.data.meta} onPageChange={setPage} />
            )}
          </Card>

          {/* Panier / résumé */}
          <Card className="h-fit lg:sticky lg:top-6">
            <h2 className="font-bold text-brand-800">
              Sélection {selectedEntries.length > 0 && <span className="text-brand-400">({selectedEntries.length})</span>}
            </h2>

            {selectedEntries.length === 0 ? (
              <p className="mt-3 text-sm text-brand-400">Aucun article sélectionné.</p>
            ) : (
              <ul className="mt-3 max-h-96 space-y-2 overflow-auto">
                {selectedEntries.map(([id, qty]) => {
                  const product = knownProducts[id];
                  return (
                    <li key={id} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 truncate text-brand-700">{product?.name ?? id}</span>
                      <span className="text-brand-400">×{qty}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(id)}
                        className="text-brand-300 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-4 space-y-1 border-t border-brand-100 pt-3 text-sm">
              <div className="flex justify-between text-brand-500">
                <span>Articles</span>
                <span>{totalQuantity}</span>
              </div>
              <div className="flex justify-between font-bold text-brand-800">
                <span>Total estimé</span>
                <span>{formatMAD(estimatedTotal)}</span>
              </div>
            </div>

            {error && <div className="mt-3"><Alert>{error}</Alert></div>}
            {success && <div className="mt-3"><Alert kind="success">{success}</Alert></div>}

            <Button
              className="mt-4 w-full"
              variant="accent"
              disabled={!ready || saveMutation.isPending}
              onClick={() => {
                setError('');
                setSuccess('');
                saveMutation.mutate();
              }}
            >
              {saveMutation.isPending ? 'Enregistrement…' : 'Enregistrer la liste'}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}