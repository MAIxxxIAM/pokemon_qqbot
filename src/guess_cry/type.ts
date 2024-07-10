import {} from "koishi-plugin-silk";
import pokemonCal from "../utils/pokemon";
import { Context, h, Session } from "koishi";
import {} from "@koishijs/plugin-adapter-qq";

export interface Cry_info {
  name: string;
  file_info: string;
  file_uuid: string;
  ttl: Date;
}

export class Cry_Wav {
  private cry_info: string;
  pokemon_name: string;
  id: number;
  constructor(id: number, ctx: Context, session: Session) {}
}
