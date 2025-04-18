import { $, Context, Element, h, Random, Session } from "koishi";
import {
  CardCharacter,
  CardPlayer,
  CombatContext,
  Enemy,
  RougueCard,
} from "./type";
import { initType } from "./method";
import { Robot } from "../utils/robot";
import { resolve } from "path";
import { dirname } from "../dirname";
import { button, sendMarkdown, toUrl } from "../utils/method";
import {
  displayRoute,
  RouteGenerator,
  RouteNode,
  RouteNodeType,
} from "./route";
import { testcanvas } from "..";
import {
  BuffConfig,
  CardExporeEvent,
  exporeEventRecord,
  pickBuff,
} from "./buff";
import { getShop, getShopItem, itemMenu, ShopItem } from "./shop";

export async function apply(ctx: Context) {
  // ctx.command("text1").action(async ({ session }) => {
  //   const routeGenerator = new RouteGenerator(21);

  //   let gameMap = RouteGenerator.createInitialRoute();
  //   return await drawPortal(gameMap);
  // });
  ctx
    .command("cardexpore")
    .alias("探索事件")
    .action(async ({ session }) => {
      let [cardData] = await ctx.database.get("carddata", {
        id: session.userId,
      });
      let [player] = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      if (!cardData || !player || cardData?.routmap?.isCompleted)
        return `你还未参与到卡牌游戏中`;
      if (cardData.routmap.type !== RouteNodeType.Event)
        return `当前地图无法探索事件`;
      const cardPlay: CardPlayer = await initType(
        cardData.player,
        CardPlayer,
        player
      );
      if (cardData.routmap.isExplored) {
        await session.execute(`cardgoon`);
        return;
      }
      const thisEvent = Random.weightedPick(exporeEventRecord);
      let logs: string[] = [];
      let nextCommand = `cardgoon`;
      switch (thisEvent) {
        case CardExporeEvent.AddBuff:
          const rarityBuff = pickBuff(1);
          logs = [cardPlay.addBuff(rarityBuff[0], true), ...logs];
          cardData.routmap.isExplored = true;
          break;
        case CardExporeEvent.UpHpMax:
        case CardExporeEvent.ChangeHp:
          thisEvent === CardExporeEvent.UpHpMax
            ? (cardPlay.bonus.Hp += 50)
            : null;
          const changeHp = Math.floor(Math.random() * 250 - 100);
          cardPlay.currentHp = Math.min(
            changeHp + cardPlay.currentHp,
            cardPlay.maxHp + cardPlay.bonus.Hp
          );
          logs = [
            `当前血量${
              thisEvent === CardExporeEvent.UpHpMax ? `上限提升50 并` : ``
            }${changeHp <= 0 ? `扣除` : `增加`}:${changeHp}`,
            ...logs,
          ];
          cardData.routmap.isExplored = true;
          break;
        case CardExporeEvent.Battle:
          logs = [`遭遇陷阱,是善于伪装的敌人`, ...logs];
          cardData.routmap = RouteGenerator.createNode(
            cardData.routmap.depth,
            RouteNodeType.Combat
          );
          nextCommand = `cardbattle`;
          break;
        case CardExporeEvent.LevelUp:
          break;
        case CardExporeEvent.Relax:
          break;

        default:
          return `探索事件错误,请稍后尝试`;
      }
      await ctx.database.upsert("carddata", (row) => [cardData]);
      await session.send(logs.join("\n"));
      await session.execute(nextCommand);
    });
  ctx
    .command("cardrest")
    .alias("休息一下")
    .action(async ({ session }) => {
      let [cardData] = await ctx.database.get("carddata", {
        id: session.userId,
      });
      let [player] = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      if (!cardData || !player || cardData?.routmap?.isCompleted)
        return `你还未参与到卡牌游戏中`;
      if (cardData.routmap.type !== RouteNodeType.Rest)
        return `当前地图无法探索事件`;
      if (cardData.routmap.isExplored) {
        await session.execute(`cardgoon`);
        return;
      }
      cardData.player = initType(cardData.player, CardPlayer, player);
      cardData.player.relax();
      cardData.routmap.isExplored = true;
      await ctx.database.set(
        "carddata",
        { id: session.userId },
        {
          player: cardData.player,
          routmap: cardData.routmap,
          combatcontext: cardData.combatcontext,
        }
      );
      const md = `![img#500px #500px](${await toUrl(
        ctx,
        session,
        `file://${resolve(dirname, `./assets/img/card`, `relax.png`)}`
      )})

---

> 你在营地休息了一下，已恢复全部${
        cardData.player.maxHp + cardData.player.bonus.Hp
      }点生命值`;
      const keybord = {
        keyboard: {
          content: {
            rows: [
              {
                buttons: [
                  button(0, `继续探索`, `cardgoon`, session.userId, `探索`),
                ],
              },
            ],
          },
        },
      };
      await sendMarkdown(ctx, md, session, keybord);
    });
  ctx
    .command("cardshop")
    .alias("进入商店")
    .action(async ({ session }) => {
      await session.execute(`cardexpore`);
      let [cardData] = await ctx.database.get("carddata", {
        id: session.userId,
      });
      let [player] = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      if (!cardData || !player || cardData?.routmap?.isCompleted)
        return `你还未参与到卡牌游戏中`;
      if (cardData.routmap.isExplored) {
        await session.execute(`cardgoon`);
        return;
      }
      if (cardData.routmap.type !== RouteNodeType.Shop)
        return `当前地图无法探索该事件`;
      const shop: ShopItem[] =
        cardData.routmap?.shopItem.length < 3
          ? [getShop(), getShop(), getShop()]
          : cardData.routmap?.shopItem;
      cardData.routmap.shopItem = shop;
      cardData.routmap?.shopItem.length < 3
        ? await ctx.database.set("carddata", { id: session.userId }, (row) => ({
            routmap: cardData.routmap,
          }))
        : null;

      const md = `你进入了商店,可以购买以下物品：
---

> <qqbot-cmd-input text="1" show="${itemMenu?.[shop[0]].name}   介绍:${
        itemMenu?.[shop[0]].description
      }" reference="false" />
<qqbot-cmd-input text="2" show="${itemMenu?.[shop[1]].name}   介绍:${
        itemMenu?.[shop[1]].description
      }" reference="false" />
<qqbot-cmd-input text="3" show="${itemMenu?.[shop[2]].name}   介绍:${
        itemMenu?.[shop[2]].description
      }" reference="false" />`;
      const keybord = {
        keyboard: {
          content: {
            rows: [
              {
                buttons: [
                  button(
                    0,
                    `购买${itemMenu?.[shop[0]].name}`,
                    `1`,
                    session.userId,
                    `购买物品`
                  ),
                  button(
                    0,
                    `购买${itemMenu?.[shop[1]].name}`,
                    `2`,
                    session.userId,
                    `购买物品`
                  ),
                  button(
                    0,
                    `购买${itemMenu?.[shop[2]].name}`,
                    `3`,
                    session.userId,
                    `购买物品`
                  ),
                ],
              },
            ],
          },
        },
      };
      await sendMarkdown(ctx, md, session, keybord);
      const item = await session.prompt(
        (ses: Session) => {
          const branch = Number(ses.content);
          if (!branch || branch > 3 || branch < 1) return undefined;
          const item = shop[branch - 1];
          if (!item) return undefined;
          const bugLog = getShopItem(item, player, cardData.player);
          if (!bugLog) {
            return undefined;
          }
          return bugLog;
        },
        { timeout: 20000 }
      );
      if (!item) return `购买失败重新购买`;
      cardData.routmap.isExplored = true;
      await ctx.database.set(
        "carddata",
        { id: session.userId },
        {
          player: cardData.player,
          routmap: cardData.routmap,
          combatcontext: cardData.combatcontext,
        }
      );
      await session.send(item);
      await session.execute(`cardgoon`);
    });

  // ctx.command("tss").action(async ({ session }) => {
  //   await session.send(`aaaaaa`);
  //   const item = await session.prompt(
  //     async (ses: Session) => {
  //       if (ses.content !== "aaa") return;
  //       await ses.send(`1`);
  //     },
  //     { timeout: 20000 }
  //   );
  // });
  ctx
    .command("cardgoon [cho:number]")
    .alias("继续探索")
    .action(async ({ session }, cho) => {
      let [cardData] = await ctx.database.get("carddata", {
        id: session.userId,
      });
      let [player] = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      if (!cardData || !player || cardData?.routmap?.isCompleted)
        return `你还未参与到卡牌游戏中`;
      if (!cardData.routmap.isExplored) {
        return `当前地图未探索完成`;
      }
      if (!cho) {
        if (cardData.routmap.isExplored) {
          const chooseRout = await drawPortal(cardData.routmap);
          const buttons = cardData.routmap.children.map((item, index) => {
            return button(
              0,
              `选择${item.type}`,
              `继续探索 ${index + 1}`,
              session.userId,
              `${item.type}`
            );
          });

          const md = `你当前的地图已经探索结束，是否继续探索？
  ![img#500px #333px](${await toUrl(ctx, session, chooseRout.attrs.src)})
  
  ---
  > <qqbot-cmd-input text="卡牌地图" show="地图" reference="false" />`;
          const keybord = {
            keyboard: {
              content: {
                rows: [
                  {
                    buttons: [...buttons],
                  },
                ],
              },
            },
          };
          await sendMarkdown(ctx, md, session, keybord);
          return;
        } else {
          return `当前地图未探索完成`;
        }
      }

      cardData.player = initType(cardData.player, CardPlayer, player);
      cardData.routmap.enemies = initType(
        cardData.routmap.enemies,
        Enemy,
        new Robot(100)
      );
      const selectedNode = cardData?.routmap?.children[cho - 1];
      if (!selectedNode) return `该地图不存在`;
      RouteGenerator.exploreNode(selectedNode, cardData.player);
      cardData.routmap = selectedNode;
      const chooseButton = {
        战斗: button(0, "开始战斗", "cardbattle", session.userId, "战斗"),
        精英: button(0, "开始战斗", "cardbattle", session.userId, "精英"),
        首领: button(0, "开始战斗", "cardbattle", session.userId, "首领"),
        事件: button(0, "探索该事件", "cardexpore", session.userId, "事件"),
        商店: button(0, "进入商店", "cardshop", session.userId, "商店"),
        营地: button(0, "休息一下", "cardrest", session.userId, "营地"),
      };
      const kybd = {
        keyboard: {
          content: {
            rows: [
              {
                buttons: [chooseButton[selectedNode.type]],
              },
            ],
          },
        },
      };
      const md = `你已经进入了新的地图：${selectedNode.type} 

${"```"}
${displayRoute(selectedNode)}
${"```"}`;
      await ctx.database.set(
        "carddata",
        { id: session.userId },
        {
          player: cardData.player,
          routmap: selectedNode,
          combatcontext: {
            player: cardData.player,
            self: selectedNode.enemies,
            currentEnergy: selectedNode?.enemies?.energy
              ? selectedNode?.enemies?.energy
              : 0,
            turnCount: 0,
            logs: [],
          },
        }
      );
      await sendMarkdown(ctx, md, session, kybd);
    });

  ctx
    .command("cardstard", "卡牌对战")
    .alias("开始卡牌")
    .action(async ({ session }) => {
      const [cardData] = await ctx.database.get("carddata", {
        id: session.userId,
      });
      const [player] = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      if (cardData && cardData?.routmap?.isCompleted == false)
        return `你已经在一场游戏中，请勿重复进入`;
      if (!player) {
        try {
          await session.execute(`签到`);
          return;
        } catch (e) {
          return `请先输入签到指令领取属于你的宝可梦和精灵球`;
        }
      }
      if (player.skillSlot.length < 4) {
        return `技能装备数量不足，请先装备技能`;
      }
      if (player.level < 100) {
        return `等级不足，无法进入该游戏`;
      }
      const newPlayer = new CardPlayer(player);
      const newRoutMap = RouteGenerator.createInitialRoute();
      await ctx.database.upsert("carddata", (row) => [
        {
          id: session.userId,
          player: newPlayer,
          routmap: newRoutMap,
          combatcontext: {
            player: newPlayer,
            self: newRoutMap.enemies,
            currentEnergy: newRoutMap?.enemies?.energy
              ? newRoutMap?.enemies?.energy
              : 0,
            turnCount: 0,
            logs: [],
          },
        },
      ]);

      // console.log(newRoutMap.enemies);

      const chooseButton = {
        战斗: button(0, "开始战斗", "cardbattle", session.userId, "战斗"),
        精英: button(0, "开始战斗", "cardbattle", session.userId, "精英"),
        首领: button(0, "开始战斗", "cardbattle", session.userId, "首领"),
        事件: button(0, "探索该事件", "cardexpore", session.userId, "事件"),
        商店: button(0, "进入商店", "cardshop", session.userId, "商店"),
        营地: button(0, "休息一下", "cardrest", session.userId, "营地"),
      };
      const kybd = {
        keyboard: {
          content: {
            rows: [
              {
                buttons: [chooseButton[newRoutMap.type]],
              },
            ],
          },
        },
      };
      const md = `你即将和你的宝可梦进入一场随机的卡牌游戏中
当前地图:${newRoutMap.type} 

${"```"}
${displayRoute(newRoutMap)}
${"```"}`;

      await sendMarkdown(ctx, md, session, kybd);
    });

  ctx
    .command("cardmap")
    .alias("卡牌地图")
    .action(async ({ session }) => {
      let [cardData] = await ctx.database.get("carddata", {
        id: session.userId,
      });
      let [player] = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      if (!cardData || !player || cardData?.routmap?.isCompleted)
        return `你还未参与到卡牌游戏中`;
      const cardmap = displayRoute(cardData.routmap);
      const md = `你当前的地图是：
---

${"```"}
${cardmap}
${"```"}`;
      const keybord = {
        keyboard: {
          content: {
            rows: [
              {
                buttons: [
                  button(0, `继续探索`, `cardbattle`, session.userId, `探索`),
                ],
              },
            ],
          },
        },
      };
      await sendMarkdown(ctx, md, session, keybord);
    });

  ctx
    .command("cardbattle [ident:string]")
    .alias("卡牌战斗")
    .action(async ({ session }, ident) => {
      let [cardData] = await ctx.database.get("carddata", {
        id: session.userId,
      });
      let [player] = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      if (!cardData || !player || cardData?.routmap?.isCompleted)
        return `你还未参与到卡牌游戏中`;
      if (cardData.routmap.isExplored) {
        await session.execute(`cardgoon`);
        return;
      }
      if (
        ![
          RouteNodeType.Boss,
          RouteNodeType.Combat,
          RouteNodeType.Elite,
        ].includes(cardData.routmap.type)
      )
        return `当前地图无法战斗`;
      cardData.player = await initType(cardData.player, CardPlayer, player);
      cardData.routmap.enemies = await initType(
        cardData.routmap.enemies,
        Enemy,
        new Robot(100)
      );
      if (!cardData?.combatcontext) {
        cardData.combatcontext = {
          player: null,
          self: null,
          enemyturn: false,
          currentEnergy: 0,
          turnCount: 0,
          logs: [],
        };
      }
      const cardplayer = cardData.player;
      const cardenemy = cardData.routmap.enemies;
      const context = cardData.combatcontext;
      context.player = cardplayer;
      context.self = cardenemy;
      let RandomPlayer: number;
      let RandomEnemy: number;
      if ([`跳过`, `continue`].includes(ident)) {
        ident = undefined;
        cardplayer.discardCard();
        cardenemy.discardCard();
        context.enemyturn = true;
      }
      if (context.logs.length <= 0) {
        ident == undefined;
        cardplayer.drawHand(5);
        cardenemy.drawHand(5);
        RandomPlayer = Math.floor(Math.random() * 6 + 1);
        RandomEnemy = Math.floor(Math.random() * 6 + 1);
        context.enemyturn = RandomEnemy <= RandomPlayer ? false : true;
        context.turnCount = 0;
        const code = "```";
        const startMd = `${cardenemy.name} :![img#50px #50px](${await toUrl(
          ctx,
          session,
          `file://${resolve(
            dirname,
            `./assets/img/card/random${RandomEnemy}.png`
          )}`
        )})

${code}
${RandomEnemy <= RandomPlayer ? "你取得了先手" : "对方将先手进行出卡"}
${code}

${cardplayer.name} :![img#50px #50px](${await toUrl(
          ctx,
          session,
          `file://${resolve(
            dirname,
            `./assets/img/card/random${RandomPlayer}.png`
          )}`
        )})`;
        context.logs.push(
          RandomEnemy <= RandomPlayer ? "你取得了先手" : "对方将先手进行出卡"
        );
        await sendMarkdown(ctx, startMd, session);
      }

      //对手先手逻辑
      if (context.enemyturn) {
        cardenemy.discardCard();
        cardenemy.drawHand(5);
        const statusStartLog = cardenemy.processTurnStart();
        if (statusStartLog.length > 0) {
          context.logs = [statusStartLog, ...context.logs];
        }
        while (cardenemy.energy > 0 && context.enemyturn == true) {
          let l = cardenemy.act(context);
          if (!l) break;
          if (cardplayer.currentHp <= 0) {
            break;
          }
        }
        context.enemyturn = false;
        const statusEndLog = cardenemy.processTurnEnd();
        if (statusEndLog.length > 0) {
          context.logs = [statusEndLog, ...context.logs];
        }
        if (
          cardplayer.energy == cardplayer.maxEnergy &&
          cardplayer.currentHand.length <= 0
        ) {
          cardplayer.drawHand(5);
        }
        const playerStatusStartLog = cardplayer.processTurnStart();
        if (playerStatusStartLog.length > 0) {
          context.logs = [playerStatusStartLog, ...context.logs];
        }
      }
      //玩家逻辑
      if (ident && context.enemyturn == false) {
        if (
          cardplayer.energy == cardplayer.maxEnergy &&
          cardplayer.currentHand.length <= 0
        ) {
          cardplayer.drawHand(5);
        }
        const usecard = cardplayer.useCard(context, ident, cardenemy);
        if (!usecard) return `操作失败`;
        if (
          cardplayer.currentHand.length == 0 ||
          (cardplayer.currentHand.length == 1 &&
            cardplayer.currentHand[0].cost > cardplayer.energy) ||
          cardplayer.energy <= 0
        ) {
          context.enemyturn = true;
          cardplayer.discardCard();
          cardenemy.discardCard();
          const statusEndLog = cardplayer.processTurnEnd();
          if (statusEndLog.length > 0) {
            context.logs = [statusEndLog, ...context.logs];
          }
        }
      }
      //胜负逻辑
      const whoseWin =
        cardenemy.currentHp <= 0
          ? `player`
          : cardplayer.currentHp <= 0
          ? `enemy`
          : `other`;
      switch (whoseWin) {
        case "player":
          const rarityBuff = pickBuff(3);
          const rarityImage = await toUrl(
            ctx,
            session,
            (
              await drawPortal(undefined, rarityBuff)
            ).attrs.src
          );
          const md = `你获得了胜利！成功探索了这一层地图
领取你的奖励：
![img#500px #333px](${rarityImage})

---
> ${rarityBuff.map(
            (item, i) =>
              `<qqbot-cmd-input text="${i}" show="${item.name}" reference="false" /> ${item.description}`
          ).join(`
`)}`;
          const buttons = rarityBuff.map((item, i) => {
            return button(
              0,
              item.name,
              String(i),
              session.userId,
              `${item.name}`
            );
          });
          const keybord = {
            keyboard: {
              content: {
                rows: [
                  {
                    buttons: buttons,
                  },
                ],
              },
            },
          };
          await sendMarkdown(ctx, md, session, keybord);
          let chooseBuff = Number(await session.prompt(20000));
          chooseBuff = chooseBuff
            ? chooseBuff
            : Math.floor(Math.random() * rarityBuff.length);
          const thisBuff = rarityBuff[chooseBuff];
          const logs = cardData.player.addBuff(thisBuff);
          cardData.routmap.isExplored = true;
          await ctx.database.set(
            "carddata",
            { id: session.userId },
            {
              player: cardplayer,
              routmap: cardData.routmap,
              combatcontext: context,
            }
          );
          await session.execute(`cardgoon`);
          return logs;
        case "enemy":
          cardData.routmap.isCompleted = true;
          await ctx.database.set(
            "carddata",
            { id: session.userId },
            {
              player: cardplayer,
              routmap: cardData.routmap,
              combatcontext: context,
            }
          );
          return `战斗失败`;
        //结束

        default:
          break;
      }

      //对手后手逻辑
      if (context.enemyturn) {
        cardenemy.discardCard();
        cardenemy.drawHand(5);
        const statusStartLog = cardenemy.processTurnStart();
        if (statusStartLog.length > 0) {
          context.logs = [statusStartLog, ...context.logs];
        }
        console.log(cardenemy.currentHand, cardenemy.energy);
        while (cardenemy.energy > 0 && context.enemyturn == true) {
          let l = cardenemy.act(context);
          if (!l) break;
          if (cardplayer.currentHp <= 0) {
            break;
          }
        }
        context.enemyturn = false;
        const statusEndLog = cardenemy.processTurnEnd();
        if (statusEndLog.length > 0) {
          context.logs = [statusEndLog, ...context.logs];
        }
        const playerStatusStartLog = cardplayer.processTurnStart();
        if (playerStatusStartLog.length > 0) {
          context.logs = [playerStatusStartLog, ...context.logs];
        }
      }

      const keybord = {
        keyboard: {
          content: {
            rows: keyboardItem(
              cardplayer.currentHand.length,
              cardplayer.currentHand,
              session.userId
            ),
          },
        },
      };
      keybord.keyboard.content.rows.push({
        buttons: [button(0, `跳过`, "卡牌战斗 跳过", session.userId, `跳过`)],
      });
      // {
      //   keyboard: {
      //     content: {
      //       rows: keyboardItem(
      //         cardplayer.currentHand.length,
      //         cardplayer.currentHand,
      //         session.userId
      //       ),
      //     },
      //   },
      // };
      const md = await toMarkDown(cardplayer, cardenemy, context, session);
      await sendMarkdown(ctx, md, session, keybord);
      const whoseWinLast =
        cardenemy.currentHp <= 0
          ? `player`
          : cardplayer.currentHp <= 0
          ? `enemy`
          : `other`;
      switch (whoseWinLast) {
        case "player":
          const rarityBuff = pickBuff(3);
          const rarityImage = await toUrl(
            ctx,
            session,
            (
              await drawPortal(undefined, rarityBuff)
            ).attrs.src
          );
          const md = `你获得了胜利！成功探索了这一层地图
领取你的奖励：
![img#500px #333px](${rarityImage})

---
> ${rarityBuff.map(
            (item, i) =>
              `<qqbot-cmd-input text="${i}" show="${item.name}" reference="false" /> ${item.description}`
          ).join(`
`)}`;
          const buttons = rarityBuff.map((item, i) => {
            return button(
              0,
              item.name,
              String(i),
              session.userId,
              `${item.name}`
            );
          });
          const keybord = {
            keyboard: {
              content: {
                rows: [
                  {
                    buttons: buttons,
                  },
                ],
              },
            },
          };
          await sendMarkdown(ctx, md, session, keybord);
          let chooseBuff = Number(await session.prompt(20000));
          chooseBuff = chooseBuff
            ? chooseBuff
            : Math.floor(Math.random() * rarityBuff.length);
          const thisBuff = rarityBuff[chooseBuff];
          const logs = cardData.player.addBuff(thisBuff);
          cardData.routmap.isExplored = true;
          await ctx.database.set(
            "carddata",
            { id: session.userId },
            {
              player: cardplayer,
              routmap: cardData.routmap,
              combatcontext: context,
            }
          );
          await session.execute(`cardbattle`);
          return logs;
        case "enemy":
          cardData.routmap.isCompleted = true;
          await ctx.database.set(
            "carddata",
            { id: session.userId },
            {
              player: cardplayer,
              routmap: cardData.routmap,
              combatcontext: context,
            }
          );
          return `战斗失败`;
        //结束

        default:
          break;
      }
      await ctx.database.set(
        "carddata",
        { id: session.userId },
        {
          player: cardplayer,
          routmap: cardData.routmap,
          combatcontext: context,
        }
      );
    });

  async function toMarkDown(
    player: CardCharacter,
    enemy: Enemy,
    context: CombatContext,
    session: Session
  ): Promise<string> {
    const code = "```";
    const { playerHand, enemyHand } = await processCards(player, enemy);
    const enemyUrl = await toUrl(
      ctx,
      session,
      (
        await drawEnemy(enemyHand)
      ).attrs.src
    );
    const playerUrl = await toUrl(
      ctx,
      session,
      (
        await drawHand(playerHand)
      ).attrs.src
    );
    return `> ${enemy.name}：${enemy.currentHp}/${enemy.maxHp} 🌟:${
      enemy.maxEnergy
    } 🛡:${enemy.armor}

![img#500px #${
      (422 + (Math.ceil(enemyHand.length / 3) - 2) * 422) / 2
    }px](${enemyUrl})

${code}
${context.logs.join("\n")}
${code}

![img#500px #${
      (500 * 2 + (Math.ceil(playerHand.length / 3) - 2) * 422) / 2
    }px](${playerUrl})

---

> ${player.name}：${player.currentHp}/${player.maxHp} 🌟:${player.energy}/${
      player.maxEnergy
    } 🛡:${player.armor}
    `;
  }

  async function drawPortal(route?: RouteNode, buffs?: BuffConfig[]) {
    const names = route
      ? route.children.map((r) => r.type)
      : buffs.map((b) => b.name);
    const portalBack = await ctx.canvas.loadImage(
      `${testcanvas}${resolve(dirname, `./assets/img/card`, `chooseRout.png`)}`
    );
    const portalsteps = await ctx.canvas.loadImage(
      `${testcanvas}${resolve(dirname, `./assets/img/card`, `portal.png`)}`
    );
    const chooseRout = route
      ? route.children.map(async (r) => {
          const type = r.type;
          const i = await ctx.canvas.loadImage(
            `${testcanvas}${resolve(
              dirname,
              `./assets/img/card`,
              `${type}.png`
            )}`
          );
          return i;
        })
      : buffs.map(async (b) => {
          const type = b.type;
          const i = await ctx.canvas.loadImage(
            `${testcanvas}${resolve(
              dirname,
              `./assets/img/card`,
              `${type}.png`
            )}`
          );
          return i;
        });
    const width = 500;
    const height = 333;
    const RoutImage = await Promise.all(chooseRout);
    return ctx.canvas.render(width, height, async (c) => {
      c.fillStyle = "rgb(255, 255, 255)";
      c.font = "bold 30px";
      c.fillRect(0, 0, 500, 333);
      c.drawImage(portalBack, 0, 0, 500, 333);

      for (let i = 0; i < RoutImage.length; i++) {
        const cy = height - 70;
        const cx =
          ((width - RoutImage.length * 90) / (RoutImage.length + 1)) * (i + 1) +
          i * 90;
        c.drawImage(portalsteps, cx, cy - 130);
        route ? c.fillText(names[i], cx + 17, cy - 140) : null;
        c.fillText(String(i + 1), cx + 35, cy + 20);
        c.drawImage(RoutImage[i], cx + 15, cy - 100, 60, 60);
      }
    });
  }

  async function drawHand(Images: [string, Element, number][]) {
    const handImages = Images.map((image) => {
      return image[1].attrs.src;
    });
    const width = 1000;
    const height = 500 * 2 + (Math.ceil(Images.length / 3) - 2) * 422;
    return ctx.canvas.render(width, height, async (c) => {
      c.fillStyle = "rgb(128, 152, 199)";
      c.fillRect(0, 0, width, height);
      c.globalAlpha = 0.1;
      for (let i = 0; i < 20; i++) {
        c.fillStyle = i % 2 === 0 ? "rgb(86, 105, 143)" : "rgb(194, 122, 164)";
        c.fillRect(0, i * 60, width, 30);
      }
      c.globalAlpha = 1.0;
      const numCards = handImages.length;
      const cardsPerRow = 3;
      const horizontalGap = 40;
      const verticalGap = 20;
      const totalCardWidth = width * 0.85;
      const cardWidth =
        (totalCardWidth - horizontalGap * (cardsPerRow - 1)) / cardsPerRow;
      const cardAspect = 670 / 445;
      const cardHeight = cardWidth * cardAspect;
      const leftMargin = (width - totalCardWidth) / 2;
      const cx = width / 2;
      c.font = "bold 50px";
      c.fillStyle = "#ffffff";
      c.textAlign = "center";
      c.fillText("当前手牌", cx, 80);
      const images = await Promise.all(
        handImages.map((path) => ctx.canvas.loadImage(path))
      );
      for (let i = 0; i < numCards; i++) {
        const row = Math.floor(i / cardsPerRow);
        const col = i % cardsPerRow;
        const x = leftMargin + col * (cardWidth + horizontalGap);
        const y = 120 + row * (cardHeight + verticalGap);
        c.save();
        c.shadowColor = "rgba(0, 0, 0, 0.7)";
        c.shadowOffsetX = 5;
        c.shadowOffsetY = 5;
        c.shadowBlur = 10;
        c.drawImage(images[i], x, y, cardWidth, cardHeight);
        c.restore();
      }
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillStyle = "white";
      c.font = "15px";

      c.font = "24px";
      c.fillStyle = "#ccddee";
      c.textAlign = "center";
      c.fillText("使用 1-5 数字键选择卡牌", cx, height - 40);
    });
  }

  function keyboardItem(length: number, cards: RougueCard[], serId) {
    let buttonList: any[] = [];
    let rowList: any[] = [];
    // const line=length%5
    for (let i = 0; i < length; i++) {
      buttonList.push(
        button(
          0,
          cards[i].name,
          "卡牌战斗 " + cards[i].name,
          serId,
          cards[i].name
        )
      );
      if (buttonList.length == 3) {
        rowList.push({
          buttons: buttonList,
        });
        buttonList = [];
      }
      if (i == length - 1 && buttonList.length > 0) {
        rowList.push({
          buttons: buttonList,
        });
        buttonList = [];
      }
    }
    return rowList;
  }

  async function drawEnemy(Images: [string, Element, number][]) {
    const handImages = Images.map((image) => {
      return image[1].attrs.src;
    });
    const width = 1000;
    const height = 422 + (Math.ceil(Images.length / 3) - 2) * 422;

    return ctx.canvas.render(width, height, async (c) => {
      c.fillStyle = "rgb(128, 152, 199)";
      c.fillRect(0, 0, width, height);
      c.globalAlpha = 0.1;
      for (let i = 0; i < 20; i++) {
        c.fillStyle = i % 2 === 0 ? "rgb(86, 105, 143)" : "rgb(194, 122, 164)";
        c.fillRect(0, i * 60, width, 30);
      }
      c.globalAlpha = 1.0;
      const numCards = handImages.length;
      const cardsPerRow = 5;
      const horizontalGap = 40;
      const verticalGap = 20;
      const totalCardWidth = width * 0.85;
      const cardWidth =
        (totalCardWidth - horizontalGap * (cardsPerRow - 1)) / cardsPerRow;
      const cardAspect = 670 / 445;
      const cardHeight = cardWidth * cardAspect;
      const leftMargin = (width - totalCardWidth) / 2;
      const cx = width / 2;
      const images = await Promise.all(
        handImages.map((path) => ctx.canvas.loadImage(path))
      );
      for (let i = 0; i < numCards; i++) {
        const row = Math.floor(i / cardsPerRow);
        const col = i % cardsPerRow;
        const x = leftMargin + col * (cardWidth + horizontalGap);
        const y = 120 + row * (cardHeight + verticalGap);
        c.save();
        c.shadowColor = "rgba(0, 0, 0, 0.7)";
        c.shadowOffsetX = 5;
        c.shadowOffsetY = 5;
        c.shadowBlur = 10;
        c.drawImage(images[i], x, y, cardWidth, cardHeight);
        c.restore();
      }
    });
  }
  async function processCards(player: CardCharacter, enemy: Enemy) {
    const processCard = async (
      card: RougueCard,
      showFront: boolean
    ): Promise<[string, Element, number]> => {
      const name = card.name;
      const cost = card.cost;
      const image = showFront ? (
        await card.drawCard(ctx)
      ) : (
        <img src={resolve(dirname, `./assets/img/card`, `cardback.png`)} />
      );
      return [name, image, cost];
    };
    const playerHandArray = player.currentHand || [];
    const enemyTakeCardArray = enemy.takeCard || [];
    const enemyCurrentHandArray = enemy.currentHand || [];
    const [playerCards, enemyTakeCards, enemyHiddenCards] = await Promise.all([
      Promise.all(playerHandArray.map((card) => processCard(card, true))),
      Promise.all(enemyTakeCardArray.map((card) => processCard(card, true))),
      Promise.all(
        enemyCurrentHandArray.map((card) => processCard(card, false))
      ),
    ]);

    return {
      playerHand: playerCards,
      enemyHand: [...enemyTakeCards, ...enemyHiddenCards],
    };
  }
}
