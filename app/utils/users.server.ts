import { Profile } from '@prisma/client';
import { prisma } from './prisma.server';
import { RegisterForm } from './types.server';
import bcrypt from 'bcryptjs';

export const createUser = async (user: RegisterForm) => {
    const passwordHash = await bcrypt.hash(user.password, 10)
    const newUser = await prisma.user.create({
        data: {
            email: user.email,
            password: passwordHash,
            profile: {
                firstName: user.firstName,
                lastName: user.lastName
            },
        },
    })
    return { id: newUser.id, email: user.email }
}

export const getOtherUsers = async (userId: string) => {
    return await prisma.user.findMany({
        where: {
            id: {not: userId}
        },
        orderBy: {
            profile: {
                firstName: 'asc'
            },
        },
    })
}

export const getUserById = async (userId: string) => {
    return await prisma.user.findUnique({
        where: { id: userId }
    });
}

export const updateUser = async (userId: string, email: string, profile: Partial<Profile>) => {
    await prisma.user.update({
        where: {
            id: userId
        },
        data: {
            profile: {
                update: profile,
            },
            email: email
        }
    })
}

export const deleteUser = async (userId: string) => {
    await prisma.user.delete({
        where: {
            id: userId
        }
    })
}