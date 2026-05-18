import { Injectable, Inject } from '@nestjs/common';
import { IDENTIFICATION_TYPE_REPOSITORY, IdentificationTypeRepositoryPort } from '../../domain/ports/identification-type-repository.port';
import { IdentificationTypeEntity } from '../../infrastructure/persistence/entities/identification-type.entity';

@Injectable()
export class GetIdentificationTypesUseCase {
  constructor(
    @Inject(IDENTIFICATION_TYPE_REPOSITORY)
    private readonly repository: IdentificationTypeRepositoryPort,
  ) {}

  async execute(): Promise<IdentificationTypeEntity[]> {
    return this.repository.findAll();
  }
}
