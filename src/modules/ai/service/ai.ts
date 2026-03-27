import { BaseService } from '@cool-midway/core';
import { Provide, Config } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { EduAiPromptEntity } from '../entity/prompt';
import { EduAiConversationEntity } from '../entity/conversation';
import axios from 'axios';

/**
 * AI服务
 */
@Provide()
export class AiService extends BaseService {
  @InjectEntityModel(EduAiPromptEntity)
  promptEntity: Repository<EduAiPromptEntity>;

  @InjectEntityModel(EduAiConversationEntity)
  conversationEntity: Repository<EduAiConversationEntity>;

  @Config('ai')
  aiConfig: any;

  // ========== 提示词管理 ==========
  async getPromptList() {
    return await this.promptEntity.find({
      order: { createTime: 'DESC' },
    });
  }

  async getPromptByType(type: string) {
    return await this.promptEntity.findOne({
      where: { type, status: 1 },
    });
  }

  async addPrompt(param: any) {
    const prompt = new EduAiPromptEntity();
    Object.assign(prompt, param);
    return await this.promptEntity.save(prompt);
  }

  async updatePrompt(param: any) {
    await this.promptEntity.update(param.id, param);
  }

  async deletePrompt(ids: number[]) {
    await this.promptEntity.delete(ids);
  }

  // ========== 对话管理 ==========
  async saveConversation(
    userId: number,
    role: string,
    content: string,
    chapterId?: number,
    questionId?: number,
    imageUrl?: string
  ) {
    const conversation = new EduAiConversationEntity();
    conversation.userId = userId;
    conversation.role = role;
    conversation.content = content;
    conversation.chapterId = chapterId;
    conversation.questionId = questionId;
    conversation.imageUrl = imageUrl;
    return await this.conversationEntity.save(conversation);
  }

  async getConversationHistory(userId: number, limit: number = 10) {
    return await this.conversationEntity.find({
      where: { userId },
      order: { createTime: 'DESC' },
      take: limit,
    });
  }

  async clearConversationHistory(userId: number) {
    await this.conversationEntity.delete({ userId });
  }

  // ========== AI对话 ==========
  async chat(userId: number, message: string, type: string = 'chat', questionId?: number) {
    // 获取提示词
    const promptConfig = await this.getPromptByType(type);
    const systemPrompt = promptConfig
      ? promptConfig.prompt
      : '你是一个面向 10-14 岁学生的数学助教。严禁直接给出数学题的最终答案。';

    // 获取历史对话
    const history = await this.getConversationHistory(userId, 5);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.reverse().map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    // 调用DeepSeek API
    try {
      const response = await this.callDeepSeekAPI(messages);

      // 保存对话记录
      await this.saveConversation(userId, 'user', message, null, questionId);
      await this.saveConversation(userId, 'assistant', response, null, questionId);

      return response;
    } catch (error) {
      console.error('DeepSeek API调用失败:', error);
      throw new Error('AI服务暂时不可用');
    }
  }

  /**
   * OCR图片识别 + AI对话
   */
  async chatWithImage(userId: number, imageUrl: string, type: string = 'chat') {
    // TODO: 集成OCR服务（腾讯云/阿里云/百度OCR）
    // 这里先模拟OCR结果
    const ocrText = await this.performOCR(imageUrl);

    // 使用OCR文本进行对话
    const message = `请帮我解答这道题：${ocrText}`;
    const response = await this.chat(userId, message, type);

    // 保存对话记录（包含图片）
    await this.saveConversation(userId, 'user', message, null, null, imageUrl);

    return response;
  }

  /**
   * 调用DeepSeek API
   */
  private async callDeepSeekAPI(messages: any[]): Promise<string> {
    const apiKey = this.aiConfig?.deepseekApiKey || process.env.DEEPSEEK_API_KEY;
    const apiUrl = this.aiConfig?.deepseekApiUrl || 'https://api.deepseek.com/v1/chat/completions';

    if (!apiKey) {
      throw new Error('DeepSeek API Key未配置');
    }

    const response = await axios.post(
      apiUrl,
      {
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 30000,
      }
    );

    return response.data.choices[0].message.content;
  }

  /**
   * OCR图片识别
   */
  private async performOCR(imageUrl: string): Promise<string> {
    // TODO: 集成真实的OCR服务
    // 这里返回模拟数据
    return '题目内容（OCR识别结果）';
  }

  /**
   * 流式响应（用于打字效果）
   */
  async chatStream(userId: number, message: string, type: string = 'chat') {
    // TODO: 实现流式响应
    // 需要使用SSE或WebSocket
    return await this.chat(userId, message, type);
  }
}
