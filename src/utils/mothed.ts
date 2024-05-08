import { resolve } from 'path'
import { Pokebattle, logger, config, shop, testcanvas, Config } from '..'
import { type, battleType } from './data'
import { Context, Session ,Element} from 'koishi'
import { WildPokemon } from '../battle'
import { } from 'koishi-plugin-cron'
import { FusionPokemon, Natures, PokemonList } from '../model'
import { DigMine, StoneType } from '../digGame/type'


export function mudPath(a:string){
  return `${testcanvas}${resolve(__dirname, `../assets/img/digGame/${StoneType[a]}.png`)}`

}

export interface PokemonBase{
  id: string,
  name: string,
  hp: number,
  att:number,
  def: number,
  spa: number,
  spd: number,
  spe: number,
}

export function calculateDistance(x1, y1, x2, y2) {
  let dx = x2 - x1
  let dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}

export async function minePic(ctx,digGame:DigMine,sign?:{x:number,y:number,color:string}){
  const digGamePositionX=digGame.item.x
  const digGamePositionY=digGame.item.y
  const mineBack=await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, `../assets/img/digGame/miningbg.png`)}`)
  const fissureMud=await ctx.canvas.loadImage(mudPath('fissureMud'))
  const mud=await ctx.canvas.loadImage(mudPath('mud'))
  const fissureStone=await ctx.canvas.loadImage(mudPath('fissureStone'))
  const stone=await ctx.canvas.loadImage(mudPath('stone'))
  const hardStone=await ctx.canvas.loadImage(mudPath('hardStone'))
  const largeStone=await ctx.canvas.loadImage(mudPath('largeStone'))
  const empty=await ctx.canvas.loadImage(mudPath('empty'))
  const hs=await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, `../assets/img/digGame/${digGame.item.id}.png`)}`)
  const stoneList={fissureMud,mud,fissureStone,stone,hardStone,largeStone,empty}
  const dataUrl=ctx.canvas.render(550,384,async (ctx)=>{
    ctx.drawImage(mineBack,0,0,550,384)
    for (let i = 0; i < 13; i++) {
        for (let j = 0; j < 10; j++) {
            ctx.drawImage(stoneList[StoneType[digGame.grid[i][j]]],i*32+39,j*32+64,32,32)
            if(digGamePositionX==i&&digGamePositionY==j&&digGame.grid[i][j]==0){
               ctx.drawImage(hs,i*32+39,j*32+64,32,32)
             }
              if(!sign) continue 
              if(sign.x==i&&sign.y==j){
                ctx.strokeStyle=sign.color
                ctx.lineWidth = 2
                ctx.strokeRect(i*32+40,j*32+65,30,30)
              }
        }
    }
})
return dataUrl
}

export function getMinePosition(a:string){
  const [letters]=a.match(/[a-zA-Z]/g)
  let position=[0,0]
  const [numbers]=a.match(/\d+/g)
  position[1]=Number(numbers)-1
  let ascii = letters.charCodeAt(0);
  if (ascii >= 97) {
    position[0]= ascii - 97
  } else {
    position[0]= ascii - 65
  }
  return position
}

export async function isResourceLimit(userId: string, ctx: Context) {
  const resources = await ctx.database.get('pokemon.resourceLimit', { id: userId })
  if (resources.length == 0) {
    return await ctx.database.create('pokemon.resourceLimit', { id: userId })
  } else {
    return resources[0]
  }
}
export async function getList(userId: string, ctx: Context,first?:string) {
  const resources = await ctx.database.get('pokemon.list', { id: userId })
  const index=resources[0]?.pokemon.findIndex((pokeId)=>pokeId.id===first)
  if (resources.length == 0) {
    return await ctx.database.create('pokemon.list', { id: userId, pokemon: [new FusionPokemon(first)] })
  } else {
    if(index==-1){
      resources[0].pokemon.push(new FusionPokemon(first))
      await ctx.database.set('pokemon.list', { id: userId }, row=>({
        pokemon: resources[0].pokemon
      }))
    }
    return resources[0]
  }
}

export async function findFusion(nature:FusionPokemon,playerList:PokemonList){
  let index=playerList?.pokemon.findIndex(a=>a.id==nature.id)
  if(index==-1){
    playerList.pokemon.push(nature)
    index=playerList.pokemon.length-1
  }else{
    playerList.pokemon[index]=nature
  }
  return index
}

export async function getPic(ctx, log, user, tar,full=false) {
  try {
    let att: Pokebattle, def: Pokebattle
    try{if (Number(user.power[5]) > Number(tar.power[5])) { att = user; def = tar } else { att = tar; def = user }}catch{
      att = user
      def = user
    }
    const attPerson = await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, `../assets/img/trainer/${att.trainer[0]}.png`)}`)
    const defPerson = await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, `../assets/img/trainer/${def.trainer[0]}.png`)}`)
    const attPokemon = await ctx.canvas.loadImage(`${config.图片源}/fusion/${att.monster_1.split('.')[0]}/${att.monster_1}.png`)
    const defPokemon = await ctx.canvas.loadImage(`${config.图片源}/fusion/${def.monster_1.split('.')[0]}/${def.monster_1}.png`)
    const backimage1 = await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, `../assets/img/components/battle_1.png`)}`)
    const backimage2 = await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, `../assets/img/components/battle_2.png`)}`)
    const backimage3 = await ctx.canvas.loadImage(`${testcanvas}${resolve(__dirname, `../assets/img/components/battle_3.png`)}`)
    let array = log.split('\n')
    let attCount: number
    let defCount: number
    if (array.length % 2 == 0) { attCount = array.length / 2; defCount = array.length / 2 - 1 } else { attCount = Math.floor(array.length / 2); defCount = Math.floor(array.length / 2) }
    const height =full&&array.length>=7?400+60*(array.length-1):750
    const dataUrl=await ctx.canvas.render(712, height, async (ctx) => {
      ctx.drawImage(backimage2, 0, 0, 712,height)
      ctx.drawImage(backimage1, 0, 0, 712, 560)
      ctx.drawImage(backimage3, 0, height-110, 712, 110)
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
      ctx.fillText(array[array.length - 1], 356, height-28)
      ctx.fillStyle = 'black'
      for (let i = 0; i < array.length - 1; i++) {
        ctx.fillText(`⚔️${array[i]}⚔️`, 356, 300 + 60 * (i))
        if (i > 4&&!full) { break }
      }
    })
    const {src} =dataUrl.attrs
    return src
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
              button(2, "📷捕捉", "/捕捉宝可梦", session.userId, "7"),
              button(2, "VIP", '/vip查询', session.userId, "VIP"),
            ]
          },
          {
            "buttons": [
              button(2, "💻接收", "/接收", session.userId, "p", false),
              button(2, "🔍查询技能", "/查询技能", session.userId, "3"),
              urlbutton(2, "反馈", "http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=CEqeK9q1yilezUrsSX9L3kO0hK5Wpi_7&authKey=SBuSSQtld6nFctvq9d4Xm1lW%2B0C3QuFZ6FLhCJk8ELCbtOqiR4drHcrbfRLVmcvz&noverify=0&group_code=836655539", session.userId, "10"),
            ]
          },
          {
            "buttons": [
              button(2, "❤ 领取麦麦", "/领取麦麦 ", session.userId, "l", false),
              button(2, "🎣 钓鱼", "/钓鱼", session.userId, "d"),
            ]
          },
          {
            "buttons": [
              button(2, "化石挖掘", "/挖掘 ", session.userId, "w"),
              button(2, "宝可猜名", "/wordlegame.开始 ", session.userId, "q"),
            ]
          },
          config.是否开启友链 ? { "buttons": [button(2, '📖 图鉴', '/查看图鉴', session.userId, 'cmd'),urlbutton(2, "邀请", config.bot邀请链接, session.userId, "11"), button(2, "🔗友链", "/friendlink", session.userId, "13"), button(2, userArr[0]?.lapTwo ? "收集进度" : "进入二周目", userArr[0]?.lapTwo ? "/ultra" : "/laptwo", session.userId, "14")] } : { "buttons": [button(2, '📖 图鉴', '/查看图鉴', session.userId, 'cmd'),urlbutton(2, "邀请", config.bot邀请链接, session.userId, "11"),button(2, userArr[0]?.lapTwo ? "收集进度" : "进入二周目", userArr[0]?.lapTwo ? "/ultra" : "/laptwo", session.userId, "14")] },
        ]
      },
    },
  }
}


export async function sendMarkdown(a: string, session: Session, button = null) {
  const b = getMarkdownParams(a)
 return await session.bot.internal.sendMessage(session.guildId, Object.assign({
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
  // try {
  //   let a = await session.bot.internal.sendFileGuild(session.channelId, {
  //     file_type: 1,
  //     file_data: Buffer.from((await ctx.http.file(img)).data).toString('base64'),
  //     srv_send_msg: false
  //   })
  //   const url = `http://multimedia.nt.qq.com/download?appid=1407&fileid=${a.file_uuid.replace(/_/g, "%5F")}&rkey=CAQSKAB6JWENi5LMtWVWVxS2RfZbDwvOdlkneNX9iQFbjGK7q7lbRPyD1v0&spec=0`
  //   return url
  // } catch (e) {
    if (ctx.get('server.temp')?.upload) {
      const url = await ctx.get('server.temp').upload(img)
      return url.replace(/_/g, "%5F")
    }
    const { url } = await ctx.get('server.temp').create(img)
    return url
  // }
}
export function typeEffect(a: string, b: string, skillType: string) {
  const [a1, a2] = getType(a)
  const [b1, b2] = getType(b)
  const effect = battleType.data[skillType][b1] * battleType.data[skillType][b2] * ([a1, a2].includes(skillType) ? 1.5 : 1)
  return effect

}

export async function censorText(ctx,text: string) {
  const a:Element[]=[Element('text',{content:text})]
  const [b]=await ctx.censor.transform(a)
  return b.attrs.content
}

export function baseFusion(a:number,b:number,){
  let max = Math.max(a, b)
  let min = Math.min(a, b)
  let c=Math.abs(max - min) / (max+min)<=0.12?0.3:0.1
  if((max - min) / max >=0.25) c=0
  if(max==min){c=0.2}
  max *= 0.8
  min *= 0.2
  return Math.floor((max+min)*(1+c))
}
// export function baseFusion(a:PokemonBase,b:PokemonBase,){
//   return  [
//     String(Math.floor(a.hp*2/3+b.hp*1/3)),
//     String(Math.floor(b.att*2/3+a.att*1/3)),
//     String(Math.floor(b.def*2/3+a.def*1/3)),
//     String(Math.floor(a.spa*2/3+b.spa*1/3)),
//     String(Math.floor(a.spd*2/3+b.spd*1/3)),
//     String(Math.floor(b.spe*2/3+a.spe*1/3))
//   ]

// }
  // let max = Math.max(a, b)
  // let min = Math.min(a, b)
  // let c=Math.abs(max - min) / (max+min)<=0.12?0.3:0.1
  // if((max - min) / max >=0.25) c=0
  // if(max==min){c=0.2}
  // max *= 0.8
  // min *= 0.2
  // return Math.floor((max+min)*(1+c))


function arraysEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < b.length; i++) {
    if (!a.includes(b[i])) return false;
  }
  return true;
}

export async function getChance(player:Pokebattle,ctx:Context){
  const banID = ['150.150', '151.151', '144.144', '145.145', '146.146', '249.249', '250.250', '251.251', '243.243', '244.244', '245.245']
  const keys=Object.keys(player?.ultra)
  const [battle]= await ctx.database.get('pokemon.resourceLimit', { id: player.id })
  if(player.lap!==3&&!player.advanceChance&&player.level>99&&arraysEqual(banID, keys)&&battle?.rank>0&&battle?.rank<=10) return true
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
      },
      {
        "buttons": [
          {
            "id": "4",
            "render_data": {
              "label": "随意一丢（放弃捕捉）",
              "visited_label": "真的很随意"
            },
            "action": {
              "type": 2,
              "permission": {
                "type": 0,
                "specify_user_ids": [d]
              },
              "click_limit": 10,
              "unsupport_tips": "",
              "data": "若无其事的一丢",
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
export function actionbutton(a: string, 数据: string, 权限: string,消息Id: string, 时间戳: number) {
  return {
    "id":消息Id,
    "render_data": {
      "label": a,
      "visited_label": a
    },
    "action": {
      "type": 1,
      "permission": {
        "type": 0,
        "specify_user_ids": [权限]
      },
      "unsupport_tips": "请输入@Bot",
      "data":`${时间戳}=${数据}`,
    },
  }
}