export type Group = {
  id: string;
  code: string;
  name: string;
  budget: string | null;
  event_date: string | null;
  admin_token: string;
  drawn_at: string | null;
  created_at: string;
};

export type Participant = {
  id: string;
  group_id: string;
  nick: string;
  category_1: string;
  category_2: string;
  category_3: string;
  avoid: string;
  token: string;
  assigned_to: string | null;
  created_at: string;
};

export type Wishes = Pick<Participant, "nick" | "category_1" | "category_2" | "category_3" | "avoid">;

export type GroupView = {
  code: string;
  name: string;
  budget: string | null;
  eventDate: string | null;
  drawn: boolean;
  isAdmin: boolean;
  participants: { id: string; nick: string }[];
  me: (Wishes & { id: string }) | null;
  match: (Wishes & { id: string }) | null;
};
