'use strict';

// Usage: node seed.js utordid email password
// That will be the data for the superuser

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

var utorid = process.argv[2];
var email = process.argv[3];
var password = process.argv[4];

makeSuperUser(utorid, email, password);

for (let i = 1; i <= 5; i++) {
    var utorid = "rguser0" + i.toString();
    var email = "regemail" + i.toString() + "@mail.utoronto.ca";
    var password = "Reg123!";
    makeUser(utorid, email, password, "regular");

    var utorid = "causer0" + i.toString();
    var email = "cashemail" + i.toString() + "@mail.utoronto.ca";
    var password = "Cash123!";
    makeUser(utorid, email, password, "cashier");

    var utorid = "mnuser0" + i.toString();
    var email = "mangemail" + i.toString() + "@mail.utoronto.ca";
    var password = "Mang123!";
    makeUser(utorid, email, password, "manager");

}

for (let i = 1; i <= 6; i++) {
    if(i <= 2) {
        var startTime = "2025-04-01T09:00:00Z";
        var endTime = "2025-04-02T09:00:00Z";
        var progress = " (over)";
    }
    else if(i <= 4) {
        var startTime = "2025-04-01T09:00:00Z";
        var endTime = "2025-04-30T09:00:00Z";
        var progress = " (in progress)";
    }
    else {
        var startTime = "2025-04-29T09:00:00Z";
        var endTime = "2025-04-30T09:00:00Z";
        var progress = " (not started)";
    }

    var name = "Automatic Promotion " + i.toString();
    var description = "An automatic promotion" + progress;
    var type = "automatic";

    var minSpending = 0;
    var rate = 0.01;
    var points = 10;

    await makePromotion(name, description, type, startTime, endTime, minSpending, rate, points);

    var name = "One-Time Promotion " + i.toString();
    var description = "A one-time promotion" + progress;
    var type = "one-time";

    await makePromotion(name, description, type, startTime, endTime, minSpending, rate, points);
}

async function makeUser(utorid, email, password, role) {
    const newUser = await prisma.user.create({
        data: {
            utorid: utorid,
            name: utorid,
            email: email,
            password: password,
            role: role
        }
    });
}

async function makeSuperUser(utorid, email, password) {
    const newUser = await prisma.user.create({
        data: {
            utorid: utorid,
            name: "superuser_" + utorid,
            email: email,
            password: password,
            role: "superuser",
            verified: true
        }
    });
}

async function makePromotion(name, description, type, startTime, endTime, minSpending, rate, points) {
    const data = {
        name: name,
        description: description,
        type: type,
        startTime: startTime,
        endTime: endTime
    };

    if(minSpending !== null) {
        data.minSpending = minSpending;
    }

    if(rate !== null) {
        data.rate = rate;
    }

    if(points !== null) {
        data.points = points;
    }
    
    const newPromotion = await prisma.promotion.create({
        data: data
    });
}