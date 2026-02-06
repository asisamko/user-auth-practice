import { User } from '../../../generated/prisma/client';

export const userDTO = (user: User) => {
    return {
        id: user.id,
        username: user.username
    }
}