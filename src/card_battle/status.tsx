import { CardCharacter, CombatContext, StatusEffect, StatusType } from "./type";

//

export interface StatusHandler {
  type: StatusType;
  applyEffect(target: CardCharacter, stacks: number): string | undefined;
  processTurnStart(target: CardCharacter): string | undefined;
  processTurnEnd(target: CardCharacter): string | undefined;
  onUseCard?(
    target: CardCharacter,
    context?: CombatContext
  ): string | undefined;
  onReceiveDamage?(target: CardCharacter): string | undefined;
  restor(data: Partial<StatusHandler>): StatusHandler;
}

export class NumbStatusHandler implements StatusHandler {
  type: StatusType = "numb";

  applyEffect(target: CardCharacter, stacks: number): string | undefined {
    if (target.pokemonCategory.includes("电"))
      return `麻痹无法对电属性宝可梦生效`;
    const existing = target.statusEffects.get(this.type);
    if (existing) {
      existing.stacks += stacks;
      existing.duration = Math.max(existing.duration, 3);
    } else {
      target.statusEffects.set(this.type, {
        type: this.type,
        stacks,
        duration: 3,
      });
      target.power.speed = Math.floor(target.power.speed / 2);
      target.energy = Math.max(target.energy - 2, 3);
      target.maxEnergy = Math.max(target.maxEnergy - 2, 3);
    }
    return `,${target.name}麻痹了！${
      existing ? "" : `${target.name}速度减半,能量减少2点(最低3点)`
    }`;
  }
  processTurnStart(target: CardCharacter): string | undefined {
    return undefined;
  }
  onUseCard(target: CardCharacter, context: CombatContext): string | undefined {
    const effect = target.statusEffects.get(this.type);
    if (!effect) return;
    const randomNumb = Math.random() <= 0.25;
    if (!randomNumb) return;
    effect.duration--;
    let log = `${target.name}麻痹了,本回合无法使用技能`;
    context.enemyturn = false;
    if (effect.duration <= 0) {
      target.statusEffects.delete(this.type);
      log += `${target.name}麻痹效果消失了`;
      target.power.speed = Math.floor(target.power.speed * 2);
      target.energy = Math.min(target.energy + 2, target.maxEnergy);
      target.maxEnergy = Math.min(
        target.maxEnergy + 2,
        Math.floor(target.power.speed / 45)
      );
    }

    return log;
  }
  processTurnEnd(target: CardCharacter): string | undefined {
    return undefined;
  }
  onReceiveDamage?(target: CardCharacter): string | undefined {
    return undefined;
  }
  restor(data: Partial<StatusHandler>): StatusHandler {
    return Object.assign(new NumbStatusHandler(), data);
  }
}

export class PoisonStatusHandler implements StatusHandler {
  type: StatusType = "poison";

  applyEffect(target: CardCharacter, stacks: number): string | undefined {
    const existing = target.statusEffects.get(this.type);
    if (existing) {
      existing.stacks += stacks;
      existing.duration = Math.max(existing.duration, 3);
    } else {
      target.statusEffects.set(this.type, {
        type: this.type,
        stacks,
        duration: 3,
      });
    }
    return `,${target.name}中毒层数叠加至${existing?.stacks || stacks}层！`;
  }

  processTurnStart(target: CardCharacter): string | undefined {
    const effect = target.statusEffects.get(this.type);
    if (effect) {
      return `${target.name}身上的毒药正在生效...`;
    }
  }
  onUseCard(target: CardCharacter): string | undefined {
    return undefined;
  }
  onReceiveDamage(target: CardCharacter): string | undefined {
    return undefined;
  }

  processTurnEnd(target: CardCharacter): string | undefined {
    const effect = target.statusEffects.get(this.type);
    if (!effect) return;

    const damage = Math.floor(effect.stacks * 0.05 * target.maxHp);
    target.currentHp -= damage;
    if (target.currentHp < 0) target.currentHp = 0;
    effect.duration--;

    let log = `${target.name}受到${damage}点中毒伤害！`;
    if (effect.duration <= 0) {
      target.statusEffects.delete(this.type);
      log += `${target.name}身上的毒素消失了`;
    }
    return log;
  }
  processGlobalTurn() {
    // 处理全场地状态
  }
  restor(data: any): PoisonStatusHandler {
    return Object.assign(new PoisonStatusHandler(), data);
  }
}

export class StatusSystem {
  private handlers = new Map<StatusType, StatusHandler>();

  registerHandler(handler: StatusHandler) {
    this.handlers.set(handler.type, handler);
  }

  getHandler(type: StatusType): StatusHandler | undefined {
    return this.handlers.get(type);
  }
}

export class StatusEffectMap {
  // 使用普通对象作为内部存储
  private _data: Record<string, StatusEffect> = {};

  constructor(data?: any) {
    if (data) {
      this.fromJSON(data);
    }
  }

  // 实现与 Map 相同的接口
  public get(key: StatusType): StatusEffect | undefined {
    return this._data[key];
  }

  public set(key: StatusType, value: StatusEffect): this {
    this._data[key] = value;
    return this;
  }

  public has(key: StatusType): boolean {
    return key in this._data;
  }

  public delete(key: StatusType): boolean {
    if (this.has(key)) {
      delete this._data[key];
      return true;
    }
    return false;
  }

  public clear(): void {
    this._data = {};
  }

  public forEach(
    callback: (value: StatusEffect, key: StatusType) => void
  ): void {
    Object.entries(this._data).forEach(([key, value]) => {
      callback(value, key as StatusType);
    });
  }

  // 返回可迭代的 entries，模拟 Map.entries()
  public entries(): [StatusType, StatusEffect][] {
    return Object.entries(this._data)
      .filter(([key]) => this.isValidStatusType(key))
      .map(([key, value]): [StatusType, StatusEffect] => [
        key as StatusType,
        value,
      ]);
  }

  // 验证是否为有效的状态类型
  private isValidStatusType(key: string): key is StatusType {
    return key === "poison" || key === "strength" || key === "weak";
  }

  // 从任意数据源恢复
  public fromJSON(data: any): this {
    this.clear();

    // 处理已经是 StatusEffectMap 的情况
    if (data instanceof StatusEffectMap) {
      data.forEach((value, key) => {
        this.set(key, value);
      });
      return this;
    }

    // 处理是原生 Map 的情况
    if (data instanceof Map) {
      for (const [key, value] of data.entries()) {
        if (this.isValidStatusType(key)) {
          this.set(key, value);
        }
      }
      return this;
    }

    // 处理普通对象的情况
    if (data && typeof data === "object") {
      Object.entries(data).forEach(([key, value]) => {
        if (this.isValidStatusType(key)) {
          this.set(key, value as StatusEffect);
        }
      });
    }

    return this;
  }

  // 返回纯对象用于 JSON 序列化
  public toJSON(): Record<string, StatusEffect> {
    return { ...this._data };
  }
}

export const statusSystems = new StatusSystem();
statusSystems.registerHandler(new PoisonStatusHandler());
statusSystems.registerHandler(new NumbStatusHandler());
