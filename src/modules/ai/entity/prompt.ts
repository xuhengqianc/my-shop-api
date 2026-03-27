import { BaseEntity } from '@cool-midway/core';
import { Column, Entity, Index } from 'typeorm';

/**
 * AI提示词配置实体
 */
@Entity('edu_ai_prompt')
export class EduAiPromptEntity extends BaseEntity {
  @Column({ comment: '配置名称', length: 100 })
  name: string;

  @Column({ comment: '类型 chat-助教 exam-测试', length: 50 })
  type: string;

  @Column({ comment: '提示词内容', type: 'text' })
  prompt: string;

  @Column({ comment: '状态 0-禁用 1-启用', type: 'tinyint', default: 1 })
  status: number;
}
