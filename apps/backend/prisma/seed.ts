import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Bootstraps the very first Super Admin account, since every other user
 * (Admin, Commercial) must be created by an existing Admin/SuperAdmin.
 * Run once per environment: `npm run prisma:seed --workspace=apps/backend`
 *
 * Credentials are read from env so they're never hardcoded in source.
 */
async function main() {
  const email = process.env.SEED_SUPER_ADMIN_EMAIL ?? 'superadmin@elcartable.ma';
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;

  if (!password) {
    throw new Error(
      'SEED_SUPER_ADMIN_PASSWORD est requis dans .env pour lancer le seed en sécurité.',
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Super Admin déjà existant (${email}), rien à faire.`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const superAdmin = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fullName: 'Super Administrateur',
      role: UserRole.SUPER_ADMIN,
      mustSetPassword: false,
    },
  });

  console.log(`Super Admin créé: ${superAdmin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
