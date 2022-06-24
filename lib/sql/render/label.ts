import * as safety from "../../safety/mod.ts";

export type LabelsSupplier<Label extends string> = { readonly labels: Label[] };

export function isLabelsSupplier<Label extends string>(
  o: unknown,
): o is LabelsSupplier<Label> {
  const isLSD = safety.typeGuard<LabelsSupplier<Label>>("labels");
  return isLSD(o);
}
