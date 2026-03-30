import { BaseService, CoolCommException } from '@cool-midway/core';
import { Inject, Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import * as md5 from 'md5';
import { Equal, Repository } from 'typeorm';
import { v1 as uuid } from 'uuid';
import { PluginService } from '../../plugin/service/info';
import { UserInfoEntity } from '../entity/info';
import { UserSmsService } from './sms';
import { UserWxService } from './wx';

@Provide()
export class UserInfoService extends BaseService {
  @InjectEntityModel(UserInfoEntity)
  userInfoEntity: Repository<UserInfoEntity>;

  @Inject()
  pluginService: PluginService;

  @Inject()
  userSmsService: UserSmsService;

  @Inject()
  userWxService: UserWxService;

  async add(param) {
    const email = this.normalizeEmail(param.email);
    const phone = this.normalizeText(param.phone);

    if (email) {
      const exists = await this.userInfoEntity.findOneBy({ email });
      if (exists) {
        throw new CoolCommException('邮箱已存在');
      }
      param.email = email;
      param.unionid = param.unionid || `email:${email}`;
      param.emailVerified = 1;
      param.loginType = 3;
    }

    if (phone) {
      const exists = await this.userInfoEntity.findOneBy({ phone });
      if (exists) {
        throw new CoolCommException('手机号已存在');
      }
      param.phone = phone;
    }

    if (!param.nickName) {
      param.nickName = email ? email.split('@')[0] : phone || `用户${Date.now()}`;
    }

    if (param.password) {
      param.password = md5(param.password);
    } else {
      param.password = null;
    }

    param.isDemo = param.isDemo ? 1 : 0;
    param.allUnlocked = param.allUnlocked || param.isDemo ? 1 : 0;
    param.status = param.status ?? 1;

    const saved = await this.userInfoEntity.save(param);
    return saved.id;
  }

  async update(param) {
    const user = await this.userInfoEntity.findOneBy({ id: param.id });
    if (!user) {
      throw new CoolCommException('用户不存在');
    }

    const email = this.normalizeEmail(param.email);
    const phone = this.normalizeText(param.phone);

    if (email && email !== user.email) {
      const exists = await this.userInfoEntity.findOneBy({ email });
      if (exists) {
        throw new CoolCommException('邮箱已存在');
      }
      param.email = email;
      param.unionid =
        user.unionid && !String(user.unionid).startsWith('email:')
          ? user.unionid
          : `email:${email}`;
      param.emailVerified = 1;
      param.loginType = 3;
    }

    if (phone && phone !== user.phone) {
      const exists = await this.userInfoEntity.findOneBy({ phone });
      if (exists) {
        throw new CoolCommException('手机号已存在');
      }
      param.phone = phone;
    }

    if (!param.password) {
      delete param.password;
    } else {
      param.password = md5(param.password);
    }

    param.isDemo = param.isDemo ? 1 : 0;
    param.allUnlocked = param.allUnlocked || param.isDemo ? 1 : 0;

    await this.userInfoEntity.update(user.id, param);
  }

  async info(id) {
    const info = await this.userInfoEntity.findOneBy({ id });
    return this.sanitizeUser(info, false);
  }

  async miniPhone(userId: number, code: any, encryptedData: any, iv: any) {
    const phone = await this.userWxService.miniPhone(code, encryptedData, iv);
    await this.userInfoEntity.update({ id: Equal(userId) }, { phone });
    return phone;
  }

  async person(id) {
    const info = await this.userInfoEntity.findOneBy({ id: Equal(id) });
    return this.sanitizeUser(info, true);
  }

  async logoff(userId: number) {
    await this.userInfoEntity.update(
      { id: userId },
      {
        status: 2,
        phone: null,
        email: null,
        unionid: null,
        nickName: `已注销-00${userId}`,
        avatarUrl: null,
      }
    );
  }

  async updatePerson(id, param) {
    const info = await this.person(id);
    if (!info) throw new CoolCommException('用户不存在');
    try {
      if (param.avatarUrl && info.avatarUrl != param.avatarUrl) {
        const file = await this.pluginService.getInstance('upload');
        param.avatarUrl = await file.downAndUpload(
          param.avatarUrl,
          uuid() + '.png'
        );
      }
    } catch (err) {}
    try {
      return await this.userInfoEntity.update({ id }, param);
    } catch (err) {
      throw new CoolCommException('更新失败，参数错误或者手机号已存在');
    }
  }

  async updatePassword(userId, password, code) {
    const user = await this.userInfoEntity.findOneBy({ id: userId });
    const check = await this.userSmsService.checkCode(user.phone, code);
    if (!check) {
      throw new CoolCommException('验证码错误');
    }
    await this.userInfoEntity.update(user.id, { password: md5(password) });
  }

  async bindPhone(userId, phone, code) {
    const check = await this.userSmsService.checkCode(phone, code);
    if (!check) {
      throw new CoolCommException('验证码错误');
    }
    await this.userInfoEntity.update({ id: userId }, { phone });
  }

  private sanitizeUser(user: UserInfoEntity, maskContact: boolean) {
    if (!user) {
      return null;
    }

    if (maskContact && user.phone) {
      user.phone = user.phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
    }

    if (maskContact && user.email) {
      user.email = user.email.replace(
        /^(.{2}).*(@.*)$/,
        (_, start, end) => `${start}***${end}`
      );
    }

    delete user.password;
    return user;
  }

  private normalizeText(value: string) {
    const text = String(value || '').trim();
    return text || null;
  }

  private normalizeEmail(value: string) {
    const text = this.normalizeText(value);
    return text ? text.toLowerCase() : null;
  }
}
