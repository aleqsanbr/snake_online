const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const GRID_WIDTH = 40;
const GRID_HEIGHT = 30;
const CELL_SIZE = 16;
const TICK_RATE = 130;

const UP = 0;
const DOWN = 1;
const LEFT = 2;
const RIGHT = 3;

let snakes = {};
let food = spawnFood();

let hueCounter = 0;

function spawnFood() {
    const x = Math.floor(Math.random() * GRID_WIDTH);
    const y = Math.floor(Math.random() * GRID_HEIGHT);
    return { x, y };
}

function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => {
        const color =
            l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return Math.round(255 * color)
            .toString(16)
            .padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

function createSnake(id) {
    const startX = Math.floor(Math.random() * GRID_WIDTH);
    const startY = Math.floor(Math.random() * GRID_HEIGHT);

    const hue = (hueCounter * 137) % 360;
    hueCounter++;

    const colorHex = hslToHex(hue, 100, 50);

    return {
        id,
        body: [{ x: startX, y: startY }],
        dir: RIGHT,
        pendingDir: RIGHT,
        alive: true,
        grow: 0,
        color: colorHex,
    };
}

io.on("connection", (socket) => {
    console.log(`Player connected: ${socket.id}`);

    snakes[socket.id] = createSnake(socket.id);

    socket.emit("init", { id: socket.id, snakes, food });
    io.emit("state", { snakes, food });

    socket.on("direction", (dir) => {
        const snake = snakes[socket.id];
        if (!snake) return;
        if (
            (dir === LEFT && snake.dir !== RIGHT) ||
            (dir === RIGHT && snake.dir !== LEFT) ||
            (dir === UP && snake.dir !== DOWN) ||
            (dir === DOWN && snake.dir !== UP)
        ) {
            snake.pendingDir = dir;
        }
    });

    socket.on("disconnect", () => {
        console.log(`Player left: ${socket.id}`);
        delete snakes[socket.id];
        io.emit("state", { snakes, food });
    });
});

setInterval(() => {
    for (const id in snakes) {
        const snake = snakes[id];
        if (!snake.alive) continue;

        snake.dir = snake.pendingDir;
        const head = { ...snake.body[0] };

        switch (snake.dir) {
            case LEFT:
                head.x = (head.x - 1 + GRID_WIDTH) % GRID_WIDTH;
                break;
            case RIGHT:
                head.x = (head.x + 1) % GRID_WIDTH;
                break;
            case UP:
                head.y = (head.y - 1 + GRID_HEIGHT) % GRID_HEIGHT;
                break;
            case DOWN:
                head.y = (head.y + 1) % GRID_HEIGHT;
                break;
        }

        const collision = Object.values(snakes).some((s) =>
            s.body.some((seg) => seg.x === head.x && seg.y === head.y),
        );
        if (collision) {
            snake.alive = false;
            continue;
        }

        snake.body.unshift(head);

        if (head.x === food.x && head.y === food.y) {
            snake.grow++;
            food = spawnFood();
        }

        if (snake.grow > 0) {
            snake.grow--;
        } else {
            snake.body.pop();
        }
    }

    io.emit("state", { snakes, food });
}, TICK_RATE);

app.use(express.static(__dirname));
const PORT = process.env.PORT || 80;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
