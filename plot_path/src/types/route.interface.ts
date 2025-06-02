import type { Book } from './general.interface';

export interface Route {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  isPersonalized: boolean;
  createdAt: string;
  imageUrl: string | null;
  isMonthly: boolean;
  status?: 'in_progress' | 'completed' | 'planned';
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface RouteProgress {
  routeId: string;
  progressPercent: number | null;
  books: Book[]; // import type Book if needed
}
