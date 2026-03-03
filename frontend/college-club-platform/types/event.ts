export interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  status: "upcoming" | "completed";
  registrationsCount: number;
}