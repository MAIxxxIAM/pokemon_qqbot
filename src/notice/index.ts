import { Context } from "koishi";
import { config, Config } from "..";
import {
  button,
  sendMarkdown,
  sendNoticeMarkdown,
  urlbutton,
} from "../utils/method";
import { PNotice } from "../model";

export async function apply(ctx: Context) {
  ctx
    .command("宝可梦")
    .subcommand("notice", "宝可梦公告")
    .alias("公告")
    .action(async ({ session }) => {
      const notices = await ctx.database.get("pokemon.notice", {});
      if (notices.length === 0) {
        return "暂无公告";
      }
      const last = notices[notices.length - 1];
      const notice =
        "📅" + last.date.toLocaleDateString() + "\n" + last.notice + "\n";
      const text = `${session.platform == "qq" ? "\u200b\n" : ""}当前版本公告：
${notice}`;
      return text;
    });

  ctx
    .command("宝可梦")
    .subcommand("notice", "宝可梦公告")
    .subcommand("nset <notices:text> <newOrOld:string>", "设置宝可梦公告", {
      authority: 4,
    })
    .action(async ({ session }, notices: string, newOrOld: string) => {
      if (newOrOld == "o") {
        const notice = await ctx.database.get("pokemon.notice", {});
        if (notice.length === 0) {
          await session.execute("nset " + notices);
          return;
        }
        notice.sort((a, b) => a.date.getTime() - b.date.getTime());
        const last = notice[0];
        last.notice += "\n" + notices;
        await ctx.database.set(
          "pokemon.notice",
          { id: last.id },
          { notice: last.notice }
        );
        return "设置成功";
      }
      const nowDay = new Date();
      const notice = notices;
      ctx.database.create("pokemon.notice", {
        date: nowDay,
        notice: notice,
      });
      return "设置成功";
    });

  ctx
    .command("宝可梦")
    .subcommand("vip查询", "查看vip剩余天数")
    .action(async ({ session }) => {
      const { userId, channelId } = session;
      const users = await ctx.database.get("pokebattle", { id: userId });
      if (users.length === 0) {
        await session.execute("宝可梦签到");
        try {
          await session.bot.internal.sendMessage(channelId, {
            content: "111",
            msg_type: 2,
            keyboard: {
              content: {
                rows: [
                  {
                    buttons: [
                      urlbutton(
                        2,
                        "点击捐赠，获得💎VIP",
                        config.aifadian,
                        session.userId,
                        "VIP"
                      ),
                      button(2, "兑换", "/使用", session.userId, "兑换", false),
                    ],
                  },
                ],
              },
            },
          });
          return;
        } catch (e) {
          return "未查询到vip信息";
        }
      }
      const user = users[0];
      try {
        await session.bot.internal.sendMessage(channelId, {
          content: "111",
          msg_type: 2,
          markdown: {
            custom_template_id: config.文字MDid,
            params: [
              {
                key: config.key4,
                values: [`\r\r# \t💎VIP<@${session.userId}>`],
              },
              {
                key: config.key5,
                values: ["当前VIP剩余天数："],
              },
              {
                key: config.key6,
                values: [user.vip + "天"],
              },
            ],
          },
          keyboard: {
            content: {
              rows: [
                {
                  buttons: [
                    urlbutton(
                      2,
                      "点击捐赠，获得💎VIP",
                      config.aifadian,
                      session.userId,
                      "VIP"
                    ),
                  ],
                },
                {
                  buttons: [
                    button(2, "兑换", "/使用", session.userId, "兑换", false),
                  ],
                },
              ],
            },
          },
          msg_id: session.messageId,
          timestamp: session.timestamp,
        });
        return;
      } catch (e) {
        return `剩余vip天数：${user.vip}`;
      }
    });

  ctx
    .command("宝可梦")
    .subcommand("发送公告", { authority: 4 })
    .action(async ({ session }) => {
      const msg = `
- 预计下周将会更新**卡牌肉鸽**玩法的测试.敬请期待
- 由于**不可抗力**因素,后续更新将不会推送更新消息.
- 如需第一时间获取麦麦子的玩法更新,可以点击下方**按钮**
- 如有更新,会在每周一或周四晚进行,并发布在公告中
- 如有疑问,也可以点击下方按钮

> 内容更新:树果携带信息已放置在面板,并更新了相关功能`;
      const groups = await ctx.database.get("channel", {
        platform: session.platform,
      });
      const group_id = groups.map((group) => group.id);
      const md = `# 宝可梦公告
---
${msg}`;
      const kb = {
        keyboard: {
          content: {
            rows: [
              {
                buttons: [
                  urlbutton(
                    2,
                    "点击加入群聊",
                    "http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=CEqeK9q1yilezUrsSX9L3kO0hK5Wpi_7&authKey=SBuSSQtld6nFctvq9d4Xm1lW%2B0C3QuFZ6FLhCJk8ELCbtOqiR4drHcrbfRLVmcvz&noverify=0&group_code=836655539",
                    session.userId,
                    "11"
                  ),
                ],
              },
            ],
          },
        },
      };
      for (let group of group_id) {
        session.channelId = group;
        try {
          const mid = await sendNoticeMarkdown(md, session, kb);
          await ctx.sleep(10);
          // console.log(mid)
        } catch (e) {
          console.log(e);
        }
      }
    });
  ctx
    .command("宝可梦")
    .subcommand("发送联动", { authority: 4 })
    .action(async ({ session }) => {
      const groups = await ctx.database.get("channel", {
        platform: session.platform,
      });
      const group_id = groups.map((group) => group.id);
      await session.send(`共有${group_id.length}个群,推送中~`);
      const md = `修仙智能体推荐\n![图片 #1024px #1792px](http://sanae.xn--vhq524a5mldjj.com:5400/y1.jpg)`;
      const kb = {
        keyboard: {
          content: {
            rows: [
              {
                buttons: [
                  urlbutton(
                    2,
                    "进入一念修仙世界",
                    "https://qun.qq.com/qunpro/robot/qunshare?robot_uin=3889015870&robot_appid=102095939&biz_type=1",
                    session.userId,
                    "11"
                  ),
                ],
              },
            ],
          },
        },
      };
      for (let group of group_id) {
        session.channelId = group;
        try {
          await sendNoticeMarkdown(md, session, kb);
          await ctx.sleep(500);
        } catch (e) {
          console.log(e);
        }
      }
    });

  ctx.command("领取麦麦 <text>").action(async ({ session }, text) => {
    const [pokeplayer] = await ctx.database.get("pokebattle", {
      id: session.userId,
    });
    if (!pokeplayer) {
      await session.execute("宝可梦签到");
    }
    if (!text) {
      const md = `# 领养机器少女麦麦
      
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
                    "🗨 开始和麦麦聊天",
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
      return;
    }
    const [player] = await ctx.database.get("intellegentBody" as any, {
      open_token: text,
      id: { $ne: session.userId },
    });
    if (player) {
      await ctx.database.set(
        "intellegentBody" as any,
        { open_token: text },
        { group_open_id: session.userId, open_token: null, token: 7000 }
      );
      return "绑定成功,初次绑定，赠送7000token，每日获得7000token。后续可用对战积分换取";
    }
    return "绑定失败。未找到对应账户";
  });
}
