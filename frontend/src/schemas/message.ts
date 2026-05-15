import * as yup from "yup"
import { yupResolver } from "@hookform/resolvers/yup"

const messageSchema = yup.object({
    content: yup.string().min(2, "Message must be at least 2 characters long").max(1000, "Message must be less than 1000 characters long").default(""),
})

export type MessageSchema = yup.InferType<typeof messageSchema>
export const resolverMessage = yupResolver(messageSchema)