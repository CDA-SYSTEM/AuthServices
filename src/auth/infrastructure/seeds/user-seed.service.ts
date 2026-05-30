import { Injectable, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../../common/domain/enums/user-role.enum';
import { IdentificationType } from '../../../common/domain/enums/identification-type.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from '../persistence/entities/role.entity';
import { AuthAccountEntity } from '../persistence/entities/auth-account.entity';
import { UserEntity } from '../persistence/entities/user.entity';
import { IdentificationTypeEntity } from '../persistence/entities/identification-type.entity';

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
    @InjectRepository(IdentificationTypeEntity)
    private readonly identificationTypeRepository: Repository<IdentificationTypeEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureIdentificationTypes();
    const roles = await this.ensureRoles();
    await this.ensureAuthAccounts(roles);
  }

  private async ensureIdentificationTypes(): Promise<void> {
    const typeSeeds = Object.values(IdentificationType);

    for (const name of typeSeeds) {
      const exists = await this.identificationTypeRepository.findOne({ where: { name } });
      if (!exists) {
        await this.identificationTypeRepository.save(
          this.identificationTypeRepository.create({ name }),
        );
      }
    }
  }

  private async ensureRoles(): Promise<Record<UserRole, RoleEntity>> {
    const roleSeeds: RoleSeed[] = [
      {
        code: UserRole.SUPERADMIN,
        scope: 'Super Administrador',
        permissions:
          'Control total del sistema: gestión de administradores, configuración global, auditoría completa, y todos los permisos de roles inferiores.',
      },
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
    const superadminExists = await this.authAccountRepository.findOne({ where: { email: 'superadmin@example.com' } });
    const adminExists = await this.authAccountRepository.findOne({ where: { email: 'admin@example.com' } });
    const managerExists = await this.authAccountRepository.findOne({ where: { email: 'manager@example.com' } });
    const inspectorExists = await this.authAccountRepository.findOne({ where: { email: 'inspector@example.com' } });
    const operarioExists = await this.authAccountRepository.findOne({ where: { email: 'operario@example.com' } });

    const hashedPassword = await bcrypt.hash('1234', 10);

    if (!superadminExists) {
      await this.authAccountRepository.save(
        this.authAccountRepository.create({
          email: 'superadmin@example.com',
          password: hashedPassword,
          role: roles[UserRole.SUPERADMIN],
          isActive: true,
        }),
      );
    }

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

    if (!inspectorExists) {
      await this.authAccountRepository.save(
        this.authAccountRepository.create({
          email: 'inspector@example.com',
          password: hashedPassword,
          role: roles[UserRole.INSPECTOR],
          isActive: true,
        }),
      );
    }

    if (!operarioExists) {
      await this.authAccountRepository.save(
        this.authAccountRepository.create({
          email: 'operario@example.com',
          password: hashedPassword,
          role: roles[UserRole.OPERARIO],
          isActive: true,
        }),
      );
    }
  }

}
