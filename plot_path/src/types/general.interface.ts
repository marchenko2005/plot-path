export interface Book {
  Id: string;
  Title: string;
  Author: string;
  Description: string;
  CoverUrl: string;
  RouteId: string;
  progressPercent: number;
}
export interface Review {
  Id: string;
  Rating: number;
  ReviewText: string;
  CreatedAt: string;
  UserId: string;
  UserName: string;
  UserAvatar: string;
}
