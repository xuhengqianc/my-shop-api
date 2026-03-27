import { BaseService } from '@cool-midway/core';
import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { EduCoursewareEntity } from '../entity/courseware';

/**
 * 课件服务
 */
@Provide()
export class CoursewareService extends BaseService {
  @InjectEntityModel(EduCoursewareEntity)
  eduCoursewareEntity: Repository<EduCoursewareEntity>;

  /**
   * 根据章节ID获取课件
   */
  async getByChapterId(chapterId: number) {
    return await this.eduCoursewareEntity.findOne({
      where: { chapterId, status: 1 },
    });
  }

  /**
   * 获取课件详情
   */
  async info(id: number) {
    return await this.eduCoursewareEntity.findOne({ where: { id } });
  }

  /**
   * 添加课件
   */
  async add(param: any) {
    const courseware = new EduCoursewareEntity();
    Object.assign(courseware, param);
    return await this.eduCoursewareEntity.save(courseware);
  }

  /**
   * 更新课件
   */
  async update(param: any) {
    await this.eduCoursewareEntity.update(param.id, param);
  }

  /**
   * 删除课件
   */
  async delete(ids: number[]) {
    await this.eduCoursewareEntity.delete(ids);
  }
}
