import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OpenAiService } from '../openai/openai.service';
import { CreateKeywordsDto } from './dto/create-keyword.dto';
import { CompetitionLevel, Keyword } from './entities/keyword.entity';
import { KeywordsRepository } from './keywords.repository';

interface KeywordAnalysis {
	keyword: string;
	competition: CompetitionLevel;
	competitionScore: number;
	volume: number;
	difficulty: string;
	trend: string;
	recommendedTitle: string;
}

@Injectable()
export class KeywordsService {
	private readonly logger = new Logger(KeywordsService.name);

	constructor(
		private readonly keywordsRepository: KeywordsRepository,
		private readonly openAiService: OpenAiService,
	) { }

	async createKeywords(userId: string, createKeywordsDto: CreateKeywordsDto): Promise<Keyword[]> {
		const { keywords } = createKeywordsDto;
		const createdKeywords: Keyword[] = [];
		const keywordsToAnalyze: Keyword[] = [];

		// Filter out duplicates based on keyword text
		const seen = new Set<string>();
		const uniqueKeywords = keywords.filter(k => {
			const normalized = k.keyword.trim().toLowerCase();
			if (seen.has(normalized)) return false;
			seen.add(normalized);
			return true;
		});

		for (const keywordItem of uniqueKeywords) {
			const normalizedKeyword = keywordItem.keyword.trim().toLowerCase();

			// Check if keyword already exists for this user
			const existing = await this.keywordsRepository.findByUserIdAndKeyword(userId, normalizedKeyword);
			if (existing) {
				this.logger.warn(`Keyword "${normalizedKeyword}" already exists for user ${userId}`);
				continue;
			}

			// Check if competition and volume are provided (from CSV/Excel upload)
			const hasPrefilledData = keywordItem.competition && keywordItem.volume !== undefined;

			// Create the keyword entry
			const newKeyword = await this.keywordsRepository.create({
				userId,
				keyword: normalizedKeyword,
				competition: keywordItem.competition || CompetitionLevel.MEDIUM,
				volume: keywordItem.volume || 0,
				isAnalyzed: hasPrefilledData, // Mark as analyzed if data is provided
			});
			createdKeywords.push(newKeyword);

			// Only analyze keywords that don't have prefilled data
			if (!hasPrefilledData) {
				keywordsToAnalyze.push(newKeyword);
			}
		}

		// Analyze keywords without prefilled data in background (don't await)
		if (keywordsToAnalyze.length > 0) {
			this.analyzeKeywordsInBackground(keywordsToAnalyze);
		}

		return createdKeywords;
	}

	private async analyzeKeywordsInBackground(keywords: Keyword[]): Promise<void> {
		for (const keyword of keywords) {
			try {
				await this.analyzeKeyword(keyword);
			} catch (error) {
				this.logger.error(`Failed to analyze keyword "${keyword.keyword}": ${error.message}`);
			}
		}
	}

	async analyzeKeyword(keyword: Keyword): Promise<Keyword> {
		try {
			const analysis = await this.getKeywordAnalysis(keyword.keyword);

			// Update the keyword with analysis data
			const updated = await this.keywordsRepository.update(
				{ keywordId: keyword.keywordId },
				{
					competition: analysis.competition,
					volume: analysis.volume,
					recommendedTitle: analysis.recommendedTitle,
					aiAnalysis: {
						competitionScore: analysis.competitionScore,
						volumeEstimate: analysis.volume,
						difficulty: analysis.difficulty,
						trend: analysis.trend,
					},
					isAnalyzed: true,
				}
			);

			return updated;
		} catch (error) {
			this.logger.error(`Error analyzing keyword "${keyword.keyword}": ${error.message}`);
			throw error;
		}
	}

	private async getKeywordAnalysis(keyword: string): Promise<KeywordAnalysis> {
		const prompt = `You are an SEO expert. Analyze the following keyword and provide realistic SEO metrics.

			Keyword: "${keyword}"

			Provide a JSON response with the following structure:
			{
				"competition": "low" | "medium" | "high",
				"competitionScore": number (1-100, where 1 is easiest to rank),
				"volume": number (estimated monthly search volume on Google - be realistic based on the keyword's popularity),
				"difficulty": "easy" | "moderate" | "hard" | "very hard",
				"trend": "rising" | "stable" | "declining",
				"recommendedTitle": "A compelling SEO-optimized article title for this keyword (max 60 characters)"
			}

			Important:
			- For volume, estimate realistic monthly search volumes based on the keyword's nature
			- Popular topics should have higher volumes (thousands to millions)
			- Niche topics should have lower volumes (hundreds to low thousands)
			- Competition should reflect how hard it is to rank on Google's first page
			- The recommended title should be engaging and include the keyword naturally

			Return ONLY valid JSON, no additional text.`;

		try {
			const response = await this.openAiService.chat([
				{ role: 'user', content: prompt }
			] as any);

			// Parse the JSON response
			const jsonMatch = response.content.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				throw new Error('No valid JSON found in AI response');
			}

			const analysis = JSON.parse(jsonMatch[0]);

			// Validate and normalize the response
			return {
				keyword,
				competition: this.normalizeCompetition(analysis.competition),
				competitionScore: Math.min(100, Math.max(1, analysis.competitionScore || 50)),
				volume: Math.max(0, Math.round(analysis.volume || 0)),
				difficulty: analysis.difficulty || 'moderate',
				trend: analysis.trend || 'stable',
				recommendedTitle: analysis.recommendedTitle || `Guide to ${keyword}`,
			};
		} catch (error) {
			this.logger.error(`AI analysis failed for keyword "${keyword}": ${error.message}`);
			// Return default values on failure
			return {
				keyword,
				competition: CompetitionLevel.MEDIUM,
				competitionScore: 50,
				volume: 1000,
				difficulty: 'moderate',
				trend: 'stable',
				recommendedTitle: `Complete Guide to ${keyword}`,
			};
		}
	}

	private normalizeCompetition(value: string): CompetitionLevel {
		const lower = value?.toLowerCase();
		if (lower === 'low') return CompetitionLevel.LOW;
		if (lower === 'high') return CompetitionLevel.HIGH;
		return CompetitionLevel.MEDIUM;
	}

	async findAllByUser(userId: string): Promise<Keyword[]> {
		return this.keywordsRepository.findByUserId(userId);
	}

	async findOne(keywordId: string, userId: string): Promise<Keyword> {
		const keyword = await this.keywordsRepository.findOne({
			where: { keywordId, userId },
		});

		if (!keyword) {
			throw new NotFoundException('Keyword not found');
		}

		return keyword;
	}

	async reanalyzeKeyword(keywordId: string, userId: string): Promise<Keyword> {
		const keyword = await this.findOne(keywordId, userId);
		return this.analyzeKeyword(keyword);
	}

	async deleteKeyword(keywordId: string, userId: string): Promise<void> {
		const keyword = await this.findOne(keywordId, userId);
		await this.keywordsRepository.delete(keyword.keywordId);
	}

	async deleteMultipleKeywords(keywordIds: string[], userId: string): Promise<void> {
		for (const keywordId of keywordIds) {
			await this.deleteKeyword(keywordId, userId);
		}
	}
}
