import {Elysia, t} from "elysia";
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt"
import crypto from "crypto"

import { registerBody, loginBody } from "./model";
import { userDTO } from "./dto/user";
import { authentificateMiddleware } from "./middlewares/authentificate";

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
                email: body.email,
                token: crypto.randomBytes(64).toString('base64url')
            }
        })
        return {
            status: "success",
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
            status: "success",
            user: userDTO(user),
            token: user.token
        }
    }, {
        body: loginBody
    })

    .use(authentificateMiddleware)
    .post("/logout", async ({user}) => {

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
