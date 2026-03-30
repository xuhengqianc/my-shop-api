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

  @Inject()
  ctx;

  /**
   * 获取我的进度
   */
  @Post('/getMyProgress')
  async getMyProgress() {
    return this.ok(await this.progressService.getUserAllProgress(this.ctx.user.id));
  }

  /**
   * 获取章节进度
   */
  @Post('/getChapterProgress')
  async getChapterProgress(@Body() body: any) {
    const { chapterId } = body;
    return this.ok(
      await this.progressService.getChapterStatus(this.ctx.user.id, chapterId)
    );
  }

  /**
   * 更新视频进度
   */
  @Post('/updateVideoProgress')
  async updateVideoProgress(@Body() body: any) {
    const { chapterId, progress } = body;
    await this.progressService.updateVideoProgress(
      this.ctx.user.id,
      chapterId,
      progress
    );
    return this.ok();
  }

  /**
   * 标记视频完成
   */
  @Post('/markVideoCompleted')
  async markVideoCompleted(@Body() body: any) {
    const { chapterId } = body;
    await this.progressService.markVideoCompleted(this.ctx.user.id, chapterId);
    return this.ok();
  }

  /**
   * 标记测试完成
   */
  @Post('/markExamCompleted')
  async markExamCompleted(@Body() body: any) {
    const { chapterId, score } = body;
    await this.progressService.markExamCompleted(this.ctx.user.id, chapterId, score);
    return this.ok();
  }

  /**
   * 检查章节是否解锁
   */
  @Post('/isChapterUnlocked')
  async isChapterUnlocked(@Body() body: any) {
    const { chapterId } = body;
    const unlocked = await this.progressService.isChapterUnlocked(
      this.ctx.user.id,
      chapterId
    );
    return this.ok({ unlocked });
  }
}
