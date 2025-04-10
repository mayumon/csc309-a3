'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


for (let i = 1; i <= 32; i++) {
    if (i < 10) {
        var utorid = "rguser0" + i.toString();
    } else {
        var utorid = "rguser" + i.toString();
    }

    var email = "regemail" + i.toString() + "@mail.utoronto.ca";
    var password = "Reg123!";

    makeUser(utorid, email, password);

    if (i < 10) {
        var utorid = "causer0" + i.toString();
    } else {
        var utorid = "causer" + i.toString();
    }

    var email = "cashemail" + i.toString() + "@mail.utoronto.ca";
    var password = "Cash123!";
    makeCashier(utorid, email, password);

    if (i < 10) {
        var utorid = "mnuser0" + i.toString();
    } else {
        var utorid = "mnuser" + i.toString();
    }

    var email = "mangemail" + i.toString() + "@mail.utoronto.ca";
    var password = "Mang123!";
    makeManager(utorid, email, password);

}

async function makeUser(utorid, email, password) {
    const newUser = await prisma.user.create({
        data: {
            utorid: utorid,
            name: "user",
            email: email,
            password: password,
            role: "regular"
        }
    });
}

async function makeCashier(utorid, email, password) {
    const newUser = await prisma.user.create({
        data: {
            utorid: utorid,
            name: "cashier",
            email: email,
            password: password,
            role: "cashier"
        }
    });
}

async function makeManager(utorid, email, password) {
    const newUser = await prisma.user.create({
        data: {
            utorid: utorid,
            name: "manager",
            email: email,
            password: password,
            role: "manager"
        }
    });
}