import {
  CoolController,
  BaseController,
  CoolUrlTag,
  TagTypes,
  CoolTag,
} from '@cool-midway/core';
import { Body, Get, Inject, Post, Query } from '@midwayjs/core';
import { UserLoginService } from '../../service/login';
import { BaseSysLoginService } from '../../../base/service/sys/login';

/**
 * 登录
 */
@CoolUrlTag()
@CoolController()
export class AppUserLoginController extends BaseController {
  @Inject()
  userLoginService: UserLoginService;

  @Inject()
  baseSysLoginService: BaseSysLoginService;

  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Post('/mini', { summary: '小程序登录' })
  async mini(@Body() body) {
    const { code, encryptedData, iv } = body;
    return this.ok(await this.userLoginService.mini(code, encryptedData, iv));
  }

  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Post('/mp', { summary: '公众号登录' })
  async mp(@Body('code') code: string) {
    return this.ok(await this.userLoginService.mp(code));
  }

  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Post('/wxApp', { summary: '微信APP授权登录' })
  async app(@Body('code') code: string) {
    return this.ok(await this.userLoginService.wxApp(code));
  }

  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Post('/phone', { summary: '手机号登录' })
  async phone(@Body('phone') phone: string, @Body('smsCode') smsCode: string) {
    return this.ok(await this.userLoginService.phoneVerifyCode(phone, smsCode));
  }

  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Post('/uniPhone', { summary: '一键手机号登录' })
  async uniPhone(
    @Body('access_token') access_token: string,
    @Body('openid') openid: string,
    @Body('appId') appId: string
  ) {
    return this.ok(
      await this.userLoginService.uniPhone(access_token, openid, appId)
    );
  }

  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Post('/miniPhone', { summary: '绑定小程序手机号' })
  async miniPhone(@Body() body) {
    const { code, encryptedData, iv } = body;
    return this.ok(
      await this.userLoginService.miniPhone(code, encryptedData, iv)
    );
  }

  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Get('/captcha', { summary: '图片验证码' })
  async captcha(
    @Query('width') width: number,
    @Query('height') height: number,
    @Query('color') color: string
  ) {
    return this.ok(
      await this.baseSysLoginService.captcha(width, height, color)
    );
  }

  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Post('/smsCode', { summary: '验证码' })
  async smsCode(
    @Body('phone') phone: string,
    @Body('captchaId') captchaId: string,
    @Body('code') code: string
  ) {
    return this.ok(await this.userLoginService.smsCode(phone, captchaId, code));
  }

  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Post('/refreshToken', { summary: '刷新token' })
  public async refreshToken(@Body('refreshToken') refreshToken) {
    return this.ok(await this.userLoginService.refreshToken(refreshToken));
  }

  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Post('/sendEmailCode', { summary: '发送邮箱验证码' })
  async sendEmailCode(
    @Body('email') email: string,
    @Body('scene') scene: 'register' | 'login' | 'reset'
  ) {
    return this.ok(await this.userLoginService.sendEmailCode(email, scene));
  }

  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Post('/registerByEmail', { summary: '邮箱注册' })
  async registerByEmail(@Body() body) {
    return this.ok(await this.userLoginService.registerByEmail(body));
  }

  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Post('/emailPassword', { summary: '邮箱密码登录' })
  async emailPassword(
    @Body('email') email: string,
    @Body('password') password: string
  ) {
    return this.ok(await this.userLoginService.emailPassword(email, password));
  }

  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Post('/emailCode', { summary: '邮箱验证码登录' })
  async emailCode(
    @Body('email') email: string,
    @Body('code') code: string
  ) {
    return this.ok(await this.userLoginService.emailCodeLogin(email, code));
  }

  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Post('/resetPasswordByEmail', { summary: '邮箱找回密码' })
  async resetPasswordByEmail(@Body() body) {
    await this.userLoginService.resetPasswordByEmail(body);
    return this.ok();
  }

  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Post('/password', { summary: '密码登录' })
  async password(
    @Body('phone') phone: string,
    @Body('account') account: string,
    @Body('password') password: string
  ) {
    return this.ok(await this.userLoginService.password(account || phone, password));
  }
}
