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


    .post("/login", async ({body}) => {
        // Get user
        let user = await database.user.findFirst({
            where: {
                username: body.username
            }
        })

        // Check if user exists
        if (!user) {
            return {
                status: "error",
                message: "User not found"
            }
        }

        // Validate password
        const isPasswordCorrect = await bcrypt.compare(body.password, user.password)
        if (!isPasswordCorrect) {
            return {
                status: "error",
                message: "Invalid password"
            }
        }


        // Create new token
        user = await database.user.update({
            where: {
                id: user.id
            },
            data: {
                token: crypto.randomBytes(64).toString('base64url')
            }
        })


        // Return user and token
        return {
            user: userDTO(user),
            token: user.token // <-- send updated token
        }
    }, {
        body: loginBody
    })