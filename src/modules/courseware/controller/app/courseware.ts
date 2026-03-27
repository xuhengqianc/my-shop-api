import { Body, Inject, Post, Provide } from '@midwayjs/core';
import { CoolController, BaseController } from '@cool-midway/core';
import { CoursewareService } from '../../service/courseware';

/**
 * 课件（APP端）
 */
@Provide()
@CoolController('/app/courseware')
export class AppCoursewareController extends BaseController {
  @Inject()
  coursewareService: CoursewareService;

  @Post('/getChapterCourseware')
  async getChapterCourseware(@Body() body: any) {
    const { chapterId } = body;
    return this.ok(await this.coursewareService.getByChapterId(chapterId));
  }
}
