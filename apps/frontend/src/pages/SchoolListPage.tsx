import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, apiErrorMessage } from '../lib/api';
import { fetchGrades, fetchSchoolList, fetchSchools } from '../lib/queries';
import { useCart } from '../store/cart';
import { formatMAD } from '../lib/format';
import { Alert, Button, Card, Field, Input, Select, Spinner, Textarea } from '../components/ui';
import type { SchoolListSource } from '../lib/types';

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
      <Alert kind="info">
        Aucune liste officielle pour cette école et ce niveau. Utilisez le formulaire ci-dessous
        pour nous envoyer votre liste.
      </Alert>
    );
  }

  const items = list.data.items ?? [];
  const total = items.reduce(
    (sum, i) => sum + i.quantity * Number(i.product?.price ?? 0),
    0,
  );

  const addAll = () => {
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
    <Card>
      <h2 className="text-lg font-bold text-brand-800">Liste officielle</h2>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-brand-100 text-left text-brand-500">
            <th className="py-2">Article</th>
            <th className="py-2 text-center">Qté</th>
            <th className="py-2 text-right">Prix</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id} className="border-b border-brand-50">
              <td className="py-2 text-brand-800">{i.product?.name ?? i.label}</td>
              <td className="py-2 text-center">{i.quantity}</td>
              <td className="py-2 text-right">
                {i.product ? formatMAD(Number(i.product.price) * i.quantity) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex items-center justify-between">
        <span className="font-bold text-brand-700">Total estimé : {formatMAD(total)}</span>
        <Button variant="accent" onClick={addAll}>
          Ajouter toute la liste au panier
        </Button>
      </div>
    </Card>
  );
}

const SOURCE_OPTIONS: { value: SchoolListSource; label: string }[] = [
  { value: 'CUSTOM_PHOTO', label: 'Photo de la liste' },
  { value: 'CUSTOM_FILE', label: 'Fichier (PDF)' },
  { value: 'CUSTOM_MANUAL', label: 'Saisie manuelle' },
];

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
      await api.post('/school-lists/custom', {
        source,
        fileUrl,
        rawText: source === 'CUSTOM_MANUAL' ? rawText : undefined,
        schoolId: schoolId || undefined,
        gradeId: gradeId || undefined,
      });
      addMany(
        [{ label: 'Liste scolaire personnalisée (à chiffrer par un conseiller)', quantity: 1, unitPrice: 0 }],
        { schoolId: schoolId || undefined, gradeId: gradeId || undefined },
      );
      navigate('/panier');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <h2 className="text-lg font-bold text-brand-800">Envoyer ma propre liste</h2>
      <p className="mt-1 text-sm text-brand-500">
        Votre école n'est pas référencée ? Envoyez la liste, un conseiller la chiffre et vous rappelle.
      </p>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <Field label="Comment souhaitez-vous l'envoyer ?">
          <Select value={source} onChange={(e) => setSource(e.target.value as SchoolListSource)}>
            {SOURCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        {source === 'CUSTOM_MANUAL' ? (
          <Field label="Votre liste (un article par ligne)">
            <Textarea
              rows={5}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={'2 cahiers 96 pages\n1 trousse\n5 stylos bleus'}
              required
            />
          </Field>
        ) : (
          <Field label={source === 'CUSTOM_PHOTO' ? 'Photo de la liste' : 'Fichier PDF'}>
            <Input
              type="file"
              accept={source === 'CUSTOM_PHOTO' ? 'image/*' : 'application/pdf'}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </Field>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="École (optionnel)">
            <Select value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
              <option value="">—</option>
              {schools.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Niveau (optionnel)">
            <Select value={gradeId} onChange={(e) => setGradeId(e.target.value)}>
              <option value="">—</option>
              {grades.data?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {error && <Alert>{error}</Alert>}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Envoi…' : 'Envoyer ma liste'}
        </Button>
      </form>
    </Card>
  );
}

export function SchoolListPage() {
  const [params] = useSearchParams();
  const schoolId = params.get('schoolId') ?? '';
  const gradeId = params.get('gradeId') ?? '';
  const hasSelection = useMemo(() => Boolean(schoolId && gradeId), [schoolId, gradeId]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-extrabold text-brand-900">Votre liste scolaire</h1>
      {hasSelection && <OfficialList schoolId={schoolId} gradeId={gradeId} />}
      <CustomListForm />
    </div>
  );
}
