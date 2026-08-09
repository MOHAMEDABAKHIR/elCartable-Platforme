import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Backpack,
  BookOpen,
  Camera,
  Check,
  ChevronDown,
  FileText,
  FileUp,
  GraduationCap,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  PenLine,
  School,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { api, apiErrorMessage } from '../lib/api';
import { fetchGrades, fetchSchoolList, fetchSchools } from '../lib/queries';
import { useCart } from '../store/cart';
import { formatMAD } from '../lib/format';
import { Alert, Button, Card, Spinner } from '../components/ui';
import type { SchoolListSource } from '../lib/types';
import { track } from '../lib/analytics';

/* -------------------------------------------------------------------------- */
/* Design tokens (elCartable) — violet primaire · turquoise #56BFB5 · jaune   */
/* -------------------------------------------------------------------------- */
const TURQUOISE = '#56BFB5';

/* -------------------------------------------------------------------------- */
/* Hero                                                                      */
/* -------------------------------------------------------------------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-violet-50 via-white to-white px-6 py-10 sm:px-10 sm:py-12">
      <div className="relative z-10 max-w-xl">
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-brand-900 sm:text-4xl">
          Votre liste scolaire
        </h1>
        <p className="mt-2.5 text-base text-brand-500 sm:text-lg">
          Nous préparons tout pour vous faciliter la rentrée <span aria-hidden>🎒</span>
        </p>
      </div>

      {/* Illustration décorative — masquée sur mobile pour garder le hero compact */}
      <div className="pointer-events-none absolute -right-4 top-1/2 hidden -translate-y-1/2 sm:block">
        <div className="relative h-40 w-40">
          <div
            className="absolute inset-0 rounded-[42%_58%_58%_42%/50%_42%_58%_50%]"
            style={{ backgroundColor: `${TURQUOISE}1A` }}
          />
          <Backpack className="absolute left-7 top-7 h-16 w-16 text-brand-400" strokeWidth={1.4} />
          <BookOpen
            className="absolute bottom-5 right-9 h-10 w-10"
            strokeWidth={1.4}
            style={{ color: TURQUOISE }}
          />
          <PenLine className="absolute right-4 top-3 h-8 w-8 text-amber-400" strokeWidth={1.4} />
        </div>
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

  if (list.isLoading) return <Spinner label="Recherche de la liste officielle…" />;

  if (!list.data) {
    return (
      <Card className="rounded-3xl border border-brand-100 shadow-sm">
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

  const items = list.data.items ?? [];
  const total = items.reduce(
    (sum, i) => sum + i.quantity * Number(i.product?.price ?? 0),
    0,
  );

  const addAll = () => {
    track('ADD_TO_CART', { schoolId, gradeId, items: items.length, total });
    setContext({ schoolId, gradeId });
    addMany(
      items.map((i) => ({
        productId: i.productId ?? undefined,
        label: i.product?.name ?? i.label,
        quantity: i.quantity,
        unitPrice: Number(i.product?.price ?? 0),
      })),
      { schoolId, gradeId },
    );
    setContext({ schoolId, gradeId });
    navigate('/panier');
  };

  return (
    <Card className="rounded-3xl border border-brand-100 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <ShieldCheck className="h-4.5 w-4.5" strokeWidth={1.75} />
        </span>
        <h2 className="text-lg font-bold text-brand-800">Liste officielle</h2>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-brand-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-100 bg-brand-50/60 text-left text-brand-500">
              <th className="px-4 py-2.5 font-semibold">Article</th>
              <th className="px-4 py-2.5 text-center font-semibold">Qté</th>
              <th className="px-4 py-2.5 text-right font-semibold">Prix</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b border-brand-50 last:border-0">
                <td className="px-4 py-2.5 text-brand-800">{i.product?.name ?? i.label}</td>
                <td className="px-4 py-2.5 text-center text-brand-600">{i.quantity}</td>
                <td className="px-4 py-2.5 text-right text-brand-600">
                  {i.product ? formatMAD(Number(i.product.price) * i.quantity) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-bold text-brand-700">Total estimé : {formatMAD(total)}</span>
        <Button variant="accent" onClick={addAll} className="w-full sm:w-auto">
          Ajouter toute la liste au panier
        </Button>
      </div>
    </Card>
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
            className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[11px] font-semibold leading-tight transition sm:flex-row sm:justify-center sm:gap-1.5 sm:text-sm ${
              active
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
      className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition ${
        dragActive
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
          className="w-full appearance-none rounded-xl border border-brand-200 bg-white py-2.5 pl-3.5 pr-9 text-sm text-brand-800 shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
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
      if (source !== 'CUSTOM_MANUAL') {
        if (!file) throw new Error('Merci de joindre une photo ou un fichier.');
        const form = new FormData();
        form.append('file', file);
        const { data } = await api.post<{ fileUrl: string }>('/uploads', form);
        fileUrl = data.fileUrl;
      }

      const { data: schoolList } = await api.post<{ id: string }>('/school-lists/custom', {
        source,
        fileUrl,
        rawText: source === 'CUSTOM_MANUAL' ? rawText : undefined,
        schoolId: schoolId || undefined,
        gradeId: gradeId || undefined,
      });

      addMany(
        [{ label: 'Liste scolaire personnalisée (à chiffrer par un conseiller)', quantity: 1, unitPrice: 0 }],
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
    <Card className="rounded-3xl border border-brand-100 shadow-sm">
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
              className="w-full rounded-2xl border border-brand-200 bg-white p-3.5 text-sm text-brand-800 shadow-sm transition placeholder:text-brand-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
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