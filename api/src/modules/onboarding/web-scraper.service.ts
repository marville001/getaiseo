import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface ScrapedWebsiteData {
	title?: string;
	description?: string;
	keywords?: string[];
	favicon?: string;
	ogImage?: string;
	headings?: string[];
	links?: string[];
	content?: string;
}

@Injectable()
export class WebScraperService {
	private readonly logger = new Logger(WebScraperService.name);

	async scrapeWebsite(url: string): Promise<ScrapedWebsiteData> {
		try {
			// Ensure URL has protocol
			const normalizedUrl = this.normalizeUrl(url);

			const response = await axios.get(normalizedUrl, {
				timeout: 30000,
				headers: {
					'User-Agent': 'Mozilla/5.0 (compatible; GetAISEO Bot/1.0)',
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				},
				maxRedirects: 5,
			});

			const html = response.data;
			return this.parseHtml(html, normalizedUrl);
		} catch (error) {
			this.logger.error(`Failed to scrape website: ${url}`, error);
			throw new Error(`Failed to scrape website: ${error.message}`);
		}
	}

	private normalizeUrl(url: string): string {
		if (!url.startsWith('http://') && !url.startsWith('https://')) {
			return `https://${url}`;
		}
		return url;
	}

	private parseHtml(html: string, baseUrl: string): ScrapedWebsiteData {
		const result: ScrapedWebsiteData = {};

		// Extract title
		const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
		if (titleMatch) {
			result.title = this.decodeHtmlEntities(titleMatch[1].trim());
		}

		// Extract meta description
		const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
			|| html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
		if (descMatch) {
			result.description = this.decodeHtmlEntities(descMatch[1].trim());
		}

		// Extract meta keywords
		const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i)
			|| html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']keywords["']/i);
		if (keywordsMatch) {
			result.keywords = keywordsMatch[1].split(',').map(k => k.trim()).filter(Boolean);
		}

		// Extract favicon
		const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i)
			|| html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i);
		if (faviconMatch) {
			result.favicon = this.resolveUrl(faviconMatch[1], baseUrl);
		}

		// Extract OG image
		const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
			|| html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
		if (ogImageMatch) {
			result.ogImage = this.resolveUrl(ogImageMatch[1], baseUrl);
		}

		// Extract headings (h1, h2, h3)
		const headings: string[] = [];
		const headingMatches = html.matchAll(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi);
		for (const match of headingMatches) {
			const heading = this.decodeHtmlEntities(this.stripTags(match[1]).trim());
			if (heading) {
				headings.push(heading);
			}
		}
		result.headings = headings.slice(0, 20); // Limit to first 20 headings

		// Extract main content text
		result.content = this.extractTextContent(html);

		// Extract links
		const links: string[] = [];
		const linkMatches = html.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi);
		for (const match of linkMatches) {
			const href = match[1];
			if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('mailto:')) {
				links.push(this.resolveUrl(href, baseUrl));
			}
		}
		result.links = [...new Set(links)].slice(0, 50); // Unique links, limited to 50

		return result;
	}

	private extractTextContent(html: string): string {
		// Remove script and style tags
		let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
		text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
		text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
		text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
		text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');

		// Strip all HTML tags
		text = this.stripTags(text);

		// Clean up whitespace
		text = text.replace(/\s+/g, ' ').trim();

		// Decode HTML entities
		text = this.decodeHtmlEntities(text);

		// Limit content length
		return text.substring(0, 10000);
	}

	private stripTags(html: string): string {
		return html.replace(/<[^>]+>/g, ' ');
	}

	private decodeHtmlEntities(text: string): string {
		const entities: Record<string, string> = {
			'&amp;': '&',
			'&lt;': '<',
			'&gt;': '>',
			'&quot;': '"',
			'&#39;': "'",
			'&nbsp;': ' ',
			'&copy;': '©',
			'&reg;': '®',
			'&trade;': '™',
		};

		let decoded = text;
		for (const [entity, char] of Object.entries(entities)) {
			decoded = decoded.replace(new RegExp(entity, 'gi'), char);
		}

		// Handle numeric entities
		decoded = decoded.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
		decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

		return decoded;
	}

	private resolveUrl(url: string, baseUrl: string): string {
		try {
			return new URL(url, baseUrl).href;
		} catch {
			return url;
		}
	}
}
