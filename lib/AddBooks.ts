import {PrismaClient} from '@prisma/client'

const prisma = new PrismaClient()

export type Book = {
    title: string,
    link: string,
    price: number,
}

export const addBook = async ({title, price, link}: Book) => {
    await prisma.book.create({
        data: {
            title,
            price,
            link
        }
    }).then(async () => {
        await prisma.$disconnect()
    }).catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
}

