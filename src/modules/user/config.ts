import { ModuleConfig } from '@cool-midway/core';
import { UserMiddleware } from './middleware/app';

/**
 * 模块配置
 */
export default () => {
  return {
    // 模块名称
    name: '用户模块',
    // 模块描述
    description: 'APP、小程序、公众号等用户',
    // 中间件，只对本模块有效
    middlewares: [],
    // 中间件，全局有效
    globalMiddlewares: [UserMiddleware],
    // 模块加载顺序，默认为0，值越大越优先加载
    order: 0,
    // 短信
    sms: {
      // 验证码有效期，单位秒
      timeout: 60 * 3,
    },
    email: {
      // 邮箱验证码有效期，单位秒
      timeout: 60 * 5,
      // 开发环境默认回传预览验证码，便于联调
      previewCode: true,
      // SMTP 建议使用 465 直连 TLS
      host: '',
      port: 465,
      secure: true,
      user: '',
      pass: '',
      from: '',
      subjectPrefix: '数学探险家',
    },
    // jwt
    jwt: {
      // token 过期时间，单位秒
      expire: 60 * 60 * 24,
      // 刷新token 过期时间，单位秒
      refreshExpire: 60 * 60 * 24 * 30,
      // jwt 秘钥
      secret: '5b81d7bc-11cc-485d-8d6b-39d3e7c48f74x',
    },
  } as ModuleConfig;
};
