import { BaseEntity } from '@cool-midway/core';
import { Column, Entity, Index } from 'typeorm';

/**
 * 题目实体
 */
@Entity('edu_question')
export class EduQuestionEntity extends BaseEntity {
  @Index()
  @Column({ comment: '分类ID', type: 'bigint' })
  categoryId: number;

  @Index()
  @Column({ comment: '题目类型 1-单选 2-多选 3-判断 4-填空 5-简答', type: 'tinyint' })
  type: number;

  @Column({ comment: '题目标题', type: 'text' })
  title: string;

  @Column({ comment: '题目内容', type: 'text', nullable: true })
  content: string;

  @Column({ comment: '选项', type: 'json', nullable: true })
  options: any;

  @Column({ comment: '答案', type: 'text' })
  answer: string;

  @Column({ comment: '解析', type: 'text', nullable: true })
  analysis: string;

  @Column({ comment: '难度 1-简单 2-中等 3-困难', type: 'tinyint', default: 2 })
  difficulty: number;

  @Column({ comment: '状态 0-禁用 1-启用', type: 'tinyint', default: 1 })
  status: number;
}
