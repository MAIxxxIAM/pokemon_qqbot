import { $, Context } from "koishi";
import { CardPlayer, Enemy, EnemyAI, WildPokemonType } from "./type";
import { initType } from "./method";
import { Robot } from "../utils/robot";
import { Skill } from "../battle";

export async function apply(ctx: Context) {
  const a = new Robot(100);

  const b = new Robot(100);
  const a1: Enemy = new Enemy(a);
  const b1 = new Enemy(b);
  const c = a1.drawHand(2);
  let context = {
    player: b1,
    self: a1,
    currentEnergy: 0,
    turnCount: 0,
  };
  console.log(
    a1.currentHp + "  " + b1.currentHp + "  " + JSON.stringify(a1.power)
  );
  battleLoop: while (a1.currentHp > 0 && b1.currentHp > 0) {
    while (a1.energy > 0) {
      a1.drawHand(5);
      let l = a1.act(context);
      if (!l) break;
      console.log(l + "  " + b1.currentHp + "  " + b1.armor + "  " + a1.energy);
      if (b1.currentHp <= 0) {
        break battleLoop;
      }
    }
    a1.discardCard();
    context.player = a1;
    context.self = b1;
    while (b1.energy > 0) {
      b1.drawHand(5);
      let l = b1.act(context);
      if (!l) break;
      console.log(l + "  " + a1.currentHp + "  " + a1.armor + "  " + b1.energy);
      if (a1.currentHp <= 0) {
        break battleLoop;
      }
    }
    b1.discardCard();
    context.player = b1;
    context.self = a1;
  }
}
