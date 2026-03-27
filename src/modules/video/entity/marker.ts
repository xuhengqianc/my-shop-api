import { BaseEntity } from '@cool-midway/core';
import { Column, Entity, Index } from 'typeorm';

/**
 * 视频时间标记实体
 */
@Entity('edu_video_marker')
export class EduVideoMarkerEntity extends BaseEntity {
  @Index()
  @Column({ comment: '视频ID', type: 'bigint' })
  videoId: number;

  @Column({ comment: '标记标题', length: 100 })
  title: string;

  @Column({ comment: '时间点（秒）' })
  time: number;

  @Column({ comment: '排序', default: 0 })
  sort: number;
}
