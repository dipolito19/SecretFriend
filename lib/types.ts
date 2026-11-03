export type Group = {
  id: string;
  code: string;
  name: string;
  budget: string | null;
  event_date: string | null;
  admin_token: string;
  drawn_at: string | null;
  /** Quando o organizador revelou o pote de temas (null = ainda escondido). */
  themes_revealed_at: string | null;
  created_at: string;
};

export type Participant = {
  id: string;
  group_id: string;
  nick: string;
  /** Tema de presente que a pessoa escreveu (entra no "pote" de temas do sorteio). */
  theme: string;
  avoid: string;
  token: string;
  assigned_to: string | null;
  /** Tema sorteado para o presente que esta pessoa vai dar. */
  assigned_theme: string | null;
  created_at: string;
};

export type Wishes = Pick<Participant, "nick" | "theme" | "avoid">;

export type GroupView = {
  code: string;
  name: string;
  budget: string | null;
  eventDate: string | null;
  drawn: boolean;
  isAdmin: boolean;
  participants: { id: string; nick: string }[];
  /** O organizador ja revelou o pote? */
  themesRevealed: boolean;
  /** Temas do pote, em ordem alfabetica (sem dizer quem escreveu). Vazio enquanto nao revelado. */
  themes: string[];
  me: (Wishes & { id: string }) | null;
  /** Quem voce tirou (com as regras dessa pessoa) e o tema sorteado para o presente. */
  match: { id: string; nick: string; avoid: string; theme: string } | null;
};
