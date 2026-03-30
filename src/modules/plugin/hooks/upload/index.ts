import * as fs from 'fs';
import * as path from 'path';
import { Context } from '@midwayjs/koa';
import { BasePluginHook } from '../base';
import { pUploadPath } from '../../../../comm/path';

function normalizeUrlPath(value: string) {
  return value.replace(/\\/g, '/').replace(/^\/+/, '');
}

function normalizeStorageKey(value: string) {
  const normalized = path.posix.normalize(`/${normalizeUrlPath(value)}`);
  return normalized.replace(/^\/+/, '').replace(/^(\.\.(\/|$))+/, '');
}

function extFromUrl(url: string) {
  try {
    const pathname = new URL(url).pathname;
    return path.extname(pathname);
  } catch (error) {
    return path.extname(url);
  }
}

export class Plugin extends BasePluginHook {
  async getMode() {
    return {
      mode: 'local',
      type: 'local',
    };
  }

  async upload(source: Context | UploadSource) {
    const { file, fields } = this.resolveUploadData(source);
    if (!file) {
      throw new Error('请选择上传文件');
    }

    const key = String(
      fields.key || file.filename || file.originalFilename || ''
    ).trim();
    if (!key) {
      throw new Error('缺少文件标识');
    }

    const targetRelativePath = normalizeStorageKey(key);
    const targetPath = path.join(pUploadPath(), targetRelativePath);

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    this.persistFile(file, targetPath);

    return this.toPublicUrl(targetRelativePath);
  }

  async downAndUpload(url: string, fileName: string) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('远程文件下载失败');
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const ext = path.extname(fileName) || extFromUrl(url) || '.dat';
    const normalizedName = normalizeUrlPath(
      fileName.endsWith(ext) ? fileName : `${fileName}${ext}`
    );
    const targetPath = path.join(pUploadPath(), normalizedName);

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, buffer);

    return this.toPublicUrl(normalizedName);
  }

  private toPublicUrl(targetRelativePath: string) {
    const domain =
      this.pluginInfo?.config?.domain ||
      `http://127.0.0.1:${this.app?.getConfig?.('koa.port') || 8001}`;

    return `${String(domain).replace(/\/+$/, '')}/upload/${normalizeUrlPath(targetRelativePath)}`;
  }

  private resolveUploadData(source: Context | UploadSource) {
    if (this.isContext(source)) {
      const body = (source.request as any).body || {};
      return {
        fields: body,
        file: this.pickFile((source.request as any).files) || this.pickFile(body.file),
      };
    }

    const fields = source?.fields || {};
    return {
      fields,
      file:
        this.pickFile(source?.files) ||
        this.pickFile((source?.ctx?.request as any)?.files) ||
        this.pickFile(fields.file),
    };
  }

  private isContext(value: Context | UploadSource): value is Context {
    return !!(value as Context)?.request;
  }

  private pickFile(value: any) {
    if (!value) {
      return null;
    }

    if (Array.isArray(value)) {
      return value[0] || null;
    }

    const firstValue = Object.values(value)[0] as any;
    if (Array.isArray(firstValue)) {
      return firstValue[0] || null;
    }

    return firstValue || null;
  }

  private persistFile(file: any, targetPath: string) {
    if (Buffer.isBuffer(file.data)) {
      fs.writeFileSync(targetPath, file.data);
      return;
    }

    if (ArrayBuffer.isView(file.data)) {
      fs.writeFileSync(
        targetPath,
        Buffer.from(
          file.data.buffer,
          file.data.byteOffset,
          file.data.byteLength
        )
      );
      return;
    }

    if (file.filepath && fs.existsSync(file.filepath)) {
      fs.copyFileSync(file.filepath, targetPath);
      return;
    }

    if (file.path && fs.existsSync(file.path)) {
      fs.copyFileSync(file.path, targetPath);
      return;
    }

    if (typeof file.data === 'string' && fs.existsSync(file.data)) {
      fs.copyFileSync(file.data, targetPath);
      return;
    }

    if (typeof file.data === 'string') {
      fs.writeFileSync(targetPath, file.data);
      return;
    }

    throw new Error('上传文件解析失败');
  }
}

interface UploadSource {
  ctx?: Context;
  fields?: Record<string, any>;
  files?: any;
}
