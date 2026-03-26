import {
  CoolController,
  BaseController,
  CoolUrlTag,
  TagTypes,
} from '@cool-midway/core';
import { GoodsInfoEntity } from '../../entity/info';
import { GoodsInfoService } from '../../service/info';
import { GoodsTypeEntity } from '../../entity/type';

/**
 * 商品信息
 */
@CoolUrlTag({
  key: TagTypes.IGNORE_TOKEN,
  value: ['page', 'info'],
})
@CoolController({
  api: ['page', 'info'],
  entity: GoodsInfoEntity,
  service: GoodsInfoService,
  pageQueryOp: {
    keyWordLikeFields: ['title'],
    fieldEq: ['a.typeId'],
    select: ['a.*', 'b.name as typeName'],
    where: ctx => {
      const { minPrice, maxPrice } = ctx.request.body;
      return [
        // 过滤掉已下架商品
        ['a.status = :status', { status: 1 }],
        // 价格区间
        ['a.price >= :minPrice', { minPrice }, minPrice],
        ['a.price <= :maxPrice', { maxPrice }, maxPrice],
      ];
    },
    join: [
      {
        entity: GoodsTypeEntity,
        alias: 'b',
        condition: 'a.typeId = b.id',
      },
    ],
  },
})
export class AppGoodsInfoController extends BaseController {}
