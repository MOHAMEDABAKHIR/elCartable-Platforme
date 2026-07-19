import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../store/auth';
import { apiErrorMessage } from '../lib/api';
import { Alert, Button, Card, Field, Input } from '../components/ui';

interface ActivateForm {
  email: string;
  invitationCode: string;
  newPassword: string;
  confirmPassword: string;
}

export function ActivateInvitationPage() {
  const navigate = useNavigate();
  const { activateInvitation } = useAuth();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ActivateForm>();

  const newPassword = watch('newPassword');

  const onSubmit = async (values: ActivateForm) => {
    setError('');
    try {
      await activateInvitation(values.email, values.invitationCode.trim().toUpperCase(), values.newPassword);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "Code d'invitation invalide ou expiré."));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-100 px-4">
      <Card className="w-full max-w-sm">
        <Link to="/" className="mb-6 block text-center text-xl font-extrabold text-brand-800">
          el<span className="text-accent-400">Cartable</span>
        </Link>
        <h1 className="text-lg font-bold text-brand-800">Activer mon compte</h1>
        <p className="mb-4 text-sm text-brand-500">
          Vous avez reçu un code d'invitation d'un administrateur ? Saisissez-le ci-dessous avec
          votre email pour définir votre mot de passe et activer votre compte.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" {...register('email', { required: 'Email requis' })} autoComplete="username" />
          </Field>
          <Field label="Code d'invitation" error={errors.invitationCode?.message}>
            <Input
              {...register('invitationCode', { required: "Code d'invitation requis" })}
              placeholder="ex: A1B2C3D4"
              autoComplete="off"
            />
          </Field>
          <Field label="Nouveau mot de passe" error={errors.newPassword?.message}>
            <Input
              type="password"
              {...register('newPassword', {
                required: 'Mot de passe requis',
                minLength: { value: 8, message: '8 caractères minimum' },
                pattern: {
                  value: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Doit contenir une majuscule, une minuscule et un chiffre',
                },
              })}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirmer le mot de passe" error={errors.confirmPassword?.message}>
            <Input
              type="password"
              {...register('confirmPassword', {
                required: 'Confirmation requise',
                validate: (value) => value === newPassword || 'Les mots de passe ne correspondent pas',
              })}
              autoComplete="new-password"
            />
          </Field>
          {error && <Alert>{error}</Alert>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Activation…' : 'Activer mon compte'}
          </Button>
        </form>
        <Link to="/connexion" className="mt-4 block text-center text-xs text-brand-500 hover:underline">
          J'ai déjà un mot de passe — se connecter
        </Link>
      </Card>
    </div>
  );
}
