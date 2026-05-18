import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IdentificationTypeEntity } from './entities/identification-type.entity';
import { IdentificationTypeRepositoryPort } from '../../domain/ports/identification-type-repository.port';

@Injectable()
export class IdentificationTypeRepositoryAdapter implements IdentificationTypeRepositoryPort {
  constructor(
    @InjectRepository(IdentificationTypeEntity)
    private readonly repository: Repository<IdentificationTypeEntity>,
  ) {}

  async findAll(): Promise<IdentificationTypeEntity[]> {
    return this.repository.find({
      order: { name: 'ASC' },
    });
  }
}
