import { IdentificationTypeEntity } from '../../infrastructure/persistence/entities/identification-type.entity';

export const IDENTIFICATION_TYPE_REPOSITORY = Symbol('IDENTIFICATION_TYPE_REPOSITORY');

export interface IdentificationTypeRepositoryPort {
  findAll(): Promise<IdentificationTypeEntity[]>;
}
