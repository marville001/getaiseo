import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { SubmitWebsiteDto } from './dto';
import { UserWebsite, WebsiteScrapingStatus } from './entities/user-website.entity';
import { OnboardingRepository } from './onboarding.repository';
import { WebScraperService } from './web-scraper.service';

@Injectable()
export class OnboardingService {
	private readonly logger = new Logger(OnboardingService.name);

	constructor(
		private readonly onboardingRepository: OnboardingRepository,
		private readonly webScraperService: WebScraperService,
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
	) { }

	async submitWebsite(userId: string, dto: SubmitWebsiteDto): Promise<UserWebsite> {
		// Check if user exists
		const user = await this.userRepository.findOne({ where: { userId } });
		if (!user) {
			throw new NotFoundException('User not found');
		}

		// Check if user already has a primary website
		const existingPrimary = await this.onboardingRepository.findPrimaryByUserId(userId);

		// Create new website entry
		const website = await this.onboardingRepository.create({
			userId,
			websiteUrl: dto.websiteUrl,
			isPrimary: !existingPrimary, // Make it primary if user doesn't have one
			scrapingStatus: WebsiteScrapingStatus.PENDING,
		});

		return website;
	}

	async startScraping(websiteId: string, userId: string): Promise<UserWebsite> {
		const website = await this.onboardingRepository.findOne({
			where: { websiteId, userId },
		});

		if (!website) {
			throw new NotFoundException('Website not found');
		}

		// Update status to processing
		await this.onboardingRepository.update(
			{ websiteId },
			{ scrapingStatus: WebsiteScrapingStatus.PROCESSING },
		);

		try {
			// Perform scraping
			const scrapedData = await this.webScraperService.scrapeWebsite(website.websiteUrl);

			// Update website with scraped data
			await this.onboardingRepository.update(
				{ websiteId },
				{
					websiteName: scrapedData.title,
					websiteDescription: scrapedData.description,
					scrapedContent: scrapedData.content,
					scrapedMeta: {
						title: scrapedData.title,
						description: scrapedData.description,
						keywords: scrapedData.keywords,
						favicon: scrapedData.favicon,
						ogImage: scrapedData.ogImage,
						headings: scrapedData.headings,
						links: scrapedData.links,
					},
					scrapingStatus: WebsiteScrapingStatus.COMPLETED,
					scrapedAt: new Date(),
				},
			);

			return this.onboardingRepository.findOne({ where: { websiteId } });
		} catch (error) {
			this.logger.error(`Scraping failed for website ${websiteId}:`, error);

			// Update status to failed
			await this.onboardingRepository.update(
				{ websiteId },
				{
					scrapingStatus: WebsiteScrapingStatus.FAILED,
					scrapingError: error.message,
				},
			);

			return this.onboardingRepository.findOne({ where: { websiteId } });
		}
	}

	async getScrapingStatus(websiteId: string, userId: string): Promise<UserWebsite> {
		const website = await this.onboardingRepository.findOne({
			where: { websiteId, userId },
		});

		if (!website) {
			throw new NotFoundException('Website not found');
		}

		return website;
	}

	async completeOnboarding(userId: string): Promise<User> {
		// Verify user has at least one successfully scraped website
		const websites = await this.onboardingRepository.findByUserId(userId);
		const hasCompletedWebsite = websites.some(
			w => w.scrapingStatus === WebsiteScrapingStatus.COMPLETED,
		);

		if (!hasCompletedWebsite) {
			throw new NotFoundException('Please complete website scraping before proceeding');
		}

		// Mark user as onboarded
		await this.userRepository.update({ userId }, { isOnboarded: true });

		return this.userRepository.findOne({ where: { userId } });
	}

	async getUserWebsites(userId: string): Promise<UserWebsite[]> {
		return this.onboardingRepository.findByUserId(userId);
	}

	async getOnboardingStatus(userId: string): Promise<{
		isOnboarded: boolean;
		hasWebsite: boolean;
		websiteStatus?: WebsiteScrapingStatus;
		website?: UserWebsite;
	}> {
		const user = await this.userRepository.findOne({ where: { userId } });
		if (!user) {
			throw new NotFoundException('User not found');
		}

		const websites = await this.onboardingRepository.findByUserId(userId);
		const primaryWebsite = websites.find(w => w.isPrimary) || websites[0];

		return {
			isOnboarded: user.isOnboarded,
			hasWebsite: websites.length > 0,
			websiteStatus: primaryWebsite?.scrapingStatus,
			website: primaryWebsite,
		};
	}
}
