import { $, Context, Schema } from "koishi";
import {
  LabelData,
  MovesData,
  PokemonData,
  AbilitiesData,
} from "../utils/data";
import canvas from "koishi-plugin-canvas";
import { PokemonInfo } from "./type";
import { drawAll, getPokemonInfo, markSameValues } from "./method";
import { button, sendMarkdown, toUrl } from "../utils/method";
import { dirname } from "../dirname";
import { resolve } from "path";

export function apply(ctx: Context) {
  ctx
    .command("pokemole.s")
    .alias("随机宝可梦")
    .action(async ({ session }) => {
      const picW = 1200;
      const channelId = session.channelId;
      const [channelGame] = await ctx.database.get("pokemole", {
        id: channelId,
      });
      if (channelGame && !channelGame.isOver) {
        const list = channelGame.answerList;
        const img = await drawAll(ctx, list);
        const md = `游戏以及开始,请继续猜测！
${
  channelGame.answerList.length > 0
    ? `![img#${picW}px #${
        40 +
        channelGame.answerList.length * 120 +
        (channelGame.answerList.length - 1) * 20
      }px](${await toUrl(ctx, session, img.attrs.src)})`
    : ""
}`;
        const kbd = {
          keyboard: {
            content: {
              rows: [
                {
                  buttons: [
                    button(
                      2,
                      "继续猜测",
                      "pokemole.g",
                      session.userId,
                      "猜测",
                      false
                    ),
                  ],
                },
              ],
            },
          },
        };
        await sendMarkdown(ctx, md, session, kbd);
        return;
      }
      const p = PokemonData[Math.floor(Math.random() * PokemonData.length)];
      channelGame
        ? await ctx.database.set("pokemole", { id: channelId }, (row) => ({
            isGameing: true,
            isOver: false,
            answerList: [],
            answer: p.name,
            round: 0,
          }))
        : await ctx.database.create("pokemole", {
            id: channelId,
            isGameing: false,
            isOver: false,
            answerList: [],
            answer: p.name,
            round: 0,
          });
      const md = `游戏开始,请猜一个任意宝可梦!`;
      const kbd = {
        keyboard: {
          content: {
            rows: [
              {
                buttons: [
                  button(
                    2,
                    "猜测",
                    "pokemole.g",
                    session.userId,
                    "猜测",
                    false
                  ),
                ],
              },
            ],
          },
        },
      };
      await sendMarkdown(ctx, md, session, kbd);
    });

  ctx
    .command("pokemole.g <name:text>")
    .alias("猜测宝可梦")
    .action(async ({ session }, name) => {
      const channelId = session.channelId;
      const [channelGame] = await ctx.database.get("pokemole", {
        id: channelId,
      });
      const [player] = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      if (!player) {
        return "请先签到继续注册";
      }
      if (!channelGame || channelGame.isOver) {
        return "请先开始游戏！";
      }
      await ctx.database.set("pokemole", { id: channelId }, (row) => ({
        isGameing: true,
      }));
      if (channelGame.isGameing) {
        return "输入过快了,请稍等!如果出现bug无法继续游戏,@麦麦子后输入 停止猜宝可梦 ";
      }
      const p = PokemonData.find((i) => i.name == name);
      if (!p) {
        return "宝可梦不存在！";
      }
      const answerJson = PokemonData.find((i) => i.name == channelGame.answer);
      const answerInfo = getPokemonInfo(answerJson);
      const pinfo = markSameValues(answerInfo, getPokemonInfo(p));
      const isSame = channelGame.answerList.some(
        (i) => i.sections[0].value[0] == p.name
      );
      if (isSame) {
        return "你已经猜过了！";
      }

      //猜测正确
      if (p.name == channelGame.answer) {
        const golden = 5000 * channelGame.round * player.vip > 0 ? 1.5 : 1;
        channelGame.isOver = true;
        channelGame.isGameing = false;
        channelGame.answerList = [];
        channelGame.round = 0;
        const nameimg = answerJson.forms[0].image;
        const md = `恭喜你猜对了,奖励${golden}金币!
![img#500px #500px](${await toUrl(
          ctx,
          session,
          `file://${resolve(dirname, `./pokemole/data/official`, nameimg)}`
        )})`;
        const kbd = {
          keyboard: {
            content: {
              rows: [
                {
                  buttons: [
                    button(2, "继续游戏", "pokemole.s", session.userId, "开始"),
                  ],
                },
              ],
            },
          },
        };
        await sendMarkdown(ctx, md, session, kbd);
        await ctx.database.set(
          "pokemole",
          { id: channelId },
          {
            isOver: true,
            isGameing: false,
            answerList: [],
            round: 0,
          }
        );
        await ctx.database.set("pokebattle", { id: session.userId }, (row) => ({
          gold: $.add(row.gold, golden),
        }));
        return;
      }
      //猜测错误
      channelGame.answerList.push(pinfo);
      const img = await drawAll(ctx, channelGame.answerList);
      const md = `猜测错误,游戏继续!
![img#1200px #${
        40 +
        channelGame.answerList.length * 120 +
        (channelGame.answerList.length - 1) * 20
      }px](${await toUrl(ctx, session, img.attrs.src)})`;
      const kbd = {
        keyboard: {
          content: {
            rows: [
              {
                buttons: [
                  button(
                    2,
                    "继续猜测",
                    "pokemole.g",
                    session.userId,
                    "猜测",
                    false
                  ),
                ],
              },
            ],
          },
        },
      };
      await sendMarkdown(ctx, md, session, kbd);
      if (channelGame.round == 10) {
        channelGame.isOver = true;
        channelGame.isGameing = false;
        channelGame.answerList = [];
        channelGame.round = -1;
        const nameimg = answerJson.forms[0].image;
        const md = `游戏结束,你没有猜对,正确答案是:
![img#500px #500px](${await toUrl(
          ctx,
          session,
          `file://${resolve(dirname, `./pokemole/data/official`, nameimg)}`
        )})`;

        const kbd = {
          keyboard: {
            content: {
              rows: [
                {
                  buttons: [
                    button(2, "继续游戏", "pokemole.s", session.userId, "开始"),
                  ],
                },
              ],
            },
          },
        };
        await sendMarkdown(ctx, md, session, kbd);
      }
      await ctx.database.set(
        "pokemole",
        { id: channelId },
        {
          isOver: channelGame.isOver,
          isGameing: false,
          answerList: channelGame.answerList,
          round: channelGame.round + 1,
        }
      );
    });
  ctx.command("textss").action(async ({ session }) => {
    const p = PokemonData[20];
    const p1 = PokemonData[Math.floor(Math.random() * PokemonData.length)];
    const p2 = PokemonData[Math.floor(Math.random() * PokemonData.length)];
    const data = [
      markSameValues(getPokemonInfo(p), getPokemonInfo(p1)),
      markSameValues(getPokemonInfo(p), getPokemonInfo(p2)),
    ];
    const img = await drawAll(ctx, data);
    return img;
  });
  ctx
    .command("pokemole.stop")
    .alias("停止猜宝可梦")
    .action(async ({ session }) => {
      const channelId = session.channelId;
      const [channelGame] = await ctx.database.get("pokemole", {
        id: channelId,
      });
      if (!channelGame) {
        return "请先开始游戏！";
      }
      if (channelGame.isOver) {
        return "游戏已经结束！";
      }
      await ctx.database.set("pokemole", { id: channelId }, (row) => ({
        isOver: true,
        isGameing: false,
        answerList: [],
        round: 0,
      }));
      return "游戏已经结束！正确答案是 : " + channelGame.answer;
    });
}
