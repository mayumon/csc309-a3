const express = require("express");
const router = express.Router();
const {
	errorMessage,
	clearanceList,
	isPresentInvalidFields,
	isISOFormat,
	tryCatchWrapper,
} = require("./../util/Util");
const { PrismaClient } = require("@prisma/client");
// const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();
var { expressjwt: jwt } = require("express-jwt");

const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const { PrivateResultType } = require("@prisma/client/runtime/library");
const upload = multer({ dest: "uploads/avatars/" });

const SECRETKEY = process.env.SECRETKEY;

router
	.route("/")
	.post(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			if (!clearanceList("manager").includes(req.auth.role)) {
				return res.status(403).json(errorMessage("Forbidden"));
			}

			if (
				isPresentInvalidFields(req.body, [
					"name",
					"description",
					"type",
					"startTime",
					"endTime",
					"minSpending",
					"rate",
					"points",
				])
			) {
				return res
					.status(400)
					.json(errorMessage("Invalid Fields not allowed."));
			}

			const {
				name,
				description,
				type,
				startTime,
				endTime,
				minSpending,
				rate,
				points,
			} = req.body;
			if (!name || !description || !type || !startTime || !endTime) {
				return res.status(400).json(errorMessage("Request Body is Invalid."));
			}

			if (type !== "automatic" && type !== "one-time") {
				return res.status(400).json(errorMessage("Type is Invalid."));
			}
			if (!isISOFormat(startTime)) {
				return res.status(400).json(errorMessage("startTime is Invalid."));
			} else {
				let now = new Date();
				let startDate = new Date(startTime);
				if (now.getTime() > startDate.getTime()) {
					return res.status(400).json(errorMessage("startTime is Invalid."));
				}
			}
			if (!isISOFormat(endTime)) {
				return res.status(400).json(errorMessage("endTime is Invalid."));
			} else {
				let endDate = new Date(endTime);
				let startDate = new Date(startTime);
				if (startDate.getTime() > endDate.getTime()) {
					return res.status(400).json(errorMessage("endDate is Invalid."));
				}
			}
			if (minSpending && minSpending < 0) {
				return res.status(400).json(errorMessage("minSpending is Invalid."));
			}
			if (rate && rate < 0) {
				return res.status(400).json(errorMessage("rate is Invalid."));
			}
			if (points && points < 0) {
				return res.status(400).json(errorMessage("points is Invalid."));
			}

			const newPromotion = await prisma.promotion.create({
				data: {
					name: name,
					description: description,
					type: type,
					startTime: startTime,
					endTime: endTime,
					...(minSpending !== undefined && { minSpending: minSpending }),
					...(rate !== undefined && { rate: rate }),
					...(points !== undefined && { points: points }),
				},
			});

			return res.status(201).json(newPromotion);
		})
	)
	.get(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			if (clearanceList("manager").includes(req.auth.role)) {
				if (
					isPresentInvalidFields(req.query, [
						"name",
						"type",
						"page",
						"limit",
						"started",
						"ended",
					])
				) {
					return res
						.status(400)
						.json(errorMessage("Invalid Fields not allowed."));
				}

				var { name, type, page = 1, limit = 10, started, ended } = req.query;

				if (type) {
					if (type !== "automatic" && type !== "one-time") {
						return res.status(400).json(errorMessage("type is Invalid."));
					}
				}

				if (page) {
					if (isNaN(page)) {
						return res.status(400).json(errorMessage("page is invalid."));
					}
					page = parseInt(page);
					if (page < 0) {
						return res.status(400).json(errorMessage("page is invalid."));
					}
				}
				if (limit) {
					if (isNaN(limit)) {
						return res.status(400).json(errorMessage("page is invalid."));
					}
					limit = parseInt(limit);
					if (limit < 0) {
						return res.status(400).json(errorMessage("page is invalid."));
					}
				}

				if (started != undefined && ended != undefined) {
					return res
						.status(400)
						.json(errorMessage("started and ended is invalid."));
				}
				const now = new Date();

				if (started != undefined) {
					if (started !== "true" && started !== "false") {
						return res.status(400).json(errorMessage("started is invalid."));
					}
					started = started === "true";
				}

				if (ended != undefined) {
					if (ended !== "true" && ended !== "false") {
						return res.status(400).json(errorMessage("started is invalid."));
					}
					ended = ended === "true";
				}

				const count = await prisma.promotion.count({
					where: {
						...(name != undefined && { name: name }),
						...(type != undefined && { type: type }),
						...(started != undefined && started && { startTime: { lte: now } }),
						...(started != undefined && !started && { startTime: { gt: now } }),
						...(ended != undefined && ended && { endTime: { lte: now } }),
						...(ended != undefined && !ended && { endTime: { gt: now } }),
					},
				});

				const results = await prisma.promotion.findMany({
					where: {
						...(name != undefined && { name: name }),
						...(type != undefined && { type: type }),
						...(started != undefined && started && { startTime: { lte: now } }),
						...(started != undefined && !started && { startTime: { gt: now } }),
						...(ended != undefined && ended && { endTime: { lte: now } }),
						...(ended != undefined && !ended && { endTime: { gt: now } }),
					},
					select: {
						id: true,
						name: true,
						type: true,
						startTime: true,
						endTime: true,
						minSpending: true,
						rate: true,
						points: true,
					},
					skip: (page - 1) * limit,
					take: limit,
				});
				return res.status(200).json({ count: count, results: results });
			} else if (clearanceList("regular").includes(req.auth.role)) {
				if (
					isPresentInvalidFields(req.query, ["name", "type", "page", "limit"])
				) {
					return res
						.status(400)
						.json(errorMessage("Invalid Fields not allowed."));
				}

				var { name, type, page = 1, limit = 10 } = req.query;

				if (type) {
					if (type !== "automatic" && type !== "one-time") {
						return res.status(400).json(errorMessage("type is Invalid."));
					}
				}

				if (page) {
					if (isNaN(page)) {
						return res.status(400).json(errorMessage("page is invalid."));
					}
					page = parseInt(page);
					if (page < 0) {
						return res.status(400).json(errorMessage("page is invalid."));
					}
				}
				if (limit) {
					if (isNaN(limit)) {
						return res.status(400).json(errorMessage("page is invalid."));
					}
					limit = parseInt(limit);
					if (limit < 0) {
						return res.status(400).json(errorMessage("page is invalid."));
					}
				}

				const now = new Date();

				const user = await prisma.user.findUnique({
					where: { utorid: req.auth.utorid },
					include: { promotions: true },
				});
				const usedPromotionIds = user.promotions.map(
					(promotion) => promotion.id
				);

				const count = await prisma.promotion.count({
					where: {
						...(name !== undefined && { name: name }),
						...(type !== undefined && { type: type }),
						startTime: {
							lt: now,
						},
						endTime: {
							gt: now,
						},
						NOT: {
							id: { in: usedPromotionIds },
						},
					},
				});

				const results = await prisma.promotion.findMany({
					where: {
						...(name !== undefined && { name: name }),
						...(type !== undefined && { type: type }),
						startTime: {
							lt: now,
						},
						endTime: {
							gt: now,
						},
					},
					select: {
						id: true,
						name: true,
						type: true,
						endTime: true,
						minSpending: true,
						rate: true,
						points: true,
					},
					skip: (page - 1) * limit,
					take: limit,
				});
				return res.status(200).json({ count: count, results: results });
			} else {
				return res.status(403).json(errorMessage("Forbidden"));
			}
		})
	)
	.all((req, res) => res.status(405).json(errorMessage("Method Not Allowed")));

router
	.route("/:promotionId")
	.get(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			if (clearanceList("manager").includes(req.auth.role)) {
				const promotionIdParam = req.params.promotionId;
				if (isNaN(promotionIdParam)) {
					return res.status(400).json(errorMessage("Invalid promotionId."));
				}
				const promotionId = parseInt(promotionIdParam);

				const promotion = await prisma.promotion.findUnique({
					where: { id: promotionId },
					select: {
						id: true,
						name: true,
						description: true,
						type: true,
						startTime: true,
						endTime: true,
						minSpending: true,
						rate: true,
						points: true,
					},
				});
				if (!promotion) {
					return res.status(404).json(errorMessage("Promotion not found."));
				}
				return res.status(200).json(promotion);
			} else if (clearanceList("regular").includes(req.auth.role)) {
				const promotionIdParam = req.params.promotionId;
				if (isNaN(promotionIdParam)) {
					return res.status(400).json(errorMessage("Invalid userId."));
				}
				const promotionId = parseInt(promotionIdParam);

				const now = new Date();

				const promotion = await prisma.promotion.findUnique({
					where: {
						id: promotionId,
						startTime: { lte: now },
						endTime: { gt: now },
					},
					select: {
						id: true,
						name: true,
						description: true,
						type: true,
						endTime: true,
						minSpending: true,
						rate: true,
						points: true,
					},
				});
				if (!promotion) {
					return res.status(404).json(errorMessage("Promotion not found."));
				}
				return res.status(200).json(promotion);
			} else {
				return res.status(403).json(errorMessage("Forbidden"));
			}
		})
	)
	.patch(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			if (!clearanceList("manager").includes(req.auth.role)) {
				return res.status(403).json(errorMessage("Forbidden"));
			}

			if (
				isPresentInvalidFields(req.body, [
					"name",
					"description",
					"type",
					"startTime",
					"endTime",
					"minSpending",
					"rate",
					"points",
				])
			) {
				return res
					.status(400)
					.json(errorMessage("Invalid Fields not allowed."));
			}

			const promotionIdParam = req.params.promotionId;
			if (isNaN(promotionIdParam)) {
				return res.status(404).json(errorMessage("Invalid promotionId."));
			}
			const promotionId = parseInt(promotionIdParam);

			const {
				name,
				description,
				type,
				startTime,
				endTime,
				minSpending,
				rate,
				points,
			} = req.body;

			if (type != undefined && type !== "automatic" && type !== "one-time") {
				return res.status(400).json(errorMessage("Type is Invalid."));
			}
			if (startTime != undefined) {
				if (!isISOFormat(startTime)) {
					return res.status(400).json(errorMessage("startTime is Invalid."));
				} else {
					let now = new Date();
					let startDate = new Date(startTime);
					if (now.getTime() > startDate.getTime()) {
						return res.status(400).json(errorMessage("startTime is Invalid."));
					}
				}
			}
			if (endTime != undefined) {
				if (!isISOFormat(endTime)) {
					return res.status(400).json(errorMessage("endTime is Invalid."));
				} else {
					let endDate = new Date(endTime);
					let startDate = new Date(startTime);
					if (startDate.getTime() > endDate.getTime()) {
						return res.status(400).json(errorMessage("endDate is Invalid."));
					}
				}
			}
			if (minSpending != undefined && minSpending < 0) {
				return res.status(400).json(errorMessage("minSpending is Invalid."));
			}
			if (rate != undefined && rate < 0) {
				return res.status(400).json(errorMessage("rate is Invalid."));
			}
			if (points != undefined && points < 0) {
				return res.status(400).json(errorMessage("points is Invalid."));
			}

			const promotion = await prisma.promotion.findUnique({
				where: { id: promotionId },
			});
			if (!promotion) {
				return res.status(404).json(errorMessage("Promotion not found."));
			}
			const now = new Date();
			if (
				promotion.startTime < now &&
				(name ||
					description ||
					type ||
					startTime ||
					minSpending ||
					rate ||
					points)
			) {
				return res
					.status(400)
					.json(
						errorMessage(
							"Cannot update certain parameters after promotion has started."
						)
					);
			}

			if (promotion.endTime < now && endTime) {
				return res
					.status(400)
					.json(
						errorMessage("Cannot update endTime after promotion has ended.")
					);
			}

			const updatedPromotion = await prisma.promotion.update({
				where: {
					id: promotionId,
				},
				data: {
					...(name != undefined && { name: name }),
					...(description != undefined && { description: description }),
					...(type != undefined && { type: type }),
					...(startTime != undefined && { startTime: startTime }),
					...(endTime != undefined && { endTime: endTime }),
					...(minSpending != undefined && { minSpending: minSpending }),
					...(rate != undefined && { rate: rate }),
					...(points != undefined && { points: points }),
				},
				select: {
					id: true,
					name: true,
					type: true,
					...(description != undefined && { description: true }),
					...(startTime != undefined && { startTime: true }),
					...(endTime != undefined && { endTime: true }),
					...(minSpending != undefined && { minSpending: true }),
					...(rate != undefined && { rate: true }),
					...(points != undefined && { points: true }),
				},
			});

			return res.status(200).json(updatedPromotion);
		})
	)
	.delete(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			if (!clearanceList("manager").includes(req.auth.role)) {
				return res.status(403).json(errorMessage("Forbidden"));
			}

			const promotionIdParam = req.params.promotionId;
			if (isNaN(promotionIdParam)) {
				return res.status(400).json(errorMessage("Invalid promotionId."));
			}
			const promotionId = parseInt(promotionIdParam);

			const promotion = await prisma.promotion.findUnique({
				where: { id: promotionId },
			});
			if (!promotion) {
				return res.status(404).json(errorMessage("Promotion not found."));
			}
			const now = new Date();
			if (promotion.startTime < now) {
				return res
					.status(403)
					.json(errorMessage("Forbidden, as Promotion has already started."));
			}

			const deletedPromotion = await prisma.promotion.delete({
				where: { id: promotionId },
			});
			if (!deletedPromotion) {
				return res.status(404).json(errorMessage("Promotion not found."));
			}
			return res.status(204).json();
		})
	)
	.all((req, res) => res.status(405).json(errorMessage("Method Not Allowed")));
module.exports = router;
