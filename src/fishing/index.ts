import { $, Context } from "koishi"
import { fishing } from "../utils/data"
import { FishItem, FishingGame, Lucky } from "./type"
import { actionbutton, button, sendMarkdown, toUrl } from "../utils/mothed"
import pokemonCal from "../utils/pokemon"
import { config } from ".."
import { Pokedex } from "../pokedex/pokedex"



export async function apply(ctx: Context) {

    ctx.on('interaction/button', async (session,) => {
        const fishGame= new FishingGame(fishing)
        const { d } = session.event._data
        const [player] = await ctx.database.get('pokebattle', d.group_member_openid)
        if(!player) return
        if (!player.isfish) {
            return
        }
        const addMerits = player.cyberMerit > 99 ? 0 : 1
        const pokeDex = new Pokedex(player)
        await ctx.database.set('pokebattle', { id: d.group_member_openid }, row => ({
            isfish: false,
            cyberMerit: $.add(row.cyberMerit, addMerits)
        }))
        let regex = /^[\u4e00-\u9fa5]{2,6}$/

        const isEvent = player.lap < 3 &&  player.level < 90
        const noneMd = `${regex.test(player.name) ? player.name : `<@${session.userId}>`}的运气极佳，幸运女神都有点嫉妒

> 但是你什么都没钓到

---
${(!isEvent&&player.cyberMerit < 100 )?'你净化了水质 赛博功德+1':''}

当前赛博功德值:${player.cyberMerit+1}`
        const getMd = (item: FishItem) => `${regex.test(player.name) ? player.name : `<@${session.userId}>`}获得了${item.name[Math.floor(Math.random() * item.name.length)]}
        
> 价值${item.points}积分

---
${(!isEvent&&player.cyberMerit < 100 )?'你净化了水质 赛博功德+1':''}

当前赛博功德值:${player.cyberMerit+addMerits}`
        session.messageId = d.data.resolved.button_id
        session.userId = d.group_member_openid
        session.channelId = d.group_openid
        const fished: '普通鱼饵' | '高级鱼饵' = d.data.resolved.button_data.split('=')[1]
        let getFish = fishGame.fish(Lucky[fished],player.cyberMerit)
        // if(session.userId=='262D994B2D838AD0F1B65FC272BB85BA'){
        //     getFish={
        //         name:["340.340"],
        //         legendaryPokemon:true,
        //         rarity:0.99,
        //         points:0,
        //         reelInTime:0
        //     }
        // }
        if (!getFish) {
            await sendMarkdown(noneMd, session,{keyboard: { content: { "rows": [{ "buttons": [button(2, `🎣 继续钓鱼`, "/钓鱼", session.userId, "1")] },] }, }, })
            return
        }
        if (getFish.legendaryPokemon) {
            if(player?.level<90) {
                const weak=`<@${session.userId}>你太弱小了

---
盖欧卡看了你一眼，并摇了摇头

> 你的等级好像无法收复它`
                await sendMarkdown(weak, session, { keyboard: { content: { "rows": [{ "buttons": [button(2, `🎣 继续钓鱼`, "/钓鱼", session.userId, "1")] },] }, }, });
                return
            }
            //copy
            if (player.ultra?.[getFish.name[0]] < 9 || !player.ultra?.[getFish.name[0]]) {
                if (player?.ultra[getFish.name[0]] === undefined) {
                    player.ultra[getFish.name[0]] = 0
                }
                player.ultra[getFish.name[0]] = player?.ultra[getFish.name[0]] + 1
                const md = `<@${session.userId}>收集度+10%
![img#512px #512px](${await toUrl(ctx, session, `${(pokemonCal.pokemomPic(getFish.name[0], false)).toString().match(/src="([^"]*)"/)[1]}`)})
---
![img#20px #20px](${await toUrl(ctx, session, `${config.图片源}/sr/${getFish.name[0].split('.')[0]}.png`)}) : ${player.ultra[getFish.name[0]] * 10}% ${'🟩'.repeat(Math.floor(player.ultra[getFish.name[0]] / 2)) + '🟨'.repeat(player.ultra[getFish.name[0]] % 2) + '⬜⬜⬜⬜⬜'.substring(Math.round(player.ultra[getFish.name[0]] / 2))}
      
---
**传说宝可梦——${pokemonCal.pokemonlist(getFish.name[0])}**`
                await sendMarkdown(md, session, { keyboard: { content: { "rows": [{ "buttons": [button(2, `🎣 继续钓鱼`, "/钓鱼", session.userId, "1")] },] }, }, })
                await ctx.database.set('pokebattle', { id: session.userId }, {
                    ultra: player.ultra,
                    cyberMerit:0
                })
                return
            }
            if (player.ultra[getFish.name[0]] >= 9) {
                player.ultra[getFish.name[0]] = 10
                const getMd=`<@${session.userId}>成功获得
![img#512px #512px](${await toUrl(ctx, session, `${(pokemonCal.pokemomPic(getFish.name[0], false)).toString().match(/src="([^"]*)"/)[1]}`)})
---
![img#20px #20px](${await toUrl(ctx, session, `${config.图片源}/sr/${getFish.name[0].split('.')[0]}.png`)}) : ${player.ultra[getFish.name[0]] * 10}% ${'🟩'.repeat(Math.floor(player.ultra[getFish.name[0]] / 2)) + '🟨'.repeat(player.ultra[getFish.name[0]] % 2) + '⬜⬜⬜⬜⬜'.substring(Math.round(player.ultra[getFish.name[0]] / 2))}
      
---
**传说宝可梦——${pokemonCal.pokemonlist(getFish.name[0])}**

已经放入图鉴`
                pokeDex.pull(getFish.name[0], player)
                await ctx.database.set('pokebattle', { id: session.userId }, {
                    ultra: player.ultra,
                    pokedex: player.pokedex,
                    cyberMerit:0
                }
                )
            }
            //copy
        } else {
            await sendMarkdown(getMd(getFish), session, { keyboard: { content: { "rows": [{ "buttons": [button(2, `🎣 继续钓鱼`, "/钓鱼", session.userId, "1")] },] }, }, })
            await ctx.database.set('pokemon.resourceLimit', { id: session.userId }, row => ({
                rankScore: $.add(row.rankScore, getFish.points)
            }))
        }
    })


    ctx.command('宝可梦').subcommand('钓鱼',).action(async ({ session }) => {
        const [player] = await ctx.database.get('pokebattle', session.userId)
        if (!player) {
            await session.execute('签到')
            return
        }
        if (player.isfish) return '你已经在钓鱼了'
        if(player?.lap<3) return `未进入3周目，无法参与钓鱼活动。`
        const fishMd = `<@${session.userId}>来到了湖边，准备开始钓鱼

---
请选择鱼饵

- [普通鱼饵 2000金币](mqqapi://aio/inlinecmd?command=${encodeURIComponent(`普通鱼饵`)}&reply=false&enter=true)  无概率加成
- [高级鱼饵 2300金币](mqqapi://aio/inlinecmd?command=${encodeURIComponent(`高级鱼饵`)}&reply=false&enter=true)  会员专属鱼饵，多0.5%好运气
`

        await sendMarkdown(fishMd, session)

        const fished = await session.prompt(20000)

        const Fishspend = fished === '普通鱼饵' ? 2000 : 2300
        if (player.gold < Fishspend) {
            await sendMarkdown(`<@${session.userId}>你的金币不足`, session)
            return
        }
        if (fished === '高级鱼饵' && player?.vip < 1) {
            await session.execute('VIP查询')
            return
        }
        if (![`普通鱼饵`, `高级鱼饵`].includes(fished)) return
        await ctx.database.set('pokebattle', session.userId, row => ({
            isfish: true
        }))
        const actionbuttons = {
            keyboard: {
                content: {
                    rows: [
                        {
                            "buttons": [
                                actionbutton('收杆', fished, session.userId, session.messageId, Date.now() + 5000),
                            ]
                        },
                    ]
                },
            },
        }
        const getInTime = Math.floor(Math.random() * 5000) + 5000
        ctx.setTimeout(async () => {
            const reelMd = `<@${session.userId}>有东西咬钩，开始收杆
---
**请5秒内点击收杆按钮**`
            const { id } = await sendMarkdown(reelMd, session, actionbuttons)
            ctx.setTimeout(async () => {
                session.bot.deleteMessage(session.channelId, id)
                await ctx.database.set('pokebattle', session.userId, row => ({
                    isfish: false
                }))
            }, 5000)
        }, getInTime)
        await ctx.database.set('pokebattle', session.userId, row => ({
            gold: $.sub(row.gold, Fishspend)
        }))
        // const getFish = fishingGame.fish(Luckly[fished])
        // const reelInTime = getFish?.reelInTime
        // if (!getFish) {
        //   await sendMarkdown(noneMd,session)
        //   return
        // }
        // if(getFish.legendaryPokemon) {

        // }else{
        //     await sendMarkdown(getMd(getFish),session)
        //     await ctx.database.set('pokemon.resourceLimit', { id: session.userId }, row => ({
        //         rankScore: $.add(row.rankScore,getFish.points)
        //     }))
        //     await ctx.database.set('pokebattle', session.userId, row=>({
        //         gold: $.sub(row.gold,Fishspend)
        //     }))
        // }
    })
}