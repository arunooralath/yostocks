const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const UserPortfolio = require("../models/userPortfolio");
const UserPortfolioLogs = require("../models/userPortfolioLogs");

// fetch all UserPortfolio by email
router.get("/:email", (req, res, next) => {});

// fetch all UserPortfolio by email
router.get("/transactions/:email", (req, res, next) => {});

// list transactions by symbol
router.post("/listTransaction", (req, res, next) => {});

// buy stocks to portfolio
router.post("/buy", (req, res, next) => {});

// sell stocks from portfolio
router.post("/sell", (req, res, next) => {});

