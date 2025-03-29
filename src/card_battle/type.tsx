import { Random } from "koishi";
import { PokemonPower, Skill } from "../battle";
import { PVP } from "../battle/pvp";
import { Pokebattle } from "../model";
import { getType } from "../utils/method";
import { battleType } from "../utils/data";
import { Robot } from "../utils/robot";

export enum CardRarity {
  Common,
  Uncommon,
  Rare,
}
export enum WildPokemonType {
  NormalWild = 2,
  UncommonPokemon = 3,
  Legendary = 4,
}

export type CardType =
  | "attack"
  | "specialattack"
  | "defense"
  | "skill"
  | "health"
  | "event"
  | "armorBreak";

export type StatusType = "poison" | "strength" | "weak";

export interface CardCharacter {
  name: string;
  maxHp: number;
  currentHp: number;
  armor: number;
  energy: number;
  maxEnergy: number;
  power: PokemonPower;
  pokemonCategory: string[];
  skill: Skill[];
}

export interface StatusEffect {
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
    public readonly rarity: CardRarity,
    public readonly cardCategory: string = "一般"
  ) {}
  abstract effect(user: CardCharacter, target?: CardCharacter): void | string;
  abstract restor(data: any): RougueCard;
}

//玩家角色

export class CardPlayer implements CardCharacter {
  currentHp: number;
  armor = 0;
  energy: number;
  currentHand: RougueCard[];

  constructor(
    players: Pokebattle,
    public readonly name: string = new PVP(players).name,
    public readonly maxHp: number = new PVP(players).maxHp,
    public readonly maxEnergy: number = Math.floor(
      new PVP(players).power.speed / 45
    ),
    public readonly power: PokemonPower = new PVP(players).power,
    public deck: RougueCard[] = CardPool.spawnCard(30, new PVP(players)),
    public discardPile: RougueCard[] = [],
    public skill: Skill[] = new PVP(players).skill,
    public pokemonCategory: string[] = getType(new PVP(players).monster_1)
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
    this.currentHand = hand;
    this.restor();
    return hand;
  }
  discardCard(): void {
    this.discardPile.push(...this.currentHand);
    this.currentHand = [];
    this.energy = this.maxEnergy;
  }
  restor() {
    this.currentHand = this.currentHand?.map((c) => {
      const CardCtor = CardClassMap[c.type];
      if (!CardCtor) {
        throw new Error(`未知卡牌类型: ${c.type}`);
      }
      return new CardCtor().restor(c);
    });
  }
}

//基础战斗卡
export class BaseAttckCard extends RougueCard {
  constructor() {
    super("攻击卡", "attack", "造成0.12*攻击力的伤害", 1, CardRarity.Common);
  }
  effect(user: CardCharacter, target?: CardCharacter): void | string {
    if (!target || this.cost > user.energy) return null;
    const damage = Math.floor(Math.max(user.power.attack * 0.12, 0));
    if (damage >= target.armor) {
      const realDamage = damage - target.armor;
      target.armor = 0;
      target.currentHp = Math.max(target.currentHp - realDamage, 0);
    } else {
      target.armor -= damage;
    }
    user.energy -= this.cost;
    return `${user.name}使用了[${this.name}],对${target.name}造成了${damage}点伤害`;
  }
  restor(data: any): BaseAttckCard {
    return Object.assign(new BaseAttckCard(), data);
  }
}

export class BaseSpecialAttackCard extends RougueCard {
  constructor() {
    super(
      "特殊攻击卡",
      "specialattack",
      "造成0.12*特攻的伤害",
      2,
      CardRarity.Common
    );
  }
  effect(user: CardCharacter, target?: CardCharacter): void | string {
    if (!target || this.cost > user.energy) return null;
    const damage = Math.floor(Math.max(user.power.specialAttack * 0.12, 0));
    if (damage >= target.armor) {
      const realDamage = damage - target.armor;
      target.armor = 0;
      target.currentHp = Math.max(target.currentHp - realDamage, 0);
    } else {
      target.armor -= damage;
    }
    user.energy -= this.cost;
    return `${user.name}使用了[${this.name}],对${target.name}造成了${damage}点伤害`;
  }
  restor(data: any): BaseSpecialAttackCard {
    return Object.assign(new BaseSpecialAttackCard(), data);
  }
}

export class BaseArmorCard extends RougueCard {
  constructor() {
    super("护甲卡", "defense", "获得一定量的护甲", 1, CardRarity.Common);
  }
  effect(user: CardCharacter, target: CardCharacter): void | string {
    user.armor += Math.floor(
      (0.3 * (user.power.defense + user.power.specialDefense)) / 4 +
        0.1 * user.power.speed
    );
    user.energy -= this.cost;
    return `${user.name}使用了[${this.name}],获得了${Math.floor(
      (0.3 * (user.power.defense + user.power.specialDefense)) / 4 +
        0.1 * user.power.speed
    )}点护甲`;
  }
  restor(data: any): BaseArmorCard {
    return Object.assign(new BaseArmorCard(), data);
  }
}

export class ArmorBreakCard extends RougueCard {
  constructor() {
    super("破甲卡", "armorBreak", "破除目标护甲", 3, CardRarity.Common);
  }
  effect(user: CardCharacter, target?: CardCharacter): void | string {
    if (!target || this.cost > user.energy) return null;
    target.armor = Math.floor(target.armor / 2);
    user.energy -= this.cost;
    return `${user.name}使用了[${this.name}],对${target.name}造成了破甲`;
  }
  restor(data: any): ArmorBreakCard {
    return Object.assign(new ArmorBreakCard(), data);
  }
}

//治疗道具卡
export enum HealItemType {
  potion = 1,
  SuperPotion = 2,
  HyperPotion = 3,
}

class HealCard extends RougueCard {
  constructor(potin?: HealItemType) {
    if (!potin) potin = HealItemType.potion;
    const potionList = {
      [HealItemType.potion]: {
        name: "伤药",
        cost: 1,
        description: "恢复少量的生命值",
      },
      [HealItemType.SuperPotion]: {
        name: "超级伤药",
        cost: 2,
        description: "恢复一定的生命值",
      },
      [HealItemType.HyperPotion]: {
        name: "高级伤药",
        cost: 3,
        description: "恢复大量的生命值",
      },
    };
    super(
      potionList[potin].name,
      "health",
      "恢复一定量的生命值",
      potionList[potin].cost,
      potionList[potin].cost
    );
  }
  effect(user: CardCharacter, target: CardCharacter): void | string {
    if (this.cost > user.energy) return null;
    user.currentHp = Math.min(
      user.currentHp + user.currentHp * this.cost * 0.1,
      user.maxHp
    );
    user.energy -= this.cost;
    return `${user.name}使用了[${this.name}],恢复了20点生命值`;
  }
  restor(data: any): HealCard {
    return Object.assign(new HealCard(1), data);
  }
}

//技能卡

export enum SkillCardType {
  attack = 1,
  defense = 2,
  specialAttack = 3,
  specialDefense = 4,
}

export class SkillCard extends RougueCard {
  damage: number;
  atttype: SkillCardType;
  constructor(skill?: Skill) {
    if (!skill) skill = new Skill(1);

    const rarity = skill.cd - 1;
    super(
      skill.name,
      "skill",
      `使用技能${skill.name}`,
      skill.cd,
      rarity,
      skill.type
    );
    this.atttype = skill.category;
    this.damage = skill.dam;
  }
  effect(user: CardCharacter, target: CardCharacter): void | string {
    if (!target || this.cost > user.energy) return null;
    const efct =
      battleType.data[this.cardCategory][target.pokemonCategory[0]] *
      battleType.data[this.cardCategory][target.pokemonCategory[1]] *
      (user.pokemonCategory.includes(this.cardCategory) ? 1.5 : 1);
    const userAttack = user.power[SkillCardType[this.atttype]];
    const targetDefense = target.power[SkillCardType[this.atttype + 1]];
    let damage = Math.floor(
      (((((2 * 100 + 10) / 250) * userAttack) / (1.2 * targetDefense)) *
        this.damage +
        2) *
        efct
    ); //计算伤害

    //
    if (damage >= target.armor) {
      const realDamage = damage - target.armor;
      target.armor = 0;
      target.currentHp = Math.max(target.currentHp - realDamage, 0);
    } else {
      target.armor -= damage;
    }
    user.energy -= this.cost;
    return `${user.name}使用了[${this.name}],造成${efct}倍伤害——${damage}，`;
  }
  restor(data: any): SkillCard {
    return Object.assign(new SkillCard(new Skill(1)), data);
  }
}

//效果卡

export class EventCard extends RougueCard {
  constructor() {
    super("效果卡", "event", "触发某个效果", 1, CardRarity.Common);
  }
  effect(user: CardCharacter, target: CardCharacter): void | string {
    return `${user.name}使用了[${this.name}]`;
  }
  restor(data: any): EventCard {
    return Object.assign(new EventCard(), data);
  }
}

//卡组池
export class CardPool {
  private static cards: {
    class: any;
    weight: number;
    args?: any;
  }[] = [
    { class: BaseAttckCard, weight: 8 },
    { class: BaseSpecialAttackCard, weight: 8 },
    { class: BaseArmorCard, weight: 4 },
    { class: EventCard, weight: 4 },
  ];

  static spawnCard(
    sizs: number,
    character: PVP,
    isplayer?: boolean
  ): RougueCard[] {
    this.cards.push(
      {
        class: SkillCard,
        weight: 5 - character.skill[0].cd,
        args: character.skill[0],
      },
      {
        class: SkillCard,
        weight: 5 - character.skill[1].cd,
        args: character.skill[1],
      },
      {
        class: SkillCard,
        weight: 5 - character.skill[2].cd,
        args: character.skill[2],
      },
      {
        class: SkillCard,
        weight: 5 - character.skill[3].cd,
        args: character.skill[3],
      }
    );
    if (isplayer) {
      this.cards = this.cards.concat(
        character.itemBag?.map((item) => {
          return {
            class: HealCard,
            weight: 5 - item,
            args: item,
          };
        }) || []
      );
    }
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
      deck.push(new cardClass.class(cardClass?.args));
    }

    return Random.shuffle(deck);
  }

  private static createWeightedPool(): {
    class: new (...args: any[]) => RougueCard;
    args?: any;
  }[] {
    return this.cards.flatMap((card) =>
      Array(card.weight).fill({ class: card.class, args: card.args })
    );
  }

  private static getRandomCardClass(
    pool: { class: new (args: any) => RougueCard; args?: any }[]
  ) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
}

//战斗上下文
export interface CombatContext {
  player: CardCharacter;
  self: CardCharacter;
  currentEnergy: number;
  turnCount: number;
}

export interface AIStrategy {
  selectCard(hand: RougueCard[], context: CombatContext): RougueCard | null;
}

export class EnemyAI implements AIStrategy {
  private memory = {
    playerArmorHistory: [] as number[],
  };

  selectCard(hand: RougueCard[], context: CombatContext): RougueCard | null {
    this.memory.playerArmorHistory.push(context.player.armor);
    const armorTrend = this.calculateArmorTrend();
    const validCards = hand.filter((c) => c.cost <= context.currentEnergy);
    if (validCards.length === 0) return null;
    const attackCard = validCards.filter((c) => c.type === "attack");
    const specialAttackCard = validCards.filter(
      (c) => c.type === "specialattack"
    );
    const armorCard = validCards.filter((c) => c.type === "defense");
    const armorBreakCard = validCards.filter((c) => c.type === "armorBreak");
    const skillCard = validCards.filter(
      (c) =>
        c.type === "skill" &&
        context.self.pokemonCategory.includes(c.cardCategory)
    );
    if (armorTrend > 0) {
      return armorBreakCard.reduce(
        (maxCard, currCard) =>
          currCard.cost > maxCard.cost ? currCard : maxCard,
        hand[0]
      );
    }
    if (armorCard.length != 0) {
      return armorCard.reduce(
        (maxCard, currCard) =>
          currCard.cost > maxCard.cost ? currCard : maxCard,
        hand[0]
      );
    }
    const categoryEffect: number = this.calculateCategory(context);
    if (categoryEffect >= 1) {
      return skillCard.reduce(
        (maxCard, currCard) =>
          currCard.cost > maxCard.cost ? currCard : maxCard,
        hand[0]
      );
    }
    if (attackCard.length != 0) {
      return context.self.power.attack > context.self.power.specialAttack
        ? attackCard.reduce(
            (maxCard, currCard) =>
              currCard.cost > maxCard.cost ? currCard : maxCard,
            hand[0]
          )
        : specialAttackCard.reduce(
            (maxCard, currCard) =>
              currCard.cost > maxCard.cost ? currCard : maxCard,
            hand[0]
          );
    }
    return validCards.reduce(
      (maxCard, currCard) =>
        currCard.cost > maxCard.cost ? currCard : maxCard,
      hand[0]
    );
  }
  private calculateArmorTrend(): number {
    // 计算护甲变化趋势
    return this.memory.playerArmorHistory
      .slice(-3)
      .reduce((sum, curr, i, arr) => sum + (curr - (arr[i - 1] || 0)), 0);
  }
  private calculateCategory(context: CombatContext): number {
    const self = context.self;
    const player = context.player;
    return (
      battleType.data[self.pokemonCategory[0]][player.pokemonCategory[0]] *
      battleType.data[self.pokemonCategory[0]][player.pokemonCategory[1]] *
      battleType.data[self.pokemonCategory[1]][player.pokemonCategory[1]] *
      battleType.data[self.pokemonCategory[1]][player.pokemonCategory[0]]
    );
  }
  restor(data: any): EnemyAI {
    return Object.assign(new EnemyAI(), data);
  }
}

//敌人类
export class Enemy implements CardCharacter {
  currentHp: number;
  armor = 0;
  energy: number;
  enymyType: WildPokemonType;
  aiStrategy: EnemyAI = new EnemyAI();
  currentHand: RougueCard[];
  constructor(
    wildPokemon: Pokebattle,
    public readonly name: string = new PVP(wildPokemon).name,
    public readonly maxHp: number = new PVP(wildPokemon).maxHp,
    public readonly maxEnergy: number = Math.floor(
      new PVP(wildPokemon).power.speed / 45
    ),
    public readonly power: PokemonPower = new PVP(wildPokemon).power,
    public deck: RougueCard[] = CardPool.spawnCard(30, new PVP(wildPokemon)),
    public discardPile: RougueCard[] = [],
    public skill: Skill[] = new PVP(wildPokemon).skill,
    public pokemonCategory: string[] = getType(new PVP(wildPokemon).monster_1)
  ) {
    const powerSum = wildPokemon.power.reduce(
      (sum, curr) => sum + Number(curr),
      0
    );
    if (powerSum > 1200) this.enymyType = WildPokemonType.Legendary;
    else if (powerSum > 800) this.enymyType = WildPokemonType.UncommonPokemon;
    else this.enymyType = WildPokemonType.NormalWild;
    maxHp = Math.floor(this.enymyType * this.power.hp); //敌对角色血量补正
    this.currentHp = maxHp;
    this.energy = maxEnergy;
  }
  drawHand(size: number): RougueCard[] {
    if (this.deck.length < size) {
      this.deck = Random.shuffle(this.discardPile);
    }
    const hand = this.deck.splice(0, size);
    this.discardPile.push(...hand);
    this.currentHand = hand;
    return hand;
  }
  discardCard(): void {
    this.discardPile.push(...this.currentHand);
    this.currentHand = [];
    this.energy = this.maxEnergy;
  }
  act(context: CombatContext): string | void {
    context.currentEnergy = this.energy;
    const selectedCard = this.aiStrategy.selectCard(this.currentHand, context);
    if (selectedCard) {
      context.currentEnergy -= selectedCard.cost;
      const enemyLog = selectedCard.effect(this, context.player);
      this.currentHand = this.currentHand.filter((c) => c !== selectedCard);
      context.self = this;
      context.player = context.player;
      return enemyLog;
    }
    return null;
  }
  restor() {
    this.aiStrategy = new EnemyAI().restor(this.aiStrategy);
    this.deck = this.deck?.map((c) => {
      const CardCtor = CardClassMap[c.type];
      if (!CardCtor) {
        throw new Error(`未知卡牌类型: ${c.type}`);
      }
      return new CardCtor().restor(c);
    });
  }
}

export const CardClassMap: Record<CardType, new () => RougueCard> = {
  attack: BaseAttckCard,
  specialattack: BaseSpecialAttackCard,
  defense: BaseArmorCard,
  armorBreak: ArmorBreakCard,
  event: EventCard,
  health: HealCard,
  skill: SkillCard,
};
