import { Body, Inject, Post, Provide } from '@midwayjs/core';
import { CoolController, BaseController } from '@cool-midway/core';
import { CoursewareService } from '../../service/courseware';

/**
 * 课件管理（后台）
 */
@Provide()
@CoolController('/admin/courseware')
export class AdminCoursewareController extends BaseController {
  @Inject()
  coursewareService: CoursewareService;

  @Post('/list')
  async getList(@Body() body: any) {
    const { chapterId } = body || {};
    return this.ok(await this.coursewareService.list(chapterId));
  }

  @Post('/info')
  async getInfo(@Body() body: any) {
    const { id } = body;
    return this.ok(await this.coursewareService.info(id));
  }

  @Post('/getByChapterId')
  async getByChapterId(@Body() body: any) {
    const { chapterId } = body;
    return this.ok(await this.coursewareService.getByChapterId(chapterId));
  }

  @Post('/add')
  async create(@Body() body: any) {
    await this.coursewareService.add(body);
    return this.ok();
  }

  @Post('/update')
  async modify(@Body() body: any) {
    await this.coursewareService.update(body);
    return this.ok();
  }

  @Post('/delete')
  async remove(@Body() body: any) {
    const { ids } = body;
    await this.coursewareService.delete(ids);
    return this.ok();
  }
}
