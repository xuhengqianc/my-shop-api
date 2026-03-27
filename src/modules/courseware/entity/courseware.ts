import { BaseEntity } from '@cool-midway/core';
import { Column, Entity, Index } from 'typeorm';

/**
 * 课件实体
 */
@Entity('edu_courseware')
export class EduCoursewareEntity extends BaseEntity {
  @Index()
  @Column({ comment: '章节ID', type: 'bigint' })
  chapterId: number;

  @Column({ comment: '课件标题', length: 200 })
  title: string;

  @Column({ comment: 'PDF文件URL', length: 500 })
  fileUrl: string;

  @Column({ comment: '页数', default: 0 })
  pageCount: number;

  @Column({ comment: '状态 0-禁用 1-启用', type: 'tinyint', default: 1 })
  status: number;
}
