import { $, Context, Element, h, Session } from "koishi";
import {
  CardCharacter,
  CardPlayer,
  CombatContext,
  Enemy,
  HealItemType,
  RougueCard,
} from "./type";
import { initType } from "./method";
import { Robot } from "../utils/robot";
import { resolve } from "path";
import { dirname } from "../dirname";
import { sendMarkdown, toUrl } from "../utils/method";
import { displayRoute, RouteGenerator } from "./route";
import { BuffConfig, BuffFactory, BuffType } from "./buff";
import { Rarity } from "../fishing/type";

export async function apply(ctx: Context) {
  // const routeGenerator = new RouteGenerator(21);

  // let gameMap = routeGenerator.generateInitialRoute();

  // console.log(displayRoute(gameMap));

  // for (let i = 0; i < 20; i++) {
  //   const selectedNode = gameMap.children[1];
  //   try {
  //     routeGenerator.exploreNode(selectedNode);
  //   } catch (e) {
  //     console.log(selectedNode);
  //   }
  //   console.log(displayRoute(gameMap));
  //   gameMap = selectedNode;
  // }

  ctx.command("card-battle", "卡牌对战").action(async ({ session }) => {
    const a = new Robot(100);
    a.itemBag = [
      {
        name: "毒药",
        type: "poison",
        level: 2,
      },
    ];
    const b = new Robot(100);
    a.itemBag = [
      {
        name: "毒药",
        type: "poison",
        level: 2,
      },
    ];

    const a1 = new Enemy(a);
    const b1 = new CardPlayer(b);
    let context = {
      player: b1,
      self: a1,
      currentEnergy: 0,
      turnCount: 0,
      logs: [],
    };
    a1.drawHand(5);
    b1.drawHand(5);
    a1.act(context);
    a1.act(context);
    a1.act(context);
    const md = await toMarkDown(b1, a1, context, session);
    await sendMarkdown(ctx, md, session);
    // battleLoop: while (a1.currentHp > 0 && b1.currentHp > 0) {
    //   a1.drawHand(5);
    //   b1.drawHand(5);
    //   const statusStartLogA = a1.processTurnStart();
    //   if (statusStartLogA.length > 0) console.log("a开始：" + statusStartLogA);
    //   while (a1.energy > 0) {
    //     let l = a1.act(context);
    //     if (!l) break;
    //     console.log(
    //       l + "  " + b1.currentHp + "  " + b1.armor + "  " + a1.energy
    //     );
    //     if (b1.currentHp <= 0) {
    //       break battleLoop;
    //     }
    //   }
    //   a1.discardCard();
    //   const statusEndLogA = a1.processTurnEnd();
    //   if (statusEndLogA.length > 0) console.log("a结束:" + statusEndLogA);
    //   context.player = a1;
    //   context.self = b1;
    //   const statusStartLogB = b1.processTurnStart();
    //   if (statusStartLogB.length > 0) console.log("b开始：" + statusStartLogB);
    //   while (b1.energy > 0) {
    //     b1.drawHand(5);
    //     let l = b1.act(context);
    //     if (!l) break;
    //     console.log(
    //       l + "  " + a1.currentHp + "  " + a1.armor + "  " + b1.energy
    //     );
    //     if (a1.currentHp <= 0) {
    //       break battleLoop;
    //     }
    //   }
    //   b1.discardCard();
    //   const statusEndLogB = b1.processTurnEnd();
    //   if (statusEndLogB.length > 0) console.log("b结束:" + statusEndLogB);
    //   context.player = b1;
    //   context.self = a1;
    // }

    // const a1: CardPlayer = new CardPlayer(a);

    // a1.drawHand(5);
    // let playerHand: [string, Element, number][] = [];
    // for (let i = 0; i < a1.currentHand.length; i++) {
    //   const name = a1.currentHand[i].name;
    //   const image = await a1.currentHand[i].drawCard(ctx);
    //   const cost = a1.currentHand[i].cost;
    //   playerHand.push([name, image, cost]);
    // }
    // const hands = await drawHand(playerHand);
    // return hands;
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
    const [playerCards, enemyTakeCards, enemyHiddenCards] = await Promise.all([
      Promise.all(player.currentHand.map((card) => processCard(card, true))),
      Promise.all(enemy.takeCard.map((card) => processCard(card, true))),
      Promise.all(enemy.currentHand.map((card) => processCard(card, false))),
    ]);

    return {
      playerHand: playerCards,
      enemyHand: [...enemyTakeCards, ...enemyHiddenCards],
    };
  }
}
