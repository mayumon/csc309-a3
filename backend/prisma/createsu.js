'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const utorid = process.argv[2]
const email = process.argv[3]
const password = process.argv[4]

makeSuperUser(utorid, email, password);

async function makeSuperUser(utorid, email, password) {
    const newUser = await prisma.user.create({
        data: {
            utorid: utorid,
            name: "superuser",
            email: email,
            password: password,
            role: "superuser",
            verified: true
        }
    });
}