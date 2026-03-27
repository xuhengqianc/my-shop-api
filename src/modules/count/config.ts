import { ModuleConfig } from '@cool-midway/core';

/**
 * 模块配置
 * 统计模块 - 已禁用（教育平台不需要商城统计）
 */
export default () => {
  return {
    // 模块名称
    name: '统计分析',
    // 模块描述
    description: '订单、商品、用户等统计',
    // 中间件，只对本模块有效
    middlewares: [],
    // 中间件，全局有效
    globalMiddlewares: [],
    // 模块加载顺序，默认为0，值越大越优先加载
    order: 0,
    // 禁用模块
    enable: false,
  } as ModuleConfig;
};
