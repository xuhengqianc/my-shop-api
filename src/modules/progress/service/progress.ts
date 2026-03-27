import { BaseService } from '@cool-midway/core';
import { Provide, Inject } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { EduUserProgressEntity } from '../entity/progress';

/**
 * 学习进度服务
 */
@Provide()
export class ProgressService extends BaseService {
  @InjectEntityModel(EduUserProgressEntity)
  progressEntity: Repository<EduUserProgressEntity>;

  /**
   * 获取用户进度
   */
  async getUserProgress(userId: number, chapterId: number) {
    let progress = await this.progressEntity.findOne({
      where: { userId, chapterId },
    });

    if (!progress) {
      // 创建新进度记录
      progress = new EduUserProgressEntity();
      progress.userId = userId;
      progress.chapterId = chapterId;
      progress = await this.progressEntity.save(progress);
    }

    return progress;
  }

  /**
   * 获取用户所有进度
   */
  async getUserAllProgress(userId: number) {
    return await this.progressEntity.find({
      where: { userId },
      order: { chapterId: 'ASC' },
    });
  }

  /**
   * 更新视频进度
   */
  async updateVideoProgress(userId: number, chapterId: number, progress: number) {
    const record = await this.getUserProgress(userId, chapterId);
    record.videoProgress = progress;
    await this.progressEntity.save(record);
  }

  /**
   * 标记视频完成
   */
  async markVideoCompleted(userId: number, chapterId: number) {
    const record = await this.getUserProgress(userId, chapterId);
    record.videoCompleted = 1;
    await this.checkChapterCompleted(record);
    await this.progressEntity.save(record);
  }

  /**
   * 标记测试完成
   */
  async markExamCompleted(userId: number, chapterId: number, score: number) {
    const record = await this.getUserProgress(userId, chapterId);
    record.examCompleted = 1;
    record.examScore = score;
    await this.checkChapterCompleted(record);
    await this.progressEntity.save(record);
  }

  /**
   * 检查章节是否完成
   */
  private async checkChapterCompleted(progress: EduUserProgressEntity) {
    // 视频和测试都完成才算章节完成
    if (progress.videoCompleted === 1 && progress.examCompleted === 1) {
      progress.completed = 1;
    }
  }

  /**
   * 检查章节是否解锁
   */
  async isChapterUnlocked(userId: number, chapterId: number): Promise<boolean> {
    // 第一章默认解锁
    if (chapterId === 1) {
      return true;
    }

    // 检查上一章是否完成
    const prevProgress = await this.progressEntity.findOne({
      where: { userId, chapterId: chapterId - 1 },
    });

    return prevProgress?.completed === 1;
  }

  /**
   * 获取用户可访问的章节列表
   */
  async getUserUnlockedChapters(userId: number, totalChapters: number): Promise<number[]> {
    const unlockedChapters: number[] = [];

    for (let i = 1; i <= totalChapters; i++) {
      if (await this.isChapterUnlocked(userId, i)) {
        unlockedChapters.push(i);
      } else {
        // 遇到第一个未解锁的章节就停止
        break;
      }
    }

    return unlockedChapters;
  }

  /**
   * 计算测试分数
   */
  async calculateExamScore(userId: number, chapterId: number): Promise<number> {
    // TODO: 根据答题记录计算分数
    // 这里简化处理，返回固定分数
    return 100;
  }
}
