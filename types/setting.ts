import type { Setting as SettingSchema } from "@/db/schema";

export type Setting = SettingSchema;

export interface CreateSettingInput {
  name: string;
  description: string;
}
