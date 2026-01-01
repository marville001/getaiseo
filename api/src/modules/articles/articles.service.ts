import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Keyword } from '../keywords/entities/keyword.entity';
import { OpenAiService } from '../openai/openai.service';
import { AiModelConfigurationService } from '../settings/ai-model-configuration.service';
import { SettingsService } from '../settings/settings.service';
import { ArticlesRepository } from './articles.repository';
import { CreateArticleDto } from './dto/create-article.dto';
import { RegenerateTitleDto } from './dto/regenerate-title.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article, ArticleStatus } from './entities/article.entity';

@Injectable()
export class ArticlesService {
	private readonly logger = new Logger(ArticlesService.name);

	constructor(
		private readonly articlesRepository: ArticlesRepository,
		private readonly openAiService: OpenAiService,
		private readonly settingsService: SettingsService,
		private readonly aiModelService: AiModelConfigurationService,
		@InjectRepository(Keyword)
		private readonly keywordsRepository: Repository<Keyword>,
	) { }

	async getUserArticles(userId: string): Promise<Article[]> {
		return this.articlesRepository.findByUserId(userId);
	}

	async getArticleById(articleId: string, userId: string): Promise<Article> {
		const article = await this.articlesRepository.findByIdWithRelations(articleId);
		if (!article || article.userId !== userId) {
			throw new NotFoundException('Article not found');
		}
		return article;
	}

	async getArticleByKeywordId(primaryKeywordId: string, userId: string): Promise<Article | null> {
		return this.articlesRepository.findByUserIdAndKeywordId(userId, primaryKeywordId);
	}

	async createArticle(userId: string, dto: CreateArticleDto): Promise<Article> {
		// Verify primary keyword exists and belongs to user
		const primaryKeyword = await this.keywordsRepository.findOne({
			where: { keywordId: dto.primaryKeywordId, userId },
		});

		if (!primaryKeyword) {
			throw new NotFoundException('Primary keyword not found');
		}

		if (!primaryKeyword.isPrimary) {
			throw new BadRequestException('Selected keyword is not a primary keyword');
		}

		// Check if article already exists for this keyword
		const existingArticle = await this.articlesRepository.findByUserIdAndKeywordId(userId, dto.primaryKeywordId);
		if (existingArticle) {
			throw new BadRequestException('An article already exists for this keyword');
		}

		// Verify secondary keywords belong to user and are linked to primary
		let secondaryKeywords: Keyword[] = [];
		if (dto.secondaryKeywordIds && dto.secondaryKeywordIds.length > 0) {
			secondaryKeywords = await this.keywordsRepository.find({
				where: {
					keywordId: In(dto.secondaryKeywordIds),
					userId,
					parentKeywordId: dto.primaryKeywordId,
				},
			});
		}

		// Create article
		const article = await this.articlesRepository.create({
			userId,
			title: dto.title,
			contentBriefing: dto.contentBriefing,
			referenceContent: dto.referenceContent,
			primaryKeywordId: dto.primaryKeywordId,
			aiModelId: dto.aiModelId,
			status: ArticleStatus.GENERATING,
			secondaryKeywords,
		});

		// Start async article generation
		this.generateArticleContent(article.articleId, dto, primaryKeyword, secondaryKeywords)
			.catch(err => {
				this.logger.error(`Failed to generate article ${article.articleId}:`, err);
			});

		return this.articlesRepository.findByIdWithRelations(article.articleId);
	}

	private async generateArticleContent(
		articleId: string,
		dto: CreateArticleDto,
		primaryKeyword: Keyword,
		secondaryKeywords: Keyword[],
	): Promise<void> {
		try {
			// Build the prompt for article generation
			const secondaryKeywordsList = secondaryKeywords.map(k => k.keyword).join(', ');

			const systemPrompt = `You are an expert SEO content writer. Generate a comprehensive, well-structured article in TipTap JSON format.

The article must be returned as valid JSON that TipTap rich text editor can parse. Use this exact structure:
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [{ "type": "text", "text": "Your Main Title" }]
    },
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Introduction paragraph..." }]
    },
    {
      "type": "heading",
      "attrs": { "level": 2 },
      "content": [{ "type": "text", "text": "Section Heading" }]
    },
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "Regular text " },
        { "type": "text", "marks": [{ "type": "bold" }], "text": "bold text" },
        { "type": "text", "text": " and " },
        { "type": "text", "marks": [{ "type": "italic" }], "text": "italic text" }
      ]
    },
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "List item 1" }] }]
        },
        {
          "type": "listItem",
          "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "List item 2" }] }]
        }
      ]
    },
    {
      "type": "orderedList",
      "content": [
        {
          "type": "listItem",
          "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Step 1" }] }]
        }
      ]
    },
    {
      "type": "blockquote",
      "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Quote text" }] }]
    }
  ]
}

Available node types: doc, paragraph, heading (levels 1-4), bulletList, orderedList, listItem, blockquote, codeBlock, horizontalRule
Available marks: bold, italic, strike, code, link (with href attr)

IMPORTANT: 
- Return ONLY the JSON object, no markdown code blocks or explanations
- The JSON must be valid and parseable
- Include comprehensive content with multiple sections
- Use proper headings hierarchy (h1 for title, h2 for sections, h3 for subsections)
- Include bullet points and numbered lists where appropriate
- Make the content SEO-optimized for the given keywords`;

			let userPrompt = `Generate an SEO-optimized article with the following details:

**Title:** ${dto.title}

**Primary Keyword:** ${primaryKeyword.keyword}
${secondaryKeywordsList ? `**Secondary Keywords to incorporate:** ${secondaryKeywordsList}` : ''}

**Content Briefing/Instructions:**
${dto.contentBriefing}
`;

			if (dto.referenceContent) {
				userPrompt += `
**Reference Content to draw from:**
${dto.referenceContent.substring(0, 5000)}
`;
			}

			userPrompt += `
Generate a comprehensive, engaging article that:
1. Naturally incorporates the primary and secondary keywords
2. Is well-structured with clear headings and subheadings
3. Provides valuable, actionable information
4. Is optimized for search engines
5. Is at least 1500 words

Return the article in TipTap JSON format as specified.`;

			const response = await this.openAiService.chat([
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userPrompt },
			]);

			// Parse the response
			let contentJson: object;
			let content: string;

			try {
				// Clean the response - remove any markdown code blocks if present
				let jsonString = response.content.trim();
				if (jsonString.startsWith('```json')) {
					jsonString = jsonString.slice(7);
				} else if (jsonString.startsWith('```')) {
					jsonString = jsonString.slice(3);
				}
				if (jsonString.endsWith('```')) {
					jsonString = jsonString.slice(0, -3);
				}
				jsonString = jsonString.trim();

				contentJson = JSON.parse(jsonString);
				content = this.extractTextFromTipTapJson(contentJson);
			} catch (parseError) {
				this.logger.error('Failed to parse AI response as JSON:', parseError);
				// Save raw content as fallback
				contentJson = {
					type: 'doc',
					content: [
						{
							type: 'paragraph',
							content: [{ type: 'text', text: response.content }],
						},
					],
				};
				content = response.content;
			}

			// Update article with generated content
			await this.articlesRepository.updateContent(
				articleId,
				content,
				contentJson,
				response.tokenUsage,
			);
		} catch (error) {
			this.logger.error(`Article generation failed for ${articleId}:`, error);
			await this.articlesRepository.updateStatus(
				articleId,
				ArticleStatus.FAILED,
				error.message || 'Unknown error during generation',
			);
		}
	}

	private extractTextFromTipTapJson(json: any): string {
		if (!json || typeof json !== 'object') return '';

		let text = '';

		if (json.text) {
			text += json.text;
		}

		if (json.content && Array.isArray(json.content)) {
			for (const child of json.content) {
				text += this.extractTextFromTipTapJson(child);
				// Add spacing between blocks
				if (['heading', 'paragraph', 'listItem', 'blockquote'].includes(child.type)) {
					text += '\n';
				}
			}
		}

		return text;
	}

	async regenerateTitle(userId: string, dto: RegenerateTitleDto): Promise<{ title: string; }> {
		const { primaryKeywordId, context } = dto;

		// Get keyword
		const keyword = await this.keywordsRepository.findOne({
			where: { keywordId: primaryKeywordId, userId },
		});

		if (!keyword) {
			throw new NotFoundException('Keyword not found');
		}

		const prompt = `Generate an engaging, SEO-optimized article title for the following keyword:

Keyword: ${keyword.keyword}
${context ? `Additional context: ${context}` : ''}

Requirements:
- The title should be compelling and click-worthy
- Include the main keyword naturally
- Keep it under 60 characters for SEO
- Make it specific and valuable to readers

Return ONLY the title text, nothing else.`;

		const response = await this.openAiService.chat([
			{ role: 'user', content: prompt },
		]);

		return { title: response.content.trim() };
	}

	async updateArticle(articleId: string, userId: string, dto: UpdateArticleDto): Promise<Article> {
		const article = await this.getArticleById(articleId, userId);

		// Update only provided fields
		if (dto.title !== undefined) article.title = dto.title;
		if (dto.content !== undefined) article.content = dto.content;
		if (dto.contentJson !== undefined) article.contentJson = dto.contentJson;
		if (dto.status !== undefined) article.status = dto.status;

		await this.articlesRepository.update(
			{ articleId },
			{
				title: article.title,
				content: article.content,
				contentJson: article.contentJson,
				status: article.status,
			},
		);

		return this.articlesRepository.findByIdWithRelations(articleId);
	}

	async deleteArticle(articleId: string, userId: string): Promise<void> {
		const article = await this.getArticleById(articleId, userId);
		await this.articlesRepository.delete(article.articleId);
	}
}
