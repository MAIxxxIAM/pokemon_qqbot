export interface markdownMessage {
    title?: string
    content: string
    image?: {
        width: number
        height: number
        url: string
    }
}