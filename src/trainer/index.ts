import { $, Context, h } from "koishi";
import {Pokebattle, config} from '../index'
import { trainer_list } from "../utils/data";
import { Trainer } from "./type";
import { button, censorText, sendMarkdown, toUrl, urlbutton } from "../utils/mothed";
export async function apply(ctx:Context) {
    ctx.command('宝可梦').subcommand('盲盒','开启盲盒抽取训练师').action(async ({session})=>{
        const [player]:Pokebattle[] = await ctx.database.get('pokebattle', { id: session.userId })
        let randomTrainer:Trainer
        if (!player) {
        try {
          await session.execute(`签到`)
          return
        } catch (e) {
             return `请先输入 签到 领取属于你的宝可梦和精灵球` }
      }
      if(player.trainerNum<1){
        return `你的盲盒不足，无法开启`
      }
      if(player.trainer_list.length>=trainer_list.length){
        return `你已经获得所有训练家`
      }
      do{
        randomTrainer={...trainer_list[Math.floor(Math.random()*trainer_list.length)]}
      }while(player.trainer_list.some(trainer=>trainer.tid===randomTrainer.tid))
        const md =`恭喜<@${session.userId}>获得了训练家${randomTrainer.name}！
![img#80px #80px](${await toUrl(ctx, session, `${config.图片源}/trainers/${randomTrainer.source_name}.png`)})
---
是否改名？`
    const kb={
        keyboard: {
            content: {
              "rows": [
                { "buttons": [button(0, '点击输入新训练师名字', "", session.userId, "1", false)] },
                { "buttons": [button(0, '不改名', randomTrainer.source_name, session.userId, "1", true)] },
              ]
            },
          },
    }
    await sendMarkdown(md,session,kb)
    let newName=await session.prompt(30000)
    if(!newName) newName=randomTrainer.source_name
    randomTrainer.name=newName
    player.trainer_list.push(randomTrainer)
    await ctx.database.set('pokebattle', { id: session.userId }, row=>({
        trainerNum:$.sub(row.trainerNum,1),
        trainer_list:player.trainer_list
    }))
    const md2 =`<@${session.userId}>成功收集训练家${randomTrainer.name}！

---
![img#20px #20px](${await toUrl(ctx, session, `${config.图片源}/trainers/${randomTrainer.source_name}.png`)}) 已完成收集

- [点击更换](mqqapi://aio/inlinecmd?command=${encodeURIComponent(`/更换训练师 ${randomTrainer.name}`)}&reply=false&enter=true)
- [继续开启盲盒](mqqapi://aio/inlinecmd?command=${encodeURIComponent(`/盲盒`)}&reply=false&enter=true)`
    try{await sendMarkdown(md2,session)}catch{
      const md3=`<@${session.userId}>成功收集训练家${randomTrainer.source_name}！

---
> 当前名字中含有违禁词

![img#20px #20px](${await toUrl(ctx, session, `${config.图片源}/trainers/${randomTrainer.source_name}.png`)}) 已完成收集
      
- [点击更换](mqqapi://aio/inlinecmd?command=${encodeURIComponent(`/更换训练师 -t ${randomTrainer.tid}`)}&reply=false&enter=true)
- [继续开启盲盒](mqqapi://aio/inlinecmd?command=${encodeURIComponent(`/盲盒`)}&reply=false&enter=true)`
      await sendMarkdown(md3,session)
    }
    })


    ctx.command('宝可梦').subcommand('训练师改名 <tid:number> [newName:text]','给你的训练师改名').action(async ({session},tid:number,newName:string)=>{
        const [player]:Pokebattle[] = await ctx.database.get('pokebattle', { id: session.userId })
        if (!player) {
        try {
          await session.execute(`签到`)
          return
        } catch (e) {
             return `请先输入 签到 领取属于你的宝可梦和精灵球` }
      }
      if(!tid){
        const md=`<@${session.userId}>请输入正确的训练师编号`
        await sendMarkdown(md,session)
        await session.execute(`/更换训练师`)
        return
      }
      if(player.vip<1){
        const md=`<@${session.userId}>你不是VIP，无法使用该功能`
        const kb ={
            keyboard: {
                content: {
                  "rows": [
                    { "buttons": [urlbutton(2, '开通VIP',config.aifadian, session.userId, "1")] },
                  ]
                },
              },
        }
        await sendMarkdown(md,session,kb)
        return
      }
      const isTrainer=player.trainer_list.find(trainers=>trainers.tid==tid)
      if(!isTrainer){
        const md=`<@${session.userId}>没有找到该训练师`
        await sendMarkdown(md,session)
        await session.execute(`/更换训练师`)
        return
      }
      if(!newName){
        const md=`<@${session.userId}>请输入正确的训练师名字`
        await sendMarkdown(md,session)
        await session.execute(`/更换训练师 -t ${Math.floor(tid/10)}`)
        return
      }
      const md=`<@${session.userId}>成功更改
---
${isTrainer.name}➣${newName}`
      const faileChange=`<@${session.userId}>更改失败

> 当前名字中含有违禁词`
      try{
        await sendMarkdown(md,session)
        await ctx.database.set('pokebattle',{id:session.userId},row=>({
          trainer_list:player.trainer_list.map(trainers=>trainers.tid==tid?{...trainers,name:newName}:trainers)
        }))
      }catch{
        await sendMarkdown(faileChange,session)
      }
    })

    ctx.command('宝可梦').subcommand('更换训练师 [trainer:text]','更换你的训练师形象')
    .option('page', '-p [pages]', { fallback: 1 })
    .option('tid', '-t [tid]')
    .shortcut(/更换训练师\+(.*)$/,{args:['$1']})
    .action(async ({session,options},trainer:string,test)=>{
        trainer=trainer?trainer.split('+')[0]:trainer
        const [player]:Pokebattle[] = await ctx.database.get('pokebattle', { id: session.userId })
        if (!player) {
        try {
          await session.execute(`签到`)
          return
        } catch (e) {
             return `请先输入 签到 领取属于你的宝可梦和精灵球` }
      }
      const trainerList=player.trainer_list.sort((a,b)=>a.tid-b.tid)
      if(!trainer&&!options.tid){
        const page=Number(options.page)-1
        if(page<0) return `已经再第一页了，无法翻页`
        if(page*10>trainerList.length) return `页数超出范围`
        const startIndex=page*10
        const endIndex=Math.min((page+1)*10,trainerList.length)
        let listContent=`训练师列表 (${options.page}/${Math.ceil(trainerList.length/10)}) ：
---`
        for (let index = startIndex; index < endIndex; index++) {
            const element = trainerList[index]
            listContent+=`\n> ${element.tid} ![img#50px #50px](${await toUrl(ctx, session, `${config.图片源}/trainers/${element.source_name}.png`)}) ${element.name}`
        }
        const md=listContent+`

---
点击按钮后输入名称更换训练师`
        const kb={
            keyboard: {
                content: {
                  "rows": [
                    { "buttons": [button(0, '输入替换的训练师名字', "更换训练师 ", session.userId, "1", false)] },
                    { "buttons": [button(0, '输入替换的训练师编号', "/更换训练师 -t ", session.userId, "x", false)] },
                    { "buttons": [button(0, '←上一页', `/更换训练师 -p ${page}`, session.userId, "l"),button(0, '→下一页', `/更换训练师 -p ${page+2}`, session.userId, "r")] },
                  ].concat(player.vip>0?[{ "buttons": [button(0, '输入改名的训练师 编号 新名字', "/训练师改名 ", session.userId, "n", false)] },]:[])
                },
              },
        }
        try{
          await sendMarkdown(md,session,kb)}catch(e){
            listContent=`训练师列表 (${options.page}/${Math.ceil(trainerList.length/10)}) ：
---`
                    for (let index = startIndex; index < endIndex; index++) {
                        const element = trainerList[index]
                        listContent+=`\n> ${element.tid} ![img#50px #50px](${await toUrl(ctx, session, `${config.图片源}/trainers/${element.source_name}.png`)}) ${element.source_name}`
                    }
                    const md=listContent+`
            
---
> 当前自定义名字存在违禁词，已重置为默认名字

点击按钮后输入名称更换训练师`
                    await sendMarkdown(md,session,kb)
        }
        return
      }
      const isTrainer=options.tid?trainerList.find(trainers=>trainers.tid==Number(options.tid)):trainerList.find(trainers=>trainers.name==trainer)
      if(!isTrainer){
        const md=`<@${session.userId}>更换失败
---
{{{(>_<)}}}你还未拥有该训练师`
        const kb={
            keyboard: {
                content: {
                  "rows": [
                    { "buttons": [button(0, '购买盲盒', "/购买 盲盒", session.userId, "1", false)] },
                    { "buttons": [button(0, '重新更换', "/更换训练师 ", session.userId, "1", false)] },
                  ]
                },
              },
        }
        await sendMarkdown(md,session,kb)
        return
      }
      await ctx.database.set('pokebattle',{id:session.userId},row=>({
        trainerIndex:isTrainer.tid
      }))
      const md2 =`<@${session.userId}>成功替换训练家${isTrainer.name}！

---
![img#500px #500px](${await toUrl(ctx, session, `${config.图片源}/trainers/${isTrainer.source_name}.png`)})`
      const kb={keyboard: {
        content: {
          "rows": [
            { "buttons": [button(0, "盲盒", "/盲盒", session.userId, "6"), button(0, "更换训练师", "/更换训练师", session.userId, "2")] },
            { "buttons": [button(0, "💳 查看信息", "/查看信息", session.userId, "3"), button(0, "⚔️ 对战", "/对战", session.userId, "4")] },
          ]
        },
      },}
      await sendMarkdown(md2,session,kb)
    })
}