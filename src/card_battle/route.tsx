import { PokemonPower } from "../battle";
import { PokemonBase } from "../utils/method";
import { CardRobot, Robot } from "../utils/robot";
import { getRandomPokemon } from "./monster";
import { ShopItem } from "./shop";
import {
  CardCharacter,
  CardPlayer,
  Enemy,
  StatusEffect,
  StatusType,
} from "./type";

// 路线节点类型枚举
export enum RouteNodeType {
  Combat = "战斗",
  Elite = "精英",
  Boss = "首领",
  Event = "事件",
  Shop = "商店",
  Rest = "营地",
}

// 节点数据接口
export interface RouteNode {
  type: RouteNodeType;
  depth: number;
  enemies?: Enemy;
  children: RouteNode[];
  shopItem?: ShopItem[];
  isCompleted: boolean;
  isExplored: boolean;
}
enum RouteNodeStatus {
  UNEXPLORED = "未探索",
  EXPLORED = "已探索",
  COMPLETED = "已完成",
}

export class inRouteNode implements RouteNode {
  type: RouteNodeType;
  depth: number;
  enemies?: Enemy;
  children: RouteNode[];
  isCompleted: boolean;
  isExplored: boolean;

  constructor(routnode: RouteNode) {
    this.type = routnode.type;
    this.depth = routnode.depth;
    this.enemies = routnode.enemies;
    this.children = routnode.children;
    this.isCompleted = routnode.isCompleted;
    this.isExplored = routnode.isExplored;
  }

  restore(data: any): inRouteNode {
    return Object.assign(new inRouteNode(this), data);
  }
  onEvent(player?: CardCharacter): void {
    switch (this.type) {
      case RouteNodeType.Event:
        console.log("事件触发！");
        break;
      case RouteNodeType.Shop:
        console.log("商店触发！");
        break;
      case RouteNodeType.Rest:
        player.currentHp = player.maxHp;
        //获取buff
        break;
      default:
        console.log("未知事件！");
        break;
    }
  }
}

// 路线生成配置
const ROUTE_CONFIG = {
  branchRate: 0.3,
  maxDepth: 20,
  bossInterval: 5,
};

// 路线生成器
export class RouteGenerator {
  static maxAllowedDepth: number;

  constructor(maxDepth: number = ROUTE_CONFIG.maxDepth) {
    RouteGenerator.maxAllowedDepth = maxDepth;
  }

  static restore(data: any): RouteGenerator {
    return Object.assign(new RouteGenerator(), data);
  }

  static createInitialRoute(): RouteNode {
    const root = this.createNode(0);
    const childCount = Math.random() > 0.7 ? 3 : 2;
    for (let i = 0; i < childCount; i++) {
      root.children.push(this.createNode(1));
    }

    return root;
  }
  private static onNodeType(depth: number): RouteNodeType {
    if (depth % ROUTE_CONFIG.bossInterval === 0 && depth > 0) {
      return RouteNodeType.Boss;
    }

    const rand = Math.random();
    if (depth < 3) {
      return rand < 0.7 ? RouteNodeType.Combat : RouteNodeType.Event;
    }

    const eliteChance = DifficultySystem.getCurrentDifficulty(depth);

    if (rand < eliteChance.eliteChance) {
      return RouteNodeType.Elite;
    }

    return [
      RouteNodeType.Combat,
      RouteNodeType.Event,
      RouteNodeType.Shop,
      RouteNodeType.Rest,
    ][Math.floor(rand * 4)];
  }

  private static generateEnemies(type: RouteNodeType, depth: number): Enemy {
    let enemies: Enemy;
    const enemyPower: PokemonBase = getRandomPokemon(type);

    const enemy = new CardRobot(100, enemyPower, depth);
    enemies = new Enemy(enemy, type);

    return enemies;
  }

  static createNode(depth: number, e?: RouteNodeType): RouteNode {
    const nodeType = e ? e : this.onNodeType(depth);
    const node: RouteNode = {
      type: nodeType,
      depth,
      children: [],
      isCompleted: false,
      isExplored: false,
    };

    if (
      nodeType === RouteNodeType.Combat ||
      nodeType === RouteNodeType.Elite ||
      nodeType === RouteNodeType.Boss
    ) {
      node.enemies = this.generateEnemies(nodeType, depth);
    }

    return node;
  }

  // 探索节点标记枚举

  static exploreNode(
    node: RouteNode,
    player?: CardPlayer
  ): {
    status: RouteNodeStatus;
    text: string;
  } {
    let log = [];
    if (player?.activeBuffs.length > 0) {
      player.activeBuffs.forEach((buff) => {
        buff.duration--;
        if (buff.duration == 0) {
          log = [buff.removeBuff(player), ...log];
        }
      });
    }
    node.depth++;

    if (node.depth >= this.maxAllowedDepth - 1) {
      log = ["当前已探索完成！", ...log];
      node.isCompleted = true;
      return {
        status: RouteNodeStatus.COMPLETED,
        text: log.join("\n"),
      };
    }

    if (node.children.length > 0) {
      log = ["当前位置已经探索过了！", ...log];
      return {
        status: RouteNodeStatus.EXPLORED,
        text: log.join("\n"),
      };
    }
    player.refresh();
    const childCount = Math.random() > 0.7 ? 3 : 2;
    for (let i = 0; i < childCount; i++) {
      node.children.push(this.createNode(node.depth + 1));
    }
    return {
      status: RouteNodeStatus.UNEXPLORED,
      text: log.join("\n"),
    };
  }
}

export function displayRoute(
  node: RouteNode,
  prefix = "",
  isLast = true
): string {
  const currentLine = prefix + (isLast ? "└─ " : "├─ ");
  let output = `${currentLine}${getNodeSymbol(node)} ${node.type}\n`;

  node.children.forEach((child, index) => {
    const isChildLast = index === node.children.length - 1;
    const childPrefix = prefix + (isLast ? "   " : "│  ");
    output += displayRoute(child, childPrefix, isChildLast);
  });

  return output;
}

function getNodeSymbol(node: RouteNode): string {
  return {
    [RouteNodeType.Combat]: "⚔",
    [RouteNodeType.Elite]: "🔥",
    [RouteNodeType.Boss]: "👑",
    [RouteNodeType.Event]: "?",
    [RouteNodeType.Shop]: "🛒",
    [RouteNodeType.Rest]: "⛺",
  }[node.type];
}

class DifficultySystem {
  private static DIFFICULTY_CURVE = [
    { depth: 1, eliteChance: 0.05, legendaryChance: 0 },
    { depth: 5, eliteChance: 0.15, legendaryChance: 0.02 },
    { depth: 10, eliteChance: 0.35, legendaryChance: 0.05 },
    { depth: 15, eliteChance: 0.45, legendaryChance: 0.1 },
  ];

  static getCurrentDifficulty(depth: number) {
    return this.DIFFICULTY_CURVE.reduce((acc, curr) =>
      depth >= curr.depth ? curr : acc
    );
  }

  static adjustEnemyStats(enemy: Enemy, depth: number) {
    const scale = 1 + depth * 0.12;
    enemy.power.attack = Math.floor(enemy.power.attack * scale);
    enemy.power.defense = Math.floor(enemy.power.defense * scale);
    enemy.power.specialAttack = Math.floor(enemy.power.specialAttack * scale);
    enemy.power.specialDefense = Math.floor(enemy.power.specialDefense * scale);
    enemy.power.speed = Math.floor(enemy.power.speed * scale);
  }
}
