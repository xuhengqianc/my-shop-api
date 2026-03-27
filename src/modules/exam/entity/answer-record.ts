import { BaseEntity } from '@cool-midway/core';
import { Column, Entity, Index } from 'typeorm';

/**
 * 答题记录实体
 */
@Entity('edu_answer_record')
export class EduAnswerRecordEntity extends BaseEntity {
  @Index()
  @Column({ comment: '用户ID', type: 'bigint' })
  userId: number;

  @Index()
  @Column({ comment: '章节ID', type: 'bigint' })
  chapterId: number;

  @Column({ comment: '题目ID', type: 'bigint' })
  questionId: number;

  @Column({ comment: '用户答案', type: 'text' })
  userAnswer: string;

  @Column({ comment: '是否正确 0-错误 1-正确', type: 'tinyint' })
  isCorrect: number;

  @Column({ comment: 'AI帮助次数', default: 0 })
  aiHelpCount: number;
}
