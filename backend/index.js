#!/usr/bin/env node
require('dotenv').config();
"use strict";

const port = (() => {
	const args = process.argv;

	if (args.length !== 3) {
		console.error("usage: node index.js port");
		process.exit(1);
	}

	const num = parseInt(args[2], 10);
	if (isNaN(num)) {
		console.error("error: argument must be an integer.");
		process.exit(1);
	}

	return num;
})();

const cors = require("cors");
const express = require("express");
const app = express();

app.use(express.json());

// ADD YOUR WORK HERE
const { errorMessage } = require("./util/Util");

const userRoute = require("./routes/User");
const authRoute = require("./routes/Auth");
const promotionRoute = require("./routes/Promotion");
const transactionRoute = require("./routes/Transaction");
const eventRoute = require("./routes/Event");

app.use(
	cors({
		origin: process.env.FRONTEND_URL || "http://localhost:5173",
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
		allowedHeaders: ["Content-Type", "Authorization"],
	})
);

app.use("/users", userRoute);
app.use("/auth", authRoute);
app.use("/promotions", promotionRoute);
app.use("/transactions", transactionRoute);
app.use("/events", eventRoute);

app.use((err, req, res, next) => {
	console.log(err);
	if (err.name === "UnauthorizedError") {
		return res.status(401).json(errorMessage("Unauthorized"));
	}
	return res.status(500).json(err);
});

const server = app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});

server.on("error", (err) => {
	console.error(`cannot start server: ${err.message}`);
	process.exit(1);
});
