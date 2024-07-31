import { ActionFormData, ModalFormData } from '@minecraft/server-ui';
import { color } from '../../utils/color';
import { openServerMenuForm } from '../Forms/Forms';
import wayPoint from './WayPoint';
import { useFormatListInfo, useNotify } from '../../hooks/hooks';
import { MinecraftDimensionTypes } from '../../types';
import { openConfirmDialogForm, openDialogForm } from '../Forms/Dialog';
import { openSystemSettingForm } from '../System/Forms';
// Constants
const ITEMS_PER_PAGE = 10;
// 打开搜索指定用户坐标点表单
export const openSearchWayPointForm = player => {
  const form = new ModalFormData();
  form.title('搜索用户坐标点');
  form.textField('玩家名称', '请输入要搜索的玩家名称');
  form.submitButton('搜索');
  form.show(player).then(data => {
    if (data.cancelationReason) return;
    const { formValues } = data;
    if (formValues?.[0]) {
      const playerName = formValues[0].toString();
      const wayPoints = wayPoint.getPointsByPlayer(playerName);
      if (wayPoints.length === 0) {
        openDialogForm(
          player,
          {
            title: '搜索结果',
            desc: color.red('未找到该玩家的坐标点或该玩家不存在'),
          },
          () => openSearchWayPointForm(player),
        );
      } else {
        openSearchResultsForm(player, wayPoints, playerName);
      }
    }
  });
};
// 打开搜索结果表单
const openSearchResultsForm = (player, wayPoints, playerName, page = 1) => {
  const form = new ActionFormData();
  form.title(`搜索结果 - ${playerName}`);
  const totalPages = Math.ceil(wayPoints.length / 10);
  const start = (page - 1) * 10;
  const end = start + 10;
  const currentPageWayPoints = wayPoints.slice(start, end);
  currentPageWayPoints.forEach(point => {
    form.button(` ${point.name}`, 'textures/ui/World');
  });
  let previousButtonIndex = currentPageWayPoints.length;
  let nextButtonIndex = currentPageWayPoints.length;
  if (page > 1) {
    form.button('上一页', 'textures/ui/arrow_left');
    previousButtonIndex++;
    nextButtonIndex++;
  }
  if (page < totalPages) {
    form.button('下一页', 'textures/ui/arrow_right');
    nextButtonIndex++;
  }
  form.body(`第 ${page} 页 / 共 ${totalPages} 页`);
  form.button('返回', 'textures/ui/dialog_bubble_point');
  form.show(player).then(data => {
    if (data.cancelationReason) return;
    const selectionIndex = data.selection;
    if (selectionIndex === null || selectionIndex === undefined) return;
    // 当前页的坐标点数量
    const currentPageWayPointsCount = currentPageWayPoints.length;
    if (selectionIndex < currentPageWayPointsCount) {
      // 选择的是某个坐标点
      const pointName = currentPageWayPoints[selectionIndex].name;
      if (pointName) {
        openWayPointDetailForm(player, pointName, false, 'public');
      }
    } else if (selectionIndex === previousButtonIndex - 1 && page > 1) {
      // 选择的是“上一页”
      openSearchResultsForm(player, wayPoints, playerName, page - 1);
    } else if (selectionIndex === nextButtonIndex - 1 && page < totalPages) {
      // 选择的是“下一页”
      openSearchResultsForm(player, wayPoints, playerName, page + 1);
    } else if (selectionIndex === nextButtonIndex) {
      // 选择的是“返回”
      openWayPointMenuForms(player);
    }
  });
};
// 打开坐标点更新表单
export const openWayPointUpdateForm = (player, pointName, isAdmin = false) => {
  const form = new ModalFormData();
  form.title('编辑坐标点');
  form.textField('坐标点名称', '请输入坐标点名称（不允许重复）', pointName);
  form.toggle('是否更新坐标为当前坐标', false);
  form.submitButton('确定');
  form.show(player).then(data => {
    if (data.cancelationReason) return;
    const { formValues } = data;
    if (formValues?.[0]) {
      const res = wayPoint.updatePoint({
        player,
        pointName,
        updatePointName: formValues?.[0].toString(),
        isUpdateLocation: formValues?.[1],
      });
      if (typeof res === 'string') {
        return openDialogForm(
          player,
          {
            title: '坐标点更新失败',
            desc: color.red(res),
          },
          () => openWayPointUpdateForm(player, pointName, isAdmin),
        );
      }
      openDialogForm(
        player,
        {
          title: '坐标点更新成功',
          desc: color.green('坐标点更新成功！'),
        },
        () => openWayPointListForm(player, isAdmin),
      );
    }
  });
};
// 打开坐标点详细
export const openWayPointDetailForm = (player, pointName, isAdmin = false, type) => {
  const form = new ActionFormData();
  const point = wayPoint.getPoint(pointName);
  if (!point) {
    return openDialogForm(player, { title: '坐标点不存在', desc: color.red('坐标点不存在！') }, () =>
      openWayPointListForm(player, isAdmin, type),
    );
  }
  form.title('坐标点详细');
  form.body(
    useFormatListInfo([
      {
        title: '坐标点名称',
        desc: point.name,
      },
      {
        title: '创建玩家',
        desc: point.playerName,
      },
      {
        title: '所在维度',
        desc:
          point.dimension === MinecraftDimensionTypes.Overworld
            ? '主世界'
            : point.dimension === MinecraftDimensionTypes.Nether
              ? '下界'
              : '末地',
      },
      {
        title: '坐标点位置',
        desc: point.location.x + ', ' + point.location.y + ', ' + point.location.z,
      },
    ]),
  );
  // Public permissions default buttons
  const buttons = [
    {
      text: '传送至此',
      icon: 'textures/ui/portalBg',
      action: () => {
        const res = wayPoint.teleport(player, pointName);
        if (typeof res === 'string') useNotify('chat', player, res);
      },
    },
  ];
  // Owner or admin permissions buttons
  if (wayPoint.checkOwner(player, pointName) || isAdmin) {
    buttons.push(
      {
        text: '编辑',
        icon: 'textures/ui/pencil_edit_icon',
        action: () => openWayPointUpdateForm(player, pointName, isAdmin),
      },
      {
        text: '删除',
        icon: 'textures/ui/cancel',
        action: () => {
          openConfirmDialogForm(player, '删除坐标点', '是否确定删除该坐标点？', () => {
            const isSuccess = wayPoint.deletePoint(pointName);
            if (isSuccess) {
              openDialogForm(
                player,
                {
                  title: '坐标点删除成功',
                  desc: color.green('坐标点删除成功！'),
                },
                () => openWayPointListForm(player, isAdmin, type),
              );
            } else {
              openDialogForm(
                player,
                {
                  title: '坐标点删除失败',
                  desc: color.red('坐标点删除失败！'),
                },
                () => openWayPointListForm(player, isAdmin, type),
              );
            }
          });
        },
      },
    );
    // Starred button
    if (type === 'private') {
      buttons.splice(1, 0, {
        text: point.isStarred ? '取消置顶' : '置顶',
        icon: 'textures/ui/filledStarFocus',
        action: () => {
          const isSuccess = wayPoint.toggleStar(pointName, !point.isStarred);
          if (typeof isSuccess !== 'string') {
            openDialogForm(
              player,
              {
                title: '置顶状态更新成功',
                desc: color.green('置顶状态更新成功！'),
              },
              () => openWayPointDetailForm(player, pointName, isAdmin, type),
            );
          } else {
            openDialogForm(
              player,
              {
                title: '置顶状态更新失败',
                desc: color.red('置顶状态更新失败！'),
              },
              () => openWayPointDetailForm(player, pointName, isAdmin, type),
            );
          }
        },
      });
    }
  }
  buttons.push({
    text: '返回',
    icon: 'textures/ui/dialog_bubble_point',
    action: () => openWayPointListForm(player, isAdmin, type),
  });
  buttons.forEach(({ text, icon }) => form.button(text, icon));
  form.show(player).then(data => {
    if (data.cancelationReason || typeof data.selection !== 'number') return;
    const selectedButton = buttons[data.selection];
    if (selectedButton && selectedButton.action) {
      selectedButton.action();
    }
  });
};
// Open add waypoint form
export const openAddWayPointForm = (player, type = 'private') => {
  const form = new ModalFormData();
  form.title(type === 'private' ? '添加私人坐标点' : '添加公共坐标点');
  form.textField('坐标点名称', '请输入坐标点名称（不允许重复）');
  form.submitButton('确定');
  form.show(player).then(data => {
    if (data.cancelationReason) return;
    const { formValues } = data;
    if (formValues?.[0]) {
      const res = wayPoint.createPoint({
        location: player.location,
        player,
        pointName: formValues?.[0].toString(),
        type,
      });
      if (typeof res === 'string') {
        return openDialogForm(
          player,
          {
            title: '坐标点添加失败',
            desc: color.red(res),
          },
          () => openAddWayPointForm(player),
        );
      }
      openDialogForm(
        player,
        {
          title: '坐标点添加成功',
          desc: color.green('坐标点添加成功！'),
        },
        () => openWayPointListForm(player),
      );
    }
  });
};
// 打开坐标点列表
export const openWayPointListForm = (player, isAdmin = false, type = 'private', page = 1) => {
  const form = new ActionFormData();
  form.title(isAdmin ? '所有玩家坐标点列表' : type === 'private' ? '私人坐标点列表' : '公共坐标点列表');
  let wayPoints;
  if (isAdmin) wayPoints = wayPoint.getPoints();
  else if (type === 'private') wayPoints = wayPoint.getPlayerPoints(player);
  else wayPoints = wayPoint.getPublicPoints();
  // 只将私人坐标点的置顶坐标移到列表的最前面
  wayPoints.sort((a, b) => {
    if (a.type === 'private' && b.type === 'private') return (b.isStarred ? 1 : 0) - (a.isStarred ? 1 : 0);
    return 0;
  });
  // 分页显示，当前页最多显示 10 个坐标点，超过10个则显示下一页和上一页（上一页按钮在第一页不显示，下一页在最后一页不显示）
  const totalPages = Math.ceil(wayPoints.length / 10);
  const start = (page - 1) * 10;
  const end = start + 10;
  const currentPageWayPoints = wayPoints.slice(start, end);
  form.body(`第 ${page} 页 / 共 ${totalPages} 页`);
  currentPageWayPoints.forEach(point => {
    // 检查是否为私人坐标点，只有私人坐标点才显示星号符号
    const starSymbol = point.type === 'private' ? (point.isStarred ? '' : '') : '';
    if (isAdmin) {
      form.button(`${starSymbol} ${point.playerName} ${point.name}`, 'textures/ui/World');
    } else {
      form.button(`${starSymbol} ${point.name} ${type === 'public' ? point.playerName : ''}`, 'textures/ui/World');
    }
  });
  let previousButtonIndex = currentPageWayPoints.length;
  let nextButtonIndex = currentPageWayPoints.length;
  if (page > 1) {
    form.button('上一页', 'textures/ui/arrow_left');
    previousButtonIndex++;
    nextButtonIndex++;
  }
  if (page < totalPages) {
    form.button('下一页', 'textures/ui/arrow_right');
    nextButtonIndex++;
  }
  form.button('返回', 'textures/ui/dialog_bubble_point');
  form.show(player).then(data => {
    if (data.cancelationReason) return;
    const selectionIndex = data.selection;
    if (selectionIndex === null || selectionIndex === undefined) return;
    // 当前页的坐标点数量
    const currentPageWayPointsCount = currentPageWayPoints.length;
    if (selectionIndex < currentPageWayPointsCount) {
      // 选择的是某个坐标点
      const pointName = currentPageWayPoints[selectionIndex].name;
      if (pointName) {
        openWayPointDetailForm(player, pointName, isAdmin, type);
      }
    } else if (selectionIndex === previousButtonIndex - 1 && page > 1) {
      // 选择的是“上一页”
      openWayPointListForm(player, isAdmin, type, page - 1);
    } else if (selectionIndex === nextButtonIndex - 1 && page < totalPages) {
      // 选择的是“下一页”
      openWayPointListForm(player, isAdmin, type, page + 1);
    } else if (selectionIndex === nextButtonIndex) {
      // 选择的是“返回”
      if (!isAdmin) openWayPointMenuForms(player);
      else openSystemSettingForm(player);
    }
  });
};
// Open waypoint menu form
export const openWayPointMenuForms = player => {
  const form = new ActionFormData();
  form.title('坐标点管理');
  const buttons = [
    {
      text: '私人坐标点列表',
      icon: 'textures/ui/icon_best3',
      action: () => openWayPointListForm(player),
    },
    {
      text: '公共坐标点列表',
      icon: 'textures/ui/conduit_power_effect',
      action: () => openWayPointListForm(player, false, 'public'),
    },
    {
      text: '添加当前私人坐标点',
      icon: 'textures/ui/friend1_black_outline',
      action: () => openAddWayPointForm(player),
    },
    {
      text: '添加当前公共坐标点',
      icon: 'textures/ui/FriendsIcon',
      action: () => openAddWayPointForm(player, 'public'),
    },
  ];
  if (player.hasTag('admin')) {
    buttons.push({
      text: '搜索用户坐标点',
      icon: 'textures/ui/magnifyingGlass',
      action: () => openSearchWayPointForm(player),
    });
  }
  buttons.forEach(({ text, icon }) => form.button(text, icon));
  form.button('返回', 'textures/ui/dialog_bubble_point');
  form.show(player).then(data => {
    if (data.cancelationReason) return;
    switch (data.selection) {
      case buttons.length:
        openServerMenuForm(player);
        break;
      default:
        if (typeof data.selection === 'number') buttons[data.selection].action();
    }
  });
};
