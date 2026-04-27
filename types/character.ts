import type { Character as CharacterSchema } from "@/db/schema";

export type Character = CharacterSchema;

export interface CreateCharacterInput {
  name: string;
  description: string;
}
