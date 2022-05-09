import * as rfStd from "../../core/std/mod.ts";

export const prettyUrlSuffix = "/index";
export const prettyUrlSuffixChopLen = -(prettyUrlSuffix.length - 1);
export const prettyUrlLocation: rfStd.RouteLocationResolver = rfStd
  .defaultRouteLocationResolver({
    enhance: (suggested) => {
      // if the route ends in "/index" keep the '/' but drop 'index'
      if (suggested.endsWith(prettyUrlSuffix)) {
        return suggested.slice(0, prettyUrlSuffixChopLen);
      }
      return suggested;
    },
  });
