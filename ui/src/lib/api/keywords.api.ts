import api from '.';

export interface Keyword {
	keywordId: string;
	userId: string;
	keyword: string;
	competition: 'low' | 'medium' | 'high';
	volume: number;
	recommendedTitle: string | null;
	aiAnalysis: {
		competitionScore?: number;
		volumeEstimate?: number;
		difficulty?: string;
		trend?: string;
	} | null;
	isAnalyzed: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface KeywordItem {
	keyword: string;
	competition?: 'low' | 'medium' | 'high';
	volume?: number;
}

export interface CreateKeywordsDto {
	keywords: KeywordItem[];
}

export const keywordsApi = {
	// Get all keywords for the current user
	getKeywords: async (): Promise<Keyword[]> => {
		const response = await api.get('/keywords');
		return response.data?.data;
	},

	// Create new keywords
	createKeywords: async (data: CreateKeywordsDto): Promise<Keyword[]> => {
		const response = await api.post('/keywords', data);
		return response.data?.data;
	},

	// Get a single keyword
	getKeyword: async (keywordId: string): Promise<Keyword> => {
		const response = await api.get(`/keywords/${keywordId}`);
		return response.data?.data;
	},

	// Reanalyze a keyword
	reanalyzeKeyword: async (keywordId: string): Promise<Keyword> => {
		const response = await api.put(`/keywords/${keywordId}/reanalyze`);
		return response.data?.data;
	},

	// Delete a keyword
	deleteKeyword: async (keywordId: string): Promise<void> => {
		await api.delete(`/keywords/${keywordId}`);
	},

	// Delete multiple keywords
	deleteMultipleKeywords: async (keywordIds: string[]): Promise<void> => {
		await api.post('/keywords/delete-multiple', { keywordIds });
	},
};
