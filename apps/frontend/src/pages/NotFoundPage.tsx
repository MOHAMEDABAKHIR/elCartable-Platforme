import { Link } from 'react-router-dom';
import { Button } from '../components/ui';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-6xl font-black text-brand-300">404</p>
      <h1 className="mt-4 text-2xl font-bold text-brand-800">Page introuvable</h1>
      <p className="mt-2 text-brand-500">La page que vous cherchez n'existe pas ou a été déplacée.</p>
      <Link to="/" className="mt-6 inline-block">
        <Button variant="accent">Retour à l'accueil</Button>
      </Link>
    </div>
  );
}
