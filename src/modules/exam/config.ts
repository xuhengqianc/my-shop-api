import { ModuleConfig } from '@cool-midway/core';

export default () => {
  return {
    name: '题库系统模块',
    description: '教育平台题库和测试管理',
    middlewares: [],
    globalMiddlewares: [],
    order: 0,
  } as ModuleConfig;
};
