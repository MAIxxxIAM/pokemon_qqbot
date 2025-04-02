import { CardCharacter, StatusType } from "./type";

//

export interface StatusHandler {
  type: StatusType;
  applyEffect(target: CardCharacter, stacks: number): string | undefined;
  processTurnStart(target: CardCharacter): string | undefined;
  processTurnEnd(target: CardCharacter): string | undefined;
  onReceiveDamage?(target: CardCharacter): string | undefined;
  restor(data: Partial<StatusHandler>): StatusHandler;
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

  processTurnEnd(target: CardCharacter): string | undefined {
    const effect = target.statusEffects.get(this.type);
    if (!effect) return;

    const damage = Math.floor(effect.stacks * 0.05 * target.maxHp);
    target.currentHp -= damage;
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
  restor(data: any): StatusSystem {
    return Object.assign(new StatusSystem(), data);
  }
}

export const statusSystems = new StatusSystem();
statusSystems.registerHandler(new PoisonStatusHandler());
