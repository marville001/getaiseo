import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SubmitWebsiteDto } from './dto';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
@UseGuards(AuthGuard('jwt'))
export class OnboardingController {
	constructor(private readonly onboardingService: OnboardingService) { }

	/**
	 * Get current onboarding status
	 */
	@Get('status')
	async getOnboardingStatus(@CurrentUser() user: JwtPayload) {
		return this.onboardingService.getOnboardingStatus(user.sub);
	}

	/**
	 * Step 1: Submit website URL
	 */
	@Post('website')
	async submitWebsite(
		@CurrentUser() user: JwtPayload,
		@Body() dto: SubmitWebsiteDto,
	) {
		return this.onboardingService.submitWebsite(user.sub, dto);
	}

	/**
	 * Step 2: Start scraping the website
	 */
	@Post('website/:websiteId/scrape')
	async startScraping(
		@CurrentUser() user: JwtPayload,
		@Param('websiteId') websiteId: string,
	) {
		return this.onboardingService.startScraping(websiteId, user.sub);
	}

	/**
	 * Get scraping status
	 */
	@Get('website/:websiteId/status')
	async getScrapingStatus(
		@CurrentUser() user: JwtPayload,
		@Param('websiteId') websiteId: string,
	) {
		return this.onboardingService.getScrapingStatus(websiteId, user.sub);
	}

	/**
	 * Get user's websites
	 */
	@Get('websites')
	async getUserWebsites(@CurrentUser() user: JwtPayload) {
		return this.onboardingService.getUserWebsites(user.sub);
	}

	/**
	 * Step 3: Complete onboarding
	 */
	@Post('complete')
	async completeOnboarding(@CurrentUser() user: JwtPayload) {
		return this.onboardingService.completeOnboarding(user.sub);
	}
}
