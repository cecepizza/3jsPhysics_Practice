import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import Cannon from 'cannon'

console.log('cannon', Cannon)
/**
 * Debug
 */
const gui = new GUI()
const debugObject = {}

debugObject.createSphere = () => {
    createSphere(Math.random() * 0.5, { x: (Math.random() - 0.5) * 3, y: 3, z: (Math.random() - 0.5) * 3})
}
gui.add(debugObject, 'createSphere')

debugObject.createBox = () => {
    const width = Math.random() * 0.5 + 0.2
    const height = Math.random() * 0.5 + 0.2
    const depth = Math.random() * 0.5 + 0.2
    const position = {
        x: (Math.random() - 0.5) * 3,
        y: 3,
        z: (Math.random() - 0.5) * 3
    }
    createBox(width, height, depth, position)
}
gui.add(debugObject, 'createBox')

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const cubeTextureLoader = new THREE.CubeTextureLoader()

const environmentMapTexture = cubeTextureLoader.load([
    '/textures/environmentMaps/0/px.png',
    '/textures/environmentMaps/0/nx.png',
    '/textures/environmentMaps/0/py.png',
    '/textures/environmentMaps/0/ny.png',
    '/textures/environmentMaps/0/pz.png',
    '/textures/environmentMaps/0/nz.png'
])

/**
 * PHYSICS
 */
// World
const world = new Cannon.World()
    // Gravity is a three dimensional vector 
world.gravity.set(0, -9.82, 0)

// MATERIALS 
const defaultMaterial = new Cannon.Material('default')


// contact materials 
    // how materials interact with each other 
const defaultContactMaterial = new Cannon.ContactMaterial(defaultMaterial, defaultMaterial, {
    friction: 0.1, // properties on what happens when two materials collide 
    restitution: .7 // how bouncy the materials are 
})
world.addContactMaterial(defaultContactMaterial)
world.defaultContactMaterial = defaultContactMaterial


/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({
        color: '#777777',
        metalness: 0.3,
        roughness: 0.4,
        envMap: environmentMapTexture,
        envMapIntensity: 0.5
    })
)
floor.receiveShadow = true
floor.rotation.x = - Math.PI * 0.5
scene.add(floor)

// FLOOR
const floorBody = new Cannon.Body({
    mass: 0,
    shape: new Cannon.Plane()
})
floorBody.material = defaultMaterial
floorBody.quaternion.setFromAxisAngle(new Cannon.Vec3(1, 0, 0), - Math.PI * 0.5)
world.addBody(floorBody)


/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.1)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(- 3, 3, 3)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/** 
 * utils
 */
const objectsToUpdate = []

const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32)
const sphereMaterial = new THREE.MeshStandardMaterial({
    metalness: 0.3, 
    roughness: 0.4, 
    envMap: environmentMapTexture, 
})
const createSphere = (radius, position) =>
{
    // Three.js mesh
    const mesh = new THREE.Mesh(
        sphereGeometry, sphereMaterial
    )
    mesh.scale.set(radius, radius, radius)
    mesh.castShadow = true 
mesh.position.copy(position)
scene.add(mesh) 

// Cannon JS body
const shape = new Cannon.Sphere(radius)
    const body = new Cannon.Body({
        mass: 1,
        postition: new Cannon.Vec3(0,3,0),
        shape, 
        material: defaultMaterial
    })
body.position.copy(position)
world.addBody(body)

// save in objectsToUpdate array 
objectsToUpdate.push({ mesh, body })
}

const boxGeometry = new THREE.BoxGeometry(1, 1, 1)
const boxMaterial = new THREE.MeshStandardMaterial({
    metalness: 0.3,
    roughness: 0.4,
    envMap: environmentMapTexture,
})
const createBox = (width, height, depth, position) => {
    // Three.js mesh
    const mesh = new THREE.Mesh(
        boxGeometry, boxMaterial
    )
    mesh.scale.set(width, height, depth)
    mesh.castShadow = true
    mesh.position.copy(position)
    scene.add(mesh)

    // Cannon.js body
    const shape = new Cannon.Box(new Cannon.Vec3(width * 0.5, height * 0.5, depth * 0.5))
    const body = new Cannon.Body({
        mass: 1,
        shape,
        material: defaultMaterial
    })
    body.position.copy(position)
    world.addBody(body)

    // Save in objectsToUpdate array
    objectsToUpdate.push({ mesh, body })
}

// create a sphere and provide position and radius 
createSphere(0.5, { x: 0, y: 3, z: 0 })

/**
 * Animate
 */
const clock = new THREE.Clock()
let oldElapsedTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - oldElapsedTime
    oldElapsedTime = elapsedTime
    // console.log(deltaTime)

    // UPDATE PHYSICS WORLD 
    world.step(1/60, deltaTime, 3)

        // update the threejs sphere with the physics sphere 
        for(const object of objectsToUpdate)
        {
            object.mesh.position.copy(object.body.position)
            object.mesh.quaternion.copy(object.body.quaternion)
        }
    
    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()