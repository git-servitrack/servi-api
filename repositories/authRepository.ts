import { User, UserModel } from "../models/userModel";

// Purpose: Handle database operations for authentication flows.
export class AuthRepository {
  async findByEmail(email: string, includePassword = false): Promise<UserModel | null> {
    const query = User.findOne({ email });

    if (includePassword) {
      query.select("+password");
    }

    return query.exec();
  }

  async findById(id: string): Promise<UserModel | null> {
    return User.findById(id).exec();
  }

  async createUser(userData: Partial<UserModel>): Promise<UserModel> {
    return User.create(userData);
  }
}
