import { BaseEntity } from '@cool-midway/core';
import { Column, Entity, Index } from 'typeorm';

/**
 * AI对话记录实体
 */
@Entity('edu_ai_conversation')
export class EduAiConversationEntity extends BaseEntity {
  @Index()
  @Column({ comment: '用户ID', type: 'bigint' })
  userId: number;

  @Column({ comment: '章节ID', type: 'bigint', nullable: true })
  chapterId: number;

  @Column({ comment: '题目ID', type: 'bigint', nullable: true })
  questionId: number;

  @Column({ comment: '角色 user/assistant', length: 20 })
  role: string;

  @Column({ comment: '对话内容', type: 'text' })
  content: string;

  @Column({ comment: '图片URL', length: 500, nullable: true })
  imageUrl: string;
}
