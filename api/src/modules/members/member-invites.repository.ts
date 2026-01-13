import { AbstractRepository } from '@/database/abstract.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { InviteStatus, MemberInvite } from './entities/member-invite.entity';

@Injectable()
export class MemberInvitesRepository extends AbstractRepository<MemberInvite> {
  protected readonly logger = new Logger(MemberInvitesRepository.name);

  constructor(@InjectRepository(MemberInvite) repository: Repository<MemberInvite>) {
    super(repository);
  }

  async findByWebsiteId(websiteId: string, relations: string[] = []) {
    return this.repository.find({
      where: { websiteId },
      relations,
      order: { createdAt: 'DESC' },
    });
  }

  async findByWebsiteIdPaginated(
    websiteId: string,
    page: number = 1,
    limit: number = 10,
    status?: InviteStatus,
    relations: string[] = [],
  ) {
    const skip = (page - 1) * limit;
    const where: any = { websiteId };

    if (status) {
      where.status = status;
    }

    const [invites, total] = await this.repository.findAndCount({
      where,
      skip,
      take: limit,
      relations,
      order: { createdAt: 'DESC' },
    });

    return {
      data: invites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByToken(token: string, relations: string[] = []) {
    return this.repository.findOne({
      where: { token },
      relations,
    });
  }

  async findByEmail(email: string, websiteId: string) {
    return this.repository.findOne({
      where: { email, websiteId },
    });
  }

  async countPendingInvites(websiteId: string) {
    return this.repository.count({
      where: { websiteId, status: InviteStatus.PENDING },
    });
  }

  async findExpiredInvites() {
    const now = new Date();
    return this.repository.find({
      where: {
        status: InviteStatus.PENDING,
        expiresAt: LessThan(now),
      },
    });
  }
}