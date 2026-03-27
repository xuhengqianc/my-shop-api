import { BaseService } from '@cool-midway/core';
import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { EduChapterEntity } from '../entity/chapter';

/**
 * 章节服务
 */
@Provide()
export class ChapterService extends BaseService {
  @InjectEntityModel(EduChapterEntity)
  eduChapterEntity: Repository<EduChapterEntity>;

  /**
   * 获取章节列表（按排序）
   */
  async list(status?: number) {
    const query = this.eduChapterEntity
      .createQueryBuilder('chapter')
      .orderBy('chapter.sort', 'ASC')
      .addOrderBy('chapter.createTime', 'DESC');

    if (status !== undefined) {
      query.where('chapter.status = :status', { status });
    }

    return await query.getMany();
  }

  /**
   * 获取章节详情
   */
  async info(id: number) {
    return await this.eduChapterEntity.findOne({ where: { id } });
  }

  /**
   * 添加章节
   */
  async add(param: any) {
    const chapter = new EduChapterEntity();
    Object.assign(chapter, param);
    return await this.eduChapterEntity.save(chapter);
  }

  /**
   * 更新章节
   */
  async update(param: any) {
    await this.eduChapterEntity.update(param.id, param);
  }

  /**
   * 删除章节
   */
  async delete(ids: number[]) {
    await this.eduChapterEntity.delete(ids);
  }

  /**
   * 更新排序
   */
  async updateSort(id: number, sort: number) {
    await this.eduChapterEntity.update(id, { sort });
  }

  /**
   * 更新状态
   */
  async updateStatus(id: number, status: number) {
    await this.eduChapterEntity.update(id, { status });
  }

  /**
   * 获取用户可访问的章节列表（考虑解锁逻辑）
   */
  async getUserChapterList(userId: number) {
    // TODO: 后续集成学习进度模块，实现章节解锁逻辑
    // 目前返回所有启用的章节
    return await this.list(1);
  }
}
