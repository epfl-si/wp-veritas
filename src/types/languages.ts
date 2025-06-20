export interface PolylangLanguage {
  locale: string;
  name?: string;
  flag?: string;
  common: string;
}

export interface PolylangPlugin {
  polylang?: {
    languages?: PolylangLanguage[];
  };
}

