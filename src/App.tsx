import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { Component, Suspense, useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Universe } from './components/Universe'
import './index.css'

class SceneBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state={failed:false}
  static getDerivedStateFromError(){return {failed:true}}
  render(){return this.state.failed ? <div className="fallback">No se pudo abrir el universo 3D.<button onClick={()=>window.location.reload()}>Volver a intentar</button></div> : this.props.children}
}
export default function App() {
  const [paused,setPaused]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [reset,setReset]=useState(0)
  const [ready,setReady]=useState(false)
  const sceneReady=useCallback(()=>setReady(true),[])
  const [hidden,setHidden]=useState(document.hidden)
  useEffect(()=>{const changed=()=>setHidden(document.hidden);document.addEventListener('visibilitychange',changed);return ()=>document.removeEventListener('visibilitychange',changed)},[])
  return <main className="universe" aria-label="Un universo de flores amarillas para vos">
    <div className="nebula" aria-hidden="true"/>
    <header className="dedication"><p>UN UNIVERSO PARA VOS</p><div className="title-line" aria-hidden="true"><i/>✦<i/></div></header>
    <SceneBoundary><Canvas dpr={[1,1.5]} camera={{position:[0,3.25,15.5],fov:42}} gl={{alpha:true,antialias:false,powerPreference:'high-performance'}} frameloop={hidden ? 'never' : 'always'} fallback={<div className="fallback">Este navegador necesita WebGL para mostrar tu universo.</div>}>
      <Suspense fallback={null}><Universe paused={paused} reset={reset} onReady={sceneReady}/></Suspense>
      <EffectComposer multisampling={0}><Bloom intensity={.65} luminanceThreshold={.8} luminanceSmoothing={.5} mipmapBlur/><Vignette eskil={false} offset={.25} darkness={.48}/></EffectComposer>
    </Canvas></SceneBoundary>
    {!ready && <p className="loading" role="status">Preparando tu universo…</p>}
    <footer className="universe-footer"><div className="controls"><button aria-label={paused ? 'Animar universo' : 'Pausar animación'} aria-pressed={paused} onClick={()=>setPaused(p=>!p)}>{paused ? '▷' : 'Ⅱ'}</button><span className="desktop-hint">Arrastrá para girar <b>·</b> Botón derecho para moverte <b>·</b> Scroll para acercarte</span><span className="mobile-hint">Arrastrá · Pellizcá para acercarte</span><button aria-label="Restablecer vista" title="Restablecer vista" onClick={()=>setReset(r=>r+1)}>↺</button></div></footer>
  </main>
}
