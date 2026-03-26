import { BaseEntity } from '@cool-midway/core';
import { Column, Entity, Index } from 'typeorm';
import { GoodsSpecEntity } from './spec';

/**
 * 商品信息
 */
@Entity('goods_info')
export class GoodsInfoEntity extends BaseEntity {
  @Index()
  @Column({ comment: '类型ID' })
  typeId: number;

  @Index()
  @Column({ comment: '标题' })
  title: string;

  @Column({ comment: '副标题', nullable: true })
  subTitle: string;

  @Column({ comment: '主图' })
  mainPic: string;

  @Column({ comment: '图片', type: 'json', nullable: true })
  pics: string[];

  @Column({
    comment: '价格',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  price: number;

  @Column({ comment: '已售', default: 0 })
  sold: number;

  @Column({ comment: '详情', type: 'text', nullable: true })
  content: string;

  @Index()
  @Column({ comment: '状态 0-下架 1-上架', default: 0 })
  status: number;

  @Column({ comment: '排序', default: 0, nullable: true })
  sortNum: number;

  // 规格，非表字段
  specs: GoodsSpecEntity[];
}
