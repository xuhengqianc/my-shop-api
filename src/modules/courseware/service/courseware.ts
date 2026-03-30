import { BaseService, CoolCommException } from '@cool-midway/core';
import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { EduCoursewareEntity } from '../entity/courseware';

@Provide()
export class CoursewareService extends BaseService {
  @InjectEntityModel(EduCoursewareEntity)
  eduCoursewareEntity: Repository<EduCoursewareEntity>;

  async list(chapterId?: number) {
    const where: any = {};
    if (chapterId) {
      where.chapterId = chapterId;
    }
    return await this.eduCoursewareEntity.find({
      where,
      order: {
        chapterId: 'ASC',
        createTime: 'DESC',
      },
    });
  }

  async getByChapterId(chapterId: number) {
    return await this.eduCoursewareEntity.findOne({
      where: { chapterId, status: 1 },
      order: { createTime: 'DESC' },
    });
  }

  async info(id: number) {
    return await this.eduCoursewareEntity.findOne({ where: { id } });
  }

  async add(param: any) {
    await this.ensureSingleChapterCourseware(param.chapterId);
    return await this.eduCoursewareEntity.save({
      ...param,
      status: param.status ?? 1,
    });
  }

  async update(param: any) {
    const current = await this.eduCoursewareEntity.findOne({
      where: { id: param.id },
    });
    if (!current) {
      throw new CoolCommException('课件不存在');
    }

    if (
      Number(param.chapterId || current.chapterId) !== Number(current.chapterId)
    ) {
      await this.ensureSingleChapterCourseware(param.chapterId, param.id);
    }

    await this.eduCoursewareEntity.update(param.id, param);
  }

  async delete(ids: number[]) {
    await this.eduCoursewareEntity.delete(ids);
  }

  private async ensureSingleChapterCourseware(
    chapterId: number,
    currentId?: number
  ) {
    const exists = await this.eduCoursewareEntity.findOne({
      where: { chapterId },
    });
    if (exists && Number(exists.id) !== Number(currentId || 0)) {
      throw new CoolCommException('一个章节只能配置一个课件');
    }
  }
}
