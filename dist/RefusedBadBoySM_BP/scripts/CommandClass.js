// import { tpaCommand,helpCommand } from './commands'
import { tpaCommand } from './commands/tpa';
import { helpCommand } from './commands/help';
class CommandClass {
    constructor() {
        this.functions = [];
        this.addFunction(tpaCommand);
        this.addFunction(helpCommand);
    }
    run(action, sender, ...args) {
        const command = this.getFunctions().find(f => f.name === action);
        if (!command)
            return sender.sendMessage('未知命令');
        command.handler(sender, args);
    }
    addFunction({ name, desc, usage, handler }) {
        this.functions.push({ name, desc, usage, handler });
    }
    removeFunction(name) {
        this.functions = this.functions.filter(f => f.name !== name);
    }
    getFunction(name) {
        return this.functions.find(f => f.name === name);
    }
    getFunctions() {
        return this.functions;
    }
}
export default new CommandClass();
