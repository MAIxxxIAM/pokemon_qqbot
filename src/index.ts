import { Schema, h, $, Session, is, Logger } from "koishi";
import pokemonCal from "./utils/pokemon";
import * as pokeGuess from "./pokeguess";
import { fishing } from "./utils/data";
import {} from "koishi-plugin-cron";
import {
  button,
  catchbutton,
  findItem,
  getPic,
  toUrl,
  urlbutton,
  getType,
  isVip,
  isResourceLimit,
  getWildPic,
  sendMsg,
  getMarkdownParams,
  sendMarkdown,
  normalKb,
  getChance,
  censorText,
  getList,
  findFusion,
  actionbutton,
} from "./utils/method";
import { resolve } from "path";
import * as fs from "fs";
import * as path from "path";
import os from "os";
import pidusage from "pidusage";
import * as lapTwo from "./lap/index";
import * as cardTest from "./card_battle/index";
import * as pokedex from "./pokedex/pokedex";
import * as notice from "./notice/index";
import * as fishings from "./fishing/index";
import * as pokeEmoji from "./pokeEmoji/index";
import * as pokemole from "./pokemole/index";
// import * as faketest from "./aigc/index";
import * as formGame from "./farm/index";
import crypto from "crypto";
import * as digGame from "./dig_game/index";
import * as handleAndCiying from "./pokedle/src";
import * as cry_guess from "./guess_cry/index";
import imageSize from "image-size";
import * as trainercmd from "./trainer/index";
import {} from "koishi-plugin-markdown-to-image-service";

import { Robot } from "./utils/robot";

import { expToLv, expBase, skillMachine, berry_trees } from "./utils/data";
import { Pokedex } from "./pokedex/pokedex";
import { pokebattle } from "./battle/pvp";
import {
  AddGroup,
  FusionPokemon,
  Pokebattle,
  PokemonList,
  PrivateResource,
  Resource,
  model,
  IntellegentBody,
} from "./model";
import { catchPokemon } from "./battle/pve";
import { Skill } from "./battle";
import { BerrySend, PlantTree } from "./farm/berryTreeFarm";
import { FishingGame, FishItem, Lucky } from "./fishing/type";
import { PoisonStatusHandler, StatusSystem } from "./card_battle/status";

export const name = "pokemon";

export const inject = {
  required: ["database", "downloads", "canvas", "cron"],
  optional: ["censor", "markdownToImage", "puppeteer"],
};

export const usage = ``;

export interface Config {
  指令使用日志: boolean;
  QQ官方使用MD: boolean;
  签到获得个数: number;
  是否开启友链: boolean;
  金币获取上限: number;
  精灵球定价: number;
  训练师定价: number;
  扭蛋币定价: number;
  改名卡定价: number;
  野生宝可梦难度系数: number;
  aifadian: string;
  图片源: string;
  对战cd: number;
  对战次数: number;
  捕捉等待时间: number;
  MDid: string;
  文字MDid: string;
  key1: string;
  key2: string;
  key3: string;
  key4: string;
  key5: string;
  key6: string;
  key7: string;
  key8: string;
  key9: string;
  key10: string;
  bot邀请链接: string;
  Bucket: string;
  Region: string;
  SecretId: string;
  SecretKey: string;
  ds_key: string;
}

export const Config = Schema.intersect([
  Schema.object({
    指令使用日志: Schema.boolean()
      .default(false)
      .description("是否输出指令使用日志"),
    是否开启友链: Schema.boolean().default(false).description("是否开启友链"),
  }),
  Schema.object({
    图片源: Schema.string().default(
      "https://gitee.com/maikama/pokemon-fusion-image/raw/master"
    ).description(`
# 使用网络图片：


## github源：


- https://raw.githubusercontent.com/MAIxxxIAM/pokemonFusionImage/main

## gitee源：


- https://gitee.com/maikama/pokemon-fusion-image/raw/master


# 使用本地图片：


## 图片下载地址：

- gitee:https://gitee.com/maikama/pokemon-fusion-image
- github:https://github.com/MAIxxxIAM/pokemonFusionImage


**使用pptr提供的canvas服务时，需在本地路径前加file://**
`),
  }),
  Schema.object({
    签到获得个数: Schema.number().default(2),
    金币获取上限: Schema.number().default(100000),
    精灵球定价: Schema.number().default(800),
    训练师定价: Schema.number().default(10000),
    扭蛋币定价: Schema.number().default(1500),
    野生宝可梦难度系数: Schema.number().default(1.2),
    改名卡定价: Schema.number().default(60000),
    aifadian: Schema.string().default(
      "https://afdian.net/item/f93aca30e08c11eebccb52540025c377"
    ),
    对战cd: Schema.number().default(10).description("单位：秒"),
    对战次数: Schema.number().default(15),
    捕捉等待时间: Schema.number().default(20000).description("单位：毫秒"),
  }).description("数值设置"),
  Schema.object({
    QQ官方使用MD: Schema.boolean().default(false),
  }).description("Markdown设置,需要server.temp服务"),
  Schema.union([
    Schema.object({
      QQ官方使用MD: Schema.const(true).required(),
      MDid: Schema.string().description("MD模板id"),
      文字MDid: Schema.string().description("文字MD模板id(可留空)"),
      key1: Schema.string().default("tittle").description("标题"),
      key2: Schema.string().default("imgsize").description("图片大小"),
      key3: Schema.string().default("img_url").description("图片路径"),
      key4: Schema.string().default("text1").description("宝可梦选项1"),
      key5: Schema.string().default("text2").description("宝可梦选项2"),
      key6: Schema.string().default("text3").description("宝可梦选项3"),
      key7: Schema.string().default("text4").description("宝可梦选项4"),
      key8: Schema.string().default("text5").description("宝可梦选项5"),
      key9: Schema.string().default("text6").description("宝可梦选项6"),
      key10: Schema.string().default("text7").description("宝可梦选项7"),
      bot邀请链接: Schema.string().default(
        "https://qun.qq.com/qunpro/robot/qunshare?robot_uin=3889000472&robot_appid=102072441&biz_type=0"
      ),
    }),
    Schema.object({}),
  ]),
  Schema.object({
    Bucket: Schema.string(),
    Region: Schema.string().default("ap-guangzhou"),
    SecretId: Schema.string().role("secret"),
    SecretKey: Schema.string().role("secret"),
  }),
  Schema.object({
    ds_key: Schema.string(),
  }),
]);

export let testcanvas: string;
export let logger: any;
export let shop: any[];
export let config: Config;
export let legendaryPokemonId = {};

export async function apply(ctx, conf: Config) {
  logger = ctx.logger("pokemon");
  logger.info("状态注册系统启动成功");
  config = conf;
  ctx.on("before-send", async (session: Session, msg_id) => {
    const { message } = session.event;
    if (session.scope !== "commands.help.messages") {
      return;
    }
    let content = message.elements[0].attrs.content?.split("\n");
    if (!content) return;
    content.splice(0, 2);
    content = content.map((item) => {
      const a = item.split("  ");
      a.splice(0, 2);
      return a;
    });
    let mdparam = `
指令  说明`;
    for (let i = 0; i < content.length; i++) {
      if (!content[i][0]) continue;
      mdparam += `
---
[${content[i][0]}](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
        `${content[i][0]}`
      )}&reply=false&enter=true) ${content[i][1]}
`;
    }
    try {
      // const a = await sendMsg(session)
      session.messageId = msg_id.session.event._data?.d.id;
      await sendMarkdown(ctx, mdparam, session);
      session.event.message.elements = [];
      return;
    } catch (e) {
      return;
    }
  });

  model(ctx);
  await ctx.database.set("pokebattle", {}, (row) => ({
    isfish: false,
    isMix: false,
    isPut: false,
  }));

  ctx.cron("0 0 * * *", async () => {
    await ctx.database.set("pokemon.addGroup", {}, (row) => ({
      count: 3,
    }));
    await ctx.database.set("pokemon.resourceLimit", {}, (row) => ({
      resource: new PrivateResource(config.金币获取上限),
    }));
    await ctx.database.set("intellegentBody", {}, (row) => ({
      token: $.if($.ne(row.group_open_id, ""), 7000, 1500),
    }));
    // await ctx.database.set("intellegentBody",{group_open_id:''},row=>({
    //   token:1500
    // }))
    await ctx.database.set("pokebattle", {}, (row) => ({
      vip: $.if($.gt(row.vip, 0), $.sub(row.vip, 1), 0),
      fly_count: 20,
    }));
  });

  ctx.cron("0 7 * * 1", async () => {
    const randomPlayer: Pokebattle[] = await ctx.database.get("pokebattle", {
      lap: { $eq: 3 },
    });
    const id = randomPlayer.map((item) => item.id);
    await ctx.database.set(
      "pokemon.resourceLimit",
      { id: { $in: id } },
      (row) => ({
        rankScore: 0,
      })
    );
    await ctx.database.set("pokebattle", { vip: { $gt: 0 } }, (row) => ({
      signCard: $.add(row.signCard, 1),
    }));
  });

  ctx.cron("0 0 */2 * *", async () => {
    await ctx.database.set("pokemon.resourceLimit", {}, (row) => ({
      rank: 0,
    }));
    const unplayer: Pokebattle[] = await ctx.database
      .select("pokebattle")
      .where((row) => $.or(row.advanceChance, $.eq(row.lap, 3)))
      .execute();

    const ban = unplayer.map((item) => item.id);
    const player: Resource[] = await ctx.database
      .select("pokemon.resourceLimit")
      .where({ id: { $nin: ban } })
      .orderBy("rankScore", "desc")
      .limit(10)
      .execute();

    for (let i = 0; i < player.length; i++) {
      await ctx.database.set(
        "pokemon.resourceLimit",
        { id: player[i].id },
        (row) => ({
          rank: i + 1,
        })
      );
    }
  });

  ctx.on("guild-added", async (session) => {
    const { id } = session.event._data;
    const { group_openid, op_member_openid } = session.event._data.d;
    const addGroup: AddGroup[] = await ctx.database.get("pokemon.addGroup", {
      id: op_member_openid,
    });
    let a: number;
    if (addGroup.length == 0) {
      await ctx.database.create("pokemon.addGroup", {
        id: op_member_openid,
        addGroup: [group_openid],
      });
      a = 3;
    } else {
      if (
        addGroup[0].addGroup.includes(group_openid) ||
        addGroup[0].count < 1
      ) {
        a = 0;
      } else {
        await ctx.database.set(
          "pokemon.addGroup",
          { id: op_member_openid },
          {
            count: addGroup[0].count - 1,
            addGroup: addGroup[0].addGroup.concat(group_openid),
          }
        );
        a = 3;
      }
    }
    if (a !== 0) {
      const b = await isResourceLimit(op_member_openid, ctx);
      const resource = new PrivateResource(b.resource.goldLimit);
      await resource.addGold(ctx, a, op_member_openid);
    }
    const md = `![img #408px #456px](${await toUrl(
      ctx,
      session,
      fs.readFileSync("./friendlink.png")
    )})
我是麦麦！(*/ω＼*)。
是博士做出来帮助训练师们的机器人少女噢~
✨我有好多好玩的功能！✨

---
> @麦麦后回复关闭宝可梦 可以关闭宝可梦功能
可以点我头像看 **使用文档**`;
    session.isDirect = false;
    try {
      await sendMarkdown(ctx, md, session, null, id);
    } catch (e) {}
    let [channel] = await ctx.database.get("pokemon.isPokemon", {
      id: group_openid,
    });
    if (!channel) {
      channel = await ctx.database.create(
        "pokemon.isPokemon",
        { id: group_openid },
        {
          pokemon_cmd: true,
        }
      );
    }
    await ctx.database.set(
      "pokemon.isPokemon",
      { id: group_openid },
      (row) => ({
        pokemon_cmd: true,
      })
    );
  });

  ctx.plugin(pokeGuess);
  ctx.plugin(pokeEmoji);
  ctx.plugin(notice);
  ctx.plugin(fishings);
  ctx.plugin(digGame);
  ctx.plugin(handleAndCiying);
  ctx.plugin(trainercmd);
  ctx.plugin(cry_guess);
  ctx.plugin(cardTest);
  ctx.plugin(pokemole);
  // ctx.plugin(faketest);

  if (config.指令使用日志) {
    ctx.on("command/before-execute", ({ session, command }) => {
      const freeCpu = os.freemem() / os.totalmem();
      const usedCpu = 1 - freeCpu;
      pidusage(process.pid, (err, stats) => {
        console.log(
          `${session.userId}使用了${command.name}  当前内存占用${(
            usedCpu * 100
          ).toFixed(2)}% cpu占用${stats.cpu.toFixed(2)}%`
        );
      });
    });
  }
  ctx.on("interaction/button", async (session) => {
    const { isDirect } = session;
    const { id, d } = session.event._data;
    const state = d.data.resolved.button_id;
    // if (state !== "ispokemon") return;
    const { group_openid, op_member_openid } = session.event._data.d;
    const [player] = await ctx.database.get(
      "pokebattle",
      isDirect ? d.user_openid : d.group_member_openid
    );
    if (!player) return;
    const pokeDex = new Pokedex(player);
    switch (state) {
      //ispokemon
      case "ispokemon":
        let [channel] = await ctx.database.get("pokemon.isPokemon", {
          id: group_openid,
        });
        if (!channel) {
          channel = await ctx.database.create("pokemon.isPokemon", {
            id: group_openid,
          });
        }
        await ctx.database.set(
          "pokemon.isPokemon",
          { id: group_openid },
          (row) => ({
            pokemon_cmd: $.if(row.pokemon_cmd, false, true),
          })
        );
        const md = `已${channel.pokemon_cmd ? "关闭" : "开启"}宝可梦功能`;
        await sendMarkdown(ctx, md, session, null, id);
        break;
      //fishing
      case "收杆":
        const fishGame = new FishingGame(fishing);

        if (!player.isfish) {
          return;
        }
        const berryBag = new PlantTree(player.farm);
        berryBag.water = player.vip > 0 ? 500 : 200;
        const addMerits = player.cyberMerit > 99 ? 0 : 1;

        await ctx.database.set(
          "pokebattle",
          { id: isDirect ? d.user_openid : d.group_member_openid },
          (row) => ({
            isfish: false,
            cyberMerit: $.add(row.cyberMerit, addMerits),
            farm: berryBag,
          })
        );
        let regex = /^[\u4e00-\u9fa5]{2,6}$/;

        const isEvent = player.lap < 3 || player.level < 90;
        const noneMd = `${
          regex.test(player.name) ? player.name : `<@${session.userId}>`
        }的运气极佳，幸运女神都有点嫉妒
    
> 但是你什么都没钓到
    
---
    ${!isEvent && player.cyberMerit < 100 ? "你净化了水质 赛博功德+1" : ""}
    
当前赛博功德值:${player.cyberMerit + 1}
当前储水量:${berryBag.water}`;
        const getMd = (item: FishItem) => `${
          regex.test(player.name) ? player.name : `<@${session.userId}>`
        }获得了${item.name[Math.floor(Math.random() * item.name.length)]}
            
> 价值${
          item.points * (player.lap < 3 ? 50 : 1) +
          (player.lap < 3 ? Fishspend : 0)
        }${player.lap < 3 ? "金币" : "积分"}
    
---
${!isEvent && player.cyberMerit < 100 ? "你净化了水质 赛博功德+1" : ""}
    
当前赛博功德值:${player.cyberMerit + addMerits}
当前储水量:${berryBag.water}`;
        const fished: "普通鱼饵" | "高级鱼饵" =
          d.data.resolved.button_data.split("=")[1];
        const Fishspend = fished === "普通鱼饵" ? 2000 : 2300;
        let getFish = fishGame.fish(Lucky[fished], player.cyberMerit);
        if (!getFish) {
          await sendMarkdown(
            ctx,
            noneMd,
            session,
            {
              keyboard: {
                content: {
                  rows: [
                    {
                      buttons: [
                        button(2, `🎣 继续钓鱼`, "/钓鱼", session.userId, "1"),
                      ],
                    },
                  ],
                },
              },
            },
            id
          );
          return;
        }
        if (getFish.legendaryPokemon) {
          if (player?.level < 90 || player?.lap < 3) {
            const weak = `<@${session.userId}>你太弱小了
    
---
盖欧卡看了你一眼，并摇了摇头
    
> 你当前好像无法收复它`;
            await sendMarkdown(
              ctx,
              weak,
              session,
              {
                keyboard: {
                  content: {
                    rows: [
                      {
                        buttons: [
                          button(
                            2,
                            `🎣 继续钓鱼`,
                            "/钓鱼",
                            session.userId,
                            "1"
                          ),
                        ],
                      },
                    ],
                  },
                },
              },
              id
            );
            return;
          }
          if (
            player.ultra?.[getFish.name[0]] < 9 ||
            !player.ultra?.[getFish.name[0]]
          ) {
            if (player?.ultra[getFish.name[0]] === undefined) {
              player.ultra[getFish.name[0]] = 0;
            }
            player.ultra[getFish.name[0]] = player?.ultra[getFish.name[0]] + 1;
            const md = `<@${session.userId}>收集度+10%
![img#512px #512px](${await toUrl(
              ctx,
              session,
              `${
                pokemonCal
                  .pokemomPic(getFish.name[0], false)
                  .toString()
                  .match(/src="([^"]*)"/)[1]
              }`
            )})
---
![img#20px #20px](${await toUrl(
              ctx,
              session,
              `${config.图片源}/sr/${getFish.name[0].split(".")[0]}.png`
            )}) : ${player.ultra[getFish.name[0]] * 10}% ${
              "🟩".repeat(Math.floor(player.ultra[getFish.name[0]] / 2)) +
              "🟨".repeat(player.ultra[getFish.name[0]] % 2) +
              "⬜⬜⬜⬜⬜".substring(
                Math.round(player.ultra[getFish.name[0]] / 2)
              )
            }

---
**传说宝可梦——${pokemonCal.pokemonlist(getFish.name[0])}**`;
            await sendMarkdown(
              ctx,
              md,
              session,
              {
                keyboard: {
                  content: {
                    rows: [
                      {
                        buttons: [
                          button(
                            2,
                            `🎣 继续钓鱼`,
                            "/钓鱼",
                            session.userId,
                            "1"
                          ),
                        ],
                      },
                    ],
                  },
                },
              },
              id
            );
            await ctx.database.set(
              "pokebattle",
              { id: session.userId },
              {
                ultra: player.ultra,
                cyberMerit: 0,
              }
            );
            return;
          }
          if (player.ultra[getFish.name[0]] >= 9) {
            let getMd = "";
            if (!pokeDex.check(getFish.name[0].split(".")[0])) {
              player.ultra[getFish.name[0]] = 10;
              getMd = `<@${session.userId}>成功获得
![img#512px #512px](${await toUrl(
                ctx,
                session,
                `${
                  pokemonCal
                    .pokemomPic(getFish.name[0], false)
                    .toString()
                    .match(/src="([^"]*)"/)[1]
                }`
              )})
---
![img#20px #20px](${await toUrl(
                ctx,
                session,
                `${config.图片源}/sr/${getFish.name[0].split(".")[0]}.png`
              )}) : ${player.ultra[getFish.name[0]] * 10}% ${
                "🟩".repeat(Math.floor(player.ultra[getFish.name[0]] / 2)) +
                "🟨".repeat(player.ultra[getFish.name[0]] % 2) +
                "⬜⬜⬜⬜⬜".substring(
                  Math.round(player.ultra[getFish.name[0]] / 2)
                )
              }
          
---
**传说宝可梦——${pokemonCal.pokemonlist(getFish.name[0])}**
    
已经放入图鉴`;
              pokeDex.pull(getFish.name[0], player);
              await ctx.database.set(
                "pokebattle",
                { id: session.userId },
                {
                  ultra: player.ultra,
                  pokedex: player.pokedex,
                  cyberMerit: 0,
                }
              );
            } else {
              getMd = `你已经获得了盖欧卡，奖励积分 + 200`;
              await ctx.database.set(
                "pokemon.resourceLimit",
                { id: session.userId },
                (row) => ({
                  rankScore: $.add(row.rankScore, getFish.points),
                })
              );
            }
            await sendMarkdown(
              ctx,
              getMd,
              session,
              {
                keyboard: {
                  content: {
                    rows: [
                      {
                        buttons: [
                          button(
                            2,
                            `🎣 继续钓鱼`,
                            "/钓鱼",
                            session.userId,
                            "1"
                          ),
                        ],
                      },
                    ],
                  },
                },
              },
              id
            );
          }
          //copy
        } else {
          await sendMarkdown(
            ctx,
            getMd(getFish),
            session,
            {
              keyboard: {
                content: {
                  rows: [
                    {
                      buttons: [
                        button(2, `🎣 继续钓鱼`, "/钓鱼", session.userId, "1"),
                      ],
                    },
                  ],
                },
              },
            },
            id
          );
          player.lap < 3
            ? await ctx.database.set(
                "pokebattle",
                { id: session.userId },
                (row) => ({
                  gold: $.add(row.gold, getFish.points * 50 + Fishspend),
                })
              )
            : await ctx.database.set(
                "pokemon.resourceLimit",
                { id: session.userId },
                (row) => ({
                  rankScore: $.add(row.rankScore, getFish.points),
                })
              );
        }
        break;
      //mix
      case "mix":
        if (!player.isMix) {
          return;
        }
        await ctx.database.set(
          "pokebattle",
          { id: isDirect ? d.user_openid : d.group_member_openid },
          {
            isMix: false,
          }
        );
        const kb = {
          keyboard: {
            content: {
              rows: [
                {
                  buttons: [
                    button(
                      2,
                      `继续混合`,
                      "/树果混合",
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
        const mixData = JSON.parse(d.data.resolved.button_data.split("=")[1]);
        const clickTime = Number(d.data.resolved.button_data.split("=")[0]);
        const time = new Date().getTime();
        const isPoke =
          time > clickTime + mixData.perfectClick - 500 &&
          time < clickTime + mixData.perfectClick + 500;
        const isEventMix =
          player.lap >= 3 &&
          player.level >= 90 &&
          isPoke &&
          !pokeDex.check("380");
        if (isEventMix) {
          if (player.ultra?.["380.380"] < 9 || !player.ultra?.["380.380"]) {
            if (player?.ultra["380.380"] === undefined) {
              player.ultra["380.380"] = 0;
            }
            player.ultra["380.380"] = player?.ultra["380.380"] + 1;
            const md = `收集度+10%
你混合树果的香气，吸引了一个奇怪的宝可梦
![img#512px #512px](${await toUrl(
              ctx,
              session,
              `${
                pokemonCal
                  .pokemomPic("380.380", false)
                  .toString()
                  .match(/src="([^"]*)"/)[1]
              }`
            )})
---
![img#20px #20px](${await toUrl(
              ctx,
              session,
              `${config.图片源}/sr/${"380.380".split(".")[0]}.png`
            )}) : ${player.ultra["380.380"] * 10}% ${
              "🟩".repeat(Math.floor(player.ultra["380.380"] / 2)) +
              "🟨".repeat(player.ultra["380.380"] % 2) +
              "⬜⬜⬜⬜⬜".substring(Math.round(player.ultra["380.380"] / 2))
            }
          
---
**传说宝可梦——${pokemonCal.pokemonlist("380.380")}**`;
            await sendMarkdown(ctx, md, session, kb, id);
            await ctx.database.set(
              "pokebattle",
              { id: session.userId },
              {
                ultra: player.ultra,
                cyberMerit: 0,
              }
            );
            return;
          }
          if (player.ultra["380.380"] >= 9) {
            let getMd = "";
            if (!pokeDex.check("380.380".split(".")[0])) {
              player.ultra["380.380"] = 10;
              getMd = `<@${session.userId}>成功获得
![img#512px #512px](${await toUrl(
                ctx,
                session,
                `${
                  pokemonCal
                    .pokemomPic("380.380", false)
                    .toString()
                    .match(/src="([^"]*)"/)[1]
                }`
              )})
---
![img#20px #20px](${await toUrl(
                ctx,
                session,
                `${config.图片源}/sr/${"380.380".split(".")[0]}.png`
              )}) : ${player.ultra["380.380"] * 10}% ${
                "🟩".repeat(Math.floor(player.ultra["380.380"] / 2)) +
                "🟨".repeat(player.ultra["380.380"] % 2) +
                "⬜⬜⬜⬜⬜".substring(Math.round(player.ultra["380.380"] / 2))
              }
            
---
**传说宝可梦——${pokemonCal.pokemonlist("380.380")}**
      
已经放入图鉴`;
              pokeDex.pull("380.380", player);
              await ctx.database.set(
                "pokebattle",
                { id: session.userId },
                {
                  ultra: player.ultra,
                  pokedex: player.pokedex,
                  cyberMerit: 0,
                }
              );

              await sendMarkdown(ctx, getMd, session, kb, id);
              return;
            }
          }
        }
        if (mixData.GorP) {
          await ctx.database.set(
            "pokemon.resourceLimit",
            { id: session.userId },
            (row) => ({
              rankScore: $.add(row.rankScore, mixData.get),
            })
          );
        } else {
          await ctx.database.set(
            "pokebattle",
            { id: session.userId },
            (row) => ({
              gold: $.add(row.gold, mixData.get),
            })
          );
        }
        const mdMix = `<@${session.userId}> 混合成功
---
> 获得${mixData.get}${mixData.GorP ? "积分" : "金币"}`;
        await sendMarkdown(ctx, mdMix, session, kb, id);
        break;
    }
  });

  ctx.on("command/before-execute", async (argv) => {
    const { session } = argv;
    const { channelId, platform } = session;
    if (platform != "qq") return;
    let [channel] = await ctx.database.get("pokemon.isPokemon", {
      id: channelId,
    });
    if (!channel) {
      channel = await ctx.database.create(
        "pokemon.isPokemon",
        { id: channelId },
        {
          pokemon_cmd: false,
        }
      );
    }
    let cmd = argv.command;
    let name = cmd?.name;
    do {
      name = cmd?.name;
      if (name == "宝可梦签到" || name == "宝可梦") break;
      cmd = cmd?.parent;
    } while (cmd?.name);
    if (name == "宝可梦" && !channel.pokemon_cmd) {
      const md = `本群已关闭宝可梦功能，如要开启请联系管理员点击下面按钮
---
> 宝可梦功能十分刷屏，如介意请勿开启
**关闭时，仅可使用签到功能**
可使用 **关闭/开启宝可梦** 来开启或关闭宝可梦功能`;
      const kb = {
        keyboard: {
          content: {
            rows: [
              {
                buttons: [
                  actionbutton(
                    "关闭/开启宝可梦功能",
                    !channel.isPokemon ? "1" : "0",
                    session.userId,
                    "ispokemon",
                    Date.now() + 5000,
                    1
                  ),
                ],
              },
            ],
          },
        },
      };
      await sendMarkdown(ctx, md, session, kb);
      return ``;
    }
  });

  try {
    testcanvas = "file://";
    await ctx.canvas.loadImage(
      `${testcanvas}${resolve(
        __dirname,
        "./assets/img/components",
        "spawn.png"
      )}`
    );
    logger.info("当前使用的是puppeteer插件提供canvas服务");
  } catch (e) {
    testcanvas = "";
    logger.info("当前使用的是canvas插件提供canvas服务");
  }

  if (!fs.existsSync("./zpix.ttf")) {
    const fontTask = ctx.downloads.nereid(
      "zpixfont",
      [
        "npm://pix-ziti",
        "npm://pix-ziti?registry=https://registry.npmmirror.com",
        ,
      ],
      "bucket2"
    );
    fontTask.promise.then((path1) => {
      const sourceFilePath = path1 + "/zpix.ttf";
      const targetFilePath = path.join(
        __dirname,
        "..",
        "..",
        "..",
        path.basename(sourceFilePath)
      );

      fs.rename(sourceFilePath, targetFilePath, function (err) {
        if (err) {
          logger.info(sourceFilePath);
        } else {
          logger.info("移动文件成功");
        }
      });
    });
  }

  shop = [
    {
      id: "captureTimes",
      name: "精灵球",
      price: config.精灵球定价,
    },
    {
      id: "coin",
      name: "扭蛋代币",
      price: config.扭蛋币定价,
    },
    {
      id: "trainerNum",
      name: "人物盲盒",
      price: config.训练师定价,
    },
    {
      id: "changeName",
      name: "改名卡",
      price: config.改名卡定价,
    },
  ];

  const banID = [
    "150.150",
    "151.151",
    "144.144",
    "145.145",
    "146.146",
    "249.249",
    "250.250",
    "251.251",
    "243.243",
    "244.244",
    "245.245",
    "378.378",
    "379.379",
    "340.340",
    "341.341",
    "342.342",
    "381.381",
    "380.380",
    "343.343",
    "344.344",
    "345.345",
    "346.346",
    "347.347",
    "315.315",
    "349.349",
    "348.348",
    "350.350",
    "351.351",
  ];
  const lapThree = [
    "378.378",
    "379.379",
    "340.340",
    "341.341",
    "342.342",
    "381.381",
    "380.380",
    "343.343",
    "344.344",
    "345.345",
    "346.346",
    "347.347",
    "315.315",
    "349.349",
    "348.348",
    "350.350",
    "351.351",
  ];

  ctx.plugin(lapTwo);

  ctx.plugin(pokedex);
  ctx.plugin(formGame);

  ctx
    .command("宝可梦功能开关", "开启或关闭宝可梦功能")
    .shortcut(/(关闭|开启)宝可梦/)
    .action(async ({ session }) => {
      const { channelId, platform } = session;
      if (platform != "qq") return `非qq群暂时无法使用此功能`;
      let [channel] = await ctx.database.get("pokemon.isPokemon", {
        id: channelId,
      });
      if (!channel) {
        channel = await ctx.database.create("pokemon.isPokemon", {
          id: channelId,
        });
      }
      const md = `本群已${
        channel.pokemon_cmd ? "开启" : "关闭"
      }宝可梦功能，如要${
        channel.pokemon_cmd ? "关闭" : "开启"
      }请联系管理员点击下面按钮
---
> 宝可梦功能十分刷屏，如介意请勿开启
**关闭时，仅可使用签到功能**
可使用 **关闭/开启宝可梦** 来开启或关闭宝可梦功能`;
      const kb = {
        keyboard: {
          content: {
            rows: [
              {
                buttons: [
                  actionbutton(
                    "关闭/开启宝可梦功能",
                    !channel.isPokemon ? "1" : "0",
                    session.userId,
                    "ispokemon",
                    Date.now() + 5000,
                    1
                  ),
                ],
              },
            ],
          },
        },
      };
      await sendMarkdown(ctx, md, session, kb);
    });

  ctx
    .command("宝可梦")
    .subcommand("宝可梦签到", "每日的宝可梦签到")
    .alias("签到")
    .action(async ({ session }) => {
      if (session.userId == "") return;
      const userArr: Pokebattle[] = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      await isResourceLimit(session.userId, ctx);
      const vip = isVip(userArr[0]);
      const vipReward = vip ? 1.5 : 1;
      const vipRGold = vip ? 3000 : 0;
      const vipRBoll = vip ? 20 : 0;
      const vipCoin = vip ? 10 : 0;
      const vipName = vip ? "[💎VIP]" : "";
      const vipScore = userArr[0]?.vip > 0 && userArr[0].lap > 2;
      let dateToday = Math.round(Number(new Date()) / 1000);
      if (userArr.length != 0) {
        const playerList: PokemonList = await getList(
          session.userId,
          ctx,
          userArr[0].monster_1
        );
        let dateNow = Math.floor((userArr[0].date + 28800) / 86400);
        if (dateNow == Math.floor((dateToday + 28800) / 86400)) {
          await session.send("今天你已经签到过了哟~快去捕捉属于你的宝可梦吧");
        } else {
          const checkDays = Math.floor((dateToday + 28800) / 86400) - 1;
          if (userArr[0].monster_1 == "null") {
            await ctx.database.set(
              "pokebattle",
              { id: session.userId },
              {
                monster_1: "0",
              }
            );
            if (!userArr[0].skill) {
              await ctx.database.set(
                "pokebattle",
                { id: session.userId },
                {
                  skill: 0,
                }
              );
            }
          }

          const chance = await getChance(userArr[0], ctx);
          let expGet: number;
          if (userArr[0].monster_1 == "0") {
            //更改
            expGet = Math.floor(
              ((userArr[0].level *
                Number(
                  expBase.exp[
                    Number(userArr[0].AllMonster[0].split(".")[0]) - 1
                  ].expbase
                )) /
                7) *
                vipReward
            );
          } else {
            expGet =
              userArr[0].level > 99
                ? 0
                : Math.floor(
                    ((userArr[0].level *
                      Number(
                        expBase.exp[
                          (Number(userArr[0].monster_1.split(".")[0]) >
                          Number(userArr[0].monster_1.split(".")[1])
                            ? Number(userArr[0].monster_1.split(".")[1])
                            : Number(userArr[0].monster_1.split(".")[0])) - 1
                        ].expbase
                      )) /
                      7) *
                      (Math.random() + 0.5)
                  );
            expGet = Math.floor(expGet * vipReward);
          }
          let expNew = pokemonCal.expCal(
            userArr[0].level,
            userArr[0].exp + expGet
          )[1];
          let lvNew = pokemonCal.expCal(
            userArr[0].level,
            userArr[0].exp + expGet
          )[0];
          let ToDo: string;
          if (userArr[0].monster_1 !== "0") {
            ToDo = `当前战斗宝可梦：${pokemonCal.pokemonlist(
              userArr[0].monster_1
            )}
            ${pokemonCal.pokemomPic(userArr[0].monster_1, true)}
            `;
          } else {
            ToDo = "快去融合出属于你的宝可梦吧";
          }
          let playerName = userArr[0].name
            ? userArr[0].name
            : session.username.length < 6
            ? session.username
            : session.username.slice(0, 4);
          try {
            playerName = await censorText(ctx, playerName);
            await ctx.database.set(
              "pokebattle",
              { id: session.userId },
              (row) => ({
                name: playerName,
                captureTimes: $.add(
                  row.captureTimes,
                  config.签到获得个数 + vipRBoll
                ),
                MissSignDates: $.add(row.MissSignDates, checkDays - dateNow),
                historySigns: $.if(
                  $.eq(userArr[0].historySigns, 0),
                  $.add(userArr[0].checkInDays, checkDays - dateNow + 1),
                  $.add(row.historySigns, checkDays - dateNow + 1)
                ),
                checkInDays: $.if(
                  $.eq(dateNow, checkDays),
                  $.add(row.checkInDays, 1),
                  1
                ),
                date: dateToday,
                level: lvNew,
                exp: expNew,
                battlename: pokemonCal.pokemonlist(userArr[0].monster_1),
                base: pokemonCal.pokeBase(userArr[0].monster_1),
                power: pokemonCal.power(
                  pokemonCal.pokeBase(userArr[0].monster_1),
                  lvNew,
                  playerList,
                  userArr[0].monster_1
                ),
                coin: $.add(row.coin, config.签到获得个数 + vipCoin),
                gold: $.add(
                  row.gold,
                  (userArr[0].lap > 2 ? 10000 : 3000) + vipRGold
                ),
              })
            );

            await ctx.database.set(
              "pokemon.resourceLimit",
              { id: session.userId },
              (row) => ({
                rankScore: $.add(row.rankScore, vipScore ? 300 : 0),
              })
            );
          } catch (e) {
            console.log(e);
            return `请再试一次`;
          }
          //图片服务
          let image = await ctx.canvas.loadImage(
            `${testcanvas}${resolve(
              __dirname,
              "./assets/img/components",
              "签到.png"
            )}`
          );
          let pokemonimg = await ctx.canvas.loadImage(
            `${config.图片源}/sr/0.png`
          );
          const playerTrainer = userArr[0].trainer_list.find(
            (train) => train.tid == userArr[0].trainerIndex
          );
          let pokemonimg1 = [];
          for (let i = 0; i < userArr[0].AllMonster.length; i++) {
            pokemonimg1[i] = await ctx.canvas.loadImage(
              `${config.图片源}/sr/${
                userArr[0].AllMonster[i].split(".")[0]
              }.png`
            );
          }
          let ultramonsterimg = [];
          for (let i = 0; i < 5; i++) {
            ultramonsterimg[i] = await ctx.canvas.loadImage(
              `${config.图片源}/sr/${banID[i].split(".")[0]}.png`
            );
          }
          if (userArr[0].monster_1 !== "0")
            pokemonimg = await ctx.canvas.loadImage(
              `${config.图片源}/fusion/${userArr[0].monster_1.split(".")[0]}/${
                userArr[0].monster_1
              }.png`
            );
          let trainerimg = await ctx.canvas.loadImage(
            `${config.图片源}/trainers/${playerTrainer.source_name}.png`
          );
          let expbar = await ctx.canvas.loadImage(
            `${testcanvas}${resolve(
              __dirname,
              "./assets/img/components",
              "expbar.png"
            )}`
          );
          let overlay = await ctx.canvas.loadImage(
            `${testcanvas}${resolve(
              __dirname,
              "./assets/img/components",
              "overlay_exp.png"
            )}`
          );
          let time = Date.now();
          let date = new Date(time).toLocaleDateString();
          const dataUrl = await ctx.canvas.render(512, 763, async (ctx) => {
            ctx.drawImage(image, 0, 0, 512, 763);
            ctx.drawImage(pokemonimg, 21, 500, 160, 160);
            ctx.drawImage(trainerimg, 21, 56, 160, 160);
            ctx.font = "normal 30px zpix";
            ctx.fillText(
              userArr[0].gold + (userArr[0].lap > 2 ? 10000 : 3000) + vipRGold,
              290,
              100
            );
            ctx.fillText(vipName + playerName + `签到成功`, 49, 270);
            ctx.font = "normal 20px zpix";
            ctx.fillText(`零花钱：`, 254, 65);
            ctx.font = "normal 20px zpix";
            ctx.fillText(
              `获得金币+` + ((userArr[0].lap > 2 ? 10000 : 3000) + vipRGold),
              49,
              300
            );
            ctx.fillText(
              `当前可用精灵球:${
                userArr[0].captureTimes + config.签到获得个数 + vipRBoll
              }`,
              256,
              300
            );
            ctx.fillText(
              `获得精灵球+${config.签到获得个数 + vipRBoll}`,
              49,
              325
            );
            ctx.fillText(`获得经验+${expGet}`, 256, 325);
            ctx.font = "normal 15px zpix";
            ctx.fillStyle = "red";
            ctx.fillText(`输入【/宝可梦】查看详细指令`, 135, 350);
            ctx.fillStyle = "black";
            const playerPower = pokemonCal.power(
              pokemonCal.pokeBase(userArr[0].monster_1),
              lvNew,
              playerList,
              userArr[0].monster_1
            );
            ctx.fillText(
              `hp:${playerPower[0]} att:${playerPower[1]} def:${playerPower[2]}`,
              30,
              715
            );
            ctx.fillText(
              `spa:${playerPower[3]} spa:${playerPower[4]} spe:${playerPower[5]}`,
              30,
              740
            );
            ctx.fillText(date, 308, 173);
            ctx.fillText("Lv." + lvNew.toString(), 328, 198);
            ctx.drawImage(
              overlay,
              318,
              203,
              (160 * expNew) / expToLv.exp_lv[lvNew].exp,
              8
            );
            ctx.drawImage(expbar, 300, 200, 180, 20);
            ctx.font = "bold 20px zpix";

            for (let i = 0; i < userArr[0].AllMonster.length; i++) {
              ctx.drawImage(pokemonimg1[i], 277, 439 + 50 * i, 40, 40);
              ctx.fillText(
                "【" + pokemonCal.pokemonlist(userArr[0].AllMonster[i]) + "】",
                322,
                467 + 50 * i
              );
            }
            if (vip) {
              ctx.strokeStyle = "gold";
              ctx.lineWidth = 10;
              ctx.strokeRect(0, 0, 512, 763);
            }
          });
          const { src } = dataUrl.attrs;
          const pokeDex = new Pokedex(userArr[0]);
          try {
            const md = `<qqbot-at-user id="${session.userId}" />签到成功
连续签到天数${checkDays == dateNow ? userArr[0].checkInDays + 1 : 1}天${
              userArr[0].MissSignDates + checkDays - dateNow < 0
                ? ""
                : `可补签 [补签](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
                    `补签`
                  )}&reply=false&enter=true)，需要花费${
                    userArr[0].MissSignDates + checkDays - dateNow
                  }张补签卡`
            }
![img#512px #763px](${await toUrl(ctx, session, src)})

> [📃 问答](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
              `/宝可问答`
            )}&reply=false&enter=true) || [⚔️ 对战](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
              `/对战`
            )}&reply=false&enter=true) || [📕 属性](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
              `/属性`
            )}&reply=false&enter=true)
[🛒 商店](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
              `/购买`
            )}&reply=false&enter=true) || [🔈 公告](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
              `/notice`
            )}&reply=false&enter=true) || [🔖 帮助](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
              `/宝可梦`
            )}&reply=false&enter=true)
[🏆 兑换](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
              `/使用 `
            )}&reply=false&enter=false) || [👐 放生](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
              `/放生`
            )}&reply=false&enter=true) || [♂ 融合](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
              `/融合宝可梦`
            )}&reply=false&enter=true)
${
  userArr[0].lap == 3 &&
  (!pokeDex.check("381.381") ||
    !pokeDex.check("378.378") ||
    !pokeDex.check("379.379"))
    ? `三周目玩家连续签到7,15,30天可获得**基拉祈、拉帝亚斯、拉帝欧斯**
`
    : ""
}
[**➣ ⚔️和他对战** ](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
              `/对战 ${session.userId} `
            )}&reply=false&enter=true)

${
  vipScore
    ? `---
3周目会员积分+300`
    : ``
}

${
  userArr[0].changeName > 0
    ? `---
你当前可以改名 [**➣ 改名**](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
        `/改名`
      )}&reply=false&enter=true)`
    : ``
}

${
  userArr[0].advanceChance
    ? `---
你当前可以进入三周目

[三周目](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
        `/lapnext`
      )}&reply=false&enter=true)`
    : " "
}
${
  chance
    ? `---
你当前可以领取三周目资格

[领取](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
        `/getchance`
      )}&reply=false&enter=true)`
    : " "
} 
`;
            const kb = {
              keyboard: {
                content: {
                  rows: [
                    {
                      buttons: [
                        urlbutton(
                          2,
                          "查看麦麦文档",
                          "https://docs.qq.com/doc/DTUJ6S3ZMUVZWaVRm",
                          session.userId,
                          "11"
                        ),
                      ],
                    },
                    {
                      buttons: [
                        button(2, "签到", "签到", session.userId, "qd"),
                        button(2, "面板", "查看信息", session.userId, "xx"),
                      ],
                    },
                    {
                      buttons: [
                        button(
                          2,
                          "最新猜宝可梦玩法",
                          "pokemole.s",
                          session.userId,
                          "bt"
                        ),
                      ],
                    },
                    {
                      buttons: [
                        button(2, "卡牌", "开始卡牌", session.userId, "bt"),
                        urlbutton(
                          2,
                          "✨修仙",
                          "https://qun.qq.com/qunpro/robot/qunshare?robot_uin=3889015870&robot_appid=102095939",
                          session.userId,
                          "推广"
                        ),
                      ],
                    },
                  ],
                },
              },
            };
            sendMarkdown(ctx, md, session, kb);
          } catch (e) {
            console.log(e);
            return h.image(src);
          }

          //连续签到
          const checkInDays =
            userArr[0].checkInDays >= 29
              ? 29
              : userArr[0].checkInDays >= 14
              ? 14
              : userArr[0].checkInDays >= 6
              ? 6
              : 1;
          if (checkInDays == 1) return;
          const pokemonObj = {
            6: 381,
            14: 378,
            29: 379,
          };
          let pokeId = pokemonObj[checkInDays];
          let pokeName = `${pokeId}.${pokeId}`;
          if (userArr[0].lap < 3 || checkDays !== dateNow) return;

          if (pokeDex.check(pokeName)) {
            if (checkInDays >= 14 && !pokeDex.check("381.381")) {
              pokeId = pokemonObj[6];
              pokeName = `${pokeId}.${pokeId}`;
            } else if (checkInDays >= 29 && !pokeDex.check("378.378")) {
              pokeId = pokemonObj[14];
              pokeName = `${pokeId}.${pokeId}`;
            } else {
              return;
            }
          }
          pokeDex.pull(pokeName, userArr[0]);
          if (userArr[0]?.ultra[pokeName] === undefined) {
            userArr[0].ultra[pokeName] = 10;
          }
          userArr[0].ultra[pokeName] = 10;
          await ctx.database.set(
            "pokebattle",
            { id: session.userId },
            {
              ultra: userArr[0].ultra,
              pokedex: userArr[0].pokedex,
            }
          );
          const getMd = `<qqbot-at-user id="${session.userId}" />成功获得
![img#512px #512px](${await toUrl(
            ctx,
            session,
            `${
              pokemonCal
                .pokemomPic(pokeName, false)
                .toString()
                .match(/src="([^"]*)"/)[1]
            }`
          )})
---
![img#20px #20px](${await toUrl(
            ctx,
            session,
            `${config.图片源}/sr/${pokeId}.png`
          )}) : ${userArr[0].ultra[pokeName] * 10}% ${
            "🟩".repeat(Math.floor(userArr[0].ultra[pokeName] / 2)) +
            "🟨".repeat(userArr[0].ultra[pokeName] % 2) +
            "⬜⬜⬜⬜⬜".substring(Math.round(userArr[0].ultra[pokeName] / 2))
          }
                  
---
**传说宝可梦——${pokemonCal.pokemonlist(pokeName)}**
            
已经放入图鉴`;

          await sendMarkdown(ctx, getMd, session);
          //图片服务
        }
      } else {
        let firstMonster_: string;
        let firstMonster: string;
        do {
          firstMonster_ = pokemonCal.mathRandomInt(1, 151).toString();

          firstMonster = firstMonster_ + "." + firstMonster_;
        } while (banID.includes(firstMonster));
        await ctx.database.create("pokebattle", {
          id: session.userId,
          name:
            session.username.length < 6
              ? session.username
              : session.username.slice(0, 4),
          date: Math.round(Number(new Date()) / 1000),
          captureTimes: config.签到获得个数,
          level: 5,
          exp: 0,
          monster_1: "0",
          AllMonster: [firstMonster],
          coin: config.签到获得个数,
          gold: 3000,
        });
        //图片服务
        const bg_img = await ctx.canvas.loadImage(
          `${testcanvas}${resolve(
            __dirname,
            "./assets/img/components",
            "spawn.png"
          )}`
        );
        const pokemonimg = await ctx.canvas.loadImage(
          `${config.图片源}/sr/${firstMonster_}.png`
        );
        const replyImg = await ctx.canvas.render(512, 384, async (ctx) => {
          ctx.drawImage(bg_img, 0, 0, 512, 384);
          ctx.drawImage(pokemonimg, 99, 285, 64, 64);
          ctx.font = "normal 16px zpix";
          ctx.fillText(
            `你好，${
              session.username.length < 6
                ? session.username
                : session.username.slice(0, 4)
            }`,
            31,
            38
          );
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`精灵球+${config.签到获得个数}`, 375, 235);
          ctx.fillText(`初始资金:3000`, 375, 260);
          ctx.fillText(`扭蛋机币+${config.签到获得个数}`, 375, 285);
          ctx.fillText(
            `你的第一只宝可梦【${pokemonCal.pokemonlist(firstMonster)}】`,
            375,
            310
          );
        });
        const { src } = replyImg.attrs;
        //图片服务
        try {
          const md = `# <qqbot-at-user id="${
            session.userId
          }" />成功进入宝可梦的世界

![img#512px #384px](${await toUrl(ctx, session, src)})
---
- [点击获取宝可梦帮助](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
            `/宝可梦`
          )}&reply=false&enter=true)`;
          await sendMarkdown(ctx, md, session);
        } catch (e) {
          return h.image(src);
        }
      }
    });
  ctx.command("补签").action(async ({ session }) => {
    const [player]: Pokebattle[] = await ctx.database.get("pokebattle", {
      id: session.userId,
    });
    const vip = isVip(player);
    if (!player) {
      return `请先输入签到指令领取属于你的宝可梦和精灵球`;
    }
    const nowDays = Math.floor(
      (Math.round(Number(new Date()) / 1000) + 28800) / 86400
    );
    const datePlayer = Math.floor((player.date + 28800) / 86400);
    const missSignDays = player.MissSignDates;
    if (missSignDays == 0) {
      return `你没有漏签的天数，不需要使用补签`;
    }
    if (player.signCard < missSignDays) {
      return `你的补签卡不足，无法补签，加入vip可每周一自动获得一张补签卡`;
    }
    if (nowDays - datePlayer != 0) {
      return `你今天还未签到，请先签到后在进行补签`;
    }
    ctx.database.set("pokebattle", { id: session.userId }, (row) => ({
      checkInDays: player.historySigns,
      MissSignDates: 0,
      signCard: $.sub(row.signCard, missSignDays),
    }));
    return `补签成功，你的连续签到天数为${player.historySigns}天`;
  });
  ctx
    .command("宝可梦")
    .subcommand("捕捉宝可梦 [key]", "随机遇到3个宝可梦")
    .action(async ({ session }, key) => {
      const isDirect = session.isDirect;
      let capturMessage = { id: "" };
      const catchArea = ["初级区域", "中级区域", "高级区域"];
      const catchPokemonNumber = [
        [1, 151],
        [152, 251],
        [252, 420],
      ];
      let catchCose = 1;
      const { platform } = session;
      const userArr: Array<Pokebattle> = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      const vip = isVip(userArr[0]);
      const vipReward = vip ? 1.5 : 1;
      const pokeDex = new Pokedex(userArr[0]);
      let usedCoords = [];
      if (userArr.length == 0) {
        try {
          await session.execute(`签到`);
          return;
        } catch (e) {
          return `请先输入签到指令领取属于你的宝可梦和精灵球`;
        }
      } else {
        if (userArr[0].isPut) {
          return `请先完成放生后再进行捕捉`;
        }
        let pokeM = [];
        let grassMonster = [];
        let black = ["", "", ""];
        if (userArr[0].captureTimes > 0) {
          for (let i = 0; i < 3; i++) {
            grassMonster[i] = pokemonCal.mathRandomInt(
              catchPokemonNumber[userArr[0].area][0],
              catchPokemonNumber[userArr[0].area][1]
            );
            while (banID.includes(`${grassMonster[i]}.${grassMonster[i]}`)) {
              while (
                lapThree.includes(`${grassMonster[i]}.${grassMonster[i]}`)
              ) {
                grassMonster[i] = pokemonCal.mathRandomInt(
                  catchPokemonNumber[userArr[0].area][0],
                  catchPokemonNumber[userArr[0].area][1]
                );
              }
              if (
                userArr[0].lapTwo
                  ? Math.random() < userArr[0].level / 100
                  : true
              ) {
                break;
              }
              grassMonster[i] = pokemonCal.mathRandomInt(
                catchPokemonNumber[userArr[0].area][0],
                catchPokemonNumber[userArr[0].area][1]
              );
            }
            pokeM[i] = grassMonster[i] + "." + grassMonster[i];
            for (let j = 0; j < pokemonCal.pokemonlist(pokeM[i]).length; j++) {
              black[i] = black[i] + "⬛";
            }
            if (
              banID.includes(`${grassMonster[i]}.${grassMonster[i]}`) &&
              vip
            ) {
              black[i] = "✨" + black[i] + "✨";
            }
          }
          const noHasRandomPokemon = Math.random() * 100;
          let noHasPoke = false;
          let no = 3;
          if (noHasRandomPokemon > 99 - userArr[0].cyberMerit * 0.5) {
            for (
              let i = catchPokemonNumber[userArr[0].area][0];
              i <= catchPokemonNumber[userArr[0].area][1];
              i++
            ) {
              if (
                !pokeDex.check(`${i}.${i}`) &&
                !(userArr[0].lap > 1 ? lapThree : banID).includes(`${i}.${i}`)
              ) {
                const randomNo = Math.floor(Math.random() * 3);
                no = randomNo;
                grassMonster[randomNo] = i;
                pokeM[randomNo] = i + "." + i;
                black[randomNo] = `✨${pokemonCal.pokemonlist(i + "." + i)}✨`;
                noHasPoke = true;
                break;
              }
            }
          }
          if (legendaryPokemonId?.[key] !== undefined) {
            const pokename = pokemonCal.pokemonlist(legendaryPokemonId?.[key]);
            const pokeID = legendaryPokemonId?.[key].split(".")[0];
            grassMonster = [pokeID, pokeID, pokeID];
            pokeM = [
              legendaryPokemonId?.[key],
              legendaryPokemonId?.[key],
              legendaryPokemonId?.[key],
            ];
            black = [`✨${pokename}✨`, `✨${pokename}✨`, `✨${pokename}✨`];
            delete legendaryPokemonId?.[key];
          }

          let poke_img = [];
          let bg_img = await ctx.canvas.loadImage(
            `${testcanvas}${resolve(
              __dirname,
              "./assets/img/components",
              "catchBG.png"
            )}`
          );
          poke_img[0] = await ctx.canvas.loadImage(
            `${config.图片源}/sr/${grassMonster[0]}.png`
          );
          poke_img[1] = await ctx.canvas.loadImage(
            `${config.图片源}/sr/${grassMonster[1]}.png`
          );
          poke_img[2] = await ctx.canvas.loadImage(
            `${config.图片源}/sr/${grassMonster[2]}.png`
          );
          let grassImg = await ctx.canvas.loadImage(
            `${testcanvas}${resolve(
              __dirname,
              "./assets/img/components",
              "Grass.png"
            )}`
          );
          let catchpockmon_img = await ctx.canvas.render(
            512,
            512,
            async (ctx) => {
              //载入背景
              ctx.drawImage(bg_img, 0, 0, 512, 512);
              // 随机生成草堆的坐标并绘制草堆
              for (let i = 0; i < 15; i++) {
                let x, y;
                do {
                  x = Math.floor(Math.random() * (512 - 64));
                  y = Math.floor(Math.random() * (512 - 64));
                } while (
                  usedCoords.some(
                    ([usedX, usedY]) =>
                      Math.abs(usedX - x) < 64 && Math.abs(usedY - y) < 64
                  )
                );
                usedCoords.push([x, y]);
                ctx.drawImage(grassImg, x, y, 64, 64);
              }
              // 随机生成宝可梦的坐标并绘制宝可梦
              for (let i = 0; i < 3; i++) {
                let x, y;
                do {
                  x = Math.floor(Math.random() * (512 - 64));
                  y = Math.floor(Math.random() * (512 - 64));
                } while (
                  usedCoords.some(
                    ([usedX, usedY]) =>
                      Math.abs(usedX - x) < 64 && Math.abs(usedY - y) < 64
                  )
                );
                usedCoords.push([x, y]);
                ctx.drawImage(poke_img[i], x, y, 64, 64);
              }
              if (vip) {
                ctx.strokeStyle = "gold";
                ctx.lineWidth = 10;
                ctx.strokeRect(0, 0, 512, 512);
              }
            }
          );
          const { src } = catchpockmon_img.attrs;
          //创建图片
          try {
            const md = `<qqbot-at-user id="${session.userId}" />正在捕捉宝可梦

---
当前${catchArea[userArr[0].area]}

![img#512px #512px](${await toUrl(ctx, session, src)})

---

- 当前的精灵球：${userArr[0].captureTimes}
- [随机捕捉](mqqapi://aio/inlinecmd?command=${
              Math.floor(Math.random() * 3) + 1
            }&reply=false&enter=true)
- [购买机票](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
              "购买"
            )}&reply=false&enter=true)

---
**一周目时，传说中的宝可梦(神兽)是不会放进背包的哦**

> tip:"⬛"的个数，表示的是宝可梦名字的长度${
              noHasPoke
                ? "，按钮上有闪光，可能是遇到了你没有的宝可梦哦~"
                : "，听说赛博功德越高，越容易收集到没有的宝可梦"
            }
`;
            capturMessage = await sendMarkdown(ctx, md, session, {
              keyboard: {
                content: catchbutton(
                  session,
                  black[0],
                  black[1],
                  black[2],
                  session.userId
                ),
              },
            });
          } catch (e) {
            capturMessage = await session.send(`${h.image(src)}
\n
官方机器人输入【@Bot 序号】
请向其中一个投掷精灵球
【1】${black[0]}
【2】${black[1]}
【3】${black[2]}
请在10秒内输入序号\n
${h("at", { id: session.userId })}
  `);
          }
          const chooseMonster = await session.prompt(config.捕捉等待时间);
          noHasPoke = noHasPoke && no == Number(chooseMonster) - 1;
          let poke;
          let reply: string;
          if (!chooseMonster) {
            await ctx.database.set(
              "pokebattle",
              { id: session.userId },
              {
                captureTimes: { $subtract: [{ $: "captureTimes" }, catchCose] },
              }
            );
            //未输入
            try {
              await session.bot.deleteMessage(
                session.channelId,
                capturMessage.id
              );
            } catch {
              try {
                session.bot.deleteMessage(session.channelId, capturMessage);
              } catch {}
            }
            return `哎呀！宝可梦们都逃跑了！精灵球-1`;
          }
          switch (
            chooseMonster //选择宝可梦
          ) {
            case "1":
              poke = pokeM[0];
              break;
            case "2":
              poke = pokeM[1];
              break;
            case "3":
              poke = pokeM[2];
              break;
            default:
              await ctx.database.set(
                "pokebattle",
                { id: session.userId },
                {
                  captureTimes: {
                    $subtract: [{ $: "captureTimes" }, catchCose],
                  },
                }
              );
              const kb = {
                keyboard: {
                  content: {
                    rows: [
                      {
                        buttons: [
                          button(
                            2,
                            "👐 继续放生",
                            "/放生",
                            session.userId,
                            "6"
                          ),
                          button(
                            2,
                            "📷 继续捕捉",
                            "/捕捉宝可梦",
                            session.userId,
                            "2"
                          ),
                        ],
                      },
                      {
                        buttons: [
                          button(
                            2,
                            "💳 查看信息",
                            "/查看信息",
                            session.userId,
                            "3"
                          ),
                          button(2, "⚔️ 对战", "/对战", session.userId, "4"),
                        ],
                      },
                    ],
                  },
                },
              };
              const md = `# 球丢歪啦！重新捕捉吧~

---
- 精灵球 -1`;
              try {
                await sendMarkdown(ctx, md, session, kb);
                try {
                  await session.bot.deleteMessage(
                    session.channelId,
                    capturMessage.id
                  );
                } catch {
                  try {
                    session.bot.deleteMessage(session.channelId, capturMessage);
                  } catch {}
                }
                return;
              } catch {
                try {
                  await session.bot.deleteMessage(
                    session.channelId,
                    capturMessage.id
                  );
                } catch {
                  try {
                    session.bot.deleteMessage(session.channelId, capturMessage);
                  } catch {}
                }
                return `球丢歪啦！重新捕捉吧~\n精灵球 -1`;
              }
          }
          if (banID.includes(poke) && userArr[0].lap < 2) {
            const hasPoke = userArr[0].ultramonster?.includes(poke);
            if (hasPoke) {
              try {
                await session.bot.deleteMessage(
                  session.channelId,
                  capturMessage.id
                );
              } catch {
                try {
                  session.bot.deleteMessage(session.channelId, capturMessage);
                } catch {}
              }
              return `${h("at", {
                id: session.userId,
              })}你已经拥有一只了，${pokemonCal.pokemonlist(poke)}挣脱束缚逃走了
`;
            } else {
              let ultramonsterSet = new Set(userArr[0].ultramonster);

              ultramonsterSet.add(poke);

              userArr[0].ultramonster = Array.from(ultramonsterSet);

              await ctx.database.set(
                "pokebattle",
                { id: session.userId },
                {
                  captureTimes: {
                    $subtract: [{ $: "captureTimes" }, catchCose],
                  },
                  ultramonster: userArr[0].ultramonster,
                }
              );
              try {
                await session.bot.deleteMessage(
                  session.channelId,
                  capturMessage.id
                );
              } catch {
                try {
                  session.bot.deleteMessage(session.channelId, capturMessage);
                } catch {}
              }
              return `${h("at", {
                id: session.userId,
              })}恭喜你获得了传说宝可梦【${pokemonCal.pokemonlist(poke)}】`;
            }
          } else if (banID.includes(poke) && userArr[0].lapTwo) {
            if (userArr[0].ultra?.[poke] < 9 || !userArr[0].ultra?.[poke]) {
              if (userArr[0]?.ultra[poke] === undefined) {
                userArr[0].ultra[poke] = 0;
              }
              const catchResults = catchPokemon(userArr[0], poke);
              let result = catchResults[1] as boolean;
              if (!result) {
                const log = catchResults[0] as string;
                const img = await getWildPic(ctx, log, userArr[0], poke);
                const md = `${pokemonCal.pokemonlist(poke)}将你打败了
![img#512px #512px](${await toUrl(ctx, session, img)})

---
> <qqbot-at-user id="${session.userId}" />再接再厉`;
                await sendMarkdown(ctx, md, session, {
                  keyboard: {
                    content: {
                      rows: [
                        {
                          buttons: [
                            button(
                              2,
                              `继续捕捉宝可梦`,
                              "/捕捉宝可梦",
                              session.userId,
                              "1"
                            ),
                          ],
                        },
                      ],
                    },
                  },
                });
                try {
                  await session.bot.deleteMessage(
                    session.channelId,
                    capturMessage.id
                  );
                } catch {
                  try {
                    session.bot.deleteMessage(session.channelId, capturMessage);
                  } catch {}
                }
                await ctx.database.set(
                  "pokebattle",
                  { id: session.userId },
                  (row) => ({
                    cyberMerit: 0,
                  })
                );
                return;
              }
              userArr[0].ultra[poke] = userArr[0]?.ultra[poke] + 1;
              await ctx.database.set(
                "pokebattle",
                { id: session.userId },
                (row) => ({
                  ultra: userArr[0].ultra,
                  captureTimes: $.sub(row.captureTimes, catchCose),
                  cyberMerit: 0,
                })
              );
              try {
                const md = `<qqbot-at-user id="${session.userId}" />收集度+10%
![img#512px #512px](${await toUrl(
                  ctx,
                  session,
                  `${
                    pokemonCal
                      .pokemomPic(poke, false)
                      .toString()
                      .match(/src="([^"]*)"/)[1]
                  }`
                )})
---
![img#20px #20px](${await toUrl(
                  ctx,
                  session,
                  `${config.图片源}/sr/${poke.split(".")[0]}.png`
                )}) : ${userArr[0].ultra[poke] * 10}% ${
                  "🟩".repeat(Math.floor(userArr[0].ultra[poke] / 2)) +
                  "🟨".repeat(userArr[0].ultra[poke] % 2) +
                  "⬜⬜⬜⬜⬜".substring(Math.round(userArr[0].ultra[poke] / 2))
                }
                
---
**传说宝可梦——${pokemonCal.pokemonlist(poke)}**`;
                await sendMarkdown(ctx, md, session, {
                  keyboard: {
                    content: {
                      rows: [
                        {
                          buttons: [
                            button(
                              2,
                              `继续捕捉宝可梦`,
                              "/捕捉宝可梦",
                              session.userId,
                              "1"
                            ),
                          ],
                        },
                      ],
                    },
                  },
                });
                try {
                  await session.bot.deleteMessage(
                    session.channelId,
                    capturMessage.id
                  );
                } catch {
                  try {
                    session.bot.deleteMessage(session.channelId, capturMessage);
                  } catch {}
                }
                return;
              } catch (e) {
                try {
                  await session.bot.deleteMessage(
                    session.channelId,
                    capturMessage.id
                  );
                } catch {
                  try {
                    session.bot.deleteMessage(session.channelId, capturMessage);
                  } catch {}
                }
                return `${pokemonCal.pokemomPic(poke, false)}
                ${h("at", {
                  id: session.userId,
                })}恭喜你收集到了传说宝可梦————${pokemonCal.pokemonlist(
                  poke
                )}\r传说收集值+1，当前【${pokemonCal.pokemonlist(
                  poke
                )}】收集值为${userArr[0].ultra[poke] * 10}%`;
              }
            }
            if (userArr[0].ultra[poke] >= 9) {
              userArr[0].ultra[poke] = 10;
              await ctx.database.set(
                "pokebattle",
                { id: session.userId },
                {
                  ultra: userArr[0].ultra,
                  cyberMerit: 0,
                }
              );
            }
          }

          //pve对战
          let fullId = { id: "" };
          const catchResults = catchPokemon(userArr[0], poke);
          const log = catchResults[0] as string;
          let result = catchResults[1] as boolean;
          let baseexp = 0;
          let expGet = 0;
          let expNew = userArr[0].exp;
          let getGold = 0;
          let lvNew = userArr[0].level;
          if (result) {
            baseexp = Number(
              expBase.exp[Number(String(poke).split(".")[0]) - 1].expbase
            );
            expGet =
              userArr[0].level > 99
                ? 0
                : Math.floor(((userArr[0].level * baseexp) / 7) * vipReward);
            expNew = pokemonCal.expCal(
              userArr[0].level,
              userArr[0].exp + expGet
            )[1];
            getGold =
              userArr[0].level > 99
                ? Math.floor(pokemonCal.mathRandomInt(200, 400) * vipReward)
                : 0;
            const resource = await isResourceLimit(session.userId, ctx);
            const rLimit = new PrivateResource(resource.resource.goldLimit);
            getGold = await rLimit.getGold(ctx, getGold, session.userId);
            lvNew = pokemonCal.expCal(
              userArr[0].level,
              userArr[0].exp + expGet
            )[0];
          }
          result = userArr[0].monster_1 == "0" ? true : result;
          const berry_bag = new PlantTree(userArr[0].farm);
          const getseed = new BerrySend(
            Math.floor(Math.random() * (berry_trees.length - 1) + 1)
          );
          const _get = Math.random() * 100 > 70;
          const isGet = result && _get;
          if (isGet) {
            berry_bag.getSeed(getseed);
          }
          const title: string = result
            ? `<qqbot-at-user id="${
                session.userId
              }" />成功捕捉了${pokemonCal.pokemonlist(poke)}`
            : `<qqbot-at-user id="${
                session.userId
              }" />被${pokemonCal.pokemonlist(poke)}打败了`;
          const picture =
            userArr[0].monster_1 == "0"
              ? pokemonCal
                  .pokemomPic(poke, false)
                  .toString()
                  .match(/src="([^"]*)"/)[1]
              : await getWildPic(ctx, log, userArr[0], poke);
          try {
            const md = `${title}
![img#512px #512px](${await toUrl(ctx, session, picture)})

---
> ${
              userArr[0].lapTwo
                ? "你集齐了5只传说宝可梦\n据说多遇到几次就可以捕捉他们了"
                : "tips: “大灾变” 事件后的宝可梦好像并不能进行战斗了"
            }
---
${isGet ? `你获得了${getseed.name}种子` : ""}
${
  userArr[0].level > 99
    ? `满级后，无法获得经验\n金币+${getGold}`
    : `你获得了${expGet}点经验值\nEXP:${pokemonCal.exp_bar(lvNew, expNew)}`
}`;
            await sendMarkdown(ctx, md, session, {
              keyboard: {
                content: {
                  rows: [
                    {
                      buttons: [
                        button(
                          2,
                          `继续捕捉宝可梦`,
                          "/捕捉宝可梦",
                          session.userId,
                          "1"
                        ),
                      ],
                    },
                    userArr[0].AllMonster.length === 5
                      ? {
                          buttons: [
                            button(
                              2,
                              `放生宝可梦`,
                              "/放生",
                              session.userId,
                              "2"
                            ),
                          ],
                        }
                      : null,
                  ],
                },
              },
            });
          } catch (e) {
            await session.send(`${h.image(picture)}
${result ? "恭喜你捕捉到了宝可梦！" : "很遗憾，宝可梦逃走了！"}
\u200b${
              userArr[0].level > 99
                ? `满级后，无法获得经验\r金币+${getGold}`
                : `你获得了${expGet}点经验值\rEXP:${pokemonCal.exp_bar(
                    lvNew,
                    expNew
                  )}`
            }`);
          }
          try {
            await session.bot.deleteMessage(
              session.channelId,
              capturMessage.id
            );
          } catch {
            try {
              session.bot.deleteMessage(session.channelId, capturMessage);
            } catch {}
          }
          if (!result) {
            return;
          }
          await ctx.database.set(
            "pokebattle",
            { id: session.userId },
            (row) => ({
              captureTimes: userArr[0].captureTimes - catchCose,
              exp: expNew,
              level: lvNew,
              farm: berry_bag,
              gold: userArr[0].gold + getGold,
              cyberMerit: $.if(
                noHasPoke,
                $.floor($.divide(row.cyberMerit, 2)),
                row.cyberMerit
              ),
            })
          );
          if (userArr[0].AllMonster.length < 6) {
            //背包空间
            let five: string = "";
            if (userArr[0].AllMonster.length === 5)
              five = `\n你的背包已经满了,你可以通过 放生 指令，放生宝可梦`; //背包即满

            if (poke == pokeM[0] || poke == pokeM[1] || poke == pokeM[2]) {
              //原生宝可梦判定
              userArr[0].AllMonster.push(poke);
              pokeDex.pull(poke, userArr[0]);
              await ctx.database.set(
                "pokebattle",
                { id: session.userId },
                {
                  AllMonster: userArr[0].AllMonster,
                  pokedex: userArr[0].pokedex,
                }
              );
            }
            return five;
          } else if (
            chooseMonster == "1" ||
            chooseMonster == "2" ||
            chooseMonster == "3"
          ) {
            //背包满
            //图片服务
            let pokemonimg1: string[] = [];
            const bgImg = await ctx.canvas.loadImage(
              `${testcanvas}${resolve(
                __dirname,
                "./assets/img/components",
                "bag.png"
              )}`
            );
            for (let i = 0; i < userArr[0].AllMonster.length; i++) {
              pokemonimg1[i] = await ctx.canvas.loadImage(
                `${config.图片源}/sr/${
                  userArr[0].AllMonster[i].split(".")[0]
                }.png`
              );
            }
            const img = await ctx.canvas.render(512, 381, async (ctx) => {
              ctx.drawImage(bgImg, 0, 0, 512, 381);
              ctx.font = "bold 20px zpix";
              for (let i = 0; i < pokemonimg1.length; i++) {
                if (i % 2 == 0) {
                  ctx.drawImage(pokemonimg1[i], 28, 60 + 90 * (i / 2), 64, 64);
                  ctx.fillText(
                    "【" +
                      (i + 1) +
                      "】" +
                      pokemonCal.pokemonlist(userArr[0].AllMonster[i]),
                    82,
                    100 + 90 * (i / 2)
                  );
                } else {
                  ctx.drawImage(
                    pokemonimg1[i],
                    276,
                    72 + 90 * ((i - 1) / 2),
                    64,
                    64
                  );
                  ctx.fillText(
                    "【" +
                      (i + 1) +
                      "】" +
                      pokemonCal.pokemonlist(userArr[0].AllMonster[i]),
                    330,
                    112 + 90 * ((i - 1) / 2)
                  );
                }
              }
            });
            const { src } = img.attrs;
            //图片服务
            try {
              const md = `<qqbot-at-user id="${
                session.userId
              }" />的宝可梦背包已经满了
![img#512px #381px](${await toUrl(ctx, session, src)})
---
> **请你选择需要替换的宝可梦**`;

              const kb = {
                keyboard: {
                  content: {
                    rows: [
                      {
                        buttons: [
                          button(
                            isDirect ? 2 : 0,
                            pokemonCal.pokemonlist(userArr[0].AllMonster[0]),
                            "1",
                            session.userId,
                            "1"
                          ),
                          button(
                            isDirect ? 2 : 0,
                            pokemonCal.pokemonlist(userArr[0].AllMonster[1]),
                            "2",
                            session.userId,
                            "2"
                          ),
                        ],
                      },
                      {
                        buttons: [
                          button(
                            isDirect ? 2 : 0,
                            pokemonCal.pokemonlist(userArr[0].AllMonster[2]),
                            "3",
                            session.userId,
                            "3"
                          ),
                          button(
                            isDirect ? 2 : 0,
                            pokemonCal.pokemonlist(userArr[0].AllMonster[3]),
                            "4",
                            session.userId,
                            "4"
                          ),
                        ],
                      },
                      {
                        buttons: [
                          button(
                            isDirect ? 2 : 0,
                            pokemonCal.pokemonlist(userArr[0].AllMonster[4]),
                            "5",
                            session.userId,
                            "5"
                          ),
                          button(
                            isDirect ? 2 : 0,
                            pokemonCal.pokemonlist(userArr[0].AllMonster[5]),
                            "6",
                            session.userId,
                            "6"
                          ),
                        ],
                      },
                      {
                        buttons: [
                          button(0, "放生", "/放生", session.userId, "7"),
                        ],
                      },
                    ],
                  },
                },
              };
              fullId = await sendMarkdown(ctx, md, session, kb);
            } catch (e) {
              fullId = await session.send(`\n
你的背包中已经有6只原生宝可梦啦
请选择一只替换
【1】${pokemonCal.pokemonlist(userArr[0].AllMonster[0])}
【2】${pokemonCal.pokemonlist(userArr[0].AllMonster[1])}
【3】${pokemonCal.pokemonlist(userArr[0].AllMonster[2])}
【4】${pokemonCal.pokemonlist(userArr[0].AllMonster[3])}
【5】${pokemonCal.pokemonlist(userArr[0].AllMonster[4])}
【6】${pokemonCal.pokemonlist(userArr[0].AllMonster[5])}
${h("at", { id: session.userId })}
          `);
            }
            const BagNum = await session.prompt(25000);

            if (!BagNum || !["1", "2", "3", "4", "5", "6"].includes(BagNum)) {
              try {
                await session.bot.deleteMessage(session.channelId, fullId.id);
              } catch {}
              return `你好像对新的宝可梦不太满意，把 ${pokemonCal.pokemonlist(
                poke
              )} 放了`;
            }
            const index = parseInt(BagNum) - 1;
            userArr[0].AllMonster[index] = poke;
            await session.execute(`放生 ${index + 1}`);
            pokeDex.pull(poke, userArr[0]);
            await ctx.database.set(
              "pokebattle",
              { id: session.userId },
              {
                AllMonster: userArr[0].AllMonster,
                pokedex: userArr[0].pokedex,
              }
            );
            try {
              await session.bot.deleteMessage(session.channelId, fullId.id);
            } catch {}
            reply = `你小心翼翼的把 ${pokemonCal.pokemonlist(poke)} 放在进背包`;

            await session.send(reply);
          }
        } else {
          let dateToday = Math.round(Number(new Date()) / 1000);
          let dateNow = Math.floor(userArr[0].date / 86400 - 28800);
          if (dateNow == Math.floor(dateToday / 86400 - 28800)) {
            return `\n
今日次数已用完
请明天通过 签到 获取精灵球
${h("at", { id: session.userId })}
`;
          } else {
            return `\n
你的精灵球已经用完啦
请通过 签到 获取新的精灵球
${h("at", { id: session.userId })}
          `;
          }
        }
      }
    });

  ctx
    .command("宝可梦")
    .subcommand("融合宝可梦", "选择两只宝可梦融合")
    .action(async ({ session }) => {
      let fusionId = { id: "" };
      let sonId = { id: "" };
      const userArr = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      const vip = isVip(userArr[0]);
      let dan: number | any[];
      if (userArr.length != 0) {
        const playerList: PokemonList = await getList(
          session.userId,
          ctx,
          userArr[0].monster_1
        );
        //图片服务
        let pokemonimg1: string[] = [];
        const bgImg = await ctx.canvas.loadImage(
          `${testcanvas}${resolve(
            __dirname,
            "./assets/img/components",
            "bag.png"
          )}`
        );
        for (let i = 0; i < userArr[0].AllMonster.length; i++) {
          pokemonimg1[i] = await ctx.canvas.loadImage(
            `${config.图片源}/sr/${userArr[0].AllMonster[i].split(".")[0]}.png`
          );
        }
        const image = await ctx.canvas.render(512, 381, async (ctx) => {
          ctx.drawImage(bgImg, 0, 0, 512, 381);
          ctx.font = "bold 20px zpix";
          for (let i = 0; i < pokemonimg1.length; i++) {
            if (i % 2 == 0) {
              ctx.drawImage(pokemonimg1[i], 28, 60 + 90 * (i / 2), 64, 64);
              ctx.fillText(
                "【" +
                  (i + 1) +
                  "】" +
                  pokemonCal.pokemonlist(userArr[0].AllMonster[i]),
                82,
                100 + 90 * (i / 2)
              );
            } else {
              ctx.drawImage(
                pokemonimg1[i],
                276,
                72 + 90 * ((i - 1) / 2),
                64,
                64
              );
              ctx.fillText(
                "【" +
                  (i + 1) +
                  "】" +
                  pokemonCal.pokemonlist(userArr[0].AllMonster[i]),
                330,
                112 + 90 * ((i - 1) / 2)
              );
            }
          }
          if (vip) {
            ctx.strokeStyle = "gold";
            ctx.lineWidth = 10;
            ctx.strokeRect(0, 0, 512, 381);
          }
        });
        const { src } = image.attrs;
        //图片服务
        try {
          const md = `# <qqbot-at-user id="${session.userId}" />选择两只宝可梦
![img#512px #381px](${await toUrl(ctx, session, src)})
---
当前你也可以 [点击这里融合](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
            ` `
          )}&reply=false&enter=false)`;
          const kb = {
            keyboard: {
              content: {
                rows: [
                  {
                    buttons: [
                      button(
                        0,
                        pokemonCal.pokemonlist(userArr[0].AllMonster[0]),
                        `1`,
                        session.userId,
                        "1"
                      ),
                      button(
                        0,
                        pokemonCal.pokemonlist(userArr[0].AllMonster[1]),
                        `2`,
                        session.userId,
                        "2"
                      ),
                    ],
                  },
                  {
                    buttons: [
                      button(
                        0,
                        pokemonCal.pokemonlist(userArr[0].AllMonster[2]),
                        `3`,
                        session.userId,
                        "3"
                      ),
                      button(
                        0,
                        pokemonCal.pokemonlist(userArr[0].AllMonster[3]),
                        `4`,
                        session.userId,
                        "4"
                      ),
                    ],
                  },
                  {
                    buttons: [
                      button(
                        0,
                        pokemonCal.pokemonlist(userArr[0].AllMonster[4]),
                        `5`,
                        session.userId,
                        "5"
                      ),
                      button(
                        0,
                        pokemonCal.pokemonlist(userArr[0].AllMonster[5]),
                        `6`,
                        session.userId,
                        "6"
                      ),
                    ],
                  },
                ],
              },
            },
          };
          fusionId = await sendMarkdown(ctx, md, session, kb);
        } catch (e) {
          fusionId = await session.send(`\n${image}
回复【编号】 【编号】进行融合
官方机器人输入
@Bot【编号】 【编号】
`);
        }
        let zajiao = await session.prompt(30000);
        const bagNumber = ["1", "2", "3", "4", "5", "6"];
        if (zajiao) {
          if (bagNumber.includes(zajiao) && zajiao.length == 1) {
            const zajiao1 = zajiao;
            session.send(`请点击第二个宝可梦`);
            const zajiao2 = await session.prompt(30000);
            if (!zajiao2) {
              return "你犹豫太久啦！";
            }
            zajiao = zajiao1 + " " + zajiao2;
          }
          session.bot.deleteMessage(session.channelId, fusionId.id);
          let comm = zajiao.split(" ");
          let pokeM = userArr[0].AllMonster[Number(comm[0]) - 1];
          let pokeW = userArr[0].AllMonster[Number(comm[1]) - 1];
          dan = pokemonCal.pokemonzajiao(pokeM, pokeW);
          if (dan == 0 || dan[0] == 0) {
            try {
              await session.bot.internal.sendMessage(session.guildId, {
                content: "111",
                msg_type: 2,
                keyboard: {
                  content: {
                    rows: [
                      {
                        buttons: [
                          button(
                            2,
                            "输入错误点击按钮重新融合",
                            "/融合宝可梦",
                            session.userId,
                            "1"
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
              //处理融合错误
              return "输入错误";
            }
          } else {
            if (userArr[0].monster_1 != "0") {
              const playerPower = pokemonCal.power(
                pokemonCal.pokeBase(dan[1]),
                userArr[0].level,
                playerList,
                dan[1]
              );
              //图片服务
              let img_fuse = await ctx.canvas.loadImage(
                `${testcanvas}${resolve(
                  __dirname,
                  "./assets/img/components/fuse.png"
                )}`
              );
              let img_F = await ctx.canvas.loadImage(
                `${config.图片源}/fusion/${pokeM.split(".")[0]}/${
                  pokeM.split(".")[0]
                }.png`
              );
              let img_M = await ctx.canvas.loadImage(
                `${config.图片源}/fusion/${pokeW.split(".")[0]}/${
                  pokeW.split(".")[0]
                }.png`
              );
              let img_S = await ctx.canvas.loadImage(
                `${config.图片源}/fusion/${dan[1].split(".")[0]}/${dan[1]}.png`
              );
              let img_C = await ctx.canvas.loadImage(
                `${config.图片源}/fusion/${
                  userArr[0].monster_1.split(".")[0]
                }/${userArr[0].monster_1}.png`
              );
              let img_zj = await ctx.canvas.render(512, 768, async (ctx) => {
                ctx.drawImage(img_fuse, 0, 0, 512, 768);
                ctx.drawImage(img_F, 16, 78, 112, 112);
                ctx.font = "normal 15px zpix";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(pokemonCal.pokemonlist(pokeM) + "♂", 72, 206);
                ctx.fillText(pokemonCal.pokemonlist(pokeW) + "♀", 435, 206);
                ctx.fillText(
                  `是否要将【${pokemonCal.pokemonlist(
                    userArr[0].monster_1
                  )}】替换为新生宝可梦【${dan[0]}】`,
                  256,
                  694
                );
                ctx.fillText(dan[0], 253, 326);
                ctx.drawImage(img_M, 379, 78, 112, 112);
                ctx.drawImage(img_S, 163, 114, 180, 180);
                ctx.drawImage(img_C, 294, 449, 180, 180);
                ctx.drawImage(img_S, 42, 449, 180, 180);
              });
              const { src } = img_zj.attrs;
              //图片服务
              //有战斗宝可梦
              try {
                const point = "```";
                const md = `# <qqbot-at-user id="${
                  session.userId
                }" />是否放入战斗栏
![img #512px #768px](${await toUrl(ctx, session, src)})

---
${point}
生命：${
                  Math.sign(Number(playerPower[0]) - userArr[0].power[0]) >= 0
                    ? "+" + (Number(playerPower[0]) - userArr[0].power[0])
                    : "" + (Number(playerPower[0]) - userArr[0].power[0])
                }
攻击：${
                  Math.sign(Number(playerPower[1]) - userArr[0].power[1]) >= 0
                    ? "+" + (Number(playerPower[1]) - userArr[0].power[1])
                    : "" + (Number(playerPower[1]) - userArr[0].power[1])
                }
防御：${
                  Math.sign(Number(playerPower[2]) - userArr[0].power[2]) >= 0
                    ? "+" + (Number(playerPower[2]) - userArr[0].power[2])
                    : "" + (Number(playerPower[2]) - userArr[0].power[2])
                }
特攻：${
                  Math.sign(Number(playerPower[3]) - userArr[0].power[3]) >= 0
                    ? "+" + (Number(playerPower[3]) - userArr[0].power[3])
                    : "" + (Number(playerPower[3]) - userArr[0].power[3])
                }
特防：${
                  Math.sign(Number(playerPower[4]) - userArr[0].power[4]) >= 0
                    ? "+" + (Number(playerPower[4]) - userArr[0].power[4])
                    : "" + (Number(playerPower[4]) - userArr[0].power[4])
                }
速度：${
                  Math.sign(Number(playerPower[5]) - userArr[0].power[5]) >= 0
                    ? "+" + (Number(playerPower[5]) - userArr[0].power[5])
                    : "" + (Number(playerPower[5]) - userArr[0].power[5])
                }
${point}

---
宝可梦属性：${getType(dan[1]).join(" ")}
`;
                sonId = await sendMarkdown(ctx, md, session, {
                  keyboard: {
                    content: {
                      rows: [
                        {
                          buttons: [
                            button(0, "✅Yes", "Y", session.userId, "1"),
                            button(0, "❌No", "N", session.userId, "2"),
                          ],
                        },
                      ],
                    },
                  },
                });
              } catch (e) {
                sonId = await session.send(`
${img_zj}
能力变化：
属性：${getType(dan[1]).join(" ")}
生命：${
                  Math.sign(Number(playerPower[0]) - userArr[0].power[0]) >= 0
                    ? "+" + (Number(playerPower[0]) - userArr[0].power[0])
                    : "" + (Number(playerPower[0]) - userArr[0].power[0])
                }
攻击：${
                  Math.sign(Number(playerPower[1]) - userArr[0].power[1]) >= 0
                    ? "+" + (Number(playerPower[1]) - userArr[0].power[1])
                    : "" + (Number(playerPower[1]) - userArr[0].power[1])
                }
防御：${
                  Math.sign(Number(playerPower[2]) - userArr[0].power[2]) >= 0
                    ? "+" + (Number(playerPower[2]) - userArr[0].power[2])
                    : "" + (Number(playerPower[2]) - userArr[0].power[2])
                }
特攻：${
                  Math.sign(Number(playerPower[3]) - userArr[0].power[3]) >= 0
                    ? "+" + (Number(playerPower[3]) - userArr[0].power[3])
                    : "" + (Number(playerPower[3]) - userArr[0].power[3])
                }
特防：${
                  Math.sign(Number(playerPower[4]) - userArr[0].power[4]) >= 0
                    ? "+" + (Number(playerPower[4]) - userArr[0].power[4])
                    : "" + (Number(playerPower[4]) - userArr[0].power[4])
                }
速度：${
                  Math.sign(Number(playerPower[5]) - userArr[0].power[5]) >= 0
                    ? "+" + (Number(playerPower[5]) - userArr[0].power[5])
                    : "" + (Number(playerPower[5]) - userArr[0].power[5])
                }
是否放入战斗栏（Y/N）
${h("at", { id: session.userId })}
`);
              }
              const battleBag = await session.prompt(20000);
              session.bot.deleteMessage(session.channelId, sonId.id);
              switch (battleBag) {
                case "y":
                case "Y":
                  await ctx.database.set(
                    "pokebattle",
                    { id: session.userId },
                    {
                      monster_1: dan[1],
                      battlename: dan[0],
                      base: pokemonCal.pokeBase(dan[1]),
                      power: playerPower,
                    }
                  );
                  const point = "```";
                  const md =
                    "# ✨" +
                    dan[0] +
                    "✨" +
                    `
![img #512px #512px](${await toUrl(
                      ctx,
                      session,
                      `${config.图片源}/fusion/${dan[1].split(".")[0]}/${
                        dan[1]
                      }.png`
                    )})

---
${point}
生命：${playerPower[0]}  ${
                      Math.sign(Number(playerPower[0]) - userArr[0].power[0]) >=
                      0
                        ? "+" + (Number(playerPower[0]) - userArr[0].power[0])
                        : "" + (Number(playerPower[0]) - userArr[0].power[0])
                    }
攻击：${playerPower[1]}  ${
                      Math.sign(Number(playerPower[1]) - userArr[0].power[1]) >=
                      0
                        ? "+" + (Number(playerPower[1]) - userArr[0].power[1])
                        : "" + (Number(playerPower[1]) - userArr[0].power[1])
                    }
防御：${playerPower[2]}  ${
                      Math.sign(Number(playerPower[2]) - userArr[0].power[2]) >=
                      0
                        ? "+" + (Number(playerPower[2]) - userArr[0].power[2])
                        : "" + (Number(playerPower[2]) - userArr[0].power[2])
                    }
特攻：${playerPower[3]}  ${
                      Math.sign(Number(playerPower[3]) - userArr[0].power[3]) >=
                      0
                        ? "+" + (Number(playerPower[3]) - userArr[0].power[3])
                        : "" + (Number(playerPower[3]) - userArr[0].power[3])
                    }
特防：${playerPower[4]}  ${
                      Math.sign(Number(playerPower[4]) - userArr[0].power[4]) >=
                      0
                        ? "+" + (Number(playerPower[4]) - userArr[0].power[4])
                        : "" + (Number(playerPower[4]) - userArr[0].power[4])
                    }
速度：${playerPower[5]}  ${
                      Math.sign(Number(playerPower[5]) - userArr[0].power[5]) >=
                      0
                        ? "+" + (Number(playerPower[5]) - userArr[0].power[5])
                        : "" + (Number(playerPower[5]) - userArr[0].power[5])
                    }
${point}
`;
                  await sendMarkdown(ctx, md, session);
                  return;
                case "n":
                case "N":
                  return "你对这个新宝可梦不太满意，把他放生了";
                default:
                  return "新出生的宝可梦好像逃走了";
              }
            } else {
              //没有战斗宝可梦
              await ctx.database.set(
                "pokebattle",
                { id: session.userId },
                {
                  monster_1: dan[1],
                  base: pokemonCal.pokeBase(dan[1]),
                  battlename: dan[0],
                  power: pokemonCal.power(
                    pokemonCal.pokeBase(dan[1]),
                    userArr[0].level,
                    playerList,
                    dan[1]
                  ),
                }
              );

              return `恭喜你
成功融合出优秀的后代宝可梦【${dan[0]}】
${pokemonCal.pokemomPic(dan[1], true)}
成功将${dan[0]}放入战斗栏
${h("at", { id: session.userId })}`;
            }
          }
        } else {
          return `蛋好像已经臭了，无法孵化。`;
        }
      } else {
        try {
          await session.execute(`签到`);
          return;
        } catch (e) {
          return `请先输入 签到 领取属于你的宝可梦和精灵球`;
        }
      }
    });

  ctx
    .command("宝可梦")
    .subcommand("查看信息 <user:string>", "查看用户信息")
    .action(async ({ session }, user) => {
      let pokemonimg1 = [];
      let pokemonimg = [];
      let ultramonsterimg = [];
      let userArr: Pokebattle[] = [];
      let userId: string;
      const infoImgSelf_bg = await ctx.canvas.loadImage(
        `${testcanvas}${resolve(
          __dirname,
          "./assets/img/components",
          "trainercard.png"
        )}`
      );
      let expbar = await ctx.canvas.loadImage(
        `${testcanvas}${resolve(
          __dirname,
          "./assets/img/components",
          "expbar.png"
        )}`
      );
      let overlay = await ctx.canvas.loadImage(
        `${testcanvas}${resolve(
          __dirname,
          "./assets/img/components",
          "overlay_exp.png"
        )}`
      );
      if (!user) {
        //查看自己信息
        userId = session.userId;
        userArr = await ctx.database.get("pokebattle", { id: session.userId });
      } else {
        if (session.platform == "red") {
          try {
            userId = session.elements[1].attrs.id;
          } catch {
            return `请@一位训练师或者查看自己属性`;
          }
        } else {
          try {
            userId = /[0-9A-Z]+/.exec(user)[0];
          } catch {
            return `请@一位训练师或者查看自己属性`;
          }
        }
        userArr = await ctx.database.get("pokebattle", { id: userId });
      }
      if (userArr.length != 0) {
        let bagspace: string[] = [];
        for (let i = 0; i < userArr[0].AllMonster.length; i++) {
          if (userArr[0]?.AllMonster[i] != "0") {
            bagspace.push(userArr[0].AllMonster[i]);
          }
        }
        //存在数据
        //图片服务
        const vip = isVip(userArr[0]);
        const vipName = vip ? "💎VIP" : "";
        const playerLimit = await isResourceLimit(session.userId, ctx);
        const infoId =
          userArr[0].id.length > 15
            ? `${userArr[0].id.slice(0, 3)}...${userArr[0].id.slice(-3)}`
            : userArr[0].id;
        const infoName = userArr[0].name
          ? userArr[0].name
          : session.username > 10
          ? session.username
          : infoId;
        const playerTrainer = userArr[0].trainer_list.find(
          (train) => train.tid == userArr[0].trainerIndex
        );
        for (let i = 0; i < userArr[0].AllMonster.length; i++) {
          pokemonimg1[i] = await ctx.canvas.loadImage(
            `${config.图片源}/sr/${userArr[0].AllMonster[i].split(".")[0]}.png`
          );
        }
        for (let i = 0; i < 5; i++) {
          ultramonsterimg[i] = await ctx.canvas.loadImage(
            `${config.图片源}/sr/${banID[i].split(".")[0]}.png`
          );
        }
        if (userArr[0].monster_1 !== "0")
          pokemonimg = await ctx.canvas.loadImage(
            `${config.图片源}/fusion/${userArr[0].monster_1.split(".")[0]}/${
              userArr[0].monster_1
            }.png`
          );
        let trainerimg = await ctx.canvas.loadImage(
          `${config.图片源}/trainers/${playerTrainer.source_name}.png`
        );
        const infoImgSelfClassic = await ctx.canvas.render(
          485,
          703,
          async (ctx) => {
            ctx.drawImage(infoImgSelf_bg, 0, 0, 485, 703);
            if (userArr[0].monster_1 !== "0") {
              ctx.globalAlpha = 0.5;
              ctx.drawImage(pokemonimg, 316, 95, 135, 135);
              ctx.globalAlpha = 1;
              ctx.drawImage(trainerimg, 342, 119, 112, 112);
            } else {
              ctx.drawImage(trainerimg, 316, 95, 135, 135);
            }
            for (let i = 0; i < ultramonsterimg.length; i++) {
              ctx.globalAlpha = 0.5;
              if (userArr[0].ultramonster.includes(banID[i])) {
                ctx.globalAlpha = 1;
              }
              ctx.drawImage(ultramonsterimg[i], 134 + 48 * i, 300, 25, 25);
            }
            ctx.globalAlpha = 1;
            ctx.font = "bold 20px zpix";
            for (let i = 0; i < pokemonimg1.length; i++) {
              if (i % 2 == 0) {
                ctx.drawImage(pokemonimg1[i], 6, 360 + 90 * (i / 2), 64, 64);
                ctx.fillText(
                  "【" +
                    pokemonCal.pokemonlist(userArr[0].AllMonster[i]) +
                    "】",
                  76,
                  400 + 90 * (i / 2)
                );
              } else {
                ctx.drawImage(
                  pokemonimg1[i],
                  254,
                  373 + 90 * ((i - 1) / 2),
                  64,
                  64
                );
                ctx.fillText(
                  "【" +
                    pokemonCal.pokemonlist(userArr[0].AllMonster[i]) +
                    "】",
                  324,
                  413 + 90 * ((i - 1) / 2)
                );
              }
            }
            ctx.font = "bold 20px zpix";
            ctx.fillText(vipName, 340, 261);
            ctx.font = "normal 25px zpix";
            ctx.fillText("：" + infoId, 61, 72);

            ctx.fillText("：" + (vip ? "👑" : "") + infoName, 86, 122);
            ctx.fillText("：" + userArr[0].gold, 137, 168);
            ctx.fillText("：" + userArr[0].captureTimes, 137, 218);
            ctx.fillText("：" + userArr[0].coin, 137, 263);
            ctx.fillText(userArr[0].level, 358, 73);
            ctx.font = "bold 25px zpix";
            ctx.fillText("EXP>>                <<", 105, 650);
            ctx.drawImage(
              overlay,
              181,
              644,
              (160 * userArr[0].exp) / expToLv.exp_lv[userArr[0].level].exp,
              8
            );
            ctx.drawImage(expbar, 163, 641, 180, 20);
            if (vip) {
              ctx.strokeStyle = "gold";
              ctx.lineWidth = 10;
              ctx.strokeRect(0, 0, 485, 703);
            }
          }
        );

        const { src } = infoImgSelfClassic.attrs;
        //图片服务
        let md = "";
        const chance = await getChance(userArr[0], ctx);
        try {
          md = `# <qqbot-at-user id="${userId}" />的训练师卡片
![img#485px #703px](${await toUrl(ctx, session, src)})
[📃 问答](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
            `/宝可问答`
          )}&reply=false&enter=true) || [⚔️ 对战](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
            `/对战`
          )}&reply=false&enter=true) || [📕 属性](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
            `/属性`
          )}&reply=false&enter=true)

[🛒 商店](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
            `/购买`
          )}&reply=false&enter=true) || [🔈 公告](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
            `/notice`
          )}&reply=false&enter=true) || [🔖 帮助](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
            `/宝可梦`
          )}&reply=false&enter=true)

[🏆 兑换](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
            `/使用 `
          )}&reply=false&enter=false) || [👐 放生](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
            `/放生`
          )}&reply=false&enter=true) || [♂ 融合](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
            `/融合宝可梦`
          )}&reply=false&enter=true)


[**➣ ⚔️和他对战** ](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
            `/对战 ${session.userId} `
          )}&reply=false&enter=true)
---

- 对战积分：${playerLimit.rankScore}
- 积分排名：${
            userArr[0].lap > 2
              ? `不计入排名`
              : playerLimit.rank
              ? playerLimit.rank
              : `未进入前十`
          }
- 金币获取剩余：${playerLimit.resource.goldLimit} 
- 补签卡：${userArr[0].signCard}
- 当前树果 :${
            userArr[0].berry_food?.berrytree
              ? userArr[0].berry_food?.berrytree
              : `无 -> <qqbot-cmd-input text="/携带树果" show="点击携带" reference="false" />`
          }
- 宝可梦属性：${getType(userArr[0].monster_1).join(" ")}

---
${
  userArr[0].advanceChance
    ? `你当前可以进入三周目

[三周目](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
        `/lapnext`
      )}&reply=false&enter=true)`
    : " "
}
${
  chance
    ? `你当前可以领取三周目资格

[领取](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
        `/getchance`
      )}&reply=false&enter=true)`
    : " "
} 

> *邀请麦麦子到其他群做客可以增加3w获取上限哦~o\(\*\/\/\/\/\▽\/\/\/\/\*\)q`;
          await sendMarkdown(
            ctx,
            md,
            session,
            normalKb(session, userArr as Pokebattle[])
          );
        } catch (e) {
          console.log(e);
          md = `# ${userArr[0].name}的训练师卡片
![img#485px #703px](${await toUrl(ctx, session, src)})
[📃 宝可问答](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
            `/宝可问答`
          )}&reply=false&enter=true) || [⚔️ 对战](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
            `/对战`
          )}&reply=false&enter=true) || [📕 属性](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
            `/属性`
          )}&reply=false&enter=true)

[🛒 购买](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
            `/购买`
          )}&reply=false&enter=true) || [🔈 公告](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
            `/notice`
          )}&reply=false&enter=true) || [🔖 宝可梦](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
            `/宝可梦`
          )}&reply=false&enter=true)

[🏆 使用](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
            `/使用 `
          )}&reply=false&enter=false) || [👐 放生](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
            `/放生`
          )}&reply=false&enter=true) || [♂ 融合宝可梦](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
            `/融合宝可梦`
          )}&reply=false&enter=true)

---
- 对战积分：${playerLimit.rankScore}
- 积分排名：${
            userArr[0].lap > 2
              ? `不计入排名`
              : playerLimit.rank
              ? playerLimit.rank
              : `未进入前十`
          }
- 金币获取剩余：${playerLimit.resource.goldLimit}
- 宝可梦属性：${getType(userArr[0].monster_1).join(" ")}

---
${
  userArr[0].advanceChance
    ? `你当前可以进入三周目

[/lapnext](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
        `/lapnext`
      )}&reply=false&enter=true)`
    : " "
}
${
  chance
    ? `你当前可以领取三周目资格

[/getchance](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
        `/getchance`
      )}&reply=false&enter=true)`
    : " "
} 

> *邀请麦麦子到其他群做客可以增加3w获取上限哦~o\(\*\/\/\/\/\▽\/\/\/\/\*\)q`;
          const imgBuffer = await ctx.markdownToImage.convertToImage(
            md.replace(`<qqbot-at-user id="${userId}"/>的`, "")
          );
          return `${h.image(imgBuffer, "image/png")}`;
        }
      } else {
        try {
          await session.execute(`签到`);
          return;
        } catch (e) {
          return `请先输入 签到 领取属于你的宝可梦和精灵球`;
        }
        //不存在数据
      }
    });

  ctx
    .command("宝可梦")
    .subcommand("放生 <pokemon>", "放生宝可梦")
    .action(async ({ session }, pokemon: string) => {
      let putMessage = { id: "" };
      let choose: string;
      const userArr = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      const vip = isVip(userArr[0]);
      const vipReward = vip ? 1.5 : 1;
      if (userArr.length == 0) {
        try {
          await session.execute(`签到`);
          return;
        } catch (e) {
          return `请先输入 签到 领取属于你的宝可梦和精灵球`;
        }
      }
      //图片服务
      await ctx.database.set("pokebattle", { id: session.userId }, (row) => ({
        isPut: true,
      }));
      const playerList: PokemonList = await getList(
        session.userId,
        ctx,
        userArr[0].monster_1
      );
      if (pokemon) {
        if (Number(pokemon) > userArr[0].AllMonster.length) return `输入错误`;
        choose = pokemon;
      } else {
        let pokemonimg1: string[] = [];
        const bgImg = await ctx.canvas.loadImage(
          `${testcanvas}${resolve(
            __dirname,
            "./assets/img/components",
            "bag.png"
          )}`
        );
        for (let i = 0; i < userArr[0].AllMonster.length; i++) {
          pokemonimg1[i] = await ctx.canvas.loadImage(
            `${config.图片源}/sr/${userArr[0].AllMonster[i].split(".")[0]}.png`
          );
        }
        const image = await ctx.canvas.render(512, 381, async (ctx) => {
          ctx.drawImage(bgImg, 0, 0, 512, 381);
          ctx.font = "bold 20px zpix";
          for (let i = 0; i < pokemonimg1.length; i++) {
            if (i % 2 == 0) {
              ctx.drawImage(pokemonimg1[i], 28, 60 + 90 * (i / 2), 64, 64);
              ctx.fillText(
                "【" +
                  (i + 1) +
                  "】" +
                  pokemonCal.pokemonlist(userArr[0].AllMonster[i]),
                82,
                100 + 90 * (i / 2)
              );
            } else {
              ctx.drawImage(
                pokemonimg1[i],
                276,
                72 + 90 * ((i - 1) / 2),
                64,
                64
              );
              ctx.fillText(
                "【" +
                  (i + 1) +
                  "】" +
                  pokemonCal.pokemonlist(userArr[0].AllMonster[i]),
                330,
                112 + 90 * ((i - 1) / 2)
              );
            }
          }
          if (vip) {
            ctx.strokeStyle = "gold";
            ctx.lineWidth = 10;
            ctx.strokeRect(0, 0, 512, 381);
          }
        });
        const { src } = image.attrs;
        //图片服务
        try {
          const kb = {
            keyboard: {
              content: {
                rows: [
                  {
                    buttons: [
                      button(
                        0,
                        pokemonCal.pokemonlist(userArr[0].AllMonster[0]),
                        "1",
                        session.userId,
                        "1"
                      ),
                      button(
                        0,
                        pokemonCal.pokemonlist(userArr[0].AllMonster[1]),
                        "2",
                        session.userId,
                        "2"
                      ),
                    ],
                  },
                  {
                    buttons: [
                      button(
                        0,
                        pokemonCal.pokemonlist(userArr[0].AllMonster[2]),
                        "3",
                        session.userId,
                        "3"
                      ),
                      button(
                        0,
                        pokemonCal.pokemonlist(userArr[0].AllMonster[3]),
                        "4",
                        session.userId,
                        "4"
                      ),
                    ],
                  },
                  {
                    buttons: [
                      button(
                        0,
                        pokemonCal.pokemonlist(userArr[0].AllMonster[4]),
                        "5",
                        session.userId,
                        "5"
                      ),
                      button(
                        0,
                        pokemonCal.pokemonlist(userArr[0].AllMonster[5]),
                        "6",
                        session.userId,
                        "6"
                      ),
                    ],
                  },
                ],
              },
            },
          };
          const md = `# <qqbot-at-user id="${session.userId}" />选择放生宝可梦
![img#512px #381px](${await toUrl(ctx, session, src)})`;
          putMessage = await sendMarkdown(ctx, md, session, kb);
        } catch (e) {
          putMessage = await session.send(`\n${image}
回复【编号】进行放生
官方机器人请@Bot后输入序号
`);
        }
        choose = await session.prompt(20000);
      }
      if (!choose) {
        await ctx.database.set("pokebattle", { id: session.userId }, (row) => ({
          isPut: false,
        }));
        await session.bot.deleteMessage(session.channelId, putMessage.id);
        return `${h("at", {
          id: session.userId,
        })}你好像还在犹豫，有点舍不得他们`;
      }
      if (userArr[0].AllMonster[Number(choose) - 1]) {
        if (userArr[0].AllMonster.length === 1) {
          await ctx.database.set(
            "pokebattle",
            { id: session.userId },
            (row) => ({
              isPut: false,
            })
          );
          await session.bot.deleteMessage(session.channelId, putMessage.id);
          return `${h("at", {
            id: session.userId,
          })}你只剩一只宝可梦了，无法放生`;
        }
        // let discarded=userArr[0].AllMonster[Number(choose)-1]
        let chsNum = Number(choose) - 1;
        let baseexp = Number(
          expBase.exp[
            Number(String(userArr[0].AllMonster[chsNum]).split(".")[0]) - 1
          ].expbase
        );
        let expGet =
          userArr[0].level > 99
            ? 0
            : Math.floor(((userArr[0].level * baseexp) / 7) * vipReward);
        let discarded = userArr[0].AllMonster.splice(Number(choose) - 1, 1);
        let expNew = pokemonCal.expCal(
          userArr[0].level,
          userArr[0].exp + expGet
        )[1];
        let getGold =
          userArr[0].level > 99
            ? Math.floor(pokemonCal.mathRandomInt(350, 500) * vipReward)
            : 0;
        let lvNew = pokemonCal.expCal(
          userArr[0].level,
          userArr[0].exp + expGet
        )[0];
        const resource = await isResourceLimit(session.userId, ctx);
        const rLimit = new PrivateResource(resource.resource.goldLimit);
        getGold = await rLimit.getGold(ctx, getGold, session.userId);
        const legendaryPokemonRandom = Math.random() * 100;
        const events =
          `将宝可梦放生后，身心受到了净化赛博功德+1
` +
          (pokemon
            ? `捕捉途中放生宝可梦，好像什么都无法发生`
            : legendaryPokemonRandom > 99.5 - userArr[0].cyberMerit * 0.04
            ? `放生过程中，你好像看到了一个身影`
            : ``);
        const addMerits = userArr[0].cyberMerit > 99 ? 0 : 1;
        const isEvent = userArr[0].lap < 3 || userArr[0].level < 90;
        await ctx.database.set("pokebattle", { id: session.userId }, (row) => ({
          AllMonster: userArr[0].AllMonster,
          level: lvNew,
          exp: expNew,
          power: pokemonCal.power(
            pokemonCal.pokeBase(userArr[0].monster_1),
            lvNew,
            playerList,
            userArr[0].monster_1
          ),
          cyberMerit: $.add(row.cyberMerit, addMerits),
        }));
        try {
          const src = pokemonCal
            .pokemomPic(discarded[0], false)
            .toString()
            .match(/src="([^"]*)"/)[1];
          const md = `# <qqbot-at-user id="${
            session.userId
          }" />你将【${pokemonCal.pokemonlist(discarded[0])}】放生了
![img#512px #512px](${await toUrl(ctx, session, src)})

---
> **Lv.${lvNew}**${pokemonCal.exp_bar(lvNew, expNew)}

---
> ${userArr[0].level > 99 ? `金币+${getGold}` : `经验+${expGet}`}
${!isEvent ? events : ""}

当前赛博功德值:${userArr[0].cyberMerit + addMerits}`;
          const kb = {
            keyboard: {
              content: {
                rows: [
                  {
                    buttons: [
                      button(2, "👐 继续放生", "/放生", session.userId, "6"),
                      button(
                        2,
                        "📷 继续捕捉",
                        "/捕捉宝可梦",
                        session.userId,
                        "2"
                      ),
                    ],
                  },
                  {
                    buttons: [
                      button(
                        2,
                        "💳 查看信息",
                        "/查看信息",
                        session.userId,
                        "3"
                      ),
                      button(2, "⚔️ 对战", "/对战", session.userId, "4"),
                    ],
                  },
                ],
              },
            },
          };
          try {
            await session.bot.deleteMessage(session.channelId, putMessage.id);
          } catch {}
          await sendMarkdown(ctx, md, session, kb);
          await ctx.database.set(
            "pokebattle",
            { id: session.userId },
            (row) => ({
              isPut: false,
            })
          );
          if (userArr[0].lap < 3 || userArr[0].level < 90) return;
          if (!pokemon) {
            if (legendaryPokemonRandom > 99.5 - userArr[0].cyberMerit * 0.04) {
              const key = crypto
                .createHash("md5")
                .update(session.userId + new Date().getTime())
                .digest("hex")
                .toUpperCase();
              legendaryPokemonId[key] = "342.342";
              await session.execute(`捕捉宝可梦 ${key}`);
              await ctx.setTimeout(() => {
                delete legendaryPokemonId[key];
              }, 2000);
            }
          }
        } catch (e) {
          await ctx.database.set(
            "pokebattle",
            { id: session.userId },
            (row) => ({
              isPut: false,
            })
          );
          try {
            await session.bot.deleteMessage(session.channelId, putMessage.id);
          } catch {}
          return `
你将【${pokemonCal.pokemonlist(discarded[0])}】放生了
${pokemonCal.pokemomPic(discarded[0], false)}
经验+${expGet}
当前等级为:
lv.${lvNew}
当前经验：
${pokemonCal.exp_bar(lvNew, expNew)}
${h("at", { id: session.userId })}
        `;
        }
      } else {
        await ctx.database.set("pokebattle", { id: session.userId }, (row) => ({
          isPut: false,
        }));
        try {
          await session.bot.deleteMessage(session.channelId, putMessage.id);
        } catch {}
        return `你好像想放生一些了不得的东西`;
      }
    });

  ctx
    .command("宝可梦")
    .subcommand("属性", "查看战斗宝可梦属性")
    .usage(`/属性`)
    .action(async ({ session }) => {
      let tar = session.userId;
      const userArr = await ctx.database.get("pokebattle", { id: tar });
      if (userArr.length == 0) {
        try {
          await session.execute(`签到`);
          return;
        } catch (e) {
          return `请先输入 签到 领取属于你的宝可梦和精灵球`;
        }
      }
      if (userArr[0].monster_1 == "0")
        return `你还没有战斗宝可梦，快去 融合宝可梦 吧`;
      const img = userArr[0].monster_1;
      const fath =
        userArr[0].monster_1.split(".")[0] +
        "." +
        userArr[0].monster_1.split(".")[0];
      const math =
        userArr[0].monster_1.split(".")[1] +
        "." +
        userArr[0].monster_1.split(".")[1];
      let toDo = "";
      const playerList: PokemonList = await getList(
        session.userId,
        ctx,
        userArr[0].monster_1
      );
      const playerPower = pokemonCal.power(
        pokemonCal.pokeBase(userArr[0].monster_1),
        userArr[0].level,
        playerList,
        userArr[0].monster_1
      );
      const index = playerList.pokemon.findIndex(
        (pokeId) => pokeId.id === userArr[0].monster_1
      );
      await ctx.database.set("pokebattle", { id: session.userId }, (row) => ({
        power: playerPower,
      }));
      if (userArr[0]?.base[0]) {
        toDo = `能力值：
生命：${playerPower[0]}   努力值：${playerList.pokemon[index].power[0]}
攻击：${playerPower[1]}   努力值：${playerList.pokemon[index].power[1]}
防御：${playerPower[2]}   努力值：${playerList.pokemon[index].power[2]}
特攻：${playerPower[3]}   努力值：${playerList.pokemon[index].power[3]}
特防：${playerPower[4]}   努力值：${playerList.pokemon[index].power[4]}
速度：${playerPower[5]}   努力值：${playerList.pokemon[index].power[5]}`;
      }
      try {
        const point = "```";
        const src = await toUrl(
          ctx,
          session,
          `${config.图片源}/fusion/${img.split(".")[0]}/${img}.png`
        );
        const md = `${userArr[0].battlename}的属性
![img #512px #512px](${src})

> 宝可梦属性：${getType(userArr[0].monster_1).join(" ")}
父本：${pokemonCal.pokemonlist(fath)}
母本：${pokemonCal.pokemonlist(math)}

---
${point}
${toDo}
性格：${
          playerList.pokemon[index]?.natures?.effect
            ? playerList.pokemon[index].natures.effect
            : "未加载"
        }
${point}`;
        await sendMarkdown(ctx, md, session, {
          keyboard: {
            content: {
              rows: [
                {
                  buttons: [
                    button(
                      0,
                      "♂ 融合宝可梦",
                      "/融合宝可梦",
                      session.userId,
                      "1"
                    ),
                    button(
                      0,
                      "📷 捕捉宝可梦",
                      "/捕捉宝可梦",
                      session.userId,
                      "2"
                    ),
                  ],
                },
                {
                  buttons: [
                    button(0, "💳 查看信息", "/查看信息", session.userId, "3"),
                    button(0, "⚔️ 对战", "/对战", session.userId, "4"),
                  ],
                },
              ],
            },
          },
        });
      } catch (e) {
        console.log(e);
        return `\u200b
============
${userArr[0].battlename}
${toDo}
============
tips:听说不同种的宝可梦融合更有优势噢o(≧v≦)o~~
      `;
      }
    });

  ctx
    .command("宝可梦")
    .subcommand("对战 <user>", "和其他训练师对战", {
      minInterval: config.对战cd * 1000,
    })
    .usage(`/对战 @user`)
    .shortcut(/对战\+(.*)$/, { args: ["$1"] })
    .action(async ({ session }, user) => {
      let canLegendaryPokemon = false;
      let readyMessage = { id: "" };
      const mid = user ? user.split("+")[0] : user;
      user = mid;
      let battleSuccess = false;
      let jli: string = "";
      let robot: Pokebattle;
      try {
        let userId: string;
        let randomUser: { id: string };
        const userArr: Pokebattle[] = await ctx.database.get("pokebattle", {
          id: session.userId,
        });
        const userLimit = await isResourceLimit(session.userId, ctx);
        if (userArr.length == 0) {
          try {
            await session.execute(`签到`);
            return;
          } catch (e) {
            return `请先输入 签到 领取属于你的宝可梦和精灵球`;
          }
        }
        const userVip = isVip(userArr[0]);
        const winRate = userArr[0].win_count / userArr[0].total_battle;
        if (userArr[0].skillSlot.length == 0) {
          await session.send(`对战机制更新。请重新装备技能`);
        }
        const playerList: PokemonList = await getList(
          session.userId,
          ctx,
          userArr[0].monster_1
        );
        let spendGold = userVip ? 149 : 299;
        spendGold =
          userLimit.resource.goldLimit == 0 && userArr[0].level == 100
            ? 0
            : spendGold;
        if (userArr[0].gold < spendGold) {
          return `你的金币不足，无法对战`;
        }
        let commands = "";
        let img = "";
        if (userArr[0].monster_1 == "0") {
          commands = `融合宝可梦`;
        }
        if (userArr[0].skillbag.length == 0) {
          commands = `技能扭蛋机`;
        }
        if (userArr[0].skillSlot.length == 0) {
          commands = `装备技能`;
        }
        if (commands) {
          for (let i = 0; i < userArr[0].AllMonster.length; i++) {
            img += `![img#20px #20px](${await toUrl(
              ctx,
              session,
              `${config.图片源}/sr/${
                userArr[0].AllMonster[i].split(".")[0]
              }.png`
            )})`;
          }
          const md = `![img#50px #50px](https://q.qlogo.cn/qqapp/102072441/${
            session.userId
          }/640) **LV.${userArr[0].level}**
${img}

---
<qqbot-at-user id="${session.userId}" />你还没有${commands}吧
点击👉 [${commands}](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
            `/${commands}`
          )}&reply=false&enter=fales)
`;
          await sendMarkdown(ctx, md, session);
          return;
        }
        if (!user) {
          try {
            let randomID = await ctx.database
              .select("pokebattle")
              .where((row) =>
                $.and(
                  $.ne(row.id, userArr[0].id),
                  $.lte(row.level, Number(userArr[0].level)),
                  $.gte(row.level, Number(userArr[0].level) - 5),
                  $.ne(row.monster_1, "0"),
                  $.eq(row.lap, userArr[0].lap),
                  $.gte($.length(row.skillSlot), 1)
                )
              )
              .execute();
            canLegendaryPokemon = true;
            const random = Math.random();
            if (randomID.length == 0 || random > winRate) {
              canLegendaryPokemon = false;
              randomID = await ctx.database
                .select("pokebattle")
                .where((row) =>
                  $.and(
                    $.ne(row.id, userArr[0].id),
                    $.lte(row.level, Number(userArr[0].level)),
                    $.gte(row.level, Number(userArr[0].level) - 5),
                    $.gt(row.battleTimes, 0),
                    $.ne(row.monster_1, "0"),
                    $.eq(row.lap, userArr[0].lap)
                  )
                )
                .execute();
            }
            if (randomID.length == 0) {
              canLegendaryPokemon = false;
              robot = new Robot(userArr[0].level);
              userId = robot.id;
            } else {
              randomUser =
                randomID[pokemonCal.mathRandomInt(0, randomID.length - 1)];
              userId = randomUser.id;
            }
          } catch (e) {
            logger.error(e);
            return `网络繁忙，请再试一次`;
          }
        } else {
          if (session.platform !== "qq") {
            userId = session.elements[1].attrs.id;
            battleSuccess = true;
          } else {
            battleSuccess = false;
            userId = /[0-9A-Za-z]+/.exec(user)[0];
            if (!/[0-9A-Za-z]+/.test(userId)) {
              return `请@一位宝可梦训练师，例如对战 @麦Mai`;
            }
          }
        }
        let tarArr =
          userId?.substring(0, 5) == "robot"
            ? [robot]
            : await ctx.database.get("pokebattle", { id: userId });
        if (session.userId == userId) {
          return `你不能对自己发动对战`;
        } else if (tarArr.length == 0 || tarArr[0].monster_1 == "0") {
          return `对方还没有宝可梦`;
        }
        const robotlist: PokemonList = {
          id: "robot",
          win_count: 0,
          pokemon: [
            {
              id: "robot",
              name: this.name,
              natures: {
                effect: "无",
                up: 0,
                down: 0,
              },
              natureLevel: 0,
              power: [0, 0, 0, 0, 0, 0],
            },
          ],
        };
        const tarList: PokemonList =
          userId?.substring(0, 5) == "robot"
            ? robotlist
            : await getList(userId, ctx, tarArr[0].monster_1);
        tarArr[0].base = pokemonCal.pokeBase(tarArr[0].monster_1);
        tarArr[0].power = pokemonCal.power(
          pokemonCal.pokeBase(tarArr[0].monster_1),
          tarArr[0].level,
          tarList,
          tarArr[0].monster_1
        );

        await ctx.database.set(
          "pokebattle",
          { id: userId },
          {
            base: tarArr[0].base,
            power: tarArr[0].power,
          }
        );
        userArr[0].power = pokemonCal.power(
          pokemonCal.pokeBase(userArr[0].monster_1),
          userArr[0].level,
          playerList,
          userArr[0].monster_1
        );
        readyMessage = await session.send(
          `${
            userVip ? `你支付了会员价${spendGold}` : `你支付了${spendGold}`
          }金币，请稍等，正在发动了宝可梦对战`
        );
        if (tarArr[0].battleTimes == 0) {
          let noTrainer = battleSuccess
            ? session.elements[1].attrs.name
            : isVip(tarArr[0])
            ? "[💎VIP]"
            : "" + (tarArr[0].name || tarArr[0].battlename);
          jli = `${noTrainer}已经筋疲力尽,每一小时恢复一次可对战次数`;
        }
        let useFood = !!userArr[0].berry_food;
        let battle = pokebattle(userArr[0], tarArr[0]);
        useFood = useFood && !userArr[0].berry_food;
        let battlelog = battle[0];
        let winner = battle[1];
        let loser = battle[2];
        let win_count = 0;
        let getScore = 0;
        await ctx.database.set("pokebattle", { id: session.userId }, (row) => ({
          gold: $.sub(row.gold, spendGold),
          total_battle: $.add(row.total_battle, 1),
          win_count: $.add(row.win_count, winner == session.userId ? 1 : 0),
          power: userArr[0].power,
          berry_food: userArr[0].berry_food,
          battle_log: battlelog + `??` + tarArr[0].id,
        }));
        if (!user) {
          const index = playerList.pokemon.findIndex(
            (pokeId) => pokeId.id === userArr[0].monster_1
          );
          win_count = winner == session.userId ? playerList.win_count + 1 : 0;
          getScore =
            winner == session.userId
              ? userArr[0].level < 100
                ? 2
                : win_count + 1 > 9
                ? 9
                : win_count + 1
              : 0;
          await ctx.database.set(
            "pokemon.resourceLimit",
            { id: winner },
            (row) => ({
              rankScore: $.add(row.rankScore, getScore),
            })
          );
          await ctx.database.set(
            "pokemon.resourceLimit",
            { id: loser, rankScore: { $gt: 0 } },
            (row) => ({
              rankScore: $.sub(row.rankScore, 1),
            })
          );
          if (index !== -1) {
            playerList.pokemon[index].natureLevel =
              winner == session.userId
                ? 2 * (win_count - 1) > 11
                  ? 11
                  : 2 * (win_count - 1)
                : 1;
            await ctx.database.set(
              "pokemon.list",
              { id: session.userId },
              (row) => ({
                win_count: win_count,
                pokemon: playerList.pokemon,
              })
            );
          }
        }
        let loserArr =
          loser.substring(0, 5) == "robot"
            ? [robot]
            : await ctx.database.get("pokebattle", { id: loser });
        let winnerArr =
          winner.substring(0, 5) == "robot"
            ? [robot]
            : await ctx.database.get("pokebattle", { id: winner });
        let getgold =
          pokemonCal.mathRandomInt(1300, 1500) +
          (isVip(winnerArr[0]) ? 500 : 0);

        /* 金币上限 */
        if (winner.substring(0, 5) !== "robot" && winner == session.userId) {
          const resource = await isResourceLimit(winner, ctx);
          const rLimit = new PrivateResource(resource.resource.goldLimit);
          getgold = await rLimit.getGold(ctx, getgold, winner);
        } else {
          await ctx.database.set(
            "pokebattle",
            { id: session.userId },
            {
              gold: { $add: [{ $: "gold" }, spendGold / 2] },
            }
          );
        }

        const winName = isVip(winnerArr[0]) ? "[💎VIP]" : "";
        const loseName = isVip(loserArr[0]) ? "[💎VIP]" : "";
        const loserlog = `${(
          loseName + (loserArr[0].name || loserArr[0].battlename)
        ).replace(/\*/g, "口")}输了\r`;
        try {
          const legendaryPokemonRandom = Math.random() * 100;
          const md = `<qqbot-at-user id="${session.userId}" />对战结束${
            useFood ? " 已使用树果" : ""
          }
![img#712px #750px](${await toUrl(
            ctx,
            session,
            await getPic(ctx, battlelog, userArr[0], tarArr[0])
          )})

---
获胜者:${
            winName +
            (winnerArr[0].name || winnerArr[0].battlename).replace(/\*/g, "口")
          }
${
  winner == session.userId
    ? `金币+${getgold}  ${
        user
          ? "指定对战无法获得积分"
          : `对战积分+${getScore} ${
              userArr[0].level < 100
                ? `

> 未满级玩家无连胜积分`
                : ""
            }

当前连胜：${win_count - 1}`
      }

---
> ${loserlog} ${user ? "" : "对战积分-1"}`
    : `
---
> ${loseName}<qqbot-at-user id="${session.userId}" />你输了已返还一半金币 ${
        user ? "" : "对战积分-1"
      }`
}`;
          const kb = {
            keyboard: {
              content: {
                rows: [
                  {
                    buttons: [
                      button(
                        2,
                        "♂ 融合宝可梦",
                        "/融合宝可梦",
                        session.userId,
                        "1"
                      ),
                      button(
                        2,
                        "📷 捕捉宝可梦",
                        "/捕捉宝可梦",
                        session.userId,
                        "2"
                      ),
                    ],
                  },
                  {
                    buttons: [
                      button(
                        2,
                        "💳 查看信息",
                        "/查看信息",
                        session.userId,
                        "3"
                      ),
                      button(2, "⚔️ 对战", "/对战", session.userId, "4"),
                    ],
                  },
                  {
                    buttons: [
                      button(
                        2,
                        "🎯 对手信息",
                        `/查看信息 ${userId}`,
                        session.userId,
                        "5"
                      ),
                      button(
                        2,
                        "⚔️ 和他对战",
                        `/对战 ${session.userId}`,
                        session.userId,
                        "6"
                      ),
                    ],
                  },
                  {
                    buttons: [
                      button(
                        2,
                        "📕 战斗详情",
                        `/战斗详情 ${session.userId}`,
                        session.userId,
                        "5"
                      ),
                    ],
                  },
                ],
              },
            },
          };
          session.bot.deleteMessage(session.channelId, readyMessage);
          await sendMarkdown(ctx, md, session, kb);
          if (
            userArr[0].lap < 3 ||
            userArr[0].level < 90 ||
            userArr[0].fossil_bag.length < 1
          )
            return;
          if (!canLegendaryPokemon || win_count - 1 < 30) return;
          const pokedex = new Pokedex(userArr[0]);
          if (pokedex.check("348.348")) return;
          legendaryPokemonRandom > 90 - userArr[0].cyberMerit * 0.04
            ? await session.send(`接下来你将和盖诺赛克特对战...`)
            : null;
          if (legendaryPokemonRandom > 90 - userArr[0].cyberMerit * 0.04) {
            const key = crypto
              .createHash("md5")
              .update(session.userId + new Date().getTime())
              .digest("hex")
              .toUpperCase();
            legendaryPokemonId[key] = "348.348";
            await session.execute(`捕捉宝可梦 ${key}`);
            await ctx.setTimeout(() => {
              delete legendaryPokemonId[key];
            }, 2000);
          }
          return;
        } catch {
          session.bot.deleteMessage(session.channelId, readyMessage.id);
          return `${h.image(
            await getPic(ctx, battlelog, userArr[0], tarArr[0])
          )}
${h("at", { id: session.userId })}\u200b
战斗结束
====================
获胜者:${winName + (winnerArr[0].name || winnerArr[0].battlename)}
金币+${getgold}
====================
${jli}`;
        }
      } catch (e) {
        logger.info(e);
        return `对战失败`;
      }
    });

  ctx
    .command("宝可梦")
    .subcommand("战斗详情 [id:text]", "查看宝可梦信息")
    .action(async ({ session }, id: string) => {
      if (!id) {
        id = session.userId;
      }
      const [player]: Pokebattle[] = await ctx.database.get("pokebattle", {
        id: id,
      });
      if (!player) {
        try {
          await session.execute(`签到`);
          return;
        } catch (e) {
          return `请先输入 签到 领取属于你的宝可梦和精灵球`;
        }
      }
      const log = player.battle_log.split("??")[0];
      const tar = player.battle_log.split("??")[1];
      const tarLog = await ctx.database.get("pokebattle", { id: tar });
      const img = await getPic(ctx, log, player, tarLog[0], true);
      const imgContent = img.replace(/^data:image\/\w+;base64,/, "");
      const imgBuffer = Buffer.from(imgContent, "base64");
      let dimensions = imageSize(imgBuffer);
      const md = `# <qqbot-at-user id="${session.userId}" />战斗详情
![img#${dimensions.width}px #${dimensions.height}px](${await toUrl(
        ctx,
        session,
        img
      )})`;
      await sendMarkdown(ctx, md, session);
    });
  ctx
    .command("宝可梦")
    .subcommand("技能扭蛋机 [count:number]", "消耗扭蛋币，抽取技能")
    .usage(`/技能扭蛋机`)
    .action(async ({ session }, count) => {
      const userArr = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      if (!count) {
        count = 1;
      }
      count = Math.floor(count);
      if (userArr.length == 0) {
        try {
          await session.execute(`签到`);
          return;
        } catch (e) {
          return `${h("at", {
            id: session.userId,
          })}请先输入 签到 领取属于你的宝可梦和精灵球`;
        }
      }
      if (count > userArr[0].coin || count < 1)
        return `你的代币不足，要积极参与对战哦~`;
      if (userArr[0].coin < 1) {
        return `你的代币不足，要积极参与对战哦~`;
      }
      if (count > 50) return `一次最多抽取50个技能,防止消息无法发送`;
      await ctx.database.set(
        "pokebattle",
        { id: session.userId },
        {
          coin: { $subtract: [{ $: "coin" }, count] },
        }
      );
      let skilllist = [];
      let getgold = 0;
      for (let i = 0; i < count; i++) {
        let getskill = pokemonCal.pokemonskill(userArr[0].level);
        if (userArr[0].skill == 0) {
          userArr[0].skillbag.push(String(getskill));
          await ctx.database.set(
            "pokebattle",
            { id: session.userId },
            {
              skill: getskill,
            }
          );
        } else if (userArr[0].skillbag.includes(String(getskill))) {
          getgold += 350;
          skilllist.push(`${skillMachine.skill[getskill].skill}(重复)`);
          continue;
        } else {
          userArr[0].skillbag.push(String(getskill));
        }
        skilllist.push(skillMachine.skill[getskill].skill);
      }
      const resource = await isResourceLimit(session.userId, ctx);
      const rLimit = new PrivateResource(resource.resource.goldLimit);
      getgold = await rLimit.getGold(ctx, getgold, session.userId);
      await ctx.database.set(
        "pokebattle",
        { id: session.userId },
        {
          skillbag: userArr[0].skillbag,
        }
      );
      let md = "";
      const point = "```";
      try {
        md = `# <qqbot-at-user id="${session.userId}" /> 扭蛋结果
你抽取了${count}个技能
重复技能将被换成金币

---
${point}
${skilllist.join("\n")}
${point}

---
金币+${getgold}

---
> 点击后输入数字
即可连续抽取技能👉 [技能扭蛋机](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
          `/技能扭蛋机`
        )}&reply=false&enter=false)`;
        await sendMarkdown(ctx, md, session);
      } catch {
        md = `# 扭蛋结果
你抽取了${count}个技能
重复技能将被换成金币
        
---
${point}
${skilllist.join("\n")}
${point}
        
---
金币+${getgold}

---
> 指令 \`\`\`/技能扭蛋机\`\`\`后加数字可以抽取多个技能`;
        const imgBuffer = await ctx.markdownToImage.convertToImage(md);
        await session.send(h.image(imgBuffer, "image/png"));
      }
    });

  ctx
    .command("宝可梦")
    .subcommand("技能背包 [page:number]", "查看所有获得的技能")
    .usage(`/技能背包`)
    .action(async ({ session }, page: number) => {
      const userArr = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      if (userArr.length == 0) {
        try {
          await session.execute(`签到`);
          return;
        } catch (e) {
          return `请先输入 签到 领取属于你的宝可梦和精灵球`;
        }
      }
      if (!page) page = 1;
      const basePage = (page - 1) * 50;
      if (userArr[0]?.skillbag.length == 0)
        return `你还没有技能哦\n签到领取代币到【技能扭蛋机】抽取技能吧`;
      const skillPage = pokemonCal
        .skillbag(userArr[0].skillbag)
        .split("\n\n")
        .slice(basePage / 5, (basePage + 50) / 5)
        .join("\n\n");
      const bag = `${pokemonCal.skillbag(userArr[0].skillbag)}`;
      const point = "```";
      const kb = {
        keyboard: {
          content: {
            rows: [
              {
                buttons: [
                  button(
                    2,
                    "← 上一页",
                    `/技能背包 ${page - 1 > 0 ? page - 1 : 1}`,
                    session.userId,
                    "1"
                  ),
                  button(
                    2,
                    "下一页 →",
                    `/技能背包 ${page + 1}`,
                    session.userId,
                    "2"
                  ),
                ],
              },
              {
                buttons: [
                  button(2, "查询技能", `/查询技能`, session.userId, "1"),
                ],
              },
            ],
          },
        },
      };

      const md = `# ![img#50px #50px](https://q.qlogo.cn/qqapp/102072441/${session.userId}/640)<qqbot-at-user id="${session.userId}" />的技能背包

---
${point}
${skillPage}
${point}`;
      try {
        await sendMarkdown(ctx, md, session, kb);
      } catch {
        return `\u200b
你当前的技能：
${bag.replace(/\n/g, "||")}`;
      }
    });

  ctx
    .command("宝可梦")
    .subcommand("装备技能 <skill>", "装备技能", { minInterval: 1000 })
    .usage(`/装备技能 <技能名字>`)
    .action(async ({ session }, skill) => {
      if (!skill) {
        session.execute("查询技能");
        return `请输入技能名称 例如：【装备技能 大爆炸】`;
      }
      const userArr: Pokebattle[] = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      if (userArr.length == 0) {
        try {
          await session.execute(`签到`);
          return;
        } catch (e) {
          return `${h("at", {
            id: session.userId,
          })}请先输入 签到 领取属于你的宝可梦和精灵球`;
        }
      }
      if (!userArr[0].skillbag.includes(String(pokemonCal.findskillId(skill))))
        return `${h("at", { id: session.userId })}你还没有这个技能哦`;
      if (userArr[0].skillSlot.some((skills) => skills.name == skill))
        return `你已经装备了该技能`;
      if (userArr[0].skillSlot.length >= 4) {
        const getSkill = new Skill(pokemonCal.findskillId(skill));
        const md = `<qqbot-at-user id="${
          session.userId
        }" />你的技能栏位已满，请选择替换技能
当前技能：

> ${getSkill.name} 威力:${getSkill.dam} 属性:${getSkill.type} 类型:${
          getSkill.category == 1 ? "物理" : "特殊"
        } 冷却回合:${getSkill.cd}

---
> ${userArr[0].skillSlot[0].name} 威力：${userArr[0].skillSlot[0].dam} 属性：${
          userArr[0].skillSlot[0].type
        } 类型：${
          userArr[0].skillSlot[0].category == 1 ? "物理" : "特殊"
        } 冷却回合：${userArr[0].skillSlot[0].cd}
${userArr[0].skillSlot[1].name} 威力：${userArr[0].skillSlot[1].dam} 属性：${
          userArr[0].skillSlot[1].type
        } 类型：${
          userArr[0].skillSlot[1].category == 1 ? "物理" : "特殊"
        } 冷却回合：${userArr[0].skillSlot[1].cd}
${userArr[0].skillSlot[2].name} 威力：${userArr[0].skillSlot[2].dam} 属性：${
          userArr[0].skillSlot[2].type
        } 类型：${
          userArr[0].skillSlot[2].category == 1 ? "物理" : "特殊"
        } 冷却回合：${userArr[0].skillSlot[2].cd}
${userArr[0].skillSlot[3].name} 威力：${userArr[0].skillSlot[3].dam} 属性：${
          userArr[0].skillSlot[3].type
        } 类型：${
          userArr[0].skillSlot[3].category == 1 ? "物理" : "特殊"
        } 冷却回合：${userArr[0].skillSlot[3].cd}`;
        const kb = {
          keyboard: {
            content: {
              rows: [
                {
                  buttons: [
                    button(
                      2,
                      userArr[0].skillSlot[0].name,
                      "1",
                      session.userId,
                      "1"
                    ),
                    button(
                      2,
                      userArr[0].skillSlot[1].name,
                      "2",
                      session.userId,
                      "2"
                    ),
                  ],
                },
                {
                  buttons: [
                    button(
                      2,
                      userArr[0].skillSlot[2].name,
                      "3",
                      session.userId,
                      "3"
                    ),
                    button(
                      2,
                      userArr[0].skillSlot[3].name,
                      "4",
                      session.userId,
                      "4"
                    ),
                  ],
                },
              ],
            },
          },
        };
        await sendMarkdown(ctx, md, session, kb);
        const reputSkill = await session.prompt(50000);
        if (!reputSkill) return `操作超时`;
        if (!userArr[0].skillSlot[reputSkill - 1])
          return `输入错误，请重新输入`;
        userArr[0].skillSlot[reputSkill - 1] = new Skill(
          pokemonCal.findskillId(skill)
        );
      } else {
        userArr[0].skillSlot.push(new Skill(pokemonCal.findskillId(skill)));
      }
      await ctx.database.set(
        "pokebattle",
        { id: session.userId },
        {
          skillSlot: userArr[0].skillSlot,
        }
      );
      return `${h("at", { id: session.userId })}成功装备了【${skill}】技能${
        userArr[0].skillSlot.length == 4
          ? ""
          : `你还可以装备${4 - userArr[0].skillSlot.length}个技能哦`
      }`;
    });

  ctx
    .command("宝可梦")
    .subcommand("查询技能 <skill>", "查询技能信息")
    .usage(`/查询技能 <技能名字>|<空>`)
    .action(async ({ session }, skill) => {
      const userArr = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      try {
        let type = skill
          ? pokemonCal.skillinfo(userArr[0]?.skillbag, skill, true)
          : "请选择查询属性,或者查询具体技能";
        if (pokemonCal.findskillId(skill) == 0) {
          const kb = {
            keyboard: {
              content: {
                rows: [
                  {
                    buttons: [
                      button(2, "一般", "/查询技能 一般", session.userId, "1"),
                      button(2, "格斗", "/查询技能 格斗", session.userId, "11"),
                      button(
                        2,
                        "飞行",
                        "/查询技能 飞行",
                        session.userId,
                        "111"
                      ),
                      button(2, "毒", "/查询技能 毒", session.userId, "1111"),
                      button(
                        2,
                        "地面",
                        "/查询技能 地面",
                        session.userId,
                        "11111"
                      ),
                    ],
                  },
                  {
                    buttons: [
                      button(
                        2,
                        "岩石",
                        "/查询技能 岩石",
                        session.userId,
                        "111111"
                      ),
                      button(
                        2,
                        "虫",
                        "/查询技能 虫",
                        session.userId,
                        "1111111"
                      ),
                      button(
                        2,
                        "幽灵",
                        "/查询技能 幽灵",
                        session.userId,
                        "11111111"
                      ),
                      button(2, "钢", "/查询技能 钢", session.userId, "12"),
                      button(2, "火", "/查询技能 火", session.userId, "121"),
                      button(2, "水", "/查询技能 水", session.userId, "1211"),
                    ],
                  },
                  {
                    buttons: [
                      button(2, "草", "/查询技能 草", session.userId, "12111"),
                      button(2, "电", "/查询技能 电", session.userId, "121111"),
                      button(
                        2,
                        "超能力",
                        "/查询技能 超能力",
                        session.userId,
                        "1211111"
                      ),
                      button(2, "冰", "/查询技能 冰", session.userId, "1221"),
                      button(2, "龙", "/查询技能 龙", session.userId, "12211"),
                    ],
                  },
                  {
                    buttons: [
                      button(2, "恶", "/查询技能 恶", session.userId, "122111"),
                      button(
                        2,
                        "妖精",
                        "/查询技能 妖精",
                        session.userId,
                        "122211"
                      ),
                      button(
                        2,
                        "技能背包",
                        "/技能背包",
                        session.userId,
                        "1221111"
                      ),
                      button(
                        2,
                        "装备技能",
                        "/装备技能 ",
                        session.userId,
                        "12211111",
                        false
                      ),
                    ],
                  },
                ],
              },
            },
          };
          await sendMarkdown(ctx, type, session, kb);
          return;
        }
        return `${skill}的技能信息：\n威力：${
          skillMachine.skill[Number(pokemonCal.findskillId(skill))].Dam
        }\n类型：${
          skillMachine.skill[Number(pokemonCal.findskillId(skill))].category ==
          1
            ? "物理"
            : "特殊"
        }\n属性：${
          skillMachine.skill[Number(pokemonCal.findskillId(skill))].type
        }\n描述：${
          skillMachine.skill[Number(pokemonCal.findskillId(skill))].descript
        }`;
      } catch (e) {
        logger.info(e);
        return `输入错误，没有这个技能哦`;
      }
    });

  ctx
    .command("宝可梦")
    .subcommand("购买 <item:string> [num:number]", "购买物品，或查看商店")
    .usage(`/购买 <物品名称> [数量]`)
    .example("购买 精灵球 10")
    .shortcut(/购买\+(.*)$/, { args: ["$1"] })
    .action(async ({ session }, item, num) => {
      const mid = item ? item.split("+")[0] : item;
      num = num ? num : item ? item.split("+")[1] : num;
      item = mid;
      const { platform } = session;
      const userArr: Array<Pokebattle> = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      const vip = isVip(userArr[0]);
      const vipReward = vip ? 0.6 : 1;

      if (userArr.length == 0) {
        try {
          await session.execute(`签到`);
          return;
        } catch (e) {
          return `${h("at", {
            id: session.userId,
          })}请先输入 签到 领取属于你的宝可梦和精灵球`;
        }
      }
      const playerTrainer = userArr[0].trainer_list.find(
        (train) => train.tid == userArr[0].trainerIndex
      );
      if (!num) num = 1;
      num = Math.floor(num);
      if (num < 1) return `宝可梦的世界不支持赊账`;
      let reply = "";
      if (!item) {
        shop.forEach((item) => {
          reply += `${item.name} 价格：${Math.floor(item.price * vipReward)}\r`;
        });
        let MDreply: string = "";
        shop.forEach((item) => {
          MDreply += `- [${
            item.name
          }](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
            `/购买 ${item.name} `
          )}&reply=false&enter=false) 价格：${Math.floor(
            item.price * vipReward
          )}\n\n`;
        });

        const md = `![img#50px #50px](${await toUrl(
          ctx,
          session,
          `${config.图片源}/trainers/${playerTrainer.source_name}.png`
        )})<qqbot-at-user id="${session.userId}" />来到了商店

---
商店物品：

${MDreply}

---
- [初级机票](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
          `/购买 初级机票`
        )}&reply=false&enter=true) 价格：${500 * vipReward}

> 任何人都可以购买，使用后只能遇到少量宝可梦

- [中级机票](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
          `/购买 中级机票`
        )}&reply=false&enter=true) 价格：${500 * vipReward}

> 二周目后可购买，使用后能遇到中量宝可梦

- [高级机票](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
          `/购买 高级机票`
        )}&reply=false&enter=true) 价格：${500 * vipReward}

> 三周目可购买，使用后能遇到大量宝可梦`;

        const kb = {
          keyboard: {
            content: {
              rows: [
                {
                  buttons: [
                    button(2, "购买", "/购买", session.userId, "1", false),
                  ],
                },
                {
                  buttons: [
                    button(2, "积分兑换", "/积分兑换", session.userId, "2"),
                  ],
                },
              ],
            },
          },
        };
        try {
          await sendMarkdown(ctx, md, session, kb);
        } catch (e) {
          return `网络繁忙，再试一次`;
        }
        return;
      }
      const area = ["初级机票", "中级机票", "高级机票"];
      const isArea = area.includes(item);
      if (!isArea) {
        const matchedItem = findItem(item);
        if (matchedItem.length == 0) return `没有这个物品哦`;
        if (
          userArr[0].gold < Math.floor(matchedItem[0].price * num * vipReward)
        )
          return `你的金币不足`;
        if (matchedItem.length > 1) {
          const item = matchedItem
            .map(
              (item) =>
                `${item.name} 价格：${Math.floor(item.price * vipReward)}`
            )
            .join("\n");
          return `找到多个物品，请输入完整名称\n${item}`;
        } else {
          let tips = "";
          switch (matchedItem[0].name) {
            case "人物盲盒":
              tips = `输入【盲盒】来开启盲盒`;
              break;
            case "扭蛋代币":
              tips = `输入【技能扭蛋机】来抽取技能`;
              break;
            case "精灵球":
              tips = `输入【捕捉宝可梦】来捕捉宝可梦`;
              break;
            case "改名卡":
              tips = `输入【改名】改名`;
              break;
          }
          await ctx.database.set(
            "pokebattle",
            { id: session.userId },
            {
              gold: {
                $subtract: [
                  { $: "gold" },
                  Math.floor(matchedItem[0].price * num * vipReward),
                ],
              },
              [matchedItem[0].id]: { $add: [{ $: matchedItem[0].id }, num] },
            }
          );
          return `${h("at", { id: session.userId })}\u200b
购买成功
====================
${matchedItem[0].name}+${num}
====================
tips:${tips}`;
        }
      } else {
        const place = ["初级区域", "中级区域", "高级区域"];
        const legendaryPokemonRandom = Math.random() * 100;
        const addMerits = userArr[0].cyberMerit > 99 ? 0 : 1;
        const addFlyCount = userArr[0].fly_count > 0 ? 1 : 0;
        const isEvent = userArr[0].lap < 3 || userArr[0].level < 90;
        const areaId = area.indexOf(item);
        if (userArr[0].lap <= areaId) return `你还没有获得更强的认证，无法购买`;
        if (userArr[0].gold < Math.floor(500 * vipReward))
          return `你的金币不足`;
        await ctx.database.set("pokebattle", { id: session.userId }, (row) => ({
          gold: $.sub(row.gold, Math.floor(500 * vipReward)),
          area: areaId,
          cyberMerit: $.add(row.cyberMerit, addMerits),
          fly_count: $.if(
            !isEvent,
            $.sub(row.fly_count, addFlyCount),
            row.fly_count
          ),
        }));
        const qldn = ["343.343", "344.344"];
        const isqldn = userArr[0].AllMonster.some((item) =>
          qldn.includes(item)
        );
        const isLegendaryPokemon =
          (userArr[0].fly_count < 1 && !isqldn) ||
          isEvent ||
          legendaryPokemonRandom <= 99 - userArr[0].cyberMerit * 0.04;
        if (!isLegendaryPokemon) {
          await session.send(`飞机航行中似乎出现了意外，请注意`);
        }
        const md = `<qqbot-at-user id="${session.userId}" />购买了${item}
---
成功进入${place[areaId]}

---
${isLegendaryPokemon ? `飞机安全抵达目的地：${place[areaId]} 赛博功德+1` : ""}

当前飞机航行事件 ${userArr[0].fly_count - addFlyCount} / 20

当前赛博功德值:${userArr[0].cyberMerit + addMerits}`;
        await sendMarkdown(ctx, md, session);

        if (isLegendaryPokemon) return;
        const key = crypto
          .createHash("md5")
          .update(session.userId + new Date().getTime())
          .digest("hex")
          .toUpperCase();
        legendaryPokemonId[key] = isqldn ? "345.345" : "342.342";
        await ctx.setTimeout(() => {
          delete legendaryPokemonId[key];
        }, 2000);
        await session.execute(`捕捉宝可梦 ${key}`);
      }
    });

  ctx
    .command("宝可梦")
    .subcommand("改名 [name:text]", "改名，请输入2-6位中文")
    .action(async ({ session }, name: string) => {
      const userArr = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      if (userArr[0]?.changeName < 1) return `你的改名次数已经用完`;
      let regex = /^[\u4e00-\u9fa5]{2,6}$/;
      if (!regex.test(name)) {
        let count = 0;
        do {
          await session.send(`请回复2-6位中文`);
          await session.bot.internal.sendMessage(session.channelId, {
            content: "111",
            msg_type: 2,
            keyboard: {
              content: {
                rows: [
                  {
                    buttons: [
                      button(
                        0,
                        "点击输入新名字",
                        "",
                        session.userId,
                        "1",
                        false
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
          const entry = await session.prompt(20000);
          name = entry;
          count++;
          if (count > 3) {
            return `输入错误次数过多`;
          }
        } while (!regex.test(name));
      }
      if (userArr.length == 0) {
        try {
          await session.execute(`签到`);
          return;
        } catch (e) {
          return `${h("at", {
            id: session.userId,
          })}请先输入 签到 领取属于你的宝可梦和精灵球`;
        }
      }
      name = await censorText(ctx, name);
      await ctx.database.set(
        "pokebattle",
        { id: session.userId },
        {
          name: name,
          changeName: { $subtract: [{ $: "changeName" }, 1] },
        }
      );
      return `你的名字已经改为【${name}】`;
    });

  ctx
    .command("宝可梦")
    .subcommand("积分兑换 <items> [number:number]", "通过对战积分兑换")
    .shortcut(/积分兑换\+(.*)$/, { args: ["$1"] })
    .action(async ({ session }, items, number: number) => {
      const mid = items ? items.split("+")[0] : items;
      number = number ? number : items ? items.split("+")[1] : number;
      items = mid;
      if (!number) number = 1;
      number = Math.floor(Number(number));
      if (number < 0) return `怎么还有来骗积分的！！！`;
      const [player]: Pokebattle[] = await ctx.database.get("pokebattle", {
        id: session.userId,
      });
      const item = ["金币上限", "性格模组", "荣誉勋章", "麦麦对话券"];
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
      const [limit]: Resource[] = await ctx.database.get(
        "pokemon.resourceLimit",
        { id: session.userId }
      );
      if (player.lap < 3) return `你的请先积极对战或者收集宝可梦进入3周目`;
      const market = `# 积分商城

---
- [金币上限](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
        `/积分兑换 金币上限 `
      )}&reply=false&enter=false)

> 比例 1积分：30金币上限，**当日使用**

- [性格模组](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
        `/积分兑换 性格模组 `
      )}&reply=false&enter=true) 

> 300积分 为当前宝可梦添加性格或刷新性格

- [荣誉勋章](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
        `/积分兑换 荣誉勋章 `
      )}&reply=false&enter=true) 

> 200积分 提升 **1-5点** 当前宝可梦的随机一个属性努力值

- [麦麦对话券](mqqapi://aio/inlinecmd?command=${encodeURIComponent(
        `/积分兑换 麦麦对话券 `
      )}&reply=false&enter=false) 

> 比例 1积分：10token，当麦麦对话 **每日token** 不足时才会消耗

**提升效果仅对相同融合宝可梦有效**

---

> 积分每周一早7点重置
`;

      if (!items) {
        await sendMarkdown(ctx, market, session);
        return;
      }
      if (!item.includes(items)) return `没有这个道具`;
      switch (items) {
        case "金币上限":
          if (!number) return `请输入需要兑换的积分数量`;
          number = Math.floor(number);
          if (limit.rankScore < number) return `你的积分不足`;
          limit.resource.goldLimit += number * 30;
          await ctx.database.set(
            "pokemon.resourceLimit",
            { id: session.userId },
            (row) => ({
              rankScore: $.sub(row.rankScore, number),
              resource: limit.resource,
            })
          );
          return `成功兑换${number * 30}金币上限`;
        case "性格模组": {
          let msgId = { id: "" };
          if (limit.rankScore < 300) return `你的积分不足`;
          await ctx.database.set(
            "pokemon.resourceLimit",
            { id: session.userId },
            (row) => ({
              rankScore: $.sub(row.rankScore, 300),
            })
          );
          const playerList: PokemonList = await getList(
            session.userId,
            ctx,
            player.monster_1
          );
          const newNature = new FusionPokemon(
            player.monster_1,
            playerList,
            true
          );
          await findFusion(newNature, playerList);
          const isInstall = `是否将${pokemonCal.pokemonlist(
            player.monster_1
          )}的性格更改为${newNature.natures.effect}`;
          const kb = {
            keyboard: {
              content: {
                rows: [
                  {
                    buttons: [
                      button(2, "Y", "Y", session.userId, "1"),
                      button(2, "N", "N", session.userId, "2"),
                    ],
                  },
                ],
              },
            },
          };
          msgId = await sendMarkdown(ctx, isInstall, session, kb);
          const choose = await session.prompt(20000);
          const isChoose = choose == "Y" ? true : false;
          if (!isChoose) {
            session.bot.deleteMessage(session.channelId, msgId.id);
            return `你并不想将${pokemonCal.pokemonlist(
              player.monster_1
            )}的性格更改为${newNature.natures.effect}`;
          }
          await ctx.database.set(
            "pokemon.list",
            { id: session.userId },
            {
              pokemon: playerList.pokemon,
            }
          );
          const playerPower = pokemonCal.power(
            pokemonCal.pokeBase(player.monster_1),
            player.level,
            playerList,
            player.monster_1
          );
          await ctx.database.set(
            "pokebattle",
            { id: session.userId },
            (row) => ({
              power: playerPower,
            })
          );
          session.bot.deleteMessage(session.channelId, msgId.id);
          return `成功给${newNature.name}加载了性格模块，性格为 ${newNature.natures.effect}`;
        }
        case "荣誉勋章":
          let msgId = { id: "" };
          let msg = "";
          const powerDesc = ["生命", "攻击", "防御", "特攻", "特防", "速度"];
          {
            if (limit.rankScore < 200 * number) return `你的积分不足`;
            const playerList: PokemonList = await getList(
              session.userId,
              ctx,
              player.monster_1
            );
            const newNature = new FusionPokemon(player.monster_1, playerList);
            const index = await findFusion(newNature, playerList);
            let random = 0;
            let value = 0;
            let up = 0;
            let add = {};
            let count = 0;
            for (let i = 0; i < number; i++) {
              let sum = playerList.pokemon[index].power.reduce(
                (a, b) => a + b,
                0
              );
              if (sum >= 255 * 6) {
                playerList.pokemon[index].power = playerList.pokemon[
                  index
                ].power.map((a) => (a > 255 ? 255 : a));
                await ctx.database.set(
                  "pokemon.list",
                  { id: session.userId },
                  {
                    pokemon: playerList.pokemon,
                  }
                );
                msg += "努力值已满\n";
                break;
              }
              count++;
              do {
                random = Math.floor(Math.random() * 6);
                value = Math.floor(Math.random() * 5 + 1);
                up =
                  playerList.pokemon[index].power[random] <= 255 - value
                    ? value
                    : 255 - playerList.pokemon[index].power[random];
              } while (up === 0);
              playerList.pokemon[index].power[random] += up;
              add[powerDesc[random]] =
                (add?.[powerDesc[random]] ? add?.[powerDesc[random]] : 0) + up;
            }
            msg += `兑换了${count}个勋章\n`;
            for (let i in add) {
              msg += `${i}努力值+${add[i]}\n`;
            }

            msgId = await session.send(
              `成功给${newNature.name}添加了荣誉勋章,${msg}花费了${
                count * 200
              }积分`
            );
            //写入数据库
            await ctx.database.set(
              "pokemon.list",
              { id: session.userId },
              {
                pokemon: playerList.pokemon,
              }
            );
            const playerPower = pokemonCal.power(
              pokemonCal.pokeBase(player.monster_1),
              player.level,
              playerList,
              player.monster_1
            );
            await ctx.database.set(
              "pokebattle",
              { id: session.userId },
              (row) => ({
                power: playerPower,
              })
            );
            await ctx.database.set(
              "pokemon.resourceLimit",
              { id: session.userId },
              (row) => ({
                rankScore: $.sub(row.rankScore, 200 * count),
              })
            );
            ctx.setTimeout(() => {
              try {
                session.bot.deleteMessage(session.channelId, msgId.id);
              } catch {
                session.bot.deleteMessage(session.channelId, msgId);
              }
            }, 5000);
            return;
          }
        case "麦麦对话券":
          if (!number) number = 0;
          if (limit.rankScore < number) return `你的积分不足`;
          const [aiPlayer] = await ctx.database.get("intellegentBody", {
            group_open_id: session.userId,
          });
          if (!aiPlayer) {
            const md = `# 添加机器少女麦麦，开始你们的对话

---
相信你已经迫不及待的要开始和麦麦聊天了！o(*////▽////*)q
快点点击下面的按钮，召唤麦麦吧！`;
            const kb = {
              keyboard: {
                content: {
                  rows: [
                    {
                      buttons: [
                        urlbutton(
                          2,
                          "开始和麦麦聊天",
                          "https://qun.qq.com/qunpro/robot/qunshare?robot_uin=3889017499&robot_appid=102098973&biz_type=1",
                          session.userId,
                          "11"
                        ),
                      ],
                    },
                  ],
                },
              },
            };
            await sendMarkdown(ctx, md, session, kb);
          }
          await ctx.database.set(
            "pokemon.resourceLimit",
            { id: session.userId },
            (row) => ({
              rankScore: $.sub(row.rankScore, number),
            })
          );
          await ctx.database.set(
            "pokemon.list",
            { id: session.userId },
            (row) => ({
              tokens: $.add(row.tokens, number * 10),
            })
          );
          return `成功兑换了${number ? number * 10 : 0} token`;
      }
    });
}
export { Pokebattle };
