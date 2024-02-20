import { world } from '@minecraft/server';
import { MessageFormData } from '@minecraft/server-ui';
import { prefix } from '../config';
import { color } from '../color';
export const tpaCommand = {
    name: 'tpa',
    desc: '传送到指定玩家身边',
    usage: 'tpa @玩家名',
    handler: tpa,
};
async function tpa(sender, message) {
    // 校验格式是否正确
    if (!message.startsWith(`${prefix}tpa @`)) {
        sender.sendMessage('格式错误，请使用 tpa @玩家名 请求传送到玩家身边');
    }
    const targetName = message.split(`@`)[1];
    const targetPlayer = world.getAllPlayers().find(player => player.name === targetName);
    console.log('targetPlayer', targetPlayer);
    if (targetName === sender.name) {
        sender.sendMessage('你不能够传送到自己身边');
        return;
    }
    if (!targetPlayer) {
        sender.sendMessage(`玩家 ${targetName} 不存在`);
        return;
    }
    sender.sendMessage('请求已发送');
    // 执行异步等待，等待玩家接受传送请求
    tpaWait(targetPlayer)
        .then(msg => {
        const targetPlayer = world.getAllPlayers().find(player => player.name === sender.name);
        if (targetPlayer) {
            sender.runCommand(`tp ${targetName}`);
            sender.sendMessage(`已传送到玩家 ${targetName} 身边`);
        }
        else {
            sender.sendMessage('找不到目标玩家');
        }
    })
        .catch(reason => {
        sender.sendMessage(reason);
    });
}
// 等待玩家接受传送请求
async function tpaWait(targetPlayer) {
    return new Promise((resolve, reject) => {
        // 给targetPlayer弹出UI
        const form = new MessageFormData();
        form.title('传送请求');
        form.body(`${color.green('玩家')} ${color.yellow(targetPlayer.name)} ${color.green('请求传送到你身边，是否接受？')}`);
        form.button1('接受');
        form.button2('拒绝');
        form.show(targetPlayer).then(response => {
            if (response.selection === 0) {
                resolve('');
            }
            else {
                reject('传送请求已拒绝');
            }
        });
    });
}
