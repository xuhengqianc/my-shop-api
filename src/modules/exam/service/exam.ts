import { BaseService, CoolCommException } from '@cool-midway/core';
import { Inject, Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { EduQuestionCategoryEntity } from '../entity/category';
import { EduQuestionEntity } from '../entity/question';
import { EduChapterExamEntity } from '../entity/chapter-exam';
import { EduAnswerRecordEntity } from '../entity/answer-record';
import { ProgressService } from '../../progress/service/progress';

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

  @Inject()
  progressService: ProgressService;

  async getCategoryList() {
    return await this.categoryEntity.find({
      order: { sort: 'ASC', createTime: 'ASC' },
    });
  }

  async addCategory(param: any) {
    return await this.categoryEntity.save({
      ...param,
      status: param.status ?? 1,
    });
  }

  async updateCategory(param: any) {
    await this.categoryEntity.update(param.id, param);
  }

  async deleteCategory(ids: number[]) {
    await this.categoryEntity.delete(ids);
  }

  async getQuestionList(categoryId?: number, type?: number) {
    const query = this.questionEntity.createQueryBuilder('q');

    if (categoryId) {
      query.where('q.categoryId = :categoryId', { categoryId });
    }
    if (type) {
      query.andWhere('q.type = :type', { type });
    }

    return await query
      .orderBy('q.createTime', 'DESC')
      .addOrderBy('q.id', 'DESC')
      .getMany();
  }

  async getQuestionInfo(id: number) {
    return await this.questionEntity.findOne({ where: { id } });
  }

  async addQuestion(param: any) {
    return await this.questionEntity.save({
      ...param,
      options: this.normalizeOptions(param.options),
      status: param.status ?? 1,
    });
  }

  async updateQuestion(param: any) {
    await this.questionEntity.update(param.id, {
      ...param,
      options: this.normalizeOptions(param.options),
    });
  }

  async deleteQuestion(ids: number[]) {
    await this.questionEntity.delete(ids);
  }

  async getChapterExamQuestions(chapterId: number) {
    const exams = await this.chapterExamEntity.find({
      where: { chapterId },
      order: { sort: 'ASC', createTime: 'ASC' },
    });

    if (!exams.length) {
      return [];
    }

    const questionIds = exams.map(item => Number(item.questionId));
    const questions = await this.questionEntity.findByIds(questionIds);
    const questionMap = new Map(questions.map(item => [Number(item.id), item]));

    return exams
      .map(item => questionMap.get(Number(item.questionId)))
      .filter(Boolean);
  }

  async getChapterQuestionCount(chapterId: number) {
    return await this.chapterExamEntity.count({
      where: { chapterId },
    });
  }

  async setChapterExamQuestions(chapterId: number, questionIds: number[]) {
    await this.chapterExamEntity.delete({ chapterId });

    const uniqueQuestionIds = Array.from(
      new Set((questionIds || []).map(item => Number(item)))
    ).filter(Boolean);

    if (!uniqueQuestionIds.length) {
      return;
    }

    await this.chapterExamEntity.save(
      uniqueQuestionIds.map((questionId, index) => ({
        chapterId,
        questionId,
        sort: index,
      }))
    );
  }

  async getChapterQuestionsForUser(userId: number, chapterId: number) {
    await this.progressService.ensureChapterUnlocked(userId, chapterId);

    const questions = await this.getChapterExamQuestions(chapterId);
    const records = await this.getChapterAnswerRecords(userId, chapterId);
    const recordMap = new Map(records.map(item => [Number(item.questionId), item]));

    return questions.map(question => {
      const record = recordMap.get(Number(question.id));
      return {
        id: question.id,
        categoryId: question.categoryId,
        type: question.type,
        title: question.title,
        content: question.content,
        options: this.normalizeOptions(question.options),
        difficulty: question.difficulty,
        record: record
          ? {
              userAnswer: this.deserializeAnswer(record.userAnswer),
              isCorrect: record.isCorrect,
              aiHelpCount: record.aiHelpCount,
            }
          : null,
      };
    });
  }

  async getChapterExamOverview(userId: number, chapterId: number) {
    const questions = await this.getChapterExamQuestions(chapterId);
    const records = await this.getChapterAnswerRecords(userId, chapterId);
    const answeredCount = records.filter(item => this.hasAnswer(item.userAnswer)).length;
    const correctCount = records.filter(item => item.isCorrect === 1).length;
    const totalQuestions = questions.length;
    const score =
      totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const completed = totalQuestions > 0 && answeredCount >= totalQuestions ? 1 : 0;

    return {
      totalQuestions,
      answeredCount,
      correctCount,
      score,
      completed,
      records: records.map(item => ({
        ...item,
        userAnswer: this.deserializeAnswer(item.userAnswer),
      })),
    };
  }

  async submitAnswer(
    userId: number,
    chapterId: number,
    questionId: number,
    userAnswer: any
  ) {
    await this.progressService.ensureChapterUnlocked(userId, chapterId);

    const question = await this.questionEntity.findOne({ where: { id: questionId } });
    if (!question) {
      throw new CoolCommException('题目不存在');
    }

    const inChapter = await this.chapterExamEntity.findOne({
      where: { chapterId, questionId },
    });
    if (!inChapter) {
      throw new CoolCommException('该题目不属于当前章节');
    }

    const serializedAnswer = this.serializeAnswer(userAnswer);
    const isCorrect = this.checkAnswer(question, userAnswer);

    const existing = await this.answerRecordEntity.findOne({
      where: { userId, chapterId, questionId },
    });

    if (existing) {
      existing.userAnswer = serializedAnswer;
      existing.isCorrect = isCorrect ? 1 : 0;
      await this.answerRecordEntity.save(existing);
    } else {
      await this.answerRecordEntity.save({
        userId,
        chapterId,
        questionId,
        userAnswer: serializedAnswer,
        isCorrect: isCorrect ? 1 : 0,
        aiHelpCount: 0,
      });
    }

    const overview = await this.getChapterExamOverview(userId, chapterId);
    await this.progressService.updateExamStatus(
      userId,
      chapterId,
      overview.completed === 1,
      overview.score
    );

    return {
      isCorrect,
      analysis: question.analysis,
      progress: overview,
    };
  }

  async submitChapterAnswers(
    userId: number,
    chapterId: number,
    answers: Array<{ questionId: number; userAnswer: any }>
  ) {
    for (const item of answers || []) {
      await this.submitAnswer(userId, chapterId, item.questionId, item.userAnswer);
    }

    return await this.getChapterExamOverview(userId, chapterId);
  }

  async getChapterAnswerRecords(userId: number, chapterId: number) {
    return await this.answerRecordEntity.find({
      where: { userId, chapterId },
      order: { createTime: 'ASC', id: 'ASC' },
    });
  }

  async incrementAiHelpCount(userId: number, chapterId: number, questionId: number) {
    const record = await this.answerRecordEntity.findOne({
      where: { userId, chapterId, questionId },
    });

    if (!record) {
      await this.answerRecordEntity.save({
        userId,
        chapterId,
        questionId,
        userAnswer: '',
        isCorrect: 0,
        aiHelpCount: 1,
      });
      return;
    }

    record.aiHelpCount += 1;
    await this.answerRecordEntity.save(record);
  }

  private checkAnswer(question: EduQuestionEntity, userAnswer: any) {
    const questionType = Number(question.type || 1);
    const correctAnswer = this.normalizeAnswer(question.answer, questionType);
    const answer = this.normalizeAnswer(userAnswer, questionType);

    if (Array.isArray(correctAnswer) || Array.isArray(answer)) {
      return JSON.stringify(correctAnswer) === JSON.stringify(answer);
    }

    return String(correctAnswer) === String(answer);
  }

  private normalizeAnswer(answer: any, questionType: number) {
    if (questionType === 2) {
      const values = Array.isArray(answer)
        ? answer
        : String(answer || '')
            .split(/[,\uff0c]/)
            .map(item => item.trim())
            .filter(Boolean);
      return values
        .map(item => String(item).trim().toUpperCase())
        .sort();
    }

    if (questionType === 3) {
      const value = String(answer || '').trim().toLowerCase();
      if (['1', 'true', 't', 'yes', 'y', '对'].includes(value)) {
        return 'true';
      }
      if (['0', 'false', 'f', 'no', 'n', '错'].includes(value)) {
        return 'false';
      }
      return value;
    }

    return String(answer || '').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  private normalizeOptions(options: any) {
    if (!options) {
      return [];
    }
    if (typeof options === 'string') {
      try {
        options = JSON.parse(options);
      } catch (error) {
        return [];
      }
    }

    if (!Array.isArray(options)) {
      return [];
    }

    return options
      .map(item => ({
        label: String(item?.label || '').trim(),
        value: String(item?.value || '').trim(),
      }))
      .filter(item => item.label || item.value);
  }

  private serializeAnswer(answer: any) {
    if (Array.isArray(answer)) {
      return JSON.stringify(answer);
    }
    if (answer === undefined || answer === null) {
      return '';
    }
    return String(answer);
  }

  private deserializeAnswer(answer: string) {
    const text = String(answer || '').trim();
    if (!text) {
      return '';
    }
    if ((text.startsWith('[') && text.endsWith(']')) || (text.startsWith('{') && text.endsWith('}'))) {
      try {
        return JSON.parse(text);
      } catch (error) {
        return text;
      }
    }
    return text;
  }

  private hasAnswer(answer: string) {
    return Boolean(String(answer || '').trim());
  }
}
