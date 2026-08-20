import { useEffect, useState } from 'react';
import { trackOrder } from '../lib/queries';
import { apiErrorMessage } from '../lib/api';
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  formatMAD,
  orderStatusColor,
} from '../lib/format';
import {
  getLocalOrderHistory,
  saveOrderToHistory,
  removeOrderFromHistory,
  type LocalOrderReference,
} from '../lib/orderHistory';
import { Alert, Badge, Button, Card, Field, Input, Spinner } from '../components/ui';
import { SupportCTA } from '../components/SupportCTA';
import type { Order } from '../lib/types';

/* ------------------------------------------------------------------ */
/*  Small inline icons (no extra dependency)                          */
/* ------------------------------------------------------------------ */

function CheckIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M4 10.5 8 14.5 16 6"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CopyIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" strokeWidth={1.6} />
      <path
        d="M4.5 13V5a1.5 1.5 0 0 1 1.5-1.5h8"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M5 7.5 10 12.5 15 7.5"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TruckIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M2 5h9v8H2zM11 8h3.5L16 10v3h-4.5V8Z"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <circle cx="5.5" cy="14.5" r="1.4" stroke="currentColor" strokeWidth={1.4} />
      <circle cx="13" cy="14.5" r="1.4" stroke="currentColor" strokeWidth={1.4} />
    </svg>
  );
}

function PhoneIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M6 2.5c1 2 1.6 3 1 4-.9.9-1.5 1-.6 2.6C7.5 11 9 12.5 10.9 13.6c1.6.9 1.7.3 2.6-.6 1-1 2 -.4 4 .6.4 2.2.1 3.1-.7 3.7-1 .8-2.6.7-4.5-.1-2.2-.9-4.4-2.7-6.1-4.4C4.5 10.4 2.7 8.2 1.8 6c-.8-1.9-.9-3.5-.1-4.5.6-.8 1.5-1.1 3.7-.7"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BoxIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M2.5 6 10 2.5 17.5 6 10 9.5 2.5 6Zm0 0v8L10 17.5m0-8v8m0-8 7.5-3.5v8L10 17.5"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HomeIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M3 9.5 10 3l7 6.5M4.8 8v8.5h10.4V8"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Icon shown for the CURRENT step only, indexed by its position in
// ORDER_STATUS_FLOW. Falls back to a neutral dot if the flow grows.
const STEP_ICONS = [CheckIcon, PhoneIcon, PhoneIcon, CheckIcon, BoxIcon, BoxIcon, TruckIcon, HomeIcon];

function getStepIcon(idx: number) {
  return STEP_ICONS[idx] ?? CheckIcon;
}

/* ------------------------------------------------------------------ */
/*  Timeline                                                           */
/* ------------------------------------------------------------------ */

function StatusTimeline({ order }: { order: Order }) {
  if (order.status === 'CANCELLED') {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
          ✕
        </span>
        <div>
          <p className="font-semibold text-red-700">Commande annulée</p>
          <p className="mt-0.5 text-sm text-red-500/80">
            Cette commande ne sera pas traitée. Contactez-nous si vous pensez
            qu'il s'agit d'une erreur.
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(order.status);

  return (
    <ol>
      {ORDER_STATUS_FLOW.map((status, idx) => {
        const done = idx < currentIndex;
        const current = idx === currentIndex;
        const isLast = idx === ORDER_STATUS_FLOW.length - 1;
        const Icon = getStepIcon(idx);

        return (
          <li key={status} className="relative flex gap-4 pb-7 last:pb-0">
            {!isLast && (
              <span
                aria-hidden
                className={`absolute left-[15px] top-8 h-[calc(100%-1.75rem)] w-0.5 rounded-full transition-colors duration-500 ${
                  done ? 'bg-brand-500' : 'bg-brand-100'
                }`}
              />
            )}

            <span
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300 ${
                done || current
                  ? 'border-brand-500 bg-brand-500 text-white'
                  : 'border-brand-100 bg-white text-brand-300'
              } ${current ? 'ring-4 ring-brand-100' : ''}`}
            >
              {done ? (
                <CheckIcon className="h-4 w-4" />
              ) : current ? (
                <Icon className="h-4 w-4" />
              ) : (
                idx + 1
              )}
            </span>

            <div className="flex-1 pt-1">
              <p className={`text-sm ${done || current ? 'font-semibold text-brand-800' : 'text-brand-400'}`}>
                {ORDER_STATUS_LABELS[status]}
              </p>
              {current && (
                <p className="mt-0.5 text-xs font-medium text-brand-500">Étape en cours</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/*  Order card                                                         */
/* ------------------------------------------------------------------ */

function OrderCard({
  order,
  onRemove,
}: {
  order: Order;
  onRemove: (orderId: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const currentIndex = ORDER_STATUS_FLOW.indexOf(order.status);
  const isCancelled = order.status === 'CANCELLED';
  const progressPct = isCancelled
    ? 0
    : Math.round(((currentIndex + 1) / ORDER_STATUS_FLOW.length) * 100);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard API unavailable — fail silently, it's a nice-to-have.
    }
  };

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-brand-500">Commande</p>

          <div className="mt-0.5 flex items-center gap-2">
            <p className="text-lg font-bold text-brand-800">{order.orderNumber}</p>

            <button
              type="button"
              onClick={handleCopy}
              className="flex h-6 w-6 items-center justify-center rounded-md text-brand-400 transition-colors hover:bg-brand-50 hover:text-brand-700"
              aria-label="Copier le numéro de commande"
            >
              {copied ? <CheckIcon className="h-3.5 w-3.5 text-emerald-600" /> : <CopyIcon className="h-3.5 w-3.5" />}
            </button>
          </div>

          <p className="mt-1 text-sm text-brand-500">
            {new Intl.DateTimeFormat('fr-MA', { dateStyle: 'medium' }).format(
              new Date(order.createdAt),
            )}
          </p>
        </div>

        <Badge className={orderStatusColor(order.status)}>
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
      </div>

      {!isCancelled && (
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-brand-500">
            <span>Progression</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-100">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-6">
        <StatusTimeline order={order} />
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-brand-100 pt-4">
        <span className="font-bold text-brand-800">Total</span>
        <span className="font-bold text-brand-800">{formatMAD(order.totalAmount)}</span>
      </div>

      <button
        type="button"
        onClick={() => onRemove(order.id)}
        className="mt-4 text-sm text-brand-400 underline decoration-brand-200 underline-offset-2 transition-colors hover:text-brand-700"
      >
        Retirer de cet appareil
      </button>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading skeleton                                                   */
/* ------------------------------------------------------------------ */

function OrderCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-3 w-20 rounded bg-brand-100" />
          <div className="h-5 w-40 rounded bg-brand-100" />
          <div className="h-3 w-24 rounded bg-brand-100" />
        </div>
        <div className="h-6 w-20 rounded-full bg-brand-100" />
      </div>
      <div className="mt-5 h-1.5 w-full rounded-full bg-brand-100" />
      <div className="mt-6 space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-brand-100" />
            <div className="h-3 w-32 rounded bg-brand-100" />
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Search form (shared by the two entry points)                       */
/* ------------------------------------------------------------------ */

function TrackForm({
  orderNumber,
  phone,
  setOrderNumber,
  setPhone,
  onSubmit,
  loading,
  error,
  submitLabel,
}: {
  orderNumber: string;
  phone: string;
  setOrderNumber: (v: string) => void;
  setPhone: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string;
  submitLabel: string;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Numéro de commande">
        <Input
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="ELC-2026-000123"
          autoComplete="off"
          required
        />
      </Field>

      <Field label="Téléphone">
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0612345678"
          inputMode="tel"
          autoComplete="tel"
          required
        />
      </Field>

      {error && <Alert>{error}</Alert>}

      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? (
          <span className="flex items-center gap-2">
            <Spinner />
            Recherche…
          </span>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export function TrackPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      const history = getLocalOrderHistory();

      if (history.length === 0) {
        setLoadingHistory(false);
        return;
      }

      const results = await Promise.allSettled(
        history.map((item) => trackOrder(item.orderNumber, item.customerPhone)),
      );

      const validOrders: Order[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          validOrders.push(result.value);
          return;
        }

        const item: LocalOrderReference = history[index];

        // Si une ancienne référence n'est plus valide,
        // on peut la retirer de l'historique local.
        removeOrderFromHistory(item.orderId);
      });

      setOrders(validOrders);
      setLoadingHistory(false);
    };

    loadHistory();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');

    setLoading(true);

    try {
      const result = await trackOrder(orderNumber.trim(), phone.trim());

      saveOrderToHistory(result);

      setOrders((current) => {
        const exists = current.some((order) => order.id === result.id);

        if (exists) {
          return current.map((order) => (order.id === result.id ? result : order));
        }

        return [result, ...current];
      });

      setOrderNumber('');
      setPhone('');
    } catch (err) {
      setError(
        apiErrorMessage(err, 'Commande introuvable. Vérifiez le numéro et le téléphone.'),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (orderId: string) => {
    removeOrderFromHistory(orderId);
    setOrders((current) => current.filter((order) => order.id !== orderId));
  };

  const hasHistory = orders.length > 0;

  

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-900">Suivi de commande</h1>
        <p className="text-brand-600">
          {loadingHistory
            ? 'Un instant, nous récupérons vos commandes…'
            : hasHistory
              ? 'Retrouvez ici vos commandes récentes.'
              : "Retrouvez votre commande avec son numéro et votre téléphone."}
        </p>
      </div>

      {loadingHistory && (
        <div className="space-y-4" aria-live="polite" aria-busy="true">
          <OrderCardSkeleton />
        </div>
      )}

      {!loadingHistory && hasHistory && (
        <div className="space-y-4" aria-live="polite">
          <h2 className="text-lg font-bold text-brand-800">Mes commandes</h2>

          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onRemove={handleRemove} />
          ))}
        </div>
      )}

      {!loadingHistory && !hasHistory && (
        <Card>
          <TrackForm
            orderNumber={orderNumber}
            phone={phone}
            setOrderNumber={setOrderNumber}
            setPhone={setPhone}
            onSubmit={submit}
            loading={loading}
            error={error}
            submitLabel="Suivre"
          />
        </Card>
      )}

      {!loadingHistory && hasHistory && (
        <details className="group rounded-2xl border border-brand-100 bg-white open:shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between p-5 [&::-webkit-details-marker]:hidden">
            <div>
              <h2 className="font-bold text-brand-800">Vous avez une autre commande ?</h2>
              <p className="mt-1 text-sm text-brand-500">
                Retrouvez une commande qui n'est pas encore enregistrée sur cet appareil.
              </p>
            </div>
            <ChevronIcon className="h-5 w-5 shrink-0 text-brand-400 transition-transform group-open:rotate-180" />
          </summary>

          <div className="px-5 pb-5">
            <TrackForm
              orderNumber={orderNumber}
              phone={phone}
              setOrderNumber={setOrderNumber}
              setPhone={setPhone}
              onSubmit={submit}
              loading={loading}
              error={error}
              submitLabel="Ajouter ma commande"
            />
          </div>
        </details>
      )}

      {orders.length > 0 && (
        <SupportCTA
          message={`Bonjour, je souhaite de l'aide concernant ma commande ${orders[0].orderNumber}.`}
        />
      )}
    </div>
  );
}