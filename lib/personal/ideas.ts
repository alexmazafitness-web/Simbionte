import type { Front } from "./constants";

export type IdeaEstado = "abierta" | "archivada";

export type IdeaVM = {
  id: string;
  text: string;
  front: Front;
  estado: IdeaEstado;
};
