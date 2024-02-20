import { Player, system, world } from "@minecraft/server";
import { prefix } from '../config'

export async function tpa(message: string, sender: Player) {
    // message example
    // tpa @player

    // 校验格式是否正确
    if (!message.startsWith(`${prefix}tpa @`)) {
        sender.sendMessage('格式错误，请使用 tpa @玩家名 请求传送到玩家身边')
        sender.sendMessage(`[System Error]: ${message} - ${prefix}tpa @`)
        sender.sendMessage(`[System Error]: message.startsWith(${prefix}tpa @)`)
    }

    const targetName = message.split(`@`)[1]

    const targetPlayer = world.getAllPlayers().find(player => player.name === targetName)
    if (!targetPlayer) {
        sender.sendMessage(`玩家 ${targetName} 不存在`)
        return
    }

    targetPlayer.sendMessage(`玩家 ${sender.name} 请求传送到你身边，请在30秒内输入 ${prefix}tpaccept 接受请求`)
    sender.sendMessage('请求已发送')

    // 执行异步等待，等待玩家接受传送请求
    tpaWait(targetPlayer).then((sub) => {
        world.beforeEvents.chatSend.unsubscribe(sub)
        sender.runCommand(`tp ${targetPlayer.name}`)
        sender.sendMessage(`已传送到玩家 ${targetPlayer.name} 身边`)
        targetPlayer.sendMessage(`玩家 ${sender.name} 已传送到你身边`)
    }).catch((reason) => {
        sender.sendMessage(reason)
    })
}
// 如果玩家在30秒内输入了tpaccept，则会触发resolve，否则会在30秒后触发reject
function tpaWait(targetPlayer: Player): Promise<any> {
    return new Promise((resolve, reject) => {
        const sub = world.beforeEvents.chatSend.subscribe((event) => {
            const { message, sender } = event
            if (message === `${prefix}tpaccept` && sender.name === targetPlayer.name) {
                resolve(sub)
            }
        })
        // 30秒后如果没有接受则取消传送请求
        setTimeout(() => {
            reject('请求超时')
            world.beforeEvents.chatSend.unsubscribe(sub)
        }, 30 * 1000)
    })
}