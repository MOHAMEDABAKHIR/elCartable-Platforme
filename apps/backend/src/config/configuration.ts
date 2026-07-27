export default () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },

  invitation: {
    expiresInHours: parseInt(process.env.INVITATION_CODE_EXPIRES_IN_HOURS ?? '72', 10),
  },

  uploads: {
    maxFileSizeMb: parseInt(process.env.UPLOAD_MAX_FILE_SIZE_MB ?? '5', 10),
    // Répertoire disque de fallback (uploads + PDF de commande générés) utilisé
    // uniquement lorsque le stockage objet Cloudflare R2 n'est pas configuré.
    dir: process.env.UPLOAD_DIR ?? './uploads',
  },

  // Stockage objet Cloudflare R2 (S3-compatible). Aucun fichier n'est stocké en
  // base : on ne persiste que l'URL publique renvoyée par R2 dans Neon. Si ces
  // variables sont absentes, on retombe sur le disque local (dev sans R2).
  storage: {
    r2: {
      accountId: process.env.R2_ACCOUNT_ID,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      bucket: process.env.R2_BUCKET,
      // Endpoint S3 de R2 : par défaut https://<accountId>.r2.cloudflarestorage.com
      endpoint: process.env.R2_ENDPOINT,
      // URL publique du bucket (domaine r2.dev ou domaine personnalisé) servie
      // au frontend. Les clés R2 ne sont JAMAIS exposées au client.
      publicUrl: process.env.R2_PUBLIC_URL,
    },
  },

  whatsapp: {
    supportNumber: process.env.WHATSAPP_SUPPORT_NUMBER,
  },

  privacy: {
    // Sel utilisé pour hasher l'IP des visiteurs anonymes (Visitor.ipHash) —
    // évite de stocker l'IP en clair tout en permettant une déduplication
    // approximative si besoin. Un défaut dev est fourni pour ne pas bloquer
    // le démarrage local, mais DOIT être surchargé en production.
    ipHashSalt: process.env.IP_HASH_SALT ?? 'dev-only-salt-change-me',
  },
});
