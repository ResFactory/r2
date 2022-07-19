// deno-lint-ignore no-explicit-any
type Any = any;

export interface EngineInstanceConnProps {
  driver?: string;
  username?: string;
  password?: string;
  host?: string;
  port?: number;
  database?: string;
  filename?: string; // For SQLite
}

export interface EngineConnPropsOptions<
  ConnPropsMutable extends EngineInstanceConnProps,
  ConnProps extends Readonly<ConnPropsMutable> = Readonly<ConnPropsMutable>,
  ConnPropKey extends keyof ConnProps = keyof ConnProps,
> {
  readonly transformQueryParam?: (
    key: string,
    value: string,
  ) => { key: ConnPropKey; value: unknown };
  readonly transform?: (cpm: ConnPropsMutable) => ConnProps;
  readonly onInvalid?: (error: Error) => ConnProps | undefined;
}

export function engineConnProps<
  ConnPropsMutable extends EngineInstanceConnProps,
  ConnProps extends Readonly<ConnPropsMutable> = Readonly<ConnPropsMutable>,
  ConnPropKey extends keyof ConnProps = keyof ConnProps,
>(
  dbUriSupplier: string | (() => string),
  options?: EngineConnPropsOptions<ConnPropsMutable, ConnProps>,
): ConnProps | undefined {
  const {
    transformQueryParam = (key: string, value: string) => ({
      key: key as ConnPropKey,
      value,
    }),
    transform,
    onInvalid,
  } = options ?? {};

  try {
    const dbURI = typeof dbUriSupplier === "function"
      ? dbUriSupplier()
      : dbUriSupplier;
    const url = new URL(dbURI);
    const config: ConnPropsMutable = {} as ConnPropsMutable;

    // any arbitrary query params kv pairs become part of the conn props
    for (const [spKey, spValue] of url.searchParams.entries()) {
      const { key, value } = transformQueryParam(spKey, spValue);
      (config as Any)[key] = value;
    }

    // Fix trailing :
    config.driver = (url.protocol || "sqlite3:").replace(/\:$/, "");

    // Cloud Foundry fix
    if (config.driver == "mysql2") config.driver = "mysql";

    if (url.username.length) config.username = url.username;
    if (url.password.length) config.password = url.password;

    if (config.driver === "sqlite3") {
      if (url.hostname) {
        if (url.pathname) {
          // Relative path.
          config.filename = url.hostname + url.pathname;
        } else {
          // Just a filename.
          config.filename = url.hostname;
        }
      } else {
        // Absolute path.
        config.filename = url.pathname;
      }
    } else {
      // Some drivers (e.g., redis) don't have database names.
      if (url.pathname) {
        config.database = url.pathname
          .replace(/^\//, "")
          .replace(/\/$/, "");
      }

      if (url.hostname) config.host = url.hostname;
      if (url.port) config.port = parseInt(url.port);
    }

    return transform ? transform(config) : config as ConnProps;
  } catch (error) {
    return onInvalid?.(error);
  }
}
