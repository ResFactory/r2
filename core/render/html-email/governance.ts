import * as govn from "../../../governance/mod.ts";
import * as ds from "./design-system.ts";
import * as contrib from "../contributions.ts";

export interface HtmlEmailLayoutContributions {
  readonly stylesheets: contrib.Contributions;
  readonly scripts: contrib.Contributions;
  readonly head: contrib.Contributions;
  readonly body: contrib.Contributions;
  readonly bodyMainContent: contrib.Contributions;
  readonly diagnostics: contrib.Contributions;
}

export type HtmlEmailLayoutBody =
  | govn.FlexibleContentSync
  | govn.FlexibleContent
  | govn.HtmlSupplier;

// deno-lint-ignore no-empty-interface
export interface HtmlEmailLayoutStrategy<Layout extends HtmlEmailLayout>
  extends govn.IdentifiableLayoutStrategy<Layout, govn.HtmlSupplier> {
}

// deno-lint-ignore no-empty-interface
export interface HtmlEmailLayoutStrategySupplier<Layout extends HtmlEmailLayout>
  extends govn.LayoutStrategySupplier<Layout, govn.HtmlSupplier> {
}

export type HtmlEmailLayoutDiagnosticsRequest =
  | boolean
  | "all"
  | "bodySource"
  | "layoutStrategySupplier"
  | "contributions"
  | "state";

export interface HtmlEmailLayoutArguments {
  readonly diagnostics?: HtmlEmailLayoutDiagnosticsRequest;
}

export interface HtmlEmailContentAdapter<Layout> {
  readonly subject: (layout: Layout) => string;
}

export interface HtmlEmailOperationalCtxDomDataAttrsResolver {
  (layout: HtmlEmailLayout): string;
}

export interface HtmlEmailMetaOriginDomDataAttrsResolver {
  (layout: HtmlEmailLayout): string;
}

export interface HtmlEmailDesignSystemOriginDomDataAttrsResolver {
  (
    layout: HtmlEmailLayout,
    srcModuleImportMetaURL: string,
    symbol: string,
  ): string;
}

export interface HtmlEmailOriginResolvers {
  readonly meta: HtmlEmailMetaOriginDomDataAttrsResolver;
  readonly designSystem: HtmlEmailDesignSystemOriginDomDataAttrsResolver;
  readonly operationalCtx: HtmlEmailOperationalCtxDomDataAttrsResolver;
  readonly dataAttrs: (
    layout: HtmlEmailLayout,
    srcModuleImportMetaURL: string,
    symbol: string,
  ) => string;
}

export interface HtmlEmailLayout<OperationalCtxClientCargo = unknown>
  extends
    Partial<govn.FrontmatterSupplier<govn.UntypedFrontmatter>>,
    HtmlEmailLayoutArguments {
  readonly bodySource: HtmlEmailLayoutBody;
  readonly context: ds.UntypedEmailDesignSystemContext;
  // deno-lint-ignore no-explicit-any
  readonly designSystem: ds.EmailDesignSystem<any>;
  // deno-lint-ignore no-explicit-any
  readonly layoutSS: HtmlEmailLayoutStrategySupplier<any>;
  readonly contributions: HtmlEmailLayoutContributions;
  readonly origin: HtmlEmailOriginResolvers;
  readonly operationalCtxClientCargo?: OperationalCtxClientCargo;
}

/**
 * Used by Deno HTML modules as html: { text: HtmlLayoutBodySupplier }
 */
export interface HtmlEmailLayoutBodySupplier {
  (layout: HtmlEmailLayout): string;
}

export interface TemplateLiteralHtmlEmailLayout<
  T,
  Layout extends HtmlEmailLayout,
> {
  (
    literals: TemplateStringsArray,
    ...expressions: T[]
  ): HtmlEmailLayoutStrategy<Layout>;
}

export interface HtmlEmailTemplateExprBodyTextSupplier {
  (body?: string): string;
}

export interface HtmlEmailTemplateExprLayoutSupplier<
  Layout extends HtmlEmailLayout,
> {
  (
    layout: Layout,
    body?: string,
  ): string | contrib.TextContributionsPlaceholder;
}

export type HtmlEmailPartialUntyped = HtmlEmailTemplateExprLayoutSupplier<
  HtmlEmailLayout
>;
export type HtmlEmailPartial<Layout extends HtmlEmailLayout> =
  HtmlEmailTemplateExprLayoutSupplier<Layout>;

export type HtmlEmailHelperFunctionOrString<Layout extends HtmlEmailLayout> =
  | HtmlEmailPartial<Layout>
  | string;
