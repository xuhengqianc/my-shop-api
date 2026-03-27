import { BaseEntity } from '@cool-midway/core';
import { Column, Entity, Index } from 'typeorm';

/**
 * 视频实体
 */
@Entity('edu_video')
export class EduVideoEntity extends BaseEntity {
  @Index()
  @Column({ comment: '章节ID', type: 'bigint' })
  chapterId: number;

  @Column({ comment: '视频标题', length: 200 })
  title: string;

  @Column({ comment: '视频URL', length: 500 })
  videoUrl: string;

  @Column({ comment: '视频时长（秒）', default: 0 })
  duration: number;

  @Column({ comment: '封面图URL', length: 500, nullable: true })
  coverUrl: string;

  @Column({ comment: '状态 0-禁用 1-启用', type: 'tinyint', default: 1 })
  status: number;
}
