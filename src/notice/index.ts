import { Context } from "koishi";
import { config,Config  } from "..";
import { button, sendMarkdown, urlbutton } from "../utils/mothed"


export async function apply(ctx: Context) {
    ctx.command('宝可梦').subcommand('notice', '宝可梦公告').action(async ({session}) => {
        const notices = await ctx.database.get('pokemon.notice',{})
        if (notices.length === 0) {
            return '暂无公告'
        }
        const last = notices[notices.length-1]
        const notice= "📅" +  last.date.toLocaleDateString() + '\n' + last.notice + "\n"
        const text = `${session.platform=='qq'?'\u200b\n':''}当前版本公告：
${notice}`
        return text
    })

    ctx.command('宝可梦').subcommand('notice', '宝可梦公告').subcommand('nset <notices:string> <newOrOld:string>', '设置宝可梦公告', { authority: 4 }).action(async ({ session }, notices: string,newOrOld:string) => {
        if(newOrOld=='o'){
            const notice = await ctx.database.get('pokemon.notice',{})
            if (notice.length === 0) {
               await session.execute('nset '+notices)
               return
            }
            notice.sort((a,b)=>a.date.getTime()-b.date.getTime())
            const last = notice[0]
            last.notice +='\n'+notices
            await ctx.database.set('pokemon.notice',{id:last.id},{notice:last.notice})
            return '设置成功'
        }
        const nowDay = new Date()
        const notice =notices
        ctx.database.create('pokemon.notice', { 
            date: nowDay, 
            notice: notice 
        }
            )
        return '设置成功'
    })
    ctx.command('宝可梦').subcommand('vip查询', '查看vip剩余天数').action(async ({ session }) => {
        const { userId, channelId } = session
        const users = await ctx.database.get('pokebattle', { id: userId })
        if (users.length === 0) {
            await session.execute('宝可梦签到')
            try {
                await session.bot.internal.sendMessage(channelId, {
                    content: "111",
                    msg_type: 2,
                    keyboard: { content: { "rows": [{ "buttons": [urlbutton(2, "点击捐赠，获得💎VIP", config.aifadian, session.userId, "VIP"), button(2, '兑换', '/使用', session.userId, "兑换", false)] },] }, },
                })
                return
            } catch (e) {
                return '未查询到vip信息'
            }
        }
        const user = users[0]
        try {
            await session.bot.internal.sendMessage(channelId, {
                content: "111",
                msg_type: 2,
                markdown: {
                    custom_template_id: config.文字MDid,
                    params: [
                      {
                        key: config.key4,
                        values: [`\r\r# \t💎VIP<@${session.userId}>`]
                      },
                      {
                        key: config.key5,
                        values: ["当前VIP剩余天数："]
                      },
                      {
                        key: config.key6,
                        values: [user.vip + "天"]
                      },
                    ]
                  },
                keyboard: { content: { "rows": [{ "buttons": [urlbutton(2, "点击捐赠，获得💎VIP", config.aifadian, session.userId, "VIP"),], },{"buttons":[ button(2, '兑换', '/使用', session.userId, "兑换", false)]}] }, },
                msg_id: session.messageId,
                timestamp: session.timestamp,
            })
            return
        } catch (e) {
            return `剩余vip天数：${user.vip}`
        }

    })

    ctx.command('领取麦麦 <text>').action(async ({ session },text) => {
        const [pokeplayer]=await ctx.database.get('pokebattle', { id: session.userId })
        if(!pokeplayer){
            await session.execute('宝可梦签到')
        }
        if (!text) {
                const md=`# 领养机器少女麦麦
      
---
相信你已经迫不及待的要开始和麦麦聊天了！o(*////▽////*)q
快点点击下面的按钮，召唤麦麦吧！`
                const kb={
                  keyboard: {
                    content: {
                      "rows": [
                        { "buttons": [urlbutton(2, "🗨 开始和麦麦聊天",'https://qun.qq.com/qunpro/robot/qunshare?robot_uin=3889017499&robot_appid=102098973&biz_type=1', session.userId, "11")] },
                      ]
                    },
                  },
                }
                await sendMarkdown(md, session, kb)
                return
        }
        const [player]= await ctx.database.get('intellegentBody' as any, { open_token: text,id:{$ne:session.userId} })
        if(player){
          await ctx.database.set('intellegentBody' as any, { open_token: text }, { group_open_id:session.userId,open_token: null,token:7000 })
          return '绑定成功,初次绑定，赠送7000token，每日获得7000token。后续可用对战积分换取'
        }
        return '绑定失败。未找到对应账户'
      })
}