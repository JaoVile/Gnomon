import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando o processo de seed...');

  const saltRounds = 10;
  const password = '12345';
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const adminUser = await prisma.admstaff.upsert({
    where: { email: 'gnomon.map@gmail.com' },
    update: {}, // Não faz nada se o usuário já existir
    create: {
      email: 'gnomon.map@gmail.com',
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