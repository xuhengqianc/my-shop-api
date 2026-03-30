import { BaseService, CoolCommException } from '@cool-midway/core';
import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { EduVideoEntity } from '../entity/video';
import { EduVideoMarkerEntity } from '../entity/marker';

@Provide()
export class VideoService extends BaseService {
  @InjectEntityModel(EduVideoEntity)
  eduVideoEntity: Repository<EduVideoEntity>;

  @InjectEntityModel(EduVideoMarkerEntity)
  eduVideoMarkerEntity: Repository<EduVideoMarkerEntity>;

  async list(chapterId?: number) {
    const where: any = {};
    if (chapterId) {
      where.chapterId = chapterId;
    }
    const list = await this.eduVideoEntity.find({
      where,
      order: {
        chapterId: 'ASC',
        createTime: 'DESC',
      },
    });

    return await Promise.all(list.map(item => this.info(item.id)));
  }

  async getByChapterId(chapterId: number) {
    return await this.eduVideoEntity.findOne({
      where: { chapterId, status: 1 },
      order: { createTime: 'DESC' },
    });
  }

  async info(id: number) {
    const video = await this.eduVideoEntity.findOne({ where: { id } });
    if (!video) {
      return null;
    }

    const markers = await this.eduVideoMarkerEntity.find({
      where: { videoId: id },
      order: { sort: 'ASC', time: 'ASC' },
    });

    return {
      ...video,
      markers,
    };
  }

  async add(param: any) {
    await this.ensureSingleChapterVideo(param.chapterId);

    const { markers, ...videoData } = param;
    const savedVideo = await this.eduVideoEntity.save({
      ...videoData,
      status: videoData.status ?? 1,
    });

    await this.replaceMarkers(savedVideo.id, markers);
    return savedVideo;
  }

  async update(param: any) {
    const { id, markers, ...videoData } = param;
    const current = await this.eduVideoEntity.findOne({ where: { id } });
    if (!current) {
      throw new CoolCommException('视频不存在');
    }

    if (
      Number(videoData.chapterId || current.chapterId) !== Number(current.chapterId)
    ) {
      await this.ensureSingleChapterVideo(videoData.chapterId, id);
    }

    await this.eduVideoEntity.update(id, videoData);
    if (markers !== undefined) {
      await this.replaceMarkers(id, markers);
    }
  }

  async delete(ids: number[]) {
    if (!ids?.length) {
      return;
    }
    await this.eduVideoMarkerEntity
      .createQueryBuilder()
      .delete()
      .where('videoId in (:...ids)', { ids })
      .execute();
    await this.eduVideoEntity.delete(ids);
  }

  async getChapterVideo(chapterId: number) {
    const video = await this.getByChapterId(chapterId);
    if (!video) {
      return null;
    }

    return await this.info(video.id);
  }

  private async replaceMarkers(videoId: number, markers: any) {
    await this.eduVideoMarkerEntity.delete({ videoId });
    const normalizedMarkers = this.normalizeMarkers(markers);
    if (!normalizedMarkers.length) {
      return;
    }

    await this.eduVideoMarkerEntity.save(
      normalizedMarkers.map((marker, index) => ({
        videoId,
        title: marker.title,
        time: marker.time,
        sort: marker.sort ?? index,
      }))
    );
  }

  private normalizeMarkers(markers: any) {
    if (!markers) {
      return [];
    }
    if (typeof markers === 'string') {
      try {
        markers = JSON.parse(markers);
      } catch (error) {
        return [];
      }
    }
    if (!Array.isArray(markers)) {
      return [];
    }

    return markers
      .map((marker, index) => ({
        title: String(marker?.title || `片段${index + 1}`).trim(),
        time: Number(marker?.time || 0),
        sort: Number(marker?.sort ?? index),
      }))
      .filter(marker => marker.title);
  }

  private async ensureSingleChapterVideo(chapterId: number, currentId?: number) {
    const exists = await this.eduVideoEntity.findOne({
      where: { chapterId },
    });
    if (exists && Number(exists.id) !== Number(currentId || 0)) {
      throw new CoolCommException('一个章节只能配置一个微课视频');
    }
  }
}
