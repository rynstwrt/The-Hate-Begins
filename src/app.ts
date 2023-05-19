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
    ShadowGenerator, SpotLight, Vector4, VertexBuffer, Mesh
} from "@babylonjs/core";
import anime from "animejs/lib/anime.es.js"

class App
{
    // Background constants
    readonly backgroundSquaresX = 20;
    readonly backgroundSquaresY = 50;

    // Building constants
    readonly minNumBuildings = 3;
    readonly maxNumBuildings = 25;
    readonly minBuildingWidth = 10;
    readonly maxBuildingWidth = 30;
    readonly minBuildingHeight = 7;
    readonly maxBuildingHeight = 30;
    readonly buildingTileSize = 3.5;
    readonly buildingTextures = ["assets/textures/building.jpg", "assets/textures/building2.jpg", "assets/textures/building3.jpg"];
    readonly buildingBumpMaps = ["assets/textures/normals/normalbuilding.png", "assets/textures/normals/normalbuilding2.png", "assets/textures/normals/normalbuilding3.png"];

    // Ground constants
    readonly groundWidth = 500;
    readonly groundDepth = 500;
    readonly groundTileSubdivisions = Math.min(this.groundWidth * 0.3, this.groundDepth * 0.3);

    // Wall constants
    readonly wallThickness = 3;
    readonly wallHeight = 20;
    readonly wallTileSize = 2.5

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
        // const spotlight1 = new SpotLight("spotlight1", new Vector3(-40, 40, -40), new Vector3(1, -1, 1), Math.PI / 1, 2, this.scene);
        // spotlight1.position = new Vector3(-40, 40, -40);
        // spotlight1.diffuse = Color3.Black();
        // spotlight1.intensity = 2;
        // spotlight1.intensity = 0;

        // this.shadowGenerator1 = new ShadowGenerator(1024, spotlight1);
        // this.shadowGenerator1.useBlurCloseExponentialShadowMap = true;
        // this.shadowGenerator1.blurBoxOffset = 4;
        // this.shadowGenerator1.enableSoftTransparentShadow = true;
        // this.shadowGenerator1.transparencyShadow = true;

        // PLAYER POINT LIGHT
        const playerLight: PointLight = new PointLight("playerLight", Vector3.Zero(), this.scene);
        playerLight.diffuse = new Color3(255, 0, 0);
        playerLight.intensity = .25;

        this.shadowGenerator2 = new ShadowGenerator(1024, playerLight);
        this.shadowGenerator2.useBlurCloseExponentialShadowMap = true;
        this.shadowGenerator2.blurBoxOffset = 4;
        this.shadowGenerator2.enableSoftTransparentShadow = true;
        this.shadowGenerator2.transparencyShadow = true;

        this.scene.registerBeforeRender(() =>
        {
            playerLight.position = this.camera.position.add(new Vector3(0, 1, 0));
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

        const timeline = anime.timeline({
            targets: ".background-square-content",
            loop: true,
            easing: "easeInOutQuad",
            direction: "alternate",
            delay: anime.stagger(100, {grid: [this.backgroundSquaresX, this.backgroundSquaresY], from: "center"}),
        });

        timeline.add({
            backgroundColor: "#AB1B1B",
        });

        timeline.add({
            backgroundColor: "#000000"
        }, "-=200");
    }

    createGround()
    {
        const halfX = this.groundWidth / 2;
        const halfZ = this.groundDepth / 2;
        const groundOptions = {
            xmin: -halfX,
            xmax: halfX,
            zmin: -halfZ,
            zmax: halfZ,
            tileSize: 1,
            subdivisions: {w: this.groundTileSubdivisions, h: this.groundTileSubdivisions}
        };

        const ground = MeshBuilder.CreateTiledGround("ground", groundOptions, this.scene);
        ground.checkCollisions = true;
        ground.receiveShadows = true;

        const groundMat = new StandardMaterial("groundMat", this.scene);
        groundMat.diffuseTexture = new Texture("assets/textures/ground.jpg");
        groundMat.bumpTexture = new Texture("assets/textures/normals/normalground.png");
        ground.material = groundMat;
    }

    createWalls()
    {
        const wallMat = new StandardMaterial("wallMat", this.scene);
        wallMat.diffuseTexture = new Texture("assets/textures/wall.jpg");;
        wallMat.bumpTexture = new Texture("assets/textures/normals/normalwall.png");;

        const wallOptions = {
            sideOrientation: Mesh.DOUBLESIDE,
            pattern: Mesh.FLIP_TILE,
            alignVertical: Mesh.BOTTOM,
            alignHorizontal: Mesh.CENTER,
            width: this.wallThickness,
            height: this.wallHeight,
            depth: this.groundDepth + this.wallThickness * 2,
            tileSize: this.wallTileSize
        };

        // POSITIVE X WALL
        const wall1 = MeshBuilder.CreateTiledBox("wall1", wallOptions, this.scene);
        wall1.position = wall1.position.add(new Vector3(
            this.groundWidth / 2 + this.wallThickness / 2,
            this.wallHeight / 2,
            0
        ));

        // NEGATIVE X WALL
        const wall2 = MeshBuilder.CreateTiledBox("wall2", wallOptions, this.scene);
        wall2.position = wall2.position.add(new Vector3(
            -this.groundWidth / 2 - this.wallThickness / 2,
            this.wallHeight / 2,
            0
        ));

        // Convert wallOptions to be for the Z walls.
        wallOptions["width"] = this.groundWidth;
        wallOptions["depth"] = this.wallThickness;

        // POSITIVE Z WALL
        const wall3 = MeshBuilder.CreateTiledBox("wall3", wallOptions, this.scene);
        wall3.position = wall3.position.add(new Vector3(
            0,
            this.wallHeight / 2,
            this.groundDepth / 2 + this.wallThickness / 2
        ));

        // NEGATIVE Z WALL
        const wall4 = MeshBuilder.CreateTiledBox("wall4", wallOptions, this.scene);
        wall4.position = wall4.position.add(new Vector3(
            0,
            this.wallHeight / 2,
            -this.groundDepth / 2 - this.wallThickness / 2
        ));

        [wall1, wall2, wall3, wall4].forEach(wall =>
        {
            wall.checkCollisions = true;
            wall.material = wallMat;
            wall.receiveShadows = true;
            // this.shadowGenerator1.addShadowCaster(wall);
            this.shadowGenerator2.addShadowCaster(wall);
        });
    }

    createBuildings()
    {
        const numBuildings = Math.random() * (this.maxNumBuildings - this.minNumBuildings) + this.maxNumBuildings;

        for (let i = 0; i < numBuildings; ++i)
        {
            const buildingWidth = Math.random() * (this.maxBuildingWidth - this.minBuildingWidth) + this.minBuildingWidth;
            const buildingDepth = Math.random() * (this.maxBuildingWidth - this.minBuildingWidth) + this.minBuildingWidth;
            const buildingHeight = Math.random() * (this.maxBuildingHeight - this.minBuildingHeight) + this.minBuildingHeight;

            const xMin = this.groundWidth / -2;
            const xMax = this.groundWidth / 2;
            const buildingX = Math.random() * (xMax - xMin) + xMin;

            const zMin = this.groundDepth / -2;
            const zMax = this.groundDepth / 2;
            const buildingZ = Math.random() * (zMax - zMin) + zMin;

            const buildingY = buildingHeight / 2;

            const buildingOptions = {
                sideOrientation: Mesh.DOUBLESIDE,
                pattern: Mesh.FLIP_TILE,
                alignVertical: Mesh.BOTTOM,
                alignHorizontal: Mesh.CENTER,
                width: buildingWidth,
                height: buildingHeight,
                depth: buildingDepth,
                tileSize: this.buildingTileSize,
            };

            const building = MeshBuilder.CreateTiledBox("building " + i, buildingOptions, this.scene);
            building.position = new Vector3(buildingX, buildingY, buildingZ);
            building.checkCollisions = true;
            building.receiveShadows = true;
            this.shadowGenerator2.addShadowCaster(building);

            const buildingMat = new StandardMaterial("buildingMat", this.scene);
            const textureIndex = Math.floor(Math.random() * this.buildingTextures.length);
            buildingMat.diffuseTexture = new Texture(this.buildingTextures[textureIndex], this.scene);
            buildingMat.bumpTexture = new Texture(this.buildingBumpMaps[textureIndex], this.scene);
            building.material = buildingMat;
        }
    }
}
new App();
