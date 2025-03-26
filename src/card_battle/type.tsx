import { Random } from "koishi";
import { PokemonPower } from "../battle";
import { PVP } from "../battle/pvp";
import { Pokebattle } from "../model";

enum CardRarity {
  Common, //5 0.625
  Uncommon, //2 0.25
  Rare, //1  0.125
}

type CardType = "attack" | "defense" | "skill" | "event";

type StatusType = "poison" | "strength" | "weak";

export interface CardCharacter {
  name: string;
  maxHp: number;
  currentHp: number;
  armor: number;
  energy: number;
  maxEnergy: number;
  power: PokemonPower;
}

interface StatusEffect {
  type: StatusType;
  stacks: number;
  duration: number;
}

export abstract class RougueCard {
  constructor(
    public readonly name: string,
    public readonly type: CardType,
    public readonly description: string,
    public readonly cost: number,
    public readonly rarity: CardRarity
  ) {}
  abstract effect(user: CardCharacter, target?: CardCharacter): void;
}

//玩家角色

class CardPlayer implements CardCharacter {
  currentHp: number;
  armor = 0;
  energy: number;

  constructor(
    players: Pokebattle,
    public readonly name: string = new PVP(players).name,
    public readonly maxHp: number = new PVP(players).maxHp,
    public readonly maxEnergy: number = Math.floor(
      new PVP(players).power.speed / 45
    ),
    public readonly power: PokemonPower = new PVP(players).power,
    public deck: RougueCard[] = CardPool.spawnCard(30),
    public discardPile: RougueCard[] = []
  ) {
    this.currentHp = maxHp;
    this.energy = maxEnergy;
  }

  drawHand(size: number): RougueCard[] {
    if (this.deck.length < size) {
      this.deck = Random.shuffle(this.discardPile);
    }
    const hand = this.deck.splice(0, size);
    this.discardPile.push(...hand);
    return hand;
  }
}

//基础战斗卡
export class BaseAttckCard extends RougueCard {
  constructor() {
    super("攻击卡", "attack", "造成0.35*攻击力的伤害", 1, CardRarity.Common);
  }
  effect(user: CardCharacter, target?: CardCharacter): void | string {
    if (!target) return "请选择目标";
    target.currentHp -= Math.floor(
      Math.max(user.power.attack * 0.35 - target.armor, 0)
    );
    return `${user.name}使用了[${this.name}],对${target.name}造成了${Math.floor(
      Math.max(user.power.attack * 0.35 - target.armor, 0)
    )}点伤害`;
  }
}

export class BaseSpecialAttackCard extends RougueCard {
  constructor() {
    super("特殊攻击卡", "attack", "造成0.35*特攻的伤害", 2, CardRarity.Common);
  }
  effect(user: CardCharacter, target?: CardCharacter): void | string {
    if (!target) return "请选择目标";
    target.currentHp -= Math.floor(
      Math.max(user.power.specialAttack * 0.35 - target.armor, 0)
    );
    return `${user.name}使用了[${this.name}],对${target.name}造成了${Math.floor(
      Math.max(user.power.specialAttack * 0.35 - target.armor, 0)
    )}点伤害`;
  }
}

export class BaseArmorCard extends RougueCard {
  constructor() {
    super("护甲卡", "defense", "获得一定量的护甲", 1, CardRarity.Common);
  }
  effect(user: CardCharacter): void | string {
    user.armor += Math.floor(
      (0.35 * (user.power.defense + user.power.specialDefense)) / 4 +
        0.15 * user.power.speed
    );
    return `${user.name}使用了[${this.name}],获得了${Math.floor(
      (0.35 * (user.power.defense + user.power.specialDefense)) / 4 +
        0.15 * user.power.speed
    )}点护甲`;
  }
}

//技能卡

//卡组池
class CardPool {
  private static readonly cards = [
    { class: BaseAttckCard, weight: 8 },
    { class: BaseSpecialAttackCard, weight: 8 },
    { class: BaseArmorCard, weight: 4 },
  ];

  static spawnCard(sizs: number): RougueCard[] {
    const deck: RougueCard[] = [];
    const pool = this.createWeightedPool();
    const guaranteedCards = [
      new BaseAttckCard(),
      new BaseSpecialAttackCard(),
      new BaseArmorCard(),
    ];
    deck.push(...guaranteedCards);
    for (let i = 0; i < sizs; i++) {
      const cardClass = this.getRandomCardClass(pool);
      deck.push(new cardClass());
    }

    return Random.shuffle(deck);
  }

  private static createWeightedPool(): (new () => RougueCard)[] {
    return this.cards.flatMap((card) => Array(card.weight).fill(card.class));
  }

  private static getRandomCardClass(
    pool: (new () => RougueCard)[]
  ): new () => RougueCard {
    return pool[Math.floor(Math.random() * pool.length)];
  }
}
