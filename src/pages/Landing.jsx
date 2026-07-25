import { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Float, MeshTransmissionMaterial, ContactShadows,
  useCursor, Sparkles, Lightformer, Environment,
} from '@react-three/drei';
import { Physics, RigidBody, BallCollider } from '@react-three/rapier';
import * as THREE from 'three';
import '../styles/landing.css';

const C = {
  teal900: '#014b44', teal800: '#026c61', teal700: '#028e85',
  teal500: '#02b3ab', teal400: '#22d1c5', teal200: '#8fece4',
  crema: '#f3efe2', sol: '#f5b301', chamoy: '#e23744', azul: '#1f9be0',
};

const SABORES = [
  { color: '#22d1c5' }, { color: '#f5b301' }, { color: '#e23744' },
  { color: '#7ad13a' }, { color: '#ffb4d1' }, { color: '#8a5a2b' },
];

function LiquidBackground() {
  const mat = useRef();
  const { viewport } = useThree();
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColorA: { value: new THREE.Color(C.teal200) },
    uColorB: { value: new THREE.Color(C.teal500) },
    uColorC: { value: new THREE.Color(C.crema) },
  }), []);
  useFrame((_, d) => { if (mat.current) mat.current.uniforms.uTime.value += d; });
  return (
    <mesh position={[0, 0, -8]} scale={[viewport.width * 2.4, viewport.height * 2.4, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }"}
        fragmentShader={"varying vec2 vUv; uniform float uTime; uniform vec3 uColorA; uniform vec3 uColorB; uniform vec3 uColorC; vec2 hash(vec2 p){ p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))); return -1.+2.*fract(sin(p)*43758.5453123);} float noise(vec2 p){ vec2 i=floor(p),f=fract(p); vec2 u=f*f*(3.-2.*f); return mix(mix(dot(hash(i),f),dot(hash(i+vec2(1,0)),f-vec2(1,0)),u.x), mix(dot(hash(i+vec2(0,1)),f-vec2(0,1)),dot(hash(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y);} void main(){ vec2 uv=vUv; float t=uTime*0.12; float melt=noise(vec2(uv.x*3.0, uv.y*2.0 - t*2.0)); float n=noise(uv*3.5+vec2(t,melt)); float n2=noise(uv*6.0-vec2(t*0.6,0.0)); vec3 col=mix(uColorC,uColorA,smoothstep(0.0,1.0,uv.y+n*0.4)); col=mix(col,uColorB,smoothstep(0.3,0.9,n2*0.5+0.5+uv.y*0.2)); float drip=smoothstep(0.75,0.78,fract(uv.x*8.0+melt*0.5)); col+=drip*0.04; gl_FragColor=vec4(col,1.0);} "}
      />
    </mesh>
  );
}

function Splash({ position, color, onDone }) {
  const group = useRef();
  const count = 18;
  const parts = useMemo(() => Array.from({ length: count }, () => ({
    dir: new THREE.Vector3(THREE.MathUtils.randFloatSpread(2), THREE.MathUtils.randFloat(0.5, 2.2), THREE.MathUtils.randFloatSpread(2)).normalize(),
    speed: THREE.MathUtils.randFloat(2, 5),
    size: THREE.MathUtils.randFloat(0.05, 0.16),
  })), []);
  const life = useRef(0);
  useFrame((_, d) => {
    life.current += d;
    if (!group.current) return;
    group.current.children.forEach((m, i) => {
      const p = parts[i];
      m.position.addScaledVector(p.dir, p.speed * d);
      m.position.y -= life.current * d * 3;
      m.scale.setScalar(Math.max(0, p.size * (1 - life.current / 0.9)));
    });
    if (life.current > 0.9) onDone();
  });
  return (
    <group ref={group} position={position}>
      {parts.map((p, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial color={color} roughness={0.2} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

function Scoop({ sabor, position }) {
  const body = useRef();
  const [hovered, setHovered] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [splash, setSplash] = useState(null);
  useCursor(hovered);

  const explode = (e) => {
    e.stopPropagation();
    if (exploded || !body.current) return;
    const p = body.current.translation();
    setSplash([p.x, p.y, p.z]);
    setExploded(true);
    setTimeout(() => {
      if (body.current) {
        body.current.setTranslation({ x: position[0], y: position[1] + 3, z: position[2] }, true);
        body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      }
      setExploded(false);
    }, 1400);
  };

  const nudge = (e) => {
    e.stopPropagation();
    if (body.current) body.current.applyImpulse({ x: THREE.MathUtils.randFloatSpread(4), y: 3, z: 0 }, true);
  };

  return (
    <>
      {!exploded && (
        <RigidBody ref={body} colliders={false} position={position} restitution={0.75} friction={0.4} linearDamping={0.4} angularDamping={0.4}>
          <BallCollider args={[0.62]} />
          <Float speed={2} rotationIntensity={0.5} floatIntensity={0.4}>
            <mesh
              onPointerOver={() => setHovered(true)}
              onPointerOut={() => setHovered(false)}
              onClick={explode}
              onPointerDown={nudge}
              scale={hovered ? 1.12 : 1}
              castShadow
            >
              <sphereGeometry args={[0.6, 48, 48]} />
              <MeshTransmissionMaterial color={sabor.color} thickness={0.6} roughness={0.15} transmission={0.35} ior={1.3} chromaticAberration={0.05} backside />
            </mesh>
            <mesh scale={hovered ? 1.12 : 1}>
              <sphereGeometry args={[0.6, 32, 32]} />
              <meshStandardMaterial color={sabor.color} roughness={0.35} metalness={0.05} transparent opacity={0.55} />
            </mesh>
          </Float>
        </RigidBody>
      )}
      {splash && exploded && <Splash position={splash} color={sabor.color} onDone={() => setSplash(null)} />}
    </>
  );
}

function PhysicsBounds() {
  const { viewport } = useThree();
  const w = viewport.width;
  return (
    <>
      <RigidBody type="fixed" restitution={0.7} friction={0.5}>
        <mesh position={[0, -3.4, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} /><meshStandardMaterial transparent opacity={0} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed"><mesh position={[-w / 1.6, 0, 0]}><boxGeometry args={[0.5, 20, 20]} /><meshStandardMaterial transparent opacity={0} /></mesh></RigidBody>
      <RigidBody type="fixed"><mesh position={[w / 1.6, 0, 0]}><boxGeometry args={[0.5, 20, 20]} /><meshStandardMaterial transparent opacity={0} /></mesh></RigidBody>
      <RigidBody type="fixed"><mesh position={[0, 0, -2]}><boxGeometry args={[40, 20, 0.5]} /><meshStandardMaterial transparent opacity={0} /></mesh></RigidBody>
      <RigidBody type="fixed"><mesh position={[0, 0, 2.5]}><boxGeometry args={[40, 20, 0.5]} /><meshStandardMaterial transparent opacity={0} /></mesh></RigidBody>
    </>
  );
}

function Scene({ onReady }) {
  useEffect(() => { onReady && onReady(); }, [onReady]);
  const scoops = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 14; i++) {
      arr.push({ sabor: SABORES[i % SABORES.length], position: [THREE.MathUtils.randFloatSpread(6), 2 + Math.random() * 4, THREE.MathUtils.randFloatSpread(1.5)] });
    }
    return arr;
  }, []);
  return (
    <>
      <LiquidBackground />
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 5]} intensity={1.4} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-5, 3, 2]} intensity={0.5} color={C.teal200} />
      <Environment resolution={64}>
        <Lightformer intensity={2} position={[0, 4, 4]} scale={[8, 8, 1]} color="#ffffff" />
        <Lightformer intensity={1.2} position={[-4, 2, 2]} scale={[4, 4, 1]} color="#8fece4" />
        <Lightformer intensity={1} position={[4, 1, 2]} scale={[4, 4, 1]} color="#22d1c5" />
      </Environment>
      <Sparkles count={60} scale={12} size={3} speed={0.3} color={C.teal200} opacity={0.5} />
      <Physics gravity={[0, -9, 0]}>
        <PhysicsBounds />
        {scoops.map((s, i) => <Scoop key={i} sabor={s.sabor} position={s.position} />)}
      </Physics>
      <ContactShadows position={[0, -3.3, 0]} opacity={0.25} scale={20} blur={2.5} far={5} color={C.teal900} />
    </>
  );
}

function Overlay({ navigate }) {
  return (
    <div className="overlay">
      <header className="ov-nav">
        <div className="ov-logo"><span className="ov-badge">0°</span> Zero Grados</div>
        <nav className="ov-links">
          <a href="#premium">Helados</a>
          <a href="#granizados">Granizados</a>
          <a href="#enchilados">Enchilados</a>
          <a href="#ubicacion">Dónde estamos</a>
        </nav>
        <button className="ov-enter" onClick={() => navigate('/login')}>Ingresar</button>
      </header>
      <section className="ov-hero">
        <span className="ov-eyebrow">Heladería · Linares, Nariño</span>
        <h1>Tu pausa <em>fresca</em><br />bajo cero.</h1>
        <p>Arrastra las bolas. Haz clic para explotarlas. 👆<br />Helados premium, granizados naturales y gomas enchiladas.</p>
        <div className="ov-cta">
          <a href="#premium" className="ov-btn ov-btn-p">Ver el menú 🍦</a>
          <a href="#ubicacion" className="ov-btn ov-btn-g">Cómo llegar</a>
        </div>
        <div className="ov-scroll-hint"><span></span>desliza</div>
      </section>
    </div>
  );
}

const PREMIUM = [
  { n: 'Copa Don Efra', s: 'Banana split tradicional', d: 'Dos bolas de helado, banano fresco, crema batida, salsa de chocolate, barquillos y cereza.', p: '$16.000' },
  { n: 'Tentación de Lulo', s: 'Crema con lulo', d: 'Helado de vainilla bañado en dulce artesanal de lulo nariñense y crema chantilly.', p: '$10.500' },
  { n: 'Delicia del Bosque', s: 'Crema con cerezas', d: 'Helado de chocolate o vainilla, reducción de cerezas y virutas de chocolate negro.', p: '$11.000' },
  { n: 'Clásica Primavera', s: 'Crema con fresas', d: 'Láminas de fresa de la región, helado de la casa, leche condensada y chantilly.', p: '$10.000' },
];
const GRANIZADOS = [
  { n: 'Campestre de Maracuyá', d: 'Tropical intenso, dulce y refrescante.', c: C.sol },
  { n: 'Glacial de Limón Mandarina', d: 'Acidez perfecta con cítricos de Linares.', c: '#7ad13a' },
  { n: 'Volcánico de Frutos Rojos', d: 'Fresa, mora y arándanos silvestres.', c: C.chamoy },
  { n: 'Oasis de Mango Biche', d: 'El clásico playero: sal, limón y pimienta.', c: C.sol },
];

function Content() {
  return (
    <div className="content">
      <section className="c-sec" id="premium">
        <div className="c-head">
          <span className="c-kicker">Heladería premium</span>
          <h2>Con la calidad de <em>Helados Colombina</em></h2>
        </div>
        <div className="drip-row">
          {PREMIUM.map((p) => (
            <article className="drip-card" key={p.n}>
              <div className="drip-top" />
              <div className="drip-body">
                <div className="drip-h"><h3>{p.n}</h3><span>{p.p}</span></div>
                <small>{p.s}</small><p>{p.d}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="c-sec alt" id="granizados">
        <div className="c-head">
          <span className="c-kicker">Granizados 100% naturales</span>
          <h2>Felicidad <em>bajo cero</em>, directo de la máquina</h2>
          <div className="sizes"><span>Mediano 12oz · <b>$7.500</b></span><span>Grande 16oz · <b>$9.500</b></span></div>
        </div>
        <div className="gran-row">
          {GRANIZADOS.map((g) => (
            <article className="gran-cup" key={g.n} style={{ '--gc': g.c }}>
              <div className="cup"><div className="cup-fill" /></div>
              <h3>{g.n}</h3><p>{g.d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="c-sec ench" id="enchilados">
        <div className="ench-wrap">
          <div>
            <span className="c-kicker light">Experiencia enchilada</span>
            <h2>Ácido, picante <em>y adictivo</em></h2>
            <ul>
              <li><div><b>Chamoyadas (granizados enchilados)</b><span>Vaso escarchado con chile, tajín y chamoy artesanal.</span></div><span className="ep">$9.500</span></li>
              <li><div><b>Gomitas enchiladas Zero Grados</b><span>Marinadas en limón, chamoy especial y polvo picante.</span></div><span className="ep">$5.500</span></li>
            </ul>
            <p className="ench-note">Para adultos: <b>granizados con alcohol</b> 🍹</p>
          </div>
        </div>
      </section>

      <section className="c-sec promo">
        <div className="promo-card">
          <span className="promo-off">10%<small>OFF</small></span>
          <div>
            <h2>¿Pescaste tu trucha o ya almorzaste?</h2>
            <p>Muestra tu tiquete de <b>Restaurantes Don Efra</b> y recibe 10% de descuento en tu postre helado.</p>
          </div>
        </div>
      </section>

      <section className="c-sec ubi" id="ubicacion">
        <div className="ubi-wrap">
          <div className="ubi-copy">
            <span className="c-kicker light">Encuéntranos</span>
            <h2>Estamos en <em>Linares, Nariño</em></h2>
            <p>Tu pausa fresca dentro de Restaurantes Don Efra.</p>
            <div className="ubi-info">
              <div><b>📍 Lugar</b><span>Restaurantes Don Efra — Linares, Nariño</span></div>
              <div><b>🕑 Horario</b><span>Todos los días · 11 a.m. – 9 p.m.</span></div>
              <div><b>📞 WhatsApp</b><span>+57 300 000 0000</span></div>
            </div>
            <a className="ov-btn ov-btn-p" href="https://wa.me/573000000000" target="_blank" rel="noreferrer">Escríbenos 💬</a>
          </div>
          <div className="ubi-map">
            <iframe title="Zero Grados Linares" loading="lazy" src="https://www.google.com/maps?q=Linares,Nari%C3%B1o,Colombia&output=embed" />
          </div>
        </div>
      </section>

      <footer className="c-foot">
        <div className="c-foot-b"><span className="ov-badge">0°</span> Zero Grados</div>
        <p>Frescura que se disfruta, sabor que enamora · Linares, Nariño</p>
        <small>© {new Date().getFullYear()} Heladería Zero Grados · Tu pausa fresca en Restaurantes Don Efra.</small>
      </footer>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  return (
    <div className="zg3d">
      <div className="canvas-fixed">
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0.5, 8], fov: 45 }}>
          <Suspense fallback={null}>
            <Scene onReady={() => setReady(true)} />
          </Suspense>
        </Canvas>
      </div>
      <Overlay navigate={navigate} />
      <Content />
      {!ready && (
        <div className="zg-loader">
          <div className="zg-loader-scoop">🍦</div>
          <span>Enfriando la experiencia…</span>
        </div>
      )}
    </div>
  );
}