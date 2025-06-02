// src/types/user.interface.ts

export interface User {
  Id: string;
  Username: string;
  Email: string;
  AvatarUrl: string | null;
}

export interface Tag {
  Id: string;
  Name: string;
  Type: 'Genre' | 'Trope';
}

export interface Route {
  Id: string;
  Name: string;
  Description: string | null;
  Category: string | null;
  ImageUrl: string | null;
  Status: 'planned' | 'in_progress' | 'completed';
}

export interface Badge {
  Id: string;
  Name: string;
  Description: string;
  IconUrl: string | null;
  ImageUrl: string | null;
  Type: 'count' | 'genre_unique' | 'time_limit';
  RequiredValue: number;
  TimeLimitHours: number | null;
  AwardedAt: string;
}
