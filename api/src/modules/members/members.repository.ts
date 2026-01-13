import { AbstractRepository } from '@/database/abstract.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from './entities/member.entity';

@Injectable()
export class MembersRepository extends AbstractRepository<Member> {
  protected readonly logger = new Logger(MembersRepository.name);

  constructor(@InjectRepository(Member) repository: Repository<Member>) {
    super(repository);
  }

  async findByWebsiteId(websiteId: string, relations: string[] = ['user']) {
    return this.repository.find({
      where: { websiteId, isActive: true },
      relations,
      order: { createdAt: 'DESC' },
    });
  }

  async findByWebsiteIdPaginated(
    websiteId: string,
    page: number = 1,
    limit: number = 10,
    relations: string[] = ['user'],
  ) {
    const skip = (page - 1) * limit;
    const [members, total] = await this.repository.findAndCount({
      where: { websiteId, isActive: true },
      skip,
      take: limit,
      relations,
      order: { createdAt: 'DESC' },
    });

    return {
      data: members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByUserAndWebsite(userId: string, websiteId: string) {
    return this.repository.findOne({
      where: { userId, websiteId },
      relations: ['user'],
    });
  }

  async countMembers(websiteId: string) {
    return this.repository.count({
      where: { websiteId, isActive: true },
    });
  }
}
