import { BaseEntity } from '@cool-midway/core';
import { Column, Entity, Index } from 'typeorm';

/**
 * 章节测试实体
 */
@Entity('edu_chapter_exam')
export class EduChapterExamEntity extends BaseEntity {
  @Index()
  @Column({ comment: '章节ID', type: 'bigint' })
  chapterId: number;

  @Column({ comment: '题目ID', type: 'bigint' })
  questionId: number;

  @Column({ comment: '排序', default: 0 })
  sort: number;
}
