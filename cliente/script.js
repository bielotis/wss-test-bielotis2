const frase = "es";

let autoMode = false;
let terminado = false;

let index = 0;
let startTime = 0;
let endTime = 0;
let errores = 0;

const target = document.getElementById("target");
const typed = document.getElementById("typed");
const input = document.getElementById("input");
const rankingBox = document.getElementById("ranking");

target.textContent = frase;

const ws = new WebSocket("wss://wss-test-bielotis2.onrender.com/");

ws.onopen = () => {
  console.log("WS abierto");
  ws.send(JSON.stringify({ tipo: "inicio", frase }));
};

ws.onmessage = (event) => {
  console.log("Mensaje WS recibido:", event.data);

  let data;
  try {
    data = JSON.parse(event.data);
  } catch (e) {
    console.warn("Mensaje ignorado (no es JSON):", event.data);
    return;
  }

  if (data.tipo === "ranking") {
    if (!Array.isArray(data.ranking) || data.ranking.length === 0) {
      rankingBox.textContent = "Aún no hay resultados.";
      return;
    }

    rankingBox.textContent = data.ranking
      .map((r, i) =>
        `${i + 1}. CPS: ${r.cps} | WPM: ${r.wpm} | Precisión: ${r.precision}% | Errores: ${r.errores}`
      )
      .join("\n");
  }
};

function enviarResultado(resultado) {
  ws.send(JSON.stringify({ tipo: "resultado", ...resultado }));
}

input.addEventListener("input", () => {
  if (autoMode) return;
  if (terminado) return;

  const valor = input.value;
  const ultimo = valor[valor.length - 1];

  if (index === 0 && ultimo === frase[0]) {
    startTime = performance.now();
  }

  if (valor.length < index) {
    input.value = frase.slice(0, index);
    return;
  }

  if (ultimo === frase[index]) {
    index++;
    typed.textContent = frase.slice(0, index);
  } else {
    errores++;
    input.value = frase.slice(0, index);
  }

  if (index === frase.length && !terminado) {
    terminado = true;
    endTime = performance.now();

    const tiempoSegundos = (endTime - startTime) / 1000;

    const cps = (frase.length / tiempoSegundos).toFixed(2);
    const wpm = ((frase.length / 5) / (tiempoSegundos / 60)).toFixed(2);
    const precision = ((frase.length / (frase.length + errores)) * 100).toFixed(2);

    enviarResultado({ cps, wpm, precision, errores });

    alert(
      `Resultados:\n` +
      `CPS: ${cps}\n` +
      `WPM: ${wpm}\n` +
      `Precisión: ${precision}%\n` +
      `Errores: ${errores}`
    );

    input.disabled = true;
  }
});
