import { CoolController, BaseController } from '@cool-midway/core';
import { OrderInfoEntity } from '../../entity/info';
import { OrderInfoService } from '../../service/info';
import { Body, Get, Inject, Post, Query } from '@midwayjs/core';
import { OrderGoodsEntity } from '../../entity/goods';

/**
 * 订单信息
 */
@CoolController({
  api: ['info', 'page', 'update'],
  entity: OrderInfoEntity,
  service: OrderInfoService,
  pageQueryOp: {
    fieldEq: ['status'],
    where: ctx => {
      return [
        // 过滤用户ID
        ['a.userId = :userId', { userId: ctx.user.id }],
      ];
    },
  },
})
export class AppOrderInfoController extends BaseController {
  @Inject()
  orderInfoService: OrderInfoService;

  @Inject()
  ctx;

  @Post('/create', { summary: '创建订单' })
  async create(
    @Body('data')
    data: {
      goodsList: OrderGoodsEntity[];
      addressId: number;
      remark: string;
      title: string;
      couponId: number;
    }
  ) {
    return this.ok(
      await this.orderInfoService.create({
        ...data,
        userId: this.ctx.user.id,
      })
    );
  }

  @Post('/cancel', { summary: '取消订单' })
  async cancel(
    @Body('orderId') orderId: number,
    @Body('remark') remark: string
  ) {
    return this.ok(await this.orderInfoService.close(orderId, remark));
  }

  @Post('/refund', { summary: '退款' })
  async refund(
    @Body('orderId') orderId: number,
    @Body('reason') reason: string
  ) {
    return this.ok(
      await this.orderInfoService.refund(this.ctx.user.id, orderId, reason)
    );
  }

  @Get('/confirm', { summary: '确认收货' })
  async confirm(@Query('orderId') orderId: number) {
    return this.ok(
      await this.orderInfoService.confirm(orderId, this.ctx.user.id)
    );
  }

  @Get('/logistics', { summary: '物流信息' })
  async logistics(@Query('orderId') orderId: number) {
    return this.ok(
      await this.orderInfoService.logistics(orderId, this.ctx.user.id)
    );
  }

  @Get('/userCount', { summary: '用户订单统计' })
  async userCount() {
    return this.ok(await this.orderInfoService.userCount(this.ctx.user.id));
  }
}
