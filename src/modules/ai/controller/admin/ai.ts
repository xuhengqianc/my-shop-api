import { Body, Inject, Post, Provide } from '@midwayjs/core';
import { CoolController, BaseController } from '@cool-midway/core';
import { AiService } from '../../service/ai';

/**
 * AI管理（后台）
 */
@Provide()
@CoolController('/admin/ai')
export class AdminAiController extends BaseController {
  @Inject()
  aiService: AiService;

  @Post('/prompt/list')
  async promptList() {
    return this.ok(await this.aiService.getPromptList());
  }

  @Post('/prompt/add')
  async promptAdd(@Body() body: any) {
    await this.aiService.addPrompt(body);
    return this.ok();
  }

  @Post('/prompt/update')
  async promptUpdate(@Body() body: any) {
    await this.aiService.updatePrompt(body);
    return this.ok();
  }

  @Post('/prompt/delete')
  async promptDelete(@Body() body: any) {
    const { ids } = body;
    await this.aiService.deletePrompt(ids);
    return this.ok();
  }
}
