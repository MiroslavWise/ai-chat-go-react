import { Controller, useForm, type Resolver } from "react-hook-form"

import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"

import { resolverMessage, type MessageSchema } from "~/schemas/message"

function FormSendMessage() {
  const { control } = useForm<MessageSchema>({
    resolver: resolverMessage as Resolver<MessageSchema>,
    defaultValues: {
      content: "",
    },
  })

  return (
    <form className="w-full relative h-90 p-2 border-t border-border mt-auto">
      <Controller
        control={control}
        name="content"
        render={({ field, fieldState: { error } }) => (
          <Textarea placeholder="Send a message" className="w-full h-full resize-none" {...field} aria-invalid={!!error} />
        )}
      />
      <Button variant="outline" size="icon" type="submit" className="absolute right-4 bottom-4"></Button>
    </form>
  )
}

FormSendMessage.displayName = "FormSendMessage"
export default FormSendMessage
