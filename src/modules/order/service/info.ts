import { Init, Inject, Provide } from '@midwayjs/core';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Equal, In, Repository } from 'typeorm';
import { OrderInfoEntity } from '../entity/info';
import { OrderGoodsService } from './goods';
import { OrderGoodsEntity } from '../entity/goods';
import * as moment from 'moment';
import { UserAddressService } from '../../user/service/address';
import { Action, OrderQueue } from '../queue/order';
import { OrderPayService } from './pay';
import { PluginService } from '../../plugin/service/info';
import { GoodsSpecEntity } from '../../goods/entity/spec';
import { MarketCouponInfoService } from '../../market/service/coupon/info';
import { MarketCouponUserEntity } from '../../market/entity/coupon/user';
import { BaseSysParamService } from '../../base/service/sys/param';
import BigNumber from 'bignumber.js';

/**
 * 订单信息
 */
@Provide()
export class OrderInfoService extends BaseService {
  @InjectEntityModel(OrderInfoEntity)
  orderInfoEntity: Repository<OrderInfoEntity>;

  @InjectEntityModel(GoodsSpecEntity)
  goodsSpecEntity: Repository<GoodsSpecEntity>;

  @InjectEntityModel(MarketCouponUserEntity)
  marketCouponUserEntity: Repository<MarketCouponUserEntity>;

  @Inject()
  orderGoodsService: OrderGoodsService;

  @Inject()
  userAddressService: UserAddressService;

  @Inject()
  orderPayService: OrderPayService;

  @Inject()
  orderQueue: OrderQueue;

  @Inject()
  pluginService: PluginService;

  @Inject()
  marketCouponInfoService: MarketCouponInfoService;

  @Inject()
  baseSysParamService: BaseSysParamService;

  @Init()
  async init() {
    await super.init();
    this.setEntity(this.orderInfoEntity);
  }

  /**
   * 修改前
   * @param data
   * @param type
   */
  async modifyBefore(data: any, type: 'add' | 'update' | 'delete') {
    if (type == 'add' || type == 'update') {
      delete data.refundStatus;
      delete data.refundApplyTime;
    }
  }

  /**
   * 分页查询
   * @param query
   * @param option
   * @param connectionName
   */
  async page(query: any, option: any, connectionName?: any) {
    const result = await super.page(query, option, connectionName);
    // 筛选条件的非分页sql
    const countSql = await super.getOptionFind(query, option);

    const countResult = await this.nativeQuery(
      `SELECT COUNT(a.id) as totalCount, SUM(a.price) as totalPrice FROM ${
        countSql.split('FROM')[1].split('ORDER BY')[0]
      }`
    );

    result['subData'] = {
      totalCount: countResult[0].totalCount,
      totalPrice: countResult[0].totalPrice,
    };

    const goodsList = await this.orderGoodsService.getByOrderIds(
      result.list.map(e => e.id)
    );
    for (const item of result.list) {
      item.goodsList = goodsList.filter(e => e.orderId == item.id);
    }
    return result;
  }

  /**
   * 根据订单号获取订单
   * @param orderNum
   * @returns
   */
  async getByOrderNum(orderNum: string) {
    return this.orderInfoEntity.findOneBy({
      orderNum: Equal(orderNum),
    });
  }

  /**
   * 修改订单状态
   * @param id
   * @param status
   */
  async changeStatus(id: number, status: number) {
    await this.orderInfoEntity.update({ id }, { status });
  }

  /**
   * 关闭订单
   * @param orderId
   * @param remark
   */
  async close(orderId: number, remark: string) {
    const order = await this.info(orderId);
    if (!order || !remark)
      throw new CoolCommException('订单不存在或备注不能为空');
    if (order.status != 0) {
      throw new CoolCommException('订单状态不允许关闭');
    }

    // 退回优惠券
    if (order.discountSource && order.discountPrice > 0) {
      if (order.discountSource.type == 0) {
        this.marketCouponUserEntity.update(
          {
            id: order.discountSource.objectId,
          },
          {
            status: 0,
          }
        );
      }
    }

    await this.orderInfoEntity.update(
      { id: orderId },
      { status: 7, closeRemark: remark }
    );

    // 释放库存
    await this.orderGoodsService.updateStock(order.goodsList, 'add');
  }

  /**
   * 订单详情
   * @param id
   * @param infoIgnoreProperty
   */
  async info(id: any, infoIgnoreProperty?: string[]) {
    const info = await super.info(id, infoIgnoreProperty);
    if (!info) {
      throw new CoolCommException('订单不存在');
    }
    if (info) {
      // 获取商品
      info.goodsList = await this.orderGoodsService.getByOrderId(info.id);
    }
    return info;
  }

  /**
   * 创建订单
   * @param data
   */
  async create(data: {
    userId: number;
    goodsList: OrderGoodsEntity[];
    addressId: number;
    remark: string;
    title: string;
    couponId?: number;
  }) {
    const address = await this.userAddressService.info(data.addressId);
    const order = {
      userId: data.userId,
      address,
      remark: data.remark,
      title: data.title,
      goodsList: data.goodsList,
    } as OrderInfoEntity;
    // 检查库存
    await this.checkStock(data.goodsList);
    order.price = await this.orderGoodsService.getTotalPrice(data.goodsList);
    order.goodsList = data.goodsList;

    // 使用优惠券
    if (data.couponId) {
      await this.marketCouponInfoService.checkAndUse(
        data.couponId,
        data.userId,
        order
      );
    }
    await this.orderInfoEntity.insert(order);

    // 生成订单号
    const orderNum = await this.generateOrderNum(order.id);

    // 更新订单
    await this.orderInfoEntity.update(order.id, {
      orderNum,
    });

    // 保存订单商品
    await this.orderGoodsService.save(order.id, data.goodsList);

    // 更新商品库存
    await this.orderGoodsService.updateStock(data.goodsList);

    const orderTimeout = await this.baseSysParamService.dataByKey(
      'orderTimeout'
    );
    // 发送订单创建消息
    this.orderQueue.add(
      { orderId: order.id, action: Action.TIMEOUT },
      {
        // 超时关闭订单
        delay: orderTimeout * 60 * 1000,
      }
    );
    return order;
  }

  /**
   * 生成订单号
   * @param orderId
   */
  async generateOrderNum(orderId: number, label = 'U') {
    const orderNum =
      moment().format('YYYYMMDDHHmmss') +
      Math.floor(Math.random() * 10000).toString() +
      orderId.toString();
    return label + orderNum;
  }

  /**
   * 退款
   * @param userId
   * @param orderId
   * @param goodsId
   * @param reason
   */
  async refund(userId: number, orderId: number, reason: string) {
    const order = await this.info(orderId);
    if (order && order.userId != userId) {
      throw new CoolCommException('非法操作');
    }
    if (![1, 2].includes(order.status)) {
      throw new CoolCommException('订单状态不允许退款');
    }

    await this.orderInfoEntity.update(
      { id: Equal(orderId) },
      {
        status: 5,
        refund: {
          amount: new BigNumber(order.price)
            .minus(order.discountPrice)
            .toNumber(),
          status: 0,
          applyTime: new Date(),
          reason,
          orderNum: 'R' + order.orderNum.slice(1),
        },
      }
    );
  }

  /**
   * 退款处理
   * @param orderId
   * @param action 0-拒绝 1-同意
   * @param refuseReason 0-拒绝 1-同意
   * @param amount
   */
  async refundHandle(
    orderId: number,
    action: number,
    refuseReason: string,
    amount: number
  ) {
    const order = await this.info(orderId);
    if (order.status != 5 || !order.refund) {
      throw new CoolCommException('订单状态不允许退款处理');
    }
    // 拒绝退款
    if (action == 0) {
      await this.orderInfoEntity.update(
        { id: Equal(orderId) },
        {
          status: 4,
          refund: {
            ...order.refund,
            status: 2,
            refuseReason: refuseReason,
          },
        }
      );
    }
    // 同意退款
    if (action == 1) {
      if (amount > order.price) {
        throw new CoolCommException('退款金额不能大于订单金额');
      }
      // 执行退款操作
      const result = await this.orderPayService.wxRefund(order, amount);

      if (result) {
        await this.orderInfoEntity.update(
          { id: Equal(orderId) },
          {
            status: 6,
            refund: {
              ...order.refund,
              status: 1,
              realAmount: amount,
              time: new Date(),
            },
          }
        );
      }
    }
  }

  /**
   * 确认收货
   * @param userId
   * @param orderId
   */
  async confirm(orderId: number, userId: number) {
    const order = await this.info(orderId);
    if (order && order.userId != userId) {
      throw new CoolCommException('非法操作');
    }
    if (![2].includes(order.status)) {
      throw new CoolCommException('订单状态不允许退款');
    }
    await this.orderInfoEntity.update(
      { id: Equal(orderId) },
      {
        status: 3,
      }
    );
  }

  /**
   * 自动确认收货
   * @param orderId
   * @returns
   */
  async autoConfirm(orderId: number) {
    const info = await this.orderInfoEntity.findOneBy({ id: Equal(orderId) });
    if (info.status != 2) {
      return;
    }
    await this.orderInfoEntity.update({ id: Equal(orderId) }, { status: 3 });
  }

  /**
   * 物流信息
   * @param orderId
   */
  async logistics(orderId: number, userId?: number) {
    const order: OrderInfoEntity = await this.info(orderId);
    if (userId && order.userId != userId) {
      throw new CoolCommException('非法操作');
    }
    const no = order.logistics?.num;

    if (!no) {
      return null;
    }

    const instance: any = await this.pluginService.getInstance('wuliu');
    return await instance.query(no);
  }

  /**
   * 发货
   * @param orderId
   * @param logistics
   */
  async deliver(
    orderId: number,
    logistics: {
      // 物流公司
      company: string;
      // 物流单号
      num: string;
    }
  ) {
    const order: OrderInfoEntity = await this.info(orderId);
    if (order.status != 1) {
      throw new CoolCommException('订单状态不允许发货');
    }
    await this.orderInfoEntity.update(orderId, {
      status: 2,
      logistics,
    });
  }

  /**
   * 检查库存
   * @param goodsList
   */
  async checkStock(goodsList: OrderGoodsEntity[]) {
    const specs = goodsList.map(item => item.spec);
    const specList = await this.goodsSpecEntity.findBy({
      id: In(specs.map(e => e.id)),
    });
    for (const spec of specList) {
      const goods = goodsList.find(e => e.spec.id == spec.id);
      // 设置商品价格
      goods.price = spec.price;
      if (goods.count > spec.stock) {
        throw new CoolCommException(`商品[${goods.goodsInfo.title}]，库存不足`);
      }
    }
  }

  /**
   * 用户订单数量
   * @param userId
   */
  async userCount(userId: number) {
    const statusLabels = [
      '待付款',
      '待发货',
      '待收货',
      '待评价',
      '交易完成',
      '退款中',
      '已退款',
      '已关闭',
    ];
    // 生成查询字符串
    const selectQueries = statusLabels.map(
      (label, index) =>
        `SUM(CASE WHEN status = ${index} THEN 1 ELSE 0 END) AS '${label}'`
    );
    const list = await this.orderInfoEntity
      .createQueryBuilder('a')
      .select(selectQueries)
      .where('a.userId = :userId', { userId })
      .getRawMany();
    return list[0];
  }
}
