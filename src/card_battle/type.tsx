import { Random } from "koishi";
import { PokemonPower, Skill } from "../battle";
import { PVP } from "../battle/pvp";
import { Pokebattle } from "../model";
import { getType } from "../utils/method";
import { battleType } from "../utils/data";

enum CardRarity {
  Common,
  Uncommon,
  Rare,
}
enum WildPokemonType {
  NormalWild,
  UncommonPokemon,
  Legendary,
}

type CardType = "attack" | "defense" | "skill" | "event" | "armorBreak";

type StatusType = "poison" | "strength" | "weak";

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
    public readonly rarity: CardRarity,
    public readonly cardCategory:
      | "一般"
      | "格斗"
      | "飞行"
      | "毒"
      | "地面"
      | "岩石"
      | "虫"
      | "幽灵"
      | "钢"
      | "火"
      | "水"
      | "草"
      | "电"
      | "超能力"
      | "冰"
      | "龙"
      | "恶"
      | "妖精" = "一般"
  ) {}
  abstract effect(user: CardCharacter, target?: CardCharacter): void;
}

//玩家角色

class CardPlayer implements CardCharacter {
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
    public deck: RougueCard[] = CardPool.spawnCard(30),
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

//战斗上下文
interface CombatContext {
  player: CardCharacter;
  self: CardCharacter;
  currentEnergy: number;
  turnCount: number;
}

interface AIStrategy {
  selectCard(hand: RougueCard[], context: CombatContext): RougueCard | null;
}

class EnemyAI implements AIStrategy {
  private memory = {
    playerArmorHistory: [] as number[],
  };
  selectCard(hand: RougueCard[], context: CombatContext): RougueCard | null {
    this.memory.playerArmorHistory.push(context.player.armor);
    const armorTrend = this.calculateArmorTrend();
    const validCards = hand.filter((c) => c.cost <= context.currentEnergy);
    const attackCard = validCards.filter((c) => c.type === "attack");
    const armorBreakCard = validCards.filter((c) => c.type === "armorBreak");
    const skillCard = validCards.filter(
      (c) =>
        c.type === "skill" &&
        context.self.pokemonCategory.includes(c.cardCategory)
    );
    if (armorTrend > context.player.maxHp * 0.1) {
      return armorBreakCard.reduce(
        (maxCard, currCard) =>
          currCard.cost > maxCard.cost ? currCard : maxCard,
        hand[0]
      );
    }
    const categoryEffect: number = this.calculateCategory(context);
    if (categoryEffect > 1) {
      return skillCard.reduce(
        (maxCard, currCard) =>
          currCard.cost > maxCard.cost ? currCard : maxCard,
        hand[0]
      );
    }
    if (attackCard.length != 0) {
      return attackCard.reduce(
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
}

//敌人类
class Enemy implements CardCharacter {
  currentHp: number;
  armor = 0;
  energy: number;
  enymyType: WildPokemonType;
  aiStrategy: AIStrategy = new EnemyAI();
  currentHand: RougueCard[];
  constructor(
    wildPokemon: Pokebattle,
    public readonly name: string = new PVP(wildPokemon).name,
    public readonly maxHp: number = new PVP(wildPokemon).maxHp,
    public readonly maxEnergy: number = Math.floor(
      new PVP(wildPokemon).power.speed / 45
    ),
    public readonly power: PokemonPower = new PVP(wildPokemon).power,
    public deck: RougueCard[] = CardPool.spawnCard(30),
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
  act(context: CombatContext) {
    const selectedCard = this.aiStrategy.selectCard(this.currentHand, context);

    if (selectedCard) {
      context.currentEnergy -= selectedCard.cost;
      selectedCard.effect(this, context.player);
      this.currentHand = this.currentHand.filter((c) => c !== selectedCard);
    }
  }
}
