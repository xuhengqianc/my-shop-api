import { ModuleConfig } from '@cool-midway/core';

export default () => {
  return {
    name: '学习进度模块',
    description: '教育平台学习进度追踪',
    middlewares: [],
    globalMiddlewares: [],
    order: 0,
  } as ModuleConfig;
};
