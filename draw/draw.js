function pythag(a, b) {
    return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
}
function inRange(min, x, max) {
    return min < x && x < max;
}
function cleanCanvas(canvas) {
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
}
function toDigits(num) {
    return (new String(num)).split("").filter(d => d !== ".").map(d => parseInt(d));
}
function drawLine(canvas, begin, end, stroke = "black", width = 1) {
    const ctx = canvas.getContext("2d");
    if (stroke) {
        ctx.strokeStyle = stroke;
    }
    if (width) {
        ctx.lineWidth = width;
    }
    ctx.beginPath();
    ctx.moveTo(begin[0], begin[1]);
    ctx.lineTo(end[0], end[1]);
    ctx.stroke();
}
function drawPolygon(canvas, points, fill = "black") {
    const ctx = canvas.getContext("2d");
    if (fill) {
        ctx.fillStyle = fill;
    }
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(...points[i]);
    }
    ctx.fill();
}
function drawPolyline(canvas, points, stroke = "black") {
    const ctx = canvas.getContext("2d");
    if (stroke) {
        ctx.strokeStyle = stroke;
    }
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(...points[i]);
    }
    ctx.stroke();
}
function drawRect(canvas, topLeft, sideLengths, stroke = "black", width = 1) {
    let ver = 0, hor = 0;
    if (typeof sideLengths === "number") {
        ver = sideLengths;
        hor = sideLengths;
    }
    else {
        hor = sideLengths[0];
        ver = sideLengths[1];
    }
    drawLine(canvas, topLeft, [topLeft[0] + hor, topLeft[1]], stroke, width);
    drawLine(canvas, topLeft, [topLeft[0], topLeft[1] + ver], stroke, width);
    drawLine(canvas, [topLeft[0] + hor, topLeft[1] + ver], [topLeft[0] + hor, topLeft[1]], stroke, width);
    drawLine(canvas, [topLeft[0] + hor, topLeft[1] + ver], [topLeft[0], topLeft[1] + ver], stroke, width);
}
function drawArc(canvas, center, radius, startAngle, endAngle, stroke = "black", width = 1) {
    const ctx = canvas.getContext("2d");
    if (stroke) {
        ctx.strokeStyle = stroke;
    }
    if (width) {
        ctx.lineWidth = width;
    }
    ctx.beginPath();
    ctx.ellipse(center[0], center[1], radius, radius, 0, startAngle, endAngle);
    ctx.stroke();
}
function drawCircle(canvas, center, radius, stroke = "black", width = 1) {
    drawArc(canvas, center, radius, 0, 2 * Math.PI, stroke, width);
}
function drawText(canvas, point, text, font = "10px Arial") {
    const ctx = canvas.getContext("2d");
    if (font) {
        ctx.font = font;
    }
    ctx.fillText(text, point[0], point[1]);
}
function borderCanvas(canvas) {
    const lineWidth = 2;
    const ctx = canvas.getContext("2d");
    drawLine(canvas, [0, 0], [canvas.width, 0], "black", lineWidth);
    drawLine(canvas, [0, 0], [0, canvas.height], "black", lineWidth);
    drawLine(canvas, [canvas.width, 0], [canvas.width, canvas.height], "black", lineWidth);
    drawLine(canvas, [0, ctx.canvas.height], [canvas.width, canvas.height], "black", lineWidth);
}
function createTextSpan(text, color = null) {
    const span = document.createElement("span");
    if (color) {
        span.style.color = color;
    }
    span.appendChild(document.createTextNode(text));
    return span;
}
function getElementTree(element) {
    const result = [element];
    let current = element;
    while (current !== document.body) {
        current = current.parentElement;
        result.push(current);
    }
    return result;
}
class Cartesian {
    constructor(coords, y = 0) {
        if (typeof coords === "number") {
            this.x = coords;
            this.y = y;
        }
        else if (Object.keys(coords).includes("transform")) {
            this.x = coords.x;
            this.y = coords.y;
        }
        else if (Object.keys(coords).includes("0") && Object.keys(coords).includes("1")) {
            this.x = coords[0];
            this.y = coords[1];
        }
        else {
            this.x = coords.x;
            this.y = coords.y;
        }
    }
    identify() { return "Cartesian"; }
    transform(coords, y = 0) {
        const transform = new Cartesian(coords, y);
        return new Cartesian(this.x + transform.x, this.y + transform.y);
    }
    toString() {
        return "[x: " + this.x + ", y: " + this.y + "]";
    }
    get arr() {
        return [this.x, this.y];
    }
    eq(other) {
        return (this.x === other.x && this.y === other.y);
    }
}
Cartesian.TOPOLAR = (point) => new Polar(Math.atan2(point.y, point.x), pythag(point.x, point.y));
class Polar {
    constructor(coords, radius = 0) {
        if (typeof coords === "number") {
            this.angle = coords;
            this.radius = radius;
        }
        else if (Object.keys(coords).includes("transform")) {
            this.angle = coords.angle;
            this.radius = coords.radius;
        }
        else if (Object.keys(coords).includes("0") && Object.keys(coords).includes("1")) {
            this.angle = coords[0];
            this.radius = coords[1];
        }
        else {
            this.angle = coords.angle;
            this.radius = coords.radius;
        }
    }
    identify() { return "Polar"; }
    transform(angle, radius = 0) {
        const transform = Polar.TOCARTESIAN(new Polar(angle, radius));
        return Cartesian.TOPOLAR(Polar.TOCARTESIAN(this).transform(transform));
    }
    rotate(angle) {
        return new Polar(this.angle + angle, this.radius);
    }
    toString() {
        return "[angle: " + this.angle + ", radius: " + this.radius + "]";
    }
    scale(scalar) {
        return new Polar(this.angle, this.radius * scalar);
    }
}
Polar.TOCARTESIAN = (point) => new Cartesian(point.radius * Math.cos(point.angle), point.radius * Math.sin(point.angle));
class Shape {
    constructor(name, origin, polygons, shapes) {
        this.name = name;
        this.polygons = polygons;
        this.shapes = shapes;
        this.rotation = 0;
        this.root = true;
        this.original = null;
        this.origin = new Cartesian(origin);
        this.shapes.forEach(s => { s.root = false; });
    }
    get evaluated() { return this.original !== null; }
    identify() { return "Shape"; }
    evaluate(state = null) {
        const adjustedState = state === null ?
            { position: this.origin, rotation: this.rotation } :
            { position: state.position.transform(Polar.TOCARTESIAN(Cartesian.TOPOLAR(this.origin).rotate(state.rotation))), rotation: state.rotation + this.rotation };
        const result = new Shape(this.name, adjustedState.position, [], []);
        result.original = this;
        result.rotation = adjustedState.rotation;
        result.root = this.root;
        this.polygons.forEach(p => {
            result.polygons.push(p.evaluate(adjustedState));
        });
        this.shapes.forEach(s => {
            result.shapes.push(s.evaluate(adjustedState));
        });
        return result;
    }
    renderAll(canvas) {
        const polygons = Shape.ALLPOLYGONS(this.evaluate()).sort((a, b) => a.layer - b.layer);
        polygons.forEach(poly => {
            const points = poly.points.map(p => [p.x, p.y]);
            if (poly.lineOnly) {
                drawPolyline(canvas, points, poly.color);
            }
            else {
                drawPolygon(canvas, points, poly.color);
            }
        });
    }
}
Shape.ALLPOLYGONS = (shape) => {
    let result = shape.polygons;
    shape.shapes.forEach(s => {
        result = result.concat(Shape.ALLPOLYGONS(s));
    });
    return result;
};
class Polygon {
    constructor(points, color = "", layer = 0, lineOnly = false) {
        this.color = color;
        this.layer = layer;
        this.lineOnly = lineOnly;
        this.original = null;
        this.points = points.map(p => new Cartesian(p));
    }
    get evaluated() { return this.original !== null; }
    identify() { return "Polygon"; }
    evaluate(state) {
        const adjustedPoints = this.points.map(p => {
            return state.position.transform(Polar.TOCARTESIAN(Cartesian.TOPOLAR(p).rotate(state.rotation)));
        });
        const result = new Polygon(adjustedPoints, this.color, this.layer, this.lineOnly);
        result.original = this;
        return result;
    }
}
class Force {
    constructor(force) {
        this.force = force;
    }
    get angle() { return this.force.angle; }
    get magnitude() { return this.force.radius; }
    get CForce() { return Polar.TOCARTESIAN(this.force); }
    setMagnitude(magnitude) {
        this.force.radius = magnitude;
        return this.force;
    }
    sumForce(force) {
        return new Force(this.force.transform(force.force));
    }
}
Force.ZEROFORCE = () => new Force(new Polar(0, 0));
class Button {
    constructor(keys, handler, focusedElement) {
        this.handler = handler;
        this.focusedElement = focusedElement;
        this.state = false;
        this.keys = [keys[0]];
    }
    change(key, down, activeElement) {
        if (getElementTree(activeElement).includes(this.focusedElement)) {
            this.state = down;
            this.handler(down);
        }
    }
}
class QAxis {
    constructor(keys, handler, focusedElement) {
        this.handler = handler;
        this.focusedElement = focusedElement;
        this.state = 0;
        this.states = [0, 0];
        this.keys = [keys[0], keys[1]];
    }
    change(key, down, activeElement) {
        if (getElementTree(activeElement).includes(this.focusedElement)) {
            const idx = this.keys.findIndex(k => k === key);
            this.states[idx] = down ? [-1, 1][idx] : 0;
            this.state = this.states[0] + this.states[1];
            this.handler(this.state);
        }
    }
}
class Input {
    constructor() {
        this.keyHandlers = new Map();
        this.canvasMouseCoords = [0, 0];
        this.keyHandlers.set("udAX", new QAxis(["arrowup", "arrowdown"], () => { }, Game.GAME.camera.canvas));
        this.keyHandlers.set("lrAX", new QAxis(["arrowleft", "arrowright"], () => { }, Game.GAME.camera.canvas));
        this.keyHandlers.set("minB", new Button(["-"], (down) => { if (down) {
            Game.GAME.camera.height *= 1.25;
        } }, Game.GAME.camera.canvas));
        this.keyHandlers.set("eqB", new Button(["="], (down) => { if (down) {
            Game.GAME.camera.height *= 0.8;
        } }, Game.GAME.camera.canvas));
        this.keyHandlers.set("aB", new Button(["a"], (down) => { if (down) {
            Game.GAME.userInterface.selectParentShape();
        } }, Game.GAME.camera.canvas));
        this.keyHandlers.set("mouseB", new Button(["mouse"], (down) => { if (down) {
            Game.GAME.userInterface.selectObjects();
        } }, Game.GAME.camera.canvas));
        this.keyHandlers.set("escapeB", new Button(["escape"], (down) => { if (down) {
            Game.GAME.camera.canvas.focus();
        } }, document.body));
        this.keyHandlers.set("rB", new Button(["r"], (down) => {
            if (down) {
                Game.GAME.userInterface.selectedObjects = [Game.GAME.model.evaluate()];
                Game.GAME.userInterface.selectObject(0);
                Game.GAME.userInterface.selectParentShape();
            }
        }, Game.GAME.camera.canvas));
    }
    get realMouseCoords() {
        const camera = Game.GAME.camera;
        const horMin = camera.position.x - camera.radius[0], verMin = camera.position.y - camera.radius[1];
        return [
            horMin + ((this.canvasMouseCoords[0] / camera.canvas.width) * (2 * camera.radius[0])),
            verMin + ((this.canvasMouseCoords[1] / camera.canvas.height) * (2 * camera.radius[1]))
        ];
    }
}
Input.SETUP = () => {
    Input.INPUT = new Input();
    document.addEventListener("keydown", (event) => {
        Input.KEYCHANGE(event.key.toLowerCase(), true);
        if (Game.GAME.camera.canvas === document.activeElement) {
            event.preventDefault();
        }
    });
    document.addEventListener("keyup", (event) => {
        Input.KEYCHANGE(event.key.toLowerCase(), false);
        if (Game.GAME.camera.canvas === document.activeElement) {
            event.preventDefault();
        }
    });
    document.addEventListener("mousemove", (event) => {
        Input.INPUT.canvasMouseCoords = [
            event.clientX - Game.GAME.camera.canvas.getBoundingClientRect().left,
            event.clientY - Game.GAME.camera.canvas.getBoundingClientRect().top
        ];
    });
    document.addEventListener("mousedown", (event) => {
        if (Game.GAME.camera.canvas === document.activeElement) {
            Input.KEYCHANGE("mouse", true);
        }
    });
    document.addEventListener("mouseup", (event) => {
        if (Game.GAME.camera.canvas === document.activeElement) {
            Input.KEYCHANGE("mouse", false);
        }
    });
};
Input.KEYCHANGE = (key, down) => {
    Array.from(Input.INPUT.keyHandlers.values()).filter(h => h.keys.some(k => key === k)).forEach(h => {
        h.change(key, down, document.activeElement);
    });
};
class Game {
    constructor(camera) {
        this.camera = camera;
        this.playingInterval = false;
        this.time = performance.now();
        this.model = new Shape("hull", [0, 0], [
            new Polygon([[30, 5], [25, 10], [5, 15], [-20, 15], [-20, 10], [-15, 5], [-15, -5], [-20, -10], [-20, -15], [5, -15], [25, -10], [30, -5]], "DarkGrey", 0),
            new Polygon([[20, 5], [10, 10], [5, 5], [5, -5], [10, -10], [20, -5]], "CornflowerBlue", 1),
            new Polygon([[20, 5], [10, 10], [5, 5], [5, -5], [10, -10], [20, -5], [20, 5]], "DarkBlue", 1, true),
            new Polygon([[5, 0], [-5, 5], [-15, 0], [-5, -5]], "DarkRed", 1),
            new Polygon([[-10, 5], [-10, 20], [-30, 15], [-30, 10]], "DimGrey", 1),
            new Polygon([[-10, -5], [-10, -20], [-30, -15], [-30, -10]], "DimGrey", 1),
            new Polygon([[5, 10], [5, 15], [0, 20], [-10, 20], [-20, 15], [-20, 10], [-10, 5], [0, 5]], "Grey", 2),
            new Polygon([[5, -10], [5, -15], [0, -20], [-10, -20], [-20, -15], [-20, -10], [-10, -5], [0, -5]], "Grey", 2),
            new Polygon([[15, 10], [0, 25], [-5, 25], [-10, 20], [-10, -20], [-5, -25], [0, -25], [15, -10]], "DarkRed", -1),
            new Polygon([[20, 15], [20, 20], [0, 20], [0, 15]], "DimGrey", -2),
            new Polygon([[20, -15], [20, -20], [0, -20], [0, -15]], "DimGrey", -2)
        ], [
            new Shape("right wing", [-5, 15], [new Polygon([[5, 0], [5, 40], [-5, 35], [-5, 20], [-10, 0], [0, -5]], "DarkGrey", 0)], []),
            new Shape("left wing", [-5, -15], [new Polygon([[5, 0], [5, -40], [-5, -35], [-5, -20], [-10, 0], [0, 5]], "DarkGrey", 0)], [])
        ]);
    }
}
Game.SETUP = () => {
    const canvas = document.getElementById("canvas");
    console.log("cavnas registered", "width", canvas.width, "height", canvas.height);
    const camera = new Camera(canvas, new Cartesian(0, 0), 500);
    camera.height = 200;
    Game.GAME = new Game(camera);
    Game.GAME.userInterface = new UserInterface(document.getElementById("modelJSON"), document.getElementById("parentShape"), document.getElementById("selection"));
};
Game.TIME = 0;
class Camera {
    constructor(canvas, position, height) {
        this.canvas = canvas;
        this.position = position;
        this.height = height;
        this.playingAnimation = false;
        this.time = performance.now();
        this.debugCamera = false;
        this.positionOffset = new Cartesian(0, 0);
        const radius = [this.canvas.width / 2, this.canvas.height / 2];
        this.apertureAngles = [Math.atan(radius[0] / this.height), Math.atan(radius[1] / this.height)];
    }
    get radius() {
        return [this.height * Math.tan(this.apertureAngles[0]), this.height * Math.tan(this.apertureAngles[1])];
    }
    adjustedRadius(distance) {
        return [(this.height + distance) * Math.tan(this.apertureAngles[0]), (this.height + distance) * Math.tan(this.apertureAngles[1])];
    }
    realToCanvas(coords, distance = 0) {
        coords = new Cartesian(coords);
        const adjustedRadius = this.adjustedRadius(distance);
        const horMin = this.position.x - adjustedRadius[0], verMin = this.position.y - adjustedRadius[1];
        return new Cartesian(((coords.x - horMin) / (2 * adjustedRadius[0])) * this.canvas.width, ((coords.y - verMin) / (2 * adjustedRadius[1])) * this.canvas.height);
    }
    toggleFrames(play = null) {
        if (play === null) {
            this.playingAnimation = !this.playingAnimation;
        }
        else {
            this.playingAnimation = play;
        }
        if (this.playingAnimation) {
            this.animationFrameId = window.requestAnimationFrame(Game.GAME.camera.render(Game.GAME.camera));
        }
        else {
            window.cancelAnimationFrame(this.animationFrameId);
        }
    }
    render(camera) {
        return (time) => {
            const deltaTime = (time - camera.time) / 1000;
            camera.time = time;
            camera.positionOffset.x += 0.7 * camera.radius[0] * deltaTime * Input.INPUT.keyHandlers.get("lrAX").state;
            camera.positionOffset.y += 0.7 * camera.radius[1] * deltaTime * Input.INPUT.keyHandlers.get("udAX").state;
            camera.position.x = camera.positionOffset.x;
            camera.position.y = camera.positionOffset.y;
            cleanCanvas(camera.canvas);
            borderCanvas(camera.canvas);
            camera.renderBackground(camera);
            camera.renderShapes(camera);
            camera.renderGUI(camera);
            camera.animationFrameId = window.requestAnimationFrame(camera.render(camera));
        };
    }
    renderBackground(camera) {
        const graphSize = Game.GAME.userInterface.gridSize;
        // const model = Game.GAME.userInterface.selectedParentShape;
        // const rotation = model.rotation;
        const xMin = camera.position.x - (2 * camera.radius[0]), xMax = camera.position.x + (2 * camera.radius[0]);
        const yMin = camera.position.y - (2 * camera.radius[1]), yMax = camera.position.y + (2 * camera.radius[1]);
        for (let x = xMin - (xMin % graphSize); x < xMax; x += 5) {
            const color = x % (graphSize * 10) === 0 ? "DimGrey" : "DarkGrey";
            drawLine(camera.canvas, camera.realToCanvas([x, yMin]).arr, camera.realToCanvas([x, yMax]).arr, color);
        }
        for (let y = yMin - (yMin % graphSize); y < yMax; y += 5) {
            const color = y % (graphSize * 10) === 0 ? "DimGrey" : "DarkGrey";
            drawLine(camera.canvas, camera.realToCanvas([xMin, y]).arr, camera.realToCanvas([xMax, y]).arr, color);
        }
    }
    renderShapes(camera) {
        const s = Game.GAME.model;
        const polygons = Shape.ALLPOLYGONS(s.evaluate()).sort((a, b) => a.layer - b.layer);
        polygons.forEach(poly => {
            const points = poly.points.map((p) => { const cP = camera.realToCanvas(p); return [cP.x, cP.y]; });
            if (poly.lineOnly) {
                drawPolyline(this.canvas, points, poly.color);
            }
            else {
                drawPolygon(this.canvas, points, poly.color);
            }
        });
    }
    renderGUI(camera) {
        //mouse pointer
        drawArc(camera.canvas, Input.INPUT.canvasMouseCoords, 4, 0, 2 * Math.PI, "black", 2);
        if (Game.GAME.userInterface.mouseSnap) {
            drawArc(camera.canvas, camera.realToCanvas(Game.GAME.userInterface.snappedMouseCoords).arr, 4, 0, 2 * Math.PI, "DimGrey", 2);
        }
        Game.GAME.userInterface.renderGUI(camera);
    }
}
var Tool;
(function (Tool) {
    Tool[Tool["move"] = 0] = "move";
})(Tool || (Tool = {}));
class UserInterface {
    constructor(textArea, parentShapeDiv, selectionDiv) {
        this.textArea = textArea;
        this.parentShapeDiv = parentShapeDiv;
        this.selectionDiv = selectionDiv;
        this.gridSize = 5;
        this.selectedObject = 0;
        this.selectedPoint = 0;
        this.mouseSnap = true;
        this.drawCommands = new Map();
        this.selectedObjects = [Game.GAME.model.evaluate()];
        this.selectObject(0);
        this.selectParentShape();
    }
    toJSON() {
        this.textArea.value = JSON.stringify(Game.GAME.model);
    }
    fromJSON() {
        let convertObjToShape;
        convertObjToShape = (obj) => {
            const basic = obj;
            const polygons = basic.polygons.map(p => {
                const poly = p;
                return new Polygon(poly.points, poly.color, poly.layer, poly.lineOnly);
            });
            return new Shape(basic.name, basic.origin, polygons, basic.shapes.map(s => convertObjToShape(s)));
        };
        Game.GAME.model = convertObjToShape(JSON.parse(this.textArea.value));
    }
    get snappedMouseCoords() {
        const gridSize = this.gridSize;
        const rMC = Input.INPUT.realMouseCoords;
        const negativeCorrectedModulo = (val, mod) => ((val % mod) + mod) % mod;
        const nCMX = negativeCorrectedModulo(rMC[0], gridSize), nCMY = negativeCorrectedModulo(rMC[1], gridSize);
        const x = nCMX < (gridSize / 2) ? rMC[0] - nCMX : rMC[0] - nCMX + gridSize;
        const y = nCMY < (gridSize / 2) ? rMC[1] - nCMY : rMC[1] - nCMY + gridSize;
        return new Cartesian(x, y);
    }
    renderGUI(camera) {
        // selected parent shape
        drawArc(camera.canvas, camera.realToCanvas(this.selectedParentShape.original.origin).arr, 10, 0, 2 * Math.PI, "blue", 2);
        if (0 < this.selectedObjects.length) {
            const selectedObject = this.selectedObjects[this.selectedObject];
            switch (selectedObject.identify()) {
                case "Shape":
                    const shape = selectedObject;
                    drawArc(camera.canvas, camera.realToCanvas(shape.origin).arr, 10, 0, 2 * Math.PI, "green", 2);
                    break;
                case "Polygon":
                    const polygon = selectedObject;
                    const points = polygon.points.map(p => camera.realToCanvas(p).arr);
                    drawPolyline(camera.canvas, [...points, points[0]], polygon.lineOnly ? "purple" : "red");
                    if (this.selectedPoint !== 0 && this.selectedPoint <= polygon.points.length) {
                        drawArc(camera.canvas, camera.realToCanvas(polygon.points[this.selectedPoint - 1]).arr, 5, 0, 2 * Math.PI, polygon.lineOnly ? "purple" : "red", 2);
                    }
                    break;
            }
        }
        Array.from(this.drawCommands.values()).forEach(command => {
            command(camera);
        });
    }
    checkMouse(shape, mouseCoords) {
        if (!shape.evaluated) {
            console.log("ERROR checkMouse: shape not evaluated");
            return null;
        }
        let result = [];
        shape.origin = new Cartesian(Math.round(shape.origin.x), Math.round(shape.origin.y));
        if (shape.origin.eq(mouseCoords)) {
            result.push(shape);
        }
        shape.polygons.forEach(poly => {
            poly.points.forEach(p => {
                if (new Cartesian(Math.round(p.x), Math.round(p.y)).eq(mouseCoords) && !result.includes(poly)) {
                    result.push(poly);
                }
            });
        });
        shape.shapes.forEach(s => {
            result = result.concat(this.checkMouse(s, mouseCoords));
        });
        return result;
    }
    selectObjects() {
        const mouseCheck = this.checkMouse(Game.GAME.model.evaluate(), this.snappedMouseCoords);
        if (0 < mouseCheck.length) {
            this.selectedObjects = mouseCheck;
            this.selectedPoint = 0;
            this.selectObject(0);
        }
    }
    selectObject(idx) {
        const me = this;
        Array.from(this.selectionDiv.children).forEach(element => {
            element.remove();
        });
        if (1 < this.selectedObjects.length) {
            this.selectionDiv.appendChild(createTextSpan("(" + this.selectedObjects.length + " option" + (this.selectedObjects.length === 1 ? "" : "s") + ")"));
            const switchSelectedInput = document.createElement("input");
            switchSelectedInput.type = "number";
            switchSelectedInput.min = "1";
            switchSelectedInput.max = "" + this.selectedObjects.length;
            switchSelectedInput.style.width = "4ch";
            switchSelectedInput.value = (idx + 1) + "";
            switchSelectedInput.onchange = () => {
                me.selectObject(parseInt(switchSelectedInput.value) - 1);
                if (0 < parseInt(switchSelectedInput.value) - 1) {
                    me.selectedPoint = 0;
                }
            };
            this.selectionDiv.appendChild(switchSelectedInput);
        }
        this.selectedObject = idx;
        const selectedObject = this.selectedObjects[this.selectedObject];
        switch (selectedObject.identify()) {
            case "Shape":
                const shape = selectedObject;
                this.selectionDiv.appendChild(createTextSpan(shape.root ? "Root" : "Shape", "green"));
                this.selectionDiv.appendChild(createTextSpan("name:"));
                const shapeNameInput = document.createElement("input");
                shapeNameInput.type = "text";
                shapeNameInput.size = 10;
                shapeNameInput.value = shape.original.name;
                shapeNameInput.onchange = () => {
                    shape.original.name = shapeNameInput.value;
                };
                this.selectionDiv.appendChild(shapeNameInput);
                this.selectionDiv.appendChild(createTextSpan("origin:"));
                const shapeOriginInput = document.createElement("input");
                shapeOriginInput.type = "text";
                shapeOriginInput.size = 5;
                shapeOriginInput.value = JSON.stringify(shape.original.origin.arr);
                shapeOriginInput.onchange = () => {
                    shape.original.origin = new Cartesian(JSON.parse(shapeOriginInput.value));
                };
                this.selectionDiv.appendChild(shapeOriginInput);
                this.selectionDiv.appendChild(createTextSpan("shapes:"));
                shape.shapes.forEach(s => {
                    const shapeChildButton = document.createElement("button");
                    const drawCommandName = s.name.trim() + " shape highlight command";
                    shapeChildButton.appendChild(document.createTextNode(s.original.origin.arr.toString()));
                    shapeChildButton.onmouseenter = () => {
                        me.drawCommands.set(drawCommandName, (camera) => {
                            drawArc(camera.canvas, camera.realToCanvas(s.origin).arr, 5, 0, 2 * Math.PI, "green", 2);
                        });
                    };
                    shapeChildButton.onmouseleave = () => {
                        me.drawCommands.delete(drawCommandName);
                    };
                    shapeChildButton.onclick = () => {
                        shapeChildButton.onmouseleave(null);
                        me.selectedObjects = [s];
                        me.selectObject(0);
                    };
                    this.selectionDiv.appendChild(shapeChildButton);
                });
                this.selectionDiv.appendChild(createTextSpan("polygons:"));
                shape.polygons.forEach((poly, i) => {
                    const polygonChildButton = document.createElement("button");
                    const drawCommandName = i + " polygon highlight command";
                    polygonChildButton.appendChild(document.createTextNode("P" + (i + 1)));
                    polygonChildButton.style.color = poly.lineOnly ? "purple" : "red";
                    polygonChildButton.onmouseenter = () => {
                        me.drawCommands.set(drawCommandName, (camera) => {
                            const points = poly.points.map(p => camera.realToCanvas(p).arr);
                            drawPolyline(camera.canvas, [...points, points[0]], poly.lineOnly ? "purple" : "red");
                        });
                    };
                    polygonChildButton.onmouseleave = () => {
                        me.drawCommands.delete(drawCommandName);
                    };
                    polygonChildButton.onclick = () => {
                        polygonChildButton.onmouseleave(null);
                        me.selectedObjects = [poly];
                        me.selectObject(0);
                    };
                    this.selectionDiv.appendChild(polygonChildButton);
                });
                break;
            case "Polygon":
                const polygon = selectedObject;
                const nameButton = document.createElement("button");
                nameButton.appendChild(document.createTextNode(polygon.lineOnly ? "Polyline" : "Polygon"));
                nameButton.style.color = polygon.lineOnly ? "purple" : "red";
                nameButton.onclick = () => {
                    me.selectedPoint = 0;
                    Array.from(me.selectionDiv.children).forEach(c => {
                        if (c.style.backgroundColor === (polygon.lineOnly ? "purple" : "red")) {
                            c.style.backgroundColor = "";
                        }
                    });
                };
                this.selectionDiv.appendChild(nameButton);
                this.selectionDiv.appendChild(createTextSpan("color:"));
                const polyColorInput = document.createElement("input");
                polyColorInput.type = "text";
                polyColorInput.size = 10;
                polyColorInput.value = polygon.original.color;
                polyColorInput.onchange = () => {
                    polygon.original.color = polyColorInput.value;
                };
                this.selectionDiv.appendChild(polyColorInput);
                this.selectionDiv.appendChild(createTextSpan("layer:"));
                const layerInput = document.createElement("input");
                layerInput.type = "number";
                layerInput.style.width = "4ch";
                layerInput.value = "" + polygon.original.layer;
                layerInput.onchange = () => {
                    polygon.original.layer = parseInt(layerInput.value);
                };
                this.selectionDiv.appendChild(layerInput);
                this.selectionDiv.appendChild(createTextSpan("points:"));
                polygon.points.forEach((p, i) => {
                    const pointChildButton = document.createElement("button");
                    const drawCommandName = (i + 1) + " point highlight command";
                    pointChildButton.appendChild(document.createTextNode(polygon.original.points[i].arr.toString()));
                    pointChildButton.onmouseenter = () => {
                        me.drawCommands.set(drawCommandName, (camera) => {
                            drawArc(camera.canvas, camera.realToCanvas(p).arr, 5, 0, 2 * Math.PI, "orange", 2);
                        });
                    };
                    pointChildButton.onmouseleave = () => {
                        me.drawCommands.delete(drawCommandName);
                    };
                    pointChildButton.onclick = () => {
                        Array.from(me.selectionDiv.children).forEach(c => {
                            if (c.style.backgroundColor === (polygon.lineOnly ? "purple" : "red")) {
                                c.style.backgroundColor = "";
                            }
                        });
                        pointChildButton.style.backgroundColor = polygon.lineOnly ? "purple" : "red";
                        me.selectedPoint = i + 1;
                    };
                    this.selectionDiv.appendChild(pointChildButton);
                });
                break;
        }
    }
    selectParentShape() {
        if (this.selectedObjects[this.selectedObject].identify() === "Shape") {
            const me = this;
            this.selectedParentShape = this.selectedObjects[this.selectedObject];
            Array.from(this.parentShapeDiv.children).forEach(element => {
                element.remove();
            });
            const selectParentButton = document.createElement("button");
            const drawCommandName = "highlight parent shape command";
            selectParentButton.appendChild(document.createTextNode(this.selectedParentShape.original.name));
            selectParentButton.onmouseenter = () => {
                me.drawCommands.set(drawCommandName, (camera) => {
                    drawArc(camera.canvas, camera.realToCanvas(me.selectedParentShape.origin).arr, 5, 0, 2 * Math.PI, "green", 2);
                });
            };
            selectParentButton.onmouseleave = () => {
                me.drawCommands.delete(drawCommandName);
            };
            selectParentButton.onclick = () => {
                selectParentButton.onmouseleave(null);
                me.selectedObjects = [me.selectedParentShape];
                me.selectObject(0);
            };
            this.parentShapeDiv.appendChild(selectParentButton);
            const origin = me.selectedParentShape.origin;
            this.parentShapeDiv.appendChild(createTextSpan("at " + new Cartesian(Math.round(origin.x), Math.round(origin.y)).arr.toString()));
        }
    }
}
function startDraw() {
    Game.SETUP();
    Input.SETUP();
    Game.GAME.camera.toggleFrames(true);
}
