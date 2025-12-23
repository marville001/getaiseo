import { AbstractRepository } from '@/database/abstract.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserWebsite } from './entities/user-website.entity';

@Injectable()
export class OnboardingRepository extends AbstractRepository<UserWebsite> {
	constructor(
		@InjectRepository(UserWebsite)
		private readonly userWebsiteRepository: Repository<UserWebsite>,
	) {
		super(userWebsiteRepository);
	}

	async findByUserId(userId: string): Promise<UserWebsite[]> {
		return this.userWebsiteRepository.find({
			where: { userId },
			order: { createdAt: 'DESC' },
		});
	}

	async findPrimaryByUserId(userId: string): Promise<UserWebsite | null> {
		return this.userWebsiteRepository.findOne({
			where: { userId, isPrimary: true },
		});
	}
}
