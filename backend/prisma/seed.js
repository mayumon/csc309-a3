"use strict";

// Usage: node seed.js utorid email password
// That will be the data for the superuser

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function makePurchaseTransaction(
	utorid,
	spent,
	pointsEarned,
	remark,
	newPromotionIds,
	author
) {
	const newTransaction = await prisma.transaction.create({
		data: {
			utorid: utorid,
			type: "purchase",
			spent: spent,
			amount: pointsEarned,
			remark: remark,
			suspicious: false,
			promotionIds: {
				connect: newPromotionIds,
			},
			createdBy: author,
		},
	});
	return newTransaction;
}

async function makeAdjustmentTransaction(
	utorid,
	amount,
	relatedId,
	remark,
	newPromotionIds,
	author
) {
	const newTransaction = await prisma.transaction.create({
		data: {
			utorid: utorid,
			type: "adjustment",
			amount: amount,
			relatedId: relatedId,
			remark: remark,
			suspicious: false,
			promotionIds: {
				connect: newPromotionIds,
			},
			createdBy: author,
		},
	});
}

async function makeRedemptionTransaction(utorid, amount, remark) {
	const newTransaction = await prisma.transaction.create({
		data: {
			utorid: utorid,
			type: "redemption",
			amount: amount,
			remark: remark,
			createdBy: utorid,
		},
	});
}

async function makeTransferTransaction(utorid, amount, remark, relatedId) {
	const newTransaction = await prisma.transaction.create({
		data: {
			utorid: utorid,
			type: "transfer",
			amount: amount,
			remark: remark,
			relatedId: relatedId,
			createdBy: utorid,
		},
	});
}

async function makeEventTransaction(utorid, amount, eventId, author) {
	const [newTransaction, updatedEvent, updatedUser] = await prisma.$transaction(
		[
			prisma.transaction.create({
				data: {
					utorid: utorid,
					type: "event",
					amount: amount,
					relatedId: eventId,
					remark: "",
					createdBy: author,
				},
			}),
			prisma.event.update({
				where: { id: eventId },
				data: {
					pointsAwarded: {
						increment: amount,
					},
					pointsRemain: {
						decrement: amount,
					},
				},
			}),
			prisma.user.update({
				where: { utorid: utorid },
				data: {
					points: {
						increment: amount,
					},
				},
			}),
		]
	);
}

async function makeSuperUser(utorid, email, password) {
	const newUser = await prisma.user.create({
		data: {
			utorid: utorid,
			name: "superuser_" + utorid,
			email: email,
			password: password,
			role: "superuser",
			verified: true,
		},
	});

	return newUser;
}

async function makeUser(utorid, email, password, role) {
	const newUser = await prisma.user.create({
		data: {
			utorid: utorid,
			name: utorid,
			email: email,
			password: password,
			role: role,
		},
	});

	return newUser;
}

async function makePromotion(
	name,
	description,
	type,
	startTime,
	endTime,
	minSpending,
	rate,
	points
) {
	const newPromotion = await prisma.promotion.create({
		data: {
			name: name,
			description: description,
			type: type,
			startTime: new Date(startTime),
			endTime: new Date(endTime),
			minSpending: minSpending,
			rate: rate,
			points: points,
		},
	});

	return newPromotion;
}

async function makeEvent(
	name,
	description,
	location,
	startTime,
	endTime,
	capacity,
	pointsRemain,
	pointsAwarded,
	published,
	isFull
) {
	const newEvent = await prisma.event.create({
		data: {
			name: name,
			description: description,
			location: location,
			startTime: new Date(startTime),
			endTime: new Date(endTime),
			capacity: capacity,
			pointsRemain: pointsRemain,
			pointsAwarded: pointsAwarded,
			published: published,
			isFull: isFull,
		},
	});

	return newEvent;
}

async function connectUserPromotion(utorid, promotionId) {
	await prisma.user.update({
		where: {
			utorid: utorid,
		},
		data: {
			promotions: {
				connect: {
					id: promotionId,
				},
			},
		},
	});
}

async function connectUserOrganizer(utorid, eventId) {
	await prisma.user.update({
		where: {
			utorid: utorid,
		},
		data: {
			OrganizerTo: {
				connect: {
					id: eventId,
				},
			},
		},
	});
}

async function connectUserGuest(utorid, eventId) {
	await prisma.user.update({
		where: {
			utorid: utorid,
		},
		data: {
			GuestTo: {
				connect: {
					id: eventId,
				},
			},
		},
	});
}

async function mainStuff() {
	// Clear the database
	// TODO

	// Superuser
	var utorid = process.argv[2];
	var email = process.argv[3];
	var password = process.argv[4];

	if (!utorid || !email || !password) {
		throw new Error("Usage: node seed.js utorid email password");
	}

	const superuser = await makeSuperUser(utorid, email, password);
	var reguser;

	// Other users
	var utorid;
	var email;
	var password;

	for (let i = 1; i <= 5; i++) {
		utorid = "rguser0" + i.toString();
		email = "regemail" + i.toString() + "@mail.utoronto.ca";
		password = "Reg123!";

		if (i === 1) {
			reguser = await makeUser(utorid, email, password, "regular");
		} else {
			makeUser(utorid, email, password, "regular");
		}

		utorid = "causer0" + i.toString();
		email = "cashemail" + i.toString() + "@mail.utoronto.ca";
		password = "Cash123!";
		makeUser(utorid, email, password, "cashier");

		utorid = "mnuser0" + i.toString();
		email = "mangemail" + i.toString() + "@mail.utoronto.ca";
		password = "Mang123!";
		makeUser(utorid, email, password, "manager");
	}

	// Promotions
	var name;
	var description;
	var type;
	var startTime;
	var endTime;
	var progress;
	var minSpending;
	var rate;
	var points;
	var promotion;

	for (let i = 1; i <= 6; i++) {
		if (i <= 2) {
			startTime = "2025-04-01T09:00:00Z";
			endTime = "2025-04-02T09:00:00Z";
			progress = " (over)";
		} else if (i <= 4) {
			startTime = "2025-04-01T09:00:00Z";
			endTime = "2025-04-30T09:00:00Z";
			progress = " (in progress)";
		} else {
			startTime = "2025-04-29T09:00:00Z";
			endTime = "2025-04-30T09:00:00Z";
			progress = " (not started)";
		}

		name = "Automatic Promotion " + i.toString();
		description = "An automatic promotion" + progress;
		type = "automatic";

		minSpending = 0;
		rate = 0.01;
		points = 10;

		promotion = await makePromotion(
			name,
			description,
			type,
			startTime,
			endTime,
			minSpending,
			rate,
			points
		);
		connectUserPromotion(superuser.utorid, promotion.id);
		connectUserPromotion(reguser.utorid, promotion.id);

		name = "One-Time Promotion " + i.toString();
		description = "A one-time promotion" + progress;
		type = "one-time";

		promotion = await makePromotion(
			name,
			description,
			type,
			startTime,
			endTime,
			minSpending,
			rate,
			points
		);
		connectUserPromotion(superuser.utorid, promotion.id);
		connectUserPromotion(reguser.utorid, promotion.id);
	}

	// Events
	var name;
	var description;
	var location;
	var startTime;
	var endTime;
	var capacity;
	var pointsRemain;
	var pointsAwarded;
	var published;
	var isFull;
	var event;

	for (var i = 1; i <= 6; i++) {
		name = "Event " + i.toString();

		if (i <= 2) {
			startTime = "2025-04-01T09:00:00Z";
			endTime = "2025-04-02T09:00:00Z";
			description = "Over, ";
		} else if (i <= 4) {
			startTime = "2025-04-01T09:00:00Z";
			endTime = "2025-04-30T09:00:00Z";
			description = "Ongoing, ";
		} else {
			startTime = "2025-04-29T09:00:00Z";
			endTime = "2025-04-30T09:00:00Z";
			description = "Future, ";
		}

		if (i % 2 === 0) {
			location = "BA 1130";
		} else {
			location = "MY 150";
		}

		if (i % 3 === 1) {
			capacity = 1;
			description += "full, ";
			isFull = true;
		} else if (i % 3 === 2) {
			capacity = null;
			description += "no capacity, ";
			isFull = false;
		} else {
			capacity = 100;
			description += "not full, ";
			isFull = false;
		}

		if (i >= 5) {
			pointsRemain = 500;
			pointsAwarded = 0;
			description += "no points given, ";
		} else if (i % 2 === 1) {
			pointsRemain = 200;
			pointsAwarded = 200;
			description += "some points given, ";
		} else {
			pointsRemain = 0;
			pointsAwarded = 300;
			description += "all points given, ";
		}

		if (i === 6) {
			published = false;
			description += "not published";
		} else {
			published = true;
			description += "published";
		}

		event = await makeEvent(
			name,
			description,
			location,
			startTime,
			endTime,
			capacity,
			pointsRemain,
			pointsAwarded,
			published,
			isFull
		);

		if (i === 1 || i === 4) {
			connectUserGuest(reguser.utorid, event.id);
		} else {
			connectUserOrganizer(reguser.utorid, event.id);
		}

		if (i === 2 || i === 3) {
			connectUserGuest(superuser.utorid, event.id);
		}
	}

	// Transactions
	for (let utoridPre of ["rguser0", "causer0", "mnuser0"]) {
		for (let i = 1; i <= 5; i++) {
			let utorid = utoridPre + i.toString();
			let spent = 80.0 + i * 5;
			const newTransaction = makePurchaseTransaction(
				utorid,
				spent,
				spent / 0.25,
				"item " + i + " purchased",
				[],
				superuser.utorid
			);
			if (i === 2 && i === 4) {
				makeAdjustmentTransaction(
					utorid,
					-5,
					newTransaction.id,
					"adjust transaction id: " + newTransaction.id,
					[],
					superuser.utorid
				);
				makeAdjustmentTransaction(
					utorid,
					5,
					newTransaction.id,
					"adjust transaction id: " + newTransaction.id,
					[],
					superuser.utorid
				);
			}

			makePurchaseTransaction(
				utorid,
				spent,
				spent / 0.25 + spent / 0.1 + 10,
				"item " + i + " purchased with promo",
				[{ id: 1 }],
				superuser.utorid
			);

			makeRedemptionTransaction(utorid, 10, "");
		}
	}

	makeEventTransaction("rguser01", 2, 1, superuser.utorid);
	makeEventTransaction("rguser01", 2, 1, superuser.utorid);

	for (var i = 1; i <= 6; i++) {
		if (i % 2 === 1) {
			var utorid = superuser.utorid;
			var relatedId = reguser.id;
		} else {
			var utorid = reguser.utorid;
			var relatedId = superuser.id;
		}

		var remark = "Transfer " + i.toString();
		var amount = i * 10;

		makeTransferTransaction(utorid, amount, remark, relatedId);
	}
}

mainStuff();
