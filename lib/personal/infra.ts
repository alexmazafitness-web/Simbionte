import type { InfraBucket } from "./constants";

export type InfraItemVM = {
  id: string;
  bucket: InfraBucket;
  name: string;
  desc: string | null;
  platform: string | null;
  url: string | null;
  note: string | null;
};
