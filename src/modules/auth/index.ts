import {Elysia, t} from "elysia";
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt"
import crypto from "crypto"

import { registerBody, loginBody } from "./model";
import { userDTO } from "./dto/user";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const database = new PrismaClient({ adapter })

export const auth = new Elysia({prefix: "/auth"})
    .post("/register", async ({body}) => {
        const existingUser = await database.user.findFirst({
            where: {
                username: body.username
            }
        })

        if (existingUser) {
            return {
                status: "error",
                message: "User already exists"
            }
        }

        const hashedPasswrd = await bcrypt.hash(body.password, 12)

        const user = await database.user.create({
            data: {
                username: body.username,
                password: hashedPasswrd,
                token: crypto.randomBytes(64).toString('base64url')
            }
        })
        return {
            user: userDTO(user),
            token: user.token}
    }, {
        body: registerBody
    })


    // login endpoint
    .post("/login", async ({body}) => {
        // Get user
        let user = await database.user.findFirst({
            where: {
                username: body.username
            }
        })

        if (!user) {
            return {
                status: "error",
                message: "User not found"
            }
        }

        // compare entered password in db and enetered password
        const isPasswordCorrect = await bcrypt.compare(body.password, user.password)
        if (!isPasswordCorrect) {
            return {
                status: "error",
                message: "Invalid password"
            }
        }

        // updates user's token in db
        user = await database.user.update({
            where: {
                id: user.id
            },
            data: {
                token: crypto.randomBytes(64).toString('base64url')
            }
        })

        // return token and username
        return {
            user: userDTO(user),
            token: user.token
        }
    }, {
        body: loginBody
    })

    .post("/logout", async ({headers}) => {
        const authHeader = headers.authorization;

        if (!authHeader) {
            return {
                status: "error",
                message: "Authorization header missing"
            }
        }

        const token = authHeader.substring(7)

        const user = await database.user.findFirst({
            where: {
                token: token
            }
        })

        if (!user) {
            return {
                status: "error",
                message: "Unauthorized"
            }
        }

        await database.user.update({
            where: {
                id: user.id
            },
            data: {
                token: null
            }
        })

        return {
            status: "success",
            message: "Logout successful"
        }
    })

    .get("/profile", async ({headers}) => {
        const authHeader = headers.authorization;

        if (!authHeader) {
            return {
                status: "error",
                message: "Authorization header missing"
            }
        }

        const token = authHeader.substring(7)

        const user = await database.user.findFirst({
            where: {
                token: token
            }
        })

        if (!user) {
            return {
                status: "error",
                message: "Unauthorized"
            }
        }

        return {
            user: userDTO(user)
        }
    })