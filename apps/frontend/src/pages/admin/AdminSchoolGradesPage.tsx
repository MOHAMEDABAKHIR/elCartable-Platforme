import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Pencil } from 'lucide-react';
import { apiErrorMessage } from '../../lib/api';
import { fetchSchoolsAdmin, fetchGradesAdmin, getSchoolGrades, setSchoolGrades } from '../../lib/queries';
import { Alert, Badge, Button, Card, EmptyState, Input, Spinner } from '../../components/ui';
import { Pagination } from '../../components/Pagination';
import type { School, Grade } from '../../lib/types';

const PAGE_SIZE = 20;

export function AdminSchoolGradesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);

  const schools = useQuery({
    queryKey: ['schools', 'admin', page, search],
    queryFn: () => fetchSchoolsAdmin({ page, limit: PAGE_SIZE, search: search || undefined }),
    placeholderData: (previous) => previous,
  });

  const allGrades = useQuery({
    queryKey: ['grades', 'admin'],
    queryFn: fetchGradesAdmin,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-brand-900">Écoles &amp; niveaux</h1>

      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Rechercher une école..."
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
                <th className="px-4 py-3">École</th>
                <th className="px-4 py-3">Ville</th>
                <th className="px-4 py-3">Niveaux associés</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {schools.data.data.map((s) => (
                <SchoolRow key={s.id} school={s} onEdit={() => setEditingSchool(s)} />
              ))}
            </tbody>
          </table>
          <Pagination meta={schools.data.meta} onPageChange={setPage} />
        </Card>
      ) : (
        <EmptyState title="Aucune école" description="Aucun résultat pour cette recherche." />
      )}

      {editingSchool && allGrades.data && (
        <EditGradesModal
          school={editingSchool}
          allGrades={allGrades.data}
          onClose={() => setEditingSchool(null)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['school-grades', editingSchool.id] });
            setEditingSchool(null);
          }}
        />
      )}
    </div>
  );
}

function SchoolRow({ school, onEdit }: { school: School; onEdit: () => void }) {
  const gradesQuery = useQuery({
    queryKey: ['school-grades', school.id],
    queryFn: () => getSchoolGrades(school.id),
  });

  return (
    <tr className="border-b border-brand-50 align-top">
      <td className="px-4 py-3 font-medium text-brand-800">{school.name}</td>
      <td className="px-4 py-3 text-brand-500">{school.city ?? '—'}</td>
      <td className="px-4 py-3">
        {gradesQuery.isLoading ? (
          <span className="text-brand-400">…</span>
        ) : gradesQuery.data && gradesQuery.data.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {gradesQuery.data.map((g) => (
              <Badge key={g.id} className="bg-brand-100 text-brand-700">
                {g.name}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-brand-400">Aucun niveau</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <button onClick={onEdit} className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
          <Pencil size={14} /> Modifier
        </button>
      </td>
    </tr>
  );
}

function EditGradesModal({
  school,
  allGrades,
  onClose,
  onSaved,
}: {
  school: School;
  allGrades: Grade[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const currentGrades = useQuery({
    queryKey: ['school-grades', school.id],
    queryFn: () => getSchoolGrades(school.id),
  });

  const [selected, setSelected] = useState<string[] | null>(null);
  const [error, setError] = useState('');

  // Initialise la sélection une fois les niveaux actuels chargés.
  const selectedIds = selected ?? currentGrades.data?.map((g) => g.id) ?? [];

  const saveMutation = useMutation({
    mutationFn: () => setSchoolGrades(school.id, selectedIds),
    onSuccess: onSaved,
    onError: (err) => setError(apiErrorMessage(err)),
  });

  function toggle(id: string) {
    const base = selected ?? currentGrades.data?.map((g) => g.id) ?? [];
    setSelected(base.includes(id) ? base.filter((g) => g !== id) : [...base, id]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-md">
        <h2 className="font-bold text-brand-800">Niveaux — {school.name}</h2>

        {currentGrades.isLoading ? (
          <Spinner />
        ) : (
          <div className="mt-4 max-h-80 space-y-2 overflow-auto">
            {allGrades.map((g) => (
              <label key={g.id} className="flex items-center gap-2 text-sm text-brand-700">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(g.id)}
                  onChange={() => toggle(g.id)}
                />
                {g.name}
              </label>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-3">
            <Alert>{error}</Alert>
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="accent"
            disabled={saveMutation.isPending}
            onClick={() => {
              setError('');
              saveMutation.mutate();
            }}
          >
            {saveMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </Card>
    </div>
  );
}