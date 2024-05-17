export enum Event {
    '无事件',
    '干涸',
    '施肥',
    '除虫',
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

export class BerryEvent {
    tree: BerryTree
    constructor(tree: BerryTree) {
        this.tree = tree
    }
    triggerEvent() {
        const plantTime = this.tree.plantTime.getTime() / 1000 / 60
        const currentTime = new Date().getTime() / 1000 / 60 
        const time = currentTime - plantTime
        const spendWater = Math.floor(time)/5
        this.tree.water -= spendWater
        this.tree.water = this.tree.water>0?this.tree.water:0
        if(this.tree.eventTime.getTime()>new Date().getTime()) return
        const startTime = this.tree.eventTime.getTime() / 1000 / 60 / 60
        const endTime = new Date().getTime() / 1000 / 60 / 60
        const subtime = endTime - startTime
        let subyield: number
        switch (this.tree.event) {
            case Event['无事件']:
                if (this.tree.water <= 0) {
                    this.tree.water = 0
                    this.tree.event = Event['干涸']
                    this.tree.eventTime = new Date()
                }else{
                    const nextEvent = Math.floor(Math.random() * 3)+1
                    const eventTime= new Date((new Date).getTime()+Math.floor(Math.random()*1000*60*5)+1000*60*5)
                    this.tree.event = nextEvent
                    this.tree.eventTime = eventTime
                }
                break
            case Event['干涸']:
               subyield = Math.floor(subtime)*2
                this.tree.yield -= subyield
                break
            case Event['施肥']:
                subyield= Math.floor(subtime)
                this.tree.yield -= subyield
                break
            case Event['除虫']:
                subyield = Math.floor(subtime)*3
                this.tree.yield -= subyield
                break
            default:
                break
        }
        if (this.tree.yield <= 0) {
            this.tree.yield = 0
            this.tree={
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
        }   
    }
}

