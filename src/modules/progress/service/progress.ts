import { BaseService, CoolCommException } from '@cool-midway/core';
import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { EduUserProgressEntity } from '../entity/progress';
import { EduChapterEntity } from '../../chapter/entity/chapter';
import { UserInfoEntity } from '../../user/entity/info';
import { EduVideoEntity } from '../../video/entity/video';
import { EduChapterExamEntity } from '../../exam/entity/chapter-exam';

type ChapterRequirement = {
  requiresVideo: boolean;
  requiresExam: boolean;
};

@Provide()
export class ProgressService extends BaseService {
  @InjectEntityModel(EduUserProgressEntity)
  progressEntity: Repository<EduUserProgressEntity>;

  @InjectEntityModel(EduChapterEntity)
  chapterEntity: Repository<EduChapterEntity>;

  @InjectEntityModel(UserInfoEntity)
  userInfoEntity: Repository<UserInfoEntity>;

  @InjectEntityModel(EduVideoEntity)
  videoEntity: Repository<EduVideoEntity>;

  @InjectEntityModel(EduChapterExamEntity)
  chapterExamEntity: Repository<EduChapterExamEntity>;

  async getUserProgress(userId: number, chapterId: number) {
    let progress = await this.progressEntity.findOne({
      where: { userId, chapterId },
    });

    if (!progress) {
      progress = await this.progressEntity.save({
        userId,
        chapterId,
        videoProgress: 0,
        videoCompleted: 0,
        examCompleted: 0,
        examScore: 0,
        completed: 0,
      });
    }

    return await this.syncProgressRequirementFlags(
      progress,
      await this.getChapterRequirement(chapterId)
    );
  }

  async getUserAllProgress(userId: number) {
    return await this.progressEntity.find({
      where: { userId },
      order: { chapterId: 'ASC' },
    });
  }

  async getProgressMap(userId: number, chapterIds?: number[]) {
    const list = await this.getUserAllProgress(userId);
    const rawMap = new Map(list.map(item => [Number(item.chapterId), item]));
    const ids = Array.from(
      new Set(
        (chapterIds?.length ? chapterIds : Array.from(rawMap.keys()))
          .map(item => Number(item))
          .filter(Boolean)
      )
    );

    if (!ids.length) {
      return new Map<number, EduUserProgressEntity>();
    }

    const requirementMap = await this.getChapterRequirementMap(ids);

    return new Map(
      ids.map(chapterId => [
        chapterId,
        this.normalizeProgressRecord(
          rawMap.get(chapterId),
          requirementMap.get(chapterId),
          userId,
          chapterId
        ),
      ])
    );
  }

  async updateVideoProgress(userId: number, chapterId: number, progress: number) {
    const record = await this.ensureChapterProgress(userId, chapterId);
    record.videoProgress = Math.max(Number(record.videoProgress || 0), Number(progress || 0));
    await this.progressEntity.save(record);
    return record;
  }

  async markVideoCompleted(userId: number, chapterId: number) {
    const record = await this.ensureChapterProgress(userId, chapterId);
    record.videoCompleted = 1;
    this.applyCompletion(record, await this.getChapterRequirement(chapterId));
    await this.progressEntity.save(record);
    return record;
  }

  async markExamCompleted(userId: number, chapterId: number, score: number) {
    const record = await this.ensureChapterProgress(userId, chapterId);
    record.examCompleted = 1;
    record.examScore = Number(score || 0);
    this.applyCompletion(record, await this.getChapterRequirement(chapterId));
    await this.progressEntity.save(record);
    return record;
  }

  async updateExamStatus(
    userId: number,
    chapterId: number,
    completed: boolean,
    score: number
  ) {
    const record = await this.ensureChapterProgress(userId, chapterId);
    record.examCompleted = completed ? 1 : 0;
    record.examScore = Number(score || 0);
    this.applyCompletion(record, await this.getChapterRequirement(chapterId));
    await this.progressEntity.save(record);
    return record;
  }

  async syncChapterCompletion(userId: number, chapterId: number) {
    const record = await this.ensureChapterProgress(userId, chapterId);
    this.applyCompletion(record, await this.getChapterRequirement(chapterId));
    await this.progressEntity.save(record);
    return record;
  }

  async isChapterUnlocked(userId: number, chapterId: number) {
    const unlockedChapterIds = await this.getUnlockedChapterIds(userId);
    return unlockedChapterIds.includes(Number(chapterId));
  }

  async ensureChapterUnlocked(userId: number, chapterId: number) {
    const unlocked = await this.isChapterUnlocked(userId, chapterId);
    if (!unlocked) {
      throw new CoolCommException('请先完成上一章节');
    }
  }

  async getUnlockedChapterIds(
    userId: number,
    chapters?: Array<{ id: number }>
  ) {
    const user = await this.userInfoEntity.findOneBy({ id: userId });
    const orderedChapters =
      chapters || ((await this.getOrderedEnabledChapters()) as Array<{ id: number }>);

    if (!orderedChapters.length) {
      return [];
    }

    if (user?.isDemo === 1 || user?.allUnlocked === 1) {
      return orderedChapters.map(item => Number(item.id));
    }

    const progressMap = await this.getProgressMap(
      userId,
      orderedChapters.map(item => Number(item.id))
    );
    const unlockedChapterIds: number[] = [];

    for (let index = 0; index < orderedChapters.length; index++) {
      const chapter = orderedChapters[index];
      if (index === 0) {
        unlockedChapterIds.push(Number(chapter.id));
        continue;
      }

      const previousChapter = orderedChapters[index - 1];
      const previousProgress = progressMap.get(Number(previousChapter.id));
      if (previousProgress?.completed === 1) {
        unlockedChapterIds.push(Number(chapter.id));
        continue;
      }

      break;
    }

    return unlockedChapterIds;
  }

  async getChapterStatus(userId: number, chapterId: number) {
    const progress = await this.getUserProgress(userId, chapterId);
    const unlocked = await this.isChapterUnlocked(userId, chapterId);
    return {
      ...progress,
      unlocked,
    };
  }

  private async ensureChapterProgress(userId: number, chapterId: number) {
    await this.ensureChapterExists(chapterId);
    return await this.getUserProgress(userId, chapterId);
  }

  private async getChapterRequirement(chapterId: number) {
    const requirementMap = await this.getChapterRequirementMap([chapterId]);
    return requirementMap.get(Number(chapterId));
  }

  private async getChapterRequirementMap(chapterIds: number[]) {
    const ids = Array.from(
      new Set((chapterIds || []).map(item => Number(item)).filter(Boolean))
    );
    const map = new Map<number, ChapterRequirement>();

    if (!ids.length) {
      return map;
    }

    const [videos, exams] = await Promise.all([
      this.videoEntity.find({
        select: ['chapterId'],
        where: ids.map(chapterId => ({
          chapterId,
          status: 1,
        })),
      }),
      this.chapterExamEntity.find({
        select: ['chapterId'],
        where: ids.map(chapterId => ({ chapterId })),
      }),
    ]);

    const videoChapterIds = new Set(videos.map(item => Number(item.chapterId)));
    const examChapterIds = new Set(exams.map(item => Number(item.chapterId)));

    ids.forEach(chapterId => {
      map.set(chapterId, {
        requiresVideo: videoChapterIds.has(chapterId),
        requiresExam: examChapterIds.has(chapterId),
      });
    });

    return map;
  }

  private normalizeProgressRecord(
    progress: EduUserProgressEntity,
    requirement: ChapterRequirement,
    userId: number,
    chapterId: number
  ) {
    const record =
      progress ||
      ({
        userId,
        chapterId,
        videoProgress: 0,
        videoCompleted: 0,
        examCompleted: 0,
        examScore: 0,
        completed: 0,
      } as EduUserProgressEntity);

    const requiresVideo = requirement?.requiresVideo === true;
    const requiresExam = requirement?.requiresExam === true;
    const videoCompleted = requiresVideo
      ? Number(record.videoCompleted || 0) === 1
      : true;
    const examCompleted = requiresExam
      ? Number(record.examCompleted || 0) === 1
      : true;

    return {
      ...record,
      userId: Number(record.userId || userId),
      chapterId: Number(record.chapterId || chapterId),
      videoCompleted: videoCompleted ? 1 : 0,
      examCompleted: examCompleted ? 1 : 0,
      completed: videoCompleted && examCompleted ? 1 : 0,
    } as EduUserProgressEntity;
  }

  private applyCompletion(
    record: EduUserProgressEntity,
    requirement: ChapterRequirement
  ) {
    const normalized = this.normalizeProgressRecord(
      record,
      requirement,
      Number(record.userId),
      Number(record.chapterId)
    );

    record.videoCompleted = normalized.videoCompleted;
    record.examCompleted = normalized.examCompleted;
    record.completed = normalized.completed;
  }

  private async syncProgressRequirementFlags(
    record: EduUserProgressEntity,
    requirement: ChapterRequirement
  ) {
    const previous = {
      videoCompleted: Number(record.videoCompleted || 0),
      examCompleted: Number(record.examCompleted || 0),
      completed: Number(record.completed || 0),
    };

    this.applyCompletion(record, requirement);

    if (
      previous.videoCompleted !== Number(record.videoCompleted || 0) ||
      previous.examCompleted !== Number(record.examCompleted || 0) ||
      previous.completed !== Number(record.completed || 0)
    ) {
      return await this.progressEntity.save(record);
    }

    return record;
  }

  private async ensureChapterExists(chapterId: number) {
    const chapter = await this.chapterEntity.findOne({
      where: { id: chapterId, status: 1 },
    });
    if (!chapter) {
      throw new CoolCommException('章节不存在或已禁用');
    }
    return chapter;
  }

  private async getOrderedEnabledChapters() {
    return await this.chapterEntity.find({
      where: { status: 1 },
      order: {
        sort: 'ASC',
        createTime: 'ASC',
      },
    });
  }
}
