import { Random } from "koishi";
import { Rarity } from "../fishing/type";
import { CardCharacter, CardPlayer } from "./type";

export enum BuffType {
  PowerBoost = "能力提升",
  EnergyBoost = "能量提升",
  DrawBoost = "抽卡提升",
  CategoryChange = "属性改变",
}

export interface BuffConfig {
  name: string;
  type: BuffType;
  description: string;
  id: string;
  rarity: Rarity;
  duration: number;
  maxDuration: number;
  stacks?: number;
  baseValue?: number;
  isReward?: boolean;
  v?: number;
  applyBuff?: (target: CardPlayer, isReward?: boolean) => string | undefined;
  reconfig: (target: CardPlayer) => void;
  removeBuff?: (target: CardPlayer) => string | undefined;
  levelUp?: (target: CardPlayer) => string | undefined;
  restor?: (data: any) => BuffConfig;
}

export enum CardExporeEvent {
  AddBuff = "addBuff",
  ChangeHp = "changedHp",
  UpHpMax = "upHpMax",
  Battle = "battle",
  Relax = "relax",
  LevelUp = "levelUp",
}
export const exporeEventRecord: Record<CardExporeEvent, number> = {
  addBuff: 10,
  changedHp: 10,
  battle: 1,
  relax: 2,
  levelUp: 3,
  upHpMax: 1,
};

const buffLiblary: BuffConfig[] = [
  //能力
  {
    name: "攻击提升",
    type: BuffType.PowerBoost,
    description: "增加攻击力",
    id: "buff_power_boost_1",
    rarity: Rarity.Common,
    duration: 4,
    maxDuration: 4,
    stacks: 1,
    baseValue: 20,
    isReward: false,
    v: 0,
    restor(data) {
      return {
        ...data,
        applyBuff: this.applyBuff,
        removeBuff: this.removeBuff,
        levelUp: this.levelUp,
        restor: this.restor,
        reconfig: this.reconfig,
      };
    },
    applyBuff(target, isReward = false) {
      this.isReward = isReward;
      this.v = Math.min(
        this.baseValue +
          (this.baseValue * (1 + 0.8 / this.stacks) * this.stacks) /
            (isReward ? 1 : 2),
        600
      );
      target.power.attack += this.v;
      this.duration = -1;
      return `${target.name}的攻击力提升了${this.v}点！`;
    },
    reconfig(target) {
      target.power.attack += this.v;
    },
    removeBuff(target) {
      target.power.attack -= this.v;
      return `${target.name}的攻击力恢复原状！`;
    },
    levelUp(target) {
      target.power.attack -= this.v;
      this.stacks += 1;
      this.applyBuff(target, this.isReward);
      return `${target.name}的力量提升效果升级了！`;
    },
  },
  {
    name: "特攻提升",
    type: BuffType.PowerBoost,
    description: "增加特殊攻击力",
    id: "buff_power_boost_2",
    rarity: Rarity.Common,
    duration: 4,
    maxDuration: 4,
    stacks: 1,
    baseValue: 20,
    isReward: false,
    v: 0,
    restor(data) {
      return {
        ...data,
        applyBuff: this.applyBuff,
        removeBuff: this.removeBuff,
        levelUp: this.levelUp,
        restor: this.restor,
        reconfig: this.reconfig,
      };
    },
    reconfig(target) {
      target.power.specialAttack += this.v;
    },
    applyBuff(target, isReward = false) {
      this.isReward = isReward;
      this.v = Math.min(
        this.baseValue +
          (this.baseValue * (1 + 0.8 / this.stacks) * this.stacks) /
            (isReward ? 1 : 2),
        600
      );
      target.power.specialAttack += this.v;
      this.duration = -1;
      return `${target.name}的特殊攻击力提升了${this.v}点！`;
    },
    removeBuff(target) {
      target.power.specialAttack -= this.v;
      return `${target.name}的特殊攻击力恢复原状！`;
    },
    levelUp(target) {
      target.power.specialAttack -= this.v;
      this.stacks += 1;
      this.applyBuff(target);
      return `${target.name}的特殊攻击力提升效果升级了！`;
    },
  },
  {
    name: "防御提升",
    type: BuffType.PowerBoost,
    description: "增加防御力",
    id: "buff_power_boost_3",
    rarity: Rarity.Common,
    duration: 4,
    maxDuration: 4,
    stacks: 1,
    baseValue: 20,
    isReward: false,
    v: 0,
    restor(data) {
      return {
        ...data,
        applyBuff: this.applyBuff,
        removeBuff: this.removeBuff,
        levelUp: this.levelUp,
        restor: this.restor,
        reconfig: this.reconfig,
      };
    },
    reconfig(target) {
      target.power.defense += this.v;
    },
    applyBuff(target, isReward = false) {
      this.isReward = isReward;
      this.v = Math.min(
        this.baseValue +
          (this.baseValue * (1 + 0.8 / this.stacks) * this.stacks) /
            (isReward ? 1 : 2),
        600
      );
      target.power.defense += this.v;
      this.duration = -1;
      return `${target.name}的防御力提升了${this.v}点！`;
    },
    removeBuff(target) {
      target.power.defense -= this.v;
      return `${target.name}的防御力恢复原状！`;
    },
    levelUp(target) {
      target.power.defense -= this.v;
      this.stacks += 1;
      this.applyBuff(target);
      return `${target.name}的防御力提升效果升级了！`;
    },
  },
  {
    name: "特殊防御提升",
    type: BuffType.PowerBoost,
    description: "增加特殊防御力",
    id: "buff_power_boost_4",
    rarity: Rarity.Common,
    duration: 4,
    maxDuration: 4,
    stacks: 1,
    baseValue: 20,
    isReward: false,
    v: 0,
    restor(data) {
      return {
        ...data,
        applyBuff: this.applyBuff,
        removeBuff: this.removeBuff,
        levelUp: this.levelUp,
        restor: this.restor,
        reconfig: this.reconfig,
      };
    },
    reconfig(target) {
      target.power.specialDefense += this.v;
    },
    applyBuff(target, isReward?) {
      this.isReward = isReward;
      this.v = Math.min(
        this.baseValue +
          (this.baseValue * (1 + 0.8 / this.stacks) * this.stacks) /
            (isReward ? 1 : 2),
        600
      );
      target.power.specialDefense += this.v;
      this.duration = -1;
      return `${target.name}的特殊防御力提升了${this.v}点！`;
    },
    removeBuff(target) {
      target.power.specialDefense -= this.v;
      return `${target.name}的特殊防御力恢复原状！`;
    },
    levelUp(target) {
      target.power.specialDefense -= this.v;
      this.stacks += 1;
      this.applyBuff(target);
      return `${target.name}的特殊防御力提升效果升级了！`;
    },
  },
  {
    name: "速度提升",
    type: BuffType.PowerBoost,
    description: "增加速度",
    id: "buff_power_boost_5",
    rarity: Rarity.Common,
    duration: 4,
    maxDuration: 4,
    stacks: 1,
    baseValue: 25,
    isReward: false,
    v: 0,
    restor(data) {
      return {
        ...data,
        applyBuff: this.applyBuff,
        removeBuff: this.removeBuff,
        levelUp: this.levelUp,
        restor: this.restor,
        reconfig: this.reconfig,
      };
    },

    reconfig(target) {
      target.power.speed += this.v;
    },
    applyBuff(target, isReward?) {
      this.v = Math.min(
        this.baseValue + this.baseValue * (this.stacks - 1),
        600
      );
      target.power.speed += this.v;
      this.duration = -1;
      return `${target.name}的速度提升了${this.v}点！`;
    },
    removeBuff(target) {
      target.power.speed -= this.v;
      return `${target.name}的速度恢复原状！`;
    },
    levelUp(target) {
      target.power.speed -= this.v;
      this.stacks += 1;
      this.applyBuff(target);
      return `${target.name}的速度提升效果升级了！`;
    },
  },
  //能量
  {
    name: "能量点数提升",
    type: BuffType.EnergyBoost,
    description: "增加能量点数",
    id: "buff_enetgy_boost_1",
    rarity: Rarity.Exotic,
    duration: 4,
    maxDuration: 4,
    stacks: 1,
    baseValue: 1,
    isReward: false,
    restor(data) {
      return {
        ...data,
        applyBuff: this.applyBuff,
        removeBuff: this.removeBuff,
        levelUp: this.levelUp,
        restor: this.restor,
        reconfig: this.reconfig,
      };
    },
    reconfig(target) {
      return undefined;
    },
    applyBuff(target, isReward?) {
      target.bonus.energy += this.baseValue * this.stacks;
      this.duration = -1;
      return `${target.name}的能量点数提升了${this.stacks}点！`;
    },
    removeBuff(target) {
      target.bonus.energy -= this.baseValue * this.stacks;
      return `${target.name}的能量点数原状！`;
    },
    levelUp(target) {
      if (this.stacks >= 5) {
        return undefined;
      }
      target.bonus.energy -= this.baseValue * this.stacks;
      this.stacks += 1;
      this.applyBuff(target);
      return `${target.name}的能量点数提升效果升级了！`;
    },
  },
  //抽卡
  {
    name: "抽卡提升",
    type: BuffType.DrawBoost,
    description: "增加抽取手牌张数",
    id: "buff_draw_boost_1",
    rarity: Rarity.Exotic,
    duration: 4,
    maxDuration: 4,
    stacks: 1,
    baseValue: 1,
    isReward: false,
    restor(data) {
      return {
        ...data,
        applyBuff: this.applyBuff,
        removeBuff: this.removeBuff,
        levelUp: this.levelUp,
        restor: this.restor,
        reconfig: this.reconfig,
      };
    },
    reconfig(target) {
      return undefined;
    },
    applyBuff(target, isReward?) {
      target.bonus.handsize += this.baseValue * this.stacks;
      this.duration = -1;
      return `${target.name}的抽取手牌数量提升了${this.stacks}点！`;
    },
    removeBuff(target) {
      target.bonus.handsize -= this.baseValue * this.stacks;
      return `${target.name}的抽取手牌数量恢复原状！`;
    },
    levelUp(target) {
      if (this.stacks >= 5) {
        return undefined;
      }
      target.bonus.handsize -= this.baseValue * this.stacks;
      this.stacks += 1;
      this.applyBuff(target);
      return `${target.name}的抽取手牌数量提升效果升级了！`;
    },
  },
].concat(
  {
    name: "神秘力量",
    type: BuffType.CategoryChange,
    description: "基础攻击卡牌均变为自身属性",
    id: "buff_draw_boost_1",
    rarity: Rarity.Uncommon,
    duration: 4,
    maxDuration: 4,
    stacks: 1,
    baseValue: 1,
    isReward: false,
    v: 0,
    restor(data) {
      return {
        ...data,
        applyBuff: this.applyBuff,
        removeBuff: this.removeBuff,
        levelUp: this.levelUp,
        restor: this.restor,
        reconfig: this.reconfig,
      };
    },
    reconfig(target) {
      return undefined;
    },
    applyBuff(target: CardPlayer, isReward?) {
      target.deck = [target.currentHand, target.discardPile, target.deck]
        .flat()
        .map((card) => {
          if (["attack", "specialattack"].includes(card.type)) {
            card.cardCategory = target.pokemonCategory[0];
          }
          return card;
        });
      Random.shuffle(target.deck);
      this.duration = isReward ? -1 : this.maxDuration;
      return `${target.name}所有基础攻击卡,属性转为 **${target.pokemonCategory[0]}**`;
    },
    removeBuff(target) {
      target.deck = [target.currentHand, target.discardPile, target.deck]
        .flat()
        .map((card) => {
          if (["attack", "specialattack"].includes(card.type)) {
            card.cardCategory = "一般";
          }
          return card;
        });
      Random.shuffle(target.deck);
      return `${target.name}的所有基础攻击卡恢复原状！`;
    },
    levelUp(target) {
      return undefined;
    },
  }
  //   [
  //     "一般",
  //     "虫",
  //     "火",
  //     "水",
  //     "电",
  //     "草",
  //     "冰",
  //     "格斗",
  //     "毒",
  //     "地面",
  //     "飞行",
  //     "超能",
  //     "妖精",
  //     "岩石",
  //     "幽灵",
  //     "龙",
  //     "恶",
  //     "钢铁",
  //   ].map((type, i) => {
  //     return {
  //       name: "属性改变-" + type,
  //       type: BuffType.CategoryChange,
  //       description: "改变当前玩家属性",
  //       id: "buff_category_change_" + i,
  //       rarity: Rarity.Exotic,
  //       duration: 4,
  //       maxDuration: 4,
  //       stacks: 1,
  //       baseValue: 1,
  //       restor(data) {
  //         return {
  //           ...data,
  //           applyBuff: this.applyBuff,
  //           removeBuff: this.removeBuff,
  //           levelUp: this.levelUp,
  //           restor: this.restor,
  //         };
  //       },
  //       applyBuff(target: CardPlayer, isReward?) {
  //         if (target.pokemonCategory.includes(type)) {
  //           return `${target.name}已经是${type}属性了！`;
  //         }
  //         if (target.pokemonCategory[1] == "") {
  //           target.pokemonCategory[1] = type;
  //         } else {
  //           target.pokemonCategory[Math.floor(Math.random() * 2)] = type;
  //         }
  //         this.duration = isReward ? -1 : this.maxDuration;
  //         return `${target.name}的属性改为了${type}！`;
  //       },
  //       removeBuff(target: CardPlayer) {
  //         target.pokemonCategory = target.bonus.category;
  //         return `${target.name}的属性恢复原状！`;
  //       },
  //       levelUp() {
  //         return undefined;
  //       },
  //     };
  //   })
);

export class BuffManagerSystem {
  private _data: Record<string, BuffConfig> = {};

  constructor(data?: any) {
    if (data) {
      this.fromJSON(data);
    }
  }

  get(key: string): BuffConfig | undefined {
    return this._data[key];
  }
  set(key: string, value: BuffConfig): this {
    this._data[key] = value;
    return this;
  }
  clear() {
    this._data = {};
  }
  public forEach(callback: (value: BuffConfig, key: string) => void): void {
    Object.entries(this._data).forEach(([key, value]) => {
      callback(value, key as string);
    });
  }
  public has(key: string): boolean {
    return key in this._data;
  }
  public fromJSON(data: any): this {
    this.clear();

    // 处理已经是 StatusEffectMap 的情况
    if (data instanceof BuffManagerSystem) {
      data.forEach((value, key) => {
        this.set(key, value);
      });
      return this;
    }
  }
  public delete(key: string): boolean {
    if (this.has(key)) {
      delete this._data[key];
      return true;
    }
    return false;
  }
}

export class BuffFactory {
  static restoreBuff(data: any): BuffConfig {
    // 查找原型buff
    const prototypeBuff = buffLiblary.find((buff) => buff.id === data.id);
    if (prototypeBuff) {
      return prototypeBuff.restor(data);
    }
  }
}

export const BuffSelecet: Record<string, number> = buffLiblary.reduce(
  (acc, buff) => {
    // 根据稀有度设置权重
    let weight: number;
    switch (buff.rarity) {
      case Rarity.Common:
        weight = 100;
        break;
      case Rarity.Uncommon:
        weight = 60;
        break;
      case Rarity.Rare:
        weight = 30;
        break;
      default:
        weight = 5;
    }

    acc[buff.id] = weight;
    return acc;
  },
  {} as Record<string, number>
);

export function pickBuff(num: number): BuffConfig[] {
  const buffs: string[] = [];
  for (let i = 0; i < num; i++) {
    buffs.push(Random.weightedPick(BuffSelecet));
  }
  return buffs.map((buff) => {
    const prototypeBuff = buffLiblary.find((b) => b.id === buff);
    return prototypeBuff;
  });
}
