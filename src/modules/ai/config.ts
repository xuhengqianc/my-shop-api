import { ModuleConfig } from '@cool-midway/core';

export default () => {
  return {
    name: 'AI助手模块',
    description: '教育平台AI助手',
    middlewares: [],
    globalMiddlewares: [],
    order: 0,
  } as ModuleConfig;
};
