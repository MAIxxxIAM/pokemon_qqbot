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
  applyBuff?: (target: CardPlayer, isReward?: boolean) => string | undefined;
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
    restor(data) {
      return {
        ...data,
        applyBuff: this.applyBuff,
        removeBuff: this.removeBuff,
        levelUp: this.levelUp,
        restor: this.restor,
      };
    },
    applyBuff(target, isReward = false) {
      const v = Math.min(
        this.baseValue + this.baseValue * (1 + 0.8 / this.stacks) * this.stacks,
        600
      );
      target.power.attack += v;
      this.duration = isReward ? -1 : this.maxDuration;
      return `${target.name}的攻击力提升了${v}点！`;
    },
    removeBuff(target) {
      const v = Math.min(
        this.baseValue + this.baseValue * (1 + 0.8 / this.stacks) * this.stacks,
        600
      );
      target.power.attack -= v;
      return `${target.name}的攻击力恢复原状！`;
    },
    levelUp(target) {
      const v = Math.min(
        this.baseValue + this.baseValue * (1 + 0.8 / this.stacks) * this.stacks,
        600
      );
      if (v >= 600) {
        return undefined;
      }
      target.power.attack -= v;
      this.stacks += 1;
      this.applyBuff(target);
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
    restor(data) {
      return {
        ...data,
        applyBuff: this.applyBuff,
        removeBuff: this.removeBuff,
        levelUp: this.levelUp,
        restor: this.restor,
      };
    },
    applyBuff(target, isReward = false) {
      const v = Math.min(
        this.baseValue + this.baseValue * (1 + 0.8 / this.stacks) * this.stacks,
        600
      );
      target.power.specialAttack += v;
      this.duration = isReward ? -1 : this.maxDuration;
      return `${target.name}的特殊攻击力提升了${v}点！`;
    },
    removeBuff(target) {
      const v = Math.min(
        this.baseValue + this.baseValue * (1 + 0.8 / this.stacks) * this.stacks,
        600
      );
      target.power.specialAttack -= v;
      return `${target.name}的特殊攻击力恢复原状！`;
    },
    levelUp(target) {
      const v = Math.min(
        this.baseValue + this.baseValue * (1 + 0.8 / this.stacks) * this.stacks,
        600
      );
      if (v >= 600) {
        return undefined;
      }
      target.power.specialAttack -= v;
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
    restor(data) {
      return {
        ...data,
        applyBuff: this.applyBuff,
        removeBuff: this.removeBuff,
        levelUp: this.levelUp,
        restor: this.restor,
      };
    },
    applyBuff(target, isReward = false) {
      const v = Math.min(
        this.baseValue + this.baseValue * (1 + 0.8 / this.stacks) * this.stacks,
        600
      );
      target.power.defense += v;
      this.duration = isReward ? -1 : this.maxDuration;
      return `${target.name}的防御力提升了${v}点！`;
    },
    removeBuff(target) {
      const v = Math.min(
        this.baseValue + this.baseValue * (1 + 0.8 / this.stacks) * this.stacks,
        600
      );
      target.power.defense -= v;
      return `${target.name}的防御力恢复原状！`;
    },
    levelUp(target) {
      const v = Math.min(
        this.baseValue + this.baseValue * (1 + 0.8 / this.stacks) * this.stacks,
        600
      );
      if (v >= 600) {
        return undefined;
      }
      target.power.defense -= v;
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
    restor(data) {
      return {
        ...data,
        applyBuff: this.applyBuff,
        removeBuff: this.removeBuff,
        levelUp: this.levelUp,
        restor: this.restor,
      };
    },
    applyBuff(target, isReward?) {
      const v = Math.min(
        this.baseValue + this.baseValue * (1 + 0.8 / this.stacks) * this.stacks,
        600
      );
      target.power.specialDefense += v;
      this.duration = isReward ? -1 : this.maxDuration;
      return `${target.name}的特殊防御力提升了${v}点！`;
    },
    removeBuff(target) {
      const v = Math.min(
        this.baseValue + this.baseValue * (1 + 0.8 / this.stacks) * this.stacks,
        600
      );
      target.power.specialDefense -= v;
      return `${target.name}的特殊防御力恢复原状！`;
    },
    levelUp(target) {
      const v = Math.min(
        this.baseValue + this.baseValue * (1 + 0.8 / this.stacks) * this.stacks,
        600
      );
      if (v >= 600) {
        return undefined;
      }
      target.power.specialDefense -= v;
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
    restor(data) {
      return {
        ...data,
        applyBuff: this.applyBuff,
        removeBuff: this.removeBuff,
        levelUp: this.levelUp,
        restor: this.restor,
      };
    },
    applyBuff(target, isReward?) {
      const v = Math.min(
        this.baseValue + this.baseValue * (this.stacks - 1),
        600
      );
      target.power.speed += v;
      this.duration = isReward ? -1 : this.maxDuration;
      return `${target.name}的速度提升了${v}点！`;
    },
    removeBuff(target) {
      const v = Math.min(
        this.baseValue + this.baseValue * (this.stacks - 1),
        600
      );
      target.power.speed -= v;
      return `${target.name}的速度恢复原状！`;
    },
    levelUp(target) {
      const v = Math.min(
        this.baseValue + this.baseValue * (this.stacks - 1),
        600
      );
      if (v >= 600) {
        return undefined;
      }
      target.power.speed -= v;
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
    restor(data) {
      return {
        ...data,
        applyBuff: this.applyBuff,
        removeBuff: this.removeBuff,
        levelUp: this.levelUp,
        restor: this.restor,
      };
    },
    applyBuff(target, isReward?) {
      target.bonus.energy += this.baseValue * this.stacks;
      this.duration = isReward ? -1 : this.maxDuration;
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
    restor(data) {
      return {
        ...data,
        applyBuff: this.applyBuff,
        removeBuff: this.removeBuff,
        levelUp: this.levelUp,
        restor: this.restor,
      };
    },
    applyBuff(target, isReward?) {
      target.bonus.handsize += this.baseValue * this.stacks;
      this.duration = isReward ? -1 : this.maxDuration;
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
  [
    "一般",
    "虫",
    "火",
    "水",
    "电",
    "草",
    "冰",
    "格斗",
    "毒",
    "地面",
    "飞行",
    "超能",
    "妖精",
    "岩石",
    "幽灵",
    "龙",
    "恶",
    "钢铁",
  ].map((type, i) => {
    return {
      name: "属性改变-" + type,
      type: BuffType.CategoryChange,
      description: "改变当前玩家属性",
      id: "buff_category_change_" + i,
      rarity: Rarity.Exotic,
      duration: 4,
      maxDuration: 4,
      stacks: 1,
      baseValue: 1,
      restor(data) {
        return {
          ...data,
          applyBuff: this.applyBuff,
          removeBuff: this.removeBuff,
          levelUp: this.levelUp,
          restor: this.restor,
        };
      },
      applyBuff(target: CardPlayer, isReward?) {
        if (target.pokemonCategory.includes(type)) {
          return `${target.name}已经是${type}属性了！`;
        }
        if (target.pokemonCategory[1] == "") {
          target.pokemonCategory[1] = type;
        } else {
          target.pokemonCategory[Math.floor(Math.random() * 2)] = type;
        }
        this.duration = isReward ? -1 : this.maxDuration;
        return `${target.name}的属性改为了${type}！`;
      },
      removeBuff(target: CardPlayer) {
        target.pokemonCategory = target.bonus.category;
        return `${target.name}的属性恢复原状！`;
      },
      levelUp() {
        return undefined;
      },
    };
  })
);

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
