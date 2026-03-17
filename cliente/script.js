// =====================================
//  CONFIG
// =====================================
const frase = "El zorro marrón salta sobre el perro perezoso";

// =====================================
//  VARIABLES
// =====================================
let index = 0;
let startTime = 0;
let endTime = 0;
let errores = 0;
let terminado = false;

// Detector de bots
let lastKeyTime = performance.now();
let intervals = [];
let keyPressed = false;

// =====================================
//  UI
// =====================================
const target = document.getElementById("target");
const typed = document.getElementById("typed");
const input = document.getElementById("input");
const rankingBox = document.getElementById("ranking");

target.textContent = frase;

// =====================================
//  WEBSOCKET
// =====================================
const ws = new WebSocket("wss://TU-SERVIDOR.onrender.com");

ws.onopen = () => {
  ws.send(JSON.stringify({ tipo: "inicio", frase }));
};

ws.onmessage = (event) => {
  let data;
  try {
    data = JSON.parse(event.data);
  } catch {
    return;
  }

  if (data.tipo === "ranking") {
    if (!data.ranking.length) {
      rankingBox.textContent = "Aún no hay resultados.";
      return;
    }

    rankingBox.textContent = data.ranking
      .map((r, i) =>
        `${i + 1}. CPS: ${r.cps} | WPM: ${r.wpm} | Precisión: ${r.precision}% | Errores: ${r.errores} | Bot: ${r.bot ? "Sí" : "No"}`
      )
      .join("\n");
  }
};

function enviarResultado(resultado) {
  ws.send(JSON.stringify({ tipo: "resultado", ...resultado }));
}

// =====================================
//  DETECTOR DE BOTS
// =====================================
function detectarBot() {
  if (intervals.length < 5) return false;

  const media = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variacion = Math.max(...intervals) - Math.min(...intervals);

  const cps = index / ((endTime - startTime) / 1000);

  return (
    media < 30 ||         // demasiado rápido
    variacion < 5 ||      // intervalos idénticos
    cps > 15 ||           // velocidad imposible
    errores === 0         // precisión perfecta sospechosa
  );
}

// =====================================
//  TYPING TEST
// =====================================
input.addEventListener("keydown", () => {
  keyPressed = true;

  const now = performance.now();
  intervals.push(now - lastKeyTime);
  lastKeyTime = now;
});

input.addEventListener("keyup", () => {
  keyPressed = false;
});

input.addEventListener("input", () => {
  if (terminado) return;

  const valor = input.value;
  const ultimo = valor[valor.length - 1];

  // Detectar escritura sin keydown (script)
  if (!keyPressed) {
    console.log("Posible bot: input sin keydown");
  }

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

    const bot = detectarBot();

    enviarResultado({ cps, wpm, precision, errores, bot });

    alert(
      `Resultados:\n` +
      `CPS: ${cps}\n` +
      `WPM: ${wpm}\n` +
      `Precisión: ${precision}%\n` +
      `Errores: ${errores}\n` +
      `¿Bot?: ${bot ? "Sí" : "No"}`
    );

    input.disabled = true;
  }
});
