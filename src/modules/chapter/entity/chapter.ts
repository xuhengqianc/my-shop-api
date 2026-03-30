import { BaseEntity } from '@cool-midway/core';
import { Column, Entity, Index } from 'typeorm';

/**
 * 章节实体
 */
@Entity('edu_chapter')
export class EduChapterEntity extends BaseEntity {
  @Column({ comment: '章节名称', length: 100 })
  name: string;

  @Column({ comment: '章节描述', type: 'text', nullable: true })
  description: string;

  @Index()
  @Column({ comment: '排序', default: 0 })
  sort: number;

  @Column({ comment: '缩略图URL', length: 500, nullable: true })
  thumbnail: string;

  @Column({ comment: '缩略图类型 1-图片 2-视频', type: 'tinyint', default: 1 })
  thumbnailType: number;

  @Column({ comment: '章节可视化内容', type: 'json', nullable: true })
  visuals: {
    title: string;
    url: string;
    type: number;
    cover?: string;
    description?: string;
  }[];

  @Index()
  @Column({ comment: '状态 0-禁用 1-启用', type: 'tinyint', default: 1 })
  status: number;
}
