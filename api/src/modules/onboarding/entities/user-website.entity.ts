import { AbstractEntity } from '@/database/abstract.entity';
import { User } from '@/modules/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export enum WebsiteScrapingStatus {
	PENDING = 'pending',
	PROCESSING = 'processing',
	COMPLETED = 'completed',
	FAILED = 'failed',
}

@Entity('user_websites')
export class UserWebsite extends AbstractEntity<UserWebsite> {
	@PrimaryGeneratedColumn('uuid', { name: 'website_id' })
	websiteId: string;

	@Column({ name: 'user_id' })
	userId: string;

	@Column({ name: 'website_url' })
	websiteUrl: string;

	@Column({ name: 'website_name', nullable: true })
	websiteName?: string;

	@Column({ name: 'website_description', nullable: true, type: 'text' })
	websiteDescription?: string;

	@Column({ name: 'scraped_content', nullable: true, type: 'text' })
	scrapedContent?: string;

	@Column({ name: 'scraped_meta', nullable: true, type: 'jsonb' })
	scrapedMeta?: {
		title?: string;
		description?: string;
		keywords?: string[];
		favicon?: string;
		ogImage?: string;
		headings?: string[];
		links?: string[];
	};

	@Column({
		name: 'scraping_status',
		type: 'enum',
		enum: WebsiteScrapingStatus,
		default: WebsiteScrapingStatus.PENDING,
	})
	scrapingStatus: WebsiteScrapingStatus;

	@Column({ name: 'scraping_error', nullable: true, type: 'text' })
	scrapingError?: string;

	@Column({ name: 'scraped_at', nullable: true })
	scrapedAt?: Date;

	@Column({ name: 'is_primary', default: false })
	isPrimary: boolean;

	// Relations
	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user: User;
}
