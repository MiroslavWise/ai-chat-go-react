import * as yup from "yup"
import { yupResolver } from "@hookform/resolvers/yup"

export type MessageSchema = {
  content: string
}

export const messageSchema: yup.ObjectSchema<MessageSchema> = yup.object({
  content: yup
    .string()
    .trim()
    .min(2, "Message must be at least 2 characters long")
    .max(1000, "Message must be less than 1000 characters long")
    .required(),
})

export const resolverMessage = yupResolver(messageSchema)