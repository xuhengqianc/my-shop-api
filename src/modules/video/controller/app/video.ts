import { Body, Inject, Post, Provide } from '@midwayjs/core';
import { CoolController, BaseController } from '@cool-midway/core';
import { VideoService } from '../../service/video';
import { ProgressService } from '../../../progress/service/progress';

/**
 * 视频（APP端）
 */
@Provide()
@CoolController('/app/video')
export class AppVideoController extends BaseController {
  @Inject()
  videoService: VideoService;

  @Inject()
  progressService: ProgressService;

  @Inject()
  ctx;

  /**
   * 获取章节视频
   */
  @Post('/getChapterVideo')
  async getChapterVideo(@Body() body: any) {
    const { chapterId } = body;
    await this.progressService.ensureChapterUnlocked(this.ctx.user.id, chapterId);
    return this.ok(await this.videoService.getChapterVideo(chapterId));
  }
}
