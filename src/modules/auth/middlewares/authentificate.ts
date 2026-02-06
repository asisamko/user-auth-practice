import { Elysia } from "elysia";
import { PrismaClient } from "../../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const database = new PrismaClient({ adapter })

export const authentificateMiddleware = new Elysia()
    .derive({as: 'scoped'}, async ({headers}) => {
        const authUser = headers.authorization;

        if (!authUser) {
            throw new Error("Authorization header missing")
        }

        const token = authUser.substring(7)

        const user = await database.user.findFirst({
            where: {
                token: token
            }
        })

        if (!user) {
            throw new Error("Unauthorized")
        }

        return {user}
    })