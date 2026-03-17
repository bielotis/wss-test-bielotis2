import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: process.env.PORT || 3001 });

// Ranking en memoria
let ranking = [];

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(c => {
    if (c.readyState === 1) c.send(msg);
  });
}

wss.on("connection", (socket) => {
  console.log("Nuevo cliente conectado");

  // ❗ SOLO JSON
  socket.send(JSON.stringify({ tipo: "ranking", ranking }));

  socket.on("message", (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch (e) {
      console.log("Mensaje ignorado (no es JSON):", msg);
      return;
    }

    if (data.tipo === "resultado") {
      ranking.push({
        cps: parseFloat(data.cps),
        wpm: parseFloat(data.wpm),
        precision: parseFloat(data.precision),
        errores: data.errores,
        fecha: Date.now()
      });

      ranking.sort((a, b) => b.cps - a.cps);

      broadcast({ tipo: "ranking", ranking });
    }
  });

  socket.on("close", () => {
    console.log("Cliente desconectado");
  });
});
