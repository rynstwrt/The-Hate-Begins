import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import {
    Engine,
    Scene,
    Vector3,
    HemisphericLight,
    MeshBuilder,
    UniversalCamera,
    Color4,
    StandardMaterial,
    Color3,
    Texture
} from "@babylonjs/core";

class App
{
    scene: Scene;
    engine: Engine;

    readonly backgroundSquaresX = 5;
    readonly backgroundSquaresY = 5;
    background: Element;

    groundWidth = 100;
    groundHeight = 100;

    constructor()
    {
        this.background = document.getElementById("background");
        this.createBackground(this.backgroundSquaresX, this.backgroundSquaresY);

        const canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);

        this.engine = new Engine(canvas, true);

        this.scene = new Scene(this.engine);
        this.scene.clearColor = new Color4(0, 0, 0, 0);
        this.scene.gravity = new Vector3(0, -.75, 0);
        this.scene.collisionsEnabled = true;
        this.scene.enablePhysics();

        const camera: UniversalCamera = new UniversalCamera("camera", new Vector3(0, 3, -20), this.scene);
        camera.setTarget(Vector3.Zero());
        camera.applyGravity = true;
        camera.ellipsoid = new Vector3(1, 1.5, 1);
        camera.checkCollisions = true;
        camera.attachControl(canvas, true);

        camera.keysUp.push(87);
        camera.keysDown.push(83);
        camera.keysRight.push(68);
        camera.keysLeft.push(65);

        let isLocked = false;
        this.scene.onPointerDown = event =>
        {
            if (!isLocked)
            {
                canvas.requestPointerLock = canvas.requestPointerLock || canvas.msRequestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;

                if (canvas.requestPointerLock)
                    canvas.requestPointerLock();
            }
        }

        const pointerLockChange = () =>
        {
            const controlEnabled = document.pointerLockElement || null;
            if (controlEnabled)
                isLocked = true;
            else
                isLocked = false;
        }

        document.addEventListener("pointerlockchange", pointerLockChange, false);
        document.addEventListener("mspointerlockchange", pointerLockChange, false);
        document.addEventListener("mozpointerlockchange", pointerLockChange, false);
        document.addEventListener("webkitpointerlockchange", pointerLockChange, false);

        window.addEventListener("keydown", (ev) =>
        {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.key === 'i')
            {
                if (this.scene.debugLayer.isVisible())
                {
                    this.scene.debugLayer.hide();
                } else
                {
                    this.scene.debugLayer.show();
                }
            }
        });

        window.addEventListener("resize", () =>
        {
            this.engine.resize();
            this.createBackground(this.backgroundSquaresX, this.backgroundSquaresX);
        });

        const light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), this.scene);
        light1.diffuse = new Color3(1, 0, 0);

        this.createGround();

        this.engine.runRenderLoop(() =>
        {
            this.scene.render();
        });
    }

    createBackground(xSquares, ySquares)
    {
        while (this.background.firstChild)
        {
            this.background.removeChild(this.background.lastChild);
        }

        const xSquareSize = Math.floor(window.innerWidth / xSquares);
        const ySquareSize = Math.floor(window.innerHeight / ySquares);

        for (let y = 0; y < ySquares; ++y)
        {
            for (let x = 0; x < xSquares; ++x)
            {
                const square = document.createElement("div");
                square.classList.add("background-square");
                square.style.width = xSquareSize + "px";
                square.style.height = ySquareSize + "px";

                const content = document.createElement("div");
                content.classList.add("background-square-content");

                square.appendChild(content);
                this.background.appendChild(square);
            }
        }
    }

    createGround()
    {
        const ground = MeshBuilder.CreateGround("ground", {width: this.groundWidth, height: this.groundHeight}, this.scene);
        ground.checkCollisions = true;

        const groundMat = new StandardMaterial("groundMat", this.scene);
        groundMat.diffuseTexture = new Texture("../assets/ground.jpg");
        ground.material = groundMat;
    }
}
new App();
