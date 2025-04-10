const express = require("express");
const router = express.Router();
const {
	errorMessage,
	clearanceList,
	isPresentInvalidFields,
	isISOFormat,
	formatTransaction,
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
			const type = req.body.type;
			if (!type) {
				return res.status(400).json(errorMessage("Bad request."));
			}
			if (type === "purchase") {
				if (!clearanceList("cashier").includes(req.auth.role)) {
					return res.status(403).json(errorMessage("Forbidden"));
				}

				if (
					isPresentInvalidFields(req.body, [
						"utorid",
						"type",
						"spent",
						"promotionIds",
						"remark",
					])
				) {
					return res
						.status(400)
						.json(errorMessage("Invalid Fields not allowed."));
				}

				var { utorid, spent, promotionIds, remark } = req.body;

				// if (promotionIds != undefined && promotionIds.length !== 0) {
				//     console.log("Promoted Purchase", req.body, req.auth.utorid);
				// }

				if (!utorid || !spent) {
					return res.status(400).json(errorMessage("Bad request."));
				}

				if (isNaN(spent)) {
					return res.status(400).json(errorMessage("spent is invalid."));
				}
				spent = parseFloat(spent);
				if (spent < 0) {
					return res.status(400).json(errorMessage("spent is invalid."));
				}

				const user = await prisma.user.findUnique({
					where: { utorid: utorid },
					select: { promotions: true },
				});
				if (!user) {
					return res.status(404).json(errorMessage("User not found."));
				}

				const usedPromotions = user.promotions.map((promotion) => promotion.id);

				var pointsEarned = Math.round(spent / 0.25);

				var newPromotionIds = [];
				if (promotionIds) {
					for (let promotionId of promotionIds) {
						const promotion = await prisma.promotion.findUnique({
							where: { id: promotionId },
							select: {
								id: true,
								name: true,
								rate: true,
								points: true,
								minSpending: true,
								startTime: true,
								endTime: true,
							},
						});
						let now = new Date();
						if (!promotion) {
							return res
								.status(400)
								.json(errorMessage("Promotion does not exist."));
						}
						if (promotion.startTime > now || promotion.endTime < now) {
							return res
								.status(400)
								.json(errorMessage("Promotion time is not right now."));
						}
						if (usedPromotions.includes(promotionId)) {
							return res
								.status(400)
								.json(errorMessage("Promotion already used."));
						}
						if (promotion.minSpending <= spent) {
							pointsEarned +=
								promotion.points + Math.round(spent / promotion.rate);
							newPromotionIds.push({ id: promotion.id });
						}

						// if (promotionIds != undefined && promotionIds.length !== 0) {
						//     // console.log("Promotion: ", promotion);
						// }
					}
				}

				var suspicious = false;

				const creatorUser = await prisma.user.findUnique({
					where: { utorid: req.auth.utorid },
					select: { suspicious: true },
				});
				if (!creatorUser.suspicious) {
					// console.log("Cashier not suspicious, update user");
					const updatedUser = await prisma.user.update({
						where: { utorid: utorid },
						data: {
							points: { increment: pointsEarned },
							promotions: {
								connect: newPromotionIds,
							},
						},
					});
				} else {
					suspicious = true;
				}

				const newTransaction = await prisma.transaction.create({
					data: {
						utorid: utorid,
						type: type,
						spent: spent,
						amount: pointsEarned,
						...(remark !== undefined && { remark: remark }),
						suspicious: suspicious,
						promotionIds: {
							connect: newPromotionIds,
						},
						createdBy: req.auth.utorid,
					},
					select: {
						id: true,
						utorid: true,
						type: true,
						spent: true,
						remark: true,
						promotionIds: {
							select: {
								id: true,
							},
						},
						createdBy: true,
					},
				});

				var addedEarnedField = newTransaction;
				addedEarnedField.earned = pointsEarned;
				if (suspicious) {
					addedEarnedField.earned = 0;
				}
				addedEarnedField.promotionIds = addedEarnedField.promotionIds.map(
					(promotion) => promotion.id
				);

				return res.status(201).json(addedEarnedField);
			} else if (type === "adjustment") {
				if (!clearanceList("manager").includes(req.auth.role)) {
					return res.status(403).json(errorMessage("Forbidden"));
				}

				if (
					isPresentInvalidFields(req.body, [
						"utorid",
						"type",
						"amount",
						"relatedId",
						"promotionIds",
						"remark",
					])
				) {
					return res
						.status(400)
						.json(errorMessage("Invalid Fields not allowed."));
				}

				var { utorid, amount, relatedId, promotionIds, remark } = req.body;

				if (!utorid || !amount || !relatedId) {
					return res.status(400).json(errorMessage("Bad request."));
				}

				const user = await prisma.user.findUnique({
					where: { utorid: utorid },
				});
				if (!user) {
					return res.status(404).json(errorMessage("User not found."));
				}

				if (isNaN(amount)) {
					return res.status(400).json(errorMessage("spent is invalid."));
				}
				amount = parseInt(amount);
				if (isNaN(relatedId)) {
					return res.status(400).json(errorMessage("spent is invalid."));
				}
				relatedId = parseInt(relatedId);

				const relatedTransaction = await prisma.transaction.findUnique({
					where: { id: relatedId },
					select: { utorid: true },
				});
				if (!relatedTransaction || relatedTransaction.utorid !== utorid) {
					return res
						.status(404)
						.json(errorMessage("Related Transaction is invalid."));
				}

				var newPromotionIds = [];
				if (promotionIds) {
					for (let promotionId of promotionIds) {
						const promotion = await prisma.promotion.findUnique({
							where: { id: promotionId },
							select: { id: true },
						});
						if (!promotion) {
							return res
								.status(400)
								.json(errorMessage("Promotion does not exist."));
						}
						newPromotionIds.push({ id: promotion.id });
					}
				}

				const [newTransaction, updatedUser] = await prisma.$transaction([
					prisma.transaction.create({
						data: {
							utorid: utorid,
							type: type,
							amount: amount,
							relatedId: relatedId,
							...(remark !== undefined && { remark: remark }),
							promotionIds: {
								connect: newPromotionIds,
							},
							createdBy: req.auth.utorid,
						},
						select: {
							id: true,
							utorid: true,
							type: true,
							amount: true,
							relatedId: true,
							remark: true,
							promotionIds: {
								select: {
									id: true,
								},
							},
							createdBy: true,
						},
					}),
					prisma.user.update({
						where: { utorid: utorid },
						data: {
							points: { increment: amount },
							promotions: {
								connect: newPromotionIds,
							},
						},
					}),
				]);

				var returnedTransaction = newTransaction;
				returnedTransaction.promotionIds = returnedTransaction.promotionIds.map(
					(promotion) => promotion.id
				);

				return res.status(201).json(returnedTransaction);
			} else {
				return res.status(400).json(errorMessage("Invalid type."));
			}
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
					"createdBy",
					"suspicious",
					"promotionId",
					"type",
					"relatedId",
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
				name,
				createdBy,
				suspicious,
				promotionId,
				type,
				relatedId,
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
				where: {
					...(name !== undefined && { utorid: name }),
					...(createdBy !== undefined && { createdBy: createdBy }),
					...(suspicious !== undefined && { suspicious: suspicious }),
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

			let formattedResults = results.map(formatTransaction);
			return res
				.status(200)
				.json({ count: formattedResults.length, results: formattedResults });
		})
	)
	.all((req, res) => res.status(405).json(errorMessage("Method Not Allowed")));

router
	.route("/:transactionId/suspicious")
	.patch(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			if (!clearanceList("manager").includes(req.auth.role)) {
				return res.status(403).json(errorMessage("Forbidden"));
			}

			const transactionIdParam = req.params.transactionId;
			if (isNaN(transactionIdParam)) {
				return res.status(400).json(errorMessage("Invalid transaction Id."));
			}
			const transactionId = parseInt(transactionIdParam);

			if (isPresentInvalidFields(req.body, ["suspicious"])) {
				return res
					.status(400)
					.json(errorMessage("Invalid Fields not allowed."));
			}

			const { suspicious } = req.body;

			if (suspicious !== true && suspicious !== false) {
				return res.status(400).json(errorMessage("Invalid suspicious."));
			}

			const transaction = await prisma.transaction.findUnique({
				where: { id: transactionId },
				include: {
					promotionIds: true,
				},
			});

			if (
				(transaction.suspicious && suspicious) ||
				(!transaction.suspicious && !suspicious)
			) {
				return res.status(200).json(formatTransaction(transaction));
			}

			if (transaction.suspicious && !suspicious) {
				var pointsObj = { increment: transaction.amount };
			} else {
				var pointsObj = { decrement: transaction.amount };
			}

			const [updatedUser, updateTransaction] = await prisma.$transaction([
				prisma.user.update({
					where: {
						utorid: transaction.utorid,
					},
					data: {
						points: pointsObj,
					},
				}),
				prisma.transaction.update({
					where: {
						id: transactionId,
					},
					data: {
						suspicious: suspicious,
					},
					include: {
						promotionIds: true,
					},
				}),
			]);

			return res.status(200).json(formatTransaction(updateTransaction));
		})
	)
	.all((req, res) => res.status(405).json(errorMessage("Method Not Allowed")));

router
	.route("/:transactionId")
	.get(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			if (!clearanceList("manager").includes(req.auth.role)) {
				return res.status(403).json(errorMessage("Forbidden"));
			}

			const transactionIdParam = req.params.transactionId;
			if (isNaN(transactionIdParam)) {
				return res.status(400).json(errorMessage("Invalid transaction Id."));
			}
			const transactionId = parseInt(transactionIdParam);

			const transaction = await prisma.transaction.findUnique({
				where: { id: transactionId },
				include: {
					promotionIds: true,
				},
			});
			if (!transaction) {
				return res.status(404).json(errorMessage("Transaction Not Found."));
			}

			var formattedTransaction = formatTransaction(transaction);

			return res.status(200).json(formattedTransaction);
		})
	)
	.all((req, res) => res.status(405).json(errorMessage("Method Not Allowed")));

router
	.route("/:transactionId/processed")
	.patch(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			if (!clearanceList("cashier").includes(req.auth.role)) {
				return res.status(403).json(errorMessage("Forbidden"));
			}

			const transactionIdParam = req.params.transactionId;
			if (isNaN(transactionIdParam)) {
				return res.status(400).json(errorMessage("Invalid transaction Id."));
			}
			const transactionId = parseInt(transactionIdParam);

			if (isPresentInvalidFields(req.body, ["processed"])) {
				return res
					.status(400)
					.json(errorMessage("Invalid Fields not allowed."));
			}

			const { processed } = req.body;

			if (processed !== true) {
				return res.status(400).json(errorMessage("Invalid processed."));
			}

			const transaction = await prisma.transaction.findUnique({
				where: { id: transactionId },
				select: {
					utorid: true,
					amount: true,
					type: true,
					relatedId: true,
				},
			});
			if (!transaction) {
				return res.status(404).json(errorMessage("Not found transaction."));
			}

			if (transaction.type !== "redemption") {
				return res
					.status(400)
					.json(errorMessage("Not a redemption transaction."));
			}
			if (transaction.relatedId !== null) {
				return res.status(400).json(errorMessage("Already Processed."));
			}

			const user = await prisma.user.findUnique({
				where: { utorid: req.auth.utorid },
			});

			const [updatedTransaction, updatedUser] = await prisma.$transaction([
				prisma.transaction.update({
					where: { id: transactionId },
					data: { relatedId: user.id },
				}),
				prisma.user.update({
					where: { utorid: transaction.utorid },
					data: { points: { increment: transaction.amount } },
				}),
			]);

			return res.status(200).json({
				id: updatedTransaction.id,
				utorid: updatedTransaction.utorid,
				type: updatedTransaction.type,
				processedBy: req.auth.utorid,
				redeemed: updatedTransaction.amount * -1,
				remark: updatedTransaction.remark,
				createdBy: updatedTransaction.createdBy,
			});
		})
	)
	.all((req, res) => res.status(405).json(errorMessage("Method Not Allowed")));

module.exports = router;
