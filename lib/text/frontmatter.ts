import * as yaml from "https://deno.land/std@0.147.0/encoding/yaml.ts";
import * as toml from "https://deno.land/std@0.147.0/encoding/toml.ts";

export type UntypedFrontmatter = Record<string, unknown>;

export interface FrontmatterParseResult<FM extends UntypedFrontmatter> {
  readonly nature:
    | "not-found"
    | "yaml"
    | "toml"
    | "error";
  readonly frontmatter?: FM;
  readonly content: string;
  readonly error?: Error;
}

export const yamlTomlMarkdownFrontmatterRE =
  /^[\-\+][\-\+][\-\+]([\s\S]*?)^[\-\+][\-\+][\-\+]\n([\s\S]*)/m;

export const yamlHtmlFrontmatterRE = /^<!---([\s\S]*?)^--->\n([\s\S]*)/m;

/**
 * Frontmatter is metadata attached to the start of text. If text is prefaced
 * by opening and closing +++ it the metadata is considered TOML-formatted
 * otherwise it's considered YAML-formatted.
 * @param text The text to search and extract frontmatter from
 * @param options match strategy and result typing
 * @returns The parsed, raw, frontmatter as a JS object and the remaining text
 */
export function parseTextFrontmatter<FM extends UntypedFrontmatter>(
  text: string,
  options?: {
    regExp?: RegExp;
    // deno-lint-ignore ban-types
    typed?: (untyped: object | null) => FM;
    onNotObject?: (
      fmParsed: unknown,
      fmText: string,
      content: string,
    ) => FrontmatterParseResult<FM>;
  },
): FrontmatterParseResult<FM> {
  const {
    regExp = yamlTomlMarkdownFrontmatterRE,
    // deno-lint-ignore ban-types
    typed = (untyped: object | null) => untyped as FM,
    onNotObject,
  } = options ?? {};
  try {
    const fmMatch = text.match(regExp);
    if (fmMatch) {
      const [_, fmText, content] = fmMatch;
      const isTOML = text.startsWith("+++");
      const fm = isTOML ? toml.parse(fmText.trim()) : yaml.parse(fmText.trim());
      switch (typeof fm) {
        case "object":
          return {
            nature: isTOML ? "toml" : "yaml",
            frontmatter: typed(fm),
            content,
          };
      }
      if (onNotObject) {
        return onNotObject(fm, fmText, content);
      }
      return {
        nature: "error",
        content,
        // deno-fmt-ignore
        error: new Error(`${isTOML ? "toml" : "yaml"} parse of frontmatter did not return an object`),
      };
    } else {
      return {
        nature: "not-found",
        content: text,
      };
    }
  } catch (error) {
    return {
      nature: "error",
      content: text,
      error,
    };
  }
}

export const parseYamlTomlFrontmatter = (text: string) =>
  parseTextFrontmatter(text, { regExp: yamlTomlMarkdownFrontmatterRE });

export const parseYamlHtmlFrontmatter = (text: string) =>
  parseTextFrontmatter(text, { regExp: yamlHtmlFrontmatterRE });
