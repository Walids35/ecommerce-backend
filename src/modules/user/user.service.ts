import { eq } from "drizzle-orm";
import { db } from "../../db/data-source";
import { user } from "../../db/schema/users";

class UserService {
    private userRepository = user;

    public async getUsers() {
        try {
            return db.select().from(this.userRepository);
        } catch (error) {
            throw new Error("Failed to fetch users");
        }
    }

    public async getUserById(id: string) {
        try {
            return db.select().from(this.userRepository).where(eq(this.userRepository.id, id)).limit(1);
        } catch (error) {
            throw new Error("Failed to fetch user by ID");
        }
    }

    public async createUser(userData: { name: string; email: string, password: string }) {
        try {
            const [newUser] = await db
                .insert(this.userRepository)
                .values(userData)
                .returning();
            return newUser;
        } catch (error) {
            throw new Error("Failed to create user");
        }
    }
}