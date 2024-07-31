import { Player, world } from '@minecraft/server'
import { ActionFormData, ModalFormData } from '@minecraft/server-ui'
import { color } from '../../utils/color'
import setting, { IModules } from './Setting'
import { useNotify } from '../../hooks/hooks'
import { openLandDetailForm, openLandListForm } from '../Land/Forms'
import land, { ILand } from '../Land/Land'
import { openDialogForm } from '../Forms/Dialog'
import { openServerMenuForm } from '../Forms/Forms'
import { openWayPointListForm } from '../WayPoint/Forms'
import { openNotifyForms } from '../Notify/Forms'
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
      // 选择的是“上一页”
      openSearchResultsForm(player, lands, playerName, page - 1)
    } else if (selectionIndex === nextButtonIndex - 1 && page < totalPages) {
      // 选择的是“下一页”
      openSearchResultsForm(player, lands, playerName, page + 1)
    } else if (selectionIndex === nextButtonIndex) {
      // 选择的是“返回”
      openSearchLandForm(player)
    }
  })
}

// 打开领地管理表单
export const openLandManageForm = (player: Player) => {
  const form = new ActionFormData()
  form.title('§w领地管理')

  form.button('§w所有玩家领地列表', 'textures/ui/icon_new')
  form.button('§w删除当前所在区域领地', 'textures/ui/redX1')
  form.button('§w搜索玩家领地', 'textures/ui/magnifyingGlass')
  form.button('§w返回', 'textures/ui/dialog_bubble_point')

  form.show(player).then(data => {
    if (data.canceled || data.cancelationReason) return
    switch (data.selection) {
      case 0:
        openLandListForm(player, true)
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
  form.textField('服务器名称', '杜绝熊孩服务器')
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
// 打开系统设置表单
export const openSystemSettingForm = (player: Player) => {
  const form = new ActionFormData()
  form.title('§w服务器设置')

  const buttons = [
    {
      text: '功能开关',
      icon: 'textures/ui/craft_toggle_on_hover',
      action: openFunctionSwitchForm,
    },
    {
      text: '所有玩家坐标点管理',
      icon: 'textures/ui/mashup_world',
      action: () => openWayPointListForm(player, true),
    },
    {
      text: '领地管理',
      icon: 'textures/ui/icon_new',
      action: openLandManageForm,
    },
    {
      text: '通知设置',
      icon: 'textures/ui/icon_book_writable',
      action: () => openNotifyForms(player),
    },
    {
      text: '设置服务器名称（用于进游戏时的标题显示）',
      icon: 'textures/ui/promo_gift_small_yellow',
      action: () => openServerNameForm(player),
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
        if (typeof data.selection === 'number') buttons[data.selection].action(player)
        break
    }
  })
}
