import commandClass from"../CommandClass";import{color}from"../color";import{prefix}from"../config";const helpCommand={name:"help",desc:"获得帮助菜单",usage:"help",handler:help};function help(o){var e=commandClass.getFunctions().map(o=>`${color.yellow(o.name)} - ${color.green(""+prefix+o.usage)} - `+color.yellow(o.desc)).join("\n");o.sendMessage(e)}export{helpCommand};