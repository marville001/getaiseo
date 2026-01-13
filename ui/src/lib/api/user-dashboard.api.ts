import apiClient from '.';

export interface UserStats {
	totalKeywords: number;
	primaryKeywords: number;
	secondaryKeywords: number;
	totalArticles: number;
	draftArticles: number;
	generatedArticles: number;
	publishedArticles: number;
}

export interface RecentArticle {
	articleId: string;
	title: string;
	status: string;
	wordCount: number;
	createdAt: string;
	primaryKeyword?: {
		keyword: string;
	};
}

export interface RecentKeyword {
	keywordId: string;
	keyword: string;
	difficulty: number;
	volume: number;
	isPrimary: boolean;
	isAnalyzed: boolean;
	createdAt: string;
}

export interface UserDashboardData {
	stats: UserStats;
	recentArticles: RecentArticle[];
	recentKeywords: RecentKeyword[];
}

export const getUserDashboardData = async (websiteId: string): Promise<UserDashboardData> => {
	const response = await apiClient.get<{ data: UserDashboardData; }>(`/users/dashboard/${websiteId}`);
	return response.data.data;
};

//update last opened website id
export const updateLastOpenedWebsite = async (websiteId: string): Promise<void> => {
	const response = await apiClient.patch(`/users/last-opened-website/${websiteId}`);
	return response.data.data;
};

const userDashboardApi = {
	getUserDashboardData,
};

export default userDashboardApi;
