import { DialogSelect } from "@tui/ui/dialog-select"
import { useRoute } from "@tui/context/route"

export function DialogSubagent(props: { sessionID: string }) {
  const route = useRoute()

  return (
    <DialogSelect
      title="Ações do Subagente"
      options={[
        {
          title: "Abrir",
          value: "subagent.view",
          description: "a sessão do subagente",
          onSelect: (dialog) => {
            route.navigate({
              type: "session",
              sessionID: props.sessionID,
            })
            dialog.clear()
          },
        },
      ]}
    />
  )
}
