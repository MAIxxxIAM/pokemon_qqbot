import { resolve } from 'path'
import { Pokebattle, logger, config, shop, testcanvas, Config } from '..'
import { type, battleType } from './data'
import { Context, Session } from 'koishi'
import { WildPokemon } from '../battle'


export async function isResourceLimit(userId: string, ctx: Context) {
  const resources = await ctx.database.get('pokemon.resourceLimit', { id: userId })
  if (resources.length == 0) {
    return await ctx.database.create('pokemon.resourceLimit', { id: userId })
  } else {
    return resources[0]
  }
}

export async function getPic(ctx, log, user, tar) {
  try {
    let att: Pokebattle, def: Pokebattle
    if (Number(user.power[5]) > Number(tar.power[5])) { att = user; def = tar } else { att = tar; def = user }
    const attPerson = await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, `../assets/img/trainer/${att.trainer[0]}.png`)}`)
    const defPerson = await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, `../assets/img/trainer/${def.trainer[0]}.png`)}`)
    const attPokemon = await ctx.canvas.loadImage(`${config.图片源}/fusion/${att.monster_1.split('.')[0]}/${att.monster_1}.png`)
    const defPokemon = await ctx.canvas.loadImage(`${config.图片源}/fusion/${def.monster_1.split('.')[0]}/${def.monster_1}.png`)
    const backimage = await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, `../assets/img/components/battle.png`)}`)
    let array = log.split('\n')
    let attCount: number
    let defCount: number
    if (array.length % 2 == 0) { attCount = array.length / 2; defCount = array.length / 2 - 1 } else { attCount = Math.floor(array.length / 2); defCount = Math.floor(array.length / 2) }
    let dataUrl: any
    await ctx.canvas.render(712, 750, async (ctx) => {
      ctx.drawImage(backimage, 0, 0, 712, 750)
      ctx.save()
      ctx.translate(712 / 2, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(attPerson, 202, 24, 130, 130)
      ctx.drawImage(attPokemon, 141, 83, 130, 130)
      ctx.restore()
      ctx.drawImage(defPerson, 558, 24, 130, 130)
      ctx.drawImage(defPokemon, 488, 83, 130, 130)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = 'normal 24px zpix'
      ctx.fillStyle = 'white'
      ctx.fillText(array[array.length - 1], 356, 722)
      ctx.fillStyle = 'black'
      for (let i = 0; i < array.length - 1; i++) {
        ctx.fillText(`⚔️${array[i]}⚔️`, 356, 300 + 60 * (i))
        if (i > 4) { break }
      }
      dataUrl = await ctx.canvas.toDataURL('image/jpeg')
    })
    return dataUrl
  } catch (e) {
    logger.info(e)
    return `渲染失败`
  }
}

export async function sendMsg(session) {
  return await session.bot.internal.sendMessage(session.channelId, {
    content: "111",
    msg_type: 0,
    msg_id: '0',
  })
}

export function getMarkdownParams(markdown: string) {
  markdown = markdown.replace(/[\n\r]/g, '\\r')
  markdown = markdown.replace(/"/g, '\\"')
  try {
    markdown = JSON.parse(`"${markdown}"`)
  } catch (error) {
    return '解析失败'
  }
  markdown = markdown.replace(/\n/g, '\r')
  markdown = markdown.replace(/^# /g, '#§ ')
  markdown = markdown.replace(/^> /g, '>§ ')
  markdown = markdown.replace(/^- /g, '-§ ')
  markdown = markdown.replace(/^(\d)\. /g, '$1§. ')
  markdown = markdown.replace(/(\[.*?\])(\s?\(.*?\))/g, '$1§$2')
  markdown = markdown.replace(/(\[.*?\])(\s?\[.*?\])/g, '$1§$2')
  markdown = markdown.replace(/(<[^@].*?)>/g, '$1§>')
  markdown = markdown.replace(/```/g, '`§``')
  markdown = markdown.replace(/---/g, '-§--')
  markdown = markdown.replace(/_([^§]+?)(?=_)/g, '_$1§')
  markdown = markdown.replace(/\*([^§]+?)(?=\*)/g, '*$1§')
  markdown = markdown.replace(/`([^§]+?)(?=`)/g, '`$1§')
  const params = markdown.split('§')
  return Array(100).fill(null).map((_, index) => ({ key: `text${index + 1}`, values: [params[index] ?? ' '] }))
}

export async function getWildPic(ctx, log: string, user: Pokebattle, tar: string) {
  try {
    let player: Pokebattle, wild: string
    player = user
    wild = tar.split('.')[0]
    const attPerson = await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, `../assets/img/trainer/${player.trainer[0]}.png`)}`)
    const attPokemon = await ctx.canvas.loadImage(`${config.图片源}/fusion/${player.monster_1.split('.')[0]}/${player.monster_1}.png`)
    const defPokemon = await ctx.canvas.loadImage(`${config.图片源}/fusion/${wild}/${wild}.png`)
    const backimage = await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, `../assets/img/components/battle.png`)}`)
    let array = log.split('\n')
    let attCount: number
    let defCount: number
    if (array.length % 2 == 0) { attCount = array.length / 2; defCount = array.length / 2 - 1 } else { attCount = Math.floor(array.length / 2); defCount = Math.floor(array.length / 2) }
    let dataUrl: any
    await ctx.canvas.render(712, 750, async (ctx) => {
      ctx.drawImage(backimage, 0, 0, 712, 750)
      ctx.save()
      ctx.translate(712 / 2, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(attPerson, 202, 24, 130, 130)
      ctx.drawImage(attPokemon, 141, 83, 130, 130)
      ctx.restore()
      ctx.drawImage(defPokemon, 488, 83, 130, 130)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = 'normal 24px zpix'
      ctx.fillStyle = 'white'
      ctx.fillText(array[array.length - 1], 356, 722)
      ctx.fillStyle = 'black'
      for (let i = 0; i < array.length - 1; i++) {
        ctx.fillText(`⚔️${array[i]}⚔️`, 356, 300 + 60 * (i))
        if (i > 4) { break }
      }
      dataUrl = await ctx.canvas.toDataURL('image/jpeg')
    })
    return dataUrl
  } catch (e) {
    logger.info(e)
    return `渲染失败`
  }
}
export function findItem(item: string) {
  const matchedKey = shop.filter(key => key.name.includes(item))
  return matchedKey
}
export function getRandomName(length: number) {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}
export function moveToFirst(array: any[], element: any) {
  const index = array.indexOf(element)
  if (index !== -1) {
    array.splice(index, 1)
    array.unshift(element)
  }
  return array
}

export function normalKb(session: Session, userArr: Pokebattle[]){
  return {
    keyboard: {
      content: {
        "rows": [
          {
            "buttons": [
              button(2, "🖊签到", "/签到", session.userId, "1"),
              button(2, "💳查看", "/查看信息", session.userId, "2"),
              button(2, "🔖帮助", "/宝可梦", session.userId, "3"),
              button(2, "🔈公告", "/notice", session.userId, "ntc"),
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
  }
}


export async function sendMarkdown(a: string, session: Session, button = null) {
  const b = getMarkdownParams(a)
  await session.bot.internal.sendMessage(session.guildId, Object.assign({
    content: "111",
    msg_type: 2,
    markdown: {
      custom_template_id: '102072441_1711377105',
      params: b
    },
    msg_id: session.messageId,
    timestamp: session.timestamp,
    msg_seq: Math.floor(Math.random() * 1000000),
  }, button))
}

export async function toUrl(ctx, session, img) {
  // if(ctx.get('server.temp')?.upload){
  //   const url = await ctx.get('server.temp').upload(img)
  //   return url.replace(/_/g, "%5F")
  // }
  // const { url } = await ctx.get('server.temp').create(img)
  // return url
  try {
    let a = await session.bot.internal.sendFileGuild(session.channelId, {
      file_type: 1,
      file_data: Buffer.from((await ctx.http.file(img)).data).toString('base64'),
      srv_send_msg: false
    })
    const url = `http://multimedia.nt.qq.com/download?appid=1407&fileid=${a.file_uuid.replace(/_/g, "%5F")}&rkey=CAQSKAB6JWENi5LMtWVWVxS2RfZbDwvOdlkneNX9iQFbjGK7q7lbRPyD1v0&spec=0`
    return url
  } catch (e) {
    if (ctx.get('server.temp')?.upload) {
      const url = await ctx.get('server.temp').upload(img)
      return url.replace(/_/g, "%5F")
    }
    const { url } = await ctx.get('server.temp').create(img)
    return url
  }
}
export function typeEffect(a: string, b: string, skillType: string) {
  const [a1, a2] = getType(a)
  const [b1, b2] = getType(b)
  const effect = battleType.data[skillType][b1] * battleType.data[skillType][b2] * ([a1, a2].includes(skillType) ? 1.5 : 1)
  return effect

}

export function baseFusion(a:number,b:number,){
  let max = Math.max(a, b)
  let min = Math.min(a, b)
  let c=(1-(Math.abs(max - min+1) / max))/2
  if(max==min){c=0}
  max *= 0.8
  min *= 0.2
  return (max+min)*(1+c)

}

function arraysEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < b.length; i++) {
    if (!a.includes(b[i])) return false;
  }
  return true;
}

export async function getChance(player:Pokebattle,ctx:Context){
  const banID = ['150.150', '151.151', '144.144', '145.145', '146.146', '249.249', '250.250', '251.251', '243.243', '244.244', '245.245']
  const keys=Object.keys(player.ultra)
  const [battle]= await ctx.database.get('pokemon.resourceLimit', { id: player.id })
  const isBattle=battle?.rank>0&&battle?.rankScore<=10
  if(isBattle&&player.lap!==3&&!player.advanceChance&&player.level>99&&arraysEqual(banID, keys)) return true
  if(player.lap==3||player.advanceChance||!player?.pokedex?.dex) return false
  const flatArrayA = [].concat(...player.pokedex.dex)
  const flatArray = [...new Set(flatArrayA)]
  return flatArray.length==251
}

export function isVip(a: Pokebattle): boolean {
  return a?.vip > 0
}

export function getType(a: string) {
  try {
    const pokemon = a.split('.')
    const [p_f, p_m] = pokemon
    const type1 = type[Number(p_f) - 1].type.split(':')[0]
    let type2 = type[Number(p_m) - 1].type.split(':')[1]
    type2 == '' ? type2 = type[Number(p_m) - 1].type.split(':')[0] : type2
    if (type1 == type2) { type2 = '' }
    return [type1, type2]
  } catch (e) { return ['', ''] }
}

export function catchbutton(a: string, b: string, c: string, d: string) {
  return {
    "rows": [
      {
        "buttons": [
          {
            "id": "1",
            "render_data": {
              "label": "🕹️捕捉" + a,
              "visited_label": "捕捉成功"
            },
            "action": {
              "type": 2,
              "permission": {
                "type": 0,
                "specify_user_ids": [d]
              },
              "click_limit": 10,
              "unsupport_tips": "请输入@Bot 1",
              "data": "1",
              "enter": true
            },

          }
        ]
      },
      {
        "buttons": [
          {
            "id": "2",
            "render_data": {
              "label": "🕹️捕捉" + b,
              "visited_label": "捕捉成功"
            },
            "action": {
              "type": 2,
              "permission": {
                "type": 0,
                "specify_user_ids": [d]
              },
              "click_limit": 10,
              "unsupport_tips": "请输入@Bot 2",
              "data": "2",
              "enter": true
            }
          }
        ]
      },
      {
        "buttons": [
          {
            "id": "3",
            "render_data": {
              "label": "🕹️捕捉" + c,
              "visited_label": "捕捉成功"
            },
            "action": {
              "type": 2,
              "permission": {
                "type": 0,
                "specify_user_ids": [d]
              },
              "click_limit": 10,
              "unsupport_tips": "请输入@Bot 3",
              "data": "3",
              "enter": true
            }
          }
        ]
      }
    ]
  }
}
export function button(pt: number, a: string, b: string, d: string, c: string, enter = true) {

  return {
    "id": c,
    "render_data": {
      "label": a,
      "visited_label": a
    },
    "action": {
      "type": 2,
      "permission": {
        "type": pt,
        "specify_user_ids": [d]
      },
      "click_limit": 10,
      "unsupport_tips": "请输入@Bot 1",
      "data": b,
      "enter": enter
    },
  }
}
export function urlbutton(pt: number, a: string, b: string, d: string, c: string,) {

  return {
    "id": c,
    "render_data": {
      "label": a,
      "visited_label": a,
      "style": 1
    },
    "action": {
      "type": 0,
      "permission": {
        "type": pt,
        "specify_user_ids": [d]
      },
      "click_limit": 10,
      "unsupport_tips": "请输入@Bot 1",
      "data": b
    },
  }
}
export function actionbutton(a: string, b: string, d: string, c: string, t: string, id: string) {
  return {
    "id": c,
    "render_data": {
      "label": a,
      "visited_label": `${a}-已选`
    },
    "action": {
      "type": 1,
      "permission": {
        "type": 0,
        "specify_user_ids": [d]
      },
      "click_limit": 10,
      "unsupport_tips": "请输入@Bot",
      "data": t + "=" + b + "=" + id,
    },
  }
}