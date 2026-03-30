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

  @Inject()
  ctx;

  /**
   * 获取章节测试题目
   */
  @Post('/getChapterQuestions')
  async getChapterQuestions(@Body() body: any) {
    const { chapterId } = body;
    return this.ok(
      await this.examService.getChapterQuestionsForUser(
        this.ctx.user.id,
        chapterId
      )
    );
  }

  /**
   * 提交答案
   */
  @Post('/submitAnswer')
  async submitAnswer(@Body() body: any) {
    const { chapterId, questionId, userAnswer } = body;

    const result = await this.examService.submitAnswer(
      this.ctx.user.id,
      chapterId,
      questionId,
      userAnswer
    );

    return this.ok(result);
  }

  @Post('/submitChapter')
  async submitChapter(@Body() body: any) {
    const { chapterId, answers } = body;
    return this.ok(
      await this.examService.submitChapterAnswers(
        this.ctx.user.id,
        chapterId,
        answers || []
      )
    );
  }

  /**
   * 获取章节答题记录
   */
  @Post('/getChapterRecords')
  async getChapterRecords(@Body() body: any) {
    const { chapterId } = body;

    return this.ok(
      await this.examService.getChapterExamOverview(this.ctx.user.id, chapterId)
    );
  }

  /**
   * AI帮助计数
   */
  @Post('/aiHelp')
  async aiHelp(@Body() body: any) {
    const { chapterId, questionId } = body;

    await this.examService.incrementAiHelpCount(
      this.ctx.user.id,
      chapterId,
      questionId
    );
    return this.ok();
  }
}
