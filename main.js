const socket = io();

const GRID_WIDTH = 40;
const GRID_HEIGHT = 30;
const CELL_SIZE = 16;

const UP = 0;
const DOWN = 1;
const LEFT = 2;
const RIGHT = 3;

let state = { snakes: {}, food: null };
let graphics;

const config = {
    type: Phaser.AUTO,
    width: GRID_WIDTH * CELL_SIZE,
    height: GRID_HEIGHT * CELL_SIZE,
    backgroundColor: "#eeeeee",
    parent: "phaser-example",
    scene: { create, update },
};

new Phaser.Game(config);

function create() {
    graphics = this.add.graphics();

    socket.on("init", (data) => {
        state = data;
        drawScene();
    });

    socket.on("state", (data) => {
        state = data;
        drawScene();
    });

    this.input.keyboard.on("keydown", (e) => {
        if (e.code === "ArrowLeft") socket.emit("direction", LEFT);
        if (e.code === "ArrowRight") socket.emit("direction", RIGHT);
        if (e.code === "ArrowUp") socket.emit("direction", UP);
        if (e.code === "ArrowDown") socket.emit("direction", DOWN);
    });
}

function update() {}

function drawScene() {
    graphics.clear();

    if (state.food) {
        graphics.fillStyle(0xff0000, 1);
        graphics.fillCircle(
            state.food.x * CELL_SIZE + CELL_SIZE / 2,
            state.food.y * CELL_SIZE + CELL_SIZE / 2,
            CELL_SIZE / 2 - 1,
        );
    }

    for (const id in state.snakes) {
        const snake = state.snakes[id];
        const isSelf = id === socket.id;

        const colorNumber = parseInt(snake.color.slice(1), 16);
        graphics.fillStyle(colorNumber, 1);

        snake.body.forEach((seg, idx) => {
            const x = seg.x * CELL_SIZE;
            const y = seg.y * CELL_SIZE;

            if (isSelf && idx === 0) {
                graphics.fillStyle(colorNumber, 0.3);
                graphics.fillCircle(
                    x + CELL_SIZE / 2,
                    y + CELL_SIZE / 2,
                    CELL_SIZE * 0.8,
                );
                graphics.fillStyle(colorNumber, 1);
            }

            // Сам сегмент тела
            graphics.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        });
    }
}
