import * as safety from "../../../safety/mod.ts";
import * as tmpl from "../template/mod.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export type FilterableRecordValues<
  T,
  Context extends tmpl.SqlEmitContext,
> = {
  [K in keyof T]?:
    | T[K]
    | tmpl.SqlTextSupplier<Context>
    | FilterCriteriaValue
    | FilterCriteriaComponent;
};

export type FilterCriteriaValue = {
  readonly join?: "AND" | "OR" | "NOT";
  readonly filterCriteriaValue: unknown;
};

export function fcValue(
  value: unknown,
  options?: Partial<Omit<FilterCriteriaValue, "filterCriteriaValue">>,
) {
  const result: FilterCriteriaValue = {
    filterCriteriaValue: value,
    ...options,
  };
  return result;
}

export const isFilterCriteriaValue = safety.typeGuard<FilterCriteriaValue>(
  "filterCriteriaValue",
);

export type FilterCriteriaComponent = {
  readonly isFilterCriteriaComponent: true;
  readonly join?: "AND" | "OR" | "NOT";
  readonly values: [value: unknown, valueSqlText: string];
};

export const isFilterCriteriaComponent = safety.typeGuard<
  FilterCriteriaComponent
>(
  "isFilterCriteriaComponent",
  "values",
);

export type IdentifiableFilterCriteriaComponent<
  FilterableRecord,
  FilterableAttrName extends keyof FilterableRecord = keyof FilterableRecord,
> = FilterCriteriaComponent & {
  readonly isFilterCriteriaComponent: true;
  readonly identity: FilterableAttrName;
};

export function isIdentifiableFilterCriteriaComponent<FilterableRecord>(
  o: unknown,
): o is IdentifiableFilterCriteriaComponent<FilterableRecord> {
  const isIFCC = safety.typeGuard<
    IdentifiableFilterCriteriaComponent<FilterableRecord>
  >(
    "isFilterCriteriaComponent",
    "identity",
    "values",
  );
  return isFilterCriteriaComponent(o) && isIFCC(o);
}

export interface FilterCriteriaPreparerOptions<
  FilterableRecord,
  Context extends tmpl.SqlEmitContext,
  FilterableAttrName extends keyof FilterableRecord = keyof FilterableRecord,
> {
  readonly isAttrFilterable?: (
    attrName: FilterableAttrName,
    record: FilterableRecord,
  ) => boolean;
  readonly filterAttr?: (
    attrName: FilterableAttrName,
    record: FilterableRecord,
    ns: tmpl.SqlObjectNames,
    ctx: Context,
  ) => IdentifiableFilterCriteriaComponent<FilterableRecord> | undefined;
}

export interface FilterCriteria<
  FilterableRecord,
  Context extends tmpl.SqlEmitContext,
  FilterableAttrName extends keyof FilterableRecord = keyof FilterableRecord,
> {
  readonly filterable: FilterableRecord;
  readonly candidateAttrs: (
    group?: "all" | "primary-keys",
  ) => FilterableAttrName[];
  readonly criteria: IdentifiableFilterCriteriaComponent<FilterableRecord>[];
  readonly fcpOptions?: FilterCriteriaPreparerOptions<
    FilterableRecord,
    Context
  >;
}

export interface FilterCriteriaPreparer<
  FilterableRecord,
  Context extends tmpl.SqlEmitContext,
> {
  (
    ctx: Context,
    fr: FilterableRecord,
    options?: FilterCriteriaPreparerOptions<
      FilterableRecord,
      Context
    >,
  ): FilterCriteria<FilterableRecord, Context>;
}

export function filterCriteriaHelpers<
  FilterableRecord,
  Context extends tmpl.SqlEmitContext,
>() {
  return {
    and: (andValue: Any): FilterCriteriaValue =>
      fcValue(andValue, { join: "AND" }),
    or: (orValue: Any): FilterCriteriaValue => fcValue(orValue, { join: "OR" }),
    not: (notValue: Any): FilterCriteriaValue =>
      fcValue(notValue, { join: "NOT" }),
  };
}

export function filterCriteriaPreparer<
  FilterableRecord,
  Context extends tmpl.SqlEmitContext,
  FilterableAttrName extends keyof FilterableRecord = keyof FilterableRecord,
>(
  candidateAttrs: (group?: "all" | "primary-keys") => FilterableAttrName[],
  defaultFcpOptions?: FilterCriteriaPreparerOptions<FilterableRecord, Context>,
): FilterCriteriaPreparer<FilterableRecord, Context> {
  return (ctx, fr, fcpOptions = defaultFcpOptions) => {
    const {
      isAttrFilterable = (
        attrName: FilterableAttrName,
        record: FilterableRecord,
      ) => Object.hasOwn(record as Any, attrName) ? true : false,
      filterAttr,
    } = fcpOptions ?? {};
    const { sqlTextEmitOptions: eo } = ctx;
    const { quotedLiteral } = eo;
    const ns = ctx.sqlNamingStrategy(ctx, {
      quoteIdentifiers: true,
    });

    const values = (
      rawValue: unknown,
    ): [value: unknown, valueSqlText: string] => {
      if (tmpl.isSqlTextSupplier(rawValue)) {
        return [rawValue, `(${rawValue.SQL(ctx)})`]; // e.g. `(SELECT x from y) as SQL expr`
      } else {
        return quotedLiteral(rawValue);
      }
    };

    const criteria: IdentifiableFilterCriteriaComponent<FilterableRecord>[] =
      [];
    candidateAttrs().forEach((c) => {
      if (isAttrFilterable && !isAttrFilterable(c, fr)) {
        return;
      }

      let ec: IdentifiableFilterCriteriaComponent<FilterableRecord> | undefined;
      if (filterAttr) {
        ec = filterAttr(c, fr, ns, ctx);
      } else {
        const recordValueRaw = (fr as Any)[c];
        if (isIdentifiableFilterCriteriaComponent(recordValueRaw)) {
          ec = recordValueRaw;
        } else if (isFilterCriteriaComponent(recordValueRaw)) {
          ec = { ...recordValueRaw, identity: c };
        } else if (isFilterCriteriaValue(recordValueRaw)) {
          ec = {
            isFilterCriteriaComponent: true,
            identity: c,
            values: values(recordValueRaw.filterCriteriaValue),
            ...recordValueRaw,
          };
        } else {
          ec = {
            isFilterCriteriaComponent: true,
            identity: c,
            values: values(recordValueRaw),
          };
        }
      }
      if (ec) {
        criteria.push({
          ...ec,
          join: criteria.length > 0 ? (ec.join ?? `AND`) : undefined,
        });
      }
    });
    return {
      candidateAttrs,
      fcpOptions,
      filterable: fr,
      criteria,
    };
  };
}

export function filterCriteriaSQL<
  FilterableRecord,
  Context extends tmpl.SqlEmitContext,
  FilterableAttrName extends keyof FilterableRecord = keyof FilterableRecord,
>(fc: FilterCriteria<FilterableRecord, Context>, fcsOptions?: {
  readonly attrNameSupplier?: (
    attrName: FilterableAttrName,
    ns: tmpl.SqlObjectNames,
  ) => string;
}) {
  const result: tmpl.SqlTextSupplier<Context> = {
    ...fc,
    SQL: (ctx) => {
      const {
        attrNameSupplier = (an: FilterableAttrName, ns: tmpl.SqlObjectNames) =>
          ns.domainName(String(an)),
      } = fcsOptions ?? {};
      const ns = ctx.sqlNamingStrategy(ctx, { quoteIdentifiers: true });
      // TODO: figure out why 'c.identity as Any' is needed in typed attrNameSupplier
      // deno-fmt-ignore
      return `${fc.criteria.map((c) => `${c.join ? ` ${c.join} ` : ""}${attrNameSupplier(c.identity as Any, ns)} = ${c.values[1]}`).join("")
      }`;
    },
  };
  return result;
}
