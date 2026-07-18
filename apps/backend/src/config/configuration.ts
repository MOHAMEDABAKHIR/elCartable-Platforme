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
