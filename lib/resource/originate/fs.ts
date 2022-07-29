import * as rt from "../route/mod.ts";

export type FileSysPathText = string;
export type FileSysFileNameOnly = string;
export type FileSysGlobText = string;

export interface FileSysPathGlob extends Partial<rt.FileSysRouteOptions> {
  readonly humanFriendlyName?: string;
  readonly glob: FileSysGlobText;
  readonly exclude?: string[];
}
