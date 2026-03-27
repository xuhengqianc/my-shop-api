import { BaseEntity } from '@cool-midway/core';
import { Column, Entity, Index } from 'typeorm';

/**
 * 学习进度实体
 */
@Entity('edu_user_progress')
export class EduUserProgressEntity extends BaseEntity {
  @Index()
  @Column({ comment: '用户ID', type: 'bigint' })
  userId: number;

  @Index()
  @Column({ comment: '章节ID', type: 'bigint' })
  chapterId: number;

  @Column({ comment: '视频进度（秒）', default: 0 })
  videoProgress: number;

  @Column({ comment: '视频是否完成 0-未完成 1-完成', type: 'tinyint', default: 0 })
  videoCompleted: number;

  @Column({ comment: '测试是否完成 0-未完成 1-完成', type: 'tinyint', default: 0 })
  examCompleted: number;

  @Column({ comment: '测试分数', default: 0 })
  examScore: number;

  @Column({ comment: '章节是否完成 0-未完成 1-完成', type: 'tinyint', default: 0 })
  completed: number;
}
