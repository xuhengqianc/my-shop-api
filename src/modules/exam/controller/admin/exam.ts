import { Body, Inject, Post, Provide } from '@midwayjs/core';
import { CoolController, BaseController } from '@cool-midway/core';
import { ExamService } from '../../service/exam';

/**
 * 题库管理（后台）
 */
@Provide()
@CoolController('/admin/exam')
export class AdminExamController extends BaseController {
  @Inject()
  examService: ExamService;

  // ========== 分类管理 ==========
  @Post('/category/list')
  async categoryList() {
    return this.ok(await this.examService.getCategoryList());
  }

  @Post('/category/add')
  async categoryAdd(@Body() body: any) {
    await this.examService.addCategory(body);
    return this.ok();
  }

  @Post('/category/update')
  async categoryUpdate(@Body() body: any) {
    await this.examService.updateCategory(body);
    return this.ok();
  }

  @Post('/category/delete')
  async categoryDelete(@Body() body: any) {
    const { ids } = body;
    await this.examService.deleteCategory(ids);
    return this.ok();
  }

  // ========== 题目管理 ==========
  @Post('/question/list')
  async questionList(@Body() body: any) {
    const { categoryId, type } = body;
    return this.ok(await this.examService.getQuestionList(categoryId, type));
  }

  @Post('/question/info')
  async questionInfo(@Body() body: any) {
    const { id } = body;
    return this.ok(await this.examService.getQuestionInfo(id));
  }

  @Post('/question/add')
  async questionAdd(@Body() body: any) {
    await this.examService.addQuestion(body);
    return this.ok();
  }

  @Post('/question/update')
  async questionUpdate(@Body() body: any) {
    await this.examService.updateQuestion(body);
    return this.ok();
  }

  @Post('/question/delete')
  async questionDelete(@Body() body: any) {
    const { ids } = body;
    await this.examService.deleteQuestion(ids);
    return this.ok();
  }

  // ========== 章节测试管理 ==========
  @Post('/chapterExam/getQuestions')
  async getChapterExamQuestions(@Body() body: any) {
    const { chapterId } = body;
    return this.ok(await this.examService.getChapterExamQuestions(chapterId));
  }

  @Post('/chapterExam/setQuestions')
  async setChapterExamQuestions(@Body() body: any) {
    const { chapterId, questionIds } = body;
    await this.examService.setChapterExamQuestions(chapterId, questionIds);
    return this.ok();
  }
}
