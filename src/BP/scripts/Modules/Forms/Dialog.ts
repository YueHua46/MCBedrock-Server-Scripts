import { ActionFormData } from '@minecraft/server-ui'
import { Player } from '@minecraft/server'

function createErrorForm(title: string, body: string) {
  const form = new ActionFormData()
  form.title(title)
  form.body(body)
  form.button('返回')
  return form
}

function openDialogForm(player: Player, err: { title: string; desc: string }, cb?: () => void) {
  const form = createErrorForm(err.title, err.desc)
  form.show(player).then(() => {
    cb && cb()
  })
}

export { openDialogForm }
