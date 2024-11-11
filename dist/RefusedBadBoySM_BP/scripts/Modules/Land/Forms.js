import { ActionFormData, ModalFormData } from '@minecraft/server-ui';
import { color } from '../../utils/color';
import land from './Land';
import { openServerMenuForm } from '../Forms/Forms';
import { openDialogForm } from '../Forms/Dialog';
import { landAreas } from './Event';
import { useFormatListInfo, useGetAllPlayer, useNotify } from '../../hooks/hooks';
import { openLandManageForm } from '../System/Forms';
// 领地申请
function createLandApplyForm(player) {
  const form = new ModalFormData();
  form.title('领地申请');
  const defaultLandStartPos = landAreas.get(player.name)?.start || {
    x: player.location.x.toFixed(0),
    y: player.location.y.toFixed(0),
    z: player.location.z.toFixed(0),
  };
  const defaultLandEndPos = landAreas.get(player.name)?.end || {
    x: player.location.x.toFixed(0),
    y: player.location.y.toFixed(0),
    z: player.location.z.toFixed(0),
  };
  form.textField(color.white('领地名称'), color.gray('请输入领地名称'), '');
  form.textField(
    color.white('领地起始点'),
    color.gray('请输入领地起始点'),
    `${defaultLandStartPos.x} ${defaultLandStartPos.y} ${defaultLandStartPos.z}`,
  );
  form.textField(
    color.white('领地结束点'),
    color.gray('请输入领地结束点'),
    `${defaultLandEndPos.x} ${defaultLandEndPos.y} ${defaultLandEndPos.z}`,
  );
  form.submitButton('确认');
  return form;
}
function validateForm(formValues, player) {
  if (formValues && formValues[0] && formValues[1] && formValues[2]) {
    const landName = formValues[0];
    const landStartPos = formValues[1];
    const landEndPos = formValues[2];
    const landStartPosVector3 = land.createVector3(landStartPos);
    const landEndPosVector3 = land.createVector3(landEndPos);
    if (typeof landStartPosVector3 === 'string' || typeof landEndPosVector3 === 'string') {
      openDialogForm(
        player,
        {
          title: '领地创建错误',
          desc: color.red('表单格式填写有误，请重新填写！'),
        },
        () => {
          openLandApplyForm(player);
        },
      );
      return false;
    }
    if (
      landStartPosVector3.x === landEndPosVector3.x ||
      landStartPosVector3.z === landEndPosVector3.z ||
      landStartPosVector3.y === landEndPosVector3.y
    ) {
      openDialogForm(
        player,
        {
          title: '领地创建错误',
          desc: color.red('领地起始点和结束点不能在同一直线上，且不能为同一坐标点！'),
        },
        () => {
          openLandApplyForm(player);
        },
      );
      return false;
    }
    return true;
  } else {
    openDialogForm(
      player,
      {
        title: '领地创建错误',
        desc: color.red('表单未填写完整，请重新填写！'),
      },
      () => {
        openLandApplyForm(player);
      },
    );
    return false;
  }
}
export function openLandApplyForm(player) {
  const form = createLandApplyForm(player);
  form.show(player).then(data => {
    const { formValues, cancelationReason } = data;
    if (cancelationReason === 'UserClosed') return;
    if (validateForm(formValues, player)) {
      const landName = formValues?.[0];
      const landStartPos = formValues?.[1];
      const landEndPos = formValues?.[2];
      const landStartPosVector3 = land.createVector3(landStartPos);
      const landEndPosVector3 = land.createVector3(landEndPos);
      const landData = {
        name: landName,
        owner: player.name,
        dimension: player.dimension.id,
        members: [player.name],
        public_auth: {
          break: false,
          place: false,
          useBlock: false,
          isChestOpen: false,
          useEntity: false,
          useButton: false,
          explode: false,
        },
        config_public_auth: {
          break: false,
          place: false,
          useBlock: false,
          isChestOpen: false,
          useEntity: false,
          useButton: false,
          explode: false,
        },
        vectors: {
          start: landStartPosVector3,
          end: landEndPosVector3,
        },
      };
      const res = land.addLand(landData);
      if (typeof res === 'string') {
        openDialogForm(
          player,
          {
            title: '领地创建错误',
            desc: color.red(res),
          },
          () => {
            openLandApplyForm(player);
          },
        );
      } else {
        player.sendMessage(color.yellow(`领地 ${landName} 创建成功！`));
        landAreas.delete(player.name);
      }
    }
  });
}
// 领地公开权限
export function openLandAuthForm(player, myLand) {
  const form = new ModalFormData();
  const _myLand = land.db.get(myLand.name);
  form.title('领地公开权限');
  form.toggle(color.white('破坏权限'), _myLand.public_auth.break);
  form.toggle(color.white('放置权限'), _myLand.public_auth.place);
  form.toggle(color.white('使用功能性方块权限'), _myLand.public_auth.useBlock);
  form.toggle(color.white('箱子是否公开'), _myLand.public_auth.isChestOpen);
  form.toggle(color.white('按钮是否公开'), _myLand.public_auth.useButton ?? false);
  form.toggle(color.white('实体是否允许交互'), _myLand.public_auth.useEntity);
  form.toggle(color.white('爆炸'), _myLand.public_auth.explode);
  form.submitButton('确认');
  form.show(player).then(data => {
    const { formValues, cancelationReason } = data;
    if (cancelationReason === 'UserClosed') return;
    const public_auth = {
      break: formValues?.[0],
      place: formValues?.[1],
      useBlock: formValues?.[2],
      isChestOpen: formValues?.[3],
      useButton: formValues?.[4],
      useEntity: formValues?.[5],
      explode: formValues?.[6],
    };
    land.db.set(_myLand.name, {
      ..._myLand,
      public_auth,
    });
    openDialogForm(
      player,
      {
        title: '领地公开权限',
        desc: color.green('领地公开权限设置成功！'),
      },
      () => {
        openLandDetailForm(player, _myLand);
      },
    );
  });
}
// 领地成员添加
export function openLandMemberApplyForm(player, _land) {
  const form = new ModalFormData();
  const allPlayer = useGetAllPlayer();
  const allPlayerNames = allPlayer.map(player => player.name);
  form.title('领地成员申请');
  form.dropdown(color.white('选择玩家'), allPlayerNames, 0);
  form.textField(color.white('或通过玩家名称添加（二选一，优先第二个）'), color.gray('输入玩家名称'), '');
  form.submitButton('确认');
  form.show(player).then(data => {
    const { formValues, cancelationReason } = data;
    if (cancelationReason === 'UserClosed') return;
    const selectPlayerName = allPlayer[Number(formValues?.[0])].name;
    const inputPlayerName = formValues?.[1];
    const pn = inputPlayerName || selectPlayerName;
    if (pn) {
      const res = land.addMember(_land.name, pn);
      if (typeof res === 'string') {
        openDialogForm(
          player,
          {
            title: '领地成员申请',
            desc: color.red(res),
          },
          () => {
            openLandMemberApplyForm(player, _land);
          },
        );
      } else {
        const targetPlayer = useGetAllPlayer().find(player => player.name === pn);
        if (targetPlayer)
          useNotify('chat', targetPlayer, `§a您已被 §e${player.name} §a添加到领地 §e${_land.name} §a成员中！`);
        useNotify('chat', player, `§a玩家 §e${pn} §a已成功被添加到领地 §e${_land.name} §a成员中！`);
      }
    }
  });
}
// 领地成员删除
export function openLandMemberDeleteForm(player, _land) {
  const form = new ModalFormData();
  form.title('领地成员删除');
  // const allPlayer = useGetAllPlayer()
  const allPlayerNames = _land.members;
  form.dropdown(color.white('选择玩家'), allPlayerNames);
  form.submitButton('确认');
  form.show(player).then(data => {
    const { formValues, cancelationReason } = data;
    if (cancelationReason === 'UserClosed') return;
    const selectPlayerName = allPlayerNames[Number(formValues?.[0])];
    if (selectPlayerName === _land.owner) {
      return openDialogForm(
        player,
        {
          title: '领地成员删除',
          desc: color.red('领地拥有者不能被移除！'),
        },
        () => {
          openLandMemberDeleteForm(player, _land);
        },
      );
    }
    if (selectPlayerName) {
      const targetPlayer = allPlayerNames.find(playerName => playerName === selectPlayerName);
      if (!targetPlayer)
        return openDialogForm(
          player,
          {
            title: '领地成员删除',
            desc: color.red('玩家不存在，请重新填写！'),
          },
          () => {
            openLandMemberDeleteForm(player, _land);
          },
        );
      const res = land.removeMember(_land.name, targetPlayer);
      if (typeof res === 'string') {
        openDialogForm(
          player,
          {
            title: '领地成员删除',
            desc: color.red(res),
          },
          () => {
            openLandMemberDeleteForm(player, _land);
          },
        );
      } else {
        useNotify('chat', player, `§a玩家 §e${targetPlayer} §a已成功被移除领地 §e${_land.name} §a成员！`);
      }
    } else {
      openDialogForm(
        player,
        {
          title: '领地成员删除',
          desc: color.red('表单未填写完整，请重新填写！'),
        },
        () => {
          openLandMemberDeleteForm(player, _land);
        },
      );
    }
  });
}
// 领地成员管理
function createLandMemberForm(land) {
  const form = new ActionFormData();
  form.title('领地成员管理');
  const body = useFormatListInfo([
    {
      title: '领地成员',
      desc: '领地成员列表',
      list: land.members,
    },
  ]);
  form.body(body);
  const buttons = [
    {
      text: '添加成员',
      icon: 'textures/ui/plus',
    },
    {
      text: '删除成员',
      icon: 'textures/ui/minus',
    },
    {
      text: '返回',
      icon: 'textures/ui/dialog_bubble_point',
    },
  ];
  buttons.forEach(button => {
    form.button(button.text, button.icon);
  });
  return form;
}
export function openLandMemberForm(player, land) {
  const form = createLandMemberForm(land);
  form.show(player).then(data => {
    switch (data.selection) {
      case 0:
        openLandMemberApplyForm(player, land);
        break;
      case 1:
        openLandMemberDeleteForm(player, land);
        break;
      case 2:
        openLandDetailForm(player, land);
        break;
    }
  });
}
// 删除领地
export function openLandDeleteForm(player, _land, isAdmin = false) {
  const form = new ActionFormData();
  form.title('删除领地');
  form.body(color.red('删除领地后不可恢复，请谨慎操作！'));
  form.button('确认', 'textures/ui/check');
  form.button('取消', 'textures/ui/cancel');
  form.show(player).then(data => {
    const { cancelationReason, selection } = data;
    if (cancelationReason === 'UserClosed') return;
    if (selection === 0) {
      const res = land.removeLand(_land.name);
      if (typeof res === 'string') {
        openDialogForm(
          player,
          {
            title: '删除领地',
            desc: color.red(res),
          },
          () => {
            openLandDetailForm(player, _land);
          },
        );
      } else {
        player.sendMessage(color.yellow(`领地 ${_land.name} 删除成功！`));
      }
    }
  });
}
// 领地转让
export function openLandTransferForm(player, _land) {
  const form = new ModalFormData();
  form.title('领地转让');
  const allPlayer = useGetAllPlayer();
  const allPlayerNames = allPlayer.map(player => player.name);
  form.dropdown(color.white('选择玩家'), allPlayerNames);
  form.submitButton('确认');
  form.show(player).then(data => {
    const { formValues, cancelationReason } = data;
    if (cancelationReason === 'UserClosed') return;
    const selectPlayerName = allPlayer[Number(formValues?.[0])].name;
    if (selectPlayerName) {
      const res = land.transferLand(_land.name, selectPlayerName);
      if (typeof res === 'string') {
        openDialogForm(
          player,
          {
            title: '领地转让失败',
            desc: color.red(res),
          },
          () => {
            openLandTransferForm(player, _land);
          },
        );
      } else {
        player.sendMessage(color.yellow(`领地 ${_land.name} 转让成功！`));
      }
    } else {
      openDialogForm(
        player,
        {
          title: '领地转让',
          desc: color.red('表单未填写完整，请重新填写！'),
        },
        () => {
          openLandTransferForm(player, _land);
        },
      );
    }
  });
}
// 领地公开权限的配置权限（只有领地主人可以配置）
export function openLandAuthConfigForm(player, _land) {
  const form = new ModalFormData();
  form.title('领地公开权限的配置权限');
  form.toggle(color.white('是否允许成员配置 破坏权限'), _land.config_public_auth.break);
  form.toggle(color.white('是否允许成员配置 放置权限'), _land.config_public_auth.place);
  form.toggle(color.white('使是否允许成员配置 功能性方块权限'), _land.config_public_auth.useBlock);
  form.toggle(color.white('是否允许成员配置 箱子是否公开'), _land.config_public_auth.isChestOpen);
  form.toggle(color.white('是否允许成员配置 按钮是否公开'), _land.config_public_auth.useButton ?? false);
  form.toggle(color.white('是否允许成员配置 实体是否允许交互'), _land.config_public_auth.useEntity);
  form.toggle(color.white('是否允许成员配置 爆炸'), _land.config_public_auth.explode);
  form.submitButton('确认');
  form.show(player).then(data => {
    const { formValues, cancelationReason } = data;
    if (cancelationReason === 'UserClosed') return;
    const config_public_auth = {
      break: formValues?.[0],
      place: formValues?.[1],
      useBlock: formValues?.[2],
      isChestOpen: formValues?.[3],
      useButton: formValues?.[4],
      useEntity: formValues?.[5],
      explode: formValues?.[6],
    };
    land.db.set(_land.name, {
      ..._land,
      config_public_auth,
    });
    openDialogForm(
      player,
      {
        title: '领地公开权限的配置权限',
        desc: color.green('领地公开权限的配置权限设置成功！'),
      },
      () => {
        openLandDetailForm(player, _land);
      },
    );
  });
}
// 领地详细与管理
export function openLandDetailForm(player, land, isAdmin = false) {
  const form = new ActionFormData();
  form.title('领地详细');
  const isOwner = land.owner === player.name;
  const buttons = [
    {
      text: '领地公开权限',
      icon: 'textures/ui/icon_multiplayer',
      action: () => openLandAuthForm(player, land),
    },
  ];
  if (isOwner || isAdmin) {
    const actions = [
      {
        text: '领地成员管理',
        icon: 'textures/ui/friend1_black_outline_2x',
        action: () => openLandMemberForm(player, land),
      },
      {
        text: '领地转让',
        icon: 'textures/ui/arrow_right',
        action: () => openLandTransferForm(player, land),
      },
      {
        text: '领地公开权限的配置权限',
        icon: 'textures/ui/arrow_right',
        action: () => openLandAuthConfigForm(player, land),
      },
      {
        text: '删除领地',
        icon: 'textures/ui/cancel',
        action: () => openLandDeleteForm(player, land, isAdmin),
      },
    ];
    buttons.push(...actions);
  }
  buttons.push({
    text: '返回',
    icon: 'textures/ui/dialog_bubble_point',
    action: () => openLandListForm(player, isAdmin),
  });
  buttons.forEach(button => {
    form.button(button.text, button.icon);
  });
  form.body(
    useFormatListInfo([
      {
        title: '领地信息',
        desc: '',
        list: [
          '领地名称: ' + color.yellow(land.name),
          '领地坐标: ' +
            color.yellow(
              land.vectors.start.x +
                ' ' +
                land.vectors.start.y +
                ' ' +
                land.vectors.start.z +
                ' -> ' +
                land.vectors.end.x +
                ' ' +
                land.vectors.end.y +
                ' ' +
                land.vectors.end.z,
            ),
        ],
      },
      { title: '领地主人', desc: land.owner, list: [] },
      { title: '领地成员', desc: land.members.join('、 '), list: [] },
    ]),
  );
  form.show(player).then(data => {
    if (data.canceled || data.cancelationReason) return;
    if (data.selection === null || data.selection === undefined) return;
    switch (data.selection) {
      default:
        buttons[data.selection].action();
        break;
    }
  });
}
// 创建领地列表表单
function createLandListForm() {
  const form = new ActionFormData();
  form.title('领地列表');
  form.body({
    rawtext: [
      {
        text: '',
      },
    ],
  });
  return form;
}
// 打开领地列表表单（同样显示自己为成员的领地，但去掉了转让、删除、配置公开权限配置权限，因为这些只有领地主人才可以）
export function openLandListForm(player, isAdmin = false, page = 1) {
  const form = createLandListForm();
  const ll = land.getLandList();
  const myLands = [];
  for (const key in ll) {
    const landData = ll[key];
    if (landData.owner === player.name || isAdmin || landData.members.includes(player.name)) {
      myLands.push(landData);
    }
  }
  if (myLands.length === 0) {
    openDialogForm(
      player,
      {
        title: '领地列表',
        desc: color.red('您还没有领地，请先创建领地！'),
      },
      () => {
        openLandManageForms(player);
      },
    );
  } else {
    const totalPages = Math.ceil(myLands.length / 10);
    const start = (page - 1) * 10;
    const end = start + 10;
    const currentPageLands = myLands.slice(start, end);
    currentPageLands.forEach(landData => {
      form.button(
        `${landData.name} ${isAdmin ? landData.owner : landData.owner === player.name ? '（个人领地）' : '（他人领地）'}`,
        'textures/ui/icon_new',
      );
    });
    form.body(`第 ${page} 页 / 共 ${totalPages} 页`);
    let previousButtonIndex = currentPageLands.length;
    let nextButtonIndex = currentPageLands.length;
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
      // 当前页的领地数量
      const currentPageLandsCount = currentPageLands.length;
      if (selectionIndex < currentPageLandsCount) {
        // 选择的是某个领地
        openLandDetailForm(player, currentPageLands[selectionIndex], isAdmin);
      } else if (selectionIndex === previousButtonIndex - 1 && page > 1) {
        // 选择的是“上一页”
        openLandListForm(player, isAdmin, page - 1);
      } else if (selectionIndex === nextButtonIndex - 1 && page < totalPages) {
        // 选择的是“下一页”
        openLandListForm(player, isAdmin, page + 1);
      } else if (selectionIndex === nextButtonIndex) {
        // 选择的是“返回”
        if (!isAdmin) openLandManageForms(player);
        else openLandManageForm(player);
      }
    });
  }
}
// 领地管理
function createLandManageForm() {
  const form = new ActionFormData();
  form.title('§w领地管理');
  const buttons = [
    {
      text: '§w领地列表',
      icon: 'textures/ui/Scaffolding',
    },
    {
      text: '§w领地申请',
      icon: 'textures/ui/warning_sad_steve',
    },
    {
      text: '§w返回',
      icon: 'textures/ui/dialog_bubble_point',
    },
  ];
  buttons.forEach(button => {
    form.button(button.text, button.icon);
  });
  return form;
}
// 打开领地管理表单
export function openLandManageForms(player) {
  const form = createLandManageForm();
  form.show(player).then(data => {
    switch (data.selection) {
      case 0:
        openLandListForm(player);
        break;
      case 1:
        openLandApplyForm(player);
        break;
      case 2:
        openServerMenuForm(player);
        break;
    }
  });
}
