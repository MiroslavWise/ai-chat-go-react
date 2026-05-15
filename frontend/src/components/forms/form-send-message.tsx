import { useState } from "react"
import { Controller, useForm, type Resolver } from "react-hook-form"

import { Button } from "../ui/button"
import { Textarea } from "../ui/textarea"

import { resolverMessage, type MessageSchema } from "~/schemas/message"

function FormSendMessage() {
  const [isLoading, setIsLoading] = useState(false)

  const { control, handleSubmit } = useForm<MessageSchema>({
    resolver: resolverMessage as Resolver<MessageSchema>,
    defaultValues: {
      content: "",
    },
  })

  const onSubmit = handleSubmit(async (data) => {
    if (isLoading) return
    setIsLoading(true)
    console.log(data)
    setIsLoading(false)
  })

  return (
    <form onSubmit={onSubmit} className="w-full relative h-90 p-2 border-t border-border mt-auto">
      <Controller
        control={control}
        name="content"
        render={({ field, fieldState: { error } }) => (
          <Textarea placeholder="Send a message" className="w-full h-full resize-none" {...field} aria-invalid={!!error} />
        )}
      />
      <Button disabled={isLoading} variant="outline" size="icon" type="submit" className="absolute right-4 bottom-4">
        Отправить
      </Button>
    </form>
  )
}

FormSendMessage.displayName = "FormSendMessage"
export default FormSendMessage
