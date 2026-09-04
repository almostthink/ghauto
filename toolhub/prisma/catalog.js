import { CATALOG as BASE_CATALOG, attachLogos } from "./catalog-base.js";
import { EXPANDED_CATALOG } from "./catalog-expansions.js";

export const CATALOG = [...BASE_CATALOG, ...EXPANDED_CATALOG];
export { attachLogos };
