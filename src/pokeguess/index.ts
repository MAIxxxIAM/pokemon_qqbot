import { $, h } from "koishi";
import { config } from "..";
import {
  button,
  isResourceLimit,
  isVip,
  sendMarkdown,
  toUrl,
} from "../utils/method";
import { PokeGuess } from "./pokeguess";
import { Pokebattle, PrivateResource } from "../model";
import { Pokedex } from "../pokedex/pokedex";
import crypto from "crypto";
import { legendaryPokemonId } from "..";
import pokemonCal from "../utils/pokemon";
import { getUknowns } from "../pokedle/src/utils/motheds";
import { dirname } from "../dirname";
import { resolve } from "path";

export async function apply(ctx) {
  ctx
    .command("宝可梦")
    .subcommand("宝可问答", "回答问题，获得奖励")
    .action(async ({ session }) => {
      const q = new PokeGuess();
      const qImage = await q.q(ctx);
      const aImage = await q.a(ctx);
      const [player]: Pokebattle[] = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      if (!player) {
        await session.execute("签到");
        return;
      }

      const vip = isVip(player);
      const vipRGold = vip ? 1500 : 0;
      try {
        await session.bot.internal.sendMessage(session.channelId, {
          content: "111",
          msg_type: 2,
          markdown: {
            custom_template_id: config.MDid,
            params: [
              {
                key: config.key1,
                values: [`请<@${session.userId}>听题：\r\r 猜猜我的父母是谁`],
              },
              {
                key: config.key2,
                values: ["[img#458px #331px]"],
              },
              {
                key: config.key3,
                values: [await toUrl(ctx, session, qImage)],
              },
              {
                key: config.key4,
                values: [`猜猜我是谁`],
              },
              {
                key: config.key6,
                values: [`本题答题时间30秒`],
              },
            ],
          },
          keyboard: {
            content: {
              rows: [
                {
                  buttons: [
                    button(0, q.name[0], q.name[0], session.userId, "1"),
                    button(0, q.name[1], q.name[1], session.userId, "2"),
                  ],
                },
                {
                  buttons: [
                    button(0, q.name[2], q.name[2], session.userId, "1"),
                    button(0, q.name[3], q.name[3], session.userId, "2"),
                  ],
                },
              ],
            },
          },
          msg_id: session.messageId,
          timestamp: session.timestamp,
          msg_seq: Math.floor(Math.random() * 1000000),
        });
      } catch (e) {
        await session.send(`${h("at", { id: session.userId })}请听题：
${h("image", { url: qImage })}
猜猜我的父母是谁
本题答题时间60秒
1·${q.name[0]}
2·${q.name[1]}
3·${q.name[2]}
4·${q.name[3]}
回复机器人输入答案序号或者答案文字`);
      }
      const answer = await session.prompt(60000);
      if (!answer) {
        try {
          await session.send(`时间到，答题结束`);
          await session.bot.internal.sendMessage(session.channelId, {
            content: "111",
            msg_type: 2,
            keyboard: {
              content: {
                rows: [
                  {
                    buttons: [
                      button(
                        2,
                        "📜 继续答题",
                        `/宝可问答`,
                        session.userId,
                        "1"
                      ),
                      button(
                        2,
                        "💳 查看信息",
                        "/查看信息",
                        session.userId,
                        "2"
                      ),
                    ],
                  },
                ],
              },
            },
            msg_id: session.messageId,
            timestamp: session.timestamp,
            msg_seq: Math.floor(Math.random() * 1000000),
          });
          return;
        } catch {
          await session.send(`时间到，答题结束`);
          return;
        }
      }
      let y_n: boolean;
      switch (answer) {
        case "1":
        case q.name[0]:
          y_n = q.which === 0;
          break;
        case "2":
        case q.name[1]:
          y_n = q.which === 1;
          break;
        case "3":
        case q.name[2]:
          y_n = q.which === 2;
          break;
        case "4":
        case q.name[3]:
          y_n = q.which === 3;
          break;
      }
      const right = q.name[q.which];
      let end: string;
      let y = "";
      if (player.ultramonster.length > 0) {
        y = `,当前回答受到传说中的宝可梦的加成，奖励增加`;
      }
      const legendaryPokemonRandom = Math.floor(Math.random() * 100);
      if (y_n) {
        const resource = await isResourceLimit(session.userId, ctx);
        const rLimit = new PrivateResource(resource.resource.goldLimit);
        const order = "abcdefghijklmnopqrstuvwxyz?!";
        const getUnknown = getUknowns();
        const isUnknown = player.unknowns_bag.some(
          (item) => item.id === getUnknown.id
        );
        const hasUnknown = isUnknown || player.lap !== 3;
        hasUnknown ? null : player.unknowns_bag.push(getUnknown);
        player.vip > 0 ? await rLimit.addGold(ctx, 0.25, session.userId) : null;
        const addMerits =
          player.cyberMerit > 95
            ? 100 - player.cyberMerit <= 0
              ? 0
              : 100 - player.cyberMerit
            : 5;
        await ctx.database.set("pokebattle", { id: session.userId }, (row) => ({
          unknowns_bag: player.unknowns_bag.sort(
            (a, b) => order.indexOf(a.id) - order.indexOf(b.id)
          ),
          gold: $.if(
            $.lt(row.lap, 3),
            $.add(
              row.gold,
              750 * Math.max(Math.floor(player.checkInDays / 3), 1) +
                vipRGold +
                200 * player.ultramonster.length
            ),
            row.gold
          ),
          cyberMerit: $.add(row.cyberMerit, addMerits),
        }));
        if (player.lap == 3) {
          await ctx.database.set(
            "pokemon.resourceLimit",
            { id: session.userId },
            (row) => ({
              rankScore: $.if(
                $.eq(player.lap, 3),
                $.add(
                  row.rankScore,
                  50 * Math.max(Math.floor(player.checkInDays / 3), 1)
                ),
                row.rankScore
              ),
            })
          );
        }

        //  const legendaryPokemonRandom = 99
        // let addgole = 1000 + vipRGold + 200 * player.ultramonster.length
        // const resource = await isResourceLimit(session.userId, ctx)
        // const rLimit = new PrivateResource(resource.resource.goldLimit)
        // addgole =await rLimit.getGold(ctx, addgole, session.userId)
        // player.gold += addgole
        const isEvent = player.lap < 3 || player.level < 90;
        const events =
          `赛博功德+5` +
          (legendaryPokemonRandom > 99 - player.cyberMerit * 0.02
            ? `有个身影为你点赞`
            : ``);
        const unUrl = await toUrl(
          ctx,
          session,
          `file://${resolve(
            dirname,
            `./assets/img/unknown/${getUnknown.id
              .replace(/!/g, "gt")
              .replace(/\?/g, "wh")}.png`
          )}`
        );
        end = `太棒了，你猜出来了！
${
  player.lap == 3
    ? `积分+${50 * Math.max(Math.floor(player.checkInDays / 3), 1)} `
    : `金币+${
        750 * Math.max(Math.floor(player.checkInDays / 3), 1) +
        vipRGold +
        200 * player.ultramonster.length
      }`
} ${player.vip > 0 ? `金币上限+2500` : ``}
${!isEvent ? events : ""}
${
  player.lap == 3
    ? !isUnknown
      ? `![img#20px #20px](${unUrl})你获得了${getUnknown.name}`
      : `你已经有了${getUnknown.name}`
    : ""
}`;
        // player.lap==3?await ctx.database.set('pokemon.resourceLimit', { id: player.id}, row =>
        //   ({
        //     rankScore: $.add(row.rankScore, 5),
        //   })
        //   ):null
      } else {
        end = `回答错误\r正确答案是${right}`;
      }

      try {
        const kb = {
          keyboard: {
            content: {
              rows: [
                {
                  buttons: [
                    button(2, "📜 继续答题", `/宝可问答`, session.userId, "1"),
                    button(2, "💳 查看信息", "/查看信息", session.userId, "2"),
                  ],
                },
                {
                  buttons: [
                    button(2, "？？未知图腾", "/未知图腾", session.userId, "3"),
                  ],
                },
              ],
            },
          },
        };
        await sendMarkdown(
          ctx,
          `<@${session.userId}>问答结果：
![img#458px #331px](${await toUrl(ctx, session, aImage)})

> ` +
            end +
            `
当前金币：${
              player.gold +
              (player.lap > 2
                ? 0
                : 750 * Math.max(Math.floor(player.checkInDays / 3), 1) +
                  vipRGold +
                  200 * player.ultramonster.length)
            }`,
          session,
          kb
        );
      } catch (e) {
        await session.send(`<@${session.userId}>问答结果：
${h("image", { url: aImage })}
${end}
当前金币：${player.gold}

---
连续签到可以让你的奖励更丰厚噢~`);
      }
      let legendaryPokemon = y_n ? "343.343" : "344.344";
      if (player.lap < 3 || player.level < 90) return;
      const pokedex = new Pokedex(player);
      if (pokedex.check(legendaryPokemon)) {
        legendaryPokemon = "347.347";
        if (pokedex.check(legendaryPokemon)) return;
      }
      legendaryPokemonRandom > 99 - player.cyberMerit * 0.04
        ? await session.send(
            `接下来你将和${pokemonCal.pokemonlist(legendaryPokemon)}对战...`
          )
        : null;
      if (legendaryPokemonRandom > 99 - player.cyberMerit * 0.04) {
        const key = crypto
          .createHash("md5")
          .update(session.userId + new Date().getTime())
          .digest("hex")
          .toUpperCase();
        legendaryPokemonId[key] = legendaryPokemon;
        await session.execute(`捕捉宝可梦 ${key}`);
        await ctx.setTimeout(() => {
          delete legendaryPokemonId[key];
        }, 2000);
      }
      return;
    });
}
