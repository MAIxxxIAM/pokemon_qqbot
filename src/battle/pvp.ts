import { Pokebattle, logger } from "..";
import { BerryFood } from "../farm/berryTreeFarm";
import { skillMachine } from "../utils/data";
import { typeEffect } from "../utils/method";
import { Battlers, PokemonPower, Skill, Skills } from "./";
import { PVE } from "./pve";

export class PVP implements Battlers {
  id: string;
  name: string;
  level: number;
  monster_1: string;
  battlename: string;
  itemBag?: number[];
  hitSpeed: number;
  power: PokemonPower;
  maxHp?: number;
  food?: BerryFood;
  // skill: number
  skill: Skill[];
  constructor(player1: Pokebattle) {
    this.id = player1.id;
    this.name = player1.name;
    this.level = player1.level;
    this.monster_1 = player1.monster_1;
    this.itemBag = player1.itemBag;
    this.battlename = player1.battlename;
    this.hitSpeed = Number(player1.base[5]);
    this.food = player1.berry_food ? new BerryFood(player1.berry_food) : null;
    this.power = {
      hp: Number(player1.power[0]),
      attack: Number(player1.power[1]),
      defense: Number(player1.power[2]),
      specialAttack: Number(player1.power[3]),
      specialDefense: Number(player1.power[4]),
      speed: Number(player1.power[5]),
    };
    this.maxHp = this.power.hp;
    this.skill = [];
    player1.skillSlot
      ? player1.skillSlot.forEach((S) => {
          this.skill.push(new Skill(S.id));
        })
      : null;
    this.skill = this.skill.sort((b, a) => a.dam - b.dam);
  }
  private getKeys<T>(obj: T, category: number): keyof T {
    return Object.keys(obj)[category] as keyof T;
  }

  attack(target: PVP) {
    if (this.food?.effectCategory !== "hp") {
      this.food?.category(this.food.target == "self" ? this : target);
    }
    //remake
    this.skill.forEach((S) => {
      if (S?.round > 0) {
        S.round--;
      }
    });
    let readySkill = this.skill.find((S) => S?.round == 0);
    if (!readySkill) {
      readySkill = new Skill(0);
    }
    //old
    const hit = Math.random() < this.hitSpeed / 4 / 256 ? 2 : 1; //计算暴击概率
    hit == 2 ? target.food?.subPower(readySkill, target) : null; //暴击时触发食物效果
    const skillCategory = readySkill.category; //技能属性
    const attCategory = skillCategory; //判断攻击物理还是特殊
    const defCategory = attCategory + 1; //判断防御物理还是特殊
    const Effect = typeEffect(
      this.monster_1,
      target.monster_1,
      readySkill.type
    ); //计算属性相克
    let damage = Math.floor(
      (((((2 * this.level + 10) / 250) *
        this.power[this.getKeys(this.power, attCategory)]) /
        (1.7 * target.power[this.getKeys(target.power, defCategory)])) *
        readySkill.dam +
        2) *
        hit *
        Effect *
        (Math.random() * 0.15 + 0.85)
    ); //计算伤害
    target.power.hp = target.power.hp - damage;
    if (
      target.food?.effectCategory == "hp" &&
      target.power.hp / this.maxHp < 0.5
    ) {
      target.food?.category(target);
    }
    target.power.hp = target.power.hp < 0 ? 0 : target.power.hp;
    const log =
      hit == 2
        ? `*${this.battlename}击中要害,对${target.battlename}造成 ${Math.floor(
            damage
          )} 伤害*`
        : `${this.battlename}的 [${readySkill.name}]，造成 ${Math.floor(
            damage
          )} 伤害,${target.battlename}剩余${Math.floor(target.power.hp)}HP`;
    this.skill.forEach((S) => {
      if (S?.id == readySkill.id) {
        S.round = S.cd;
      }
    });
    return log;
  }
  wildAttack(target: PVE) {
    //remake
    this.skill.forEach((S) => {
      if (S?.round > 0) {
        S.round--;
      }
    });

    let readySkill = this.skill[0];
    if (!readySkill) {
      readySkill = new Skill(0);
    }
    //old
    const hit = Math.random() < this.hitSpeed / 4 / 256 ? 2 : 1;
    const skillCategory = readySkill.category;
    const attCategory = skillCategory;
    const defCategory = attCategory + 1;
    const Effect = typeEffect(this.monster_1, target.id, readySkill.type);
    let damage = Math.floor(
      (((((2 * this.level + 10) / 250) *
        this.power[this.getKeys(this.power, attCategory)]) /
        (1.7 * target.power[this.getKeys(target.power, defCategory)])) *
        readySkill.dam +
        2) *
        hit *
        Effect *
        (Math.random() * 0.15 + 0.85)
    );
    target.power.hp = target.power.hp - damage;
    target.power.hp = target.power.hp < 0 ? 0 : target.power.hp;
    const log =
      hit == 2
        ? `*${this.battlename}击中要害,对${target.name}造成 ${Math.floor(
            damage
          )} 伤害*`
        : `${this.battlename}的 [${readySkill.name}]，造成 ${Math.floor(
            damage
          )} 伤害,${target.name}剩余${Math.floor(target.power.hp)}HP`;
    this.skill.forEach((S) => {
      if (S?.id == readySkill.id) {
        S.round = S.cd;
      }
    });
    return log;
  }
}

export function pokebattle(a: Pokebattle, b: Pokebattle) {
  try {
    let log = [];
    let winner = { id: "" };
    let loser = { id: "" };
    let first: PVP, second: PVP;
    if (Number(a.power[5]) > Number(b.power[5])) {
      first = new PVP(a);
      second = new PVP(b);
    } else {
      first = new PVP(b);
      second = new PVP(a);
    }
    while (Number(a.power[0]) > 0 && Number(b.power[0]) > 0) {
      log.push(first.attack(second));
      if (second.power.hp <= 0) {
        winner = { id: first.id };
        loser = { id: second.id };
        log.push(`${first.battlename} 胜利了`);
        break;
      }
      log.push(second.attack(first));
      if (first.power.hp <= 0) {
        winner = { id: second.id };
        loser = { id: first.id };
        log.push(`${second.battlename} 胜利了`);
        break;
      }
    }
    if (first.id == a.id) {
      a.berry_food = first.food;
      b.berry_food = second.food;
    } else {
      a.berry_food = second.food;
      b.berry_food = first.food;
    }
    return [log.join("\n"), winner.id, loser.id];
  } catch (e) {
    logger.error(e);
    return [`战斗出现意外了`, a.id, a.id];
  }
}
