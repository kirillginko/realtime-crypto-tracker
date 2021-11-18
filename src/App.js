import React, { useState, useEffect, useRef } from "react";
import Dashboard from "./components/Dashboard";
import { formatData } from "./utils";
import "./styles.css";

export default function App() {
  const [currencies, setcurrencies] = useState([]);
  const [btcPrice, setBtcPrice] = useState("0.00");
  const [ethPrice, setEthPrice] = useState("0.00");
  const [pair, setpair] = useState("");
  const [price, setprice] = useState("0.00");
  const [pastData, setpastData] = useState({});
  const ws = useRef(null);

  let first = useRef(false);
  const url = "https://api.pro.coinbase.com";

  useEffect(() => {
    ws.current = new WebSocket("wss://ws-feed.pro.coinbase.com");

    let pairs = [];

    const apiCall = async () => {
      await fetch(url + "/products")
        .then((res) => res.json())
        .then((data) => (pairs = data));

      let filtered = pairs.filter((pair) => {
        if (pair.quote_currency === "USD") {
          return pair;
        }
        console.log(pair);
      });

      filtered = filtered.sort((a, b) => {
        if (a.base_currency < b.base_currency) {
          return -1;
        }
        if (a.base_currency > b.base_currency) {
          return 1;
        }
        return 0;
      });

      setcurrencies(filtered);
      const newFiltered = [
        filtered[22],
        filtered[43],
        filtered[98],
        filtered[37],
        filtered[64],
        filtered[38],
      ];
      setcurrencies(newFiltered);

      first.current = true;
    };

    apiCall();
  }, []);

  // useEffect(() => {
  //   let apiData = `${url}/products/${pair}`;
  //   let products = [];
  //   const productsApi = async () => {
  //     await fetch(apiData)
  //       .then((res) => res.json())
  //       .then((data) => (products = data));

  //     let dataUsd = products.filter((product) => {
  //       if (product.quote_currency === "USD") {
  //         return product;
  //       }
  //     });
  //     console.log(dataUsd);
  //   };
  //   productsApi();
  // }, []);
  useEffect(() => {
    const binanceBtcSocket = new WebSocket(
      "wss://stream.binance.com:9443/ws/btcusdt@trade"
    );
    binanceBtcSocket.onmessage = (e) => {
      console.log(e.data);
      let messageObject = JSON.parse(e.data);
      let num = messageObject.p;
      let round = Math.round(num * 100) / 100;
      setBtcPrice(round);
    };
  }, []);
  useEffect(() => {
    const binanceEthSocket = new WebSocket(
      "wss://stream.binance.com:9443/ws/ethusdt@trade"
    );
    binanceEthSocket.onmessage = (e) => {
      // console.log(e.data);
      let messageObject = JSON.parse(e.data);
      let num = messageObject.p;
      let round = Math.round(num * 100) / 100;
      setEthPrice(round);
    };
  }, []);

  useEffect(() => {
    if (!first.current) {
      return;
    }

    let msg = {
      type: "subscribe",
      product_ids: [pair],
      channels: ["ticker"],
    };
    let jsonMsg = JSON.stringify(msg);
    ws.current.send(jsonMsg);

    let historicalDataURL = `${url}/products/${pair}/candles?granularity=86400`;
    const fetchHistoricalData = async () => {
      let dataArr = [];
      await fetch(historicalDataURL)
        .then((res) => res.json())
        .then((data) => (dataArr = data));
      let formattedData = formatData(dataArr);
      setpastData(formattedData);
    };
    fetchHistoricalData();

    ws.current.onmessage = (e) => {
      let data = JSON.parse(e.data);
      if (data.type !== "ticker") {
        return;
      }

      if (data.product_id === pair) {
        setprice(data.price);
      }
    };
  }, [pair]);

  const handleSelect = (e) => {
    let unsubMsg = {
      type: "unsubscribe",
      product_ids: [pair],
      channels: ["ticker"],
    };
    let unsub = JSON.stringify(unsubMsg);

    ws.current.send(unsub);

    setpair(e.target.value);
  };

  return (
    <div className="container">
      <div className="crypto">
        <h1>Bitcoin: ${btcPrice}</h1>
        <h1
          style={
            { ethPrice } >= 1000 ? { color: "black" } : { color: "maroon" }
          }
        >
          Etherium: ${ethPrice}
        </h1>
      </div>

      <div>
        {
          <select name="currency" onChange={handleSelect}>
            {currencies.map((cur, idx) => {
              return (
                <option key={idx} value={cur.id}>
                  {cur.display_name}
                </option>
              );
            })}
          </select>
        }
      </div>
      <Dashboard price={price} data={pastData} />
    </div>
  );
}
