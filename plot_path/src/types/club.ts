export interface MyClub {
  Id: string
  Name: string
  AvatarUrl: string | null
  IsPublic: boolean
  Role: string
  MemberCount: number
}
export interface PublicClub {
  Id: string
  Name: string
  Description: string | null
  AvatarUrl: string | null
  MemberCount: number
}
export interface Tag { Id: string; Name: string; Type: string }
export interface Member { Id: string; Username: string; AvatarUrl: string | null; Role: string }
export interface CurrentBook {
  ClubBookId: string
  BookId: string
  Title: string
  Author: string
  CoverUrl: string | null
  StartDate: string
  EndDate: string
  DaysLeft: number
  AverageRating: number | null
  RatingsCount: number
}
export interface Club {
  Id: string
  Name: string
  Description: string | null
  AvatarUrl: string | null
  InviteCode: string
  IsPublic: boolean
  MemberCount: number
  tags: Tag[]
  members: Member[]
  currentBook: CurrentBook | null
  viewerRole: string | null
  myRating: number | null
}
export interface Message {
  Id: string
  UserId: string
  MessageText: string
  CreatedAt: string
  Username: string
  AvatarUrl: string | null
}
export interface Book { Id: string; Title: string; Author: string; CoverUrl: string | null }
