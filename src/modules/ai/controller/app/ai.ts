import { Body, Inject, Post, Provide } from '@midwayjs/core';
import { CoolController, BaseController } from '@cool-midway/core';
import { AiService } from '../../service/ai';

/**
 * AI助手（APP端）
 */
@Provide()
@CoolController('/app/ai')
export class AppAiController extends BaseController {
  @Inject()
  aiService: AiService;

  /**
   * 文本对话
   */
  @Post('/chat')
  async chat(@Body() body: any) {
    // TODO: 从token获取userId
    const userId = 1;
    const { message, type, questionId } = body;

    const response = await this.aiService.chat(userId, message, type, questionId);
    return this.ok({ response });
  }

  /**
   * 图片对话（OCR）
   */
  @Post('/chatWithImage')
  async chatWithImage(@Body() body: any) {
    // TODO: 从token获取userId
    const userId = 1;
    const { imageUrl, type } = body;

    const response = await this.aiService.chatWithImage(userId, imageUrl, type);
    return this.ok({ response });
  }

  /**
   * 获取对话历史
   */
  @Post('/getHistory')
  async getHistory(@Body() body: any) {
    // TODO: 从token获取userId
    const userId = 1;
    const { limit } = body;

    return this.ok(await this.aiService.getConversationHistory(userId, limit || 10));
  }

  /**
   * 清空对话历史
   */
  @Post('/clearHistory')
  async clearHistory() {
    // TODO: 从token获取userId
    const userId = 1;

    await this.aiService.clearConversationHistory(userId);
    return this.ok();
  }
}
