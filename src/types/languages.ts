export interface PolylangLanguage {
  locale: string;
  name?: string;
  flag?: string;
}

export interface PolylangPlugin {
  polylang?: {
    languages?: PolylangLanguage[];
  };
}

