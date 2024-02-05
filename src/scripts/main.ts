import { world, system, Player } from "@minecraft/server";

function mainTick() {
    world.sendMessage("Hello world!")
    world.sendMessage('current tick:' + system.currentTick.toString())

    const players = world.getPlayers()
    players.forEach((player: Player) => {
        const { name } = player
        player.sendMessage(`你好！${name}`)
    })
}

system.run(mainTick)