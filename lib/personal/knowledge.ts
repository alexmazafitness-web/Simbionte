export type KnCategoryVM = {
  id: string;
  emoji: string | null;
  name: string;
};

export type KnNoteVM = {
  id: string;
  title: string;
  text: string | null;
  source: string | null;
  categoryId: string | null;
};

export type KnPrincipleVM = {
  id: string;
  text: string | null;
  source: string | null;
};

export type KnSystemVM = {
  id: string;
  name: string;
  desc: string | null;
};
