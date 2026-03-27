import { Body, Inject, Post, Provide } from '@midwayjs/core';
import { CoolController, BaseController } from '@cool-midway/core';
import { ExamService } from '../../service/exam';

/**
 * 题库（APP端）
 */
@Provide()
@CoolController('/app/exam')
export class AppExamController extends BaseController {
  @Inject()
  examService: ExamService;

  /**
   * 获取章节测试题目
   */
  @Post('/getChapterQuestions')
  async getChapterQuestions(@Body() body: any) {
    const { chapterId } = body;
    const questions = await this.examService.getChapterExamQuestions(chapterId);

    // 不返回答案给前端
    return this.ok(
      questions.map(q => ({
        id: q.id,
        type: q.type,
        title: q.title,
        content: q.content,
        options: q.options,
        difficulty: q.difficulty,
      }))
    );
  }

  /**
   * 提交答案
   */
  @Post('/submitAnswer')
  async submitAnswer(@Body() body: any) {
    // TODO: 从token获取userId
    const userId = 1;
    const { chapterId, questionId, userAnswer } = body;

    const result = await this.examService.submitAnswer(
      userId,
      chapterId,
      questionId,
      userAnswer
    );

    return this.ok(result);
  }

  /**
   * 获取章节答题记录
   */
  @Post('/getChapterRecords')
  async getChapterRecords(@Body() body: any) {
    // TODO: 从token获取userId
    const userId = 1;
    const { chapterId } = body;

    return this.ok(await this.examService.getChapterAnswerRecords(userId, chapterId));
  }

  /**
   * AI帮助计数
   */
  @Post('/aiHelp')
  async aiHelp(@Body() body: any) {
    // TODO: 从token获取userId
    const userId = 1;
    const { chapterId, questionId } = body;

    await this.examService.incrementAiHelpCount(userId, chapterId, questionId);
    return this.ok();
  }
}
