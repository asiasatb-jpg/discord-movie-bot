export type SupportedLocale = 'id' | 'en';

export interface UserPreferences {
  locale: SupportedLocale;
  preferredRegion?: string;
}

export interface PaginationOptions<T> {
  items: T[];
  pageSize?: number;
  renderItem: (item: T, index: number) => string;
  title: string;
  description?: string;
}
