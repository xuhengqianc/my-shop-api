import { BaseService } from '@cool-midway/core';
import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { EduQuestionCategoryEntity } from '../entity/category';
import { EduQuestionEntity } from '../entity/question';
import { EduChapterExamEntity } from '../entity/chapter-exam';
import { EduAnswerRecordEntity } from '../entity/answer-record';

/**
 * 题库服务
 */
@Provide()
export class ExamService extends BaseService {
  @InjectEntityModel(EduQuestionCategoryEntity)
  categoryEntity: Repository<EduQuestionCategoryEntity>;

  @InjectEntityModel(EduQuestionEntity)
  questionEntity: Repository<EduQuestionEntity>;

  @InjectEntityModel(EduChapterExamEntity)
  chapterExamEntity: Repository<EduChapterExamEntity>;

  @InjectEntityModel(EduAnswerRecordEntity)
  answerRecordEntity: Repository<EduAnswerRecordEntity>;

  // ========== 分类管理 ==========
  async getCategoryList() {
    return await this.categoryEntity.find({
      where: { status: 1 },
      order: { sort: 'ASC' },
    });
  }

  async addCategory(param: any) {
    const category = new EduQuestionCategoryEntity();
    Object.assign(category, param);
    return await this.categoryEntity.save(category);
  }

  async updateCategory(param: any) {
    await this.categoryEntity.update(param.id, param);
  }

  async deleteCategory(ids: number[]) {
    await this.categoryEntity.delete(ids);
  }

  // ========== 题目管理 ==========
  async getQuestionList(categoryId?: number, type?: number) {
    const query = this.questionEntity.createQueryBuilder('q');

    if (categoryId) {
      query.where('q.categoryId = :categoryId', { categoryId });
    }
    if (type) {
      query.andWhere('q.type = :type', { type });
    }

    return await query.orderBy('q.createTime', 'DESC').getMany();
  }

  async getQuestionInfo(id: number) {
    return await this.questionEntity.findOne({ where: { id } });
  }

  async addQuestion(param: any) {
    const question = new EduQuestionEntity();
    Object.assign(question, param);
    return await this.questionEntity.save(question);
  }

  async updateQuestion(param: any) {
    await this.questionEntity.update(param.id, param);
  }

  async deleteQuestion(ids: number[]) {
    await this.questionEntity.delete(ids);
  }

  // ========== 章节测试管理 ==========
  async getChapterExamQuestions(chapterId: number) {
    const exams = await this.chapterExamEntity.find({
      where: { chapterId },
      order: { sort: 'ASC' },
    });

    const questionIds = exams.map(e => e.questionId);
    if (questionIds.length === 0) {
      return [];
    }

    const questions = await this.questionEntity.findByIds(questionIds);

    // 按照exam的排序返回
    const questionMap = new Map(questions.map(q => [q.id, q]));
    return exams.map(e => questionMap.get(e.questionId)).filter(q => q);
  }

  async setChapterExamQuestions(chapterId: number, questionIds: number[]) {
    // 删除旧的
    await this.chapterExamEntity.delete({ chapterId });

    // 添加新的
    const exams = questionIds.map((qid, index) => {
      const exam = new EduChapterExamEntity();
      exam.chapterId = chapterId;
      exam.questionId = qid;
      exam.sort = index;
      return exam;
    });

    if (exams.length > 0) {
      await this.chapterExamEntity.save(exams);
    }
  }

  // ========== 答题记录 ==========
  async submitAnswer(userId: number, chapterId: number, questionId: number, userAnswer: string) {
    // 获取题目
    const question = await this.questionEntity.findOne({ where: { id: questionId } });
    if (!question) {
      throw new Error('题目不存在');
    }

    // 判断答案是否正确
    const isCorrect = this.checkAnswer(question, userAnswer);

    // 查找是否已有记录
    let record = await this.answerRecordEntity.findOne({
      where: { userId, chapterId, questionId },
    });

    if (record) {
      // 更新记录
      record.userAnswer = userAnswer;
      record.isCorrect = isCorrect ? 1 : 0;
      await this.answerRecordEntity.save(record);
    } else {
      // 创建新记录
      record = new EduAnswerRecordEntity();
      record.userId = userId;
      record.chapterId = chapterId;
      record.questionId = questionId;
      record.userAnswer = userAnswer;
      record.isCorrect = isCorrect ? 1 : 0;
      record.aiHelpCount = 0;
      await this.answerRecordEntity.save(record);
    }

    return {
      isCorrect,
      answer: question.answer,
      analysis: question.analysis,
    };
  }

  async getChapterAnswerRecords(userId: number, chapterId: number) {
    return await this.answerRecordEntity.find({
      where: { userId, chapterId },
    });
  }

  async incrementAiHelpCount(userId: number, chapterId: number, questionId: number) {
    const record = await this.answerRecordEntity.findOne({
      where: { userId, chapterId, questionId },
    });

    if (record) {
      record.aiHelpCount += 1;
      await this.answerRecordEntity.save(record);
    }
  }

  // ========== 辅助方法 ==========
  private checkAnswer(question: EduQuestionEntity, userAnswer: string): boolean {
    const correctAnswer = question.answer.trim().toLowerCase();
    const answer = userAnswer.trim().toLowerCase();

    // 简单的字符串比较
    return correctAnswer === answer;
  }
}
