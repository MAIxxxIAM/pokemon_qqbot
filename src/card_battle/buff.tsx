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
  stacks: number;
  baseValue?: number;
  applyBuff?: (target: CardPlayer) => string | undefined;
  removeBuff?: (target: CardPlayer) => string | undefined;
  levelUp?: (target: CardPlayer) => string | undefined;
  restor?: (data: any) => BuffConfig;
}

const buffLiblary: BuffConfig[] = [
  {
    name: "力量提升",
    type: BuffType.PowerBoost,
    description: "增加攻击力",
    id: "buff_power_boost_1",
    rarity: Rarity.Common,
    duration: 3,
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
        this.baseValue + this.baseValue * Math.log(this.stacks + 1),
        600
      );
      target.power.attack += v;
      return `${target.name}的攻击力提升了${v}点！`;
    },
    removeBuff(target) {
      const v = Math.min(
        this.baseValue + this.baseValue * Math.log(this.stacks + 1),
        600
      );
      target.power.attack -= v;
      return `${target.name}的攻击力恢复原状！`;
    },
    levelUp(target) {
      const v = Math.min(
        this.baseValue + this.baseValue * Math.log(this.stacks + 1),
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
