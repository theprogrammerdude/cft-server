const functions = require("firebase-functions");
const admin = require("firebase-admin");

const cors = require("cors");

admin.initializeApp();
const db = admin.firestore();

const WebSocket = require("ws");
var ws = new WebSocket("wss://stream.binance.com:9443/ws/!ticker@arr");

const coins = [
  "BTC",
  "ETH",
  "BNB",
  "BCH",
  "ADA",
  "ATOM",
  "DOT",
  "SHIB",
  "DOGE",
  "DASH",
  "XRP",
  "FIL",
  "LINK",
  "LTC",
  "MKR",
  "PAXG",
  "SOL",
  "UNI",
  "XMR",
  "YFI",
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
  });

  setTimeout(() => {
    bids.forEach((e) => {
      //   console.log(e.uid);

      db.doc(`users/${e.uid}`)
        .collection("bid")
        .doc(e.transactionId)
        .onSnapshot((snap) => {
          var coin = snap.data();

          // console.log(coin);

          bidTransactions.push({ ...coin, ...e });
          //   console.log(bidTransactions);
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
  //   console.log(bidTransactions);

  bidTransactions.forEach((b) => {
    // console.log(b.pair.split("-")[0]);

    tickers.forEach((ticker) => {
      var sym = ticker.s;

      if (b.pair.split("-")[0] === sym.substring(0, sym.length - 4)) {
        // console.log(ticker.a);

        if (b.trade === "buy") {
          //   console.log(b.bid);

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
                    db.doc(`users/${b.uid}`)
                      .collection("bid")
                      .doc(b.transactionId)
                      .delete();

                    db.collection("bid").doc(b.transactionId).delete();
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
                    db.doc(`users/${b.uid}`)
                      .collection("bid")
                      .doc(b.transactionId)
                      .delete();

                    db.collection("bid").doc(b.transactionId).delete();
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
                    db.doc(`users/${b.uid}`)
                      .collection("bid")
                      .doc(b.transactionId)
                      .delete();

                    db.collection("bid").doc(b.transactionId).delete();
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
                    db.doc(`users/${b.uid}`)
                      .collection("bid")
                      .doc(b.transactionId)
                      .delete();

                    db.collection("bid").doc(b.transactionId).delete();
                  });

            return;
          }
        }
      }
    });
  });
};

checkForSls = () => {
  //   console.log(slTransactions);

  slTransactions.forEach((b) => {
    // console.log(b.pair.split("-")[0]);

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
                    db.doc(`users/${b.uid}`)
                      .collection("sl")
                      .doc(b.transactionId)
                      .delete();

                    db.collection("sls").doc(b.transactionId).delete();
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
                    db.doc(`users/${b.uid}`)
                      .collection("sl")
                      .doc(b.transactionId)
                      .delete();

                    db.collection("sls").doc(b.transactionId).delete();
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
                    db.doc(`users/${b.uid}`)
                      .collection("sl")
                      .doc(b.transactionId)
                      .delete();

                    db.collection("sls").doc(b.transactionId).delete();
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
                    db.doc(`users/${b.uid}`)
                      .collection("sl")
                      .doc(b.transactionId)
                      .delete();

                    db.collection("sls").doc(b.transactionId).delete();
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

setTimeout(() => {
  getAllBids();
  getAllSls();
}, 2000);

setInterval(() => {
  checkForBids();
  checkForSls();
}, 1000);
