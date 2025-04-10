const express = require("express");
const router = express.Router();
const {
	errorMessage,
	clearanceList,
	isPresentInvalidFields,
	isISOFormat,
	tryCatchWrapper,
	formatTransaction,
} = require("./../util/Util");
const { PrismaClient } = require("@prisma/client");
// const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();
var { expressjwt: jwt } = require("express-jwt");

const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const { PrivateResultType } = require("@prisma/client/runtime/library");
const e = require("cors");
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
					"location",
					"startTime",
					"endTime",
					"capacity",
					"points",
				])
			) {
				return res
					.status(400)
					.json(errorMessage("Invalid Fields not allowed."));
			}

			var {
				name,
				description,
				location,
				startTime,
				endTime,
				capacity,
				points,
			} = req.body;
			if (
				!name ||
				!description ||
				!location ||
				!startTime ||
				!endTime ||
				!points
			) {
				return res.status(400).json(errorMessage("Request Body is Invalid."));
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
			if (capacity != undefined) {
				if (isNaN(capacity) || capacity < 0) {
					return res.status(400).json(errorMessage("capacity is Invalid."));
				}
				capacity = parseInt(capacity);
			}
			if (points != undefined) {
				if (isNaN(points) || points < 0) {
					return res.status(400).json(errorMessage("points is Invalid."));
				}
				points = parseInt(points);
			}

			const newEvent = await prisma.event.create({
				data: {
					name: name,
					description: description,
					location: location,
					startTime: startTime,
					endTime: endTime,
					...(capacity != undefined && { capacity: capacity }),
					pointsRemain: points,
					pointsAwarded: 0,
				},
				include: {
					organizers: true,
					guests: true,
				},
			});
			return res.status(201).json(newEvent);
		})
	)
	.get(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			if (clearanceList("manager").includes(req.auth.role)) {
				if (
					isPresentInvalidFields(req.query, [
						"name",
						"location",
						"started",
						"ended",
						"showFull",
						"page",
						"limit",
						"published",
					])
				) {
					return res
						.status(400)
						.json(errorMessage("Invalid Fields not allowed."));
				}

				var {
					name,
					location,
					started,
					ended,
					showFull = "false",
					page = 1,
					limit = 10,
					published,
				} = req.query;

				if (showFull != undefined) {
					if (showFull !== "false" && showFull !== "true") {
						return res.status(400).json(errorMessage("showFull is Invalid."));
					}

					showFull = showFull === "true";
				}

				if (published != undefined) {
					if (published !== "false" && published !== "true") {
						return res.status(400).json(errorMessage("published is Invalid."));
					}

					published = published === "true";
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
						return res.status(400).json(errorMessage("limit is invalid."));
					}
					limit = parseInt(limit);
					if (limit < 0) {
						return res.status(400).json(errorMessage("limit is invalid."));
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

				const count = await prisma.event.count({
					where: {
						...(name != undefined && { name: name }),
						...(location != undefined && { location: location }),
						...(started != undefined && started && { startTime: { lte: now } }),
						...(started != undefined && !started && { startTime: { gt: now } }),
						...(ended != undefined && ended && { endTime: { lte: now } }),
						...(ended != undefined && !ended && { endTime: { gt: now } }),
						...(published != undefined && { published: published }),
						...(showFull != undefined && !showFull && { isFull: showFull }),
					},
				});

				const results = await prisma.event.findMany({
					where: {
						...(name != undefined && { name: name }),
						...(location != undefined && { location: location }),
						...(started != undefined && started && { startTime: { lte: now } }),
						...(started != undefined && !started && { startTime: { gt: now } }),
						...(ended != undefined && ended && { endTime: { lte: now } }),
						...(ended != undefined && !ended && { endTime: { gt: now } }),
						...(published != undefined && { published: published }),
						...(showFull != undefined && !showFull && { isFull: showFull }),
					},
					select: {
						id: true,
						name: true,
						location: true,
						startTime: true,
						endTime: true,
						capacity: true,
						pointsRemain: true,
						pointsAwarded: true,
						published: true,
						_count: true,
					},
					skip: (page - 1) * limit,
					take: limit,
				});
				const formattedResults = results.map((event) => {
					event.numGuests = event._count.guests;
					delete event["_count"];
					return event;
				});
				return res
					.status(200)
					.json({ count: count, results: formattedResults });
			} else if (clearanceList("regular").includes(req.auth.role)) {
				if (
					isPresentInvalidFields(req.query, [
						"name",
						"location",
						"started",
						"ended",
						"showFull",
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
					location,
					started,
					ended,
					showFull = "false",
					page = 1,
					limit = 10,
				} = req.query;

				if (showFull != undefined) {
					if (showFull !== "false" && showFull !== "true") {
						return res.status(400).json(errorMessage("showFull is Invalid."));
					}

					showFull = showFull === "true";
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
						return res.status(400).json(errorMessage("limit is invalid."));
					}
					limit = parseInt(limit);
					if (limit < 0) {
						return res.status(400).json(errorMessage("limit is invalid."));
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

				const count = await prisma.event.count({
					where: {
						...(name != undefined && { name: name }),
						...(location != undefined && { location: location }),
						...(started != undefined && started && { startTime: { lte: now } }),
						...(started != undefined && !started && { startTime: { gt: now } }),
						...(ended != undefined && ended && { endTime: { lte: now } }),
						...(ended != undefined && !ended && { endTime: { gt: now } }),
						published: true,
						...(showFull != undefined && !showFull && { isFull: showFull }),
					},
				});

				const results = await prisma.event.findMany({
					where: {
						...(name != undefined && { name: name }),
						...(location != undefined && { location: location }),
						...(started != undefined && started && { startTime: { lte: now } }),
						...(started != undefined && !started && { startTime: { gt: now } }),
						...(ended != undefined && ended && { endTime: { lte: now } }),
						...(ended != undefined && !ended && { endTime: { gt: now } }),
						published: true,
						...(showFull != undefined && !showFull && { isFull: showFull }),
					},
					select: {
						id: true,
						name: true,
						location: true,
						startTime: true,
						endTime: true,
						capacity: true,
						_count: true,
					},
					skip: (page - 1) * limit,
					take: limit,
				});
				const formattedResults = results.map((event) => {
					event.numGuests = event._count.guests;
					delete event["_count"];
					return event;
				});
				return res
					.status(200)
					.json({ count: count, results: formattedResults });
			} else {
				return res.status(403).json(errorMessage("Forbidden"));
			}
		})
	)
	.all((req, res) => res.status(405).json(errorMessage("Method Not Allowed")));

router
	.route("/myattended")
	.get(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			if (clearanceList("manager").includes(req.auth.role)) {
				const events = await prisma.user.findUnique({
					where: {
						utorid: req.auth.utorid,
					},
					select: {
						GuestTo: {
							select: {
								id: true,
								name: true,
								location: true,
								startTime: true,
								endTime: true,
								capacity: true,
								pointsRemain: true,
								pointsAwarded: true,
								published: true,
								_count: true,
							},
						},
					},
				});

				const formattedResults = events.GuestTo.map((event) => {
					event.numGuests = event._count.guests;
					delete event["_count"];
					return event;
				});

				return res.status(200).json({ results: formattedResults }).send();
			} else if (clearanceList("regular").includes(req.auth.role)) {
				const events = await prisma.user.findUnique({
					where: {
						utorid: req.auth.utorid,
					},
					select: {
						GuestTo: {
							select: {
								id: true,
								name: true,
								location: true,
								startTime: true,
								endTime: true,
								capacity: true,
								_count: true,
							},
						},
					},
				});

				const formattedResults = events.GuestTo.map((event) => {
					event.numGuests = event._count.guests;
					delete event["_count"];
					return event;
				});

				return res.status(200).json({ results: formattedResults }).send();
			} else {
				return res.status(403).json(errorMessage("Forbidden"));
			}
		})
	)
	.all((req, res) => res.status(405).json(errorMessage("Method Not Allowed")));

router
	.route("/myorganized")
	.get(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			if (clearanceList("regular").includes(req.auth.role)) {
				const events = await prisma.user.findUnique({
					where: {
						utorid: req.auth.utorid,
					},
					select: {
						OrganizerTo: {
							select: {
								id: true,
								name: true,
								location: true,
								startTime: true,
								endTime: true,
								capacity: true,
								pointsRemain: true,
								pointsAwarded: true,
								published: true,
								_count: true,
							},
						},
					},
				});

				const formattedResults = events.OrganizerTo.map((event) => {
					event.numGuests = event._count.guests;
					delete event["_count"];
					return event;
				});

				return res.status(200).json({ results: formattedResults }).send();
			} else {
				return res.status(403).json(errorMessage("Forbidden"));
			}
		})
	)
	.all((req, res) => res.status(405).json(errorMessage("Method Not Allowed")));

router
	.route("/:eventId")
	.get(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			const eventIdParam = req.params.eventId;
			if (isNaN(eventIdParam)) {
				return res.status(400).json(errorMessage("Invalid promotionId."));
			}
			const eventId = parseInt(eventIdParam);

			const currentEvent = await prisma.event.findUnique({
				where: { id: eventId },
				select: { organizers: { select: { utorid: true } } },
			});
			if (!currentEvent) {
				return res.status(404).json(errorMessage("Event Not Found"));
			}

			let currentOrganizersUtorid = currentEvent.organizers.map(
				(organizer) => organizer.utorid
			);
			// console.log(currentOrganizersUtorid);
			// console.log(req.auth.utorid)

			if (
				clearanceList("manager").includes(req.auth.role) ||
				currentOrganizersUtorid.includes(req.auth.utorid)
			) {
				var event = await prisma.event.findUnique({
					where: {
						id: eventId,
					},
					select: {
						id: true,
						name: true,
						description: true,
						location: true,
						startTime: true,
						endTime: true,
						capacity: true,
						pointsRemain: true,
						pointsAwarded: true,
						published: true,
						organizers: {
							select: {
								id: true,
								utorid: true,
								name: true,
							},
						},
						guests: {
							select: {
								id: true,
								utorid: true,
								name: true,
							},
						},
						_count: true,
					},
				});

				if (!event) {
					return res.status(404).json(errorMessage("Event Not Found."));
				}
				event.numGuests = event._count.guests;
				delete event["_count"];
				return res.status(200).json(event);
			} else if (clearanceList("regular").includes(req.auth.role)) {
				const eventIdParam = req.params.eventId;
				if (isNaN(eventIdParam)) {
					return res.status(400).json(errorMessage("Invalid promotionId."));
				}
				const eventId = parseInt(eventIdParam);

				var event = await prisma.event.findUnique({
					where: {
						id: eventId,
						published: true,
					},
					select: {
						id: true,
						name: true,
						description: true,
						location: true,
						startTime: true,
						endTime: true,
						capacity: true,
						organizers: {
							select: {
								id: true,
								utorid: true,
								name: true,
							},
						},
						_count: true,
					},
				});

				if (!event) {
					return res.status(404).json(errorMessage("Event Not Found."));
				}

				event.numGuests = event._count.guests;
				delete event["_count"];
				return res.status(200).json(event);
			} else {
				return res.status(403).json(errorMessage("Forbidden"));
			}
		})
	)
	.patch(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			const eventIdParam = req.params.eventId;
			if (isNaN(eventIdParam)) {
				return res.status(400).json(errorMessage("Invalid promotionId."));
			}
			const eventId = parseInt(eventIdParam);

			const currentEvent = await prisma.event.findUnique({
				where: { id: eventId },
				select: {
					organizers: { select: { utorid: true } },
					startTime: true,
					endTime: true,
					_count: true,
					pointsRemain: true,
					pointsAwarded: true,
				},
			});

			if (!currentEvent) {
				return res.status(404).json(errorMessage("Event Not Found"));
			}

			// console.log(req.body, currentEvent, req.auth.utorid);

			let currentOrganizersUtorid = currentEvent.organizers.map(
				(organizer) => organizer.utorid
			);

			if (
				!clearanceList("manager").includes(req.auth.role) &&
				!currentOrganizersUtorid.includes(req.auth.utorid)
			) {
				return res.status(403).json(errorMessage("Forbidden"));
			}

			if (
				isPresentInvalidFields(req.body, [
					"name",
					"description",
					"location",
					"startTime",
					"endTime",
					"capacity",
					"points",
					"published",
				])
			) {
				return res
					.status(400)
					.json(errorMessage("Invalid Fields not allowed."));
			}

			var {
				name,
				description,
				location,
				startTime,
				endTime,
				capacity,
				points,
				published,
			} = req.body;

			let now = new Date();
			if (
				currentEvent.startTime < now &&
				(name != undefined ||
					description != undefined ||
					location != undefined ||
					startTime != undefined ||
					capacity != undefined)
			) {
				return res
					.status(400)
					.json(
						errorMessage("Cannot change certain fields after Event has started")
					);
			}
			if (currentEvent.endTime < now && endTime != undefined) {
				return res
					.status(400)
					.json(
						errorMessage("Cannot change certain fields after Event has started")
					);
			}

			if (
				!clearanceList("manager").includes(req.auth.role) &&
				(points != undefined || published != undefined)
			) {
				return res.status(403).json(errorMessage("Forbidden"));
			}

			if (startTime != undefined) {
				if (!isISOFormat(startTime)) {
					return res.status(400).json(errorMessage("startTime is not ISO."));
				} else {
					let startDate = new Date(startTime);
					if (now.getTime() > startDate.getTime()) {
						return res
							.status(400)
							.json(errorMessage("startTime is in the past."));
					}
				}
			}
			if (endTime != undefined) {
				if (!isISOFormat(endTime)) {
					return res.status(400).json(errorMessage("endTime is not ISO."));
				} else {
					let endDate = new Date(endTime);
					if (now.getTime() > endDate.getTime()) {
						return res
							.status(400)
							.json(errorMessage("endTime is in the past."));
					}
				}
			}
			if (capacity != undefined) {
				if (
					isNaN(capacity) ||
					capacity < 0 ||
					capacity < currentEvent._count.guests
				) {
					return res.status(400).json(errorMessage("capacity is Invalid."));
				}
				capacity = parseInt(capacity);
			}
			if (points != undefined) {
				if (
					isNaN(points) ||
					points < 0 ||
					points < currentEvent.pointsAwarded
				) {
					return res.status(400).json(errorMessage("points is Invalid."));
				}
				points = parseInt(points);
			}
			if (published != undefined) {
				if (published !== true) {
					return res.status(400).json(errorMessage("published is Invalid."));
				}
			}

			const updatedEvent = await prisma.event.update({
				where: {
					id: eventId,
				},
				data: {
					...(name != undefined && { name: name }),
					...(description != undefined && { description: description }),
					...(location != undefined && { location: location }),
					...(startTime != undefined && { startTime: startTime }),
					...(endTime != undefined && { endTime: endTime }),
					...(capacity != undefined && { capacity: capacity }),
					...(published != undefined && { published: published }),
					...(points != undefined && {
						pointsRemain: points - currentEvent.pointsAwarded,
					}),
				},
				select: {
					id: true,
					name: true,
					location: true,
					published: true,
					...(description != undefined && { description: true }),
					...(startTime != undefined && { startTime: true }),
					...(endTime != undefined && { endTime: true }),
					...(capacity != undefined && { capacity: true }),
					...(points != undefined && {
						pointsRemain: points - currentEvent.pointsAwarded,
					}),
				},
			});
			return res.status(200).json(updatedEvent);
		})
	)
	.delete(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			if (!clearanceList("manager").includes(req.auth.role)) {
				return res.status(403).json(errorMessage("Forbidden"));
			}

			const eventIdParam = req.params.eventId;
			if (isNaN(eventIdParam)) {
				return res.status(400).json(errorMessage("Invalid promotionId."));
			}
			const eventId = parseInt(eventIdParam);

			const event = await prisma.event.findUnique({ where: { id: eventId } });
			if (!event) {
				return res.status(404).json(errorMessage("Event not found."));
			}

			if (event.published) {
				return res.status(400).json(errorMessage("Event already published."));
			}

			const deletedEvent = await prisma.event.delete({
				where: { id: eventId },
			});

			return res.status(204).send();
		})
	)
	.all((req, res) => res.status(405).json(errorMessage("Method Not Allowed")));
router
	.route("/:eventId/organizers")
	.post(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			if (!clearanceList("manager").includes(req.auth.role)) {
				return res.status(403).json(errorMessage("Forbidden"));
			}

			const eventIdParam = req.params.eventId;
			if (isNaN(eventIdParam)) {
				return res.status(400).json(errorMessage("Invalid promotionId."));
			}
			const eventId = parseInt(eventIdParam);

			if (isPresentInvalidFields(req.body, ["utorid"])) {
				return res
					.status(400)
					.json(errorMessage("Invalid Fields not allowed."));
			}

			const { utorid } = req.body;
			if (!utorid) {
				return res.status(400).json(errorMessage("Request Body is Invalid."));
			}

			const user = await prisma.user.findUnique({
				where: {
					utorid: utorid,
				},
			});

			if (!user) {
				return res.status(404).json(errorMessage("user not found."));
			}

			const event = await prisma.event.findUnique({
				where: {
					id: eventId,
				},
				select: {
					guests: {
						select: {
							utorid: true,
						},
					},
					organizers: {
						select: {
							utorid: true,
						},
					},
					endTime: true,
				},
			});
			if (!event) {
				return res.status(404).json(errorMessage("Event not found."));
			}
			const guestUtorid = event.guests.map((guest) => guest.utorid);
			if (guestUtorid.includes(utorid)) {
				return res.status(400).json(errorMessage("This user is a guest."));
			}
			const organizerUtorid = event.organizers.map(
				(organizer) => organizer.utorid
			);
			if (organizerUtorid.includes(utorid)) {
				return res.status(400).json(errorMessage("This user is an organizer."));
			}
			let now = new Date();
			if (event.endTime < now) {
				return res.status(410).json(errorMessage("Event Ended."));
			}

			const updatedEvent = await prisma.event.update({
				where: {
					id: eventId,
				},
				data: {
					organizers: {
						connect: {
							utorid: utorid,
						},
					},
				},
				select: {
					id: true,
					name: true,
					location: true,
					organizers: {
						select: {
							id: true,
							utorid: true,
							name: true,
						},
					},
				},
			});
			return res.status(201).json(updatedEvent);
		})
	)
	.all((req, res) => res.status(405).json(errorMessage("Method Not Allowed")));
router
	.route("/:eventId/organizers/:userId")
	.delete(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			if (!clearanceList("manager").includes(req.auth.role)) {
				return res.status(403).json(errorMessage("Forbidden"));
			}
			const eventIdParam = req.params.eventId;
			if (isNaN(eventIdParam)) {
				return res.status(400).json(errorMessage("Invalid promotionId."));
			}
			const eventId = parseInt(eventIdParam);

			const userIdParam = req.params.userId;
			if (isNaN(userIdParam)) {
				return res.status(400).json(errorMessage("Invalid promotionId."));
			}
			const userId = parseInt(userIdParam);

			const event = await prisma.event.findUnique({
				where: {
					id: eventId,
				},
				select: {
					organizers: {
						select: {
							id: true,
						},
					},
				},
			});
			if (!event) {
				return res.status(404).json(errorMessage("Event Not Found."));
			}
			let organizerIds = event.organizers.map((organizer) => organizer.id);
			if (!organizerIds.includes(userId)) {
				return res.status(404).json(errorMessage("User Not Found."));
			}

			const updatedEvent = await prisma.event.update({
				where: {
					id: eventId,
				},
				data: {
					organizers: {
						disconnect: [{ id: userId }],
					},
				},
			});
			return res.status(204).send();
		})
	)
	.all((req, res) => res.status(405).json(errorMessage("Method Not Allowed")));

router
	.route("/:eventId/guests")
	.post(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			const eventIdParam = req.params.eventId;
			if (isNaN(eventIdParam)) {
				return res.status(400).json(errorMessage("Invalid eventId."));
			}
			const eventId = parseInt(eventIdParam);

			const currentEvent = await prisma.event.findUnique({
				where: { id: eventId },
				select: {
					organizers: {
						select: {
							utorid: true,
						},
					},
					guests: {
						select: {
							utorid: true,
						},
					},
					published: true,
					capacity: true,
					endTime: true,
					isFull: true,
					_count: true,
				},
			});
			if (!currentEvent) {
				return res.status(404).json(errorMessage("Event Not Found"));
			}

			let currentOrganizersUtorid = currentEvent.organizers.map(
				(organizer) => organizer.utorid
			);
			let currentGuestsUtorid = currentEvent.guests.map(
				(guest) => guest.utorid
			);
			// console.log(currentOrganizersUtorid);
			// console.log(req.auth.utorid)

			if (
				clearanceList("manager").includes(req.auth.role) ||
				currentOrganizersUtorid.includes(req.auth.utorid)
			) {
				if (isPresentInvalidFields(req.body, ["utorid"])) {
					return res
						.status(400)
						.json(errorMessage("Invalid Fields not allowed."));
				}

				const { utorid } = req.body;
				if (!utorid) {
					return res.status(400).json(errorMessage("Request Body is Invalid."));
				}

				const user = await prisma.user.findUnique({
					where: {
						utorid: utorid,
					},
				});

				if (!user) {
					return res.status(404).json(errorMessage("user not found."));
				}

				if (currentOrganizersUtorid.includes(utorid)) {
					return res
						.status(400)
						.json(errorMessage("The wanted user is already organizer."));
				}

				if (currentGuestsUtorid.includes(utorid)) {
					return res
						.status(400)
						.json(errorMessage("The wanted user is already a guest."));
				}

				let now = new Date();
				if (currentEvent.endTime < now) {
					return res.status(410).json(errorMessage("Event Ended."));
				}
				if (currentEvent.isFull) {
					return res.status(410).json(errorMessage("Event Full."));
				}
				if (!currentEvent.published) {
					return res
						.status(404)
						.json(errorMessage("Event Not Found Published."));
				}
				let isFull = false;
				if (
					currentEvent.capacity != undefined &&
					currentEvent._count.guests === currentEvent.capacity - 1
				) {
					isFull = true;
				}

				var updatedEvent = await prisma.event.update({
					where: {
						id: eventId,
					},
					data: {
						guests: {
							connect: {
								utorid: utorid,
							},
						},
						isFull: isFull,
					},
					select: {
						id: true,
						name: true,
						location: true,
						_count: true,
						guests: {
							where: {
								utorid: utorid,
							},
							select: {
								id: true,
								utorid: true,
								name: true,
							},
						},
					},
				});
				updatedEvent.numGuests = updatedEvent._count.guests;
				delete updatedEvent._count;
				updatedEvent.guestAdded = updatedEvent.guests[0];
				delete updatedEvent.guests;
				return res.status(201).json(updatedEvent);
			} else {
				return res.status(403).json(errorMessage("Forbidden"));
			}
		})
	)
	.all((req, res) => res.status(405).json(errorMessage("Method Not Allowed")));

router
	.route("/:eventId/guests/me")
	.post(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			const eventIdParam = req.params.eventId;
			if (isNaN(eventIdParam)) {
				return res.status(400).json(errorMessage("Invalid eventId."));
			}
			const eventId = parseInt(eventIdParam);

			const currentEvent = await prisma.event.findUnique({
				where: { id: eventId },
				select: {
					guests: {
						select: {
							utorid: true,
						},
					},
					published: true,
					capacity: true,
					endTime: true,
					isFull: true,
					_count: true,
				},
			});

			if (!currentEvent) {
				return res.status(404).json(errorMessage("Event Not Found"));
			}
			const utorid = req.auth.utorid;

			let currentGuestsUtorid = currentEvent.guests.map(
				(guest) => guest.utorid
			);

			if (clearanceList("regular").includes(req.auth.role)) {
				if (isPresentInvalidFields(req.body, [])) {
					return res
						.status(400)
						.json(errorMessage("Invalid Fields not allowed."));
				}

				const user = await prisma.user.findUnique({
					where: {
						utorid: utorid,
					},
				});

				if (!user) {
					return res.status(404).json(errorMessage("user not found."));
				}

				if (currentGuestsUtorid.includes(utorid)) {
					return res.status(400).json(errorMessage("user is already guest."));
				}
				let now = new Date();
				if (currentEvent.endTime < now) {
					return res.status(410).json(errorMessage("Event Ended."));
				}
				if (currentEvent.isFull) {
					return res.status(410).json(errorMessage("Event Full."));
				}
				if (!currentEvent.published) {
					return res
						.status(404)
						.json(errorMessage("Event Not Found Published."));
				}
				let isFull = false;
				if (
					currentEvent.capacity != undefined &&
					currentEvent._count.guests === currentEvent.capacity - 1
				) {
					isFull = true;
				}

				var updatedEvent = await prisma.event.update({
					where: {
						id: eventId,
					},
					data: {
						guests: {
							connect: {
								utorid: utorid,
							},
						},
						isFull: isFull,
					},
					select: {
						id: true,
						name: true,
						location: true,
						_count: true,
						guests: {
							where: {
								utorid: utorid,
							},
							select: {
								id: true,
								utorid: true,
								name: true,
							},
						},
					},
				});
				updatedEvent.numGuests = updatedEvent._count.guests;
				delete updatedEvent._count;
				updatedEvent.guestAdded = updatedEvent.guests[0];
				delete updatedEvent.guests;
				return res.status(201).json(updatedEvent);
			} else {
				return res.status(403).json(errorMessage("Forbidden"));
			}
		})
	)
	.delete(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			if (!clearanceList("regular").includes(req.auth.role)) {
				return res.status(403).json(errorMessage("Forbidden"));
			}
			const eventIdParam = req.params.eventId;
			if (isNaN(eventIdParam)) {
				return res.status(400).json(errorMessage("Invalid promotionId."));
			}
			const eventId = parseInt(eventIdParam);

			const utorid = req.auth.utorid;

			const event = await prisma.event.findUnique({
				where: {
					id: eventId,
				},
				select: {
					guests: {
						select: {
							utorid: true,
						},
					},
					endTime: true,
				},
			});
			if (!event) {
				return res.status(404).json(errorMessage("Event Not Found."));
			}

			let now = new Date();
			if (event.endTime < now) {
				return res.status(410).json(errorMessage("Event has ended."));
			}

			let guestUtorid = event.guests.map((guest) => guest.utorid);
			if (!guestUtorid.includes(utorid)) {
				return res.status(404).json(errorMessage("User Not Found."));
			}

			const updatedEvent = await prisma.event.update({
				where: {
					id: eventId,
				},
				data: {
					guests: {
						disconnect: [{ utorid: utorid }],
					},
					isFull: false,
				},
			});
			return res.status(204).send();
		})
	)
	.all((req, res) => res.status(405).json(errorMessage("Method Not Allowed")));

router
	.route("/:eventId/guests/:userId")
	.delete(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			if (!clearanceList("manager").includes(req.auth.role)) {
				return res.status(403).json(errorMessage("Forbidden"));
			}
			const eventIdParam = req.params.eventId;
			if (isNaN(eventIdParam)) {
				return res.status(400).json(errorMessage("Invalid promotionId."));
			}
			const eventId = parseInt(eventIdParam);

			const userIdParam = req.params.userId;
			if (isNaN(userIdParam)) {
				return res.status(400).json(errorMessage("Invalid promotionId."));
			}
			const userId = parseInt(userIdParam);

			const event = await prisma.event.findUnique({
				where: {
					id: eventId,
				},
				select: {
					guests: {
						select: {
							id: true,
						},
					},
				},
			});
			if (!event) {
				return res.status(404).json(errorMessage("Event Not Found."));
			}

			let guestIds = event.guests.map((guest) => guest.id);
			if (!guestIds.includes(userId)) {
				return res.status(404).json(errorMessage("User Not Found."));
			}

			const updatedEvent = await prisma.event.update({
				where: {
					id: eventId,
				},
				data: {
					guests: {
						disconnect: [{ id: userId }],
					},
					isFull: false,
				},
			});
			return res.status(204).send();
		})
	)
	.all((req, res) => res.status(405).json(errorMessage("Method Not Allowed")));

router
	.route("/:eventId/transactions")
	.post(
		jwt({ secret: SECRETKEY, algorithms: ["HS256"] }),
		tryCatchWrapper(async (req, res, next) => {
			const eventIdParam = req.params.eventId;
			if (isNaN(eventIdParam)) {
				return res.status(400).json(errorMessage("Invalid promotionId."));
			}
			const eventId = parseInt(eventIdParam);

			const currentEvent = await prisma.event.findUnique({
				where: { id: eventId },
				select: {
					organizers: { select: { utorid: true } },
					guests: { select: { utorid: true } },
					startTime: true,
					endTime: true,
					_count: true,
					pointsRemain: true,
					pointsAwarded: true,
				},
			});

			if (!currentEvent) {
				return res.status(404).json(errorMessage("Event Not Found"));
			}

			let currentOrganizersUtorid = currentEvent.organizers.map(
				(organizer) => organizer.utorid
			);

			if (
				!clearanceList("manager").includes(req.auth.role) &&
				!currentOrganizersUtorid.includes(req.auth.utorid)
			) {
				return res.status(403).json(errorMessage("Forbidden"));
			}

			if (isPresentInvalidFields(req.body, ["type", "utorid", "amount"])) {
				return res
					.status(400)
					.json(errorMessage("Invalid Fields not allowed."));
			}

			var { type, utorid, amount } = req.body;
			if (!type || !amount) {
				return res.status(400).json(errorMessage("Request Body is Invalid."));
			}

			if (isNaN(amount) || amount < 0) {
				return res.status(400).json(errorMessage("Request Body is Invalid."));
			}
			amount = parseInt(amount);

			if (type !== "event") {
				return res.status(400).json(errorMessage("type is Invalid."));
			}

			let currentGuestUtorid = currentEvent.guests.map(
				(guests) => guests.utorid
			);
			if (utorid != undefined) {
				if (!currentGuestUtorid.includes(utorid)) {
					return res.status(400).json(errorMessage("Guest Not Found."));
				}
				if (currentEvent.pointsRemain < amount) {
					return res.status(400).json(errorMessage("Not Enough Points."));
				}

				const [newTransaction, updatedEvent, updatedUser] =
					await prisma.$transaction([
						prisma.transaction.create({
							data: {
								utorid: utorid,
								type: "event",
								amount: amount,
								relatedId: eventId,
								remark: "",
								createdBy: req.auth.utorid,
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
					]);
				return res.status(201).json(formatTransaction(newTransaction));
			} else {
				if (currentEvent.pointsRemain < amount * currentEvent._count.guests) {
					return res.status(400).json(errorMessage("Not Enough Points."));
				}

				let createTransactionData = [];
				for (let guestUtorid of currentGuestUtorid) {
					createTransactionData.push({
						utorid: guestUtorid,
						type: "event",
						amount: amount,
						relatedId: eventId,
						remark: "",
						createdBy: req.auth.utorid,
					});
				}

				const [newTransactions, updatedEvent, updatedUser] =
					await prisma.$transaction([
						prisma.transaction.createManyAndReturn({
							data: createTransactionData,
						}),
						prisma.event.update({
							where: { id: eventId },
							data: {
								pointsAwarded: {
									increment: amount * currentEvent._count.guests,
								},
								pointsRemain: {
									decrement: amount * currentEvent._count.guests,
								},
							},
						}),
						prisma.user.updateMany({
							where: { utorid: { in: currentGuestUtorid } },
							data: {
								points: {
									increment: amount,
								},
							},
						}),
					]);
				return res.status(201).json(newTransactions.map(formatTransaction));
			}
		})
	)
	.all((req, res) => res.status(405).json(errorMessage("Method Not Allowed")));

module.exports = router;
