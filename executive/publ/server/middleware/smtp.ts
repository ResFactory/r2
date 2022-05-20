import { oak } from "../deps.ts";
import * as smtp from "../../../../lib/smtp/mod.ts";
import * as mg from "../../../../lib/smtp/mailgun.ts";

/**
 * Registers an endpoint (usually /smtp) which accepts JSON
 */
export class SmtpProxyMiddlewareSupplier {
  constructor(
    readonly smtpClientSupplier: (identity?: string) => smtp.SmtpClientSupplier,
    readonly app: oak.Application,
    readonly router: oak.Router,
    readonly htmlEndpointURL: string,
  ) {
    // REMINDER: if you add any routes here, make them easily testable by adding
    // them to executive/publ/server/inspect.http

    router.post(htmlEndpointURL, async (ctx) => {
      // API callers should use content-type: application/json so that body.value is
      // parsed as JSON, not text
      const body = await (ctx.request.body().value);
      if (smtp.isSmtpMessage(body)) {
        await this.sendEmail(body, ctx);
      } else {
        ctx.response.status = 500;
        ctx.response.body = JSON.stringify({
          body,
          error: `invalid SMTP payload: smtp.isSmtpMessage() returned false`,
        });
      }
    });
  }

  async sendEmail(payload: smtp.SmtpMessage, oakCtx: oak.Context) {
    const cs = this.smtpClientSupplier(payload.smtpServerID);
    if (cs) {
      try {
        const client = cs.client();
        const message = cs.prepareSend(payload);
        await client.send(message);
        oakCtx.response.status = 200;
        oakCtx.response.body = JSON.stringify({
          isValid: true,
          narrative:
            `email sent from ${message.from} to ${message.to} via ${cs.hostname}`,
          message,
        });
      } catch (error) {
        oakCtx.response.status = 500;
        oakCtx.response.body = JSON.stringify({
          payload,
          error: Deno.inspect(error),
          message: error.toString(),
          config: cs,
        });
        // TODO: report this error via pubctl.sqlite.db?
        console.error({ config: cs, error });
      }
    } else {
      oakCtx.response.status = 500;
      oakCtx.response.body = JSON.stringify({
        payload,
        error: `SMTP server ID '${payload.smtpServerID}' not defined`,
      });
    }
  }
}

/**
 * Registers an endpoint (usually /smtp) which accepts JSON
 */
export class MailgunProxyMiddlewareSupplier {
  constructor(
    readonly mailgunClientSupplier: (identity?: string) => mg.MailgunClient,
    readonly app: oak.Application,
    readonly router: oak.Router,
    readonly htmlEndpointURL: string,
  ) {
    // REMINDER: if you add any routes here, make them easily testable by adding
    // them to executive/publ/server/inspect.http

    router.post(htmlEndpointURL, async (ctx) => {
      // API callers should use content-type: application/json so that body.value is
      // parsed as JSON, not text
      const body = await (ctx.request.body().value);
      if (smtp.isSmtpMessage(body)) {
        await this.sendEmail(body, ctx);
      } else {
        ctx.response.status = 500;
        ctx.response.body = JSON.stringify({
          body,
          error: `invalid SMTP payload: smtp.isSmtpMessage() returned false`,
        });
      }
    });
  }

  async sendEmail(payload: smtp.SmtpMessage, oakCtx: oak.Context) {
    const mgc = this.mailgunClientSupplier(payload.smtpServerID);
    if (mgc) {
      try {
        const message = mgc.prepareMessage(payload);
        const resp = await mgc.send(message);
        oakCtx.response.status = resp.status;
        oakCtx.response.body = JSON.stringify({
          isValid: resp.ok,
          narrative:
            `email sent from ${message.from} to ${message.to} via ${mgc.messagesApiEndpoint}`,
          message,
          response: {
            status: resp.status,
            statusText: resp.statusText,
            text: await resp.text(),
          },
        });
      } catch (error) {
        oakCtx.response.status = 500;
        oakCtx.response.body = JSON.stringify({
          isValid: false,
          payload,
          error: Deno.inspect(error),
          message: error.toString(),
          config: mgc,
        });
        // TODO: report this error via pubctl.sqlite.db?
        console.error({ config: mgc, error });
      }
    } else {
      oakCtx.response.status = 500;
      oakCtx.response.body = JSON.stringify({
        isValid: false,
        payload,
        error: `Mailgun server ID '${payload.smtpServerID}' not defined`,
      });
    }
  }
}
