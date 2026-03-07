export interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  status: "upcoming" | "completed";
  registrationsCount: number;
  attendanceCount?: number;
  mainPhoto?: string;
  photos?: string[];
  club?: {
    _id: string;
    name: string;
    description: string;
  };
  participants?: string[];
  attendance?: string[];
}

export interface Club {
  _id: string;
  name: string;
  description: string;
  admin: string | { _id: string; name: string; email: string };
  members: string[];
  mainPhoto?: string;
  photos?: string[];
  pendingMembers?: string[];
  eventsCount?: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  clubsJoined?: string[];
}

export interface ClubJoinRequest {
  _id: string;
  userId: string | { _id: string; name: string; email: string };
  clubId: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string | { _id: string; name: string; email: string };
}
