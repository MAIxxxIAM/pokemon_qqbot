import { DigMine, MStats } from "./type";
import { DigChannel, Pokebattle } from "../model";
import { button, calculateDistance, getMinePosition, minePic,  sendMarkdown, toUrl } from "../utils/mothed";
import { $ } from "koishi";
import { Pokedex } from "../pokedex/pokedex";
import pokemonCal from "../utils/pokemon";
import { config } from "..";

export async function apply(ctx: any) {
    ctx.command('宝可梦').subcommand('化石挖掘','挖掘化石相关指令').subcommand('dig [position:text]')
        .alias('挖掘')
        .action(async ({ session }, position: string) => {
            let MdString = ''
            let dataUrl: any
            let stats: MStats
            let point={
                x:0,
                y:0,
                color:'',
            }
            const [player]: Pokebattle[] = await ctx.database.get('pokebattle', session.userId)
            if (!player) {
                await session.execute('签到') 
                return
            }
            const [digGames]: DigChannel[] = await ctx.database.get('pokemon.digChannel', session.channelId)
            if ((digGames?.channelCD.getTime() + 2 * 1000) > new Date().getTime()) {
                return '发掘冷却中'
            }
            const digGame = new DigMine(digGames?.digGames)
            if (!digGames) {
                await ctx.database.create('pokemon.digChannel', {
                    id: session.channelId,
                    digGames: digGame,
                    channelCD: new Date(0),
                })
            }
            if (!position || !digGames) {
                dataUrl = await minePic(ctx, digGame)
            } else {
                const P = getMinePosition(position)
                try{stats = digGame.dig(P[0], P[1],player.tool)}catch(e){return '挖掘失败'}
                const dest=calculateDistance(digGame.item.x,digGame.item.y,P[0],P[1])
                point.color =player.tool === 1 ?(dest >= 8 ? 'red' : dest <= 4 ? 'green' : 'yellow'):'blue'
                point.x = P[0]
                point.y = P[1]
                if (!stats.isCanDig) {
                    MdString = '该区域无法挖掘,或工具不适配'

                } else if (stats.isFindItem) {
                    MdString = `你挖到了${digGame.item.name}`
                } else {
                    MdString = '挖掘成功'
                }

                dataUrl = await minePic(ctx, digGame,point)
            }
            const { src } = dataUrl.attrs
            stats?.isFindItem ? await ctx.database.remove('pokemon.digChannel', [session.channelId]) : await ctx.database.set('pokemon.digChannel', session.channelId, row => ({
                digGames: digGame,
                channelCD: new Date(),
            }))
            if(stats?.isFindItem){
            let isFind=false
            player.fossil_bag=player.fossil_bag.reduce((acc,f)=>{
                if(f.id===digGame.item.id){
                    f.number++
                    isFind=true
                }
                acc.push(f)
                return acc
            },[])
            if(!isFind){
                player.fossil_bag.push({id: digGame.item.id, name: digGame.item.name, score: digGame.item.score, number: 1});
            }
            await ctx.database.set('pokebattle', session.userId, row => ({
                fossil_bag:player.fossil_bag
            }))}
            const md = `化石挖掘中
---
![img#550px #384px](${await toUrl(ctx, session, src)})

> 蓝色为当前挖掘位置

> 镐子可以探测化石位置，绿色为4格内，黄色为5-7格，红色为8格以上

> 锤子可以砸到周围8格

---
> 当前工具:${player.tool === 1 ? '镐子' : '锤子'}
[${player.tool === 1 ? '🔨' : '⛏'} 切换工具](mqqapi://aio/inlinecmd?command=${encodeURIComponent(`/切换工具`)}&reply=false&enter=true)

${MdString}

> 注：化石当前可售出为积分，集齐15种化石后，可以融合为传说中的宝可梦——固拉多`
            const kb = {
                keyboard: {
                    content: {
                        "rows": [
                            { "buttons": [button(2, `${stats?.isFindItem ? '继续游戏' : '挖掘'}`, `/挖掘 `, session.userId, "6", stats?.isFindItem ? true : false),button(2, `售出`, `/售出 `, session.userId, "p")] },
                            { "buttons": [button(2, `融合化石`, `/融合化石 `, session.userId, "r")] }
                        ].concat(stats?.isFindItem ?  [{ "buttons": [button(0, `售出该化石`, `/售出 ${digGame.item.id}`, session.userId, "x")] }]:[]),
                    },
                }
            }
            await sendMarkdown(md, session, kb)
        })
        ctx.command('宝可梦').subcommand('化石挖掘','挖掘化石相关指令').subcommand('切换工具')
        .action(async ({ session }) => {
            const [player]: Pokebattle[] = await ctx.database.get('pokebattle', session.userId)
            if (!player) {
                await session.execute('签到') 
                return
            }
            player.tool = player.tool === 1 ? 2 : 1
            await ctx.database.set('pokebattle', session.userId, row=>({
                tool: player.tool
            }))
            return `工具已切换为${player.tool === 1 ? '镐子' : '锤子'}`
        })

        ctx.command('宝可梦').subcommand('化石挖掘','挖掘化石相关指令').subcommand('dig').subcommand('售出 <id:text>',{minInterval:2000}).action(async ({ session }, id: string) => {
            const [player]: Pokebattle[] = await ctx.database.get('pokebattle', session.userId)
            if (!player) {
                await session.execute('签到') 
                return
            }
            if(player.lap<3) return '三周目后才可售出化石，当前可积攒在背包中'
            if(!id){
                const md =`请点击你要售出的化石`
                let kb={
                    keyboard:{
                        content:{
                            rows:[]
                    } 
                }}
                let i=0
                player.fossil_bag.forEach(f=>{
                    let fossilBtn=kb.keyboard.content.rows[i]
                    if (!fossilBtn) {
                        fossilBtn = { buttons: [] }
                        kb.keyboard.content.rows[i] = fossilBtn
                    }
                    if(!fossilBtn?.buttons) {fossilBtn.buttons=[]}
                    if (fossilBtn?.buttons.length >=2) {i++}
                    fossilBtn.buttons =  fossilBtn?.buttons.concat(button(0, `${f.name}x${f.number}`, `/售出 ${f.id}`, session.userId, f.id))
                })
                await sendMarkdown(md, session, kb)
                return
            }
            const fossil = player.fossil_bag.find(f => f.id === id)
            if (!fossil) {
                return '你没有该物品'
            }
            let isFind=false
            player.fossil_bag=player.fossil_bag.reduce((acc,f)=>{
                if(f.id===id){
                    f.number--
                    isFind=true
                }
                if(f.number>0){acc.push(f)}
                return acc
            },[])
            if(!isFind){
                player.fossil_bag = player.fossil_bag.filter(f => f.id !== id)
            }
            await ctx.database.set('pokebattle', session.userId, row => ({
                fossil_bag: player.fossil_bag
             }))
            await ctx.database.set('pokemon.resourceLimit', { id: session.userId }, row => ({
                rankScore: $.add(row.rankScore, fossil.score)
            }))
            return `你售出了${fossil.name}，获得了${fossil.score}积分`
        })

        ctx.command('宝可梦').subcommand('化石挖掘','挖掘化石相关指令').subcommand('dig').subcommand('融合化石').action(async ({ session }) => {
            const [player]: Pokebattle[] = await ctx.database.get('pokebattle', session.userId)
            if (!player) {
                await session.execute('签到') 
                return
            }
            if(player.lap<3) return '三周目后才可融合化石，当前可积攒在背包中'
            const pokeDex = new Pokedex(player)
            if(pokeDex.check('341.341')){
                return '你已经拥有了固拉多'
            }
            if(player.fossil_bag.length<15){
                return '化石数量不足'
            }

            player.fossil_bag=player.fossil_bag.reduce((acc,f)=>{
                f.number--
                if(f.number>0){acc.push(f)}
                return acc
            },[])
            pokeDex.pull('341.341', player)
            if (player?.ultra['341.341'] === undefined) {
                player.ultra['341.341'] =10
            }
            player.ultra['341.341'] = 10
            await ctx.database.set('pokebattle', { id: session.userId }, {
                fossil_bag: player.fossil_bag,
                ultra: player.ultra,
                pokedex: player.pokedex,
                cyberMerit:0
            })
            const getMd=`<@${session.userId}>成功获得
![img#512px #512px](${await toUrl(ctx, session, `${(pokemonCal.pokemomPic('341.341', false)).toString().match(/src="([^"]*)"/)[1]}`)})
---
![img#20px #20px](${await toUrl(ctx, session, `${config.图片源}/sr/341.png`)}) : ${player.ultra['341.341'] * 10}% ${'🟩'.repeat(Math.floor(player.ultra['341.341'] / 2)) + '🟨'.repeat(player.ultra['341.341'] % 2) + '⬜⬜⬜⬜⬜'.substring(Math.round(player.ultra['341.341'] / 2))}
                  
---
**传说宝可梦——${pokemonCal.pokemonlist('341.341')}**
            
已经放入图鉴`

            await sendMarkdown(getMd, session)
        })
}