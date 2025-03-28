import { $, Context } from "koishi";
import { CardPlayer, Enemy, EnemyAI, WildPokemonType } from "./type";
import { initType } from "./method";
import { Robot } from "../utils/robot";
import { Skill } from "../battle";

export async function apply(ctx: Context) {
  const a = {
    currentHp: 3,
    armor: 0,
    energy: 2,
    enymyType: 2,
    aiStrategy: { memory: { playerArmorHistory: [] } },
    currentHand: [],
    name: "洛托姆322号",
    maxHp: 241,
    maxEnergy: 3,
    power: {
      hp: 241,
      attack: 241,
      defense: 265,
      specialAttack: 217,
      specialDefense: 215,
      speed: 165,
    },
    deck: [
      {
        name: "护甲卡",
        type: "defense",
        description: "获得一定量的护甲",
        cost: 1,
        rarity: 0,
        cardCategory: "一般",
      },
      {
        name: "特殊攻击卡",
        type: "attack",
        description: "造成0.35*特攻的伤害",
        cost: 2,
        rarity: 0,
        cardCategory: "一般",
      },
      {
        name: "攻击卡",
        type: "attack",
        description: "造成0.35*攻击力的伤害",
        cost: 1,
        rarity: 0,
        cardCategory: "一般",
      },
    ],
    discardPile: [],
    skill: [
      {
        id: 126,
        name: "终结门牙",
        type: "一般",
        category: 1,
        dam: 80,
        hit: 90,
        descript: "用锋利的门牙牢牢地咬住对手进行攻击。有时会使对手畏缩。",
        cd: 2,
        round: 2,
      },
      {
        id: 79,
        name: "银色旋风",
        type: "虫",
        category: 3,
        dam: 60,
        hit: 100,
        descript: "在风中掺入鳞粉攻击对手。有时会提高自己的全部能力。",
        cd: 2,
        round: 2,
      },
      {
        id: 22,
        name: "起风",
        type: "飞行",
        category: 3,
        dam: 40,
        hit: 100,
        descript: "用翅膀将刮起的狂风袭向对手进行攻击。",
        cd: 1,
        round: 1,
      },
      {
        id: 18,
        name: "流沙深渊",
        type: "地面",
        category: 1,
        dam: 35,
        hit: 85,
        descript: "将对手困在铺天盖地的沙暴中，在４～５回合内进行攻击。",
        cd: 1,
        round: 1,
      },
    ],
    pokemonCategory: ["毒", "草"],
  };

  const b = new Robot(100);
  const restoredObject: Enemy = initType(a, Enemy, b);
  const b1 = new Enemy(b);
  const c = restoredObject.drawHand(2);
  const context = {
    player: restoredObject,
    self: restoredObject,
    currentEnergy: 100,
    turnCount: 10,
  };
  const e = restoredObject.act(context);
  console.log(b1.deck);
}
