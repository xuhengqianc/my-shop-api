import { Body, Inject, Post, Provide } from '@midwayjs/core';
import { CoolController, BaseController } from '@cool-midway/core';
import { ProgressService } from '../../service/progress';

/**
 * 学习进度（APP端）
 */
@Provide()
@CoolController('/app/progress')
export class AppProgressController extends BaseController {
  @Inject()
  progressService: ProgressService;

  /**
   * 获取我的进度
   */
  @Post('/getMyProgress')
  async getMyProgress() {
    // TODO: 从token获取userId
    const userId = 1;
    return this.ok(await this.progressService.getUserAllProgress(userId));
  }

  /**
   * 获取章节进度
   */
  @Post('/getChapterProgress')
  async getChapterProgress(@Body() body: any) {
    // TODO: 从token获取userId
    const userId = 1;
    const { chapterId } = body;
    return this.ok(await this.progressService.getUserProgress(userId, chapterId));
  }

  /**
   * 更新视频进度
   */
  @Post('/updateVideoProgress')
  async updateVideoProgress(@Body() body: any) {
    // TODO: 从token获取userId
    const userId = 1;
    const { chapterId, progress } = body;
    await this.progressService.updateVideoProgress(userId, chapterId, progress);
    return this.ok();
  }

  /**
   * 标记视频完成
   */
  @Post('/markVideoCompleted')
  async markVideoCompleted(@Body() body: any) {
    // TODO: 从token获取userId
    const userId = 1;
    const { chapterId } = body;
    await this.progressService.markVideoCompleted(userId, chapterId);
    return this.ok();
  }

  /**
   * 标记测试完成
   */
  @Post('/markExamCompleted')
  async markExamCompleted(@Body() body: any) {
    // TODO: 从token获取userId
    const userId = 1;
    const { chapterId, score } = body;
    await this.progressService.markExamCompleted(userId, chapterId, score);
    return this.ok();
  }

  /**
   * 检查章节是否解锁
   */
  @Post('/isChapterUnlocked')
  async isChapterUnlocked(@Body() body: any) {
    // TODO: 从token获取userId
    const userId = 1;
    const { chapterId } = body;
    const unlocked = await this.progressService.isChapterUnlocked(userId, chapterId);
    return this.ok({ unlocked });
  }
}
