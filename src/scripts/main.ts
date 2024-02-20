import { world, system } from "@minecraft/server";
import { tpa } from "./events/message";
import { prefix } from "./config";

enum MessageEventEnum {
    传送 = 'tpa',
}

world.afterEvents.playerSpawn.subscribe(data => {
    const { player, initialSpawn } = data
    if (initialSpawn) player.sendMessage("服务器已启用插件～")
})

world.beforeEvents.chatSend.subscribe(async (data) => {
    const { message, sender } = data


    for (const key in MessageEventEnum) {
        if (message.startsWith(`${prefix}${MessageEventEnum[key as keyof typeof MessageEventEnum]}`)) {
            data.cancel = true
            const cmd = message.split(prefix)[1]
            console.log('cmd', cmd)
            // 满足消息事件，执行对应操作
            switch (cmd) {
                case MessageEventEnum.传送:
                    // 传送
                    tpa(message, sender)
                    break;
            }
        }
    }
})