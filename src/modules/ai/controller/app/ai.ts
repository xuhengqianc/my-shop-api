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

  @Inject()
  ctx;

  /**
   * 文本对话
   */
  @Post('/chat')
  async chat(@Body() body: any) {
    const { message, type, questionId, chapterId } = body;

    const response = await this.aiService.chat(
      this.ctx.user.id,
      message,
      type,
      questionId,
      chapterId
    );
    return this.ok({ response });
  }

  /**
   * 图片对话（OCR）
   */
  @Post('/chatWithImage')
  async chatWithImage(@Body() body: any) {
    const { imageUrl, type, chapterId, questionId } = body;

    return this.ok(
      await this.aiService.chatWithImage(
        this.ctx.user.id,
        imageUrl,
        type,
        chapterId,
        questionId
      )
    );
  }

  /**
   * 获取对话历史
   */
  @Post('/getHistory')
  async getHistory(@Body() body: any) {
    const { limit, chapterId, questionId } = body;

    return this.ok(
      await this.aiService.getConversationHistory(
        this.ctx.user.id,
        limit || 10,
        chapterId,
        questionId
      )
    );
  }

  /**
   * 清空对话历史
   */
  @Post('/clearHistory')
  async clearHistory(@Body() body: any) {
    const { chapterId, questionId } = body || {};
    await this.aiService.clearConversationHistory(
      this.ctx.user.id,
      chapterId,
      questionId
    );
    return this.ok();
  }
}
