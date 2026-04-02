import { CoolCommException } from '@cool-midway/core';
import { Config, Provide } from '@midwayjs/core';
import * as net from 'net';
import * as os from 'os';
import * as tls from 'tls';

type SmtpResponse = {
  code: number;
  raw: string;
};

@Provide()
export class UserEmailService {
  @Config('module.user.email')
  emailConfig: {
    timeout?: number;
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    pass?: string;
    from?: string;
    subjectPrefix?: string;
  };

  async sendVerifyCode(email: string, code: string) {
    const smtpConfig = this.getSmtpConfig();
    const subjectPrefix = smtpConfig.subjectPrefix || '数学探险家';
    const subject = `${subjectPrefix}验证码`;
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="margin-bottom: 12px;">${subjectPrefix}</h2>
        <p>你的邮箱验证码为：</p>
        <div style="font-size: 28px; font-weight: bold; color: #ff7a45; letter-spacing: 6px;">
          ${code}
        </div>
        <p style="margin-top: 16px;">验证码 5 分钟内有效，请勿泄露给他人。</p>
      </div>
    `.trim();

    if (!this.hasSmtpConfig()) {
      if (this.isLocalDevMode()) {
        return {
          delivered: true,
          localDev: true,
          previewCode: code,
        };
      }

      throw new CoolCommException('邮箱服务未配置，暂无法发送验证码');
    }

    await this.sendBySmtp({
      to: email,
      subject,
      html,
    });

    return {
      delivered: true,
    };
  }

  private hasSmtpConfig() {
    const smtpConfig = this.getSmtpConfig();
    return Boolean(
      smtpConfig.host &&
        smtpConfig.port &&
        smtpConfig.user &&
        smtpConfig.pass &&
        smtpConfig.from
    );
  }

  private isLocalDevMode() {
    const envValues = [
      process.env.NODE_ENV,
      process.env.MIDWAY_SERVER_ENV,
      process.env.EGG_SERVER_ENV,
    ]
      .filter(Boolean)
      .map(env => String(env).toLowerCase());

    return envValues.includes('local') || envValues.includes('development');
  }

  private getSmtpConfig() {
    const secureValue = process.env.SMTP_SECURE;
    const secure =
      typeof secureValue === 'string'
        ? !['false', '0', 'no', 'off'].includes(secureValue.toLowerCase())
        : this.emailConfig?.secure !== false;

    return {
      host: process.env.SMTP_HOST || this.emailConfig?.host || '',
      port: Number(process.env.SMTP_PORT || this.emailConfig?.port || 465),
      secure,
      user: process.env.SMTP_USER || this.emailConfig?.user || '',
      pass: process.env.SMTP_PASS || this.emailConfig?.pass || '',
      from:
        process.env.SMTP_FROM ||
        this.emailConfig?.from ||
        process.env.SMTP_USER ||
        this.emailConfig?.user ||
        '',
      subjectPrefix:
        process.env.SMTP_SUBJECT_PREFIX ||
        this.emailConfig?.subjectPrefix ||
        '数学探险家',
    };
  }

  private async sendBySmtp(mail: {
    to: string;
    subject: string;
    html: string;
  }) {
    const smtpConfig = this.getSmtpConfig();
    const socket = await this.createSocket();

    try {
      await this.expect(socket, [220]);
      await this.command(socket, `EHLO ${os.hostname() || 'localhost'}`, [250]);
      await this.command(socket, 'AUTH LOGIN', [334]);
      await this.command(
        socket,
        Buffer.from(smtpConfig.user || '').toString('base64'),
        [334]
      );
      await this.command(
        socket,
        Buffer.from(smtpConfig.pass || '').toString('base64'),
        [235]
      );
      await this.command(socket, `MAIL FROM:<${smtpConfig.from}>`, [250]);
      await this.command(socket, `RCPT TO:<${mail.to}>`, [250, 251]);
      await this.command(socket, 'DATA', [354]);

      const message = this.buildMessage(mail);
      socket.write(`${message}\r\n.\r\n`);
      await this.expect(socket, [250]);
      await this.command(socket, 'QUIT', [221]);
    } catch (error) {
      throw new CoolCommException(
        error instanceof Error ? error.message : '邮箱发送失败'
      );
    } finally {
      socket.end();
      socket.destroy();
    }
  }

  private buildMessage(mail: { to: string; subject: string; html: string }) {
    const smtpConfig = this.getSmtpConfig();
    const encodedSubject = `=?UTF-8?B?${Buffer.from(mail.subject).toString(
      'base64'
    )}?=`;
    const from = smtpConfig.from || smtpConfig.user;
    const body = mail.html.replace(/^\./gm, '..');

    return [
      `From: ${from}`,
      `To: ${mail.to}`,
      `Subject: ${encodedSubject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      body,
    ].join('\r\n');
  }

  private async createSocket() {
    const smtpConfig = this.getSmtpConfig();
    const secure = smtpConfig.secure !== false;
    const port = smtpConfig.port || 465;
    const host = smtpConfig.host || '';

    return await new Promise<net.Socket | tls.TLSSocket>((resolve, reject) => {
      const onError = (error: Error) => reject(error);
      const socket = secure
        ? tls.connect(
            {
              host,
              port,
              servername: host,
            },
            () => resolve(socket)
          )
        : net.createConnection({ host, port }, () => resolve(socket));

      socket.once('error', onError);
      socket.once('connect', () => {
        socket.removeListener('error', onError);
      });
      if (secure) {
        socket.once('secureConnect', () => {
          socket.removeListener('error', onError);
        });
      }
    });
  }

  private async command(
    socket: net.Socket | tls.TLSSocket,
    content: string,
    expectedCodes: number[]
  ) {
    socket.write(`${content}\r\n`);
    return await this.expect(socket, expectedCodes);
  }

  private async expect(
    socket: net.Socket | tls.TLSSocket,
    expectedCodes: number[]
  ) {
    const response = await this.readResponse(socket);
    if (!expectedCodes.includes(response.code)) {
      throw new Error(
        `SMTP 响应异常：${response.code} ${response.raw.trim() || 'unknown'}`
      );
    }
    return response;
  }

  private async readResponse(socket: net.Socket | tls.TLSSocket) {
    return await new Promise<SmtpResponse>((resolve, reject) => {
      let buffer = '';

      const cleanup = () => {
        socket.off('data', onData);
        socket.off('error', onError);
        socket.off('close', onClose);
      };

      const onError = (error: Error) => {
        cleanup();
        reject(error);
      };

      const onClose = () => {
        cleanup();
        reject(new Error('SMTP 连接已关闭'));
      };

      const onData = (chunk: Buffer) => {
        buffer += chunk.toString('utf8');
        if (this.isCompleteResponse(buffer)) {
          cleanup();
          const lines = buffer
            .split(/\r?\n/)
            .map(e => e.trimEnd())
            .filter(Boolean);
          const lastLine = lines[lines.length - 1] || '';
          resolve({
            code: Number(lastLine.slice(0, 3)),
            raw: buffer,
          });
        }
      };

      socket.on('data', onData);
      socket.once('error', onError);
      socket.once('close', onClose);
    });
  }

  private isCompleteResponse(buffer: string) {
    const lines = buffer
      .split(/\r?\n/)
      .map(e => e.trimEnd())
      .filter(Boolean);
    const lastLine = lines[lines.length - 1] || '';
    return /^\d{3}\s/.test(lastLine);
  }
}
