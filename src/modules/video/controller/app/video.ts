import { Body, Inject, Post, Provide } from '@midwayjs/core';
import { CoolController, BaseController } from '@cool-midway/core';
import { VideoService } from '../../service/video';

/**
 * 视频（APP端）
 */
@Provide()
@CoolController('/app/video')
export class AppVideoController extends BaseController {
  @Inject()
  videoService: VideoService;

  /**
   * 获取章节视频
   */
  @Post('/getChapterVideo')
  async getChapterVideo(@Body() body: any) {
    const { chapterId } = body;
    return this.ok(await this.videoService.getChapterVideo(chapterId));
  }
}
