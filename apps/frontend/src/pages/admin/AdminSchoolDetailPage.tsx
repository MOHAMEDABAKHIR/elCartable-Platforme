import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { api, apiErrorMessage } from '../../lib/api';
import {
  fetchSchool,
  getSchoolGrades,
  setSchoolGrades,
  fetchGradesAdmin,
  fetchSchoolList,
  deactivateOfficialList,
} from '../../lib/queries';
import { Alert, Badge, Button, Card, Input, Spinner } from '../../components/ui';
import type { Grade } from '../../lib/types';

export function AdminSchoolDetailPage() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  // --- École (infos + adresse éditable) ---
  const school = useQuery({
    queryKey: ['school', schoolId],
    queryFn: () => fetchSchool(schoolId!),
    enabled: Boolean(schoolId),
  });

  const [editingAddress, setEditingAddress] = useState(false);
  const [addressDraft, setAddressDraft] = useState('');

  const updateAddressMutation = useMutation({
    mutationFn: (address: string) => api.patch(`/schools/${schoolId}`, { address }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school', schoolId] });
      setEditingAddress(false);
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  // --- Niveaux associés ---
  const schoolGrades = useQuery({
    queryKey: ['school-grades', schoolId],
    queryFn: () => getSchoolGrades(schoolId!),
    enabled: Boolean(schoolId),
  });

  const allGrades = useQuery({ queryKey: ['grades', 'admin'], queryFn: fetchGradesAdmin });

  const [editingGrades, setEditingGrades] = useState(false);
  const [gradesDraft, setGradesDraft] = useState<string[] | null>(null);
  const selectedGradeIds = gradesDraft ?? schoolGrades.data?.map((g) => g.id) ?? [];

  const saveGradesMutation = useMutation({
    mutationFn: () => setSchoolGrades(schoolId!, selectedGradeIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-grades', schoolId] });
      setEditingGrades(false);
      setGradesDraft(null);
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  function toggleGrade(id: string) {
    const base = gradesDraft ?? schoolGrades.data?.map((g) => g.id) ?? [];
    setGradesDraft(base.includes(id) ? base.filter((g) => g !== id) : [...base, id]);
  }

  if (school.isLoading) return <Spinner />;
  if (!school.data) return <Alert>École introuvable.</Alert>;

  return (
    <div className="space-y-6">
      <Link to="/admin/ecoles" className="inline-flex items-center gap-1 text-sm text-brand-500 hover:underline">
        <ArrowLeft size={14} /> Retour aux écoles
      </Link>

      {error && <Alert>{error}</Alert>}

      {/* --- En-tête école --- */}
      <Card>
        <div className="flex items-start gap-4">
          {school.data.logoUrl ? (
            <img src={school.data.logoUrl} alt={school.data.name} className="h-14 w-14 rounded-lg object-contain" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-brand-100 text-brand-400">—</div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-brand-900">{school.data.name}</h1>
            <p className="text-sm text-brand-500">{school.data.city ?? 'Ville non renseignée'}</p>

            <div className="mt-3">
              {editingAddress ? (
                <div className="flex max-w-md items-center gap-2">
                  <Input
                    value={addressDraft}
                    onChange={(e) => setAddressDraft(e.target.value)}
                    placeholder="Adresse"
                    autoFocus
                  />
                  <Button
                    variant="accent"
                    disabled={updateAddressMutation.isPending}
                    onClick={() => {
                      setError('');
                      updateAddressMutation.mutate(addressDraft);
                    }}
                  >
                    OK
                  </Button>
                  <Button variant="ghost" onClick={() => setEditingAddress(false)}>
                    Annuler
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAddressDraft(school.data!.address ?? '');
                    setEditingAddress(true);
                  }}
                  className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
                >
                  <Pencil size={13} />
                  {school.data.address ?? 'Ajouter une adresse'}
                </button>
              )}
            </div>
          </div>
          <Badge className={school.data.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
            {school.data.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </Card>

      {/* --- Niveaux --- */}
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-brand-800">Niveaux</h2>
          {!editingGrades && (
            <button
              onClick={() => setEditingGrades(true)}
              className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
            >
              <Pencil size={13} /> Modifier
            </button>
          )}
        </div>

        {schoolGrades.isLoading || allGrades.isLoading ? (
          <Spinner />
        ) : editingGrades ? (
          <>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {allGrades.data?.map((g) => (
                <label key={g.id} className="flex items-center gap-2 text-sm text-brand-700">
                  <input type="checkbox" checked={selectedGradeIds.includes(g.id)} onChange={() => toggleGrade(g.id)} />
                  {g.name}
                </label>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                variant="accent"
                disabled={saveGradesMutation.isPending}
                onClick={() => {
                  setError('');
                  saveGradesMutation.mutate();
                }}
              >
                {saveGradesMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setEditingGrades(false);
                  setGradesDraft(null);
                }}
              >
                Annuler
              </Button>
            </div>
          </>
        ) : schoolGrades.data && schoolGrades.data.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {schoolGrades.data.map((g) => (
              <Badge key={g.id} className="bg-brand-100 text-brand-700">
                {g.name}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-brand-400">Aucun niveau associé.</p>
        )}
      </Card>

      {/* --- Listes officielles par niveau --- */}
      <Card>
        <h2 className="font-bold text-brand-800">Listes officielles</h2>
        {!schoolGrades.data || schoolGrades.data.length === 0 ? (
          <p className="mt-3 text-sm text-brand-400">
            Associez d'abord un niveau à cette école pour créer une liste.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-brand-50">
            {schoolGrades.data.map((g) => (
              <GradeListRow key={g.id} schoolId={schoolId!} grade={g} onError={setError} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function GradeListRow({
  schoolId,
  grade,
  onError,
}: {
  schoolId: string;
  grade: Grade;
  onError: (msg: string) => void;
}) {
  const queryClient = useQueryClient();
  const list = useQuery({
    queryKey: ['school-list', schoolId, grade.id],
    queryFn: () => fetchSchoolList(schoolId, grade.id),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deactivateOfficialList(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['school-list', schoolId, grade.id] }),
    onError: (err) => onError(apiErrorMessage(err)),
  });

  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div>
        <p className="font-medium text-brand-800">{grade.name}</p>
        {list.isLoading ? (
          <p className="text-xs text-brand-400">…</p>
        ) : list.data ? (
          <p className="text-xs text-brand-500">{list.data.items.length} article(s)</p>
        ) : (
          <p className="text-xs text-brand-400">Aucune liste officielle</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Link
          to={`/admin/listes-officielles/nouvelle?schoolId=${schoolId}&gradeId=${grade.id}`}
          className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
        >
          <Pencil size={13} /> {list.data ? 'Modifier' : 'Créer'}
        </Link>
        {list.data && (
          <button
            onClick={() => {
              if (confirm('Désactiver cette liste officielle ?')) {
                deleteMutation.mutate(list.data!.id);
              }
            }}
            disabled={deleteMutation.isPending}
            className="inline-flex items-center gap-1 text-sm text-red-500 hover:underline"
          >
            <Trash2 size={13} /> Supprimer
          </button>
        )}
      </div>
    </li>
  );
}