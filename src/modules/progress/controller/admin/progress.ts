import { Body, Inject, Post, Provide } from '@midwayjs/core';
import { CoolController, BaseController } from '@cool-midway/core';
import { ProgressService } from '../../service/progress';

/**
 * 学习进度管理（后台）
 */
@Provide()
@CoolController('/admin/progress')
export class AdminProgressController extends BaseController {
  @Inject()
  progressService: ProgressService;

  /**
   * 获取用户进度
   */
  @Post('/getUserProgress')
  async getUserProgress(@Body() body: any) {
    const { userId } = body;
    return this.ok(await this.progressService.getUserAllProgress(userId));
  }
}
