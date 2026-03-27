import { BaseEntity } from '@cool-midway/core';
import { Column, Entity, Index } from 'typeorm';

/**
 * 题目分类实体
 */
@Entity('edu_question_category')
export class EduQuestionCategoryEntity extends BaseEntity {
  @Column({ comment: '分类名称', length: 100 })
  name: string;

  @Column({ comment: '排序', default: 0 })
  sort: number;

  @Column({ comment: '状态 0-禁用 1-启用', type: 'tinyint', default: 1 })
  status: number;
}
