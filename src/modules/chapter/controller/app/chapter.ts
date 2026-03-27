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

  /**
   * 获取章节列表
   */
  @Post('/list')
  async list() {
    // TODO: 从token获取userId
    const userId = 1; // 临时写死
    return this.ok(await this.chapterService.getUserChapterList(userId));
  }

  /**
   * 获取章节详情
   */
  @Post('/info')
  async info(@Body() body: any) {
    const { id } = body;
    return this.ok(await this.chapterService.info(id));
  }
}
