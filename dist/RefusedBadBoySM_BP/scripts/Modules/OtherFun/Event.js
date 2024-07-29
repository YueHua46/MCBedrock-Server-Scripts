import { world } from '@minecraft/server';
import { color } from '../../utils/color';
import prefix from './Prefix';
world.beforeEvents.chatSend.subscribe(e => {
  const { message, sender } = e;
  e.cancel = true;
  const _prefix = prefix.getPrefix(sender);
  if (!_prefix) prefix.initPrefix(sender);
  world.sendMessage({
    rawtext: [
      {
        text: `[${_prefix}] ${color.lightPurple(sender.name)}： ${color.aqua(message)}`,
      },
    ],
  });
});
world.afterEvents.playerSpawn.subscribe(e => {
  const { player } = e;
  const _prefix = prefix.getPrefix(player);
  if (!_prefix) prefix.initPrefix(player);
  player.nameTag = `${_prefix} ${color.aqua(player.name)}`;
});
