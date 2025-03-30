import { $, Context } from "koishi";
import {
  CardPlayer,
  Enemy,
  EnemyAI,
  RougueCard,
  WildPokemonType,
} from "./type";
import { initType } from "./method";
import { Robot } from "../utils/robot";
import { Skill } from "../battle";

export async function apply(ctx: Context) {
  ctx.command("card-battle", "卡牌对战").action(async ({ session }) => {
    const a = new Robot(100);
    const a1: Enemy = new Enemy(a);
    a1.drawHand(5);
    return await a1.currentHand[0].drwaCard(ctx);
  });
}
