import { BaseService, CoolCommException } from '@cool-midway/core';
import { Inject, Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { EduChapterEntity } from '../entity/chapter';
import { ProgressService } from '../../progress/service/progress';
import { VideoService } from '../../video/service/video';
import { CoursewareService } from '../../courseware/service/courseware';
import { ExamService } from '../../exam/service/exam';

@Provide()
export class ChapterService extends BaseService {
  @InjectEntityModel(EduChapterEntity)
  eduChapterEntity: Repository<EduChapterEntity>;

  @Inject()
  progressService: ProgressService;

  @Inject()
  videoService: VideoService;

  @Inject()
  coursewareService: CoursewareService;

  @Inject()
  examService: ExamService;

  async list(status?: number) {
    const query = this.eduChapterEntity
      .createQueryBuilder('chapter')
      .orderBy('chapter.sort', 'ASC')
      .addOrderBy('chapter.createTime', 'ASC');

    if (status !== undefined) {
      query.where('chapter.status = :status', { status });
    }

    const list = await query.getMany();
    return list.map(item => this.normalizeChapter(item));
  }

  async info(id: number) {
    const chapter = await this.eduChapterEntity.findOne({ where: { id } });
    return chapter ? this.normalizeChapter(chapter) : null;
  }

  async add(param: any) {
    const chapter = new EduChapterEntity();
    Object.assign(chapter, {
      ...param,
      visuals: this.normalizeVisuals(param.visuals),
      labItems: this.normalizeLabItems(param.labItems),
    });
    return await this.eduChapterEntity.save(chapter);
  }

  async update(param: any) {
    await this.eduChapterEntity.update(param.id, {
      ...param,
      visuals: this.normalizeVisuals(param.visuals),
      labItems: this.normalizeLabItems(param.labItems),
    });
  }

  async delete(ids: number[]) {
    await this.eduChapterEntity.delete(ids);
  }

  async updateSort(id: number, sort: number) {
    await this.eduChapterEntity.update(id, { sort });
  }

  async updateStatus(id: number, status: number) {
    await this.eduChapterEntity.update(id, { status });
  }

  async getUserChapterList(userId: number) {
    const chapters = await this.list(1);
    const progressMap = await this.progressService.getProgressMap(
      userId,
      chapters.map(item => Number(item.id))
    );
    const unlockedChapterIds = await this.progressService.getUnlockedChapterIds(
      userId,
      chapters
    );

    const firstUnlockedNotCompleted = chapters.find(item => {
      const progress = progressMap.get(Number(item.id));
      return unlockedChapterIds.includes(Number(item.id)) && progress?.completed !== 1;
    });

    return await Promise.all(
      chapters.map(async chapter => {
        const progress = progressMap.get(Number(chapter.id));
        const questionCount = await this.examService.getChapterQuestionCount(
          Number(chapter.id)
        );
        const video = await this.videoService.getByChapterId(Number(chapter.id));
        const courseware = await this.coursewareService.getByChapterId(
          Number(chapter.id)
        );

        return {
          ...chapter,
          unlocked: unlockedChapterIds.includes(Number(chapter.id)),
          current: Number(firstUnlockedNotCompleted?.id) === Number(chapter.id),
          progress: progress || null,
          stats: {
            hasVideo: Boolean(video),
            hasCourseware: Boolean(courseware),
            examQuestionCount: questionCount,
          },
        };
      })
    );
  }

  async getUserChapterInfo(userId: number, chapterId: number) {
    const chapter = await this.info(chapterId);
    if (!chapter || chapter.status !== 1) {
      throw new CoolCommException('章节不存在');
    }

    await this.progressService.ensureChapterUnlocked(userId, chapterId);

    const progress = await this.progressService.getUserProgress(userId, chapterId);
    const video = await this.videoService.getChapterVideo(chapterId);
    const courseware = await this.coursewareService.getByChapterId(chapterId);
    const exam = await this.examService.getChapterExamOverview(userId, chapterId);

    return {
      ...chapter,
      progress,
      video,
      courseware,
      exam,
    };
  }

  private normalizeChapter(chapter: EduChapterEntity) {
    return {
      ...chapter,
      visuals: this.normalizeVisuals(chapter.visuals),
      labItems: this.normalizeLabItems(chapter.labItems),
    };
  }

  private normalizeVisuals(visuals: any) {
    if (!visuals) {
      return [];
    }

    if (typeof visuals === 'string') {
      try {
        visuals = JSON.parse(visuals);
      } catch (error) {
        return [];
      }
    }

    if (!Array.isArray(visuals)) {
      return [];
    }

    return visuals
      .map((item, index) => ({
        title: String(item?.title || `可视化内容${index + 1}`).trim(),
        url: String(item?.url || '').trim(),
        type: Number(item?.type || 1),
        cover: item?.cover ? String(item.cover).trim() : '',
        description: item?.description
          ? String(item.description).trim()
          : '',
      }))
      .filter(item => item.url);
  }

  private normalizeLabItems(labItems: any) {
    if (!labItems) {
      return [];
    }

    if (typeof labItems === 'string') {
      try {
        labItems = JSON.parse(labItems);
      } catch (error) {
        return [];
      }
    }

    if (!Array.isArray(labItems)) {
      return [];
    }

    return labItems
      .map((item, index) => ({
        title: String(item?.title || `实验室卡片${index + 1}`).trim(),
        icon: String(item?.icon || item?.url || '').trim(),
        prompt: item?.prompt ? String(item.prompt).trim() : '',
      }))
      .filter(item => item.title || item.icon || item.prompt);
  }
}
