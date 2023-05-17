import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import {
    Engine,
    Scene,
    ArcRotateCamera,
    Vector3,
    HemisphericLight,
    Mesh,
    MeshBuilder,
    UniversalCamera
} from "@babylonjs/core";

class App
{
    constructor()
    {
        const canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);

        const engine = new Engine(canvas, true);

        const scene = new Scene(engine);
        scene.gravity = new Vector3(0, -.75, 0);
        scene.collisionsEnabled = true;
        scene.enablePhysics();

        const camera: UniversalCamera = new UniversalCamera("camera", new Vector3(0, 3, -20), scene);
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
        scene.onPointerDown = event =>
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

        const myGround = MeshBuilder.CreateGround("myGround", { width: 200, height: 200}, scene);
        myGround.checkCollisions = true;

        const light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);

        // hide/show the Inspector
        window.addEventListener("keydown", (ev) =>
        {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.key === 'i')
            {
                if (scene.debugLayer.isVisible())
                {
                    scene.debugLayer.hide();
                } else
                {
                    scene.debugLayer.show();
                }
            }
        });

        // run the main render loop
        engine.runRenderLoop(() => {
            scene.render();
        });
    }
}
new App();
