import { Type } from 'class-transformer';
import {
	ArrayMinSize,
	IsArray,
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Min,
	ValidateNested,
} from 'class-validator';
import { CompetitionLevel } from '../entities/keyword.entity';

export class KeywordItemDto {
	@IsString()
	@IsNotEmpty()
	keyword: string;

	@IsOptional()
	@IsEnum(CompetitionLevel)
	competition?: CompetitionLevel;

	@IsOptional()
	@IsNumber()
	@Min(0)
	volume?: number;
}

export class CreateKeywordsDto {
	@IsArray()
	@ArrayMinSize(1, { message: 'At least one keyword is required' })
	@ValidateNested({ each: true })
	@Type(() => KeywordItemDto)
	keywords: KeywordItemDto[];
}
