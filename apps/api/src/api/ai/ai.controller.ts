import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import {
  DisputeAnalysisDto,
  GenerateTextDto,
  ImageAnalysisDto,
  MarketSentimentDto,
  SpeechDto,
} from './ai.dto';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('text')
  @ApiOperation({ summary: 'Generate AI text response' })
  async generateText(@Body() body: GenerateTextDto) {
    const text = await this.aiService.generateText(body.model, body.prompt, body.config);
    return { text };
  }

  @Post('market-sentiment')
  @ApiOperation({ summary: 'Generate market sentiment insights' })
  async getMarketSentiment(@Body() body: MarketSentimentDto) {
    return this.aiService.getMarketSentiment(body.symbol, body.price, body.change24h, body.volume);
  }

  @Post('dispute-analysis')
  @ApiOperation({ summary: 'Analyze P2P dispute conversation' })
  async analyzeDispute(@Body() body: DisputeAnalysisDto) {
    return this.aiService.analyzeDispute(body.chatHistory, body.reason, body.buyerName, body.sellerName);
  }

  @Post('analyze-image')
  @ApiOperation({ summary: 'Analyze image content with AI' })
  async analyzeImage(@Body() body: ImageAnalysisDto) {
    const text = await this.aiService.analyzeImage(body.base64Image, body.prompt);
    return { text };
  }

  @Post('speech')
  @ApiOperation({ summary: 'Generate AI speech audio' })
  async generateSpeech(@Body() body: SpeechDto) {
    const audioBase64 = await this.aiService.generateSpeech(body.text);
    return { audioBase64 };
  }
}
