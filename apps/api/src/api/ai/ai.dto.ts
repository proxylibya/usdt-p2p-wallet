import { IsArray, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class GenerateTextDto {
  @IsString()
  @IsNotEmpty()
  model: string;

  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}

export class MarketSentimentDto {
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @IsNumber()
  price: number;

  @IsNumber()
  change24h: number;

  @IsNumber()
  volume: number;
}

export class DisputeAnalysisDto {
  @IsArray()
  chatHistory: any[];

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsNotEmpty()
  buyerName: string;

  @IsString()
  @IsNotEmpty()
  sellerName: string;
}

export class ImageAnalysisDto {
  @IsString()
  @IsNotEmpty()
  base64Image: string;

  @IsString()
  @IsNotEmpty()
  prompt: string;
}

export class SpeechDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}
