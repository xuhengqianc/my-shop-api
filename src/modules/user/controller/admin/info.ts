import { CoolController, BaseController } from '@cool-midway/core';
import { UserInfoEntity } from '../../entity/info';
import { UserInfoService } from '../../service/info';

/**
 * 用户信息
 */
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: UserInfoEntity,
  service: UserInfoService,
  pageQueryOp: {
    fieldEq: [
      'a.status',
      'a.gender',
      'a.loginType',
      'a.emailVerified',
      'a.isDemo',
      'a.allUnlocked',
    ],
    keyWordLikeFields: ['a.nickName', 'a.phone', 'a.email'],
  },
})
export class AdminUserInfoController extends BaseController {}
