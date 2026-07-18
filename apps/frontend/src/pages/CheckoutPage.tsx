import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useCart } from '../store/cart';
import { createOrder } from '../lib/queries';
import { apiErrorMessage } from '../lib/api';
import { formatMAD } from '../lib/format';
import { Alert, Button, Card, Field, Input, Textarea } from '../components/ui';

interface CheckoutForm {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  note?: string;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalAmount, context } = useCart();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutForm>();

  if (items.length === 0) return <Navigate to="/panier" replace />;

  const onSubmit = async (values: CheckoutForm) => {
    setError('');
    try {
      const order = await createOrder({
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        customerEmail: values.customerEmail || undefined,
        deliveryAddress: values.deliveryAddress,
        note: values.note || undefined,
        schoolId: context.schoolId,
        gradeId: context.gradeId,
        items: items.map((i) => ({
          productId: i.productId,
          label: i.label,
          quantity: i.quantity,
          unitPrice: i.productId ? undefined : i.unitPrice,
        })),
      });
      navigate('/commande/confirmee', { state: { order } });
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-brand-900">Finaliser ma commande</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Nom complet" error={errors.customerName?.message}>
              <Input {...register('customerName', { required: 'Nom requis', minLength: { value: 2, message: 'Nom trop court' } })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Téléphone" error={errors.customerPhone?.message}>
                <Input
                  {...register('customerPhone', {
                    required: 'Téléphone requis',
                    minLength: { value: 9, message: 'Numéro invalide' },
                  })}
                  placeholder="0612345678"
                />
              </Field>
              <Field label="Email (optionnel)" error={errors.customerEmail?.message}>
                <Input type="email" {...register('customerEmail')} />
              </Field>
            </div>
            <Field label="Adresse de livraison" error={errors.deliveryAddress?.message}>
              <Textarea rows={2} {...register('deliveryAddress', { required: 'Adresse requise' })} />
            </Field>
            <Field label="Note (optionnel)">
              <Textarea rows={2} {...register('note')} placeholder="Précisions sur la livraison, horaires…" />
            </Field>
            {error && <Alert>{error}</Alert>}
            <Button type="submit" variant="accent" disabled={isSubmitting}>
              {isSubmitting ? 'Envoi…' : 'Confirmer la commande'}
            </Button>
          </form>
        </Card>

        <Card className="h-fit">
          <h2 className="font-bold text-brand-800">Votre commande</h2>
          <ul className="mt-3 space-y-2 text-sm text-brand-600">
            {items.map((i, idx) => (
              <li key={idx} className="flex justify-between">
                <span>
                  {i.quantity} × {i.label}
                </span>
                <span>{formatMAD(i.unitPrice * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-brand-100 pt-4 font-bold text-brand-800">
            <span>Total</span>
            <span>{formatMAD(totalAmount)}</span>
          </div>
          <p className="mt-3 text-xs text-brand-500">Paiement à la livraison. Un conseiller vous appellera pour confirmer.</p>
        </Card>
      </div>
    </div>
  );
}
