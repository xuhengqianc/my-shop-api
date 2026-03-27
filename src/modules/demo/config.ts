import { ModuleConfig } from '@cool-midway/core';

/**
 * 模块配置
 * demo模块 - 已禁用（演示代码不需要）
 */
export default () => {
  return {
    // 模块名称
    name: 'demo模块',
    // 模块描述
    description: '演示用',
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
