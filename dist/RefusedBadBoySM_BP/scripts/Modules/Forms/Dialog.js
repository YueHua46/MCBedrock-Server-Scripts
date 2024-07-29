import { ActionFormData } from '@minecraft/server-ui';
function createErrorForm(title, body) {
  const form = new ActionFormData();
  form.title(title);
  form.body(body);
  form.button('返回');
  return form;
}
function openDialogForm(player, err, cb) {
  const form = createErrorForm(err.title, err.desc);
  form.show(player).then(() => {
    cb && cb();
  });
}
export { openDialogForm };
