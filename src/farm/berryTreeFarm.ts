export enum Event {
    '无事件',
    '干涸',
    '施肥',
    '除虫',
}

export interface Farm {
    sends: BerrySend[]
    trees: BerryTree[]
    farmLevel?: number
}

export interface treesData {
    id: number
    berrytree: string
    imglink?: string
}

export interface BerrySend {
    id: number
    name: string
    number: number

}

export interface BerryTree {
    id: number
    berry: string
    plantTime: Date
    stage: number
    event: Event
    eventTime: Date
    growth: number
    water: number
    yield: number
}

export class PlantTree implements Farm {
    sends: BerrySend[]
    trees: BerryTree[]
    farmLevel: number
    constructor(farm?: Farm,plantId?:number) {
        if (farm) {
            this.sends = farm.sends
            this.trees = farm.trees
        } else {
            this.sends = []
            this.trees = []
        }
        if(!plantId) return
        const berry = this.sends.find((send) => send.id === plantId)
        if (!berry||this.trees.length>=(this.farmLevel)) return
        this.trees.push({
            id: this.trees.length,
            berry: berry.name,
            plantTime: new Date(),
            stage: 0,
            event: Event['无事件'],
            eventTime: new Date(),
            growth: 0,
            water: 100,
            yield: 100
        })
    }
    triggerEvent() {
       this.trees.forEach((tree)=>{ const plantTime = tree.plantTime.getTime() / 1000 / 60
        const currentTime = new Date().getTime() / 1000 / 60 
        const time = currentTime - plantTime
        const spendWater = Math.floor(time)/5
        tree.water -= spendWater
        tree.water = tree.water>0?tree.water:0
        if(tree.eventTime.getTime()>new Date().getTime()) return
        const startTime = tree.eventTime.getTime() / 1000 / 60 / 60
        const endTime = new Date().getTime() / 1000 / 60 / 60
        const subtime = endTime - startTime
        let subyield: number
        switch (tree.event) {
            case Event['无事件']:
                if (tree.water <= 0) {
                    tree.water = 0
                    tree.event = Event['干涸']
                    tree.eventTime = new Date()
                }else{
                    const nextEvent = Math.floor(Math.random() * 3)+1
                    const eventTime= new Date((new Date).getTime()+Math.floor(Math.random()*1000*60*60*6)+1000*60*60*6)
                    tree.event = nextEvent
                    tree.eventTime = eventTime
                }
                break
            case Event['干涸']:
               subyield = Math.floor(subtime)*2
                tree.yield -= subyield
                break
            case Event['施肥']:
                subyield= Math.floor(subtime)
                tree.yield -= subyield
                break
            case Event['除虫']:
                subyield = Math.floor(subtime)*3
                tree.yield -= subyield
                break
            default:
                break
        }
        if (tree.yield <= 0) {
            tree.yield = 0
            tree={
                id:67,
                berry:'枯树',
                plantTime:new Date(),
                stage:0,
                event:Event['无事件'],
                eventTime:new Date(),
                growth:0,
                water:0,
                yield:0
            }
        } }  )
    }
}

