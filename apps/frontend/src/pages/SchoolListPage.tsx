import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Camera,
  Check,
  ChevronDown,
  FileText,
  FileUp,
  GraduationCap,
  Image as ImageIcon,
  Loader2,
  Package,
  Paperclip,
  PenLine,
  School,
  Send,
} from 'lucide-react';
import { api, apiErrorMessage } from '../lib/api';
import { fetchGrades, fetchSchoolList, fetchSchools } from '../lib/queries';
import { useCart } from '../store/cart';
import { formatMAD } from '../lib/format';
import { Alert, Button, Card, Spinner } from '../components/ui';
import type { SchoolListSource } from '../lib/types';
import { track } from '../lib/analytics';
import "../components/MoleskineNotebooks.css";
import { fetchProducts } from '../lib/queries';

/* -------------------------------------------------------------------------- */
/* Design tokens (elCartable) — violet primaire · turquoise #56BFB5 · jaune   */
/* -------------------------------------------------------------------------- */
const TURQUOISE = '#56BFB5';
interface SelectedCatalogueItem {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  quantity: number;
}
/* -------------------------------------------------------------------------- */
/* Hero                                                                      */
/* -------------------------------------------------------------------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl">
      <div className="relative z-10 max-w-xl">
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-brand-900 sm:text-4xl">
          Votre liste scolaire
        </h1>
      </div>

    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Liste officielle                                                          */
/* -------------------------------------------------------------------------- */
function OfficialList({ schoolId, gradeId }: { schoolId: string; gradeId: string }) {
  const navigate = useNavigate();
  const { addMany, setContext } = useCart();
  const list = useQuery({
    queryKey: ['school-list', schoolId, gradeId],
    queryFn: () => fetchSchoolList(schoolId, gradeId),
  });

  const items = useMemo(() => list.data?.items ?? [], [list.data]);

  // Toutes les lignes sont sélectionnées par défaut ; l'utilisateur décoche
  // ce qu'il possède déjà (crayons, trousse, etc.)
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSelected(Object.fromEntries(items.map((i) => [i.id, true])));
  }, [items]);

  if (list.isLoading) return <Spinner label="Recherche de la liste officielle…" />;

  if (!list.data) {
    return (
      <Card className="rounded-3xl border border-brand-100">
        <Alert kind="info">Aucune liste officielle pour cette école et ce niveau.</Alert>
        <p className="mt-3 text-sm text-brand-500">
          Pas de souci : prenez votre liste en photo, envoyez-la en PDF, saisissez-la à la main
          (formulaire ci-dessous) ou composez votre panier directement depuis le catalogue.
        </p>
        <Link to="/catalogue" className="mt-3 inline-block">
          <Button variant="outline">Composer depuis le catalogue</Button>
        </Link>
      </Card>
    );
  }

  const selectedItems = items.filter((i) => selected[i.id]);
  const selectedCount = selectedItems.length;
  const total = selectedItems.reduce(
    (sum, i) => sum + i.quantity * Number(i.product?.price ?? 0),
    0,
  );
  const allSelected = items.length > 0 && selectedCount === items.length;

  const toggleItem = (id: string) =>
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleAll = () =>
    setSelected(Object.fromEntries(items.map((i) => [i.id, !allSelected])));

  const addSelection = () => {
    if (selectedCount === 0) return;
    track('ADD_TO_CART', { schoolId, gradeId, items: selectedCount, total });
    setContext({ schoolId, gradeId });
    addMany(
      selectedItems.map((i) => ({
        productId: i.productId ?? undefined,
        label: i.product?.name ?? i.label,
        quantity: i.quantity,
        unitPrice: Number(i.product?.price ?? 0),
      })),
      { schoolId, gradeId },
    );

    navigate('/panier');
  };

  return (
    <div className="squared-page p-8">
      <div className="flex items-center justify-center gap-2.5">
        <div className="flex items-center gap-2.5">
          <h2 className="handwritten-title">Liste officielle</h2>
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-brand-500">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          className="h-3.5 w-3.5 rounded accent-brand-600"
        />
        Tout sélectionner
      </label>
      <div className="mt-4 overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-brand-500">
              <th className="w-8 px-4 py-2" />
              <th className="px-4 py-2 font-semibold">Article</th>
              <th className="px-4 py-2 text-center font-semibold">Qté</th>
              <th className="px-4 py-2 text-right font-semibold">Prix</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => {
              const checked = Boolean(selected[i.id]);
              return (
                <tr
                  key={i.id}
                  onClick={() => toggleItem(i.id)}
                  className={`cursor-pointer transition ${checked ? '' : 'opacity-40'}`}
                >
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleItem(i.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded accent-brand-600"
                    />
                  </td>
                  <td className="px-4 py-2 text-brand-800">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-50">
                        {i.product?.imageUrl ? (
                          <img
                            src={i.product.imageUrl}
                            alt={i.product?.name ?? i.label}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Package className="h-4.5 w-4.5 text-brand-300" strokeWidth={1.75} />
                        )}
                      </span>
                      <span>{i.product?.name ?? i.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-center text-brand-600">{i.quantity}</td>
                  <td className="px-4 py-2.5 text-right text-brand-600">
                    {i.product ? formatMAD(Number(i.product.price) * i.quantity) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="sticky bottom-4 z-10 mt-4 flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-base font-bold text-brand-800">
          Total estimé ({selectedCount} article{selectedCount > 1 ? 's' : ''}) :{' '}
          <span style={{ color: TURQUOISE }}>{formatMAD(total)}</span>
        </span>
        <Button
          variant="accent"
          onClick={addSelection}
          disabled={selectedCount === 0}
          className="w-full sm:w-auto"
        >
          Ajouter la sélection au panier
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Contrôle segmenté — type d'envoi                                          */
/* -------------------------------------------------------------------------- */
const SOURCE_OPTIONS: { value: SchoolListSource; label: string; icon: typeof Camera }[] = [
  { value: 'CUSTOM_PHOTO', label: 'Photo', icon: Camera },
  { value: 'CUSTOM_FILE', label: 'PDF', icon: Paperclip },
  { value: 'CUSTOM_MANUAL', label: 'Saisie manuelle', icon: PenLine },
];

function SourceToggle({
  value,
  onChange,
}: {
  value: SchoolListSource;
  onChange: (v: SchoolListSource) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Comment souhaitez-vous l'envoyer ?"
      className="grid grid-cols-3 gap-1.5 rounded-2xl bg-brand-50 p-1.5"
    >
      {SOURCE_OPTIONS.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[11px] font-semibold leading-tight transition sm:flex-row sm:justify-center sm:gap-1.5 sm:text-sm ${active
              ? 'bg-white text-brand-700 shadow-sm ring-1 ring-brand-100'
              : 'text-brand-400 hover:text-brand-600'
              }`}
          >
            <o.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Zone d'upload (photo / pdf) — drag & drop, preview, états                 */
/* -------------------------------------------------------------------------- */
function UploadZone({
  kind,
  file,
  onFile,
}: {
  kind: 'photo' | 'pdf';
  file: File | null;
  onFile: (f: File | null) => void;
}) {
  const [dragActive, setDragActive] = useState(false);
  const inputId = kind === 'photo' ? 'upload-photo' : 'upload-pdf';
  const accept = kind === 'photo' ? 'image/*' : 'application/pdf';
  const capture = kind === 'photo' ? 'environment' : undefined;

  const previewUrl = useMemo(
    () => (file && kind === 'photo' ? URL.createObjectURL(file) : null),
    [file, kind],
  );
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) onFile(dropped);
      }}
      className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition ${dragActive
        ? 'border-brand-400 bg-brand-50'
        : file
          ? 'bg-white'
          : 'border-brand-200 bg-brand-50/40 hover:border-brand-300 hover:bg-brand-50'
        }`}
      style={file ? { borderColor: TURQUOISE } : undefined}
    >
      <input
        id={inputId}
        type="file"
        accept={accept}
        capture={capture}
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        aria-describedby={`${inputId}-hint`}
      />

      {file ? (
        <div className="flex flex-col items-center gap-2">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt=""
              className="h-20 w-20 rounded-xl object-cover ring-1 ring-brand-100"
            />
          ) : (
            <FileText className="h-10 w-10" strokeWidth={1.5} style={{ color: TURQUOISE }} />
          )}
          <p className="max-w-[220px] truncate text-sm font-semibold text-brand-800">{file.name}</p>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onFile(null); }}
            className="relative z-10 text-xs font-medium text-brand-400 underline-offset-2 hover:text-brand-600 hover:underline"
          >
            Changer de fichier
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-500 ring-1 ring-brand-100">
            {kind === 'photo' ? (
              <ImageIcon className="h-5 w-5" strokeWidth={1.75} />
            ) : (
              <FileUp className="h-5 w-5" strokeWidth={1.75} />
            )}
          </span>
          <p className="text-sm font-semibold text-brand-700">
            Cliquez pour ajouter {kind === 'photo' ? 'une photo' : 'un fichier'}
          </p>
          <p className="text-xs text-brand-400">ou glissez-déposez votre fichier ici</p>
          <p id={`${inputId}-hint`} className="text-xs text-brand-300">
            {kind === 'photo' ? 'JPG, PNG, HEIC · Max 10 Mo' : 'PDF · Max 10 Mo'}
          </p>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Select stylé (école / niveau)                                             */
/* -------------------------------------------------------------------------- */
function BrandSelect({
  icon: Icon,
  label,
  value,
  onChange,
  children,
}: {
  icon: typeof School;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-brand-700">
        <Icon className="h-4 w-4 text-brand-400" strokeWidth={1.75} />
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className="w-full appearance-none rounded-xl border border-brand-200 bg-white py-2.5 pl-3.5 pr-9 text-sm text-brand-800 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-300" />
      </div>
    </label>
  );
}



/* -------------------------------------------------------------------------- */
/* Formulaire "Envoyer ma propre liste"                                      */
/* -------------------------------------------------------------------------- */
function CustomListForm() {
  const navigate = useNavigate();
  const { addMany } = useCart();
  const schools = useQuery({ queryKey: ['schools'], queryFn: () => fetchSchools() });
  const grades = useQuery({ queryKey: ['grades'], queryFn: fetchGrades });

  const [source, setSource] = useState<SchoolListSource>('CUSTOM_PHOTO');
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [catalogueItems, setCatalogueItems] = useState<SelectedCatalogueItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const addCatalogueItem = (item: SelectedCatalogueItem) => {
    setCatalogueItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === item.productId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, item];
    });
  };

  const updateCatalogueQty = (productId: string, quantity: number) =>
    setCatalogueItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, quantity) } : i)),
    );

  const removeCatalogueItem = (productId: string) =>
    setCatalogueItems((prev) => prev.filter((i) => i.productId !== productId));

  const isManual = source === 'CUSTOM_MANUAL';
  const isValid = isManual ? rawText.trim().length > 0 : Boolean(file);

  const changeSource = (next: SchoolListSource) => {
    setSource(next);
    setError('');
  };

 const submit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setSubmitting(true);
  try {
    let fileUrl: string | undefined;
    if (!isManual) {
      if (!file) throw new Error('Merci de joindre une photo ou un fichier.');
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post<{ fileUrl: string }>('/uploads', form);
      fileUrl = data.fileUrl;
    }

    const { data: schoolList } = await api.post<{ id: string }>('/school-lists/custom', {
      source,
      fileUrl,
      rawText: isManual ? rawText : undefined,
      schoolId: schoolId || undefined,
      gradeId: gradeId || undefined,
      catalogueItems: catalogueItems.length
        ? catalogueItems.map((i) => ({ productId: i.productId, quantity: i.quantity }))
        : undefined,
    });

    addMany(
      [
        { label: 'Liste scolaire personnalisée (à chiffrer par un conseiller)', quantity: 1, unitPrice: 0 },
        ...catalogueItems.map((i) => ({
          productId: i.productId,
          label: i.name,
          quantity: i.quantity,
          unitPrice: i.price,
          imageUrl: i.imageUrl,
        })),
      ],
      { schoolId: schoolId || undefined, gradeId: gradeId || undefined, schoolListId: schoolList.id },
    );
    navigate('/panier');
  } catch (err) {
    setError(apiErrorMessage(err));
  } finally {
    setSubmitting(false);
  }
};

  return (
    <Card className="rounded-3xl border border-brand-100 ">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <FileUp className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <h2 className="text-lg font-bold text-brand-800">Envoyer ma propre liste</h2>
          <p className="mt-1 text-sm text-brand-500">
            Votre école n'est pas référencée ? Envoyez-nous la liste scolaire et notre équipe
            s'occupe du reste.
          </p>
        </div>
      </div>

      <div className="my-6 h-px bg-brand-100" />

      <form onSubmit={submit} className="space-y-5">
        <div>
          <span className="mb-1.5 block text-sm font-medium text-brand-700">
            Comment souhaitez-vous l'envoyer ?
          </span>
          <SourceToggle value={source} onChange={changeSource} />
        </div>

        {isManual ? (
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-brand-700">
              <PenLine className="h-4 w-4 text-brand-400" strokeWidth={1.75} />
              Votre liste (un article par ligne)
            </span>
            <textarea
              rows={5}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={'2 cahiers 96 pages\n1 trousse\n5 stylos bleus'}
              required
              className="w-full rounded-2xl border border-brand-200 bg-white p-3.5 text-sm text-brand-800 transition placeholder:text-brand-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </label>
        ) : (
          <div>
            <span className="mb-1.5 block text-sm font-medium text-brand-700">
              {source === 'CUSTOM_PHOTO' ? 'Photo de la liste' : 'Fichier PDF'}
            </span>
            <UploadZone kind={source === 'CUSTOM_PHOTO' ? 'photo' : 'pdf'} file={file} onFile={setFile} />
            {source === 'CUSTOM_PHOTO' && (
              <span className="mt-1.5 block text-xs text-brand-400">
                Sur téléphone, l'appareil photo s'ouvre pour photographier la liste.
              </span>
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <BrandSelect
            icon={School}
            label="École (optionnel)"
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
          >
            <option value="">—</option>
            {schools.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </BrandSelect>
          <BrandSelect
            icon={GraduationCap}
            label="Niveau / Classe (optionnel)"
            value={gradeId}
            onChange={(e) => setGradeId(e.target.value)}
          >
            <option value="">—</option>
            {grades.data?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </BrandSelect>
        </div>
        <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-brand-700">
                Produits du catalogue (optionnel)
              </span>
              <Button type="button" variant="outline" className="!px-3 !py-1.5 text-xs" onClick={() => setPickerOpen(true)}>
                + Ajouter un produit depuis le catalogue
              </Button>
            </div>

            {catalogueItems.length > 0 && (
              <div className="mt-3 space-y-2">
                {catalogueItems.map((i) => (
                  <div key={i.productId} className="flex items-center gap-3 rounded-xl border border-brand-100 p-2.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-50">
                      {i.imageUrl ? (
                        <img src={i.imageUrl} alt={i.name} className="h-full w-full object-contain" />
                      ) : (
                        <Package className="h-4 w-4 text-brand-300" strokeWidth={1.75} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-brand-800">{i.name}</p>
                      <p className="text-xs text-brand-500">{formatMAD(i.price * i.quantity)}</p>
                    </div>
                    <input
                      type="number"
                      min={1}
                      value={i.quantity}
                      onChange={(e) => updateCatalogueQty(i.productId, Number(e.target.value))}
                      className="w-14 rounded-lg border border-brand-200 px-2 py-1 text-center text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeCatalogueItem(i.productId)}
                      className="text-xs font-medium text-red-500 hover:underline"
                    >
                      Retirer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        {pickerOpen && (
            <ProductPickerModal
              onClose={() => setPickerOpen(false)}
              onAdd={(item) => addCatalogueItem(item)}
            />
          )}

        {error && <Alert>{error}</Alert>}

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" disabled={submitting || !isValid} className="order-2 w-full gap-2 sm:order-1 sm:w-auto">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                Envoi…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" strokeWidth={1.75} />
                Envoyer ma liste
              </>
            )}
          </Button>
          <span className="order-1 flex items-center gap-1.5 text-xs font-medium text-brand-400 sm:order-2">
            <Check className="h-3.5 w-3.5" style={{ color: TURQUOISE }} strokeWidth={2} />
            Réponse sous 12h
          </span>
        </div>
      </form>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                      */
/* -------------------------------------------------------------------------- */
export function SchoolListPage() {
  const [params] = useSearchParams();
  const schoolId = params.get('schoolId') ?? '';
  const gradeId = params.get('gradeId') ?? '';
  const hasSelection = useMemo(() => Boolean(schoolId && gradeId), [schoolId, gradeId]);

  return (
    <div className="space-y-8">
      <Hero />
      {hasSelection && <OfficialList schoolId={schoolId} gradeId={gradeId} />}
      <CustomListForm />
    </div>
  );
}
function ProductPickerModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (item: SelectedCatalogueItem) => void;
}) {
  const [search, setSearch] = useState('');
  const products = useQuery({
  queryKey: ['catalogue-products-picker', search],
  queryFn: () => fetchProducts({ search: search || undefined }),
});

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-brand-800">Ajouter depuis le catalogue</h3>
          <button type="button" onClick={onClose} className="text-brand-400 hover:text-brand-600">
            ✕
          </button>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit…"
          className="sticky mt-3 w-full rounded-xl border border-brand-200 px-3.5 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <div className="mt-4 space-y-2">
          {products.isLoading && <Spinner label="Recherche…" />}
          {products.data?.length === 0 && !products.isLoading && (
            <p className="py-6 text-center text-sm text-brand-400">Aucun produit trouvé.</p>
          )}
          {products.data?.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl border border-brand-100 p-2.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-50">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="h-full w-full object-contain" />
                ) : (
                  <Package className="h-4.5 w-4.5 text-brand-300" strokeWidth={1.75} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-brand-800">{p.name}</p>
                <p className="text-xs text-brand-500">{formatMAD(Number(p.price))}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="!px-3 !py-1.5 text-xs"
                onClick={() =>
                  onAdd({
                    productId: p.id,
                    name: p.name,
                    price: Number(p.price),
                    imageUrl: p.imageUrl,
                    quantity: 1,
                  })
                }
              >
                Ajouter
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}