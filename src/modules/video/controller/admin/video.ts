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

  @Post('/list')
  async getList(@Body() body: any) {
    const { chapterId } = body || {};
    return this.ok(await this.videoService.list(chapterId));
  }

  /**
   * 获取视频详情
   */
  @Post('/info')
  async getInfo(@Body() body: any) {
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
  async create(@Body() body: any) {
    await this.videoService.add(body);
    return this.ok();
  }

  /**
   * 更新视频
   */
  @Post('/update')
  async modify(@Body() body: any) {
    await this.videoService.update(body);
    return this.ok();
  }

  /**
   * 删除视频
   */
  @Post('/delete')
  async remove(@Body() body: any) {
    const { ids } = body;
    await this.videoService.delete(ids);
    return this.ok();
  }
}
