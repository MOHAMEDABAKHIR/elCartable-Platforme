import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { GraduationCap, MapPin, Inbox } from 'lucide-react';

import { fetchSchool, fetchSchoolGrades } from '../lib/queries';
import { Button } from '../components/ui';
import { track } from '../lib/analytics';

export function SchoolPage() {
    const navigate = useNavigate();

    const { schoolId } = useParams<{
        schoolId: string;
    }>();

    const schoolQuery = useQuery({
        queryKey: ['school', schoolId],
        queryFn: () => fetchSchool(schoolId!),
        enabled: !!schoolId,
    });

    const gradesQuery = useQuery({
        queryKey: ['school-grades', schoolId],
        queryFn: () => fetchSchoolGrades(schoolId!),
        enabled: !!schoolId,
    });

    const school = schoolQuery.data;
    const grades = gradesQuery.data ?? [];
    const gradesLoaded = !gradesQuery.isLoading;

    return (

        <section className="container mx-auto px-4 py-10">

            {school && (

                <>

                    <div className="text-center">

                        {school.logoUrl && (

                            <img
                                src={school.logoUrl}
                                className="mx-auto h-32 object-contain"
                            />

                        )}

                        <h1 className="mt-6 text-4xl font-bold">

                            {school.name}

                        </h1>

                        <p className="mt-3 flex items-center justify-center gap-2 text-gray-600">

                            <MapPin size={18} />

                            {school.address}

                        </p>

                    </div>

                    <div className="mt-14">

                        <h2 className="mb-8 text-2xl font-bold">

                            Choisissez un niveau

                        </h2>

                        {gradesLoaded && grades.length === 0 ? (

                            <div className="rounded-2xl border bg-white p-10 text-center">

                                <Inbox className="mx-auto mb-4 text-brand-300" size={50} />

                                <h3 className="text-xl font-bold text-brand-900">
                                    Cette école n'a pas encore de niveau configuré 🙂
                                </h3>

                                <p className="mt-3 text-brand-600">
                                    Merci d'envoyer votre liste scolaire, un conseiller
                                    s'en occupera pour vous.
                                </p>

                                <Button
                                    className="mt-6"
                                    onClick={() => {
                                        track('CLICK', {
                                            action: 'send_custom_list_no_grades',
                                            schoolId: school.id,
                                            schoolName: school.name,
                                        });

                                        navigate('/listes');
                                    }}
                                >
                                    Envoyer ma liste scolaire
                                </Button>

                            </div>

                        ) : (

                            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 ">

                                {grades.map((grade) => (

                                    <div
                                        key={grade.id}
                                        className="rounded-sm border border-gray-300 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                                    >

                                        <GraduationCap
                                            size={40}
                                            className="mb-5 text-brand-500"
                                        />

                                        <h3 className="text-xl font-bold">

                                            {grade.name}

                                        </h3>

                                        <Button
                                            className="mt-6 w-full"
                                            onClick={() => {
                                                track('CLICK', {
                                                    action: 'select_grade',
                                                    schoolId: school.id,
                                                    schoolName: school.name,
                                                    gradeId: grade.id,
                                                    gradeName: grade.name,
                                                });

                                                navigate(`/listes?schoolId=${school.id}&gradeId=${grade.id}`);
                                            }}
                                        >

                                            Voir la liste

                                        </Button>

                                    </div>

                                ))}

                            </div>

                        )}

                    </div>

                </>

            )}

        </section>

    );
}