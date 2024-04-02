import { Schema, h, $, Context, is, Session } from 'koishi'
import pokemonCal from './utils/pokemon'
import * as pokeGuess from './pokeguess'
import { } from 'koishi-plugin-cron'
import { button, catchbutton, findItem, getPic, getRandomName, moveToFirst, toUrl, urlbutton, getType, isVip, isResourceLimit, getWildPic, sendMsg, getMarkdownParams, sendMarkdown, normalKb,  getChance } from './utils/mothed'
import { pathToFileURL } from 'url'
import { resolve } from 'path'
import * as fs from 'fs'
import * as path from 'path'
import os from 'os'
import pidusage from 'pidusage'
import * as lapTwo from './lap/index'
import * as pokedex from './pokedex/pokedex'
import * as notice from './notice/index'

import { Robot } from './utils/robot'

import { expToLv, expBase, skillMachine } from './utils/data'
import { Pokedex } from './pokedex/pokedex'
import { pokebattle } from './battle/pvp'
import { AddGroup, Pokebattle, PrivateResource, Resource, model } from './model'
import { catchPokemon } from './battle/pve'





export const name = 'pokemon'

export const inject = {
  required: ['database', 'downloads', 'canvas', 'cron'],
  optional: ['censor']
}

export const usage = ``

export interface Config {
  指令使用日志: boolean
  QQ官方使用MD: boolean
  签到获得个数: number
  是否开启友链: boolean
  是否开启文本审核: boolean
  金币获取上限: number
  精灵球定价: number
  训练师定价: number
  扭蛋币定价: number
  改名卡定价: number
  野生宝可梦难度系数: number
  aifadian: string
  图片源: string
  对战cd: number
  对战次数: number
  捕捉等待时间: number
  MDid: string
  文字MDid: string
  key1: string
  key2: string
  key3: string
  key4: string
  key5: string
  key6: string
  key7: string
  key8: string
  key9: string
  key10: string
  bot邀请链接: string
}

export const Config = Schema.intersect([

  Schema.object({
    指令使用日志: Schema.boolean().default(false).description('是否输出指令使用日志'),
    是否开启友链: Schema.boolean().default(false).description('是否开启友链'),
    是否开启文本审核: Schema.boolean().default(false).description('是否开启文本审核'),
  }),
  Schema.object({
    图片源: Schema.string().default('https://gitee.com/maikama/pokemon-fusion-image/raw/master').description(`
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
    aifadian: Schema.string().default('https://afdian.net/item/f93aca30e08c11eebccb52540025c377'),
    对战cd: Schema.number().default(10).description('单位：秒'),
    对战次数: Schema.number().default(15),
    捕捉等待时间: Schema.number().default(20000).description('单位：毫秒'),
  }).description('数值设置'),
  Schema.object({
    QQ官方使用MD: Schema.boolean().default(false),
  }).description('Markdown设置,需要server.temp服务'),
  Schema.union([
    Schema.object({
      QQ官方使用MD: Schema.const(true).required(),
      MDid: Schema.string().description('MD模板id'),
      文字MDid: Schema.string().description('文字MD模板id(可留空)'),
      key1: Schema.string().default('tittle').description('标题'),
      key2: Schema.string().default('imgsize').description('图片大小'),
      key3: Schema.string().default('img_url').description('图片路径'),
      key4: Schema.string().default('text1').description('宝可梦选项1'),
      key5: Schema.string().default('text2').description('宝可梦选项2'),
      key6: Schema.string().default('text3').description('宝可梦选项3'),
      key7: Schema.string().default('text4').description('宝可梦选项4'),
      key8: Schema.string().default('text5').description('宝可梦选项5'),
      key9: Schema.string().default('text6').description('宝可梦选项6'),
      key10: Schema.string().default('text7').description('宝可梦选项7'),
      bot邀请链接: Schema.string().default('https://qun.qq.com/qunpro/robot/qunshare?robot_uin=3889000472&robot_appid=102072441&biz_type=0'),
    }),
    Schema.object({}),
  ]),

])



export let testcanvas: string
export let logger: any
export let shop: any[]
export let config: Config


export async function apply(ctx, conf: Config) {
  config = conf
  if (config.是否开启文本审核) {
    ctx.on('before-send', async (session: Session) => {
      const a = await ctx.censor.transform(session.event.message.elements)
      session.event.message.elements = a
    })
  }
  ctx.on('before-send', async (session: Session,msg_id) => {
    const { message } = session.event
    if (session.scope !== 'commands.help.messages' || session.platform !== 'qq') { return }
    let content = message.elements[0].attrs.content.split('\n')
    content.splice(0, 2)
    content = content.map((item) => {
      const a = item.split('  ')
      a.splice(0, 2)
      return a
    })
    let mdparam = `
指令  说明`
    for (let i = 0; i < content.length; i++) {
      mdparam += `
---
[${content[i][0]}](mqqapi://aio/inlinecmd?command=${encodeURIComponent(`${content[i][0]}`)}&reply=false&enter=true) ${content[i][1]}
`
    }

    mdparam += `

> 点击即可发送指令`
    const b = getMarkdownParams(mdparam)
    try {
      // const a = await sendMsg(session)
      const id  = msg_id.session.event._data.d.id
      await session.bot.internal.sendMessage(session.channelId, {
        content: "111",
        msg_type: 2,
        markdown: {
          custom_template_id: '102072441_1711377105',
          params: b
        },
        msg_id: id,
        timestamp: session.timestamp,
      })
      session.event.message.elements = []
      return
    } catch (e) {
      return
    }

  })

  model(ctx)

  ctx.cron('0 0 * * *', async () => {
    await ctx.database.set('pokemon.addGroup', {}, row => ({
      count: 3
    }))
    await ctx.database.set('pokebattle', { vip: { $gt: 0 } }, row => ({
      vip: $.sub(row.vip, 1),
    }))
    await ctx.database.set('pokemon.resourceLimit', {}, row => ({
      resource: new PrivateResource(config.金币获取上限)
    }))
  })


  ctx.cron('0 * * * *', async () => {
    await ctx.database.set('pokebattle', { battleTimes: { $lt: 27 } }, row => ({
      battleTimes: $.add(row.battleTimes, 3),
    }))
  })
  ctx.cron('0 0 */2 * *', async () => {
    const unplayer:Pokebattle[]=await ctx.database.get('pokebattle',{advanceChance:true})
    
    const ban=unplayer.map((item)=>item.id)
   const player:Resource[]= await ctx.database.select('pokemon.resourceLimit')
   .where({id:{$nin:ban}})
   .orderBy('rankScore', 'desc').limit(10)
    .execute()

    for (let i = 0; i < player.length; i++) {
      await ctx.database.set('pokemon.resourceLimit', { id: player[i].id }, row => ({
        rank:i+1,
      }))
    }
  })

  ctx.on('guild-added', async (session) => {
    const { group_openid, op_member_openid } = session.event._data.d
    const addGroup: AddGroup[] = await ctx.database.get('pokemon.addGroup', { id: op_member_openid })
    let a: number
    if (addGroup.length == 0) {
      await ctx.database.create('pokemon.addGroup', { id: op_member_openid, addGroup: [group_openid] })
      a = 3
    } else {
      if (addGroup[0].addGroup.includes(group_openid) || addGroup[0].count < 1) {
        a = 0
      } else {
        await ctx.database.set('pokemon.addGroup', { id: op_member_openid }, {
          count: addGroup[0].count - 1,
          addGroup: addGroup[0].addGroup.concat(group_openid)
        })
        a = 3
      }

    }
    if (a !== 0) {
      const b = await isResourceLimit(op_member_openid, ctx)
      const resource = new PrivateResource(b.resource.goldLimit)
      await resource.addGold(ctx, a, op_member_openid)
    }
  })



  ctx.plugin(pokeGuess)
  ctx.plugin(notice)

  if (config.指令使用日志) {
    ctx.on('command/before-execute', ({ session, command }) => {
      const freeCpu = os.freemem() / os.totalmem();
      const usedCpu = 1 - freeCpu;
      pidusage(process.pid, (err, stats) => {
        console.log(`${session.userId}使用了${command.name}  当前内存占用${(usedCpu * 100).toFixed(2)}% cpu占用${(stats.cpu).toFixed(2)}%`)
      })
    })
  }

  logger = ctx.logger('pokemon')

  try {
    testcanvas = 'file://'
    await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, './assets/img/components', 'spawn.png')}`)
    logger.info('当前使用的是puppeteer插件提供canvas服务')
  } catch (e) {
    testcanvas = ''
    logger.info('当前使用的是canvas插件提供canvas服务')
  }

  if (!fs.existsSync('./zpix.ttf')) {
    const fontTask = ctx.downloads.nereid('zpixfont', [
      'npm://pix-ziti',
      'npm://pix-ziti?registry=https://registry.npmmirror.com', ,
    ], 'bucket2')
    fontTask.promise.then((path1) => {
      const sourceFilePath = path1 + '/zpix.ttf'
      const targetFilePath = path.join(__dirname, '..', '..', '..', path.basename(sourceFilePath))

      fs.rename(sourceFilePath, targetFilePath, function (err) {
        if (err) {
          logger.info(sourceFilePath);
        } else {
          logger.info('移动文件成功');
        }
      })
    })
  }



  shop = [
    {
      id: 'captureTimes',
      name: '精灵球',
      price: config.精灵球定价,
    },
    {
      id: 'coin',
      name: '扭蛋代币',
      price: config.扭蛋币定价,
    },
    {
      id: 'trainerNum',
      name: '人物盲盒',
      price: config.训练师定价
    },
    {
      id: 'changeName',
      name: '改名卡',
      price: config.改名卡定价
    }
  ]

  const banID = ['150.150', '151.151', '144.144', '145.145', '146.146', '249.249', '250.250', '251.251', '243.243', '244.244', '245.245','378.378','379.379','340.340','341.341','342.342','381.381','380.380','343.343','344.344','345.345','346.346','347.347','315.315','349.349','348.348','350.350','351.351']
  const lapThree=['378.378','379.379','340.340','341.341','342.342','381.381','380.380','343.343','344.344','345.345','346.346','347.347','315.315','349.349','348.348','350.350','351.351']
  const banLapTwo = ['150.150', '151.151', '144.144', '145.145', '146.146', '249.249', '250.250', '251.251', '243.243', '244.244', '245.245']

  ctx.plugin(lapTwo)

  ctx.plugin(pokedex)

  ctx.command('宝可梦').subcommand('宝可梦签到', '每日的宝可梦签到')
    .action(async ({ session }) => {
      const userArr = await ctx.database.get('pokebattle', { id: session.userId })
      await isResourceLimit(session.userId, ctx)
      const vip = isVip(userArr[0])
      const vipReward = vip ? 1.5 : 1
      const vipRGold = vip ? 3000 : 0
      const vipRBoll = vip ? 20 : 0
      const vipCoin = vip ? 10 : 0
      const vipName = vip ? "[💎VIP]" : ''
      let dateToday = Math.round(Number(new Date()) / 1000)
      if (userArr.length != 0) {
        let dateNow = Math.floor((userArr[0].date + 28800) / 86400)
        if (dateNow == Math.floor((dateToday + 28800) / 86400)) {
          await session.send('今天你已经签到过了哟~快去捕捉属于你的宝可梦吧')
        } else {
          if (userArr[0].monster_1 == 'null') {
            await ctx.database.set('pokebattle', { id: session.userId }, {
              monster_1: '0'
            })
            if (!userArr[0].skill) {
              await ctx.database.set('pokebattle', { id: session.userId }, {
                skill: 0
              })
            }
          }
          
          const chance=await getChance(userArr[0],ctx)
          let expGet: number
          if (userArr[0].monster_1 == '0') {
            //更改
            expGet = Math.floor((userArr[0].level * Number(expBase.exp[Number(userArr[0].AllMonster[0].split('.')[0]) - 1].expbase) / 7) * vipReward)
          } else {
            expGet = userArr[0].level > 99 ? 0 : Math.floor(userArr[0].level * Number(expBase.exp[(Number(userArr[0].monster_1.split('.')[0]) > Number(userArr[0].monster_1.split('.')[1]) ? Number(userArr[0].monster_1.split('.')[1]) : Number(userArr[0].monster_1.split('.')[0])) - 1].expbase) / 7 * (Math.random() + 0.5))
            expGet = Math.floor(expGet * vipReward)
          }
          let expNew = pokemonCal.expCal(userArr[0].level, userArr[0].exp + expGet)[1]
          let lvNew = pokemonCal.expCal(userArr[0].level, userArr[0].exp + expGet)[0]
          let ToDo: string
          if (userArr[0].monster_1 !== '0') {
            ToDo = `当前战斗宝可梦：${(pokemonCal.pokemonlist(userArr[0].monster_1))}
            ${(pokemonCal.pokemomPic(userArr[0].monster_1, true))}
            `
          } else {
            ToDo = '快去杂交出属于你的宝可梦吧'
          }
          const playerName = userArr[0].name ? userArr[0].name : session.username.length < 6 ? session.username : session.username.slice(0, 4)
          try {
            await ctx.database.set('pokebattle', { id: session.userId }, {
              name: playerName,
              captureTimes: { $add: [{ $: 'captureTimes' }, config.签到获得个数 + vipRBoll] },
              battleTimes: 30,
              // battleToTrainer: { $add: [{ $: 'battleToTrainer' }, vip ? 20 : 0] },
              date: dateToday,
              level: lvNew,
              exp: expNew,
              battlename: pokemonCal.pokemonlist(userArr[0].monster_1),
              base: pokemonCal.pokeBase(userArr[0].monster_1),
              power: pokemonCal.power(pokemonCal.pokeBase(userArr[0].monster_1), lvNew),
              coin: { $add: [{ $: 'coin' }, config.签到获得个数 + vipCoin] },
              gold: { $add: [{ $: 'gold' }, 3000 + vipRGold] },
              trainer: userArr[0].trainer[0] ? userArr[0].trainer : ['0'],
              trainerName: userArr[0].trainerName[0] ? userArr[0].trainerName : ['默认训练师']
            })
          } catch (e) { return `请再试一次` }
          //图片服务
          let image = await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, './assets/img/components', '签到.png')}`)
          let pokemonimg = await ctx.canvas.loadImage(`${config.图片源}/sr/0.png`)
          let pokemonimg1 = []
          for (let i = 0; i < userArr[0].AllMonster.length; i++) {
            pokemonimg1[i] = await ctx.canvas.loadImage(`${config.图片源}/sr/${userArr[0].AllMonster[i].split('.')[0]}.png`)
          }
          let ultramonsterimg = []
          for (let i = 0; i < 5; i++) {
            ultramonsterimg[i] = await ctx.canvas.loadImage(`${config.图片源}/sr/${banID[i].split('.')[0]}.png`)
          }
          if (userArr[0].monster_1 !== '0') pokemonimg = await ctx.canvas.loadImage(`${config.图片源}/fusion/${userArr[0].monster_1.split('.')[0]}/${userArr[0].monster_1}.png`)
          let trainers = '0'
          if (userArr[0].trainer[0] !== '0') { trainers = userArr[0].trainer[0] }
          let trainerimg = await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, './assets/img/trainer/' + trainers + '.png')}`)
          let expbar = await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, './assets/img/components', 'expbar.png')}`)
          let overlay = await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, './assets/img/components', 'overlay_exp.png')}`)
          let time = Date.now()
          let date = new Date(time).toLocaleDateString()
          const dataUrl = await ctx.canvas.render(512, 763, async (ctx) => {
            ctx.drawImage(image, 0, 0, 512, 763)
            ctx.drawImage(pokemonimg, 21, 500, 160, 160)
            ctx.drawImage(trainerimg, 21, 56, 160, 160)
            ctx.font = 'normal 30px zpix'
            ctx.fillText(userArr[0].gold + 3000 + vipRGold, 290, 100)
            ctx.fillText(vipName + playerName + `签到成功`, 49, 270)
            ctx.font = 'normal 20px zpix'
            ctx.fillText(`零花钱：`, 254, 65)
            ctx.font = 'normal 20px zpix'
            ctx.fillText(`获得金币+` + (3000 + vipRGold), 49, 300)
            ctx.fillText(`当前可用精灵球:${userArr[0].captureTimes + config.签到获得个数 + vipRBoll}`, 256, 300)
            ctx.fillText(`获得精灵球+${config.签到获得个数 + vipRBoll}`, 49, 325)
            ctx.fillText(`获得经验+${expGet}`, 256, 325)
            ctx.font = 'normal 15px zpix'
            ctx.fillStyle = 'red';
            ctx.fillText(`输入【/宝可梦】查看详细指令`, 135, 350)
            ctx.fillStyle = 'black';
            ctx.fillText(`hp:${pokemonCal.power(pokemonCal.pokeBase(userArr[0].monster_1), lvNew)[0]} att:${pokemonCal.power(pokemonCal.pokeBase(userArr[0].monster_1), lvNew)[1]} def:${pokemonCal.power(pokemonCal.pokeBase(userArr[0].monster_1), lvNew)[2]}`, 30, 715)
            ctx.fillText(`spa:${pokemonCal.power(pokemonCal.pokeBase(userArr[0].monster_1), lvNew)[3]} spa:${pokemonCal.power(pokemonCal.pokeBase(userArr[0].monster_1), lvNew)[4]} spe:${pokemonCal.power(pokemonCal.pokeBase(userArr[0].monster_1), lvNew)[5]}`, 30, 740)
            ctx.fillText(date, 308, 173)
            ctx.fillText('Lv.' + lvNew.toString(), 328, 198)
            ctx.drawImage(overlay, 318, 203, 160 * expNew / expToLv.exp_lv[lvNew].exp, 8)
            ctx.drawImage(expbar, 300, 200, 180, 20)
            ctx.font = 'bold 20px zpix'

            for (let i = 0; i < userArr[0].AllMonster.length; i++) {

              ctx.drawImage(pokemonimg1[i], 277, 439 + 50 * i, 40, 40)
              ctx.fillText('【' + pokemonCal.pokemonlist(userArr[0].AllMonster[i]) + '】', 322, 467 + 50 * i)
            }
            if (vip) {
              ctx.strokeStyle = 'gold'
              ctx.lineWidth = 10
              ctx.strokeRect(0, 0, 512, 763)
            }
          })
          const { src } = dataUrl.attrs
          try {
            const md = `<@${session.userId}>签到成功

![img#512 #763](${await toUrl(ctx, session, src)})

---
每人都有一次初始改名机会 [改名](mqqapi://aio/inlinecmd?command=${encodeURIComponent(`/改名`)}&reply=false&enter=true)

${userArr[0].advanceChance?`你当前可以进入三周目

[三周目](mqqapi://aio/inlinecmd?command=${encodeURIComponent(`/lapnext`)}&reply=false&enter=true)`:' '}
${chance?`你当前可以领取三周目资格

[领取](mqqapi://aio/inlinecmd?command=${encodeURIComponent(`/getchance`)}&reply=false&enter=true)`:' '} 
`
            const b = getMarkdownParams(md)
            await session.bot.internal.sendMessage(session.guildId, {
              content: "111",
              msg_type: 2,
              markdown: {
                custom_template_id: '102072441_1711377105',
                params: b
              },
              keyboard: {
                content: {
                  "rows": [
                    {
                      "buttons": [
                        button(2, "🖊签到", "/签到", session.userId, "1"),
                        button(2, "💳查看", "/查看信息", session.userId, "2"),
                        button(2, "🔖帮助", "/宝可梦", session.userId, "3"),
                        button(2, "🔈公告", "/notice", session.userId, "ntc")
                      ]
                    },
                    {
                      "buttons": [
                        button(2, "⚔️对战", "/对战", session.userId, "4"),
                        button(2, "♂杂交", "/杂交宝可梦", session.userId, "5"),
                        button(2, "👐放生", "/放生", session.userId, "6"),
                        button(2, "💻接收", "/接收", session.userId, "p", false),
                      ]
                    },
                    {
                      "buttons": [
                        button(2, "📷捕捉", "/捕捉宝可梦", session.userId, "7"),
                        button(2, "📕属性", "/属性", session.userId, "8"),
                        button(2, "🛒商店", "/购买", session.userId, "9"),
                        button(2, "🏆兑换", "/使用", session.userId, "x", false),
                      ]
                    },
                    {
                      "buttons": [
                        urlbutton(2, "反馈", "http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=CEqeK9q1yilezUrsSX9L3kO0hK5Wpi_7&authKey=SBuSSQtld6nFctvq9d4Xm1lW%2B0C3QuFZ6FLhCJk8ELCbtOqiR4drHcrbfRLVmcvz&noverify=0&group_code=836655539", session.userId, "10"),
                        urlbutton(2, "邀请", config.bot邀请链接, session.userId, "11"),
                        button(2, "📃问答", "/宝可问答", session.userId, "12"),
                        button(2, "VIP", '/vip查询', session.userId, "VIP"),
                      ]
                    },
                    config.是否开启友链 ? { "buttons": [button(2, '📖 图鉴', '/查看图鉴', session.userId, 'cmd'), button(2, "🔗友链", "/friendlink", session.userId, "13"), button(2, userArr[0]?.lapTwo ? "收集进度" : "进入二周目", userArr[0]?.lapTwo ? "/ultra" : "/laptwo", session.userId, "14")] } : { "buttons": [button(2, '📖 图鉴', '/查看图鉴', session.userId, 'cmd'), button(2, userArr[0]?.lapTwo ? "收集进度" : "进入二周目", userArr[0]?.lapTwo ? "/ultra" : "/laptwo", session.userId, "14")] },
                  ]
                },
              },
              msg_id: session.messageId,
              timestamp: session.timestamp,
            })
          } catch (e) {
            return h.image(src)
          }
          //图片服务
        }
      } else {
        let firstMonster_: string
        let firstMonster: string
        do {
          firstMonster_ = pokemonCal.mathRandomInt(1, 151).toString()

          firstMonster = firstMonster_ + '.' + firstMonster_
        } while (banID.includes(firstMonster))
        await ctx.database.create('pokebattle', {
          id: session.userId,
          name: session.username.length < 6 ? session.username : session.username.slice(0, 4),
          date: Math.round(Number(new Date()) / 1000),
          captureTimes: config.签到获得个数,
          battleTimes: 3,
          // battleToTrainer: config.对战次数 + (vip ? 20 : 0),
          level: 5,
          exp: 0,
          monster_1: '0',
          AllMonster: [firstMonster,],
          coin: config.签到获得个数,
          gold: 3000,
          trainer: ['0'],
          trainerName: ['默认训练师']
        })
        //图片服务
        const bg_img = await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, './assets/img/components', 'spawn.png')}`)
        const pokemonimg = await ctx.canvas.loadImage(`${config.图片源}/sr/${firstMonster_}.png`)
        const replyImg = await ctx.canvas.render(512, 384, async (ctx) => {
          ctx.drawImage(bg_img, 0, 0, 512, 384)
          ctx.drawImage(pokemonimg, 99, 285, 64, 64)
          ctx.font = 'normal 16px zpix'
          ctx.fillText(`你好，${session.username.length < 6 ? session.username : session.username.slice(0, 4)}`, 31, 38)
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(`精灵球+${(config.签到获得个数)}`, 375, 235)
          ctx.fillText(`初始资金:3000`, 375, 260)
          ctx.fillText(`扭蛋机币+${(config.签到获得个数)}`, 375, 285)
          ctx.fillText(`你的第一只宝可梦【${pokemonCal.pokemonlist(firstMonster)}】`, 375, 310)
        })
        const { src } = replyImg.attrs
        //图片服务
        try {
          const md = `# <@${session.userId}>成功进入宝可梦的世界

![img#512 #384](${await toUrl(ctx, session, src)})
---
- [点击获取宝可梦帮助](mqqapi://aio/inlinecmd?command=${encodeURIComponent(`/宝可梦`)}&reply=false&enter=true)`
          await sendMarkdown(md, session)
        } catch (e) {
          return h.image(src)
        }

      }
    })

  ctx.command('宝可梦').subcommand('捕捉宝可梦', '随机遇到3个宝可梦')
    .action(async ({ session }) => {
      let catchCose = 1
      const { platform } = session
      const userArr: Array<Pokebattle> = await ctx.database.get('pokebattle', { id: session.userId })
      const vip = isVip(userArr[0])
      const vipReward = vip ? 1.5 : 1
      const pokeDex = new Pokedex(userArr[0])
      let usedCoords = []
      if (userArr.length == 0) {
        try {
          await session.execute(`签到`)
          return
        } catch (e) { return `请先输入签到指令领取属于你的宝可梦和精灵球` }

      } else {
        let pokeM = []
        let grassMonster = []
        let black = ['', '', '']
        if (userArr[0].captureTimes > 0) {

          for (let i = 0; i < 3; i++) {
            grassMonster[i] = pokemonCal.mathRandomInt(1, (userArr[0].lap==3)?420:(userArr[0].lapTwo) ? 251 : 151)
            while (banID.includes(`${grassMonster[i]}.${grassMonster[i]}`)) {
              while(lapThree.includes(`${grassMonster[i]}.${grassMonster[i]}`)){
                grassMonster[i] = pokemonCal.mathRandomInt(1, (userArr[0].lap==3)?420:(userArr[0].lapTwo) ? 251 : 151)
              }
              if((userArr[0].lapTwo ? Math.random() < userArr[0].level / 100 :true)){
                break
              }
              
            }
            pokeM[i] = grassMonster[i] + '.' + grassMonster[i]
            for (let j = 0; j < pokemonCal.pokemonlist(pokeM[i]).length; j++) {
              black[i] = black[i] + ('⬛')

            }
            if (banID.includes(`${grassMonster[i]}.${grassMonster[i]}`) && vip) {
              black[i] = "✨" + black[i] + "✨"
            }
          }

          let poke_img = []
          let bg_img = await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, './assets/img/components', 'catchBG.png')}`)
          poke_img[0] = await ctx.canvas.loadImage(`${config.图片源}/sr/${grassMonster[0]}.png`)
          poke_img[1] = await ctx.canvas.loadImage(`${config.图片源}/sr/${grassMonster[1]}.png`)
          poke_img[2] = await ctx.canvas.loadImage(`${config.图片源}/sr/${grassMonster[2]}.png`)
          let grassImg = await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, './assets/img/components', 'Grass.png')}`)
          let catchpockmon_img = await ctx.canvas.render(512, 512, async (ctx) => {
            //载入背景
            ctx.drawImage(bg_img, 0, 0, 512, 512)
            // 随机生成草堆的坐标并绘制草堆
            for (let i = 0; i < 15; i++) {
              let x, y;
              do {
                x = Math.floor(Math.random() * (512 - 64));
                y = Math.floor(Math.random() * (512 - 64));
              } while (usedCoords.some(([usedX, usedY]) => Math.abs(usedX - x) < 64 && Math.abs(usedY - y) < 64));
              usedCoords.push([x, y]);
              ctx.drawImage(grassImg, x, y, 64, 64);
            }
            // 随机生成宝可梦的坐标并绘制宝可梦
            for (let i = 0; i < 3; i++) {
              let x, y;
              do {
                x = Math.floor(Math.random() * (512 - 64));
                y = Math.floor(Math.random() * (512 - 64));
              } while (usedCoords.some(([usedX, usedY]) => Math.abs(usedX - x) < 64 && Math.abs(usedY - y) < 64));
              usedCoords.push([x, y]);
              ctx.drawImage(poke_img[i], x, y, 64, 64);
            }
            if (vip) {
              ctx.strokeStyle = 'gold'
              ctx.lineWidth = 10
              ctx.strokeRect(0, 0, 512, 512)
            }
          })
          const { src } = catchpockmon_img.attrs
          //创建图片
          try {
            const md = `<@${session.userId}>正在捕捉宝可梦
![img #512 #512](${await toUrl(ctx, session, src)})

---

- 当前的精灵球：${userArr[0].captureTimes}
- [随机捕捉](mqqapi://aio/inlinecmd?command=${Math.floor(Math.random() * 3) + 1}&reply=false&enter=true)

---
**一周目时，传说中的宝可梦(神兽)是不会放进背包的哦**

> tip:"⬛"的个数，表示的是宝可梦名字的长度
`
            await sendMarkdown(md, session, { keyboard: { content: catchbutton(black[0], black[1], black[2], session.userId), }, })
          } catch (e) {
            await session.send(`${h.image(src)}
\n
官方机器人输入【@Bot 序号】
请向其中一个投掷精灵球
【1】${black[0]}
【2】${black[1]}
【3】${black[2]}
请在10秒内输入序号\n
${(h('at', { id: (session.userId) }))}
  `)
          }
          const chooseMonster = await session.prompt(config.捕捉等待时间)
          let poke
          let reply: string
          if (!chooseMonster) {
            await ctx.database.set('pokebattle', { id: session.userId }, {
              captureTimes: { $subtract: [{ $: 'captureTimes' }, catchCose] }
            })//未输入
            return `哎呀！宝可梦们都逃跑了！精灵球-1`
          }
          switch (chooseMonster) {//选择宝可梦
            case '1':
              poke = pokeM[0]
              break;
            case '2':
              poke = pokeM[1]
              break;
            case '3':
              poke = pokeM[2]
              break;
            default:
              await ctx.database.set('pokebattle', { id: session.userId }, {
                captureTimes: { $subtract: [{ $: 'captureTimes' }, catchCose] }
              })
              return `球丢歪啦！重新捕捉吧~\n精灵球 -1`
          }
          if (banID.includes(poke) && !userArr[0].lapTwo) {

            const hasPoke = userArr[0].ultramonster?.includes(poke)
            if (hasPoke) {
              return `${h('at', { id: session.userId })}你已经拥有一只了，${pokemonCal.pokemonlist(poke)}挣脱束缚逃走了
`
            } else {

              let ultramonsterSet = new Set(userArr[0].ultramonster)

              ultramonsterSet.add(poke)

              userArr[0].ultramonster = Array.from(ultramonsterSet)

              await ctx.database.set('pokebattle', { id: session.userId }, {
                captureTimes: { $subtract: [{ $: 'captureTimes' }, catchCose] },
                ultramonster: userArr[0].ultramonster,
              })

              return `${h('at', { id: session.userId })}恭喜你获得了传说宝可梦【${pokemonCal.pokemonlist(poke)}】`
            }
          } else if (banID.includes(poke) && userArr[0].lapTwo) {
            if (userArr[0].ultra?.[poke] < 9 || !userArr[0].ultra?.[poke]) {
              if (userArr[0]?.ultra[poke] === undefined) {
                userArr[0].ultra[poke] = 0
              }
              const catchResults = catchPokemon(userArr[0], poke)
              let result = catchResults[1] as boolean
              if (!result) {
                const log = catchResults[0] as string
                const img=await getWildPic(ctx, log, userArr[0], poke)
                const md =`${pokemonCal.pokemonlist(poke)}将你打败了
![img#512 #512](${await toUrl(ctx, session, img)})

---
> <@${session.userId}>再接再厉`
                await sendMarkdown(md, session, { keyboard: { content: { "rows": [{ "buttons": [button(2, `继续捕捉宝可梦`, "/捕捉宝可梦", session.userId, "1")] },] }, }, })
                return
              }
              userArr[0].ultra[poke] = userArr[0]?.ultra[poke] + 1
              await ctx.database.set('pokebattle', { id: session.userId }, {
                ultra: userArr[0].ultra,
              })

              await ctx.database.set('pokebattle', { id: session.userId }, {
                captureTimes: { $subtract: [{ $: 'captureTimes' }, catchCose] }
              })
              try {
                const md = `<@${session.userId}>收集度+10%
![img#512 #512](${await toUrl(ctx, session, `${(pokemonCal.pokemomPic(poke, false)).toString().match(/src="([^"]*)"/)[1]}`)})
---
![img#20 #20](${await toUrl(ctx, session, `${config.图片源}/sr/${poke.split('.')[0]}.png`)}) : ${userArr[0].ultra[poke] * 10}% ${'🟩'.repeat(Math.floor(userArr[0].ultra[poke] / 2)) + '🟨'.repeat(userArr[0].ultra[poke] % 2) + '⬜⬜⬜⬜⬜'.substring(Math.round(userArr[0].ultra[poke] / 2))}
                
---
**传说宝可梦——${pokemonCal.pokemonlist(poke)}**`
                await sendMarkdown(md, session, { keyboard: { content: { "rows": [{ "buttons": [button(2, `继续捕捉宝可梦`, "/捕捉宝可梦", session.userId, "1")] },] }, }, })
                return
              } catch (e) {
                return `${pokemonCal.pokemomPic(poke, false)}
                ${h('at', { id: session.userId })}恭喜你收集到了传说宝可梦————${pokemonCal.pokemonlist(poke)}\r传说收集值+1，当前【${pokemonCal.pokemonlist(poke)}】收集值为${userArr[0].ultra[poke] * 10}%`
              }
            }
            if (userArr[0].ultra[poke] >= 9) {
              userArr[0].ultra[poke] = 10
              await ctx.database.set('pokebattle', { id: session.userId }, {
                ultra: userArr[0].ultra,
              }
              )
            }
          }

          //pve对战
          const catchResults = catchPokemon(userArr[0], poke)
          const log = catchResults[0] as string
          let result = catchResults[1] as boolean
          let baseexp = 0
          let expGet = 0
          let expNew = userArr[0].exp
          let getGold = 0
          let lvNew = userArr[0].level
          if (result) {
            baseexp = Number(expBase.exp[Number(String(poke).split('.')[0]) - 1].expbase)
            expGet = userArr[0].level > 99 ? 0 : Math.floor(userArr[0].level * baseexp / 7 * vipReward)
            expNew = pokemonCal.expCal(userArr[0].level, userArr[0].exp + expGet)[1]
            getGold = userArr[0].level > 99 ? Math.floor(pokemonCal.mathRandomInt(200, 400) * vipReward) : 0
            lvNew = pokemonCal.expCal(userArr[0].level, userArr[0].exp + expGet)[0]
          }
          result = userArr[0].monster_1 == '0' ? true : result
          const title: string = result ? `<@${session.userId}>成功捕捉了${pokemonCal.pokemonlist(poke)}` : `<@${session.userId}>被${pokemonCal.pokemonlist(poke)}打败了`
          const picture = userArr[0].monster_1 == '0' ? (pokemonCal.pokemomPic(poke, false)).toString().match(/src="([^"]*)"/)[1] : await getWildPic(ctx, log, userArr[0], poke)
          try {
            const md = `${title}
![img#512 #512](${await toUrl(ctx, session, picture)})

---
> ${userArr[0].lapTwo ? "你集齐了5只传说宝可梦\n据说多遇到几次就可以捕捉他们了" : "tips: “大灾变” 事件后的宝可梦好像并不能进行战斗了"}
${userArr[0].level > 99 ? `满级后，无法获得经验\n金币+${getGold}` : `你获得了${expGet}点经验值\nEXP:${pokemonCal.exp_bar(lvNew, expNew)}`}`
            await sendMarkdown(md, session, { keyboard: { content: { "rows": [{ "buttons": [button(2, `继续捕捉宝可梦`, "/捕捉宝可梦", session.userId, "1")] }, userArr[0].AllMonster.length === 5 ? { "buttons": [button(2, `放生宝可梦`, "/放生", session.userId, "2")] } : null,] }, }, })
          } catch (e) {
            await session.send(`${h.image(picture)}
${result ? '恭喜你捕捉到了宝可梦！' : '很遗憾，宝可梦逃走了！'}
\u200b${userArr[0].level > 99 ? `满级后，无法获得经验\r金币+${getGold}` : `你获得了${expGet}点经验值\rEXP:${pokemonCal.exp_bar(lvNew, expNew)}`}`
            )
          }
          if (!result) {
            return
          }
          await ctx.database.set('pokebattle', { id: session.userId }, {
            captureTimes: userArr[0].captureTimes - catchCose,
            exp: expNew,
            level: lvNew,
            gold: userArr[0].gold + getGold
          })
          if (userArr[0].AllMonster.length < 6) {//背包空间
            let five: string = ''
            if (userArr[0].AllMonster.length === 5) five = `\n你的背包已经满了,你可以通过 放生 指令，放生宝可梦`//背包即满

            if (poke == pokeM[0] || poke == pokeM[1] || poke == pokeM[2]) {//原生宝可梦判定
              userArr[0].AllMonster.push(poke)
              pokeDex.pull(poke, userArr[0])
              await ctx.database.set('pokebattle', { id: session.userId }, {
                AllMonster: userArr[0].AllMonster,
                pokedex: userArr[0].pokedex
              })
            }
            return five
          } else if (chooseMonster == '1' || chooseMonster == '2' || chooseMonster == '3') {//背包满
            //图片服务
            let pokemonimg1: string[] = []
            const bgImg = await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, './assets/img/components', 'bag.png')}`)
            for (let i = 0; i < userArr[0].AllMonster.length; i++) {
              pokemonimg1[i] = await ctx.canvas.loadImage(`${config.图片源}/sr/${userArr[0].AllMonster[i].split('.')[0]}.png`)
            }
            const img = await ctx.canvas.render(512, 381, async ctx => {
              ctx.drawImage(bgImg, 0, 0, 512, 381)
              ctx.font = 'bold 20px zpix'
              for (let i = 0; i < pokemonimg1.length; i++) {
                if (i % 2 == 0) {
                  ctx.drawImage(pokemonimg1[i], 28, 60 + 90 * (i / 2), 64, 64)
                  ctx.fillText('【' + (i + 1) + '】' + pokemonCal.pokemonlist(userArr[0].AllMonster[i]), 82, 100 + 90 * (i / 2))
                } else {
                  ctx.drawImage(pokemonimg1[i], 276, 72 + 90 * ((i - 1) / 2), 64, 64)
                  ctx.fillText('【' + (i + 1) + '】' + pokemonCal.pokemonlist(userArr[0].AllMonster[i]), 330, 112 + 90 * ((i - 1) / 2))
                }
              }
            })
            const { src } = img.attrs
            //图片服务
            try {
              const md = `<@${session.userId}>的宝可梦背包已经满了
![img#512 #381](${await toUrl(ctx, session, src)})
---
> **请你选择需要替换的宝可梦**`

              const kb = {
                keyboard: {
                  content: {
                    "rows": [
                      { "buttons": [button(0, pokemonCal.pokemonlist(userArr[0].AllMonster[0]), "1", session.userId, "1"), button(0, pokemonCal.pokemonlist(userArr[0].AllMonster[1]), "2", session.userId, "2")] },
                      { "buttons": [button(0, pokemonCal.pokemonlist(userArr[0].AllMonster[2]), "3", session.userId, "3"), button(0, pokemonCal.pokemonlist(userArr[0].AllMonster[3]), "4", session.userId, "4")] },
                      { "buttons": [button(0, pokemonCal.pokemonlist(userArr[0].AllMonster[4]), "5", session.userId, "5"), button(0, pokemonCal.pokemonlist(userArr[0].AllMonster[5]), "6", session.userId, "6")] },
                      { "buttons": [button(0, '放生', "/放生", session.userId, "7")] },]
                  },
                },
              }
              await sendMarkdown(md, session, kb)
            } catch (e) {
              await session.send(`\n
你的背包中已经有6只原生宝可梦啦
请选择一只替换
【1】${(pokemonCal.pokemonlist(userArr[0].AllMonster[0]))}
【2】${(pokemonCal.pokemonlist(userArr[0].AllMonster[1]))}
【3】${(pokemonCal.pokemonlist(userArr[0].AllMonster[2]))}
【4】${(pokemonCal.pokemonlist(userArr[0].AllMonster[3]))}
【5】${(pokemonCal.pokemonlist(userArr[0].AllMonster[4]))}
【6】${(pokemonCal.pokemonlist(userArr[0].AllMonster[5]))}
${(h('at', { id: (session.userId) }))}
          `)
            }
            const BagNum = await session.prompt(25000)

            if (!BagNum || !['1', '2', '3', '4', '5', '6'].includes(BagNum)) {
              return `你好像对新的宝可梦不太满意，把 ${(pokemonCal.pokemonlist(poke))} 放了`
            }
            const index = parseInt(BagNum) - 1
            userArr[0].AllMonster[index] = poke
            await session.execute(`放生 ${index + 1}`)
            pokeDex.pull(poke, userArr[0])
            await ctx.database.set('pokebattle', { id: session.userId }, {
              AllMonster: userArr[0].AllMonster,
              pokedex: userArr[0].pokedex
            })
            reply = `你小心翼翼的把 ${(pokemonCal.pokemonlist(poke))} 放在进背包`

            await session.send(reply)
          }
        } else {
          let dateToday = Math.round(Number(new Date()) / 1000)
          let dateNow = Math.floor(userArr[0].date / 86400 - 28800)
          if (dateNow == Math.floor(dateToday / 86400 - 28800)) {
            return `\n
今日次数已用完
请明天通过 签到 获取精灵球
${(h('at', { id: (session.userId) }))}
`
          } else {
            return `\n
你的精灵球已经用完啦
请通过 签到 获取新的精灵球
${(h('at', { id: (session.userId) }))}
          `
          }
        }
      }
    }
    )


  ctx.command('宝可梦').subcommand('杂交宝可梦', '选择两只宝可梦杂交')
    .action(async ({ session }) => {
      const userArr = await ctx.database.get('pokebattle', { id: session.userId })
      const vip = isVip(userArr[0])
      let dan: number | any[]
      if (userArr.length != 0) {
        //图片服务
        let pokemonimg1: string[] = []
        const bgImg = await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, './assets/img/components', 'bag.png')}`)
        for (let i = 0; i < userArr[0].AllMonster.length; i++) {
          pokemonimg1[i] = await ctx.canvas.loadImage(`${config.图片源}/sr/${userArr[0].AllMonster[i].split('.')[0]}.png`)
        }
        const image = await ctx.canvas.render(512, 381, async ctx => {
          ctx.drawImage(bgImg, 0, 0, 512, 381)
          ctx.font = 'bold 20px zpix'
          for (let i = 0; i < pokemonimg1.length; i++) {
            if (i % 2 == 0) {
              ctx.drawImage(pokemonimg1[i], 28, 60 + 90 * (i / 2), 64, 64)
              ctx.fillText('【' + (i + 1) + '】' + pokemonCal.pokemonlist(userArr[0].AllMonster[i]), 82, 100 + 90 * (i / 2))
            } else {
              ctx.drawImage(pokemonimg1[i], 276, 72 + 90 * ((i - 1) / 2), 64, 64)
              ctx.fillText('【' + (i + 1) + '】' + pokemonCal.pokemonlist(userArr[0].AllMonster[i]), 330, 112 + 90 * ((i - 1) / 2))
            }
          }
          if (vip) {
            ctx.strokeStyle = 'gold'
            ctx.lineWidth = 10
            ctx.strokeRect(0, 0, 512, 381)
          }
        })
        const { src } = image.attrs
        //图片服务
        try {
          const md = `# <@${session.userId}>选择两只宝可梦
![img#512 #381](${await toUrl(ctx, session, src)})
---
当前你也可以 [点击这里杂交](mqqapi://aio/inlinecmd?command=${encodeURIComponent(` `)}&reply=false&enter=false)

---
> 听说相同宝可梦也可以杂交，似乎就是会出现基因缺陷`
          const kb = {
            keyboard: {
              content: {
                "rows": [
                  { "buttons": [button(0, pokemonCal.pokemonlist(userArr[0].AllMonster[0]), `1`, session.userId, '1'), button(0, pokemonCal.pokemonlist(userArr[0].AllMonster[1]), `2`, session.userId, '2')] },
                  { "buttons": [button(0, pokemonCal.pokemonlist(userArr[0].AllMonster[2]), `3`, session.userId, '3'), button(0, pokemonCal.pokemonlist(userArr[0].AllMonster[3]), `4`, session.userId, '4')] },
                  { "buttons": [button(0, pokemonCal.pokemonlist(userArr[0].AllMonster[4]), `5`, session.userId, '5'), button(0, pokemonCal.pokemonlist(userArr[0].AllMonster[5]), `6`, session.userId, '6')] },

                ]
              },
            },
          }
          await sendMarkdown(md, session, kb)
        } catch (e) {
          await session.send(`\n${image}
回复【编号】 【编号】进行杂交
官方机器人输入
@Bot【编号】 【编号】
`)
        }
        let zajiao = await session.prompt(30000)
        const bagNumber = ['1', '2', '3', '4', '5', '6']
        if (zajiao) {
          if (bagNumber.includes(zajiao) && zajiao.length == 1) {
            const zajiao1 = zajiao
            session.send(`请点击第二个宝可梦`)
            const zajiao2 = await session.prompt(30000)
            if (!zajiao2) {
              return '你犹豫太久啦！'
            }
            zajiao = zajiao1 + ' ' + zajiao2
          }
          let comm = zajiao.split(' ')
          let pokeM = userArr[0].AllMonster[Number(comm[0]) - 1]
          let pokeW = userArr[0].AllMonster[Number(comm[1]) - 1]
          dan = pokemonCal.pokemonzajiao(pokeM, pokeW)
          if (dan == 0 || dan[0] == 0) {
            try {
              await session.bot.internal.sendMessage(session.guildId, {
                content: "111",
                msg_type: 2,
                keyboard: {
                  content: {
                    "rows": [
                      { "buttons": [button(2, "输入错误点击按钮重新杂交", "/杂交宝可梦", session.userId, "1")] },
                    ]
                  },
                },
                msg_id: session.messageId,
                timestamp: session.timestamp,
                msg_seq: Math.floor(Math.random() * 1000000),
              })
              return
            } catch
            //处理杂交错误
            { return '输入错误' }
          } else {
            if (userArr[0].monster_1 != '0') {
              //图片服务
              let img_fuse = await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, './assets/img/components/fuse.png')}`)
              let img_F = await ctx.canvas.loadImage(`${config.图片源}/fusion/${pokeM.split('.')[0]}/${pokeM.split('.')[0]}.png`)
              let img_M = await ctx.canvas.loadImage(`${config.图片源}/fusion/${pokeW.split('.')[0]}/${pokeW.split('.')[0]}.png`)
              let img_S = await ctx.canvas.loadImage(`${config.图片源}/fusion/${dan[1].split('.')[0]}/${dan[1]}.png`)
              let img_C = await ctx.canvas.loadImage(`${config.图片源}/fusion/${userArr[0].monster_1.split('.')[0]}/${userArr[0].monster_1}.png`)
              let img_zj = await ctx.canvas.render(512, 768, async ctx => {
                ctx.drawImage(img_fuse, 0, 0, 512, 768)
                ctx.drawImage(img_F, 16, 78, 112, 112)
                ctx.font = 'normal 15px zpix'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(pokemonCal.pokemonlist(pokeM) + '♂', 72, 206)
                ctx.fillText(pokemonCal.pokemonlist(pokeW) + '♀', 435, 206)
                ctx.fillText(`是否要将【${pokemonCal.pokemonlist(userArr[0].monster_1)}】替换为新生宝可梦【${dan[0]}】`, 256, 694)
                ctx.fillText(dan[0], 253, 326)
                ctx.drawImage(img_M, 379, 78, 112, 112)
                ctx.drawImage(img_S, 163, 114, 180, 180)
                ctx.drawImage(img_C, 294, 449, 180, 180)
                ctx.drawImage(img_S, 42, 449, 180, 180)
              })
              const { src } = img_zj.attrs
              //图片服务
              //有战斗宝可梦
              try {
                const point = '```'
                const md = `# <@${session.userId}>是否放入战斗栏
![img #512 #768](${await toUrl(ctx, session, src)})

---
${point}
生命：${Math.sign(Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[0]) - userArr[0].power[0]) >= 0 ? '+' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[0]) - userArr[0].power[0]) : '' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[0]) - userArr[0].power[0])}
攻击：${Math.sign(Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[1]) - userArr[0].power[1]) >= 0 ? '+' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[1]) - userArr[0].power[1]) : '' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[1]) - userArr[0].power[1])}
防御：${Math.sign(Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[2]) - userArr[0].power[2]) >= 0 ? '+' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[2]) - userArr[0].power[2]) : '' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[2]) - userArr[0].power[2])}
特攻：${Math.sign(Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[3]) - userArr[0].power[3]) >= 0 ? '+' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[3]) - userArr[0].power[3]) : '' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[3]) - userArr[0].power[3])}
特防：${Math.sign(Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[4]) - userArr[0].power[4]) >= 0 ? '+' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[4]) - userArr[0].power[4]) : '' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[4]) - userArr[0].power[4])}
速度：${Math.sign(Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[5]) - userArr[0].power[5]) >= 0 ? '+' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[5]) - userArr[0].power[5]) : '' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[5]) - userArr[0].power[5])}
${point}

---
宝可梦属性：${getType(dan[1]).join(' ')}
`
                await sendMarkdown(md, session, { keyboard: { content: { "rows": [{ "buttons": [button(0, "✅Yes", "Y", session.userId, "1"), button(0, "❌No", "N", session.userId, "2")] },] }, }, })
              } catch (e) {
                await session.send(`
${img_zj}
能力变化：
属性：${getType(dan[1]).join(' ')}
生命：${Math.sign(Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[0]) - userArr[0].power[0]) >= 0 ? '+' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[0]) - userArr[0].power[0]) : '' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[0]) - userArr[0].power[0])}
攻击：${Math.sign(Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[1]) - userArr[0].power[1]) >= 0 ? '+' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[1]) - userArr[0].power[1]) : '' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[1]) - userArr[0].power[1])}
防御：${Math.sign(Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[2]) - userArr[0].power[2]) >= 0 ? '+' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[2]) - userArr[0].power[2]) : '' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[2]) - userArr[0].power[2])}
特攻：${Math.sign(Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[3]) - userArr[0].power[3]) >= 0 ? '+' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[3]) - userArr[0].power[3]) : '' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[3]) - userArr[0].power[3])}
特防：${Math.sign(Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[4]) - userArr[0].power[4]) >= 0 ? '+' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[4]) - userArr[0].power[4]) : '' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[4]) - userArr[0].power[4])}
速度：${Math.sign(Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[5]) - userArr[0].power[5]) >= 0 ? '+' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[5]) - userArr[0].power[5]) : '' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[5]) - userArr[0].power[5])}
是否放入战斗栏（Y/N）
${(h('at', { id: (session.userId) }))}
`)
              }
              const battleBag = await session.prompt(20000)
              switch (battleBag) {
                case 'y':
                case 'Y':
                  await ctx.database.set('pokebattle', { id: session.userId }, {
                    monster_1: dan[1],
                    battlename: dan[0],
                    base: pokemonCal.pokeBase(dan[1]),
                    power: pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)
                  })
                  const point = '```'
                  const md = '# ✨' + dan[0] + '✨' + `
![img #512 #512](${await toUrl(ctx, session, `${config.图片源}/fusion/${dan[1].split('.')[0]}/${dan[1]}.png`)})

---
${point}
生命：${pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[0]}  ${Math.sign(Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[0]) - userArr[0].power[0]) >= 0 ? '+' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[0]) - userArr[0].power[0]) : '' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[0]) - userArr[0].power[0])}
攻击：${pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[1]}  ${Math.sign(Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[1]) - userArr[0].power[1]) >= 0 ? '+' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[1]) - userArr[0].power[1]) : '' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[1]) - userArr[0].power[1])}
防御：${pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[2]}  ${Math.sign(Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[2]) - userArr[0].power[2]) >= 0 ? '+' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[2]) - userArr[0].power[2]) : '' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[2]) - userArr[0].power[2])}
特攻：${pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[3]}  ${Math.sign(Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[3]) - userArr[0].power[3]) >= 0 ? '+' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[3]) - userArr[0].power[3]) : '' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[3]) - userArr[0].power[3])}
特防：${pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[4]}  ${Math.sign(Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[4]) - userArr[0].power[4]) >= 0 ? '+' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[4]) - userArr[0].power[4]) : '' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[4]) - userArr[0].power[4])}
速度：${pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[5]}  ${Math.sign(Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[5]) - userArr[0].power[5]) >= 0 ? '+' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[5]) - userArr[0].power[5]) : '' + (Number(pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)[5]) - userArr[0].power[5])}
${point}
`
                  await sendMarkdown(md, session)
                  return
                case 'n':
                case 'N':
                  return '你对这个新宝可梦不太满意，把他放生了';
                default:
                  return '新出生的宝可梦好像逃走了';
              }
            } else {
              //没有战斗宝可梦
              await ctx.database.set('pokebattle', { id: session.userId }, {
                monster_1: dan[1],
                base: pokemonCal.pokeBase(dan[1]),
                battlename: dan[0],
                power: pokemonCal.power(pokemonCal.pokeBase(dan[1]), userArr[0].level)
              })

              return `恭喜你
成功杂交出优秀的后代宝可梦【${(dan[0])}】
${pokemonCal.pokemomPic(dan[1], true)}
成功将${(dan[0])}放入战斗栏
${(h('at', { id: (session.userId) }))}`
            }
          }
        } else {
          return `蛋好像已经臭了，无法孵化。`
        }

      } else {
        try {
          await session.execute(`签到`)
          return
        } catch (e) { return `请先输入 签到 领取属于你的宝可梦和精灵球` }
      }
    })


  ctx.command('宝可梦').subcommand('查看信息 <user:string>', '查看用户信息')
    .action(async ({ session }, user) => {
      let pokemonimg1 = []
      let pokemonimg = []
      let ultramonsterimg = []
      let userArr: string | any[]
      let userId: string
      const infoImgSelf_bg = await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, './assets/img/components', 'trainercard.png')}`)
      let expbar = await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, './assets/img/components', 'expbar.png')}`)
      let overlay = await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, './assets/img/components', 'overlay_exp.png')}`)
      if (!user) {
        //查看自己信息
        userId = session.userId
        userArr = await ctx.database.get('pokebattle', { id: session.userId })
      } else {

        if (session.platform == 'red') {
          try { userId = session.elements[1].attrs.id } catch {
            return `请@一位训练师或者查看自己属性`
          }
        } else {
          try { userId = /[0-9A-Z]+/.exec(user)[0] } catch {
            return `请@一位训练师或者查看自己属性`
          }
        }
        userArr = await ctx.database.get('pokebattle', { id: userId })
      }
      if (userArr.length != 0) {
        let bagspace: string[] = []
        for (let i = 0; i < userArr[0].AllMonster.length; i++) {
          if (userArr[0].AllMonster[i] != 0) {
            bagspace.push(userArr[0].AllMonster[i])
          }
        }
        //存在数据
        //图片服务
        const vip = isVip(userArr[0])
        const vipName = vip ? "💎VIP" : ''
        const playerLimit = await isResourceLimit(session.userId, ctx)
        const infoId = userArr[0].id.length > 15 ? `${userArr[0].id.slice(0, 3)}...${userArr[0].id.slice(-3)}` : userArr[0].id
        const infoName = userArr[0].name ? userArr[0].name : session.username > 10 ? session.username : infoId
        for (let i = 0; i < userArr[0].AllMonster.length; i++) {
          pokemonimg1[i] = await ctx.canvas.loadImage(`${config.图片源}/sr/${userArr[0].AllMonster[i].split('.')[0]}.png`)
        }
        for (let i = 0; i < 5; i++) {
          ultramonsterimg[i] = await ctx.canvas.loadImage(`${config.图片源}/sr/${banID[i].split('.')[0]}.png`)
        }
        if (userArr[0].monster_1 !== '0') pokemonimg = await ctx.canvas.loadImage(`${config.图片源}/fusion/${userArr[0].monster_1.split('.')[0]}/${userArr[0].monster_1}.png`)
        let trainers = '0'
        if (userArr[0].trainer[0] !== '0') { trainers = userArr[0].trainer[0] }
        let trainerimg = await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, `./assets/img/trainer/${trainers}.png`)}`)
        const infoImgSelfClassic = await ctx.canvas.render(485, 703, async ctx => {
          ctx.drawImage(infoImgSelf_bg, 0, 0, 485, 703)
          if (userArr[0].monster_1 !== '0') {
            ctx.globalAlpha = 0.5
            ctx.drawImage(pokemonimg, 316, 95, 135, 135)
            ctx.globalAlpha = 1
            ctx.drawImage(trainerimg, 342, 119, 112, 112)
          } else {
            ctx.drawImage(trainerimg, 316, 95, 135, 135)
          }
          for (let i = 0; i < ultramonsterimg.length; i++) {
            ctx.globalAlpha = 0.5
            if (userArr[0].ultramonster.includes(banID[i])) { ctx.globalAlpha = 1 }
            ctx.drawImage(ultramonsterimg[i], 134 + 48 * i, 300, 25, 25)
          }
          ctx.globalAlpha = 1
          ctx.font = 'bold 20px zpix'
          for (let i = 0; i < pokemonimg1.length; i++) {
            if (i % 2 == 0) {
              ctx.drawImage(pokemonimg1[i], 6, 360 + 90 * (i / 2), 64, 64)
              ctx.fillText('【' + pokemonCal.pokemonlist(userArr[0].AllMonster[i]) + '】', 76, 400 + 90 * (i / 2))
            } else {
              ctx.drawImage(pokemonimg1[i], 254, 373 + 90 * ((i - 1) / 2), 64, 64)
              ctx.fillText('【' + pokemonCal.pokemonlist(userArr[0].AllMonster[i]) + '】', 324, 413 + 90 * ((i - 1) / 2))
            }
          }
          ctx.font = 'bold 20px zpix'
          ctx.fillText(vipName, 340, 261)
          ctx.font = 'normal 25px zpix'
          ctx.fillText('：' + infoId, 61, 72)

          ctx.fillText('：' + (vip ? '👑' : '') + infoName, 86, 122)
          ctx.fillText('：' + userArr[0].gold, 137, 168)
          ctx.fillText('：' + userArr[0].captureTimes, 137, 218)
          ctx.fillText('：' + userArr[0].coin, 137, 263)
          ctx.fillText(userArr[0].level, 358, 73)
          ctx.font = 'bold 25px zpix'
          ctx.fillText('EXP>>                <<', 105, 650)
          ctx.drawImage(overlay, 181, 644, 160 * userArr[0].exp / expToLv.exp_lv[userArr[0].level].exp, 8)
          ctx.drawImage(expbar, 163, 641, 180, 20)
          if (vip) {
            ctx.strokeStyle = 'gold'
            ctx.lineWidth = 10
            ctx.strokeRect(0, 0, 485, 703)
          }
        })

        const { src } = infoImgSelfClassic.attrs
        //图片服务
        try {
          const chance=await getChance(userArr[0],ctx)
          const md = `# <@${userId}>的训练师卡片
![img#485 #703](${await toUrl(ctx, session, src)})

---

- 金币获取剩余：${playerLimit.resource.goldLimit}
- 宝可梦属性：${getType(userArr[0].monster_1).join(' ')}

---
${userArr[0].advanceChance?`你当前可以进入三周目

[三周目](mqqapi://aio/inlinecmd?command=${encodeURIComponent(`/lapnext`)}&reply=false&enter=true)`:' '}
${chance?`你当前可以领取三周目资格

[领取](mqqapi://aio/inlinecmd?command=${encodeURIComponent(`/getchance`)}&reply=false&enter=true)`:' '} 

> *邀请麦麦子到其他群做客可以增加3w获取上限哦~o(*////▽////*)q`
          await sendMarkdown(md, session, normalKb(session, userArr as Pokebattle[]))
        } catch (e) {
          return `${h.image(src)}
${(h('at', { id: (session.userId) }))}`
        }
      } else {
        try {
          await session.execute(`签到`)
          return
        } catch (e) {
          return `请先输入 签到 领取属于你的宝可梦和精灵球`
        }
        //不存在数据
      }
    })


  ctx.command('宝可梦').subcommand('放生 <pokemon>', '放生宝可梦')
    .action(async ({ session }, pokemon: string) => {
      let choose: string
      const userArr = await ctx.database.get('pokebattle', { id: session.userId })
      const vip = isVip(userArr[0])
      const vipReward = vip ? 1.5 : 1
      if (userArr.length == 0) {
        try {
          await session.execute(`签到`)
          return
        } catch (e) { return `请先输入 签到 领取属于你的宝可梦和精灵球` }
      }
      //图片服务
      if (pokemon) {
        if (Number(pokemon) > userArr[0].AllMonster.length) return `输入错误`
        choose = pokemon
      }
      else {
        let pokemonimg1: string[] = []
        const bgImg = await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, './assets/img/components', 'bag.png')}`)
        for (let i = 0; i < userArr[0].AllMonster.length; i++) {
          pokemonimg1[i] = await ctx.canvas.loadImage(`${config.图片源}/sr/${userArr[0].AllMonster[i].split('.')[0]}.png`)
        }
        const image = await ctx.canvas.render(512, 381, async ctx => {
          ctx.drawImage(bgImg, 0, 0, 512, 381)
          ctx.font = 'bold 20px zpix'
          for (let i = 0; i < pokemonimg1.length; i++) {
            if (i % 2 == 0) {
              ctx.drawImage(pokemonimg1[i], 28, 60 + 90 * (i / 2), 64, 64)
              ctx.fillText('【' + (i + 1) + '】' + pokemonCal.pokemonlist(userArr[0].AllMonster[i]), 82, 100 + 90 * (i / 2))
            } else {
              ctx.drawImage(pokemonimg1[i], 276, 72 + 90 * ((i - 1) / 2), 64, 64)
              ctx.fillText('【' + (i + 1) + '】' + pokemonCal.pokemonlist(userArr[0].AllMonster[i]), 330, 112 + 90 * ((i - 1) / 2))
            }
          }
          if (vip) {
            ctx.strokeStyle = 'gold'
            ctx.lineWidth = 10
            ctx.strokeRect(0, 0, 512, 381)
          }
        })
        const { src } = image.attrs
        //图片服务
        try {
          const kb = {
            keyboard: {
              content: {
                "rows": [{ "buttons": [button(0, pokemonCal.pokemonlist(userArr[0].AllMonster[0]), "1", session.userId, "1"), button(0, pokemonCal.pokemonlist(userArr[0].AllMonster[1]), "2", session.userId, "2")] },
                { "buttons": [button(0, pokemonCal.pokemonlist(userArr[0].AllMonster[2]), "3", session.userId, "3"), button(0, pokemonCal.pokemonlist(userArr[0].AllMonster[3]), "4", session.userId, "4")] },
                { "buttons": [button(0, pokemonCal.pokemonlist(userArr[0].AllMonster[4]), "5", session.userId, "5"), button(0, pokemonCal.pokemonlist(userArr[0].AllMonster[5]), "6", session.userId, "6")] },]
              },
            },
          }
          const md = `# <@${session.userId}>选择放生宝可梦
![img#512 #381](${await toUrl(ctx, session, src)})`
          await sendMarkdown(md, session, kb)

        } catch (e) {
          await session.send(`\n${image}
回复【编号】进行放生
官方机器人请@Bot后输入序号
`)
        }
        choose = await session.prompt(20000)
      }
      if (!choose) return `${(h('at', { id: (session.userId) }))}你好像还在犹豫，有点舍不得他们`
      if (userArr[0].AllMonster[Number(choose) - 1]) {
        if (userArr[0].AllMonster.length === 1) return `${(h('at', { id: (session.userId) }))}你只剩一只宝可梦了，无法放生`
        // let discarded=userArr[0].AllMonster[Number(choose)-1]
        let chsNum = Number(choose) - 1
        let baseexp = Number(expBase.exp[Number(String(userArr[0].AllMonster[chsNum]).split('.')[0]) - 1].expbase)
        let expGet = userArr[0].level > 99 ? 0 : Math.floor(userArr[0].level * baseexp / 7 * vipReward)
        let discarded = userArr[0].AllMonster.splice(Number(choose) - 1, 1)
        let expNew = pokemonCal.expCal(userArr[0].level, userArr[0].exp + expGet)[1]
        let getGold = userArr[0].level > 99 ? Math.floor(pokemonCal.mathRandomInt(350, 500) * vipReward) : 0
        let lvNew = pokemonCal.expCal(userArr[0].level, userArr[0].exp + expGet)[0]
        const resource = await isResourceLimit(session.userId, ctx)
        const rLimit = new PrivateResource(resource.resource.goldLimit)
        getGold = await rLimit.getGold(ctx, getGold, session.userId)
        await ctx.database.set('pokebattle', { id: session.userId }, {
          AllMonster: userArr[0].AllMonster,
          level: lvNew,
          exp: expNew,
          power: pokemonCal.power(pokemonCal.pokeBase(userArr[0].monster_1), lvNew),
        })
        try {
          const src = pokemonCal.pokemomPic(discarded[0], false).toString().match(/src="([^"]*)"/)[1]
          const md = `# <@${session.userId}>你将【${(pokemonCal.pokemonlist(discarded[0]))}】放生了
![img#512 #512](${await toUrl(ctx, session, src)})

---
> **Lv.${lvNew}**${(pokemonCal.exp_bar(lvNew, expNew))}

---
> ${userArr[0].level > 99 ? `金币+${getGold}` : `经验+${expGet}`}`
          const kb = {
            keyboard: {
              content: {
                "rows": [
                  { "buttons": [button(2, "👐 继续放生", "/放生", session.userId, "6"), button(2, "📷 继续捕捉", "/捕捉宝可梦", session.userId, "2")] },
                  { "buttons": [button(2, "💳 查看信息", "/查看信息", session.userId, "3"), button(2, "⚔️ 对战", "/对战", session.userId, "4")] },
                ]
              },
            },
          }
          await sendMarkdown(md, session, kb)
        } catch (e) {
          return `
你将【${(pokemonCal.pokemonlist(discarded[0]))}】放生了
${pokemonCal.pokemomPic(discarded[0], false)}
经验+${expGet}
当前等级为:
lv.${lvNew}
当前经验：
${(pokemonCal.exp_bar(lvNew, expNew))}
${(h('at', { id: (session.userId) }))}
        `}
      } else {
        return `你好像想放生一些了不得的东西`
      }

    })


  ctx.command('宝可梦').subcommand('属性', '查看战斗宝可梦属性')
    .usage(`/属性`)
    .action(async ({ session },) => {
      let tar = session.userId
      const userArr = await ctx.database.get('pokebattle', { id: tar })
      if (userArr.length == 0) {
        try {
          await session.execute(`签到`)
          return
        } catch (e) { return `请先输入 签到 领取属于你的宝可梦和精灵球` }
      }
      if (userArr[0].monster_1 == '0') return `你还没有战斗宝可梦，快去 杂交宝可梦 吧`
      const img = userArr[0].monster_1
      const fath = userArr[0].monster_1.split('.')[0] + '.' + userArr[0].monster_1.split('.')[0]
      const math = userArr[0].monster_1.split('.')[1] + '.' + userArr[0].monster_1.split('.')[1]
      let toDo = ''
      if (userArr[0]?.base[0]) {
        toDo = `能力值：
生命：${pokemonCal.power(pokemonCal.pokeBase(userArr[0].monster_1), userArr[0].level)[0]}
攻击：${pokemonCal.power(pokemonCal.pokeBase(userArr[0].monster_1), userArr[0].level)[1]}
防御：${pokemonCal.power(pokemonCal.pokeBase(userArr[0].monster_1), userArr[0].level)[2]}
特攻：${pokemonCal.power(pokemonCal.pokeBase(userArr[0].monster_1), userArr[0].level)[3]}
特防：${pokemonCal.power(pokemonCal.pokeBase(userArr[0].monster_1), userArr[0].level)[4]}
速度：${pokemonCal.power(pokemonCal.pokeBase(userArr[0].monster_1), userArr[0].level)[5]}`
      }
      try {
        const point = '```'
        const src = await toUrl(ctx, session, `${config.图片源}/fusion/${img.split('.')[0]}/${img}.png`)
        const md =`${userArr[0].battlename}的属性
![img #512 #512](${src})

> 宝可梦属性：${getType(userArr[0].monster_1).join(' ')}
父本：${pokemonCal.pokemonlist(fath)}
母本：${pokemonCal.pokemonlist(math)}

---
${point}
${(toDo)}
${point}`
        await sendMarkdown(md, session, { keyboard: { content: { "rows": [{ "buttons": [button(0, "♂ 杂交宝可梦", "/杂交宝可梦", session.userId, "1"), button(0, "📷 捕捉宝可梦", "/捕捉宝可梦", session.userId, "2")] }, { "buttons": [button(0, "💳 查看信息", "/查看信息", session.userId, "3"), button(0, "⚔️ 对战", "/对战", session.userId, "4")] },] }, }, })
      } catch (e) {
        return `\u200b
============
${userArr[0].battlename}
${(toDo)}
============
tips:听说不同种的宝可梦杂交更有优势噢o(≧v≦)o~~
      `
      }
    })


  ctx.command('宝可梦').subcommand('对战 <user>', '和其他训练师对战', { minInterval: config.对战cd * 1000 })
    .usage(`/对战 @user`)
    .action(async ({ session }, user) => {
      let battleSuccess = false
      let jli: string = ''
      let robot: Pokebattle
      try {
        let userId: string
        let randomUser: { id: string }
        const userArr = await ctx.database.get('pokebattle', { id: session.userId })
        const userLimit = await isResourceLimit(session.userId, ctx)
        const userVip = isVip(userArr[0])
        if (userArr.length == 0) {
          try {
            await session.execute(`签到`)
            return
          } catch (e) { return `请先输入 签到 领取属于你的宝可梦和精灵球` }
        }
        let spendGold = userVip ? 249 : 500
        spendGold = (userLimit.resource.goldLimit == 0 && userArr[0].level == 100) ? 0 : spendGold
        if (userArr[0].gold < spendGold) {
          return (`你的金币不足，无法对战`)
        }
        let commands=''
        let img=''
        if (userArr[0].monster_1 == '0'){ commands= `杂交宝可梦`}
        if (userArr[0].skillbag.length == 0) {commands= `技能扭蛋机`}
        if (commands){
          for(let i=0;i<userArr[0].AllMonster.length;i++){
           img+=`
![img#20 #20](${await toUrl(ctx, session, `${config.图片源}/sr/${userArr[0].AllMonster[i].split('.')[0]}.png`)})`
          }
          const md = `![img#50 #50](https://q.qlogo.cn/qqapp/102072441/${session.userId}/640) **LV.${userArr[0].level}**${img}

---
<@${session.userId}>你还没有${commands}吧
点击👉 [${commands}](mqqapi://aio/inlinecmd?command=${encodeURIComponent(`/${commands}`)}&reply=false&enter=true)
`
          await sendMarkdown(md, session)
          return
        }
        if (!user) {
          try {
            let randomID = await ctx.database
              .select('pokebattle')
              .where(row => $.ne(row.id, userArr[0].id))
              .where(row => $.lte(row.level, Number(userArr[0].level)))
              .where(row => $.gte(row.level, Number(userArr[0].level) - 5))
              .where(row => $.gt(row.battleTimes, 0))
              .where(row => $.ne(row.monster_1, '0'))
              .execute()

            if (randomID.length == 0) {
              robot = new Robot(userArr[0].level)
              userId = robot.id
            } else {
              randomUser = randomID[pokemonCal.mathRandomInt(0, randomID.length - 1)]
              userId = randomUser.id
            }
          } catch (e) {
            logger.error(e)
            return `网络繁忙，请再试一次`
          }

        }
        else {
          if (session.platform !== 'qq') {
            userId = session.elements[1].attrs.id
            battleSuccess = true
          } else {
            battleSuccess = false
            userId = /[0-9A-Z]+/.exec(user)[0]
            if (!/[0-9A-Z]+/.test(userId)) {
              return (`请@一位宝可梦训练师，例如对战 @麦Mai`);
            }
          }
        }

        let tarArr = userId?.substring(0, 5) == 'robot' ? [robot] : await ctx.database.get('pokebattle', { id: userId })
        if (session.userId == userId) {
          return (`你不能对自己发动对战`)
        } else if (tarArr.length == 0 || tarArr[0].monster_1 == '0') {
          return (`对方还没有宝可梦`)
        }
        let battleTimes = tarArr[0].battleTimes - 1
        if (battleTimes < 0) {
          battleTimes = 0
          return `对方的宝可梦还在恢复，无法对战`
        }
        tarArr[0].battleTimes = battleTimes

        tarArr[0].base = pokemonCal.pokeBase(tarArr[0].monster_1)
        tarArr[0].power = pokemonCal.power(pokemonCal.pokeBase(tarArr[0].monster_1), tarArr[0].level)

        await ctx.database.set('pokebattle', { id: userId }, {
          battleTimes: battleTimes,
          base: tarArr[0].base,
          power: tarArr[0].power
        })
        await ctx.database.set('pokebattle', { id: session.userId }, {
          gold: { $subtract: [{ $: 'gold' }, spendGold] },
        })
        await session.send(`${userVip ? `你支付了会员价${spendGold}` : `你支付了${spendGold}`}金币，请稍等，正在发动了宝可梦对战`)
        if (tarArr[0].battleTimes == 0) {
          let noTrainer = battleSuccess ? session.elements[1].attrs.name : isVip(tarArr[0]) ? "[💎VIP]" : '' + (tarArr[0].name || tarArr[0].battlename)
          jli = `${noTrainer}已经筋疲力尽,每一小时恢复一次可对战次数`
        }
        let battle = pokebattle(userArr[0], tarArr[0])
        let battlelog = battle[0]
        let winner = battle[1]
        let loser = battle[2]
        await ctx.database.set('pokemon.resourceLimit', { id: winner},row=>({
          rankScore: $.add(row.rankScore, 2),
        })
        )
        await ctx.database.set('pokemon.resourceLimit', { id: loser,rankScore:{$gt:0}},row=>
        ({
          rankScore: $.sub(row.rankScore, 1),
        })
        )
        let loserArr = loser.substring(0, 5) == 'robot' ? [robot] : await ctx.database.get('pokebattle', { id: loser })
        let winnerArr = winner.substring(0, 5) == 'robot' ? [robot] : await ctx.database.get('pokebattle', { id: winner })
        let getgold = pokemonCal.mathRandomInt(1000, 1500) + (isVip(winnerArr[0]) ? 500 : 0)

        /* 金币上限 */
        if (winner.substring(0, 5) !== 'robot' && winner == session.userId) {
          const resource = await isResourceLimit(winner, ctx)
          const rLimit = new PrivateResource(resource.resource.goldLimit)
          getgold = await rLimit.getGold(ctx, getgold, winner)
        } else {
          await ctx.database.set('pokebattle', { id: session.userId }, {
            gold: { $add: [{ $: 'gold' }, spendGold / 2] },
          })
        }

        const winName = isVip(winnerArr[0]) ? "[💎VIP]" : ''
        const loseName = isVip(loserArr[0]) ? "[💎VIP]" : ''
        const loserlog = `${loseName + (loserArr[0].name || loserArr[0].battlename)}输了\r`
        try {
          const md =`<@${session.userId}>对战结束
![img#712 #750](${await toUrl(ctx, session, await getPic(ctx, battlelog, userArr[0], tarArr[0]))})

---
获胜者:${winName + (winnerArr[0].name || winnerArr[0].battlename)}
${winner == session.userId ? `金币+${getgold}  对战积分+2

---
> ${loserlog} 对战积分-1` : `
---
> ${loseName}<@${session.userId}>你输了已返还一半金币 对战积分-1`}`
const kb={
  keyboard: {
    content: {
      "rows": [
        { "buttons": [button(2, "♂ 杂交宝可梦", "/杂交宝可梦", session.userId, "1"), button(2, "📷 捕捉宝可梦", "/捕捉宝可梦", session.userId, "2")] },
        { "buttons": [button(2, "💳 查看信息", "/查看信息", session.userId, "3"), button(2, "⚔️ 对战", "/对战", session.userId, "4")] },
        { "buttons": [button(2, "🎯 对手信息", `/查看信息 ${userId}`, session.userId, "5"), button(2, "⚔️ 和他对战", `/对战 ${session.userId}`, session.userId, "6")] },
      ]
    },
  },
}
          await sendMarkdown(md, session, kb)
          return
        }catch{
        return `${h.image(await getPic(ctx, battlelog, userArr[0], tarArr[0]))}
${h('at', { id: (session.userId) })}\u200b
战斗结束
====================
获胜者:${winName + (winnerArr[0].name || winnerArr[0].battlename)}
金币+${getgold}
====================
${jli}`}
      } catch (e) {
        logger.info(e)
        return `对战失败`
      }
    })


  ctx.command('宝可梦').subcommand('技能扭蛋机 [count:number]', '消耗扭蛋币，抽取技能')
    .usage(`/ 技能扭蛋机`)
    .action(async ({ session }, count) => {
      const userArr = await ctx.database.get('pokebattle', { id: session.userId })
      if (count > userArr[0].coin || count < 1) return `你的代币不足，要积极参与对战哦~`
      if (!count) {
        count = 1
      }
      count = Math.floor(count)
      if (userArr.length == 0) {
        try {
          await session.execute(`签到`)
          return
        } catch (e) { return `${h('at', { id: (session.userId) })}请先输入 签到 领取属于你的宝可梦和精灵球` }
      }
      if (userArr[0].coin < 1) { return (`你的代币不足，要积极参与对战哦~`) }
      await ctx.database.set('pokebattle', { id: session.userId }, {
        coin: { $subtract: [{ $: 'coin' }, count] },
      })
      let skilllist = []
      let getgold = 0
      for (let i = 0; i < count; i++) {
        let getskill = pokemonCal.pokemonskill(userArr[0].level)
        if (userArr[0].skill == 0) {
          userArr[0].skillbag.push(String(getskill))
          await ctx.database.set('pokebattle', { id: session.userId }, {
            skill: getskill,
          })
        } else if (userArr[0].skillbag.includes(String(getskill))) {
          getgold += 350
          skilllist.push(`${(skillMachine.skill[getskill].skill)}(重复)`)
          continue
        } else {
          userArr[0].skillbag.push(String(getskill))
        }
        skilllist.push(skillMachine.skill[getskill].skill)
      }
      const resource = await isResourceLimit(session.userId, ctx)
      const rLimit = new PrivateResource(resource.resource.goldLimit)
      getgold = await rLimit.getGold(ctx, getgold, session.userId)
      await ctx.database.set('pokebattle', { id: session.userId }, {
        skillbag: userArr[0].skillbag
      })
try{      const point = '```'
      const md =`# <@${session.userId}> 扭蛋结果
你抽取了${count}个技能
重复技能将被换成金币

---
${point}
${skilllist.join('\n')}
${point}

---
金币+${getgold}

---
> 点击后输入数字
即可连续抽取技能👉 [技能扭蛋机](mqqapi://aio/inlinecmd?command=${encodeURIComponent(`/技能扭蛋机`)}&reply=false&enter=false)`
      await sendMarkdown(md, session)}catch{
        await session.send(`你抽取了${count}个技能\n重复技能将被换成金币\n${skilllist.join('\n')}\n金币+${getgold}`)
      }
    })


  ctx.command('宝可梦').subcommand('技能背包', '查看所有获得的技能')
    .usage(`/技能背包`)
    .action(async ({ session }) => {
      const userArr = await ctx.database.get('pokebattle', { id: session.userId })
      if (userArr.length == 0) {
        try {
          await session.execute(`签到`)
          return
        } catch (e) { return `请先输入 签到 领取属于你的宝可梦和精灵球` }
      }
      if(userArr[0]?.skillbag.length==0) return  `你还没有技能哦\n签到领取代币到【技能扭蛋机】抽取技能吧`
      const bag=`${pokemonCal.skillbag(userArr[0].skillbag)}`
      const point = '```'
      const md = `# ![img#50 #50](https://q.qlogo.cn/qqapp/102072441/${session.userId}/640)<@${session.userId}>的技能背包

---
${point}
${bag}
${point}`
      try{await sendMarkdown(md, session)}catch{
        return `\u200b
你当前的技能：
${bag.replace(/\n/g, '||')}`
      }
    })


  ctx.command('宝可梦').subcommand('装备技能 <skill>', '装备技能')
    .usage(`/装备技能 <技能名字>`)
    .action(async ({ session }, skill) => {
      if (!skill) return `请输入技能名称 例如：【装备技能 大爆炸】`
      const userArr = await ctx.database.get('pokebattle', { id: session.userId })
      if (userArr.length == 0) {
        try {
          await session.execute(`签到`)
          return
        } catch (e) { return `${h('at', { id: (session.userId) })}请先输入 签到 领取属于你的宝可梦和精灵球` }
      }
      if (!userArr[0].skillbag.includes(String(pokemonCal.findskillId(skill)))) return `${h('at', { id: (session.userId) })}你还没有这个技能哦`

      await ctx.database.set('pokebattle', { id: session.userId }, {
        skill: Number(pokemonCal.findskillId(skill)),
      })
      return `${h('at', { id: (session.userId) })}成功装备了【${skill}】技能`
    })


  ctx.command('宝可梦').subcommand('查询技能 <skill>', '查询技能信息')
    .usage(`/查询技能 <技能名字>|<空>`)
    .action(async ({ session }, skill) => {
      const userArr = await ctx.database.get('pokebattle', { id: session.userId })
      try {
        if (!userArr[0].skillbag[2] && !skill) return `你的技能还太少，有什么先用着吧，或者输入你想查询的技能名字 例如：【查询技能 大爆炸】`
        if (!skill) return (pokemonCal.skillinfo(userArr[0].skillbag, '', false))
        if (pokemonCal.findskillId(skill) == 0) return pokemonCal.skillinfo(userArr[0].skillbag, skill, true)
        return `${skill}的技能信息：\n威力：${skillMachine.skill[Number(pokemonCal.findskillId(skill))].Dam}\n类型：${skillMachine.skill[Number(pokemonCal.findskillId(skill))].category == 1 ? '物理' : "特殊"}\n属性：${skillMachine.skill[Number(pokemonCal.findskillId(skill))].type}\n描述：${skillMachine.skill[Number(pokemonCal.findskillId(skill))].descript}`
      } catch (e) {
        logger.info(e)
        return `输入错误，没有这个技能哦`
      }
    })



  //md重构checkPoint
  ctx.command('宝可梦').subcommand('更换训练师 <name:string>', '更换训练师,留空则查看所有训练师')
    .usage(`/更换训练师 <训练师名字>|<空>`)
    .action(async ({ session }, name) => {
      const userArr = await ctx.database.get('pokebattle', { id: session.userId })
      if (userArr.length == 0) {
        try {
          await session.execute(`签到`)
          return
        } catch (e) { return `${h('at', { id: (session.userId) })}请先输入 签到 领取属于你的宝可梦和精灵球` }
      }
      if (userArr[0].trainer.length == 1) return `${h('at', { id: (session.userId) })}你只有一个训练师，无法更换`
      let nameList = `${userArr[0].trainerName.map((item: any, index: number) => `${index + 1}-${item}`).join('\n')}`
      if (!name) {
        await session.send(`${h('at', { id: (session.userId) })}请选择你想更换的训练师名字\n${nameList}`)
        const choose = await session.prompt(20000)
        if (!choose) return `${h('at', { id: (session.userId) })}你好像还在犹豫，一会再换吧`
        if (isNaN(Number(choose)) || Number(choose) > userArr[0].trainer.length) return `${h('at', { id: (session.userId) })}输入错误`
        let newTrainer = moveToFirst(userArr[0].trainer, userArr[0].trainer[Number(choose) - 1])
        let newTrainerName = moveToFirst(userArr[0].trainerName, userArr[0].trainerName[Number(choose) - 1])
        await ctx.database.set('pokebattle', { id: session.userId }, {
          trainer: userArr[0].trainer,
          trainerName: userArr[0].trainerName
        })
        return `${h('at', { id: (session.userId) })}成功更换了训练师${h.image(pathToFileURL(resolve(__dirname, './assets/img/trainer', newTrainer[0] + '.png')).href)}`
      }
      if (userArr[0].trainerName.includes(name)) {
        const distance = userArr[0].trainerName.indexOf(name)
        let newTrainer = moveToFirst(userArr[0].trainer, userArr[0].trainer[distance])
        let newTrainerName = moveToFirst(userArr[0].trainerName, name)
        await ctx.database.set('pokebattle', { id: session.userId }, {
          trainer: userArr[0].trainer,
          trainerName: userArr[0].trainerName
        })
        return `${h('at', { id: (session.userId) })}成功更换了训练师${h.image(pathToFileURL(resolve(__dirname, './assets/img/trainer', newTrainer[0] + '.png')).href)}`
      }

    })


  ctx.command('宝可梦').subcommand('盲盒', '开启盲盒，抽取训练师')
    .usage(`/盲盒`)
    .action(async ({ session }) => {
      const userArr = await ctx.database.get('pokebattle', { id: session.userId })
      if (userArr.length == 0) {
        try {
          await session.execute(`签到`)
          return
        } catch (e) { return `${h('at', { id: (session.userId) })}请先输入 签到 领取属于你的宝可梦和精灵球` }
      }
      if (userArr[0].trainerNum < 1) return `${h('at', { id: (session.userId) })}你的盲盒不足，无法开启`
      if (userArr[0].trainer.length > 111) return `你已经获得了全部训练师`
      let getTrainer = String(pokemonCal.mathRandomInt(0, 112))
      while (userArr[0].trainer.includes(getTrainer)) {
        getTrainer = String(pokemonCal.mathRandomInt(0, 112))
      }
      userArr[0].trainer.push(getTrainer)
      const trainerImg = h.image(pathToFileURL(resolve(__dirname, './assets/img/trainer', getTrainer + '.png')).href)
      try {
        await session.bot.internal.sendMessage(session.guildId, {
          content: "111",
          msg_type: 2,
          markdown: {
            custom_template_id: config.MDid,
            params: [
              {
                key: config.key1,
                values: [`<@${session.userId}>开启了盲盒`]
              },
              {
                key: config.key2,
                values: ["[img#128px #128px]"]
              },
              {
                key: config.key3,
                values: [await toUrl(ctx, session, pathToFileURL(resolve(__dirname, './assets/img/trainer', getTrainer + '.png')).href)]
              },
              {
                key: config.key4,
                values: [`恭喜你获得了新训练师`]
              },
            ]
          },
          keyboard: {
            content: {
              "rows": [
                { "buttons": [button(0, '点击输入新训练师名字', "", session.userId, "1", false)] },
              ]
            },
          },
          msg_id: session.messageId,
          timestamp: session.timestamp,
          msg_seq: Math.floor(Math.random() * 1000000),
        })
      } catch (e) {
        await session.send(`${trainerImg}
恭喜你获得了训练师
请输入新训练师的名字:________`)
      }
      const trainerName = await session.prompt(60000)
      if (!trainerName) {
        let randomName = getRandomName(3)
        let numr = userArr[0].trainerName.push(randomName)
        await ctx.database.set('pokebattle', { id: session.userId }, {
          trainerNum: { $subtract: [{ $: 'trainerNum' }, 1] },
          trainer: userArr[0].trainer,
          trainerName: userArr[0].trainerName,
        })
        return `你好像没有输入名字，训练师已经自动命名为【${randomName}】
输入【更换训练师】可以更换你的训练师`
      }
      userArr[0].trainerName.push(trainerName)
      await ctx.database.set('pokebattle', { id: session.userId }, {
        trainerNum: { $subtract: [{ $: 'trainerNum' }, 1] },
        trainer: userArr[0].trainer,
        trainerName: userArr[0].trainerName,
      })
      return `你的训练师已经命名为【${trainerName}】
输入【更换训练师】可以更换你的训练师`
    })


  ctx.command('宝可梦').subcommand('购买 <item:string> [num:number]', '购买物品，或查看商店')
    .usage(`/购买 <物品名称> [数量]|<空>`)
    .example('购买 精灵球 10')
    .action(async ({ session }, item, num) => {
      const { platform } = session
      const userArr: Array<Pokebattle> = await ctx.database.get('pokebattle', { id: session.userId })
      const vip = isVip(userArr[0])
      const vipReward = vip ? 0.6 : 1

      if (userArr.length == 0) {
        try {
          await session.execute(`签到`)
          return
        } catch (e) {
          return `${h('at', { id: (session.userId) })}请先输入 签到 领取属于你的宝可梦和精灵球`
        }
      }
      if (!num) num = 1
      num = Math.floor(num)
      if (num < 1) return `宝可梦的世界不支持赊账`
      let reply = ''
      if (!item) {
        shop.forEach(item => {
          reply += `${item.name} 价格：${Math.floor(item.price * vipReward)}\r`
        })
        if (platform == 'qq' && config.QQ官方使用MD) {
          let MDreply: string = ''
          shop.forEach(item => {
            MDreply += `[${item.name}]\t(mqqapi://aio/inlinecmd?command=${encodeURIComponent(`/购买 ${item.name}`)}&reply=false&enter=true) 价格：${Math.floor(item.price * vipReward)}\r`
          })
          try {
            await session.bot.internal.sendMessage(session.channelId, {
              content: "111",
              msg_type: 2,
              markdown: {
                custom_template_id: config.MDid,
                params: [
                  {
                    key: config.key1,
                    values: [`<@${session.userId}>来到了商店`]
                  },
                  {
                    key: config.key2,
                    values: ["[img#128px #128px]"]
                  },
                  {
                    key: config.key3,
                    values: [await toUrl(ctx, session, `file://${resolve(__dirname, `assets/img/trainer/${userArr[0].trainer[0]}.png`)}`)]
                  },
                  {
                    key: config.key4,
                    values: [`商店物品：\r${MDreply}输入【购买 物品名称 数量】来购买物品，或者点击道具名字购买一个\r你当前金币：${userArr[0].gold}`]
                  },
                ]
              },
              keyboard: {

                content: {
                  "rows": [
                    { "buttons": [button(2, '购买', "/购买", session.userId, "1", false)] },
                  ]
                },
              },
              msg_id: session.messageId,
              timestamp: session.timestamp,
              msg_seq: Math.floor(Math.random() * 1000000),
            })
          } catch (e) {
            return `网络繁忙，再试一次`
          }
          return
        }
        return `商店物品：\r${reply}输入【/购买 物品名称 数量】来购买物品，数量不写默认为1\r你当前金币：${userArr[0].gold}`
      }
      const matchedItem = findItem(item)
      if (matchedItem.length == 0) return `没有这个物品哦`
      if (userArr[0].gold < Math.floor(matchedItem[0].price * num * vipReward)) return `你的金币不足`
      if (matchedItem.length > 1) {
        const item = matchedItem.map(item => `${item.name} 价格：${Math.floor(item.price * vipReward)}`).join('\n')
        return `找到多个物品，请输入完整名称\n${item}`
      } else {
        let tips = ''
        switch (matchedItem[0].name) {
          case '人物盲盒':
            tips = `输入【盲盒】来开启盲盒`;
            break;
          case '扭蛋代币':
            tips = `输入【技能扭蛋机】来抽取技能`;
            break;
          case '精灵球':
            tips = `输入【捕捉宝可梦】来捕捉宝可梦`;
            break;
          case '改名卡':
            tips = `输入【改名】改名`;
            break;
        }
        await ctx.database.set('pokebattle', { id: session.userId }, {
          gold: { $subtract: [{ $: 'gold' }, Math.floor(matchedItem[0].price * num * vipReward)] },
          [matchedItem[0].id]: { $add: [{ $: matchedItem[0].id }, num] }
        })
        return `${h('at', { id: (session.userId) })}\u200b
购买成功
====================
${matchedItem[0].name}+${num}
====================
tips:${tips}`
      }
    })


  ctx.command('宝可梦').subcommand('改名 [name:text]', '改名，请输入2-6位中文')
    .action(async ({ session }, name: string) => {
      const userArr = await ctx.database.get('pokebattle', { id: session.userId })
      if (userArr[0].changeName < 1) return `你的改名次数已经用完`
      let regex = /^[\u4e00-\u9fa5]{2,6}$/
      if (!regex.test(name)) {
        do {
          await session.send(`请回复2-6位中文`)
          await session.bot.internal.sendMessage(session.channelId, {
            content: "111",
            msg_type: 2,
            keyboard: {
              content: {
                "rows": [
                  { "buttons": [button(0, '点击输入新名字', "", session.userId, "1", false)] },
                ]
              },
            },
            msg_id: session.messageId,
            timestamp: session.timestamp,
            msg_seq: Math.floor(Math.random() * 1000000),
          })
          const entry = await session.prompt(60000)
          name = entry
        }
        while (!regex.test(name))
      }
      if (userArr.length == 0) {
        try {
          await session.execute(`签到`)
          return
        } catch (e) { return `${h('at', { id: (session.userId) })}请先输入 签到 领取属于你的宝可梦和精灵球` }
      }
      await ctx.database.set('pokebattle', { id: session.userId }, {
        name: name,
        changeName: { $subtract: [{ $: 'changeName' }, 1] }
      })
      return `你的名字已经改为【${name}】`
    })

  ctx.command('宝可梦').subcommand('训练师改名', '改动训练师名字').action(async ({ session }) => {
    const userArr = await ctx.database.get('pokebattle', { id: session.userId })
    if (userArr.length == 0) {
      try {
        await session.execute(`签到`)
        return
      } catch (e) { return `${h('at', { id: (session.userId) })}请先输入 签到 领取属于你的宝可梦和精灵球` }
    }
    const vip = isVip(userArr[0])
    if (!vip) return `你不是VIP，无法使用此功能`
    await session.send(`输入当前训练师的新名字`)
    try {
      await session.bot.internal.sendMessage(session.channelId, {
        content: "111",
        msg_type: 2,
        keyboard: {
          content: {
            "rows": [
              { "buttons": [button(0, '点击输入新名字', "", session.userId, "1", false)] },
            ]
          },
        },
        msg_id: session.messageId,
        timestamp: session.timestamp,
        msg_seq: Math.floor(Math.random() * 1000000),
      })
    } catch {
      await session.send(`请向机器人回复你想要的训练师名字`)
    }
    const newName = await session.prompt(60000)
    userArr[0].trainerName[0] = newName
    await ctx.database.set('pokebattle', { id: session.userId }, {
      trainerName: userArr[0].trainerName
    })
    return `你的训练师名字已经改为${newName}`
  })
}
export { Pokebattle }

