const express = require("express");
const router = express.Router();
const {
	errorMessage,
	isPresentInvalidFields,
	tryCatchWrapper,
} = require("./../util/Util");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();

const { v4: uuidv4 } = require("uuid");
const SECRETKEY = process.env.SECRETKEY;

router
	.route("/tokens")
	.post(
		tryCatchWrapper(async (req, res, next) => {
			if (isPresentInvalidFields(req.body, ["utorid", "password"])) {
				return res
					.status(400)
					.json(errorMessage("Invalid Fields not allowed."));
			}

			const { utorid, password } = req.body;
			if (!utorid || !password) {
				return res.status(400).json(errorMessage("Request Body is Invalid."));
			}
			const user = await prisma.user.findUnique({
				where: { utorid: utorid },
				select: { id: true, password: true, role: true },
			});
			if (!user) {
				return res.status(400).json(errorMessage("User Not Found."));
			}
			if (user.password === password) {
				const token = jwt.sign({ utorid: utorid, role: user.role }, SECRETKEY, {
					expiresIn: "1h",
				});
				var now = new Date();

				// Update Last Login Info
				const updateUser = await prisma.user.update({
					where: {
						id: user.id,
					},
					data: {
						lastLogin: now,
					},
				});

				now.setTime(now.getTime() + 1 * 60 * 60 * 1000);
				res.status(200).json({
					token: token,
					expiresAt: now,
				});
			} else {
				return res.status(401).json(errorMessage("Incorrect Password."));
			}
		})
	)
	.all((req, res) => res.status(405).json(errorMessage("Method Not Allowed")));

var ipToLatestRequest = new Map();

router
	.route("/resets")
	.post(
		tryCatchWrapper(async (req, res, next) => {
			if (isPresentInvalidFields(req.body, ["utorid"])) {
				return res
					.status(400)
					.json(errorMessage("Invalid Fields not allowed."));
			}

			const { utorid } = req.body;

			if (!utorid) {
				return res.status(400).json(errorMessage("utorid invalid."));
			}

			const user = await prisma.user.findUnique({ where: { utorid: utorid } });
			if (!user) {
				return res.status(404).json(errorMessage("utorid invalid."));
			}

			var now = new Date();

			if (ipToLatestRequest.has(req.ip)) {
				var latestTime = ipToLatestRequest.get(req.ip);
				// console.log(Math.abs(latestTime.getTime() - now.getTime()));
				if (Math.abs(latestTime.getTime() - now.getTime()) <= 60 * 1000) {
					return res.status(429).json(errorMessage("Too Many Requests."));
				}
			}
			ipToLatestRequest.set(req.ip, new Date(now.getTime()));

			now.setTime(now.getTime() + 1 * 60 * 60 * 1000);

			var nowAgain = new Date();

			const updatedPrevToken = await prisma.resetToken.updateMany({
				where: {
					utorid: utorid,
				},
				data: {
					expiresAt: nowAgain,
				},
			});

			const newResetToken = await prisma.resetToken.create({
				data: {
					token: uuidv4(),
					utorid: utorid,
					expiresAt: now,
				},
			});

			return res.status(202).json({
				expiresAt: newResetToken.expiresAt,
				resetToken: newResetToken.token,
			});
		})
	)
	.all((req, res) => res.status(405).json(errorMessage("Method Not Allowed")));

router
	.route("/resets/:resetToken")
	.post(
		tryCatchWrapper(async (req, res, next) => {
			if (isPresentInvalidFields(req.body, ["utorid", "password"])) {
				return res
					.status(400)
					.json(errorMessage("Invalid Fields not allowed."));
			}

			const { utorid, password } = req.body;
			if (!utorid || !password) {
				return res.status(400).json(errorMessage("Bad Request."));
			}

			const token = req.params.resetToken;

			const resetToken = await prisma.resetToken.findUnique({
				where: { token: token },
			});

			if (!resetToken) {
				return res.status(404).json(errorMessage("Reset Token Not Found."));
			}

			if (resetToken.utorid !== utorid) {
				return res.status(401).json(errorMessage("Invalid utorid."));
			}

			var now = new Date();
			if (now > resetToken.expiresAt) {
				return res.status(410).json(errorMessage("Gone - Token Expired."));
			}

			const passwordRegex =
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,20}$/;
			if (!passwordRegex.test(password)) {
				return res.status(400).json(errorMessage("Password not allowed."));
			}

			const updatedToken = await prisma.resetToken.update({
				where: {
					token: token,
				},
				data: {
					expiresAt: now,
				},
			});

			const updatedUser = await prisma.user.update({
				where: { utorid: utorid },
				data: { password: password },
			});
			return res.status(200).send();
		})
	)
	.all((req, res) => res.status(405).json(errorMessage("Method Not Allowed")));

module.exports = router;
