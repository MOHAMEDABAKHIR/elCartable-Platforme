import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchFeaturedSchools } from '../lib/queries';
import schoolDefaultImage from '../../public/wizarat-tarbiya-logo.png';

export default function FeaturedSchoolCards() {
    const featured = useQuery({
        queryKey: ['schools', 'featured'],
        queryFn: fetchFeaturedSchools,
    });

    if (featured.isLoading || !featured.data || featured.data.length === 0) return null;

    return (
        <div className="mb-6 sm:mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.data.map((school) => (
                <Link
                    key={school.id}
                    to={`/ecoles/${school.id}`}
                    className="flex items-center gap-2 rounded-sm border border-gray-300 bg-white p-6 transition hover:-translate-y-1  hover:border-brand-400"
                >
                    <div className="content-center">
                        <img
                            src={school.logoUrl || (schoolDefaultImage as string)}
                            alt={school.name}
                            className="h-20 object-contain"
                        />

                        <span className="text-sm font-light text-brand-800">
                            {school.name}
                        </span>
                    </div>
                </Link>
            ))}
        </div>
    );
}   