import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { GraduationCap, MapPin } from 'lucide-react';

import { fetchSchool, fetchSchoolGrades } from '../lib/queries';
import { Button } from '../components/ui';

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

  return (

<section className="container mx-auto px-4 py-10">

    {school && (

        <>

            <div className="text-center">

                {school.logoUrl && (

                    <img
                        src={school.logoUrl}
                        className="mx-auto h-32 w-32 rounded-full border object-cover"
                    />

                )}

                <h1 className="mt-6 text-4xl font-bold">

                    {school.name}

                </h1>

                <p className="mt-3 flex items-center justify-center gap-2 text-gray-600">

                    <MapPin size={18}/>

                    {school.address}

                </p>

            </div>

            <div className="mt-14">

                <h2 className="mb-8 text-2xl font-bold">

                    Choisissez un niveau

                </h2>

                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

                    {grades.map((grade)=>(

                        <div
                            key={grade.id}
                            className="rounded-2xl border bg-white p-6 shadow-sm"
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
                                onClick={()=>navigate(
                                    `/listes?schoolId=${school.id}&gradeId=${grade.id}`
                                )}
                            >

                                Voir la liste

                            </Button>

                        </div>

                    ))}

                </div>

            </div>

        </>

    )}

</section>

);
}