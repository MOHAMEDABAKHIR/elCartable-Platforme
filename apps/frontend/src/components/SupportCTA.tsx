import { MessageCircle, Phone } from 'lucide-react';
import { support } from '../lib/config';

/**
 * Actions sensibles (historique d'achats, modification/annulation, demande de
 * remboursement…). L'acheteur n'ayant pas de compte, elles ne sont pas
 * self-service : on l'oriente vers l'équipe commerciale (WhatsApp ou appel).
 */
export function SupportCTA({
  title = 'Besoin d’aide pour cette commande ?',
  description = 'Historique d’achats, modification, annulation ou remboursement : contactez notre équipe commerciale, elle traite votre demande directement.',
  message,
  className,
}: {
  title?: string;
  description?: string;
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-brand-100 bg-brand-50/60 p-5 ${className ?? ''}`}
    >
      <h3 className="font-semibold text-brand-800">{title}</h3>
      <p className="mt-1 text-sm text-brand-600">{description}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <a
          href={support.whatsappHref(message)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
        <a
          href={support.telHref}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-300 px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100"
        >
          <Phone className="h-4 w-4" />
          Appeler l’équipe commerciale
        </a>
      </div>
    </div>
  );
}
