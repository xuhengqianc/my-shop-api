import { Config, Inject, InjectClient, Provide } from '@midwayjs/core';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { CachingFactory, MidwayCache } from '@midwayjs/cache-manager';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { UserInfoEntity } from '../entity/info';
import { UserWxService } from './wx';
import * as jwt from 'jsonwebtoken';
import { UserWxEntity } from '../entity/wx';
import { BaseSysLoginService } from '../../base/service/sys/login';
import { UserSmsService } from './sms';
import { v1 as uuid } from 'uuid';
import * as md5 from 'md5';
import { PluginService } from '../../plugin/service/info';
import { UserEmailService } from './email';

@Provide()
export class UserLoginService extends BaseService {
  @InjectEntityModel(UserInfoEntity)
  userInfoEntity: Repository<UserInfoEntity>;

  @InjectEntityModel(UserWxEntity)
  userWxEntity: Repository<UserWxEntity>;

  @Inject()
  userWxService: UserWxService;

  @Config('module.user.jwt')
  jwtConfig;

  @Config('module.user.email')
  emailConfig: {
    timeout?: number;
  };

  @Inject()
  baseSysLoginService: BaseSysLoginService;

  @Inject()
  pluginService: PluginService;

  @Inject()
  userSmsService: UserSmsService;

  @Inject()
  userEmailService: UserEmailService;

  @InjectClient(CachingFactory, 'default')
  midwayCache: MidwayCache;

  async smsCode(phone, captchaId, code) {
    const check = await this.baseSysLoginService.captchaCheck(captchaId, code);
    if (!check) {
      throw new CoolCommException('图片验证码错误');
    }
    await this.userSmsService.sendSms(phone);
  }

  async sendEmailCode(
    email: string,
    scene: 'register' | 'login' | 'reset' = 'register'
  ) {
    const normalizedEmail = this.normalizeEmail(email);
    this.validateEmail(normalizedEmail);

    const user = await this.userInfoEntity.findOneBy({ email: normalizedEmail });
    if (scene === 'register' && user) {
      throw new CoolCommException('该邮箱已注册');
    }
    if ((scene === 'login' || scene === 'reset') && !user) {
      throw new CoolCommException('该邮箱尚未注册');
    }

    const lockKey = this.getEmailCodeLockKey(normalizedEmail, scene);
    const sent = await this.midwayCache.get<string>(lockKey);
    if (sent) {
      throw new CoolCommException('验证码发送过于频繁，请稍后重试');
    }

    const code = `${Math.floor(100000 + Math.random() * 900000)}`;
    const ttl = (this.emailConfig?.timeout || 300) * 1000;

    const result = await this.userEmailService.sendVerifyCode(normalizedEmail, code);

    await this.midwayCache.set(
      this.getEmailCodeKey(normalizedEmail, scene),
      code,
      ttl
    );
    await this.midwayCache.set(lockKey, '1', 60 * 1000);

    return result;
  }

  async registerByEmail(param: {
    email: string;
    password: string;
    confirmPassword: string;
    code: string;
    nickName?: string;
  }) {
    const email = this.normalizeEmail(param.email);
    this.validateEmail(email);

    if (!param.password || param.password.length < 6) {
      throw new CoolCommException('密码长度不能少于 6 位');
    }
    if (param.password !== param.confirmPassword) {
      throw new CoolCommException('两次输入的密码不一致');
    }

    const exists = await this.userInfoEntity.findOneBy({ email });
    if (exists) {
      throw new CoolCommException('该邮箱已注册');
    }

    await this.checkEmailCode(email, param.code, 'register');

    const entity = await this.userInfoEntity.save({
      email,
      unionid: `email:${email}`,
      nickName: param.nickName?.trim() || this.getDefaultNickName(email),
      password: md5(param.password),
      loginType: 3,
      emailVerified: 1,
      isDemo: 0,
      allUnlocked: 0,
      status: 1,
    });

    await this.clearEmailCode(email, 'register');

    return {
      ...(await this.token({ id: entity.id })),
      userInfo: await this.safeUserInfo(entity.id),
    };
  }

  async emailPassword(email: string, password: string) {
    const normalizedEmail = this.normalizeEmail(email);
    this.validateEmail(normalizedEmail);

    const user = await this.userInfoEntity.findOneBy({ email: normalizedEmail });
    if (!user || user.password !== md5(password)) {
      throw new CoolCommException('邮箱或密码错误');
    }
    if (user.status !== 1) {
      throw new CoolCommException('账号不可用');
    }

    return {
      ...(await this.token({ id: user.id })),
      userInfo: await this.safeUserInfo(user.id),
    };
  }

  async emailCodeLogin(email: string, code: string) {
    const normalizedEmail = this.normalizeEmail(email);
    this.validateEmail(normalizedEmail);

    const user = await this.userInfoEntity.findOneBy({ email: normalizedEmail });
    if (!user) {
      throw new CoolCommException('该邮箱尚未注册');
    }
    if (user.status !== 1) {
      throw new CoolCommException('账号不可用');
    }

    await this.checkEmailCode(normalizedEmail, code, 'login');
    await this.clearEmailCode(normalizedEmail, 'login');

    return {
      ...(await this.token({ id: user.id })),
      userInfo: await this.safeUserInfo(user.id),
    };
  }

  async resetPasswordByEmail(param: {
    email: string;
    password: string;
    confirmPassword: string;
    code: string;
  }) {
    const email = this.normalizeEmail(param.email);
    this.validateEmail(email);

    if (!param.password || param.password.length < 6) {
      throw new CoolCommException('密码长度不能少于 6 位');
    }
    if (param.password !== param.confirmPassword) {
      throw new CoolCommException('两次输入的密码不一致');
    }

    const user = await this.userInfoEntity.findOneBy({ email });
    if (!user) {
      throw new CoolCommException('该邮箱尚未注册');
    }
    if (user.status !== 1) {
      throw new CoolCommException('账号不可用');
    }

    await this.checkEmailCode(email, param.code, 'reset');

    await this.userInfoEntity.update(user.id, {
      password: md5(param.password),
      emailVerified: 1,
    });

    await this.clearEmailCode(email, 'reset');
  }

  async phoneVerifyCode(phone, smsCode) {
    const check = await this.userSmsService.checkCode(phone, smsCode);
    if (check || 1) {
      return await this.phone(phone);
    }
    throw new CoolCommException('验证码错误');
  }

  async miniPhone(code, encryptedData, iv) {
    const phone = await this.userWxService.miniPhone(code, encryptedData, iv);
    if (phone) {
      return await this.phone(phone);
    }
    throw new CoolCommException('获得手机号失败，请检查配置');
  }

  async uniPhone(access_token, openid, appId) {
    const instance: any = await this.pluginService.getInstance('uniphone');
    const phone = await instance.getPhone(access_token, openid, appId);
    if (phone) {
      return await this.phone(phone);
    }
    throw new CoolCommException('获得手机号失败，请检查配置');
  }

  async phone(phone: string) {
    let user: any = await this.userInfoEntity.findOneBy({
      phone: Equal(phone),
    });
    if (!user) {
      user = await this.userInfoEntity.save({
        phone,
        unionid: `phone:${phone}`,
        loginType: 2,
        nickName: phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2'),
        status: 1,
      });
    }
    return {
      ...(await this.token({ id: user.id })),
      userInfo: await this.safeUserInfo(user.id),
    };
  }

  async mp(code: string) {
    let wxUserInfo = await this.userWxService.mpUserInfo(code);
    if (wxUserInfo) {
      delete wxUserInfo.privilege;
      wxUserInfo = await this.saveWxInfo(
        {
          openid: wxUserInfo.openid,
          unionid: wxUserInfo.unionid,
          avatarUrl: wxUserInfo.headimgurl,
          nickName: wxUserInfo.nickname,
          gender: wxUserInfo.sex,
          city: wxUserInfo.city,
          province: wxUserInfo.province,
          country: wxUserInfo.country,
        },
        1
      );
      return this.wxLoginToken(wxUserInfo);
    }
    throw new Error('微信登录失败');
  }

  async wxApp(code: string) {
    let wxUserInfo = await this.userWxService.appUserInfo(code);
    if (wxUserInfo) {
      delete wxUserInfo.privilege;
      wxUserInfo = await this.saveWxInfo(
        {
          openid: wxUserInfo.openid,
          unionid: wxUserInfo.unionid,
          avatarUrl: wxUserInfo.headimgurl,
          nickName: wxUserInfo.nickname,
          gender: wxUserInfo.sex,
          city: wxUserInfo.city,
          province: wxUserInfo.province,
          country: wxUserInfo.country,
        },
        1
      );
      return this.wxLoginToken(wxUserInfo);
    }
    throw new Error('微信登录失败');
  }

  async saveWxInfo(wxUserInfo, type) {
    const find: any = { openid: wxUserInfo.openid };
    let wxInfo: any = await this.userWxEntity.findOneBy(find);
    if (wxInfo) {
      wxUserInfo.id = wxInfo.id;
    }
    return this.userWxEntity.save({
      ...wxUserInfo,
      type,
    });
  }

  async mini(code, encryptedData, iv) {
    let wxUserInfo = await this.userWxService.miniUserInfo(
      code,
      encryptedData,
      iv
    );
    if (wxUserInfo) {
      wxUserInfo = await this.saveWxInfo(wxUserInfo, 0);
      return await this.wxLoginToken(wxUserInfo);
    }
  }

  async wxLoginToken(wxUserInfo) {
    const unionid = wxUserInfo.unionid ? wxUserInfo.unionid : wxUserInfo.openid;
    let userInfo: any = await this.userInfoEntity.findOneBy({ unionid });
    if (!userInfo) {
      const file = await this.pluginService.getInstance('upload');
      let avatarUrl = null;

      if (wxUserInfo.avatarUrl) {
        avatarUrl = await file.downAndUpload(
          wxUserInfo.avatarUrl,
          uuid() + '.png'
        );
      }

      userInfo = await this.userInfoEntity.save({
        unionid,
        nickName: wxUserInfo.nickName,
        avatarUrl,
        gender: wxUserInfo.gender,
        loginType: wxUserInfo.type,
        status: 1,
      });
    }

    return {
      ...(await this.token({ id: userInfo.id })),
      userInfo: await this.safeUserInfo(userInfo.id),
    };
  }

  async refreshToken(refreshToken) {
    try {
      const info = jwt.verify(refreshToken, this.jwtConfig.secret);
      if (!info['isRefresh']) {
        throw new CoolCommException('token类型非refreshToken');
      }
      const userInfo = await this.userInfoEntity.findOneBy({
        id: info['id'],
      });
      if (!userInfo) {
        throw new CoolCommException('用户不存在');
      }
      return this.token({ id: userInfo.id });
    } catch (e) {
      throw new CoolCommException(
        '刷新token失败，请检查refreshToken是否正确或过期'
      );
    }
  }

  async password(account, password) {
    const normalizedAccount = String(account || '').trim();
    if (!normalizedAccount) {
      throw new CoolCommException('请输入账号');
    }

    const user = this.isEmail(normalizedAccount)
      ? await this.userInfoEntity.findOneBy({
          email: this.normalizeEmail(normalizedAccount),
        })
      : await this.userInfoEntity.findOneBy({ phone: normalizedAccount });

    if (user && user.password === md5(password)) {
      return {
        ...(await this.token({ id: user.id })),
        userInfo: await this.safeUserInfo(user.id),
      };
    }

    throw new CoolCommException('账号或密码错误');
  }

  async token(info) {
    const { expire, refreshExpire } = this.jwtConfig;
    return {
      expire,
      token: await this.generateToken(info),
      refreshExpire,
      refreshToken: await this.generateToken(info, true),
    };
  }

  async generateToken(info, isRefresh = false) {
    const { expire, refreshExpire, secret } = this.jwtConfig;
    const tokenInfo = {
      isRefresh,
      ...info,
    };
    return jwt.sign(tokenInfo, secret, {
      expiresIn: isRefresh ? refreshExpire : expire,
    });
  }

  private async checkEmailCode(
    email: string,
    code: string,
    scene: 'register' | 'login' | 'reset'
  ) {
    const cacheCode = await this.midwayCache.get<string>(
      this.getEmailCodeKey(email, scene)
    );
    if (!cacheCode || cacheCode !== String(code || '').trim()) {
      throw new CoolCommException('邮箱验证码错误或已过期');
    }
  }

  private async clearEmailCode(
    email: string,
    scene: 'register' | 'login' | 'reset'
  ) {
    await this.midwayCache.del(this.getEmailCodeKey(email, scene));
    await this.midwayCache.del(this.getEmailCodeLockKey(email, scene));
  }

  private getEmailCodeKey(
    email: string,
    scene: 'register' | 'login' | 'reset'
  ) {
    return `user:email-code:${scene}:${email}`;
  }

  private getEmailCodeLockKey(
    email: string,
    scene: 'register' | 'login' | 'reset'
  ) {
    return `user:email-code-lock:${scene}:${email}`;
  }

  private normalizeEmail(email: string) {
    return String(email || '').trim().toLowerCase();
  }

  private isEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private validateEmail(email: string) {
    if (!this.isEmail(email)) {
      throw new CoolCommException('请输入正确的邮箱地址');
    }
  }

  private getDefaultNickName(email: string) {
    return email.split('@')[0] || '数学探险家';
  }

  private async safeUserInfo(userId: number) {
    const user = await this.userInfoEntity.findOneBy({ id: userId });
    if (!user) {
      return null;
    }
    delete user.password;
    return user;
  }
}
