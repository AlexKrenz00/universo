import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Billboard, Html, Line, OrbitControls, useTexture } from '@react-three/drei'
import type { OrbitControls as Controls } from 'three-stdlib'
import * as THREE from 'three'

function random(seed: number) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
}

// Equirectangular botanical engraving: the drawing follows the sphere's UVs.
function engravingTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 2048; canvas.height = 1024
  const c = canvas.getContext('2d')!
  c.fillStyle = '#000'; c.fillRect(0, 0, 2048, 1024)
  const rand = random(731)
  c.strokeStyle = '#ffe3a1'; c.lineWidth = 1.6
  for (let i = 0; i < 52; i++) {
    const x = (i % 13) * 160 + 40 + rand() * 70
    const y = Math.floor(i / 13) * 250 + 90 + rand() * 110
    const radius = 25 + rand() * 44
    c.save(); c.translate(x, y); c.rotate(rand() * 6)
    const petals = 7 + Math.floor(rand() * 5)
    for (let j = 0; j < petals; j++) {
      c.save(); c.rotate(j / petals * Math.PI * 2)
      c.beginPath(); c.moveTo(0, 0)
      c.bezierCurveTo(radius * .8, -radius * .62, radius * 1.6, radius * .15, 0, 0)
      c.stroke()
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(radius * .8, -radius * .13, radius * 1.08, -radius * .05); c.stroke()
      c.restore()
    }
    c.beginPath(); c.arc(0, 0, 5, 0, Math.PI * 2); c.stroke()
    c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-20, 60, 50, 85, 20, 160); c.stroke()
    for (let k = 0; k < 3; k++) {
      const ly = 52 + k * 28, side = k % 2 ? -1 : 1
      c.beginPath(); c.moveTo(12, ly)
      c.bezierCurveTo(58 * side, ly - 42, 58 * side, ly + 5, 12, ly); c.stroke()
    }
    c.restore()
  }
  for (let i = 0; i < 30; i++) {
    const x=rand()*2048, y=100+rand()*824, r=14+rand()*18
    c.beginPath()
    for(let j=0;j<120;j++){const t=j/119*Math.PI*6, radius=r*j/119*(1+.16*Math.sin(t*3));const px=x+Math.cos(t)*radius,py=y+Math.sin(t)*radius;if(j===0)c.moveTo(px,py);else c.lineTo(px,py)}
    c.stroke()
  }
  for (let i = 0; i < 900; i++) {
    c.fillStyle = i % 3 ? '#c38b36' : '#ffe3a1'
    c.beginPath(); c.arc(rand() * 2048, rand() * 1024, .5 + rand() * 1.9, 0, 7); c.fill()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.anisotropy = 4
  return texture
}
const orbVertex = `varying vec2 vUv; varying vec3 vNormal; varying vec3 vView; varying vec3 vPosition;
void main(){ vUv=uv; vPosition=position; vec4 p=modelViewMatrix*vec4(position,1.); vNormal=normalize(normalMatrix*normal); vView=normalize(-p.xyz); gl_Position=projectionMatrix*p; }`
const orbFragment = `uniform sampler2D engraving; uniform float time; varying vec2 vUv; varying vec3 vNormal; varying vec3 vView; varying vec3 vPosition;
float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
void main(){
vec3 n=normalize(vNormal); float facing=max(dot(n,normalize(vView)),0.); float rim=pow(1.-facing,2.6);
float light=max(dot(n,normalize(vec3(-.6,.8,1.))),0.); float cloud=noise(vPosition*2.5)+.45*noise(vPosition*7.);
vec3 gold=mix(vec3(.065,.018,.009),vec3(.34,.125,.02),light*.8+cloud*.15);
gold+=vec3(1.,.68,.19)*pow(light,18.)*.28;
gold+=vec3(1.3,.75,.17)*rim;
float line=texture2D(engraving,vUv).r;
gold+=line*vec3(2.,1.35,.4)*(.65+.35*light);
gold+=pow(noise(vPosition*95.),16.)*vec3(1.2,.7,.15);
gl_FragColor=vec4(gold,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`
function GoldenOrb({ paused }: { paused: boolean }) {
  const group = useRef<THREE.Group>(null)
  const texture = useMemo(() => engravingTexture(), [])
  const uniforms = useMemo(() => ({ engraving: { value: texture }, time: { value: 0 } }), [texture])
  useEffect(() => () => texture.dispose(), [texture])
  useFrame((_, delta) => { if (!paused && group.current) group.current.rotation.y += delta * .025 })
  return <group position={[0, .35, 0]} ref={group} rotation={[0, .7, -.13]}>
    <mesh><sphereGeometry args={[2.55, 96, 64]} /><shaderMaterial vertexShader={orbVertex} fragmentShader={orbFragment} uniforms={uniforms} /></mesh>
  </group>
}
const particleVertex = `uniform float time; uniform float pixelRatio; uniform float pointScale; attribute float seed; varying float vAlpha; varying vec3 vColor;
void main(){vec3 p=position;p.y+=sin(time*.3+seed*50.+p.x*.2)*.065;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
gl_PointSize=clamp((30.+seed*76.)*pixelRatio*pointScale/-mv.z,1.,11.);vAlpha=(.4+.6*seed)*(1.-smoothstep(8.,65.,-mv.z));vColor=mix(vec3(1.,.38,.06),vec3(1.,.88,.36),seed);}`
const particleFragment = `varying float vAlpha;varying vec3 vColor;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float a=exp(-d*d*22.);gl_FragColor=vec4(vColor*1.7,a*vAlpha);}`
function ParticleSea({ mobile, paused }: { mobile: boolean; paused: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null)
  const { gl } = useThree()
  const [positions, seeds] = useMemo(() => {
    const rand = random(1337), count = mobile ? 24000 : 48000
    const p = new Float32Array(count * 3), s = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2
      const r = 3.3 + Math.pow(rand(), .8) * (i % 5 === 0 ? 35 : 17)
      const band = Math.sin(r * 1.7 + a * 2) * .5 + .5
      p[i * 3] = Math.cos(a) * r
      p[i * 3 + 1] = -2.1 + rand() * .55 + Math.sin(a * 3 + r * .4) * .18
      p[i * 3 + 2] = Math.sin(a) * r
      s[i] = (.2 + rand() * .8) * (.4 + .6 * band)
    }
    return [p, s]
  }, [mobile])
  const uniforms = useMemo(() => ({time:{value:0},pixelRatio:{value:Math.min(gl.getPixelRatio(),1.5)},pointScale:{value:mobile ? 1.05 : 1}}),[gl,mobile])
  useFrame((_, d) => { if (material.current && !paused) material.current.uniforms.time.value += d })
  return <points frustumCulled={false}>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/><bufferAttribute attach="attributes-seed" args={[seeds,1]}/></bufferGeometry>
    <shaderMaterial ref={material} uniforms={uniforms} vertexShader={particleVertex} fragmentShader={particleFragment} transparent depthWrite={false} blending={THREE.AdditiveBlending}/>
  </points>
}
function Nebula() {
  const [positions, colors] = useMemo(() => {
    const rand = random(903), p = new Float32Array(2800 * 3), c = new Float32Array(2800 * 3)
    for(let i=0;i<2800;i++) {
      const y = (rand()-.5)*40, spread = (rand()+rand()+rand()-1.5)*6
      p.set([y*.48+spread, y, -27-rand()*12], i*3)
      c.set(i%5 ? [.35+rand()*.4,.08+rand()*.16,.24+rand()*.25] : [.9,.74,.58],i*3)
    } return [p,c]
  },[])
  return <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/><bufferAttribute attach="attributes-color" args={[colors,3]}/></bufferGeometry><pointsMaterial size={.055} vertexColors transparent opacity={.7} depthWrite={false} blending={THREE.AdditiveBlending}/></points>
}
const bouquetVertex = `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`
const bouquetFragment = `uniform sampler2D picture;varying vec2 vUv;void main(){vec4 p=texture2D(picture,vUv);float a=smoothstep(.015,.1,max(p.r,max(p.g,p.b)));if(a<.02)discard;gl_FragColor=vec4(p.rgb*1.08,a);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`
function configureBouquetTexture(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
}
const flowerImages = ['/images/bouquet.webp', '/images/roses.webp', '/images/tulips.webp', '/images/daisies.webp', '/images/lilies.webp']
function Bouquet({ position, scale, tilt, paused, index, bare }: { position: [number,number,number]; scale: number; tilt: number; paused: boolean; index: number; bare: boolean }) {
  const image = useTexture(flowerImages[index % flowerImages.length], configureBouquetTexture)
  const group = useRef<THREE.Group>(null)
  const time = useRef(index * 2)
  const uniforms = useMemo(() => ({ picture: { value: image } }),[image])
  const border = useMemo(() => {
    const shape = new THREE.Shape(), w = .95, h = 1.15, r = .17
    shape.moveTo(-w+r,-h);shape.lineTo(w-r,-h);shape.quadraticCurveTo(w,-h,w,-h+r)
    shape.lineTo(w,h-r);shape.quadraticCurveTo(w,h,w-r,h);shape.lineTo(-w+r,h)
    shape.quadraticCurveTo(-w,h,-w,h-r);shape.lineTo(-w,-h+r);shape.quadraticCurveTo(-w,-h,-w+r,-h)
    return shape.getPoints(12).map(p=>new THREE.Vector3(p.x,p.y,0))
  },[])
  useFrame((_, d)=> { if(!paused && group.current){time.current+=d;group.current.position.y=Math.sin(time.current*.45)*.09;group.current.rotation.z=tilt+Math.sin(time.current*.3)*.018} })
  return <Billboard position={position} scale={scale}><group ref={group} rotation={[0,0,tilt]}>
    {!bare && <><mesh position={[0,0,-.015]}><planeGeometry args={[1.87,2.25]}/><meshBasicMaterial color="#120b10" transparent opacity={.74}/></mesh>
    <Line points={border} color={new THREE.Color(1.45,.84,.24)} lineWidth={1.2}/></>}
    <mesh position={[0,.08,.025]}><planeGeometry args={[1.9,1.98]}/><shaderMaterial uniforms={uniforms} vertexShader={bouquetVertex} fragmentShader={bouquetFragment} transparent depthWrite={false} side={THREE.DoubleSide}/></mesh>
    {!bare && <mesh position={[0,-1.02,.03]}><planeGeometry args={[.32,.009]}/><meshBasicMaterial color="#e5bb66"/></mesh>}
  </group></Billboard>
}
function Camera({mobile,reset}:{mobile:boolean;reset:number}) {
  const ref = useRef<Controls>(null)
  const { camera } = useThree()
  useEffect(()=> {
    camera.position.set(0, mobile ? 3.8 : 3.25, mobile ? 18.8 : 15.5)
    // Three.js camera is an imperative scene object, updated on viewport/reset changes.
    // oxlint-disable-next-line react/immutability
    if(camera instanceof THREE.PerspectiveCamera){camera.fov=mobile ? 53 : 42;camera.updateProjectionMatrix()}
    ref.current?.target.set(0,.55,0);ref.current?.update()
  },[camera,mobile,reset])
  return <OrbitControls ref={ref} enablePan enableDamping dampingFactor={.07} rotateSpeed={.55} zoomSpeed={.65} screenSpacePanning/>
}
export function Universe({ paused, reset, onReady }: { paused: boolean; reset: number; onReady: () => void }) {
  useEffect(onReady, [onReady])
  const mobile = useThree(s=>s.size.width < 700)
  // Cards occupy foreground, horizon and far side, so exploration reveals more flowers.
  const arrangements: [number,number,number,number,number][] = mobile ? [
    [-3.2,.1,-2,.65,-.12], [3.2,.35,-2,.65,.12],
    [-2.7,-.1,2,.76,-.1], [2.7,-.05,2,.76,.1],
    [-1.05,-1.2,3.25,.82,-.05], [1.05,-1.25,3.5,.85,.07],
    [-3.8,2.5,-5,.6,-.13], [3.8,2.4,-5,.6,.11],
    [-2.7,-1.75,1,.58,-.15], [2.7,-1.7,1,.58,.15],
    [-.9,2.6,-3,.55,-.09], [.9,2.8,-3,.56,.08],
    [-4.5,-.4,-5,.55,-.16], [4.5,-.3,-5,.55,.14],
    [-2.2,3.3,-5,.42,-.1], [2.2,3.3,-5,.42,.1],
    [-1.8,-2.5,-4,.55,-.08], [1.8,-2.5,-4,.55,.09],
    [-3.5,2.5,-8,.52,-.11], [3.5,2.5,-8,.52,.11],
  ] : [
    [-6.9,.1,-4,.7,-.12], [6.9,.25,-4,.7,.12],
    [-5.2,.2,-.5,.84,-.12], [5.3,.3,-.7,.8,.1],
    [-3.55,-.25,2.1,.96,-.09], [3.55,-.05,2,.98,.08],
    [-1.35,-1.3,3.2,.82,-.06], [1.25,-1.45,3.65,.91,.06],
    [-10.8,2.4,-9,.65,-.15], [10.5,2,-8,.7,.13],
    [-7.6,-1,-2,.62,-.09], [7.8,-.8,-2,.62,.1],
    [-2.1,2.6,-3.4,.58,-.07], [2.4,2.8,-3.8,.6,.08],
    [-5.8,2.8,-5,.62,-.13], [6,2.6,-5,.63,.12],
    [-3.8,-1.9,-1,.7,-.07], [3.7,-1.7,-1,.72,.08],
    [-2,.3,-4,.75,-.07], [2,.3,-4,.75,.06],
    [-8.9,.1,-5,.55,-.14], [8.9,.3,-6,.58,.13],
    [-4.8,3.2,-7,.48,-.1], [4.9,3.1,-7,.48,.1],
    [-7,3.9,-10,.5,-.12], [7.2,3.8,-10,.5,.12],
    [-9,-2.4,-4,.55,-.14], [9,-2.2,-4,.55,.14],
    [-4,-2.8,-5,.6,-.1], [4,-2.9,-5,.58,.1],
    [-3.7,1.7,-7,.55,-.08], [3.8,1.8,-7,.56,.08],
    [-11.5,.9,-11,.5,-.12], [11.5,.8,-11,.5,.12],
  ]
  return <>
    <Nebula/><ParticleSea mobile={mobile} paused={paused}/><GoldenOrb paused={paused}/>
    <Html center position={[0,3.6,0]} style={{pointerEvents:'none'}}><span className="orb-initial" aria-label="J">J</span></Html>
    {arrangements.map(([x,y,z,s,t],i)=><Bouquet key={`${mobile}-${i}`} position={[x,y,z]} scale={s} tilt={t} paused={paused} index={i} bare={i >= (mobile ? 6 : 8) && i % 3 === 0}/>)}
    <Camera mobile={mobile} reset={reset}/>
  </>
}
