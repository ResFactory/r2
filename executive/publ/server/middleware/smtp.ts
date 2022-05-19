import { oak } from "../deps.ts";
import * as smtp from "../../../../lib/smtp/mod.ts";

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
        ctx.response.body = `invalid SMTP payload: ${body}`;
      }
    });
  }

  async sendEmail(payload: smtp.SmtpMessage, oakCtx: oak.Context) {
    try {
      const cs = this.smtpClientSupplier(payload.smtpServerID);
      if (cs) {
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
      } else {
        oakCtx.response.status = 500;
        oakCtx.response.body = JSON.stringify({
          payload: payload,
          error: `SMTP server ID '${payload.smtpServerID}' not defined`,
        });
      }
    } catch (error) {
      oakCtx.response.status = 500;
      oakCtx.response.body = JSON.stringify({
        payload: payload,
        error: Deno.inspect(error),
        message: error.toString(),
      });
      console.error(error);
    }
  }
}
