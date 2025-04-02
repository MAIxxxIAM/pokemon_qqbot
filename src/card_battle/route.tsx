import { PokemonPower } from "../battle";
import { Robot } from "../utils/robot";
import { Enemy } from "./type";

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
interface RouteNode {
  type: RouteNodeType;
  depth: number;
  enemies?: Enemy[];
  children: RouteNode[];
  isCompleted: boolean;
  isExplored: boolean;
}

// 路线生成配置
const ROUTE_CONFIG = {
  branchRate: 0.3,
  maxDepth: 20,
  bossInterval: 5,
};

// 路线生成器
export class RouteGenerator {
  currentDepth = 0;
  private maxAllowedDepth: number;

  constructor(maxDepth: number = ROUTE_CONFIG.maxDepth) {
    this.maxAllowedDepth = maxDepth;
  }

  restore(data: any): RouteGenerator {
    return Object.assign(new RouteGenerator(), data);
  }

  // 初始生成仅包含第一层的路线图
  generateInitialRoute(): RouteNode {
    // 创建根节点
    const root = this.createInitialNode(0);

    // 根节点的子节点(只生成第一层)
    const childCount = Math.random() > 0.7 ? 3 : 2;
    for (let i = 0; i < childCount; i++) {
      root.children.push(this.createInitialNode(1));
    }

    return root;
  }
  private determineNodeType(depth: number): RouteNodeType {
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

  private generateEnemies(type: RouteNodeType, depth: number): Enemy[] {
    const enemyCount = Math.floor(Math.random() * 3) + 1; // 随机生成敌人数量
    let enemies: Enemy[] = [];

    for (let i = 0; i < enemyCount; i++) {
      const enemy = new Robot(100);
      enemies = [...enemies, new Enemy(enemy)];
    }

    return enemies;
  }

  // 初始节点创建(不生成子节点)
  private createInitialNode(depth: number): RouteNode {
    const nodeType = this.determineNodeType(depth);
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
  exploreNode(node: RouteNode): void {
    node.isExplored = true;
    this.currentDepth = node.depth;

    // 如果已经是最大深度，不再生成子节点
    if (node.depth >= this.maxAllowedDepth - 1) {
      return;
    }

    // 如果已经有子节点，不再重复生成
    if (node.children.length > 0) {
      return;
    }

    // 生成下一层的选择分支
    const childCount = Math.random() > 0.7 ? 3 : 2;
    for (let i = 0; i < childCount; i++) {
      node.children.push(this.createInitialNode(node.depth + 1));
    }
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
