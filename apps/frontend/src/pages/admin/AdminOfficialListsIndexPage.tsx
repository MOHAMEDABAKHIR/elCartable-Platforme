import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '../../lib/api';
import { fetchOfficialListsAdmin, deactivateOfficialList } from '../../lib/queries';
import { Alert, Badge, Button, Card, EmptyState, Input, Spinner } from '../../components/ui';
import { Pagination } from '../../components/Pagination';

const PAGE_SIZE = 20;

export function AdminOfficialListsIndexPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [error, setError] = useState('');

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    const lists = useQuery({
        queryKey: ['school-lists', 'official', 'admin', page, debouncedSearch],
        queryFn: () => fetchOfficialListsAdmin({ page, limit: PAGE_SIZE, search: debouncedSearch || undefined }),
        placeholderData: (previous) => previous,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deactivateOfficialList(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['school-lists', 'official', 'admin'] }),
        onError: (err) => setError(apiErrorMessage(err)),
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-brand-900">Listes officielles</h1>
                    <p className="text-sm text-brand-500">Listes déjà importées depuis le catalogue, par école et niveau.</p>
                </div>
                <Link to="/admin/listes-officielles/nouvelle">
                    <Button variant="accent">Nouvelle liste</Button>
                </Link>
            </div>

            <div className="relative max-w-sm">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher par école ou niveau..."
                    className="pl-9"
                />
            </div>

            {error && <Alert>{error}</Alert>}

            {lists.isLoading ? (
                <Spinner />
            ) : lists.data && lists.data.data.length > 0 ? (
                <Card className="overflow-x-auto p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-brand-100 text-left text-brand-500">
                                <th className="px-4 py-3">École</th>
                                <th className="px-4 py-3">Niveau</th>
                                <th className="px-4 py-3 text-center">Articles</th>
                                <th className="px-4 py-3">Mise à jour</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {lists.data.data.map((list) => (
                                <tr key={list.id} className="border-b border-brand-50">
                                    <td className="px-4 py-3 font-medium text-brand-800">{list.school?.name ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        {list.grade?.name ? (
                                            <Badge className="bg-brand-100 text-brand-700">{list.grade.name}</Badge>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center text-brand-600">{list.items.length}</td>
                                    <td className="px-4 py-3 text-brand-500">
                                        {list.updatedAt ? new Date(list.updatedAt).toLocaleDateString('fr-FR') : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-3">
                                            <Link
                                                to={`/admin/ecoles/${list.schoolId}`}
                                                className="text-sm text-brand-600 hover:underline"
                                            >
                                                Voir la fiche école
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Désactiver cette liste officielle ?')) {
                                                        setError('');
                                                        deleteMutation.mutate(list.id);
                                                    }
                                                }}
                                                className="inline-flex items-center gap-1 text-sm text-red-500 hover:underline"
                                                disabled={deleteMutation.isPending}
                                            >
                                                <Trash2 size={14} /> Supprimer
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination meta={lists.data.meta} onPageChange={setPage} />
                </Card>
            ) : (
                <EmptyState
                    title="Aucune liste officielle"
                    description={debouncedSearch ? 'Aucun résultat pour cette recherche.' : 'Créez votre première liste officielle.'}
                />
            )}
        </div>
    );
}