import { IFunction } from "../CommandClass"

export const landCommand = {
    name: 'land',
    desc: '领地管理',
    usage: 'land x y z',
    handler: land,
} as IFunction

async function land() {
    // TODO
    console.log('land')
}