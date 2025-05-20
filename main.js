const socket = io();
const GRID_WIDTH = 40,
    GRID_HEIGHT = 30,
    CELL_SIZE = 16;
const UP = 0,
    DOWN = 1,
    LEFT = 2,
    RIGHT = 3;

const config = {
    type: Phaser.AUTO,
    width: GRID_WIDTH * CELL_SIZE,
    height: GRID_HEIGHT * CELL_SIZE,
    backgroundColor: "#eeeeee",
    parent: "phaser-example",
    scene: { create, update },
};
new Phaser.Game(config);
let state = { snakes: {}, food: null };
let graphics;
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

    const colors = [0x0000ff, 0x00ff00, 0x000000, 0xffff00, 0xff00ff];
    let i = 0;
    for (const id in state.snakes) {
        const snake = state.snakes[id];
        const color = colors[i++ % colors.length];
        graphics.fillStyle(color, 1);
        snake.body.forEach((seg) => {
            graphics.fillRect(
                seg.x * CELL_SIZE + 1,
                seg.y * CELL_SIZE + 1,
                CELL_SIZE - 2,
                CELL_SIZE - 2,
            );
        });
    }
}
