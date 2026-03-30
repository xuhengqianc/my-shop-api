import { Body, Inject, Post, Provide } from '@midwayjs/core';
import { CoolController, BaseController } from '@cool-midway/core';
import { CoursewareService } from '../../service/courseware';
import { ProgressService } from '../../../progress/service/progress';

/**
 * 课件（APP端）
 */
@Provide()
@CoolController('/app/courseware')
export class AppCoursewareController extends BaseController {
  @Inject()
  coursewareService: CoursewareService;

  @Inject()
  progressService: ProgressService;

  @Inject()
  ctx;

  @Post('/getChapterCourseware')
  async getChapterCourseware(@Body() body: any) {
    const { chapterId } = body;
    await this.progressService.ensureChapterUnlocked(this.ctx.user.id, chapterId);
    return this.ok(await this.coursewareService.getByChapterId(chapterId));
  }
}
