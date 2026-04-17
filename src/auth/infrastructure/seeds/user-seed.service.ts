import { Injectable, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../../common/domain/enums/user-role.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from '../persistence/entities/role.entity';
import { AuthAccountEntity } from '../persistence/entities/auth-account.entity';
import { UserEntity } from '../persistence/entities/user.entity';

type RoleSeed = {
  code: UserRole;
  scope: string;
  permissions: string;
};

@Injectable()
export class UserSeedService implements OnModuleInit {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(AuthAccountEntity)
    private readonly authAccountRepository: Repository<AuthAccountEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    const roles = await this.ensureRoles();
    await this.ensureAuthAccounts(roles);
    await this.ensureOperationalAccounts(roles);
  }

  private async ensureRoles(): Promise<Record<UserRole, RoleEntity>> {
    const roleSeeds: RoleSeed[] = [
      {
        code: UserRole.ADMIN,
        scope: 'Control Total',
        permissions:
          'Gestión de usuarios, configuración de parámetros del sistema, auditoría de logs y reportes gerenciales.',
      },
      {
        code: UserRole.MANAGER,
        scope: 'Gestión Operativa',
        permissions:
          'Supervisión de turnos, aprobación de correcciones en planillas y visualización de métricas de productividad. No puede crear cuentas ADMIN.',
      },
      {
        code: UserRole.OPERARIO,
        scope: 'Recepción',
        permissions:
          'Acceso CRUD a planillas de recepción para registro de clientes y vehículos.',
      },
      {
        code: UserRole.INSPECTOR,
        scope: 'Técnico RTM',
        permissions:
          'Acceso a listas de chequeo técnico-mecánicas bajo NTC 5375, registro de defectos y resultados de pruebas, con posibilidad de acceso a planillas.',
      },
    ];

    const roleMap = {} as Record<UserRole, RoleEntity>;

    for (const roleSeed of roleSeeds) {
      let role = await this.roleRepository.findOne({ where: { code: roleSeed.code } });
      if (!role) {
        role = this.roleRepository.create(roleSeed);
      } else {
        role.scope = roleSeed.scope;
        role.permissions = roleSeed.permissions;
      }

      roleMap[roleSeed.code] = await this.roleRepository.save(role);
    }

    return roleMap;
  }

  private async ensureAuthAccounts(roles: Record<UserRole, RoleEntity>): Promise<void> {
    const adminExists = await this.authAccountRepository.findOne({ where: { email: 'admin@example.com' } });
    const managerExists = await this.authAccountRepository.findOne({ where: { email: 'manager@example.com' } });

    const hashedPassword = await bcrypt.hash('1234', 10);

    if (!adminExists) {
      await this.authAccountRepository.save(
        this.authAccountRepository.create({
          email: 'admin@example.com',
          password: hashedPassword,
          role: roles[UserRole.ADMIN],
          isActive: true,
        }),
      );
    }

    if (!managerExists) {
      await this.authAccountRepository.save(
        this.authAccountRepository.create({
          email: 'manager@example.com',
          password: hashedPassword,
          role: roles[UserRole.MANAGER],
          isActive: true,
        }),
      );
    }
  }

  private async ensureOperationalAccounts(roles: Record<UserRole, RoleEntity>): Promise<void> {
    const operationalUsers = await this.userRepository.find({ relations: ['role'] });

    for (const user of operationalUsers) {
      const roleCode = user.role?.code;
      if (roleCode !== UserRole.OPERARIO && roleCode !== UserRole.INSPECTOR) {
        continue;
      }

      const existing = await this.authAccountRepository.findOne({ where: { email: user.email.toLowerCase() } });
      if (existing) {
        if (existing.role.code !== roleCode || existing.isActive !== user.isActive) {
          existing.role = roles[roleCode];
          existing.isActive = user.isActive;
          await this.authAccountRepository.save(existing);
        }
        continue;
      }

      await this.authAccountRepository.save(
        this.authAccountRepository.create({
          email: user.email.toLowerCase(),
          password: await bcrypt.hash(user.identificationNumber, 10),
          role: roles[roleCode],
          isActive: user.isActive,
        }),
      );
    }
  }
}
