import commandClass from '../CommandClass';
export const helpCommand = {
    name: 'help',
    desc: '获得帮助菜单',
    usage: 'help',
    handler: help,
};
function help(sender) {
    const functions = commandClass.getFunctions();
    const helpMessage = functions.map(f => `${f.name} - ${f.usage} - ${f.desc}`).join('\n');
    sender.sendMessage(helpMessage);
}
