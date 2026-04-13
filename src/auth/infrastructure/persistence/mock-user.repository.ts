import { Injectable } from '@nestjs/common';
import { User } from '../../domain/interfaces/user.interface';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { InMemoryUserDataSource } from './in-memory-user.datasource';

@Injectable()
export class MockUserRepositoryAdapter implements UserRepositoryPort {
  constructor(private readonly dataSource: InMemoryUserDataSource) {}

  async findById(id: string): Promise<User | null> {
    const user = this.dataSource.findById(id);
    return user ? this.toDomainUser(user) : null;
  }

  async searchByNameOrDocument(term: string): Promise<User[]> {
    return this.dataSource.searchByNameOrDocument(term).map((user) => this.toDomainUser(user));
  }

  private toDomainUser(user: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    documentNumber: string;
  }): User {
    return {
      id: user.id,
      email: user.email,
      role: user.role as User['role'],
      firstName: user.firstName,
      lastName: user.lastName,
      documentNumber: user.documentNumber,
    };
  }
}
