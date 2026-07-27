/**
 * Coordonnées de l'équipe commerciale, utilisées pour les actions sensibles
 * (historique d'achats, demande de commande, remboursement…) que l'acheteur —
 * qui n'a pas de compte — ne peut pas exécuter en self-service.
 *
 * Configurable via les variables Vite `VITE_*` (jamais de secret ici : ce sont
 * des coordonnées publiques). Valeurs de repli pour le développement.
 */
const SUPPORT_PHONE = import.meta.env.VITE_SUPPORT_PHONE ?? '+212600000000';
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? '212600000000';
const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL ?? 'contact@elcartable.ma';

export const support = {
  phone: SUPPORT_PHONE,
  whatsappNumber: WHATSAPP_NUMBER,
  email: SUPPORT_EMAIL,
  telHref: `tel:${SUPPORT_PHONE.replace(/\s+/g, '')}`,
  mailHref: `mailto:${SUPPORT_EMAIL}`,
  /** Lien WhatsApp avec message pré-rempli optionnel. */
  whatsappHref(message?: string): string {
    const base = `https://wa.me/${WHATSAPP_NUMBER}`;
    return message ? `${base}?text=${encodeURIComponent(message)}` : base;
  },
};
