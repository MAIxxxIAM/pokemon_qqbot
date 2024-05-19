import { Context, Schema,$ } from 'koishi'

import { Pokebattle, config, Config } from '../index';
import { button, getChance, getList, getMarkdownParams, sendMarkdown, toUrl } from '../utils/mothed';
import pokemonCal from '../utils/pokemon';
import { PokemonList, Resource } from '../model';
import { Skill } from '../battle';

export const name = 'lapTwo'


export function apply(ctx: Context) {

  ctx.model.extend('pokebattle', {
    lapTwo: {
      type: 'boolean',
      initial: false,
      nullable: false,
    },
    ultra: {
      type: 'json',
      initial: {},
      nullable: false,
    },
    advanceChance: {
      type: 'boolean',
      initial: false,
      nullable: false,
    },
    lap: {
      type: 'unsigned',
      initial: 1,
      nullable: false,
    }
  })

  ctx.command('宝可梦').subcommand('周目内容','周目相关指令').subcommand('getChance','领取下一周目资格').action(async ({ session }) => {
    const [player]=await ctx.database.get('pokebattle',session.userId)
    const chance=await getChance(player,ctx)
    if(chance){
      await ctx.database.set('pokebattle',session.userId,{
        advanceChance:true
      })
      const md=`<@${session.userId}>领取成功
三周目当前状态：开启中(部分)
- [进入](mqqapi://aio/inlinecmd?command=${encodeURIComponent(`/lapnext`)}&reply=false&enter=true)

---
## 三周目开启条件
- 非全图鉴玩家需要满级玩家对战积分排行前十名（每两天排行一次）
- 每个传说宝可梦至少遇到一次`
      await sendMarkdown(ctx,md,session)
      return
    }
    return `条件不满足，非全图鉴玩家需要满级玩家对战积分排行前十名（每两天排行一次），且每个传说宝可梦至少遇到一次`
  })

  ctx.command('宝可梦').subcommand('周目内容','周目相关指令').subcommand('刷新字段',{authority:4}).action(async () => {
    // @ts-ignore
     const players =await ctx.database.get('pokebattle',{})
      for(const player of players){
        player.skillSlot=player.skillSlot.map((item)=>{return new Skill(item.id)})
        await ctx.database.set('pokebattle',player.id,{
          skillSlot:player.skillSlot
        })
      }
    return '刷新成功'
  })
  ctx.command('宝可梦').subcommand('周目内容','周目相关指令').subcommand('lapnext', '进入下一周目')
    .alias('下周目').action(async ({ session }) => {
      const { userId } = session
      const [user] = await ctx.database.get('pokebattle', userId)
      const [player] :Resource[]= await ctx.database.get('pokemon.resourceLimit', userId)
      if (!user) {
        await session.execute('签到')
        return
      }
      const playerList:PokemonList=await getList(session.userId,ctx,user.monster_1)
      const advanceChance = user.advanceChance
      if (!user.lapTwo) {
        await session.execute('lapTwo')
        return
      }
      if (!advanceChance) {
        await session.execute('getChance')
        return
      }
      try {
        const md = `<@${userId}> 是否进入下一周目

---
- 进入下一周目,你的等级将会清空
- 但是你的宝可梦将会保留
- 将会开启420只除神兽外的宝可梦捕捉

---
- **如果你的金币大于300万，将会只保留300万金币**`
        const kb = {
          keyboard: {
            content: {
              "rows": [
                { "buttons": [button(0, "✔️Yes", `Y`, userId, "1"), button(2, "❌No", "N", userId, "2")] },
              ]
            },
          },
        }
        await sendMarkdown(ctx,md, session, kb)
      } catch {
        await session.send(`\u200b是否进入下一周目
进入下一周目,你的等级将会清空
但是你的宝可梦将会保留
将会开启420只除神兽外的宝可梦捕捉
如果你的金币大于300万，将会只保留300万金币
如果积分大于2000，将会保留2000积分
请输入Y/N`)
      }
      const inThree = await session.prompt(config.捕捉等待时间)
      switch (inThree.toLowerCase()) {
        case 'y':
          await ctx.database.set('pokebattle', userId, {
            lap: 3,
            level: 5,
            exp: 0,
            gold: user.gold >= 3000000 ? 3000000 : user.gold,
            base: pokemonCal.pokeBase(user.monster_1),
            power: pokemonCal.power(user.base, 5,playerList, user.monster_1),
            advanceChance: false,
          })
          await ctx.database.set('pokemon.resourceLimit', userId, {
            rankScore: player.rankScore >= 2000 ? 2000 : player.rankScore
          })
          return `你成功进入了三周目`
        case 'n':
          return `你取消了操作`
        default:
          return `输入错误`
      }

    })

  ctx.command('宝可梦').subcommand('周目内容','周目相关指令').subcommand('lapTwo', '进入二周目')
    .action(async ({ session }) => {
      const { userId, platform } = session
      const userArr = await ctx.database.get('pokebattle', userId)
      const user: Pokebattle = userArr[0]
      if (user?.lapTwo) return `你已经进入了二周目`
      if (user.level < 80 || user.ultramonster.length < 5) return `条件不满足，请升级至80级，并且拥有5只传说中的宝可梦`
      const playerList:PokemonList=await getList(session.userId,ctx,user.monster_1)
      if (platform == 'qq' && config.QQ官方使用MD) {
        try {
          await session.bot.internal.sendMessage(session.channelId, {
            content: "111",
            msg_type: 2,
            markdown: {
              custom_template_id: config.文字MDid,
              params: [
                {
                  key: config.key4,
                  values: [`\r#\t<@${userId}>是否进入二周目`]
                },
                {
                  key: config.key5,
                  values: ["进入二周目,你的等级将会清空。"]
                },
                {
                  key: config.key6,
                  values: ["但是你的宝可梦将会保留\r并且开启传说中的宝可梦收集"]
                },
                {
                  key: config.key7,
                  values: ["当某个传说中的宝可梦收集至100%后，将可以捕捉并杂交"]
                },
              ]
            },
            keyboard: {
              content: {
                "rows": [
                  { "buttons": [button(0, "✔️Yes", `Y`, userId, "1"), button(2, "❌No", "N", userId, "2")] },
                ]
              },
            },
            msg_id: session.messageId,
            timestamp: session.timestamp,
          })
        } catch (e) {
          return `请勿重复点击`
        }
      } else {
        await session.send(`\u200b
进入二周目,你的等级将会清空。
但是你的宝可梦将会保留，
并且开启传说中的宝可梦收集，
当某个传说中的宝可梦收集至100%后，
将可以捕捉并杂交

请输入Y/N`)
      }

      const inTwo = await session.prompt(config.捕捉等待时间)
      switch (inTwo?.toLowerCase()) {
        case 'y':
          
          await ctx.database.set('pokebattle', userId, {
            lapTwo: true,
            lap: 2,
            level: 5,
            exp: 0,
            base: pokemonCal.pokeBase(user.monster_1),
            power: pokemonCal.power(user.base, 5,playerList, user.monster_1),
          })
          return `你成功进入了二周目`
        case 'n':
          return `你取消了操作`
        default:
          return `输入错误`
      }

    })

  ctx.command('宝可梦').subcommand('周目内容','周目相关指令').subcommand('ultra', '传说中的宝可梦收集值')
    .action(async ({ session }) => {
      const { userId } = session
      const userArr = await ctx.database.get('pokebattle', userId)
      const user: Pokebattle = userArr[0]
      const ultra = user?.ultra
      let str: string[] = []
      let mdStr: string[] = []
      for (let poke in ultra) {
        if (ultra[poke] == null) continue
        const img = await toUrl(ctx, session, `${config.图片源}/sr/${poke.split('.')[0]}.png`)
        str.push(`\u200b
${pokemonCal.pokemonlist(poke)} : ${ultra[poke]}0%  ${'🟩'.repeat(Math.floor(ultra[poke] / 2)) + '🟨'.repeat(ultra[poke] % 2) + '⬜⬜⬜⬜⬜'.substring(Math.round(ultra[poke] / 2))}`)
        mdStr.push(`![${pokemonCal.pokemonlist(poke)}#40px #40px](${img}) : ${ultra[poke]}0%  ${'🟩'.repeat(Math.floor(ultra[poke] / 2)) + '🟨'.repeat(ultra[poke] % 2) + '⬜⬜⬜⬜⬜'.substring(Math.round(ultra[poke] / 2))}`)
      }
      const md = mdStr.join('\n')
      const b = getMarkdownParams(md)
      if (!ultra) return `你还没有进入二周目`
      if (mdStr.length == 0) return `你还没有收集到传说中的宝可梦`

      try {
        await session.bot.internal.sendMessage(session.channelId, {
          content: "111",
          msg_type: 2,
          markdown: {
            custom_template_id: '102072441_1711377105',
            params: b
          },
          keyboard: {
            content: {
              "rows": [
                { "buttons": [button(2, "📷 捕捉", `/捕捉宝可梦`, userId, "1"), button(2, "♂ 杂交", "/杂交宝可梦", userId, "2")] },
              ]
            },
          },
          msg_id: session.messageId,
          timestamp: session.timestamp,
        })
      } catch (e) {

        return str.join('\n')
      }
    })

    // ctx.command('test').action(async ({session})=>{
    //   console.log('test')
    //   const unplayer:Pokebattle[]=await ctx.database.select('pokebattle').where(row=>$.or(row.advanceChance,$.eq(row.lap,3))).execute()
    //   const ban=unplayer.map((item)=>item.id)
    //   console.log(ban)
    //  const player:Resource[]= await ctx.database.select('pokemon.resourceLimit')
    //  .where({id:{$nin:ban}})
    //  .orderBy('rankScore', 'desc').limit(10)
    //   .execute()
      // console.log(player)
      // await ctx.database.remove('channel',{})
      // const [plauer]=await ctx.database.get('pokebattle',session.userId)
      // console.log((plauer.date+28800)/86400)
      // console.log((Math.round(Number(new Date()) / 1000)+28850)/86400-1)
      // await ctx.database.set('pokebattle', {}, row => ({
      //   checkInDays:$.if($.eq($.divide($.add(row.date,28800),86400),(Math.round(Number(new Date()) / 1000)+28850)/86400-1), row.checkInDays, 0),
      //   vip: $.if($.gt(row.vip, 0), $.sub(row.vip, 1), 0),
      //   fly_count: 20
      // }))
    // })

}
