import { Injectable } from '@nestjs/common';
import { UserRole } from '../../../common/domain/enums/user-role.enum';
import { UserWithPassword } from '../../domain/interfaces/user.interface';

@Injectable()
export class InMemoryUserDataSource {
  private readonly users: UserWithPassword[] = [
    {
      id: 'usr-001',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      password: '1234',
      firstName: 'Admin',
      lastName: 'Principal',
      documentNumber: '1001001001',
    },
    {
      id: 'usr-002',
      email: 'manager@example.com',
      role: UserRole.MANAGER,
      password: '1234',
      firstName: 'Maria',
      lastName: 'Manager',
      documentNumber: '1002002002',
    },
    {
      id: 'usr-003',
      email: 'inspector@example.com',
      role: UserRole.INSPECTOR,
      password: '1234',
      firstName: 'Ines',
      lastName: 'Inspector',
      documentNumber: '1003003003',
    },
    {
      id: 'usr-004',
      email: 'operario@example.com',
      role: UserRole.OPERARIO,
      password: '1234',
      firstName: 'Oscar',
      lastName: 'Operario',
      documentNumber: '1004004004',
    },
  ];

  findById(id: string): UserWithPassword | undefined {
    return this.users.find((user) => user.id === id);
  }

  findByEmail(email: string): UserWithPassword | undefined {
    return this.users.find((user) => user.email === email);
  }

  findAll(): UserWithPassword[] {
    return this.users;
  }

  create(user: UserWithPassword): void {
    this.users.push(user);
  }

  deleteByEmail(email: string): boolean {
    const idx = this.users.findIndex((user) => user.email === email);
    if (idx === -1) {
      return false;
    }

    this.users.splice(idx, 1);
    return true;
  }

  searchByNameOrDocument(term: string): UserWithPassword[] {
    const normalizedTerm = term.trim().toLowerCase();
    if (!normalizedTerm) {
      return [];
    }

    return this.users.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      return fullName.includes(normalizedTerm) || user.documentNumber.toLowerCase().includes(normalizedTerm);
    });
  }
}
