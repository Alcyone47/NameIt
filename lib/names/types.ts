export interface NameCandidate {
  name: string;
  meaning?: string;
  origin?: string;
  language?: string;
  gender?: string;
  categories?: string[];
  tags?: string[];
  source?: string;
  sourceUrl?: string;
}

/** Everything the repository can use to pick relevant candidates. */
export interface CandidateQuery {
  specification: string;
  /** Category of the thing in the photo, e.g. "pet" or "vehicle". */
  category?: string;
  /** Visual keywords from image analysis: colours, traits, subject. */
  keywords: string[];
  exclude: string[];
  limit: number;
}

/**
 * A source of names. The local curated list is one; an imported open dataset
 * or a (rate-limited, cached, permitted) external API can be others.
 */
export interface NameSource {
  readonly id: string;
  /** Sources may fail; the repository treats failures as "no results". */
  load(query: CandidateQuery): Promise<NameCandidate[]>;
}
