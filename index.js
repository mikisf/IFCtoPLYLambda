import IFCLoader from "web-ifc-three/IFCLoader.js";
//import { IFCLoader } from "three/examples/jsm/loaders/IFCLoader.js";
import * as THREE from 'three';
import MeshSurfaceSampler from 'three-stdlib/math/MeshSurfaceSampler.js'

const getSurface = (geometry) => {
    const positionsArray = geometry.getAttribute("position").array;
    const positions = []
    for (let i = 0; i < positionsArray.length; i += 3) {
        positions.push([
            positionsArray[i + 0],
            positionsArray[i + 1],
            positionsArray[i + 2]
        ]);
    }
    let surface = 0
    const faces = geometry.getIndex().array;
    for (let i = 0; i < faces.length; i += 3) {
        const p1 = positions[faces[i + 0]]
        const p2 = positions[faces[i + 1]]
        const p3 = positions[faces[i + 2]]
        const p1p2 = p2.map(function (item, index) { return item - p1[index] })
        const p1p3 = p3.map(function (item, index) { return item - p1[index] })
        surface += Math.sqrt(Math.pow(p1p2[1] * p1p3[2] - p1p2[2] * p1p3[1], 2) + Math.pow(p1p2[2] * p1p3[0] - p1p2[0] * p1p3[2], 2) + Math.pow(p1p2[0] * p1p3[1] - p1p2[1] * p1p3[0], 2)) / 2
    }
    return surface
}

export const ifcToPly = async (ifcFile) => {
    return new Promise((resolve, reject) => {
        const ifcLoader = new IFCLoader();
        ifcLoader.ifcManager.setWasmPath('../../../../');
        ifcLoader.load(ifcFile, function (model) {
            model.geometry.center()
            const sampler = new MeshSurfaceSampler(model).build();
            const vertices = [];
            const tempPosition = new THREE.Vector3();
            const nPoints = 400//getSurface(model.geometry)
            for (let i = 0; i < nPoints * 50; i++) {
                sampler.sample(tempPosition);
                vertices.push([tempPosition.x.toFixed(2), tempPosition.y.toFixed(2), tempPosition.z.toFixed(2)]);
            }

            let data =
                `ply
format ascii 1.0
element vertex ${vertices.length}
property float x
property float y
property float z
end_header
`
            for (const vertice of vertices) {
                try {
                    data += vertice.join(" ") + "\n"
                } catch (err) {
                    reject(new Error('File too big'));
                }
            }
            resolve(new Blob([data], { type: "text/plain" }))
        })
    })
}

ifcToPly("example.ifc")