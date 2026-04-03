import { BaseService } from '@cool-midway/core';
import { Provide, Config, Inject, Logger, ILogger } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { EduAiPromptEntity } from '../entity/prompt';
import { EduAiConversationEntity } from '../entity/conversation';
import axios from 'axios';
import { ChapterService } from '../../chapter/service/chapter';
import { ExamService } from '../../exam/service/exam';
import { VideoService } from '../../video/service/video';
import { CoursewareService } from '../../courseware/service/courseware';

@Provide()
export class AiService extends BaseService {
  @Logger()
  logger: ILogger;

  @InjectEntityModel(EduAiPromptEntity)
  promptEntity: Repository<EduAiPromptEntity>;

  @InjectEntityModel(EduAiConversationEntity)
  conversationEntity: Repository<EduAiConversationEntity>;

  @Config('ai')
  aiConfig: any;

  @Inject()
  chapterService: ChapterService;

  @Inject()
  examService: ExamService;

  @Inject()
  videoService: VideoService;

  @Inject()
  coursewareService: CoursewareService;

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
    return await this.promptEntity.save({
      ...param,
      status: param.status ?? 1,
    });
  }

  async updatePrompt(param: any) {
    await this.promptEntity.update(param.id, param);
  }

  async deletePrompt(ids: number[]) {
    await this.promptEntity.delete(ids);
  }

  async saveConversation(
    userId: number,
    role: string,
    content: string,
    chapterId?: number,
    questionId?: number,
    imageUrl?: string
  ) {
    return await this.conversationEntity.save({
      userId,
      role,
      content,
      chapterId,
      questionId,
      imageUrl,
    });
  }

  async getConversationHistory(
    userId: number,
    limit: number = 10,
    chapterId?: number,
    questionId?: number
  ) {
    const where: any = { userId };
    if (chapterId) {
      where.chapterId = chapterId;
    }
    if (questionId) {
      where.questionId = questionId;
    }

    return await this.conversationEntity.find({
      where,
      order: { createTime: 'DESC' },
      take: limit,
    });
  }

  async clearConversationHistory(
    userId: number,
    chapterId?: number,
    questionId?: number
  ) {
    if (chapterId && questionId) {
      await this.conversationEntity.delete({ userId, chapterId, questionId });
      return;
    }
    if (chapterId) {
      await this.conversationEntity.delete({ userId, chapterId });
      return;
    }
    await this.conversationEntity.delete({ userId });
  }

  async chat(
    userId: number,
    message: string,
    type: string = 'chat',
    questionId?: number,
    chapterId?: number,
    imageUrl?: string
  ) {
    const systemPrompt = await this.buildSystemPrompt(type, chapterId, questionId);
    const history = await this.getConversationHistory(
      userId,
      8,
      chapterId,
      questionId
    );
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.reverse().map(item => ({
        role: item.role,
        content: item.content,
      })),
      { role: 'user', content: message },
    ];

    const response = await this.callAi(messages, type, message);

    await this.saveConversation(
      userId,
      'user',
      message,
      chapterId,
      questionId,
      imageUrl
    );
    await this.saveConversation(
      userId,
      'assistant',
      response,
      chapterId,
      questionId
    );

    return response;
  }

  async chatWithImage(
    userId: number,
    imageUrl: string,
    type: string = 'chat',
    chapterId?: number,
    questionId?: number
  ) {
    const ocrText = await this.performOCR(imageUrl);
    const textMessage = ocrText
      ? `学生上传了一张题目图片，OCR 识别结果如下：${ocrText}`
      : '学生上传了一张题目图片，但当前未能识别出文字内容。请先引导学生补充题干、已知条件和自己的思路。';

    const response = await this.chat(
      userId,
      textMessage,
      type,
      questionId,
      chapterId,
      imageUrl
    );

    return {
      response,
      ocrText,
    };
  }

  async chatStream(
    userId: number,
    message: string,
    type: string = 'chat',
    questionId?: number,
    chapterId?: number
  ) {
    return await this.chat(userId, message, type, questionId, chapterId);
  }

  private async buildSystemPrompt(
    type: string,
    chapterId?: number,
    questionId?: number
  ) {
    const promptConfig = await this.getPromptByType(type);
    const basePrompt =
      promptConfig?.prompt ||
      '你是一个面向 10-14 岁学生的数学助教。严禁直接给出最终答案，必须使用 2-3 个循序渐进的引导问题帮助学生自己思考。';

    const contextParts = [
      '回答要求：语气鼓励、清晰、卡通感一些，但不要幼稚；优先指出思路，不直接给结果。',
    ];

    if (chapterId) {
      const chapter = await this.chapterService.info(chapterId).catch(() => null);
      if (chapter) {
        contextParts.push(`当前章节：${chapter.name}`);
        if (chapter.description) {
          contextParts.push(`章节描述：${chapter.description}`);
        }
        const video = await this.videoService
          .getChapterVideo(chapterId)
          .catch(() => null);
        const courseware = await this.coursewareService
          .getByChapterId(chapterId)
          .catch(() => null);

        if (video?.title) {
          contextParts.push(`微课标题：${video.title}`);
        }
        if (video?.markers?.length) {
          contextParts.push(
            `视频知识点：${video.markers
              .map(item => item.title)
              .join('、')}`
          );
        }
        if (courseware?.title) {
          contextParts.push(`课件：${courseware.title}`);
        }
      }
    }

    if (type === 'exam' && chapterId) {
      const questionCount = await this.examService
        .getChapterQuestionCount(chapterId)
        .catch(() => 0);
      if (questionCount) {
        contextParts.push(`当前是章末测试辅导，题目总数 ${questionCount}。不要直接给出答案。`);
      }
    }

    if (questionId) {
      const question = await this.examService.getQuestionInfo(questionId);
      if (question) {
        contextParts.push(`关联题目：${question.title}`);
        if (question.content) {
          contextParts.push(`题干补充：${question.content}`);
        }
      }
    }

    return [basePrompt, ...contextParts].join('\n');
  }

  private async callAi(messages: any[], type: string, rawMessage: string) {
    const apiKey = this.aiConfig?.deepseekApiKey || process.env.DEEPSEEK_API_KEY;
    const apiUrl =
      this.aiConfig?.deepseekApiUrl ||
      process.env.DEEPSEEK_API_URL ||
      'https://api.deepseek.com/v1/chat/completions';
    const model =
      this.aiConfig?.deepseekModel || process.env.DEEPSEEK_MODEL || 'deepseek-chat';

    if (!apiKey) {
      this.logger.warn('[edu-ai] DeepSeek API key missing, using fallback reply');
      return this.buildFallbackReply(type, rawMessage);
    }

    try {
      const response = await axios.post(
        apiUrl,
        {
          model,
          messages,
          temperature: 0.7,
          max_tokens: 1200,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: 30000,
        }
      );

      return response.data?.choices?.[0]?.message?.content || this.buildFallbackReply(type, rawMessage);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 'unknown';
        const detail =
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          error.message;
        this.logger.error(
          `[edu-ai] DeepSeek request failed (${status}), using fallback reply: ${detail}`
        );
      } else {
        const detail = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `[edu-ai] DeepSeek request failed, using fallback reply: ${detail}`
        );
      }
      return this.buildFallbackReply(type, rawMessage);
    }
  }

  private async performOCR(imageUrl: string) {
    const apiUrl = this.aiConfig?.ocrApiUrl || process.env.OCR_API_URL;
    const apiKey = this.aiConfig?.ocrApiKey || process.env.OCR_API_KEY;

    if (!apiUrl) {
      return '';
    }

    try {
      const response = await axios.post(
        apiUrl,
        { imageUrl },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
          timeout: 20000,
        }
      );

      return (
        response.data?.text ||
        response.data?.data?.text ||
        response.data?.result?.text ||
        ''
      );
    } catch (error) {
      return '';
    }
  }

  private buildFallbackReply(type: string, rawMessage: string) {
    const intro =
      type === 'exam'
        ? '我们先不急着看答案，先把这道题拆开。'
        : '我来陪你一起想，但我不会直接把答案告诉你。';

    return [
      intro,
      '先回答这 3 个问题：',
      `1. 题目里最关键的已知条件是什么？`,
      `2. 你觉得它更像哪一类问题，为什么？`,
      `3. 如果先走第一步，你准备从哪条线索开始？`,
      `你刚才的问题是：${String(rawMessage || '').slice(0, 120)}`,
    ].join('\n');
  }
}
