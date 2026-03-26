import { CoolController, BaseController } from '@cool-midway/core';
import { OrderInfoEntity } from '../../entity/info';
import { OrderInfoService } from '../../service/info';
import { UserInfoEntity } from '../../../user/entity/info';
import { Body, Get, Inject, Post, Query } from '@midwayjs/core';

/**
 * 订单信息
 */
@CoolController({
  api: ['delete', 'update', 'info', 'list', 'page'],
  entity: OrderInfoEntity,
  service: OrderInfoService,
  pageQueryOp: {
    keyWordLikeFields: ['a.title', 'a.orderNum', 'b.nickName'],
    select: ['a.*', 'b.nickName', 'b.avatarUrl'],
    fieldEq: ['a.status', 'a.payType'],
    join: [
      {
        entity: UserInfoEntity,
        alias: 'b',
        condition: 'a.userId = b.id',
      },
    ],
    where: ctx => {
      const { startTime, endTime, refundApplyStartTime, refundApplyEndTime } =
        ctx.request.body;
      return [
        // 过滤创建时间
        ['a.createTime >= :startTime', { startTime }, startTime],
        ['a.createTime <= :endTime', { endTime }, endTime],
        // 过滤退款时间
        [
          'a.refundApplyTime >= :refundApplyStartTime',
          { refundApplyStartTime },
          refundApplyStartTime,
        ],
        [
          'a.refundApplyTime <= :refundApplyEndTime',
          { refundApplyEndTime },
          refundApplyEndTime,
        ],
      ];
    },
  },
})
export class AdminOrderInfoController extends BaseController {
  @Inject()
  orderInfoService: OrderInfoService;

  @Post('/refundHandle', { summary: '退款处理' })
  async refundHandle(
    @Body('orderId') orderId: number,
    // 0-拒绝 1-同意
    @Body('action') action: number,
    // 拒绝原因
    @Body('refuseReason') refuseReason: string,
    // 退款金额
    @Body('amount') amount: number
  ) {
    await this.orderInfoService.refundHandle(
      orderId,
      action,
      refuseReason,
      amount
    );
    return this.ok();
  }

  @Get('/logistics', { summary: '物流信息' })
  async logistics(@Query('orderId') orderId: number) {
    return this.ok(await this.orderInfoService.logistics(orderId));
  }

  @Post('/deliver', { summary: '发货' })
  async deliver(
    @Body('orderId') orderId: number,
    @Body('logistics')
    logistics: {
      // 物流公司
      company: string;
      // 物流单号
      num: string;
    }
  ) {
    return this.ok(await this.orderInfoService.deliver(orderId, logistics));
  }
}
