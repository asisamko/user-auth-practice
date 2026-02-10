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
    email: t.String({
        format: "email"
    })
})

export const loginBody = t.Object({
    username: t.String(),
    password: t.String()
})