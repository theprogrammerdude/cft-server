const functions = require("firebase-functions");
const admin = require("firebase-admin");

var serviceAccount = require("./service-account.json");

const cors = require("cors");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

const WebSocket = require("ws");
var ws = new WebSocket("wss://stream.binance.com:9443/ws/!ticker@arr");

const coins = [
  "ADA",
  "ALGO",
  "AMP",
  "ATOM",
  "AVAX",
  "AXS",
  "BAL",
  "BCH",
  "BTC",
  "CAKE",
  "COMP",
  "CRV",
  "DASH",
  "DOGE",
  "DOT",
  "EGLD",
  "ENJ",
  "ETC",
  "ETH",
  "FIL",
  "FTM",
  "FTT",
  "ICP",
  "KSM",
  "LINK",
  "LTC",
  "LUNA",
  "MANA",
  "MATIC",
  "MIR",
  "MKR",
  "NEAR",
  "PAXG",
  "QNT",
  "QUICK",
  "SHIB",
  "SNX",
  "SQL",
  "SUSHI",
  "TRB",
  "UMA",
  "UNI",
  "XMR",
  "XRP",
  "YFI",
  "ZEC",
];

var tickers = [];
var uids = [];
var bidTransactions = [];
var slTransactions = [];

socketData = () => {
  //   ws.on("open", (msg) => {
  //     console.log(msg);
  //   });

  ws.onmessage = (msg) => {
    tickers = [];
    // console.log(msg.data);

    var tempArr = JSON.parse(msg.data);

    tempArr.forEach((e) => {
      //   console.log(e);

      var sym = e.s;

      if (sym.substring(sym.length, sym.length - 4) === "USDT") {
        // console.log(sym);

        coins.includes(sym.substring(0, sym.length - 4)) === true
          ? tickers.push(e)
          : null;
      }
    });
  };
};

allUserUid = () => {
  db.collection("users").onSnapshot((snap) => {
    // console.log(snap);

    snap.docs.forEach((e) => {
      //   console.log(Object.values(e._fieldsProto.uid)[0]);
      var uid = Object.values(e._fieldsProto.uid)[0];

      uids.push(uid);
    });
  });
};

getAllBids = () => {
  var bids = [];

  db.collection("bids").onSnapshot((snap) => {
    snap.docs.forEach((doc) => {
      bids.push({
        transactionId: Object.values(doc._fieldsProto.transactionId)[0],
        uid: Object.values(doc._fieldsProto.uid)[0],
      });
    });

    // console.log(bids);
  });

  setTimeout(() => {
    bids.forEach((e) => {
      // console.log(e.uid);

      db.doc(`users/${e.uid}`)
        .collection("bid")
        .doc(e.transactionId)
        .onSnapshot((snap) => {
          var coin = snap.data();

          bidTransactions.push({ ...coin, ...e });
          console.log(bidTransactions);
        });
    });
  }, 1500);
};

getAllSls = () => {
  var sls = [];

  db.collection("sls").onSnapshot((snap) => {
    snap.docs.forEach((doc) => {
      bids.push({
        transactionId: Object.values(doc._fieldsProto.transactionId)[0],
        uid: Object.values(doc._fieldsProto.uid)[0],
        type: Object.values(doc._fieldsProto.type)[0],
      });
    });
  });

  setTimeout(() => {
    sls.forEach((e) => {
      //   console.log(e.uid);

      db.doc(`users/${e.uid}`)
        .collection("sl")
        .doc(e.transactionId)
        .onSnapshot((snap) => {
          var coin = snap.data();

          // console.log(coin);

          slTransactions.push({ ...coin, ...e });
          //   console.log(bidTransactions);
        });
    });
  }, 1500);
};

checkForBids = () => {
  bidTransactions.forEach((b) => {
    tickers.forEach((ticker) => {
      var sym = ticker.s;

      if (b.pair.split("-")[0] === sym.substring(0, sym.length - 4)) {
        // console.log(ticker.a);

        if (b.trade === "buy") {
          // console.log(b.bid);

          if (ticker.a >= b.bid) {
            // console.log(ticker.a >= b.bid);

            b.currentExp !== null
              ? db
                  .doc(`users/${b.uid}`)
                  .collection("trades")
                  .doc(b.transactionId)
                  .set({
                    pair: b.pair,
                    ap: b.ap,
                    bp: parseFloat(ticker.a),
                    at: Date.now(),
                    o: b.o,
                    h: b.h,
                    l: b.l,
                    c: b.c,
                    logo: b.logo,
                    lotSize: b.lotSize,
                    margin: b.margin,
                    name: b.name,
                    todaysChange: b.todaysChange,
                    todaysChangePerc: b.todaysChangePerc,
                    trade: b.trade,
                    transactionId: b.transactionId,
                    currentExp: b.currentExp,
                    quantity: b.quantity,
                  })
                  .then(() => {
                    db.collection("bids").doc(b.transactionId).delete();

                    db.doc(`users/${b.uid}`)
                      .collection("bid")
                      .doc(b.transactionId)
                      .delete();
                  })
              : db
                  .doc(`users/${b.uid}`)
                  .collection("trades")
                  .doc(b.transactionId)
                  .set({
                    pair: b.pair,
                    ap: b.ap,
                    bp: parseFloat(ticker.a),
                    at: Date.now(),
                    o: b.o,
                    h: b.h,
                    l: b.l,
                    c: b.c,
                    logo: b.logo,
                    lotSize: b.lotSize,
                    margin: b.margin,
                    name: b.name,
                    todaysChange: b.todaysChange,
                    todaysChangePerc: b.todaysChangePerc,
                    trade: b.trade,
                    transactionId: b.transactionId,
                    futExp: b.futExp,
                    quantity: b.quantity,
                  })
                  .then(() => {
                    db.collection("bids").doc(b.transactionId).delete();

                    db.doc(`users/${b.uid}`)
                      .collection("bid")
                      .doc(b.transactionId)
                      .delete();
                  });

            return;
          }
        } else if (b.trade === "sell") {
          //   console.log(b.bid);

          if (ticker.b <= b.sell) {
            // console.log(ticker.a >= b.bid);

            b.currentExp !== null
              ? db
                  .doc(`users/${b.uid}`)
                  .collection("trades")
                  .doc(b.transactionId)
                  .set({
                    pair: b.pair,
                    ap: b.ap,
                    bp: parseFloat(ticker.a),
                    at: Date.now(),
                    o: b.o,
                    h: b.h,
                    l: b.l,
                    c: b.c,
                    logo: b.logo,
                    lotSize: b.lotSize,
                    margin: b.margin,
                    name: b.name,
                    todaysChange: b.todaysChange,
                    todaysChangePerc: b.todaysChangePerc,
                    trade: b.trade,
                    transactionId: b.transactionId,
                    currentExp: b.currentExp,
                    quantity: b.quantity,
                  })
                  .then(() => {
                    db.collection("bids").doc(b.transactionId).delete();

                    db.doc(`users/${b.uid}`)
                      .collection("bid")
                      .doc(b.transactionId)
                      .delete();
                  })
              : db
                  .doc(`users/${b.uid}`)
                  .collection("trades")
                  .doc(b.transactionId)
                  .set({
                    pair: b.pair,
                    ap: b.ap,
                    bp: parseFloat(ticker.a),
                    at: Date.now(),
                    o: b.o,
                    h: b.h,
                    l: b.l,
                    c: b.c,
                    logo: b.logo,
                    lotSize: b.lotSize,
                    margin: b.margin,
                    name: b.name,
                    todaysChange: b.todaysChange,
                    todaysChangePerc: b.todaysChangePerc,
                    trade: b.trade,
                    transactionId: b.transactionId,
                    futExp: b.futExp,
                    quantity: b.quantity,
                  })
                  .then(() => {
                    db.collection("bids").doc(b.transactionId).delete();

                    db.doc(`users/${b.uid}`)
                      .collection("bid")
                      .doc(b.transactionId)
                      .delete();
                  });

            return;
          }
        }
      }
    });
  });
};

checkForSls = () => {
  // console.log(slTransactions);

  slTransactions.forEach((b) => {
    tickers.forEach((ticker) => {
      var sym = ticker.s;

      if (b.pair.split("-")[0] === sym.substring(0, sym.length - 4)) {
        // console.log(ticker.a);

        if (b.trade === "buy") {
          //   console.log(b.sl);

          if (ticker.a >= b.sl) {
            // console.log(ticker.a >= b.sl);

            b.currentExp !== null
              ? db
                  .doc(`users/${b.uid}`)
                  .collection("trades")
                  .doc(b.transactionId)
                  .set({
                    pair: b.pair,
                    ap: b.ap,
                    bp: parseFloat(ticker.a),
                    at: Date.now(),
                    o: b.o,
                    h: b.h,
                    l: b.l,
                    c: b.c,
                    logo: b.logo,
                    lotSize: b.lotSize,
                    margin: b.margin,
                    name: b.name,
                    todaysChange: b.todaysChange,
                    todaysChangePerc: b.todaysChangePerc,
                    trade: b.trade,
                    transactionId: b.transactionId,
                    currentExp: b.currentExp,
                    quantity: b.quantity,
                  })
                  .then(() => {
                    db.collection("sls").doc(b.transactionId).delete();

                    db.doc(`users/${b.uid}`)
                      .collection("sl")
                      .doc(b.transactionId)
                      .delete();
                  })
              : db
                  .doc(`users/${b.uid}`)
                  .collection("trades")
                  .doc(b.transactionId)
                  .set({
                    pair: b.pair,
                    ap: b.ap,
                    bp: parseFloat(ticker.a),
                    at: Date.now(),
                    o: b.o,
                    h: b.h,
                    l: b.l,
                    c: b.c,
                    logo: b.logo,
                    lotSize: b.lotSize,
                    margin: b.margin,
                    name: b.name,
                    todaysChange: b.todaysChange,
                    todaysChangePerc: b.todaysChangePerc,
                    trade: b.trade,
                    transactionId: b.transactionId,
                    futExp: b.futExp,
                    quantity: b.quantity,
                  })
                  .then(() => {
                    db.collection("sls").doc(b.transactionId).delete();

                    db.doc(`users/${b.uid}`)
                      .collection("sl")
                      .doc(b.transactionId)
                      .delete();
                  });

            return;
          }
        } else if (b.trade === "sell") {
          //   console.log(b.sl);

          if (ticker.b <= b.sell) {
            // console.log(ticker.a >= b.sl);

            b.currentExp !== null
              ? db
                  .doc(`users/${b.uid}`)
                  .collection("trades")
                  .doc(b.transactionId)
                  .set({
                    pair: b.pair,
                    ap: b.ap,
                    bp: parseFloat(ticker.a),
                    at: Date.now(),
                    o: b.o,
                    h: b.h,
                    l: b.l,
                    c: b.c,
                    logo: b.logo,
                    lotSize: b.lotSize,
                    margin: b.margin,
                    name: b.name,
                    todaysChange: b.todaysChange,
                    todaysChangePerc: b.todaysChangePerc,
                    trade: b.trade,
                    transactionId: b.transactionId,
                    currentExp: b.currentExp,
                    quantity: b.quantity,
                  })
                  .then(() => {
                    db.collection("sls").doc(b.transactionId).delete();

                    db.doc(`users/${b.uid}`)
                      .collection("sl")
                      .doc(b.transactionId)
                      .delete();
                  })
              : db
                  .doc(`users/${b.uid}`)
                  .collection("trades")
                  .doc(b.transactionId)
                  .set({
                    pair: b.pair,
                    ap: b.ap,
                    bp: parseFloat(ticker.a),
                    at: Date.now(),
                    o: b.o,
                    h: b.h,
                    l: b.l,
                    c: b.c,
                    logo: b.logo,
                    lotSize: b.lotSize,
                    margin: b.margin,
                    name: b.name,
                    todaysChange: b.todaysChange,
                    todaysChangePerc: b.todaysChangePerc,
                    trade: b.trade,
                    transactionId: b.transactionId,
                    futExp: b.futExp,
                    quantity: b.quantity,
                  })
                  .then(() => {
                    db.collection("sls").doc(b.transactionId).delete();

                    db.doc(`users/${b.uid}`)
                      .collection("sl")
                      .doc(b.transactionId)
                      .delete();
                  });

            return;
          }
        }
      }
    });
  });
};

socketData();
allUserUid();

setInterval(() => {
  getAllBids();
  getAllSls();
}, 2500);

setInterval(() => {
  checkForBids();
  checkForSls();
}, 1000);
