import { Player, world } from '@minecraft/server'
import { ActionFormData, ModalFormData } from '@minecraft/server-ui'
import { color } from '../../Utils/color'
import setting, { IModules } from './Setting'
import { useNotify } from '../../Hooks/hooks'
import { openAllPlayerLandManageForm, openLandDetailForm, openLandListForm } from '../Land/Forms'
import land, { ILand } from '../Land/Land'
import { openDialogForm } from '../Forms/Dialog'
import { openServerMenuForm } from '../Forms/Forms'
import { openPlayerWayPointListForm, openWayPointListForm } from '../WayPoint/Forms'
import { openNotifyForms } from '../Notify/Forms'
import { SystemLog } from '../../Utils/utils'
import WayPoint from '../WayPoint/WayPoint'
// 创建搜索玩家领地表单
function createSearchLandForm() {
  const form = new ModalFormData()
  form.title('搜索玩家领地')
  form.textField('玩家名称', '请输入要搜索的玩家名称')
  form.submitButton('搜索')
  return form
}

// 打开搜索玩家领地表单
export function openSearchLandForm(player: Player) {
  const form = createSearchLandForm()

  form.show(player).then(data => {
    if (data.cancelationReason) return
    const { formValues } = data
    if (formValues?.[0]) {
      const playerName = formValues[0].toString()
      const playerLands = land.getPlayerLands(playerName)
      if (playerLands.length === 0) {
        openDialogForm(
          player,
          {
            title: '搜索结果',
            desc: color.red('未找到该玩家的领地'),
          },
          () => openSearchLandForm(player),
        )
      } else {
        openSearchResultsForm(player, playerLands, playerName)
      }
    }
  })
}

// 打开搜索结果表单
const openSearchResultsForm = (player: Player, lands: ILand[], playerName: string, page: number = 1) => {
  const form = new ActionFormData()

  form.title(`搜索结果 - ${playerName}`)
  const totalPages = Math.ceil(lands.length / 10)
  const start = (page - 1) * 10
  const end = start + 10
  const currentPageLands = lands.slice(start, end)

  currentPageLands.forEach(landData => {
    form.button(landData.name, 'textures/ui/World')
  })

  let previousButtonIndex = currentPageLands.length
  let nextButtonIndex = currentPageLands.length
  if (page > 1) {
    form.button('上一页', 'textures/ui/arrow_left')
    previousButtonIndex++
    nextButtonIndex++
  }
  if (page < totalPages) {
    form.button('下一页', 'textures/ui/arrow_right')
    nextButtonIndex++
  }

  form.button('返回', 'textures/ui/dialog_bubble_point')

  form.body(`第 ${page} 页 / 共 ${totalPages} 页`)

  form.show(player).then(data => {
    if (data.cancelationReason) return
    const selectionIndex = data.selection
    if (selectionIndex === null || selectionIndex === undefined) return

    // 当前页的领地数量
    const currentPageLandsCount = currentPageLands.length

    if (selectionIndex < currentPageLandsCount) {
      // 选择的是某个领地
      openLandDetailForm(player, currentPageLands[selectionIndex], false)
    } else if (selectionIndex === previousButtonIndex - 1 && page > 1) {
      // 选择的是"上一页"
      openSearchResultsForm(player, lands, playerName, page - 1)
    } else if (selectionIndex === nextButtonIndex - 1 && page < totalPages) {
      // 选择的是"下一页"
      openSearchResultsForm(player, lands, playerName, page + 1)
    } else if (selectionIndex === nextButtonIndex) {
      // 选择的是"返回"
      openSearchLandForm(player)
    }
  })
}

// 打开玩家坐标点管理表单
export const openPlayerWayPointManageForm = (player: Player, page: number = 1) => {
  const form = new ActionFormData()
  form.title('§w玩家坐标点管理')

  // 从数据库中获取所有有坐标点记录的玩家列表
  const players = WayPoint.getWayPointPlayers()

  // 计算分页信息
  const pageSize = 10 // 每页显示10个玩家
  const totalPages = Math.ceil(players.length / pageSize)
  const start = (page - 1) * pageSize
  const end = Math.min(start + pageSize, players.length)
  const currentPagePlayers = players.slice(start, end)

  // 为当前页的每个玩家添加按钮
  currentPagePlayers.forEach(playerName => {
    const waypoints = WayPoint.getPointsByPlayer(playerName)
    const publicCount = waypoints.filter(p => p.type === 'public').length
    const privateCount = waypoints.filter(p => p.type === 'private').length
    form.button(
      `${color.blue(playerName)} 的所有坐标点\n ${color.darkPurple('公共坐标点:')} ${publicCount} | ${color.darkRed('私有坐标点:')} ${privateCount}`,
      'textures/ui/icon_steve',
    )
  })

  // 添加分页按钮
  let previousButtonIndex = currentPagePlayers.length
  let nextButtonIndex = currentPagePlayers.length

  if (page > 1) {
    form.button('§w上一页', 'textures/ui/arrow_left')
    previousButtonIndex++
    nextButtonIndex++
  }

  if (page < totalPages) {
    form.button('§w下一页', 'textures/ui/arrow_right')
    nextButtonIndex++
  }

  form.button('§w返回', 'textures/ui/dialog_bubble_point')
  form.body(`第 ${page} 页 / 共 ${totalPages} 页`)

  form.show(player).then(data => {
    if (data.canceled || data.cancelationReason) return

    const selectionIndex = data.selection
    if (selectionIndex === null || selectionIndex === undefined) return

    // 当前页的玩家数量
    const currentPagePlayersCount = currentPagePlayers.length

    if (selectionIndex < currentPagePlayersCount) {
      // 选择了某个玩家
      const selectedPlayerName = currentPagePlayers[selectionIndex]
      openPlayerWayPointListForm(player, selectedPlayerName, 1, () => openPlayerWayPointManageForm(player, page))
    } else if (selectionIndex === previousButtonIndex - 1 && page > 1) {
      // 点击了"上一页"
      openPlayerWayPointManageForm(player, page - 1)
    } else if (selectionIndex === nextButtonIndex - 1 && page < totalPages) {
      // 点击了"下一页"
      openPlayerWayPointManageForm(player, page + 1)
    } else if ((page === 1 && selectionIndex === nextButtonIndex) || (page > 1 && selectionIndex === nextButtonIndex)) {
      // 点击了"返回"
      openSystemSettingForm(player)
    }
  })
}

// 打开领地管理表单
export const openLandManageForm = (player: Player) => {
  const form = new ActionFormData()
  form.title('§w领地管理')

  form.button('§w所有玩家领地管理', 'textures/ui/icon_new')
  form.button('§w删除当前所在区域领地', 'textures/ui/redX1')
  form.button('§w搜索玩家领地', 'textures/ui/magnifyingGlass')
  // form.button('§w玩家坐标点管理', 'textures/ui/icon_steve')
  form.button('§w返回', 'textures/ui/dialog_bubble_point')

  form.show(player).then(data => {
    if (data.canceled || data.cancelationReason) return
    switch (data.selection) {
      case 0:
        openAllPlayerLandManageForm(player)
        break
      case 1:
        const { insideLand, isInside } = land.testLand(
          player.dimension.getBlock(player.location)?.location ?? player.location,
          player.dimension.id,
        )
        if (!isInside)
          return openDialogForm(player, { title: '领地删除失败', desc: color.red('你不在任何领地内！') }, () =>
            openLandManageForm(player),
          )
        const res = land.removeLand(insideLand?.name ?? '')
        if (typeof res === 'string') return openDialogForm(player, { title: '领地删除失败', desc: color.red(res) })
        openDialogForm(player, {
          title: '领地删除成功',
          desc: color.green(`${insideLand?.owner} 的领地 ${insideLand?.name} 删除成功！`),
        })
        break
      case 2:
        openSearchLandForm(player)
        break
      // case 3:
      //   openPlayerWayPointManageForm(player)
      //   break
      case 3:
        openSystemSettingForm(player)
        break
    }
  })
}

// 打开服务器名称设置表单
export const openServerNameForm = (player: Player) => {
  const form = new ModalFormData()
  form.title('§w设置服务器名称')
  form.textField('服务器名称', '请输入服务器名称')
  form.submitButton('§w确定')

  form.show(player).then(data => {
    if (data.canceled || data.cancelationReason) return
    const { formValues } = data
    if (formValues?.[0]) {
      const serverName = formValues[0].toString()
      world.setDynamicProperty('serverName', serverName)
      openDialogForm(player, { title: '服务器名称设置成功', desc: color.green('服务器名称设置成功！') }, () =>
        openSystemSettingForm(player),
      )
    } else {
      useNotify('chat', player, '§c服务器名称设置失败')
    }
  })
}

// 打开功能开关表单
export const openFunctionSwitchForm = (player: Player) => {
  const form = new ModalFormData()

  const buttons: { text: string; id: IModules; state: boolean }[] = [
    {
      text: '§w玩家操作',
      id: 'player',
      state: setting.getState('player') ?? true,
    },
    {
      text: '§w领地功能',
      id: 'land',
      state: setting.getState('land') ?? true,
    },
    {
      text: '§w坐标点管理',
      id: 'wayPoint',
      state: setting.getState('wayPoint') ?? true,
    },
    {
      text: '§w其他功能',
      id: 'other',
      state: setting.getState('other') ?? true,
    },
    {
      text: '§w帮助',
      id: 'help',
      state: setting.getState('help') ?? true,
    },
    {
      text: '§w掉落物清理',
      id: 'killItem',
      state: setting.getState('killItem') ?? true,
    },
  ]

  form.title('§w功能开关')
  buttons.forEach(({ text, state }) => form.toggle(text, state))

  form.submitButton('§w确定')

  form.show(player).then(data => {
    if (data.canceled || data.cancelationReason) return
    const { formValues } = data
    if (formValues) {
      formValues.forEach((value, index) => {
        if (value) setting.turnOn(buttons[index].id)
        else setting.turnOff(buttons[index].id)
      })
      openDialogForm(player, { title: '功能开关设置成功', desc: color.green('功能开关设置成功！') }, () =>
        openSystemSettingForm(player),
      )
    } else {
      useNotify('chat', player, '§c功能开关设置失败')
    }
  })
}

export const openKillItemSettingForm = (player: Player) => {
  SystemLog('openKillItemSettingForm enter')
  const form = new ModalFormData()
  const killItemAmount = (setting.getState('killItemAmount') as string) || '1500'
  try {
    SystemLog('killItemAmount -->' + killItemAmount)
    form.title('§w触发掉落物清理的上限设置')
    form.textField('触发掉落物清理的数量上限', killItemAmount.toString())
    form.submitButton('§w确定')
    form.show(player).then(data => {
      if (data.canceled || data.cancelationReason) return
      const { formValues } = data
      if (formValues?.[0]) {
        const num = formValues[0].toString()
        setting.setState('killItemAmount', num)
        openDialogForm(
          player,
          {
            title: '掉落物清理设置成功',
            desc: color.green('掉落物清理设置成功！当世界当中的掉落物数量超过设置数量时，会触发自动清理掉落物。'),
          },
          () => openSystemSettingForm(player),
        )
      } else {
        useNotify('chat', player, '§c掉落物清理设置失败')
      }
    })
  } catch (error) {
    SystemLog('openKillItemSettingForm error -->' + error)
  }
}

export const openRandomTpSettingForm = (player: Player) => {
  const form = new ModalFormData()
  const randomTpRange = (setting.getState('randomTpRange') as number) || 50000
  form.title('§w设置随机传送范围')
  form.textField('随机传送范围', randomTpRange.toString())
  form.submitButton('§w确定')
  form.show(player).then(data => {
    if (data.canceled || data.cancelationReason) return
    const { formValues } = data
    if (formValues?.[0]) {
      const num = formValues[0].toString()
      setting.setState('randomTpRange', num)
    }
  })
}

export const openLandBlockLimitForm = (player: Player) => {
  const form = new ModalFormData()
  const maxLandBlocks = (setting.getState('maxLandBlocks') as string) || '30000'
  form.title('§w设置领地方块上限')
  form.textField('领地方块上限', maxLandBlocks.toString())
  form.submitButton('§w确定')
  form.show(player).then(data => {
    if (data.canceled || data.cancelationReason) return
    const { formValues } = data
    if (formValues?.[0]) {
      const num = formValues[0].toString()
      setting.setState('maxLandBlocks', num)
      openDialogForm(
        player,
        {
          title: '领地方块上限设置成功',
          desc: color.green('领地方块上限设置成功！创建领地时方块数量不能超过设置的上限。'),
        },
        () => openSystemSettingForm(player),
      )
    } else {
      useNotify('chat', player, '§c领地方块上限设置失败')
    }
  })
}

// 打开通用系统设置表单
/**
 * 功能点：
 * 1. 设置掉落物清理数量
 * 2. 设置随机传送范围
 * 3. 设置服务器名称
 * 4. 设置服务器通知
 * 5. 设置创建领地时，领地内方块上限
 */
export const openCommonSettingForm = (player: Player) => {
  const form = new ActionFormData()
  form.title('§w通用系统设置')
  const buttons = [
    {
      text: '设置掉落物清理数量',
      icon: 'textures/ui/icon_fall',
      action: () => openKillItemSettingForm(player),
    },
    {
      text: '设置随机传送范围',
      icon: 'textures/ui/RTX_Sparkle',
      action: () => openRandomTpSettingForm(player),
    },
    {
      text: '设置服务器名称',
      icon: 'textures/ui/hanging_sign',
      action: () => openServerNameForm(player),
    },
    {
      text: '设置服务器通知',
      icon: 'textures/ui/icon_book_writable',
      action: () => openNotifyForms(player),
    },
    {
      text: '设置领地方块上限',
      icon: 'textures/ui/icon_recipe_construction',
      action: () => openLandBlockLimitForm(player),
    },
  ]
  buttons.forEach(({ text, icon }) => form.button(text, icon))

  form.button('§w返回', 'textures/ui/dialog_bubble_point')

  form.show(player).then(data => {
    if (data.canceled || data.cancelationReason) return
    switch (data.selection) {
      case buttons.length:
        openSystemSettingForm(player)
        break
      default:
        if (typeof data.selection === 'number') buttons[data.selection].action()
        break
    }
  })
}
// 打开系统设置表单
export const openSystemSettingForm = (player: Player) => {
  const form = new ActionFormData()
  form.title('§w服务器设置')

  const buttons = [
    {
      text: '功能开关',
      icon: 'textures/ui/craft_toggle_on_hover',
      action: () => openFunctionSwitchForm(player),
    },
    {
      text: '所有玩家坐标点管理',
      icon: 'textures/ui/mashup_world',
      action: () => openPlayerWayPointManageForm(player),
    },
    {
      text: '领地管理',
      icon: 'textures/ui/icon_new',
      action: () => openLandManageForm(player),
    },
    {
      text: '通用系统设置',
      icon: 'textures/ui/settings_glyph_color_2x',
      action: () => openCommonSettingForm(player),
    },
  ]

  buttons.forEach(({ text, icon }) => form.button(text, icon))

  form.button('§w返回', 'textures/ui/dialog_bubble_point')

  form.show(player).then(data => {
    if (data.canceled || data.cancelationReason) return
    switch (data.selection) {
      case buttons.length:
        openServerMenuForm(player)
        break
      default:
        if (typeof data.selection === 'number') buttons[data.selection].action()
        break
    }
  })
}
