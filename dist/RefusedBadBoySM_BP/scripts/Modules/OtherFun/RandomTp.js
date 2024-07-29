import { useNotify } from '../../hooks/hooks';
import { MinecraftEffectTypes } from '../../types';
// 根据两个大小参数区间，来生成随机数
export const RandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};
const range = 50000;
export const RandomTp = player => {
  const x = RandomNumber(-Math.abs(range), Math.abs(range));
  const z = RandomNumber(-Math.abs(range), Math.abs(range));
  let y = player.dimension.heightRange.max;
  player.teleport({
    x,
    y,
    z,
  });
  const addEffects = [
    MinecraftEffectTypes.FireResistance,
    MinecraftEffectTypes.NightVision,
    MinecraftEffectTypes.Resistance,
  ];
  addEffects.forEach(effect => {
    player.addEffect(effect, 600, {
      showParticles: false,
      amplifier: 255,
    });
  });
  useNotify('actionbar', player, `§a你已传送到了坐标: §e${x} ${y} ${z}`);
};
