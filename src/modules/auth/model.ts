import { t } from "elysia"

export const registerBody = t.Object({
    username: t.String({
        minLength: 3,
        maxLength: 120
    }),
    password: t.String({
        minLength: 3,
        maxLength: 120
    }),
})

export const loginBody = t.Object({
    username: t.String(),
    password: t.String()
})