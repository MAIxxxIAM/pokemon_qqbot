import { Rarity } from "../fishing/type";
import { CardCharacter, CardPlayer } from "./type";

export enum BuffType {
  PowerBoost = "能力提升",
  EnergyBoost = "能量提升",
  DrawBoost = "抽卡提升",
  CategoryChange = "属性改变",
  CardLevelUp = "卡牌升级",
}

export interface BuffConfig {
  name: string;
  type: BuffType;
  description: string;
  id: string;
  rarity: Rarity;
  duration: number;
  maxDuration: number;
  stacks: number;
  baseValue?: number;
  applyBuff?: (target: CardPlayer) => string | undefined;
  removeBuff?: (target: CardPlayer) => string | undefined;
  levelUp?: (target: CardPlayer) => string | undefined;
  restor?: (data: any) => BuffConfig;
}

const buffLiblary: BuffConfig[] = [
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
    applyBuff(target) {
      const v = Math.min(
        this.baseValue + this.baseValue * (1 + 0.8 / this.stacks) * this.stacks,
        600
      );
      target.power.attack += v;
      this.duration = this.maxDuration;
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
    applyBuff(target) {
      const v = Math.min(
        this.baseValue + this.baseValue * (1 + 0.8 / this.stacks) * this.stacks,
        600
      );
      target.power.specialAttack += v;
      this.duration = this.maxDuration;
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
    name: "特攻提升",
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
    applyBuff(target) {
      const v = Math.min(
        this.baseValue + this.baseValue * (1 + 0.8 / this.stacks) * this.stacks,
        600
      );
      target.power.defense += v;
      this.duration = this.maxDuration;
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
];

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
