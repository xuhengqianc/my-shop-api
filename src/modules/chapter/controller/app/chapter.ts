import { Body, Inject, Post, Provide } from '@midwayjs/core';
import { CoolController, BaseController } from '@cool-midway/core';
import { ChapterService } from '../../service/chapter';

/**
 * 章节（APP端）
 */
@Provide()
@CoolController('/app/chapter')
export class AppChapterController extends BaseController {
  @Inject()
  chapterService: ChapterService;

  @Inject()
  ctx;

  /**
   * 获取章节列表
   */
  @Post('/list')
  async list() {
    return this.ok(await this.chapterService.getUserChapterList(this.ctx.user.id));
  }

  /**
   * 获取章节详情
   */
  @Post('/info')
  async getInfo(@Body() body: any) {
    const { id } = body;
    return this.ok(
      await this.chapterService.getUserChapterInfo(this.ctx.user.id, id)
    );
  }
}
