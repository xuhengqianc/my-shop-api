import { CoolEvent, Event } from '@cool-midway/core';
import { Inject } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { DictTypeEntity } from '../../dict/entity/type';
import { DictInfoEntity } from '../../dict/entity/info';

/**
 * 初始化数据事件
 */
@CoolEvent()
export class DemoInitEvent {
  @InjectEntityModel(DictTypeEntity)
  dictTypeEntity: Repository<DictTypeEntity>;

  @InjectEntityModel(DictInfoEntity)
  dictInfoEntity: Repository<DictInfoEntity>;

  /**
   * 应用启动完成
   */
  @Event('onAppReady')
  async onAppReady() {
    await this.initGoodsType();
  }

  /**
   * 初始化商品分类
   */
  async initGoodsType() {
    // 确保字典类型存在
    let existType = await this.dictTypeEntity.findOne({
      where: { key: 'goodsType' },
    });

    if (!existType) {
      existType = await this.dictTypeEntity.save({
        name: '商品分类',
        key: 'goodsType',
      });
    }

    // 检查是否已有字典数据
    const existInfo = await this.dictInfoEntity.count({
      where: { typeId: existType.id },
    });

    if (existInfo > 0) {
      return; // 已有数据，不需要初始化
    }

    // 创建分类数据
    const categories = [
      { name: '电子产品', value: '1' },
      { name: '服装鞋帽', value: '2' },
      { name: '食品饮料', value: '3' },
      { name: '家居用品', value: '4' },
      { name: '美妆护肤', value: '5' },
      { name: '图书音像', value: '6' },
      { name: '运动户外', value: '7' },
      { name: '母婴产品', value: '8' },
    ];

    for (let i = 0; i < categories.length; i++) {
      await this.dictInfoEntity.save({
        typeId: existType.id,
        name: categories[i].name,
        value: categories[i].value,
        orderNum: i,
      });
    }

    console.log('商品分类初始化完成');
  }
}
