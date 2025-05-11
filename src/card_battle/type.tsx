import { Context, Element, Random } from "koishi";
import { PokemonPower, Skill } from "../battle";
import { PVP } from "../battle/pvp";
import { Pokebattle } from "../model";
import { getType } from "../utils/method";
import { battleType } from "../utils/data";
import {} from "koishi-plugin-canvas";
import { dirname } from "../dirname";
import { testcanvas } from "..";
import { resolve } from "path";
import {
  PoisonStatusHandler,
  StatusEffectMap,
  StatusSystem,
  statusSystems,
} from "./status";
import { BuffConfig, BuffFactory, BuffManagerSystem } from "./buff";
import { RouteNodeType } from "./route";
import pokemonCal from "../utils/pokemon";

const cardFaceDir = () =>
  `${testcanvas}${resolve(dirname, `./assets/img/card`, `cardface.png`)}`;

export enum CardRarity {
  Common,
  Uncommon,
  Rare,
  Epic,
  Legendary,
}

const cardColor = {
  [CardRarity.Common]: "#afafaf",
  [CardRarity.Uncommon]: "#00CC44",
  [CardRarity.Rare]: "#9932CC",
  [CardRarity.Epic]: "rgb(255, 220, 67)",
  [CardRarity.Legendary]: "rgb(255, 89, 23)",
};

export enum WildPokemonType {
  NormalWild = 3,
  UncommonPokemon = 4,
  Legendary = 5,
}

export type CardType =
  | "attack"
  | "specialattack"
  | "defense"
  | "skill"
  | "poison"
  | "health"
  | "bossTicket"
  | "armorBreak"
  | "numb";

export type StatusType = "poison" | "numb" | "burn" | "confusion";

export interface CardCharacter {
  name: string;
  level: number;
  maxHp: number;
  currentHp: number;
  armor: number;
  currentHand: RougueCard[];
  energy: number;
  maxEnergy: number;
  power: PokemonPower;
  pokemonCategory: string[];
  skill: Skill[];
  statusEffects: StatusEffectMap;
  bonus?: {
    energy: number;
    damage: number;
    Hp: number;
    handsize: number;
    category: string[];
  };
  addStatusEffect(type: StatusType, stacks: number): string;
  processTurnStart(): string;
  processTurnEnd(): string;
  takeDamage(damage: number, source?: CardCharacter): void;
}

export interface CardItem {
  type: CardType;
  name: "伤药" | "毒药" | "首领券";
  level: number;
}

export interface StatusEffect {
  type: StatusType;
  stacks: number;
  duration: number;
  originAttack?: number;
  originSpecialAttack?: number;
  originSpeed?: number;
  originEnergy?: number;
}

export abstract class RougueCard {
  constructor(
    public readonly name: string,
    public readonly type: CardType,
    public readonly description: string,
    public readonly cost: number,
    public readonly rarity: CardRarity,
    public cardCategory: string = "一般"
  ) {}
  abstract effect(user: CardCharacter, target?: CardCharacter): void | string;
  abstract restor(data: any): RougueCard;
  abstract drawCard(ctx: Context): Promise<Element>;
}

//玩家角色

export class CardPlayer implements CardCharacter {
  aiboName: string;
  currentHp: number;
  armor = 0;
  energy: number;
  configTimes = 0;
  bonus: {
    energy: number;
    damage: number;
    Hp: number;
    handsize: number;
    category: string[];
  };
  currentHand: RougueCard[];
  statusEffects = new StatusEffectMap(this);
  activeBuffs = new BuffManagerSystem();
  rewardBuffs = new BuffManagerSystem();

  constructor(
    players: Pokebattle,
    public name: string = new PVP(players).name,
    public level: number = players.level,
    public maxHp: number = new PVP(players).maxHp,
    public maxEnergy: number = Math.max(
      Math.floor(new PVP(players).power.speed / 45),
      1
    ),
    public power: PokemonPower = new PVP(players).power,
    public deck: RougueCard[] = CardPool.spawnCard(30, new PVP(players), true),
    public discardPile: RougueCard[] = [],
    public skill: Skill[] = new PVP(players).skill,
    public pokemonCategory: string[] = getType(new PVP(players).monster_1) // private statusSystem: StatusSystem = statusSystems
  ) {
    this.aiboName = pokemonCal.pokemonlist(new PVP(players).monster_1);
    this.currentHp = maxHp;
    this.energy = maxEnergy;
    this.bonus = {
      energy: 0,
      damage: 0,
      Hp: 0,
      handsize: 0,
      category: this.pokemonCategory,
    };
  }

  useCard(context: CombatContext, c: string, tar?: CardCharacter) {
    const isNumber = /^\d+$/.test(c);
    let card: RougueCard | undefined;
    if (isNumber) {
      const idx = Number(c) - 1;
      if (idx < 0 || idx >= this.currentHand.length) return null;
      card = this.currentHand[idx];
    } else {
      card = this.currentHand.find((card) => card.name === c);
    }
    if (!card) return null;
    let playerLog = "";
    this.statusEffects.forEach((effect) => {
      const handler = statusSystems.getHandler(effect.type);
      const slogs = handler?.onUseCard(this, context);
      if (slogs) {
        playerLog = slogs + (playerLog == "" ? "" : "\n") + playerLog;
      }
    });
    const useCardLog = card.effect(this, tar);
    if (!useCardLog) {
      playerLog = "能量不足" + (playerLog == "" ? "" : "\n") + playerLog;
      context.logs = [playerLog as string, ...context.logs];
      return playerLog;
    }
    playerLog = useCardLog + (playerLog == "" ? "" : "\n") + playerLog;
    context.logs = [playerLog as string, ...context.logs];

    this.currentHand = this.currentHand.filter((c) => c !== card);
    return playerLog;
  }

  takeDamage(damage: number): void {
    damage = damage ? damage : 0;
    this.currentHp = Math.max(this.currentHp - damage, 0);
    this.statusEffects.forEach((effect) => {
      if (statusSystems.getHandler(effect.type)?.onReceiveDamage) {
        statusSystems.getHandler(effect.type)?.onReceiveDamage(this);
      }
    });
  }

  reconfig(players: Pokebattle, bP = new PVP(players)) {
    if (this.configTimes <= 0)
      return `当前未知迷雾太过浓重,无法更换宝可梦和技能`;
    this.name = bP.name;
    this.maxHp = bP.maxHp;
    this.maxEnergy = Math.max(Math.floor(bP.power.speed / 45), 1);
    this.power = bP.power;
    this.deck = CardPool.spawnCard(30, bP, true);
    this.discardPile = [];
    this.skill = bP.skill;
    this.pokemonCategory = getType(bP.monster_1);
    this.currentHp = this.maxHp;
    this.energy = this.maxEnergy;
    this.bonus.category = this.pokemonCategory;
    this.rewardBuffs.forEach((buff) => {
      buff?.reconfig(this);
    });
    this.activeBuffs.forEach((buff) => {
      buff?.reconfig(this);
    });
    return `你使用了篝火处点燃的火把驱散了周围的迷雾,换上了${pokemonCal.pokemonlist(
      bP.monster_1
    )}以及技能`;
  }

  relax() {
    this.currentHp = this.maxHp + this.bonus.Hp;
  }
  refresh() {
    this.armor = 0;
    this.currentHand = [];
    this.statusEffects.clear(this);
    this.energy = this.maxEnergy + this.bonus.energy;
  }
  drawHand(size: number): RougueCard[] {
    size = size + this.bonus.handsize;
    if (this.deck.length < size) {
      this.deck = Random.shuffle([...this.deck, ...this.discardPile]);
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
    this.energy = this.maxEnergy + this.bonus.energy;
    this.drawHand(5);
  }
  addStatusEffect(type: StatusType, stacks: number) {
    return statusSystems.getHandler(type)?.applyEffect(this, stacks);
  }

  processTurnStart() {
    let statusLog: string[] = [];
    for (const [type] of this.statusEffects.entries()) {
      const result = statusSystems.getHandler(type)?.processTurnStart(this);
      if (result) statusLog = [result, ...statusLog];
    }

    return statusLog.join("\n");
  }

  processTurnEnd() {
    let statusLog: string[] = [];
    for (const [type] of this.statusEffects.entries()) {
      const result = statusSystems.getHandler(type)?.processTurnEnd(this);
      if (result) statusLog = [result, ...statusLog];
    }

    return statusLog.join("\n");
  }
  addBuff(buff: BuffConfig, isReward = false): string {
    // 探索事件 true，怪物战斗奖励 false
    const buffList: BuffManagerSystem = isReward
      ? this.rewardBuffs
      : this.activeBuffs;
    const existing = buffList.get(buff.id);
    if (existing) {
      return existing.levelUp(this) ?? "";
    }
    buffList.set(buff.id, buff);
    return buffList.get(buff.id)?.applyBuff(this, isReward) ?? "";
  }
  removeBuff(buff: BuffConfig): string {
    const buffList = this.activeBuffs.get(buff.id);
    if (buffList) {
      buffList.removeBuff(this);
      this.activeBuffs.delete(buff.id);
      return `${this.name}失去了${buff.name}的效果`;
    }
    return `${this.name}没有${buff.name}的效果`;
  }
  restor() {
    this.statusEffects = new StatusEffectMap(this, this.statusEffects);
    this.activeBuffs = new BuffManagerSystem(this.activeBuffs);
    this.rewardBuffs = new BuffManagerSystem(this.rewardBuffs);
    this.currentHand = this.currentHand?.map((c) => {
      const CardCtor = CardClassMap[c.type];
      if (!CardCtor) {
        throw new Error(`未知卡牌类型: ${c.type}`);
      }
      return new CardCtor().restor(c);
    });
  }
}

//卡面缓存变量

let drawCardCache: Map<string, Promise<Element>> = new Map();

//基础战斗卡
export class BaseAttckCard extends RougueCard {
  constructor() {
    super("攻击卡", "attack", "造成0.12*攻击的伤害", 1, CardRarity.Common);
  }
  effect(user: CardCharacter, target?: CardCharacter): void | string {
    if (!target || this.cost > user.energy) return null;
    const efct =
      battleType.data[this.cardCategory][target.pokemonCategory[0]] *
      battleType.data[this.cardCategory][target.pokemonCategory[1]] *
      (user.pokemonCategory.includes(this.cardCategory) ? 1.5 : 1);
    const damage = Math.floor(Math.max(user.power.attack * 0.12, 0) * efct);
    if (damage >= target.armor) {
      const realDamage = damage - target.armor;
      target.armor = 0;
      target.takeDamage(realDamage);
    } else {
      target.armor -= damage;
    }
    user.energy -= this.cost;
    return `${user.name}使用了[${this.name}],对${target.name}造成了${damage}点伤害`;
  }
  restor(data: any): BaseAttckCard {
    return Object.assign(new BaseAttckCard(), data);
  }
  async drawCard(ctx: Context): Promise<any> {
    let picCard = drawCardCache.get(this.name);
    if (picCard) return picCard;
    picCard = (async () => {
      const icondir = typeDirname(this.cardCategory);
      const icon = await ctx.canvas.loadImage(icondir);
      const cardFace = await ctx.canvas.loadImage(cardFaceDir());
      const attackIcon = await ctx.canvas.loadImage(
        `${testcanvas}${resolve(
          dirname,
          `./assets/img/card`,
          `${this.type}.png`
        )}`
      );
      return ctx.canvas.render(445, 670, (c) => {
        c.fillStyle = cardColor[this.rarity];
        c.fillRect(0, 0, 445, 670);
        c.drawImage(cardFace, 10, 10, 425, 650);
        c.drawImage(attackIcon, 222 - 125, 125, 250, 250);
        c.drawImage(icon, 45, 545, 80, 80);
        c.font = "bold 30px";
        c.fillStyle = "#000000";
        c.textAlign = "center";
        c.textBaseline = "middle";
        wrapText(c, this.description, 220, 480, 300, 30);
        wrapText(c, this.name, 220, 415, 300, 30);
        c.font = "bold 80px";
        c.fillStyle = "#ab8818";
        c.fillText(this.cost.toString(), 360, 585);
      });
    })();
    drawCardCache.set(this.name, picCard);
    return picCard;
  }
}

export class BaseSpecialAttackCard extends RougueCard {
  constructor() {
    super(
      "特殊攻击卡",
      "specialattack",
      "造成0.12*特攻的伤害",
      1,
      CardRarity.Common
    );
  }
  effect(user: CardCharacter, target?: CardCharacter): void | string {
    if (!target || this.cost > user.energy) return null;
    const efct =
      battleType.data[this.cardCategory][target.pokemonCategory[0]] *
      battleType.data[this.cardCategory][target.pokemonCategory[1]] *
      (user.pokemonCategory.includes(this.cardCategory) ? 1.5 : 1);
    const damage = Math.floor(
      Math.max(user.power.specialAttack * 0.12, 0) * efct
    );
    if (damage >= target.armor) {
      const realDamage = damage - target.armor;
      target.armor = 0;
      target.takeDamage(realDamage);
    } else {
      target.armor -= damage;
    }
    user.energy -= this.cost;
    return `${user.name}使用了[${this.name}],对${target.name}造成了${damage}点伤害`;
  }
  restor(data: any): BaseSpecialAttackCard {
    return Object.assign(new BaseSpecialAttackCard(), data);
  }
  async drawCard(ctx: Context): Promise<any> {
    let picCard = drawCardCache.get(this.name);
    if (picCard) return picCard;
    picCard = (async () => {
      const icondir = typeDirname(this.cardCategory);
      const icon = await ctx.canvas.loadImage(icondir);
      const cardFace = await ctx.canvas.loadImage(cardFaceDir());
      const attackIcon = await ctx.canvas.loadImage(
        `${testcanvas}${resolve(
          dirname,
          `./assets/img/card`,
          `${this.type}.png`
        )}`
      );
      return ctx.canvas.render(445, 670, (c) => {
        c.fillStyle = cardColor[this.rarity];
        c.fillRect(0, 0, 445, 670);
        c.drawImage(cardFace, 10, 10, 425, 650);
        c.drawImage(attackIcon, 222 - 125, 125, 250, 250);
        c.drawImage(icon, 45, 545, 80, 80);
        c.font = "bold 30px";
        c.fillStyle = "#000000";
        c.textAlign = "center";
        c.textBaseline = "middle";
        wrapText(c, this.description, 220, 480, 300, 30);
        wrapText(c, this.name, 220, 415, 300, 30);
        c.font = "bold 80px";
        c.fillStyle = "#ab8818";
        c.fillText(this.cost.toString(), 360, 585);
      });
    })();
    drawCardCache.set(this.name, picCard);
    return picCard;
  }
}

export class BaseArmorCard extends RougueCard {
  constructor() {
    super("护甲卡", "defense", "获得一定量的护甲", 3, CardRarity.Common);
  }
  effect(user: CardCharacter, target: CardCharacter): void | string {
    if (!target || this.cost > user.energy) return null;
    const armors = Math.floor(
      (0.3 * (user.power.defense + user.power.specialDefense)) / 4 +
        0.1 * user.power.speed
    );
    user.armor += armors ? armors : 0;
    user.energy -= this.cost;
    return `${user.name}使用了[${this.name}],获得了${Math.floor(
      (0.3 * (user.power.defense + user.power.specialDefense)) / 4 +
        0.1 * user.power.speed
    )}点护甲`;
  }
  restor(data: any): BaseArmorCard {
    return Object.assign(new BaseArmorCard(), data);
  }
  async drawCard(ctx: Context): Promise<any> {
    let picCard = drawCardCache.get(this.name);
    if (picCard) return picCard;
    picCard = (async () => {
      const icondir = typeDirname(this.cardCategory);
      const icon = await ctx.canvas.loadImage(icondir);
      const cardFace = await ctx.canvas.loadImage(cardFaceDir());
      const attackIcon = await ctx.canvas.loadImage(
        `${testcanvas}${resolve(
          dirname,
          `./assets/img/card`,
          `${this.type}.png`
        )}`
      );
      return ctx.canvas.render(445, 670, (c) => {
        c.fillStyle = cardColor[this.rarity];
        c.fillRect(0, 0, 445, 670);
        c.drawImage(cardFace, 10, 10, 425, 650);
        c.drawImage(attackIcon, 222 - 125, 125, 250, 250);
        c.drawImage(icon, 45, 545, 80, 80);
        c.font = "bold 30px";
        c.fillStyle = "#000000";
        c.textAlign = "center";
        c.textBaseline = "middle";
        wrapText(c, this.description, 220, 480, 300, 30);
        wrapText(c, this.name, 220, 415, 300, 30);
        c.font = "bold 80px";
        c.fillStyle = "#ab8818";
        c.fillText(this.cost.toString(), 360, 585);
      });
    })();
    drawCardCache.set(this.name, picCard);
    return picCard;
  }
}

export class ArmorBreakCard extends RougueCard {
  constructor() {
    super(
      "破甲卡",
      "armorBreak",
      "造成伤害破除目标一半护甲,并生成护甲",
      3,
      CardRarity.Epic
    );
  }
  effect(user: CardCharacter, target?: CardCharacter): void | string {
    if (!target || this.cost > user.energy) return null;
    target.armor = Math.floor(target.armor / 2);
    const damage = Math.floor(
      ((user.power.defense + user.power.specialDefense) / 2) * 0.15
    );
    target.takeDamage(damage);
    user.armor += Math.floor(damage / 2);
    user.energy -= this.cost;
    return `${user.name}使用了[${this.name}],对${
      target.name
    }造成了破甲,造成${damage}伤害,并获得${Math.floor(damage / 2)}护甲`;
  }
  restor(data: any): ArmorBreakCard {
    return Object.assign(new ArmorBreakCard(), data);
  }
  async drawCard(ctx: Context): Promise<any> {
    let picCard = drawCardCache.get(this.name);
    if (picCard) return picCard;
    picCard = (async () => {
      const icondir = typeDirname(this.cardCategory);
      const icon = await ctx.canvas.loadImage(icondir);
      const cardFace = await ctx.canvas.loadImage(cardFaceDir());
      const attackIcon = await ctx.canvas.loadImage(
        `${testcanvas}${resolve(
          dirname,
          `./assets/img/card`,
          `${this.type}.png`
        )}`
      );
      return ctx.canvas.render(445, 670, (c) => {
        c.fillStyle = cardColor[this.rarity];
        c.fillRect(0, 0, 445, 670);
        c.drawImage(cardFace, 10, 10, 425, 650);
        c.drawImage(attackIcon, 222 - 125, 125, 250, 250);
        c.drawImage(icon, 45, 545, 80, 80);
        c.font = "bold 30px";
        c.fillStyle = "#000000";
        c.textAlign = "center";
        c.textBaseline = "middle";
        wrapText(c, this.description, 220, 480, 300, 30);
        wrapText(c, this.name, 220, 415, 300, 30);
        c.font = "bold 80px";
        c.fillStyle = "#ab8818";
        c.fillText(this.cost.toString(), 360, 585);
      });
    })();
    drawCardCache.set(this.name, picCard);
    return picCard;
  }
}

//治疗道具卡
export enum HealItemType {
  potion = 1,
  SuperPotion = 2,
  HyperPotion = 3,
}

export enum PoisonCardType {
  poison = 1,
  SuperPoison = 2,
  HyperPoison = 3,
}

export class PoisonCard extends RougueCard {
  constructor(poison?: PoisonCardType) {
    if (!poison) poison = PoisonCardType.poison;
    const poisonList = {
      [PoisonCardType.poison]: {
        name: "毒药",
        cost: 1,
        description: "使目标中毒1层",
      },
      [PoisonCardType.SuperPoison]: {
        name: "好毒药",
        cost: 2,
        description: "使目标中毒2层",
      },
      [PoisonCardType.HyperPoison]: {
        name: "厉害毒药",
        cost: 3,
        description: "使目标中毒3层",
      },
    };
    super(
      poisonList[poison].name,
      "poison",
      poisonList[poison].description,
      poisonList[poison].cost,
      poisonList[poison].cost - 1,
      "毒"
    );
  }
  effect(user: CardCharacter, target: CardCharacter): void | string {
    if (this.cost > user.energy) return null;
    let statusLog = `,${target.name}中毒了`;

    statusLog = target.addStatusEffect("poison", this.cost);

    user.energy -= this.cost;

    return `${user.name}使用了[${this.name}]${statusLog}`;
  }
  restor(data: any): PoisonCard {
    return Object.assign(new PoisonCard(1), data);
  }
  async drawCard(ctx: Context): Promise<any> {
    let picCard = drawCardCache.get(this.name);
    if (picCard) return picCard;
    picCard = (async () => {
      const icondir = typeDirname(this.cardCategory);
      const icon = await ctx.canvas.loadImage(icondir);
      const cardFace = await ctx.canvas.loadImage(cardFaceDir());
      const attackIcon = await ctx.canvas.loadImage(
        `${testcanvas}${resolve(
          dirname,
          `./assets/img/card`,
          `${this.type}.png`
        )}`
      );
      return ctx.canvas.render(445, 670, (c) => {
        c.fillStyle = cardColor[this.rarity];
        c.fillRect(0, 0, 445, 670);
        c.drawImage(cardFace, 10, 10, 425, 650);
        c.drawImage(attackIcon, 222 - 125, 125, 250, 250);
        c.drawImage(icon, 45, 545, 80, 80);
        c.font = "bold 30px";
        c.fillStyle = "#000000";
        c.textAlign = "center";
        c.textBaseline = "middle";
        wrapText(c, this.description, 220, 480, 300, 30);
        wrapText(c, this.name, 220, 415, 300, 30);
        c.font = "bold 80px";
        c.fillStyle = "#ab8818";
        c.fillText(this.cost.toString(), 360, 585);
      });
    })();
    drawCardCache.set(this.name, picCard);
    return picCard;
  }
}

export class NumbCard extends RougueCard {
  constructor() {
    super(
      "麻痹卡",
      "numb",
      "使对手麻痹,降低一半速度,并减少2点能量",
      3,
      CardRarity.Epic
    );
  }
  restor(data: any): RougueCard {
    return Object.assign(new NumbCard(), data);
  }
  effect(user: CardCharacter, target?: CardCharacter): void | string {
    if (this.cost > user.energy) return null;
    let statusLog = `,${target.name}麻痹了`;

    statusLog = target.addStatusEffect("numb", this.cost);

    user.energy -= this.cost;

    return `${user.name}使用了[${this.name}]${statusLog}`;
  }
  drawCard(ctx: Context): Promise<Element> {
    let picCard = drawCardCache.get(this.name);
    if (picCard) return picCard;
    picCard = (async () => {
      const icondir = typeDirname(this.cardCategory);
      const icon = await ctx.canvas.loadImage(icondir);
      const cardFace = await ctx.canvas.loadImage(cardFaceDir());
      const attackIcon = await ctx.canvas.loadImage(
        `${testcanvas}${resolve(
          dirname,
          `./assets/img/card`,
          `${this.type}.png`
        )}`
      );
      return ctx.canvas.render(445, 670, (c) => {
        c.fillStyle = cardColor[this.rarity];
        c.fillRect(0, 0, 445, 670);
        c.drawImage(cardFace, 10, 10, 425, 650);
        c.drawImage(attackIcon, 222 - 125, 125, 250, 250);
        c.drawImage(icon, 45, 545, 80, 80);
        c.font = "bold 30px";
        c.fillStyle = "#000000";
        c.textAlign = "center";
        c.textBaseline = "middle";
        wrapText(c, this.description, 220, 480, 300, 30);
        wrapText(c, this.name, 220, 415, 300, 30);
        c.font = "bold 80px";
        c.fillStyle = "#ab8818";
        c.fillText(this.cost.toString(), 360, 585);
      });
    })();
    drawCardCache.set(this.name, picCard);
    return picCard;
  }
}

export class HealCard extends RougueCard {
  constructor(potin?: HealItemType) {
    if (!potin) potin = HealItemType.potion;
    const potionList = {
      [HealItemType.potion]: {
        name: "伤药",
        cost: 1,
        description: "恢复少量的生命值",
      },
      [HealItemType.SuperPotion]: {
        name: "好伤药",
        cost: 2,
        description: "恢复一定的生命值",
      },
      [HealItemType.HyperPotion]: {
        name: "厉害伤药",
        cost: 3,
        description: "恢复大量的生命值",
      },
    };
    super(
      potionList[potin].name,
      "health",
      potionList[potin].description,
      potionList[potin].cost,
      potionList[potin].cost - 1
    );
  }
  effect(user: CardCharacter, target: CardCharacter): void | string {
    if (this.cost > user.energy) return null;
    user.currentHp = Math.floor(
      Math.min(
        user.currentHp + (user.maxHp + user.bonus.Hp) * this.cost * 0.1,
        user.maxHp + user.bonus.Hp
      )
    );
    user.energy -= this.cost;
    return `${user.name}使用了[${this.name}],恢复了${this.cost * 10}%生命值`;
  }
  restor(data: any): HealCard {
    return Object.assign(new HealCard(1), data);
  }
  async drawCard(ctx: Context): Promise<any> {
    let picCard = drawCardCache.get(this.name);
    if (picCard) return picCard;
    picCard = (async () => {
      const icondir = typeDirname(this.cardCategory);
      const icon = await ctx.canvas.loadImage(icondir);
      const cardFace = await ctx.canvas.loadImage(cardFaceDir());
      const attackIcon = await ctx.canvas.loadImage(
        `${testcanvas}${resolve(
          dirname,
          `./assets/img/card`,
          `${this.type}.png`
        )}`
      );
      return ctx.canvas.render(445, 670, (c) => {
        c.fillStyle = cardColor[this.rarity];
        c.fillRect(0, 0, 445, 670);
        c.drawImage(cardFace, 10, 10, 425, 650);
        c.drawImage(attackIcon, 222 - 125, 125, 250, 250);
        c.drawImage(icon, 45, 545, 80, 80);
        c.font = "bold 30px";
        c.fillStyle = "#000000";
        c.textAlign = "center";
        c.textBaseline = "middle";
        wrapText(c, this.description, 220, 480, 300, 30);
        wrapText(c, this.name, 220, 415, 300, 30);
        c.font = "bold 80px";
        c.fillStyle = "#ab8818";
        c.fillText(this.cost.toString(), 360, 585);
      });
    })();
    drawCardCache.set(this.name, picCard);
    return picCard;
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
  status?: {
    status: StatusType[];
    probability: number;
  };
  constructor(skill?: Skill) {
    if (!skill) skill = new Skill(1);

    const rarity = skill.cd;
    super(
      skill.name,
      "skill",
      `使用技能卡\n[${skill.name}]`,
      skill.cd,
      rarity,
      skill.type
    );
    this.atttype = skill.category;
    this.damage = skill.dam;
    if (skill?.status) {
      this.status = skill.status;
    }
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
      target.takeDamage(realDamage);
    } else {
      target.armor -= damage;
    }
    let statusLog = ``;
    if (this?.status) {
      const isStatus = Random.bool(this.status.probability);
      if (isStatus) {
        const random = Math.floor(Math.random() * this.status.status.length);
        statusLog = target.addStatusEffect(this.status.status[random], 1);
      }
    }
    user.energy -= this.cost;
    return `${user.name}使用了[${this.name}],造成${efct}倍伤害——${damage}${statusLog}`;
  }
  restor(data: any): SkillCard {
    return Object.assign(new SkillCard(new Skill(1)), data);
  }
  async drawCard(ctx: Context): Promise<any> {
    let picCard = drawCardCache.get(this.name);
    if (picCard) return picCard;
    picCard = (async () => {
      const icondir = typeDirname(this.cardCategory);
      const icon = await ctx.canvas.loadImage(icondir);
      const cardFace = await ctx.canvas.loadImage(cardFaceDir());
      const swardIcon = await ctx.canvas.loadImage(
        `${testcanvas}${resolve(dirname, `./assets/img/card`, `sword.png`)}`
      );
      return ctx.canvas.render(445, 670, (c) => {
        c.fillStyle = cardColor[this.rarity];
        c.fillRect(0, 0, 445, 670);
        c.drawImage(cardFace, 10, 10, 425, 650);
        c.globalAlpha = 0.3;
        c.drawImage(icon, 85, 125, 250, 250);
        c.globalAlpha = 1;
        c.drawImage(swardIcon, 85, 125, 250, 250);
        c.drawImage(icon, 45, 545, 80, 80);
        c.font = "bold 30px";
        c.fillStyle = "#000000";
        c.textAlign = "center";
        c.textBaseline = "middle";
        wrapText(c, this.description, 220, 480, 300, 30);
        wrapText(c, this.name, 220, 415, 300, 30);
        c.font = "bold 80px";
        c.fillStyle = "#ab8818";
        c.fillText(this.cost.toString(), 360, 585);
      });
    })();
    drawCardCache.set(this.name, picCard);
    return picCard;
  }
}

//效果卡

// export class EventCard extends RougueCard {
//   constructor() {
//     super("效果卡", "event", "触发某个效果", 1, CardRarity.Common);
//   }
//   effect(user: CardCharacter, target: CardCharacter): void | string {
//     return `${user.name}使用了[${this.name}]`;
//   }
//   restor(data: any): EventCard {
//     return Object.assign(new EventCard(), data);
//   }
//   async drawCard(ctx: Context): Promise<any> {
//     const icondir = typeDirname(this.cardCategory);
//     const icon = await ctx.canvas.loadImage(icondir);
//     const cardFace = await ctx.canvas.loadImage(cardFaceDir());
//     const attackIcon = await ctx.canvas.loadImage(
//       `${testcanvas}${resolve(dirname, `./assets/img/card`, `attack.png`)}`
//     );
//     return ctx.canvas.render(445, 670, (c) => {
//       c.fillStyle = cardColor[this.rarity];
//       c.fillRect(0, 0, 445, 670);
//       c.drawImage(cardFace, 10, 10, 425, 650);
//       c.drawImage(attackIcon, 222 - 125, 125, 250, 250);
//       c.drawImage(icon, 45, 545, 80, 80);
//       c.font = "bold 30px";
//       c.fillStyle = "#000000";
//       c.textAlign = "center";
//       c.textBaseline = "middle";
//       wrapText(c, this.description, 220, 480, 300, 30);
//       wrapText(c, this.name, 220, 415, 300, 30);
//       c.font = "bold 80px";
//       c.fillStyle = "#ab8818";
//       c.fillText(this.cost.toString(), 360, 585);
//     });
//   }
// }

//卡组池
export class CardPool {
  private static cards: {
    class: any;
    weight: number;
    args?: any;
  }[] = [
    { class: BaseAttckCard, weight: 6 },
    { class: BaseSpecialAttackCard, weight: 6 },
    { class: BaseArmorCard, weight: 3 },
    // { class: EventCard, weight: 4 },
    { class: ArmorBreakCard, weight: 2 },
  ];

  static spawnCard(
    sizs: number,
    character: PVP,
    isplayer: boolean = false
  ): RougueCard[] {
    const originalCards = [...this.cards];
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
          const itemClass = {
            伤药: HealCard,
            毒药: PoisonCard,
          };
          if (!itemClass[item.name]) return null;
          return {
            class: itemClass[item.name],
            weight: 1,
            args: item.level,
          };
        }) || []
      );
    }
    // console.log(this.cards);
    const deck: RougueCard[] = [];
    const pool = this.createWeightedPool();
    const guaranteedCards = [
      new BaseAttckCard(),
      new BaseSpecialAttackCard(),
      new BaseArmorCard(),
      new SkillCard(character.skill[0]),
      new SkillCard(character.skill[1]),
      new SkillCard(character.skill[2]),
      new SkillCard(character.skill[3]),
    ];
    deck.push(...guaranteedCards);
    for (let i = 0; i < sizs; i++) {
      const cardClass = this.getRandomCardClass(pool);
      deck.push(new cardClass.class(cardClass?.args));
    }
    this.cards = originalCards;
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
  enemyturn: boolean;
  currentEnergy: number;
  turnCount: number;
  logs: string[];
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

    const getMaxCostCard = (cards: RougueCard[]) =>
      cards.reduce(
        (maxCard, currCard) =>
          currCard.cost > maxCard.cost ? currCard : maxCard,
        cards[0]
      );

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

    if (armorTrend > 0 && armorBreakCard.length) {
      return getMaxCostCard(armorBreakCard);
    }
    if (armorCard.length) {
      return getMaxCostCard(armorCard);
    }
    const categoryEffect: number = this.calculateCategory(context);
    if (categoryEffect >= 1 && skillCard.length) {
      return getMaxCostCard(skillCard);
    }
    if (attackCard.length || specialAttackCard.length) {
      if (
        context.self.power.attack > context.self.power.specialAttack &&
        attackCard.length
      ) {
        return getMaxCostCard(attackCard);
      } else if (specialAttackCard.length) {
        return getMaxCostCard(specialAttackCard);
      }
    }
    return getMaxCostCard(validCards);
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
  statusEffects = new StatusEffectMap(this);
  takeCard: RougueCard[];
  id?: string;
  bonus: {
    energy: number;
    damage: number;
    Hp: number;
    handsize: number;
    category: string[];
  };
  constructor(
    wildPokemon: Pokebattle,
    pokemonType: RouteNodeType = RouteNodeType.Combat,
    public readonly name: string = wildPokemon.battlename,
    public readonly maxHp: number = new PVP(wildPokemon).maxHp,
    public level: number = wildPokemon.level,
    public readonly maxEnergy: number = Math.floor(
      new PVP(wildPokemon).power.speed / 45
    ),
    public readonly power: PokemonPower = new PVP(wildPokemon).power,
    public deck: RougueCard[] = CardPool.spawnCard(30, new PVP(wildPokemon)),
    public discardPile: RougueCard[] = [],
    public skill: Skill[] = new PVP(wildPokemon).skill,
    public pokemonCategory: string[] = getType(new PVP(wildPokemon).monster_1) // private statusSystem: StatusSystem = statusSystems
  ) {
    this.id = wildPokemon.monster_1?.split(".")[0];
    this.bonus = {
      energy: 0,
      damage: 0,
      Hp: 0,
      handsize: 0,
      category: [],
    };

    switch (pokemonType) {
      case RouteNodeType.Combat:
        this.enymyType = WildPokemonType.NormalWild;
        break;
      case RouteNodeType.Elite:
        this.enymyType = WildPokemonType.UncommonPokemon;
        break;
      case RouteNodeType.Boss:
        this.enymyType = WildPokemonType.Legendary;
        break;
      default:
        this.enymyType = WildPokemonType.NormalWild;
    }
    maxHp = Math.floor(this.enymyType * this.power.hp); //敌对角色血量补正
    this.maxHp = Math.max(maxHp, 1);
    this.currentHp = maxHp;
    this.energy = maxEnergy;
    this.takeCard = [];
  }
  addStatusEffect(type: StatusType, stacks: number) {
    return statusSystems.getHandler(type).applyEffect(this, stacks);
  }

  takeDamage(damage: number): void {
    damage = damage ? damage : 0;
    this.currentHp = Math.max(this.currentHp - damage, 0);
    this.statusEffects.forEach((effect) => {
      if (statusSystems.getHandler(effect.type)?.onReceiveDamage) {
        statusSystems.getHandler(effect.type)?.onReceiveDamage(this);
      }
    });
  }

  processTurnStart() {
    let statusLog: string[] = [];
    for (const [type] of this.statusEffects.entries()) {
      const result = statusSystems.getHandler(type)?.processTurnStart(this);
      if (result) statusLog = [result, ...statusLog];
    }

    return statusLog.join("\n");
  }

  processTurnEnd() {
    let statusLog: string[] = [];
    for (const [type] of this.statusEffects.entries()) {
      const result = statusSystems.getHandler(type)?.processTurnEnd(this);
      if (result) statusLog = [result, ...statusLog];
    }

    return statusLog.join("\n");
  }
  drawHand(size: number): RougueCard[] {
    if (this.deck.length < size) {
      this.deck = Random.shuffle(this.discardPile);
    }
    const hand = this.deck.splice(0, size);
    this.discardPile.push(...hand);
    this.currentHand = hand;
    this.currentHand = this.currentHand?.map((c) => {
      const CardCtor = CardClassMap[c.type];
      if (!CardCtor) {
        throw new Error(`未知卡牌类型: ${c.type}`);
      }
      return new CardCtor().restor(c);
    });
    return this.currentHand;
  }
  discardCard(): void {
    this.discardPile.push(...this.currentHand);
    this.currentHand = [];
    this.takeCard = [];
    this.energy = this.maxEnergy;
  }
  act(context: CombatContext): string | void {
    // console.log(this.energy);
    let enemyLog = "";
    this.statusEffects.forEach((effect) => {
      const handler = statusSystems.getHandler(effect.type);
      const slogs = handler?.onUseCard(this, context);
      if (slogs) {
        enemyLog = slogs + (enemyLog == "" ? "" : "\n") + enemyLog;
      }
    });
    context.currentEnergy = this.energy;
    const selectedCard = this.aiStrategy.selectCard(this.currentHand, context);
    // console.log(selectedCard);
    if (selectedCard) {
      if (this.energy < selectedCard.cost) return null;
      this.takeCard = [selectedCard, ...this.takeCard];
      context.currentEnergy -= selectedCard.cost;
      let useCardEnemyLog = selectedCard.effect(this, context.player);
      enemyLog = useCardEnemyLog + (enemyLog == "" ? "" : "\n") + enemyLog;
      const index = this.currentHand.indexOf(selectedCard);
      if (index !== -1) {
        this.currentHand.splice(index, 1);
      }
      context.self = this;
      context.player = context.player;
      // console.log("2", enemyLog);
    }
    context.logs = [enemyLog as string, ...context.logs];
    return enemyLog;
  }
  restor() {
    this.statusEffects = new StatusEffectMap(this, this.statusEffects);
    this.aiStrategy = new EnemyAI().restor(this.aiStrategy);
    this.deck = this.deck?.map((c) => {
      const CardCtor = CardClassMap[c.type];
      if (!CardCtor) {
        throw new Error(`未知卡牌类型: ${c.type}`);
      }
      return new CardCtor().restor(c);
    });
    this.currentHand = this.currentHand?.map((c) => {
      const CardCtor = CardClassMap[c.type];
      if (!CardCtor) {
        throw new Error(`未知卡牌类型: ${c.type}`);
      }
      return new CardCtor().restor(c);
    });
    this.takeCard = this.takeCard?.map((c) => {
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
  // event: EventCard,
  health: HealCard,
  skill: SkillCard,
  poison: PoisonCard,
  numb: NumbCard,
  bossTicket: null,
};

function removeFirstOccurrence<T>(arr: T[], value: T): T[] {
  const index = arr.indexOf(value);
  if (index !== -1) {
    arr.splice(index, 1);
  }
  return arr;
}

function typeDirname(zhName: string): string {
  const type = {
    一般: "normal",
    火: "fire",
    水: "water",
    草: "grass",
    电: "electric",
    冰: "ice",
    格斗: "fighting",
    毒: "poison",
    地面: "ground",
    飞行: "flying",
    超能力: "psychic",
    妖精: "fairy",
    岩石: "rock",
    幽灵: "ghost",
    钢: "steel",
    虫: "bug",
    恶: "dark",
    龙: "dragon",
  };
  return `${testcanvas}${resolve(
    dirname,
    "./assets/img/typeicon",
    type[zhName]
  )}.png`;
}

function wrapText(
  context: any,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const chars = text.split("");
  let line = "";
  let lineY = y;

  for (let i = 0; i < chars.length; i++) {
    const testLine = line + chars[i];
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;

    if ((testWidth > maxWidth && line !== "") || chars[i] === "\n") {
      context.fillText(line, x, lineY);
      line = chars[i];
      lineY += lineHeight;
    } else {
      line = testLine;
    }
  }

  context.fillText(line, x, lineY);

  return lineY;
}
