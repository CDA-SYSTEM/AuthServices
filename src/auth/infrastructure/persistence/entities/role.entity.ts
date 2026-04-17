import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from '../../../../common/domain/enums/user-role.enum';
import { UserEntity } from './user.entity';
import { AuthAccountEntity } from './auth-account.entity';

@Entity('roles')
@Index(['code'], { unique: true })
export class RoleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: UserRole, unique: true })
  code!: UserRole;

  @Column({ type: 'varchar', length: 120 })
  scope!: string;

  @Column({ type: 'text' })
  permissions!: string;

  @OneToMany(() => UserEntity, (user) => user.role)
  users!: UserEntity[];

  @OneToMany(() => AuthAccountEntity, (account) => account.role)
  authAccounts!: AuthAccountEntity[];
}
