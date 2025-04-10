const express = require("express");
const router = express.Router();
const {
	errorMessage,
	clearanceList,
	isPresentInvalidFields,
	formatTransactionForSelf,
	tryCatchWrapper,
} = require("./../util/Util");
const { PrismaClient } = require("@prisma/client");
// const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();
var { expressjwt: jwt } = require("express-jwt");

const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const upload = multer({ dest: "uploads/avatars/" });

const SECRETKEY = process.env.SECRETKEY;

router
	.route("/")
	.post(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			if (!clearanceList("cashier").includes(req.auth.role)) {
				return res.status(403).json(errorMessage("Forbidden"));
			}

			if (isPresentInvalidFields(req.body, ["utorid", "name", "email"])) {
				return res
					.status(400)
					.json(errorMessage("Invalid Fields not allowed."));
			}

			const { utorid, name, email } = req.body;
			if (
				!utorid ||
				!name ||
				!email ||
				!email.endsWith("@mail.utoronto.ca") ||
				name.length < 1 ||
				name.length > 50
			) {
				return res.status(400).json(errorMessage("Request Body is Invalid."));
			}

			let regEx = /^[a-z0-9]+$/i;
			let valid = regEx.test(utorid);
			if (!valid || utorid.length !== 8) {
				return res.status(400).json(errorMessage("Request Body is Invalid."));
			}

			const userWithUtorId = await prisma.user.findUnique({
				where: { utorid: utorid },
			});
			if (userWithUtorId) {
				return res.status(409).json(errorMessage("UtorId already exists."));
			}
			const userWithEmail = await prisma.user.findUnique({
				where: { email: email },
			});
			if (userWithEmail) {
				return res.status(409).json(errorMessage("Email already exists."));
			}

			const newUser = await prisma.user.create({
				data: { utorid: utorid, name: name, email: email },
			});
			var now = new Date();
			now.setDate(now.getDate() + 7);

			const newResetToken = await prisma.resetToken.create({
				data: {
					token: uuidv4(),
					utorid: utorid,
					expiresAt: now,
				},
			});
			return res.status(201).json({
				id: newUser.id,
				utorid: newUser.utorid,
				name: newUser.name,
				email: newUser.email,
				verified: newUser.verified,
				expiresAt: newResetToken.expiresAt,
				resetToken: newResetToken.token,
			});
		})
	)
	.get(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			if (!clearanceList("manager").includes(req.auth.role)) {
				return res.status(403).json(errorMessage("Forbidden"));
			}

			if (
				isPresentInvalidFields(req.query, [
					"name",
					"role",
					"verified",
					"activated",
					"page",
					"limit",
				])
			) {
				return res
					.status(400)
					.json(errorMessage("Invalid Fields not allowed."));
			}

			var { name, role, verified, activated, page = 1, limit = 10 } = req.query;

			if (role && !clearanceList("any").includes(role)) {
				return res.status(400).json(errorMessage("Role is invalid."));
			}
			if (verified) {
				if (!(verified === "true" || verified === "false")) {
					return res.status(400).json(errorMessage("Verified is invalid."));
				}
				verified = verified === "true";
			}

			if (activated) {
				if (!(activated === "true" || activated === "false")) {
					return res.status(400).json(errorMessage("Verified is invalid."));
				}
				activated = activated === "true";
			}

			if (page) {
				if (isNaN(page)) {
					return res.status(400).json(errorMessage("page is invalid."));
				}
				if (page <= 0) {
					return res.status(400).json(errorMessage("page is invalid."));
				}
				page = parseInt(page);
			}

			if (limit) {
				if (isNaN(limit)) {
					return res.status(400).json(errorMessage("limit is invalid."));
				}
				if (page < 0) {
					return res.status(400).json(errorMessage("limit is invalid."));
				}
				limit = parseInt(limit);
			}

			if (!name && !role && verified === undefined && activated === undefined) {
				var orConditions = [];
			} else {
				var orConditions = [
					{
						...(name !== undefined && { name: name }),
						...(role !== undefined && { role: role }),
						...(verified !== undefined && { verified: verified }),
						...(activated !== undefined && {
							lastLogin: activated ? { not: null } : null,
						}),
					},
					{
						...(name !== undefined && { utorid: name }),
						...(role !== undefined && { role: role }),
						...(verified !== undefined && { verified: verified }),
						...(activated !== undefined && {
							lastLogin: activated ? { not: null } : null,
						}),
					},
				];
			}

			const count = await prisma.user.count({
				where: orConditions.length > 0 ? { OR: orConditions } : {},
			});

			const results = await prisma.user.findMany({
				where: orConditions.length > 0 ? { OR: orConditions } : {},
				select: {
					id: true,
					utorid: true,
					name: true,
					email: true,
					birthday: true,
					role: true,
					points: true,
					createdAt: true,
					lastLogin: true,
					verified: true,
					avatarUrl: true,
				},
				skip: (page - 1) * limit,
				take: limit,
			});

			return res.status(200).json({ count: count, results: results });
		})
	)
	.all((req, res) => res.status(405).json(errorMessage("Method Not Allowed")));

router
	.route("/me")
	.get(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			if (!clearanceList("regular").includes(req.auth.role)) {
				return res.status(403).json(errorMessage("Forbidden"));
			}
			const utorid = req.auth.utorid;

			const user = await prisma.user.findUnique({
				where: { utorid: utorid },
				omit: {
					password: true,
				},
				include: {
					promotions: {
						select: {
							id: true,
							name: true,
							minSpending: true,
							rate: true,
							points: true,
						},
					},
				},
			});

			return res.status(200).json(user);
		})
	)
	.patch(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		upload.single("avatar"),
		tryCatchWrapper(async (req, res, next) => {
			if (!clearanceList("regular").includes(req.auth.role)) {
				return res.status(403).json(errorMessage("Forbidden"));
			}
			const utorid = req.auth.utorid;

			if (
				isPresentInvalidFields(req.body, [
					"name",
					"email",
					"birthday",
					"avatar",
				])
			) {
				return res
					.status(400)
					.json(errorMessage("Invalid Fields not allowed."));
			}

			var { name, email, birthday } = req.body;
			var avatar = req.file;

			if (!name && !email && !birthday && !avatar) {
				return res.status(400).json(errorMessage("Empty payload."));
			}

			if (name != undefined) {
				if (name.length < 1 || name.length > 50) {
					return res.status(400).json(errorMessage("name is invalid."));
				}
			}
			if (email != undefined) {
				if (!email.endsWith("@mail.utoronto.ca")) {
					return res.status(400).json(errorMessage("Email is invalid."));
				}

				const emailUser = await prisma.user.findUnique({
					where: { email: email },
				});
				if (emailUser && emailUser.utorid !== utorid) {
					return res.status(400).json(errorMessage("Email already in use."));
				}
			}
			if (birthday != undefined) {
				const birthdayRegex = /^\d{4}-\d{2}-\d{2}$/;
				if (!birthdayRegex.test(birthday)) {
					return res.status(400).json(errorMessage("Birthday is invalid"));
				}

				let dateBirthday = new Date(birthday.replaceAll("-", "/"));
				let [year, month, day] = birthday.split("-").map(Number);

				if (
					!(
						dateBirthday.getFullYear() === year &&
						dateBirthday.getMonth() + 1 === month &&
						dateBirthday.getDate() === day
					)
				) {
					return res.status(400).json(errorMessage("Birthday is invalid"));
				}
			}

			const updatedUser = await prisma.user.update({
				where: {
					utorid: utorid,
				},
				omit: {
					password: true,
					suspicious: true,
					promotions: true,
				},
				data: {
					...(email != undefined && { email: email }),
					...(name != undefined && { name: name }),
					...(birthday != undefined && { birthday: birthday }),
					...(avatar != undefined && { avatarUrl: avatar.path }),
				},
			});
			return res.status(200).json(updatedUser);
		})
	)
	.all((req, res) => res.status(405).json(errorMessage("Method Not Allowed")));

router
	.route("/me/password")
	.patch(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			if (!clearanceList("regular").includes(req.auth.role)) {
				return res.status(403).json(errorMessage("Forbidden"));
			}
			const utorid = req.auth.utorid;

			if (isPresentInvalidFields(req.body, ["old", "new"])) {
				return res
					.status(400)
					.json(errorMessage("Invalid Fields not allowed."));
			}
			const oldPass = req.body.old;
			const newPass = req.body.new;

			if (!oldPass || !newPass) {
				return res.status(400).json(errorMessage("Bad Request"));
			}

			const passwordRegex =
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,20}$/;
			if (!passwordRegex.test(newPass)) {
				return res.status(400).json(errorMessage("Password not allowed."));
			}

			const user = await prisma.user.findUnique({
				where: { utorid: utorid },
				select: { password: true },
			});
			if (user.password !== oldPass) {
				return res.status(403).json(errorMessage("Forbidden"));
			}

			const updatedUser = await prisma.user.update({
				where: { utorid: utorid },
				data: { password: newPass },
			});
			return res.status(200).send();
		})
	)
	.all((req, res) => res.status(405).json(errorMessage("Method Not Allowed")));

router
	.route("/me/transactions")
	.post(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			if (!clearanceList("regular").includes(req.auth.role)) {
				return res.status(403).json(errorMessage("Forbidden"));
			}

			if (isPresentInvalidFields(req.body, ["type", "amount", "remark"])) {
				return res
					.status(400)
					.json(errorMessage("Invalid Fields not allowed."));
			}

			var { type, amount, remark } = req.body;

			if (!type) {
				return res.status(400).json(errorMessage("Bad Request."));
			}
			if (type !== "redemption") {
				return res.status(400).json(errorMessage("Invalid Type."));
			}
			if (amount && isNaN(amount)) {
				return res.status(400).json(errorMessage("Invalid amount."));
			}
			amount = parseInt(amount);
			if (amount < 0) {
				return res.status(400).json(errorMessage("Amount must be positive."));
			}

			const currentUser = await prisma.user.findUnique({
				where: { utorid: req.auth.utorid },
				select: { id: true, points: true, verified: true },
			});
			if (!currentUser.verified) {
				return res.status(403).json(errorMessage("Forbidden not verified"));
			}
			if (currentUser.points < amount) {
				return res.status(400).json(errorMessage("Not enough points"));
			}

			const newTransaction = await prisma.transaction.create({
				data: {
					utorid: req.auth.utorid,
					type: type,
					amount: -1 * amount,
					...(remark !== undefined && { remark: remark }),
					createdBy: req.auth.utorid,
				},
			});

			return res.status(201).json({
				id: newTransaction.id,
				utorid: newTransaction.utorid,
				type: newTransaction.type,
				processedBy: newTransaction.relatedId,
				amount: -1 * newTransaction.amount,
				remark: newTransaction.remark,
				createdBy: newTransaction.createdBy,
			});
		})
	)
	.get(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			if (!clearanceList("regular").includes(req.auth.role)) {
				return res.status(403).json(errorMessage("Forbidden"));
			}

			if (
				isPresentInvalidFields(req.query, [
					"type",
					"relatedId",
					"promotionId",
					"amount",
					"operator",
					"page",
					"limit",
				])
			) {
				return res
					.status(400)
					.json(errorMessage("Invalid Fields not allowed."));
			}

			var {
				type,
				relatedId,
				promotionId,
				amount,
				operator,
				page = 1,
				limit = 10,
			} = req.query;

			if (relatedId && !type) {
				return res
					.status(400)
					.json(errorMessage("RelatedId must be used with type."));
			}

			if (amount && !operator) {
				return res
					.status(400)
					.json(errorMessage("Amount must be used with operator."));
			}
			var amountObj = { amount: amount };
			if (operator) {
				if (operator === "gte") {
					amountObj = { amount: { gte: amount } };
				} else if (operator === "lte") {
					amountObj = { amount: { lte: amount } };
				} else {
					return res.status(400).json(errorMessage("Operator is invalid."));
				}
			}
			if (page) {
				if (isNaN(page)) {
					return res.status(400).json(errorMessage("page is invalid."));
				}
				page = parseInt(page);
			}
			if (limit) {
				if (isNaN(limit)) {
					return res.status(400).json(errorMessage("limit is invalid."));
				}
				limit = parseInt(limit);
			}
			var results = await prisma.transaction.findMany({
				orderBy: {
					id: "desc",
				},
				where: {
					utorid: req.auth.utorid,
					...(promotionId !== undefined && {
						promotionIds: {
							some: {
								id: promotionId,
							},
						},
					}),
					...(type !== undefined && { type: type }),
					...(relatedId !== undefined && { relatedId: relatedId }),
					...(amount !== undefined && amountObj),
				},
				include: {
					promotionIds: true,
				},
				skip: (page - 1) * limit,
				take: limit,
			});

			let formattedResults = results.map(formatTransactionForSelf);
			return res
				.status(200)
				.json({ count: formattedResults.length, results: formattedResults });
		})
	)
	.all((req, res) => res.status(405).json(errorMessage("Method Not Allowed")));
router
	.route("/:userId/transactions")
	.post(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			if (!clearanceList("regular").includes(req.auth.role)) {
				return res.status(403).json(errorMessage("Forbidden"));
			}

			const userIdParam = req.params.userId;
			if (isNaN(userIdParam)) {
				return res.status(400).json(errorMessage("Invalid user Id."));
			}
			const userId = parseInt(userIdParam);

			if (isPresentInvalidFields(req.body, ["type", "amount", "remark"])) {
				return res
					.status(400)
					.json(errorMessage("Invalid Fields not allowed."));
			}

			var { type, amount, remark } = req.body;
			// console.log(req.body, userId, req.auth.utorid);
			if (!type || !amount) {
				return res.status(400).json(errorMessage("Bad Request."));
			}
			if (type !== "transfer") {
				return res.status(400).json(errorMessage("Invalid Type."));
			}
			if (isNaN(amount)) {
				return res.status(400).json(errorMessage("Invalid amount."));
			}
			amount = parseInt(amount);

			if (amount < 0) {
				return res.status(400).json(errorMessage("Amount must be positive."));
			}

			const receiverUser = await prisma.user.findUnique({
				where: { id: userId },
				select: { utorid: true },
			});
			if (!receiverUser) {
				return res.status(404).json(errorMessage("User not found."));
			}

			const currentUser = await prisma.user.findUnique({
				where: { utorid: req.auth.utorid },
				select: { id: true, points: true, verified: true },
			});
			if (!currentUser.verified) {
				return res.status(403).json(errorMessage("Forbidden not verified"));
			}
			// console.log("Current User Points: ", currentUser.points);
			if (currentUser.points < amount) {
				return res.status(400).json(errorMessage("Not enough points"));
			}

			const [
				newTransaction1,
				newTransaction2,
				senderUpdatedUser,
				receiverUpdatedUser,
			] = await prisma.$transaction([
				prisma.transaction.create({
					data: {
						utorid: req.auth.utorid,
						type: type,
						relatedId: userId,
						amount: -1 * amount,
						...(remark !== undefined && { remark: remark }),
						createdBy: req.auth.utorid,
					},
				}),
				prisma.transaction.create({
					data: {
						utorid: receiverUser.utorid,
						type: type,
						relatedId: currentUser.id,
						amount: amount,
						...(remark !== undefined && { remark: remark }),
						createdBy: req.auth.utorid,
					},
				}),
				prisma.user.update({
					where: { id: currentUser.id },
					data: { points: { decrement: amount } },
				}),
				prisma.user.update({
					where: { id: userId },
					data: { points: { increment: amount } },
				}),
			]);
			return res.status(201).json({
				id: newTransaction1.id,
				sender: newTransaction1.utorid,
				recipient: newTransaction2.utorid,
				type: newTransaction1.type,
				sent: newTransaction1.amount * -1,
				remark: newTransaction1.remark,
				createdBy: newTransaction1.createdBy,
			});
		})
	)
	.all((req, res) => res.status(405).json(errorMessage("Method Not Allowed")));

router
	.route("/:userId")
	.get(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			if (clearanceList("manager").includes(req.auth.role)) {
				const userIdParam = req.params.userId;
				if (isNaN(userIdParam)) {
					return res.status(400).json(errorMessage("Invalid userId."));
				}
				const userId = parseInt(userIdParam);

				const user = await prisma.user.findUnique({
					where: { id: userId },
					select: {
						id: true,
						utorid: true,
						name: true,
						email: true,
						birthday: true,
						role: true,
						points: true,
						createdAt: true,
						lastLogin: true,
						verified: true,
						avatarUrl: true,
						promotions: {
							select: {
								id: true,
								name: true,
								minSpending: true,
								rate: true,
								points: true,
							},
						},
					},
				});
				if (!user) {
					return res.status(404).json(errorMessage("User not found."));
				}
				return res.status(200).json(user);
			} else if (clearanceList("cashier").includes(req.auth.role)) {
				const userIdParam = req.params.userId;
				if (isNaN(userIdParam)) {
					return res.status(400).json(errorMessage("Invalid userId."));
				}
				const userId = parseInt(userIdParam);

				const user = await prisma.user.findUnique({
					where: { id: userId },
					select: {
						id: true,
						utorid: true,
						name: true,
						points: true,
						verified: true,
						promotions: {
							select: {
								id: true,
								name: true,
								minSpending: true,
								rate: true,
								points: true,
							},
						},
					},
				});
				if (!user) {
					return res.status(404).json(errorMessage("User not found."));
				}
				return res.status(200).json(user);
			} else {
				return res.status(403).json(errorMessage("Forbidden"));
			}
		})
	)
	.patch(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			console.log(req.body);
			if (!clearanceList("manager").includes(req.auth.role)) {
				return res.status(403).json(errorMessage("Forbidden"));
			}

			const userIdParam = req.params.userId;
			if (isNaN(userIdParam)) {
				return res.status(400).json(errorMessage("Invalid userId."));
			}
			const userId = parseInt(userIdParam);

			if (
				isPresentInvalidFields(req.body, [
					"email",
					"verified",
					"suspicious",
					"role",
				])
			) {
				return res
					.status(400)
					.json(errorMessage("Invalid Fields not allowed."));
			}

			var { email, verified, suspicious, role } = req.body;

			if (
				email == undefined &&
				verified == undefined &&
				suspicious == undefined &&
				role == undefined
			) {
				return res.status(400).json(errorMessage("bad request."));
			}

			if (verified != undefined && verified !== true) {
				return res.status(400).json(errorMessage("verified is invalid."));
			}
			if (suspicious != undefined) {
				if (suspicious !== true && suspicious !== false) {
					return res.status(400).json(errorMessage("suspicious is invalid."));
				}
			}
			if (role != undefined) {
				if (!clearanceList("regular").includes(role)) {
					return res.status(400).json(errorMessage("Role is invalid."));
				}
				if (
					req.auth.role === "manager" &&
					!["cashier", "regular"].includes(role)
				) {
					return res
						.status(403)
						.json(errorMessage("Manager can only change cashier and regular."));
				}
				if (
					req.auth.role === "superuser" &&
					!["cashier", "regular", "manager", "superuser"].includes(role)
				) {
					return res.status(403).json(errorMessage("Role is invalid."));
				}
			}
			if (email != undefined) {
				if (!email.endsWith("@mail.utoronto.ca")) {
					return res.status(400).json(errorMessage("Email is invalid."));
				}

				const emailUser = await prisma.user.findUnique({
					where: { email: email },
				});
				if (emailUser && emailUser.id !== userId) {
					return res.status(400).json(errorMessage("Email already in use."));
				}
			}

			const updatedUser = await prisma.user.update({
				where: {
					id: userId,
				},
				select: {
					id: true,
					utorid: true,
					name: true,
					...(email != undefined && { email: true }),
					...(suspicious != undefined && { suspicious: true }),
					...(verified != undefined && { verified: true }),
					...(role != undefined && { role: true }),
				},
				data: {
					...(email != undefined && { email: email }),
					...(suspicious != undefined && { suspicious: suspicious }),
					...(verified != undefined && { verified: verified }),
					...(role != undefined && { role: role }),
				},
			});

			if (!updatedUser) {
				return res.status(404).json(errorMessage("User not found."));
			}
			return res.status(200).json(updatedUser);
		})
	)
	.all((req, res) => res.status(405).json(errorMessage("Method Not Allowed")));

module.exports = router;
