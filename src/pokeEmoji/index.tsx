import { $, Context, h } from "koishi";
import { Emojis } from "./type";
import { emojis, emojis2, skills } from "../utils/data";
import { button, sendMarkdown, toUrl } from "../utils/method";
import crypto from "crypto";
import { legendaryPokemonId } from "..";
import Type from "../assets/json/pokemonType.json";

export async function apply(ctx: Context) {
  ctx.model.extend("pokeEmoji_BOT", {
    id: "string",
    pokeEmoji: "string",
    isGameing: "boolean",
    answer: "string",
    pos: "boolean",
    isOver: "boolean",
    round: { type: "unsigned", initial: 0, nullable: false },
    goldPool: { type: "unsigned", initial: 0, nullable: false },
    img: "text",
  });
  ctx
    .command("emoji.s", "emoji猜宝可梦")
    .option("round", "-r", { fallback: 5 })
    .action(async ({ session, options }) => {
      const chance = Math.floor(Math.random() * 2) == 0;
      const emojiListChoice = chance ? emojis : emojis2;
      const rounds = Number(options.round);
      const baseGold = 5000;
      let goldPools = 0;
      let img = "";
      const whichOne = Math.floor(Math.random() * emojiListChoice.length);
      const emoji = emojiListChoice[whichOne];
      const type = (
        chance ? Type[whichOne].type : skills.skills[whichOne + 1].type
      ).replace(/:/g, " ");
      let [groupGame] = await ctx.database.get("pokeEmoji_BOT", {
        id: session.channelId,
      });

      if (!groupGame) {
        goldPools = baseGold;
        img = (
          await EmojiHtml(
            ctx,
            "",
            emoji.emoji,
            `${emoji.ch.length}字 ${type}属性${
              chance ? "宝可梦" : "宝可梦技能"
            }`
          )
        ).attrs.src;
        groupGame = await ctx.database.create("pokeEmoji_BOT", {
          id: session.channelId,
          pokeEmoji: emoji.emoji,
          isGameing: false,
          answer: emoji.ch,
          pos: chance,
          isOver: false,
          round: rounds,
          goldPool: baseGold,
          img: img,
        });
      } else {
        goldPools = groupGame.goldPool + baseGold;
        if (!groupGame?.isOver) {
          const url = await toUrl(ctx, session, groupGame.img);
          const md = `![img#500px #500px](${url})
---

> 当前金币池：${groupGame.goldPool} 金币`;
          const kb = {
            keyboard: {
              content: {
                rows: [
                  {
                    buttons: [
                      button(
                        2,
                        `回答`,
                        "/emoji.g ",
                        session.userId,
                        "1",
                        false
                      ),
                    ],
                  },
                ],
              },
            },
          };
          await sendMarkdown(ctx, md, session, kb);
          return;
        }
        img = (
          await EmojiHtml(
            ctx,
            "",
            emoji.emoji,
            `${emoji.ch.length}字 ${type}属性${
              chance ? "宝可梦" : "宝可梦技能"
            }`
          )
        ).attrs.src;
        await ctx.database.set(
          "pokeEmoji_BOT",
          { id: session.channelId },
          (row) => ({
            pokeEmoji: emoji.emoji,
            isGameing: false,
            answer: emoji.ch,
            pos: chance,
            isOver: false,
            round: rounds,
            goldPool: $.add(row.goldPool, baseGold),
            img: img,
          })
        );
      }
      const url = await toUrl(ctx, session, img);
      const md = `![img#500px #500px](${url})
---

> 当前金币池：${goldPools} 金币`;
      const kb = {
        keyboard: {
          content: {
            rows: [
              {
                buttons: [
                  button(2, `回答`, "/emoji.g ", session.userId, "1", false),
                ],
              },
            ],
          },
        },
      };
      await sendMarkdown(ctx, md, session, kb);
    });
  ctx
    .command("emoji.g [answer:string]", "猜宝可梦")
    .action(async ({ session }, answer) => {
      const [groupGame] = await ctx.database.get("pokeEmoji_BOT", {
        id: session.channelId,
      });
      const [player] = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      if (!player) {
        try {
          await session.execute(`签到`);
          return;
        } catch (e) {
          return `${h("at", {
            id: session.userId,
          })}请先输入 签到 领取属于你的宝可梦和精灵球`;
        }
      }
      if (player.gold < 2000) {
        return "金币不足";
      }
      if (!groupGame) {
        return "====请先开始游戏====";
      }
      if (groupGame.isOver) {
        return "====请先开始游戏====";
      }
      if (groupGame.isGameing) {
        return "输入过快";
      }
      await ctx.database.set(
        "pokeEmoji_BOT",
        { id: session.channelId },
        (row) => ({
          isGameing: true,
        })
      );
      await ctx.database.set("pokebattle", { id: session.userId }, (row) => ({
        gold: $.sub(row.gold, 2000),
      }));
      const winOrLose = answer === groupGame.answer;
      const vipSus = player.vip > 0 ? Math.random() * 100 <= 5 : false;
      const pieceCard =
        player.pieceCard + (winOrLose ? (player.vip > 0 ? 2 : 1) : 0);
      const addCard = Math.floor(pieceCard / 20);
      const loseCard = pieceCard % 20;
      if (answer === groupGame.answer || groupGame.round <= 1) {
        const legendaryPokemonRandom = Math.random() * 100;
        const isEvent = player.lap < 3 || player.level < 90;
        const isLegendaryPokemon =
          isEvent || legendaryPokemonRandom <= 99 - player.cyberMerit * 0.04;

        await ctx.database.set(
          "pokeEmoji_BOT",
          { id: session.channelId },
          (row) => ({
            ...row,
            isGameing: false,
            isOver: true,
            goldPool: winOrLose ? 0 : $.add(row.goldPool, 2000),
          })
        );
        winOrLose
          ? await ctx.database.set(
              "pokebattle",
              { id: session.userId },
              (row) => ({
                gold: $.add(row.gold, groupGame.goldPool),
                signCard: $.add(row.signCard, addCard + (vipSus ? 1 : 0)),
                pieceCard: loseCard,
              })
            )
          : null;
        const img = (
          await EmojiHtml(
            ctx,
            groupGame.pokeEmoji,
            groupGame.answer,
            `${player.name}回答${winOrLose ? "正确" : "错误"}`
          )
        ).attrs.src;
        try {
          const url = await toUrl(ctx, session, img);
          const md = `![img#500px #500px](${url})${
            isLegendaryPokemon || !winOrLose
              ? ``
              : `
<@${session.userId}>请注意，有传说宝可梦接近`
          }${
            winOrLose
              ? `
---
> 获得 ${player.vip > 0 ? 2 : 1} 补签卡精华
> 获得 ${groupGame.goldPool} 金币，已扣除答题所用2000金币${
                  vipSus
                    ? `
> 精英训练师人品爆发 补签卡+1`
                    : ""
                }

---
> 补签卡精华：${pieceCard} 
> 补签卡：${player.signCard + addCard + (vipSus ? 1 : 0)}`
              : ``
          }`;
          const kb = {
            keyboard: {
              content: {
                rows: [
                  {
                    buttons: [
                      button(
                        2,
                        `继续猜emoji`,
                        "/emoji.s ",
                        session.userId,
                        "1",
                        true
                      ),
                    ],
                  },
                ],
              },
            },
          };
          await sendMarkdown(ctx, md, session, kb);
        } catch (e) {
          await session.send(<img src={img} />);
        }
        if (winOrLose && !isLegendaryPokemon) {
          const key = crypto
            .createHash("md5")
            .update(session.userId + new Date().getTime())
            .digest("hex")
            .toUpperCase();
          legendaryPokemonId[key] = "349.349";
          await ctx.setTimeout(() => {
            delete legendaryPokemonId[key];
          }, 2000);
          await session.execute(`捕捉宝可梦 ${key}`);
        }
        return;
      }
      await ctx.database.set(
        "pokeEmoji_BOT",
        { id: session.channelId },
        (row) => ({
          round: $.sub(row.round, 1),
          isGameing: false,
          goldPool: $.add(row.goldPool, 2000),
        })
      );
      const md = `扣除2000金币加入金币池
回答错误

---

> 当前金币池：${groupGame.goldPool + 2000}
> 还有 ${groupGame.round - 1} 次答题机会`;
      const kb = {
        keyboard: {
          content: {
            rows: [
              {
                buttons: [
                  button(2, `回答`, "/emoji.g ", session.userId, "1", false),
                ],
              },
            ],
          },
        },
      };
      await sendMarkdown(ctx, md, session, kb);
      return;
    });
}

async function EmojiHtml(ctx, emoji: string, ch: string, chance: string) {
  const dataUrl = await ctx.canvas.render(500, 500, async (ctx) => {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 500, 300);
    ctx.fillStyle = "#D3D3D3";
    ctx.fillRect(0, 300, 500, 500);

    // Draw first line of text
    ctx.font = "50px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000";
    ctx.fillText(emoji, 500 / 2, 150);

    // Draw second line of text
    ctx.fillText(ch, 500 / 2, 220);

    // Draw third line of text
    ctx.font = "20px Arial";
    ctx.fillText(chance, 500 / 2, 400);
  });

  return dataUrl;
}
