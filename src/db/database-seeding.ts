import { eq } from "drizzle-orm";
import { db } from "./data-source";
import { user } from "./schema/users";
import bcrypt from "bcrypt";

async function seedDatabase() {
  try {
    const existingAdmin = await db.select().from(user).where(eq(user.email, 'admin@gmail.com')).limit(1);
    
    if (existingAdmin.length > 0) {
      console.log('Admin user already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash('admin2025', 10);

    await db.insert(user).values({
      email: 'admin@gmail.com',
      password: hashedPassword,
      name: 'System Admin',
      role: 'admin'
    });

    console.log('Admin user seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

export { seedDatabase };