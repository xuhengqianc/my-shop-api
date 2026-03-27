import { BaseService } from '@cool-midway/core';
import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { EduVideoEntity } from '../entity/video';
import { EduVideoMarkerEntity } from '../entity/marker';

/**
 * 视频服务
 */
@Provide()
export class VideoService extends BaseService {
  @InjectEntityModel(EduVideoEntity)
  eduVideoEntity: Repository<EduVideoEntity>;

  @InjectEntityModel(EduVideoMarkerEntity)
  eduVideoMarkerEntity: Repository<EduVideoMarkerEntity>;

  /**
   * 根据章节ID获取视频
   */
  async getByChapterId(chapterId: number) {
    return await this.eduVideoEntity.findOne({
      where: { chapterId, status: 1 },
    });
  }

  /**
   * 获取视频详情（包含时间标记）
   */
  async info(id: number) {
    const video = await this.eduVideoEntity.findOne({ where: { id } });
    if (!video) {
      return null;
    }

    // 获取时间标记
    const markers = await this.eduVideoMarkerEntity.find({
      where: { videoId: id },
      order: { sort: 'ASC', time: 'ASC' },
    });

    return {
      ...video,
      markers,
    };
  }

  /**
   * 添加视频
   */
  async add(param: any) {
    const { markers, ...videoData } = param;

    // 保存视频
    const video = new EduVideoEntity();
    Object.assign(video, videoData);
    const savedVideo = await this.eduVideoEntity.save(video);

    // 保存时间标记
    if (markers && markers.length > 0) {
      await this.saveMarkers(savedVideo.id, markers);
    }

    return savedVideo;
  }

  /**
   * 更新视频
   */
  async update(param: any) {
    const { id, markers, ...videoData } = param;

    // 更新视频
    await this.eduVideoEntity.update(id, videoData);

    // 更新时间标记
    if (markers !== undefined) {
      // 删除旧标记
      await this.eduVideoMarkerEntity.delete({ videoId: id });
      // 保存新标记
      if (markers.length > 0) {
        await this.saveMarkers(id, markers);
      }
    }
  }

  /**
   * 删除视频
   */
  async delete(ids: number[]) {
    // 删除时间标记
    await this.eduVideoMarkerEntity.delete({ videoId: ids as any });
    // 删除视频
    await this.eduVideoEntity.delete(ids);
  }

  /**
   * 保存时间标记
   */
  private async saveMarkers(videoId: number, markers: any[]) {
    const markerEntities = markers.map((marker, index) => {
      const entity = new EduVideoMarkerEntity();
      entity.videoId = videoId;
      entity.title = marker.title;
      entity.time = marker.time;
      entity.sort = marker.sort !== undefined ? marker.sort : index;
      return entity;
    });

    await this.eduVideoMarkerEntity.save(markerEntities);
  }

  /**
   * 获取章节的视频（APP端）
   */
  async getChapterVideo(chapterId: number) {
    const video = await this.getByChapterId(chapterId);
    if (!video) {
      return null;
    }

    return await this.info(video.id);
  }
}
