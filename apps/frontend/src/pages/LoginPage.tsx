import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../store/auth';
import { apiErrorMessage } from '../lib/api';
import { Alert, Button, Card, Field, Input } from '../components/ui';

interface LoginForm {
  email: string;
  password: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const { login } = useAuth();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();

  const onSubmit = async (values: LoginForm) => {
    setError('');
    try {
      await login(values.email, values.password);
      navigate(location.state?.from ?? '/admin', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Identifiants invalides.'));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-100 px-4">
      <Card className="w-full max-w-sm">
        <Link to="/" className="mb-6 block text-center text-xl font-extrabold text-brand-800">
          el<span className="text-accent-400">Cartable</span>
        </Link>
        <h1 className="text-lg font-bold text-brand-800">Espace professionnel</h1>
        <p className="mb-4 text-sm text-brand-500">Réservé aux commerciaux et administrateurs.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" {...register('email', { required: 'Email requis' })} autoComplete="username" />
          </Field>
          <Field label="Mot de passe" error={errors.password?.message}>
            <Input
              type="password"
              {...register('password', { required: 'Mot de passe requis', minLength: { value: 8, message: '8 caractères minimum' } })}
              autoComplete="current-password"
            />
          </Field>
          {error && <Alert>{error}</Alert>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Connexion…' : 'Se connecter'}
          </Button>
        </form>
        <Link to="/" className="mt-4 block text-center text-xs text-brand-500 hover:underline">
          ← Retour au site
        </Link>
      </Card>
    </div>
  );
}
