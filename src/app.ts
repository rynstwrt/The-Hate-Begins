import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import {
    Engine,
    Scene,
    Vector3,
    PointLight,
    MeshBuilder,
    UniversalCamera,
    Color4,
    StandardMaterial,
    Color3,
    Texture,
    ShadowGenerator, SpotLight
} from "@babylonjs/core";
import anime from "animejs/lib/anime.es.js"

class App
{
    // Background constants
    readonly backgroundSquaresX = 20;
    readonly backgroundSquaresY = 50;

    // Building constants
    readonly minNumBuildings = 1;
    readonly maxNumBuildings = 25;
    readonly minBuildingWidth = 2;
    readonly maxBuildingWidth = 5;
    readonly minBuildingHeight = 10;
    readonly maxBuildingHeight = 75;
    readonly buildingUScale = 2;
    readonly buildingVScale = 10;

    // Ground constants
    readonly groundWidth = 300;
    readonly groundHeight = 300;
    readonly groundUScale = 150;
    readonly groundVScale = 150;

    // Wall constants
    readonly wallThickness = 3;
    readonly wallHeight = 10;
    readonly wallUScale = 2;
    readonly wallVScale = 45;

    // Class variables
    scene: Scene;
    engine: Engine;
    canvas: HTMLCanvasElement;
    background: Element;
    camera: UniversalCamera;
    mouseLocked = false;
    shadowGenerator1: ShadowGenerator;
    shadowGenerator2: ShadowGenerator;

    constructor()
    {
        this.canvas = document.createElement("canvas");
        this.canvas.id = "game-canvas";
        document.body.appendChild(this.canvas);

        this.engine = new Engine(this.canvas, true);

        this.scene = new Scene(this.engine);
        this.scene.clearColor = new Color4(0, 0, 0, 0);
        this.scene.gravity = new Vector3(0, -.75, 0);
        this.scene.collisionsEnabled = true;
        this.scene.enablePhysics();

        this.createBackground();
        this.setupCamera();
        this.setupLights();
        this.setupControls();
        this.createGround();
        this.createWalls();
        this.createBuildings();

        window.addEventListener("resize", () =>
        {
            this.engine.resize();
            this.createBackground();
        });

        this.engine.runRenderLoop(() =>
        {
            this.scene.render();
        });
    }

    setupCamera()
    {
        this.camera = new UniversalCamera("camera", new Vector3(0, 3, -20), this.scene);
        this.camera.setTarget(Vector3.Zero());
        this.camera.applyGravity = true;
        this.camera.ellipsoid = new Vector3(1, 1.5, 1);
        this.camera.checkCollisions = true;
        this.camera.attachControl(this.canvas, true);
    }

    setupLights()
    {
        // SPOTLIGHT
        const spotlight1 = new SpotLight("spotlight1", new Vector3(-40, 40, -40), new Vector3(1, -1, 1), Math.PI / 1, 2, this.scene);
        spotlight1.position = new Vector3(-40, 40, -40);
        spotlight1.diffuse = Color3.Red();
        spotlight1.intensity = 2;

        this.shadowGenerator1 = new ShadowGenerator(1024, spotlight1);
        this.shadowGenerator1.useBlurCloseExponentialShadowMap = true;
        this.shadowGenerator1.blurBoxOffset = 4;
        this.shadowGenerator1.enableSoftTransparentShadow = true;
        this.shadowGenerator1.transparencyShadow = true;

        // PLAYER POINT LIGHT
        const playerLight: PointLight = new PointLight("playerLight", Vector3.Zero(), this.scene);
        playerLight.diffuse = new Color3(1, 0, 0);
        // playerLight.intensity = 5;

        this.shadowGenerator2 = new ShadowGenerator(1024, playerLight);
        this.shadowGenerator2.useBlurCloseExponentialShadowMap = true;
        this.shadowGenerator2.blurBoxOffset = 4;
        this.shadowGenerator2.enableSoftTransparentShadow = true;
        this.shadowGenerator2.transparencyShadow = true;

        this.scene.registerBeforeRender(() =>
        {
            playerLight.position = this.camera.position.add(new Vector3(0, 20, 0));
        });
    }

    setupControls()
    {
        this.camera.keysUp.push(87);
        this.camera.keysDown.push(83);
        this.camera.keysRight.push(68);
        this.camera.keysLeft.push(65);

        this.scene.onPointerDown = () =>
        {
            if (!this.mouseLocked)
            {
                this.canvas.requestPointerLock = this.canvas.requestPointerLock || this.canvas.msRequestPointerLock || this.canvas.mozRequestPointerLock || this.canvas.webkitRequestPointerLock;

                if (this.canvas.requestPointerLock)
                    this.canvas.requestPointerLock();
            }
        }

        const pointerLockChange = () =>
        {
            const controlEnabled = document.pointerLockElement || null;
            if (controlEnabled)
                this.mouseLocked = true;
            else
                this.mouseLocked = false;
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
                    this.scene.debugLayer.hide();
                else
                    this.scene.debugLayer.show();
            }
        });
    }

    createBackground()
    {
        if (!this.background)
            this.background = document.getElementById("background");

        while (this.background.firstChild)
        {
            this.background.removeChild(this.background.lastChild);
        }

        const xSquareSize = Math.floor(this.canvas.width / this.backgroundSquaresX);
        const ySquareSize = Math.floor(window.innerHeight / this.backgroundSquaresY);

        for (let y = 0; y < this.backgroundSquaresY; ++y)
        {
            for (let x = 0; x < this.backgroundSquaresX; ++x)
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

        anime({
            targets: ".background-square-content",
            scale: [0, 1],
            loop: true,
            direction: "alternate",
            easing: "easeInOutQuad",
            delay: anime.stagger(100, {grid: [this.backgroundSquaresX, this.backgroundSquaresY], from: "center"}),
            duration: 500
        });
    }

    createGround()
    {
        const ground = MeshBuilder.CreateGround("ground", {
            width: this.groundWidth,
            height: this.groundHeight
        }, this.scene);
        ground.checkCollisions = true;
        ground.receiveShadows = true;

        const groundMat = new StandardMaterial("groundMat", this.scene);
        groundMat.backFaceCulling = false;

        const bumpTexture = new Texture("assets/textures/normals/normalground.png");
        bumpTexture.uScale = this.groundUScale;
        bumpTexture.vScale = this.groundVScale;

        const texture = new Texture("assets/textures/ground.jpg");
        texture.uScale = this.groundUScale;
        texture.vScale = this.groundVScale;
        groundMat.diffuseTexture = texture;
        groundMat.bumpTexture = bumpTexture;

        ground.material = groundMat;
    }

    createWalls()
    {
        const wallMat = new StandardMaterial("wallMat", this.scene);

        const wallTexture = new Texture("assets/textures/wall.jpg");
        wallTexture.uScale = this.wallUScale;
        wallTexture.vScale = this.wallVScale;
        wallMat.diffuseTexture = wallTexture;

        const wallBumpTexture = new Texture("assets/textures/normals/normalwall.png");
        wallBumpTexture.uScale = this.wallUScale;
        wallBumpTexture.vScale = this.wallVScale;
        wallMat.bumpTexture = wallBumpTexture;

        // POSITIVE X WALL
        const xWall1 = MeshBuilder.CreateBox("xWall1", {
            width: this.wallThickness,
            depth: this.groundHeight + this.wallThickness * 2,
            height: this.wallHeight
        });
        xWall1.position = xWall1.position.add(new Vector3(
            this.groundWidth / 2 + this.wallThickness / 2,
            this.wallHeight / 2,
            0));
        xWall1.checkCollisions = true;
        xWall1.material = wallMat;
        xWall1.receiveShadows = true;
        this.shadowGenerator1.addShadowCaster(xWall1);

        // NEGATIVE X WALL
        const xWall2 = MeshBuilder.CreateBox("xWall2", {
            width: this.wallThickness,
            depth: this.groundHeight + this.wallThickness * 2,
            height: this.wallHeight
        });
        xWall2.position = xWall2.position.add(new Vector3(
            -this.groundWidth / 2 - this.wallThickness / 2,
            this.wallHeight / 2,
            0));
        xWall2.checkCollisions = true;
        xWall2.material = wallMat;
        xWall2.receiveShadows = true;
        this.shadowGenerator1.addShadowCaster(xWall2);

        // POSITIVE Z WALL
        const xWall3 = MeshBuilder.CreateBox("xWall3", {
            width: this.wallThickness,
            depth: this.groundWidth + this.wallThickness * 2,
            height: this.wallHeight
        });
        xWall3.rotation.y = Math.PI / 2;
        xWall3.position = xWall3.position.add(new Vector3(
            0,
            this.wallHeight / 2,
            this.groundHeight / 2 + this.wallThickness / 2));
        xWall3.checkCollisions = true;
        xWall3.material = wallMat;
        xWall3.receiveShadows = true;
        this.shadowGenerator1.addShadowCaster(xWall3);

        // NEGATIVE Z WALL
        const xWall4 = MeshBuilder.CreateBox("xWall4", {
            width: this.wallThickness,
            depth: this.groundWidth + this.wallThickness * 2,
            height: this.wallHeight
        });
        xWall4.rotation.y = Math.PI / 2;
        xWall4.position = xWall4.position.add(new Vector3(
            0,
            this.wallHeight / 2,
            -this.groundHeight / 2 - this.wallThickness / 2));
        xWall4.checkCollisions = true;
        xWall4.material = wallMat;
        xWall4.receiveShadows = true;
        this.shadowGenerator1.addShadowCaster(xWall4);
    }

    createBuildings()
    {
        const numBuildings = Math.random() * (this.maxNumBuildings - this.minNumBuildings) + this.maxNumBuildings;

        const buildingMat = new StandardMaterial("buildingMat", this.scene);

        const buildingTexture = new Texture("assets/textures/building.jpg", this.scene);
        buildingTexture.uScale = this.buildingUScale;
        buildingTexture.vScale = this.buildingVScale;
        buildingMat.diffuseTexture = buildingTexture;

        const buildingBumpTexture = new Texture("assets/textures/normals/building.png");
        buildingBumpTexture.uScale = this.buildingUScale;
        buildingBumpTexture.vScale = this.buildingVScale;
        buildingMat.bumpTexture = buildingBumpTexture;

        for (let i = 0; i < numBuildings; ++i)
        {
            const buildingWidth = Math.random() * (this.maxBuildingWidth - this.minBuildingWidth) + this.minBuildingWidth;
            const buildingDepth = Math.random() * (this.maxBuildingWidth - this.minBuildingWidth) + this.minBuildingWidth;
            const buildingHeight = Math.random() * (this.maxBuildingHeight - this.minBuildingHeight) + this.minBuildingHeight;

            const xMin = this.groundWidth / -2;
            const xMax = this.groundWidth / 2;
            const buildingX = Math.random() * (xMax - xMin) + xMin;

            const zMin = this.groundHeight / -2;
            const zMax = this.groundHeight / 2;
            const buildingZ = Math.random() * (zMax - zMin) + zMin;

            const buildingY = buildingHeight / 2;

            const building = MeshBuilder.CreateBox("building " + i, {width: buildingWidth, depth: buildingDepth, height: buildingHeight});
            building.position = new Vector3(buildingX, buildingY, buildingZ);
            building.checkCollisions = true;

            building.material = buildingMat;
        }
    }
}
new App();
