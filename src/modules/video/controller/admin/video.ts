import { Body, Inject, Post, Provide } from '@midwayjs/core';
import { CoolController, BaseController } from '@cool-midway/core';
import { VideoService } from '../../service/video';

/**
 * 视频管理（后台）
 */
@Provide()
@CoolController('/admin/video')
export class AdminVideoController extends BaseController {
  @Inject()
  videoService: VideoService;

  /**
   * 获取视频详情
   */
  @Post('/info')
  async info(@Body() body: any) {
    const { id } = body;
    return this.ok(await this.videoService.info(id));
  }

  /**
   * 根据章节ID获取视频
   */
  @Post('/getByChapterId')
  async getByChapterId(@Body() body: any) {
    const { chapterId } = body;
    const video = await this.videoService.getByChapterId(chapterId);
    if (video) {
      return this.ok(await this.videoService.info(video.id));
    }
    return this.ok(null);
  }

  /**
   * 添加视频
   */
  @Post('/add')
  async add(@Body() body: any) {
    await this.videoService.add(body);
    return this.ok();
  }

  /**
   * 更新视频
   */
  @Post('/update')
  async update(@Body() body: any) {
    await this.videoService.update(body);
    return this.ok();
  }

  /**
   * 删除视频
   */
  @Post('/delete')
  async delete(@Body() body: any) {
    const { ids } = body;
    await this.videoService.delete(ids);
    return this.ok();
  }
}
