import { Random } from "koishi";
import { CardItem, CardPlayer, HealCard, PoisonCard } from "./type";
import { Pokebattle } from "../model";

export enum ShopItem {
  addItemHealth = "health",
  addItemPoison = "poison",
  levelUpCard = "levelUpCard",
  bossTicket = "bossTicket",
}

const shopItemConfig: Record<ShopItem, number> = {
  [ShopItem.addItemHealth]: 200,
  [ShopItem.addItemPoison]: 200,
  [ShopItem.levelUpCard]: 5,
  [ShopItem.bossTicket]: 1,
};

export function getShop(): ShopItem {
  const item = Random.weightedPick(shopItemConfig);
  return item;
}

export const itemMenu = {
  [ShopItem.addItemHealth]: {
    name: "伤药",
    description: "添加一张伤药卡到你的牌组中,仅在本次游戏中生效",
    // cost: 10000 / shopItemConfig[ShopItem.addItemHealth],
    cost: 0,
  },
  [ShopItem.addItemPoison]: {
    name: "毒药",
    description: "添加一张毒药卡到你的牌组中,仅在本次游戏中生效",
    // cost: 10000 / shopItemConfig[ShopItem.addItemPoison],
    cost: 0,
  },
  [ShopItem.levelUpCard]: {
    name: "升级道具卡",
    description: "升级道具卡的等级,或获取一个新道具",
    // cost: 10000 / shopItemConfig[ShopItem.levelUpCard],
    cost: 0,
  },
  [ShopItem.bossTicket]: {
    name: "首领券",
    description: "增加1张首领券,最多20张,可在最后挑战最终首领,当前测试未实装",
    // cost: 10000 / shopItemConfig[ShopItem.bossTicket],
    cost: 0,
  },
};

export function getShopItem(
  item: ShopItem,
  player: Pokebattle,
  cardPlayer: CardPlayer
): string {
  const cost = 10000 / itemMenu[item].cost;
  if (player.coin < cost) {
    return undefined;
  }
  player.coin -= cost;
  switch (item) {
    case ShopItem.addItemHealth:
      const [playerHealth] = player.itemBag.filter(
        (item) => item.name == "伤药"
      );

      cardPlayer.deck = [
        ...cardPlayer.deck,
        new HealCard(playerHealth ? playerHealth.level : 1),
      ];
      cardPlayer.deck = Random.shuffle(cardPlayer.deck);
      return `你为你的卡牌中添加了一张伤药卡,仅在本次游戏中生效`;
    case ShopItem.addItemPoison:
      const [playerPoison] = player.itemBag.filter(
        (item) => item.name == "伤药"
      );

      cardPlayer.deck = [
        ...cardPlayer.deck,
        new PoisonCard(playerPoison ? playerPoison.level : 1),
      ];
      cardPlayer.deck = Random.shuffle(cardPlayer.deck);
      return `你为你的卡牌中添加了一张毒药卡,仅在本次游戏中生效`;
    case ShopItem.levelUpCard:
      const inEvent = Math.ceil(Math.random()) == 0 ? "伤药" : "毒药";
      player.itemBag.map((item) => {
        if (item.name == inEvent) {
          item.level = Math.min(3, item.level + 1);
        }
      });
      const [itemList] = player.itemBag.filter((item) => item.name == inEvent);
      if (!itemList) {
        const newItem: CardItem = {
          type: inEvent == "伤药" ? "health" : "poison",
          name: inEvent,
          level: 1,
        };
        player.itemBag = [...player.itemBag, newItem];
      }
      return itemList
        ? `你的道具${inEvent}卡,提升了一级,最高等级当前为3级别,无法更高,下次游戏生效`
        : `你获得了道具${inEvent}卡,已放入背包,下次游戏生效`;
    case ShopItem.bossTicket:
      player.itemBag.map((item) => {
        if (item.type == ShopItem.bossTicket) {
          item.level = Math.min(20, item.level + 1);
        }
      });
      const [ticket] = player.itemBag.filter(
        (item) => item.type == ShopItem.bossTicket
      );
      if (!ticket) {
        const newItem: CardItem = {
          type: ShopItem.bossTicket,
          name: "首领券",
          level: 1,
        };
        player.itemBag = [...player.itemBag, newItem];
      }
      return `购买了${item},增加了1张首领券`;
    default:
      return "未知物品";
  }
}
