export interface TranslationBlock {
  original: string;
  translated: string;
  sourceLanguage?: string;
  targetLanguage?: string;
}

export interface TranslationResult {
  blocks: TranslationBlock[];
  rawMeta?: Record<string, unknown>;
}
