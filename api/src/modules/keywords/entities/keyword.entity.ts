import { AbstractEntity } from '@/database/abstract.entity';
import { User } from '@/modules/users/entities/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export enum CompetitionLevel {
	LOW = 'low',
	MEDIUM = 'medium',
	HIGH = 'high',
}

@Entity('keywords')
@Index(['userId', 'keyword'], { unique: true })
export class Keyword extends AbstractEntity<Keyword> {
	@PrimaryGeneratedColumn('uuid', { name: 'keyword_id' })
	keywordId: string;

	@Column({ name: 'user_id' })
	userId: string;

	@Column()
	keyword: string;

	@Column({
		type: 'enum',
		enum: CompetitionLevel,
		default: CompetitionLevel.MEDIUM,
	})
	competition: CompetitionLevel;

	@Column({ type: 'int', default: 0 })
	volume: number;

	@Column({ name: 'recommended_title', nullable: true, type: 'text' })
	recommendedTitle: string;

	@Column({ name: 'ai_analysis', nullable: true, type: 'json' })
	aiAnalysis: {
		competitionScore?: number;
		volumeEstimate?: number;
		difficulty?: string;
		trend?: string;
	};

	@Column({ name: 'is_analyzed', default: false })
	isAnalyzed: boolean;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user: User;
}
