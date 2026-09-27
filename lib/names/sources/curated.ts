import { CURATED_NAMES } from "../data/curated";
import type { NameSource } from "../types";

export const curatedSource: NameSource = {
  id: "curated",
  async load() {
    return CURATED_NAMES;
  },
};
