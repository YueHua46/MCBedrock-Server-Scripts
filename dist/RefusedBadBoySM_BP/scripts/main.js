import { system, world } from '@minecraft/server';
import { prefix } from './config';
import { welcome } from './message';
import commandClass from './CommandClass';
world.afterEvents.playerSpawn.subscribe(data => {
    const { player, initialSpawn } = data;
    if (initialSpawn)
        player.sendMessage(welcome);
});
world.beforeEvents.chatSend.subscribe(async (data) => {
    const { message, sender } = data;
    data.cancel = true;
    if (message.startsWith(prefix)) {
        const [action, ...args] = message.slice(prefix.length).split(' ');
        const command = commandClass.getFunctions().find(f => f.name === action);
        if (!command)
            return sender.sendMessage('未知命令');
        system.run(() => command.handler(sender, args.join(' ')));
    }
});
