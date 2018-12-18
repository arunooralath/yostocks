const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const JWT_KEY = "secret";

router.post("/signup", (req, res, next) => {
  User.find({ email: req.body.email })
    .exec()
    .then(user => {
      if (user.length >= 1) {
        return res.status(409).json({
          message: "email already regestered"
        });
      } else {
        var name = splitName(req.body.fullName);
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).json({
              error: err
            });
          } else {
            const user = new User({
              _id: new mongoose.Types.ObjectId(),
              email: req.body.email,
              password: hash,
              firstName: name[0],
              lastName: name[1],
              countryCode: req.body.countryCode
            });
            user
              .save()
              .then(result => {
                console.log(result);
                res.status(201).json({
                  message: "User created"
                });
              })
              .catch(err => {
                console.log(err);
                res.status(500).json({
                  error: err
                });
              });
          }
        });
      }
    });
});

router.post("/login", (req, res, next) => {
  User.find({ email: req.body.email })
    .exec()
    .then(user => {
      if (user.length < 1) {
        return res.status(401).json({
          message: "Auth failed"
        });
      }
      let userCountry = user[0].countryCode;
      let userCurrency = countryDetails[userCountry];
      console.log(userCountry, userCurrency);
      bcrypt.compare(req.body.password, user[0].password, (err, result) => {
        if (err) {
          return res.status(401).json({
            message: "Auth failed"
          });
        }
        if (result) {
          const token = jwt.sign(
            {
              email: user[0].email,
              userId: user[0]._id
            },
            JWT_KEY,
            {
              expiresIn: "7d"
            }
          );
          return res.status(200).json({
            message: "Auth successful",
            defaultCurrency: userCurrency,
            token: token
          });
        }
        res.status(401).json({
          message: "Auth failed"
        });
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
});

router.delete("/:userId", (req, res, next) => {
  User.remove({ _id: req.params.userId })
    .exec()
    .then(result => {
      res.status(200).json({
        message: "User deleted"
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
});

// update profile with password
router.post("/updateProfile", async (req, res, next) => {
  console.log("update profile", req.body);
  let user = await User.findOne({ email: req.body.email });
  if (user) {
    bcrypt.hash(req.body.password, 10, (err, hash) => {
      if (err) {
        return res.status(500).json({
          error: err
        });
      } else {
        User.updateOne(
          { email: req.body.email },
          {
            $set: {
              firstName: req.body.firstName,
              lastName: req.body.lastName,
              age: req.body.age,
              password: hash
            }
          }
        )
          .exec()
          .then(result => {
            res.status(201).json({
              message: "Profile Updated"
            });
          });
      }
    });
  } else {
    res.status(500).json({
      error: "No user Found"
    });
  }
});

// just update account
router.post("/updateAccount", async (req, res, next) => {
  console.log("update Account", req.body);
  let user = await User.findOne({ email: req.body.email });
  console.log(user);
  if (user) {
    User.updateOne(
      { email: req.body.email },
      {
        $set: {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          age: req.body.age
        }
      }
    )
      .exec()
      .then(result => {
        if (result) {
          res.status(201).json({
            message: "Account Updated"
          });
        } else {
          res.status(500).json({
            err: "Server Error"
          });
        }
      });
  } else {
    res.status(400).json({
      message: "no such user"
    });
  }
});

router.get("/getUserDetails/:email", (req, res, next) => {
  User.findOne({ email: req.params.email })
    .exec()
    .then(result => {
      if (result) {
        res.status(200).json({
          id: result._id,
          email: result.email,
          firstName: result.firstName,
          lastName: result.lastName,
          age: result.age
        });
      } else {
        res.status(500).json({
          error: "user not found"
        });
      }
    });
});

router.get("/getWallet/:email", (req, res, next) => {
  User.findOne({ email: req.params.email })
    .exec()
    .then(result => {
      if (result) {
        res.status(200).json({
          email: result.email,
          wallet: result.wallet
        });
      } else {
        res.status(500).json({
          error: "user not found"
        });
      }
    });
});

// admin services
router.get("/", async (req, res, next) => {
  let user;
  try {
    user = await User.find();
    res.send(user);
  } catch (err) {
    res.status(500).json({
      error: "user not found"
    });
  }
});

// delete account
router.post("/delete", async (req, res, next) => {
  console.log(req.body);
  let user = await User.findOne({ email: req.body.email });
  if (user) {
    let deleteres = await User.deleteOne({ email: req.body.email });
    if (deleteres) {
      res.status(200).json({
        msg: "account deleted"
      });
    } else {
      res.status(500).json({
        err: "server error"
      });
    }
  } else {
    res.status(400).json({
      err: "No such User"
    });
  }
});

// custom functions
function splitName(fullName) {
  var name = [];

  name[0] = fullName
    .split(" ")
    .slice(0, -1)
    .join(" ");
  console.log("1", name[0]);
  name[1] = fullName
    .split(" ")
    .slice(-1)
    .join(" ");
  console.log(name[1]);
  if (name[0] === "") {
    name[0] = name[1];
    name[1]="";
    //...
  }
  return name;
}

var countryDetails = {
  BD: "BDT",
  BE: "EUR",
  BF: "XOF",
  BG: "BGN",
  BA: "BAM",
  BB: "BBD",
  WF: "XPF",
  BL: "EUR",
  BM: "BMD",
  BN: "BND",
  BO: "BOB",
  BH: "BHD",
  BI: "BIF",
  BJ: "XOF",
  BT: "BTN",
  JM: "JMD",
  BV: "NOK",
  BW: "BWP",
  WS: "WST",
  BQ: "USD",
  BR: "BRL",
  BS: "BSD",
  JE: "GBP",
  BY: "BYR",
  BZ: "BZD",
  RU: "RUB",
  RW: "RWF",
  RS: "RSD",
  TL: "USD",
  RE: "EUR",
  TM: "TMT",
  TJ: "TJS",
  RO: "RON",
  TK: "NZD",
  GW: "XOF",
  GU: "USD",
  GT: "GTQ",
  GS: "GBP",
  GR: "EUR",
  GQ: "XAF",
  GP: "EUR",
  JP: "JPY",
  GY: "GYD",
  GG: "GBP",
  GF: "EUR",
  GE: "GEL",
  GD: "XCD",
  GB: "GBP",
  GA: "XAF",
  SV: "USD",
  GN: "GNF",
  GM: "GMD",
  GL: "DKK",
  GI: "GIP",
  GH: "GHS",
  OM: "OMR",
  TN: "TND",
  JO: "JOD",
  HR: "HRK",
  HT: "HTG",
  HU: "HUF",
  HK: "HKD",
  HN: "HNL",
  HM: "AUD",
  VE: "VEF",
  PR: "USD",
  PS: "ILS",
  PW: "USD",
  PT: "EUR",
  SJ: "NOK",
  PY: "PYG",
  IQ: "IQD",
  PA: "PAB",
  PF: "XPF",
  PG: "PGK",
  PE: "PEN",
  PK: "PKR",
  PH: "PHP",
  PN: "NZD",
  PL: "PLN",
  PM: "EUR",
  ZM: "ZMK",
  EH: "MAD",
  EE: "EUR",
  EG: "EGP",
  ZA: "ZAR",
  EC: "USD",
  IT: "EUR",
  VN: "VND",
  SB: "SBD",
  ET: "ETB",
  SO: "SOS",
  ZW: "ZWL",
  SA: "SAR",
  ES: "EUR",
  ER: "ERN",
  ME: "EUR",
  MD: "MDL",
  MG: "MGA",
  MF: "EUR",
  MA: "MAD",
  MC: "EUR",
  UZ: "UZS",
  MM: "MMK",
  ML: "XOF",
  MO: "MOP",
  MN: "MNT",
  MH: "USD",
  MK: "MKD",
  MU: "MUR",
  MT: "EUR",
  MW: "MWK",
  MV: "MVR",
  MQ: "EUR",
  MP: "USD",
  MS: "XCD",
  MR: "MRO",
  IM: "GBP",
  UG: "UGX",
  TZ: "TZS",
  MY: "MYR",
  MX: "MXN",
  IL: "ILS",
  FR: "EUR",
  IO: "USD",
  SH: "SHP",
  FI: "EUR",
  FJ: "FJD",
  FK: "FKP",
  FM: "USD",
  FO: "DKK",
  NI: "NIO",
  NL: "EUR",
  NO: "NOK",
  NA: "NAD",
  VU: "VUV",
  NC: "XPF",
  NE: "XOF",
  NF: "AUD",
  NG: "NGN",
  NZ: "NZD",
  NP: "NPR",
  NR: "AUD",
  NU: "NZD",
  CK: "NZD",
  XK: "EUR",
  CI: "XOF",
  CH: "CHF",
  CO: "COP",
  CN: "CNY",
  CM: "XAF",
  CL: "CLP",
  CC: "AUD",
  CA: "CAD",
  CG: "XAF",
  CF: "XAF",
  CD: "CDF",
  CZ: "CZK",
  CY: "EUR",
  CX: "AUD",
  CR: "CRC",
  CW: "ANG",
  CV: "CVE",
  CU: "CUP",
  SZ: "SZL",
  SY: "SYP",
  SX: "ANG",
  KG: "KGS",
  KE: "KES",
  SS: "SSP",
  SR: "SRD",
  KI: "AUD",
  KH: "KHR",
  KN: "XCD",
  KM: "KMF",
  ST: "STD",
  SK: "EUR",
  KR: "KRW",
  SI: "EUR",
  KP: "KPW",
  KW: "KWD",
  SN: "XOF",
  SM: "EUR",
  SL: "SLL",
  SC: "SCR",
  KZ: "KZT",
  KY: "KYD",
  SG: "SGD",
  SE: "SEK",
  SD: "SDG",
  DO: "DOP",
  DM: "XCD",
  DJ: "DJF",
  DK: "DKK",
  VG: "USD",
  DE: "EUR",
  YE: "YER",
  DZ: "DZD",
  US: "USD",
  UY: "UYU",
  YT: "EUR",
  UM: "USD",
  LB: "LBP",
  LC: "XCD",
  LA: "LAK",
  TV: "AUD",
  TW: "TWD",
  TT: "TTD",
  TR: "TRY",
  LK: "LKR",
  LI: "CHF",
  LV: "EUR",
  TO: "TOP",
  LT: "LTL",
  LU: "EUR",
  LR: "LRD",
  LS: "LSL",
  TH: "THB",
  TF: "EUR",
  TG: "XOF",
  TD: "XAF",
  TC: "USD",
  LY: "LYD",
  VA: "EUR",
  VC: "XCD",
  AE: "AED",
  AD: "EUR",
  AG: "XCD",
  AF: "AFN",
  AI: "XCD",
  VI: "USD",
  IS: "ISK",
  IR: "IRR",
  AM: "AMD",
  AL: "ALL",
  AO: "AOA",
  AQ: "",
  AS: "USD",
  AR: "ARS",
  AU: "AUD",
  AT: "EUR",
  AW: "AWG",
  IN: "INR",
  AX: "EUR",
  AZ: "AZN",
  IE: "EUR",
  ID: "IDR",
  UA: "UAH",
  QA: "QAR",
  MZ: "MZN"
};

module.exports = router;
