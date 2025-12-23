import api from '.';

export interface UserWebsite {
	websiteId: string;
	userId: string;
	websiteUrl: string;
	websiteName?: string;
	websiteDescription?: string;
	scrapedContent?: string;
	scrapedMeta?: {
		title?: string;
		description?: string;
		keywords?: string[];
		favicon?: string;
		ogImage?: string;
		headings?: string[];
		links?: string[];
	};
	scrapingStatus: 'pending' | 'processing' | 'completed' | 'failed';
	scrapingError?: string;
	scrapedAt?: string;
	isPrimary: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface OnboardingStatus {
	isOnboarded: boolean;
	hasWebsite: boolean;
	websiteStatus?: 'pending' | 'processing' | 'completed' | 'failed';
	website?: UserWebsite;
}

export const onboardingApi = {
	// Get onboarding status
	getOnboardingStatus: async (): Promise<OnboardingStatus> => {
		const response = await api.get('/onboarding/status');
		return response.data?.data;
	},

	// Submit website URL (Step 1)
	submitWebsite: async (websiteUrl: string): Promise<UserWebsite> => {
		const response = await api.post('/onboarding/website', { websiteUrl });
		return response.data?.data;
	},

	// Start scraping (Step 2)
	startScraping: async (websiteId: string): Promise<UserWebsite> => {
		const response = await api.post(`/onboarding/website/${websiteId}/scrape`);
		return response.data?.data;
	},

	// Get scraping status
	getScrapingStatus: async (websiteId: string): Promise<UserWebsite> => {
		const response = await api.get(`/onboarding/website/${websiteId}/status`);
		return response.data?.data;
	},

	// Get user's websites
	getUserWebsites: async (): Promise<UserWebsite[]> => {
		const response = await api.get('/onboarding/websites');
		return response.data?.data;
	},

	// Complete onboarding (Step 3)
	completeOnboarding: async (): Promise<{ user: unknown }> => {
		const response = await api.post('/onboarding/complete');
		return response.data?.data;
	},
};
