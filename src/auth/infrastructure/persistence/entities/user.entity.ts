import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RoleEntity } from './role.entity';
import { IdentificationType } from '../../../../common/domain/enums/identification-type.enum';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['identificationNumber'], { unique: true })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: IdentificationType })
  identificationType!: IdentificationType;

  @Column({ type: 'varchar', length: 20, unique: true })
  identificationNumber!: string;

  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', length: 20 })
  phoneNumber!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @ManyToOne(() => RoleEntity, (role) => role.users, { nullable: false, eager: true })
  @JoinColumn({ name: 'role_id' })
  role!: RoleEntity;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
