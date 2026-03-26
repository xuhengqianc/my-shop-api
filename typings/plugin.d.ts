import * as sms_ali from './sms-ali';
import { BaseUpload, MODETYPE } from './upload';
type AnyString = string & {};
/**
 * 插件类型声明
 */
interface PluginMap {
  upload: BaseUpload;
  'sms-ali': sms_ali.CoolPlugin;
}
