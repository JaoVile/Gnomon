import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando o processo de seed...');

  const saltRounds = 10;
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'gnomon.map@gmail.com';
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) {
    throw new Error(
      'Defina SEED_ADMIN_PASSWORD (e opcionalmente SEED_ADMIN_EMAIL) no ambiente antes de rodar o seed.',
    );
  }
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const adminUser = await prisma.admstaff.upsert({
    where: { email: adminEmail },
    update: {}, // Não faz nada se o usuário já existir
    create: {
      email: adminEmail,
      name: 'Gnomon Admin',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  console.log(`✅ Usuário admin criado/verificado: ${adminUser.email}`);
  console.log('🌱 Processo de seed finalizado com sucesso.');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o processo de seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });