import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

export function createUserData(overrides = {}) {
  return {
    email: faker.internet.email(),
    name: faker.person.fullName(),
    password: 'Password123!',
    ...overrides,
  };
}

export async function createUser(prisma: any, overrides = {}) {
  const data = createUserData(overrides);
  const passwordHash = await bcrypt.hash(data.password, 10);
  
  return prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
      emailVerified: true,
      status: 'ACTIVE',
      ...overrides,
    },
  });
}
