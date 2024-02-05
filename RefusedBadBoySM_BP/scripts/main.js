"use strict";

Object.defineProperty(exports, "__esModule", {
  value: !0
});
var server_1 = require("@minecraft/server");
function mainTick() {
  server_1.world.sendMessage("Hello world!"), server_1.world.sendMessage("current tick:" + server_1.system.currentTick.toString()), server_1.world.getPlayers().forEach(function (e) {
    var r = e.name;
    e.sendMessage("你好！".concat(r));
  });
}
server_1.system.run(mainTick);