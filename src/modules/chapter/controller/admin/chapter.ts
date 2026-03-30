import { Body, Inject, Post, Provide } from '@midwayjs/core';
import { CoolController, BaseController } from '@cool-midway/core';
import { ChapterService } from '../../service/chapter';

/**
 * 章节管理（后台）
 */
@Provide()
@CoolController('/admin/chapter')
export class AdminChapterController extends BaseController {
  @Inject()
  chapterService: ChapterService;

  /**
   * 获取章节列表
   */
  @Post('/list')
  async getList(@Body() body: any) {
    const { status } = body;
    return this.ok(await this.chapterService.list(status));
  }

  /**
   * 获取章节详情
   */
  @Post('/info')
  async getInfo(@Body() body: any) {
    const { id } = body;
    return this.ok(await this.chapterService.info(id));
  }

  /**
   * 添加章节
   */
  @Post('/add')
  async create(@Body() body: any) {
    await this.chapterService.add(body);
    return this.ok();
  }

  /**
   * 更新章节
   */
  @Post('/update')
  async modify(@Body() body: any) {
    await this.chapterService.update(body);
    return this.ok();
  }

  /**
   * 删除章节
   */
  @Post('/delete')
  async remove(@Body() body: any) {
    const { ids } = body;
    await this.chapterService.delete(ids);
    return this.ok();
  }

  /**
   * 更新排序
   */
  @Post('/updateSort')
  async updateSort(@Body() body: any) {
    const { id, sort } = body;
    await this.chapterService.updateSort(id, sort);
    return this.ok();
  }

  /**
   * 更新状态
   */
  @Post('/updateStatus')
  async updateStatus(@Body() body: any) {
    const { id, status } = body;
    await this.chapterService.updateStatus(id, status);
    return this.ok();
  }
}
