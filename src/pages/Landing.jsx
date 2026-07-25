import { useEffect, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';
import '../styles/landing.css';

gsap.registerPlugin(ScrollTrigger);

/* ================= DATOS REALES DE LA MARCA ================= */
// Reemplaza los `img` por tus fotos oficiales cuando las tengas.
const PREMIUM = [
  { n: 'Copa Don Efra', s: 'Banana split tradicional', d: 'Dos bolas de helado, banano fresco, crema batida, salsa de chocolate, barquillos y cereza.', p: '$16.000', img: 'https://images.unsplash.com/photo-1590080876351-8a5f7d8c1f5e?w=600&q=80' },
  { n: 'Tentación de Lulo', s: 'Crema con lulo', d: 'Cremoso helado de vainilla bañado en dulce artesanal de lulo nariñense y crema chantilly.', p: '$10.500', img: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&q=80' },
  { n: 'Delicia del Bosque', s: 'Crema con cerezas', d: 'Helado de chocolate o vainilla, reducción de cerezas rojas y virutas de chocolate negro.', p: '$11.000', img: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600&q=80' },
  { n: 'Clásica Primavera', s: 'Crema con fresas', d: 'Láminas de fresa de la región, helado de la casa, leche condensada y chantilly.', p: '$10.000', img: 'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=600&q=80' },
];

const GRANIZADOS = [
  { n: 'Campestre de Maracuyá', d: 'Sabor tropical intenso, dulce y refrescante.', img: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=500&q=80', c: '#f5b301' },
  { n: 'Glacial de Limón Mandarina', d: 'Balance perfecto de acidez con cítricos de Linares.', img: 'https://images.unsplash.com/photo-1523371683702-e9a3a6d29d5c?w=500&q=80', c: '#7ad13a' },
  { n: 'Volcánico de Frutos Rojos', d: 'Fresa, mora y arándanos silvestres.', img: 'https://images.unsplash.com/photo-1560008581-09826d1de69e?w=500&q=80', c: '#d7263d' },
  { n: 'Oasis de Mango Biche', d: 'El clásico playero: sal, limón y pimienta.', img: 'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=500&q=80', c: '#f5b301' },
];

const OFERTA = [
  { t: 'Helados premium', d: 'Con la calidad de Helados Colombina.', e: '🍨' },
  { t: 'Granizados 100% naturales', d: 'Fruta real, hechos al momento en máquina.', e: '🧊' },
  { t: 'Gomas enchiladas', d: 'Gomitas marinadas en chamoy y polvo picante.', e: '🌶️' },
  { t: 'Granizados con alcohol', d: 'La versión adulta de tu pausa fresca.', e: '🍹' },
];

export default function Landing() {
  const navigate = useNavigate();
  const root = useRef(null);
  const heroScoops = useRef([]);
  heroScoops.current = [];
  const addScoop = (el) => el && !heroScoops.current.includes(el) && heroScoops.current.push(el);

  /* ---- Lenis smooth scroll ---- */
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    const id = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(id); lenis.destroy(); };
  }, []);

  /* ---- GSAP animations ---- */
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Hero: entrada escalonada
      gsap.from('.hero-line', { yPercent: 120, opacity: 0, duration: 1, stagger: 0.12, ease: 'power4.out', delay: 0.2 });
      gsap.from('.hero-sub, .hero-cta, .hero-badges', { y: 30, opacity: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out', delay: 0.7 });

      // Scoops flotantes (parallax + float)
      heroScoops.current.forEach((el, i) => {
        gsap.to(el, { y: '+=22', duration: 2 + i * 0.4, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * 0.2 });
        gsap.to(el, {
          yPercent: -30 - i * 15, ease: 'none',
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
        });
      });

      // Marquee sync ya es CSS; blobs parallax
      gsap.utils.toArray('.blob').forEach((b, i) => {
        gsap.to(b, { yPercent: (i % 2 ? -18 : 18), ease: 'none',
          scrollTrigger: { trigger: b.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true } });
      });

      // Reveal genérico de secciones
      gsap.utils.toArray('.reveal').forEach((el) => {
        gsap.from(el, {
          y: 60, opacity: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 82%' },
        });
      });

      // Tarjetas premium: aparecen en cascada
      gsap.from('.pcard', {
        y: 80, opacity: 0, rotateZ: 2, duration: 0.8, stagger: 0.12, ease: 'back.out(1.4)',
        scrollTrigger: { trigger: '.premium-grid', start: 'top 80%' },
      });

      // Franja "se ofrece": pin + horizontal reveal en desktop
      gsap.from('.oferta-item', {
        scale: 0.85, opacity: 0, duration: 0.6, stagger: 0.12, ease: 'back.out(1.6)',
        scrollTrigger: { trigger: '.oferta', start: 'top 78%' },
      });

      // Título grande con contador de temperatura
      gsap.fromTo('.temp-count', { innerText: 30 }, {
        innerText: 0, duration: 2, ease: 'power2.out', snap: { innerText: 1 },
        scrollTrigger: { trigger: '.temp-band', start: 'top 70%' },
        onUpdate() { const t = this.targets()[0]; t.innerText = Math.round(t.innerText); },
      });

      // Granizados: parallax sutil por columna
      gsap.utils.toArray('.gcard').forEach((el, i) => {
        gsap.to(el, { y: i % 2 ? -24 : 24, ease: 'none',
          scrollTrigger: { trigger: '.granizados', start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div className="zg-landing" ref={root}>
      {/* ============ NAV ============ */}
      <header className="zg-nav">
        <a className="zg-logo" href="#top">
          <span className="zg-logo-badge">0°</span>
          <span>Zero Grados</span>
        </a>
        <nav className="zg-links">
          <a href="#premium">Helados</a>
          <a href="#granizados">Granizados</a>
          <a href="#enchilados">Enchilados</a>
          <a href="#ubicacion">Dónde estamos</a>
        </nav>
        <button className="zg-btn zg-btn-sun" onClick={() => navigate('/login')}>Ingresar</button>
      </header>

      {/* ============ HERO ============ */}
      <section className="hero" id="top">
        <div className="hero-bg-gradient" />
        {/* scoops decorativos flotantes */}
        <img ref={addScoop} className="scoop s1" alt="" src="https://cdn-icons-png.flaticon.com/512/938/938063.png" />
        <img ref={addScoop} className="scoop s2" alt="" src="https://cdn-icons-png.flaticon.com/512/2738/2738730.png" />
        <img ref={addScoop} className="scoop s3" alt="" src="https://cdn-icons-png.flaticon.com/512/3081/3081967.png" />
        <img ref={addScoop} className="scoop s4" alt="" src="https://cdn-icons-png.flaticon.com/512/1147/1147805.png" />

        <div className="hero-inner">
          <span className="hero-eyebrow reveal-now">Heladería · Linares, Nariño</span>
          <h1 className="hero-title">
            <span className="hero-line-wrap"><span className="hero-line">Tu pausa</span></span>
            <span className="hero-line-wrap"><span className="hero-line accent">fresca</span></span>
            <span className="hero-line-wrap"><span className="hero-line">bajo cero.</span></span>
          </h1>
          <p className="hero-sub">Helados premium, granizados 100% naturales y gomas enchiladas. Frescura que se disfruta, sabor que enamora.</p>
          <div className="hero-cta">
            <a href="#premium" className="zg-btn zg-btn-primary">Ver el menú <span>🍦</span></a>
            <a href="#ubicacion" className="zg-btn zg-btn-ghost">Cómo llegar</a>
          </div>
          <div className="hero-badges">
            <span>❄️ Hechos al momento</span>
            <span>🌿 100% naturales</span>
            <span>⭐ Calidad Colombina</span>
          </div>
        </div>

        {/* cinta corredora */}
        <div className="marquee">
          <div className="marquee-track">
            {Array(2).fill(0).map((_, k) => (
              <span key={k}>Helados&nbsp;·&nbsp;Granizados&nbsp;·&nbsp;Gomas enchiladas&nbsp;·&nbsp;Chamoyadas&nbsp;·&nbsp;Coctelería glacial&nbsp;·&nbsp;</span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SE OFRECE ============ */}
      <section className="oferta" id="oferta">
        <div className="oferta-head reveal">
          <span className="kicker">Se ofrece</span>
          <h2>Cuatro formas de <em>enfriar el día</em></h2>
        </div>
        <div className="oferta-grid">
          {OFERTA.map((o) => (
            <article className="oferta-item" key={o.t}>
              <div className="oferta-emoji">{o.e}</div>
              <h3>{o.t}</h3>
              <p>{o.d}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ============ BANDA DE TEMPERATURA (firma visual) ============ */}
      <section className="temp-band">
        <div className="blob blob-a" />
        <div className="temp-inner reveal">
          <div className="temp-big"><span className="temp-count">30</span><span className="deg">°</span></div>
          <p>El punto exacto en el que un antojo se vuelve <strong>tu pausa perfecta</strong>. Todo lo batimos y congelamos al momento, sin sabores artificiales.</p>
        </div>
      </section>

      {/* ============ HELADERÍA PREMIUM ============ */}
      <section className="premium" id="premium">
        <div className="section-head reveal">
          <span className="kicker">Heladería premium</span>
          <h2>Con la calidad de <em>Helados Colombina</em></h2>
          <p className="section-lead">Copas artesanales pensadas para compartir (o no).</p>
        </div>
        <div className="premium-grid">
          {PREMIUM.map((c) => (
            <article className="pcard" key={c.n}>
              <div className="pcard-img"><img src={c.img} alt={c.n} loading="lazy" /></div>
              <div className="pcard-body">
                <div className="pcard-top">
                  <h3>{c.n}</h3>
                  <span className="pcard-price">{c.p}</span>
                </div>
                <span className="pcard-sub">{c.s}</span>
                <p>{c.d}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ============ GRANIZADOS ============ */}
      <section className="granizados" id="granizados">
        <div className="blob blob-b" />
        <div className="section-head reveal">
          <span className="kicker">Granizados 100% naturales</span>
          <h2>Felicidad <em>bajo cero</em>, directo de la máquina</h2>
          <div className="gran-sizes reveal">
            <span>Vaso mediano (12 oz) · <strong>$7.500</strong></span>
            <span>Vaso grande (16 oz) · <strong>$9.500</strong></span>
          </div>
        </div>
        <div className="gran-grid">
          {GRANIZADOS.map((g) => (
            <article className="gcard" key={g.n} style={{ '--gc': g.c }}>
              <div className="gcard-img"><img src={g.img} alt={g.n} loading="lazy" /></div>
              <h3>{g.n}</h3>
              <p>{g.d}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ============ ENCHILADOS (experiencia) ============ */}
      <section className="enchilados" id="enchilados">
        <div className="ench-grid">
          <div className="ench-copy reveal">
            <span className="kicker light">Experiencia enchilada</span>
            <h2>Ácido, picante <em>y adictivo</em></h2>
            <ul className="ench-list">
              <li>
                <div><strong>Granizados enchilados (chamoyadas)</strong><span>Vaso escarchado con chile, tajín y chamoy artesanal de la casa.</span></div>
                <span className="ench-price">$9.500</span>
              </li>
              <li>
                <div><strong>Gomitas enchiladas Zero Grados</strong><span>Gomitas surtidas marinadas en limón, chamoy especial y lluvia de polvo picante.</span></div>
                <span className="ench-price">$5.500</span>
              </li>
            </ul>
            <p className="ench-note">Y para los adultos: <strong>granizados con alcohol</strong> 🍹 la versión atrevida de tu pausa fresca.</p>
          </div>
          <div className="ench-media reveal">
            <img src="https://images.unsplash.com/photo-1571506165871-ee72a35bc9d4?w=700&q=80" alt="Granizado enchilado con chamoy" loading="lazy" />
            <div className="ench-tag">🌶️ Picante nivel: adictivo</div>
          </div>
        </div>
      </section>

      {/* ============ PROMO ============ */}
      <section className="promo reveal" id="promo">
        <div className="promo-card">
          <div className="promo-fish">🎣</div>
          <div>
            <span className="kicker light">Promoción</span>
            <h2>¿Pescaste tu trucha o ya almorzaste?</h2>
            <p>Muestra tu tiquete de <strong>Restaurantes Don Efra</strong> y recibe un <b>10% de descuento</b> en tu postre helado.</p>
          </div>
          <div className="promo-off"><span>10%</span><small>OFF</small></div>
        </div>
      </section>

      {/* ============ UBICACIÓN ============ */}
      <section className="ubicacion" id="ubicacion">
        <div className="ubi-grid">
          <div className="ubi-copy reveal">
            <span className="kicker light">Encuéntranos</span>
            <h2>Estamos en <em>Linares, Nariño</em></h2>
            <p className="ubi-lead">Tu pausa fresca dentro de Restaurantes Don Efra. Ven por tu antojo bajo cero.</p>
            <div className="ubi-info">
              <div><span className="ubi-k">📍 Lugar</span><span>Restaurantes Don Efra — Linares, Nariño</span></div>
              <div><span className="ubi-k">🕑 Horario</span><span>Todos los días · 11:00 a.m. – 9:00 p.m.</span></div>
              <div><span className="ubi-k">📞 WhatsApp</span><span>+57 300 000 0000</span></div>
            </div>
            <div className="ubi-cta">
              <a className="zg-btn zg-btn-primary" href="https://wa.me/573000000000" target="_blank" rel="noreferrer">Escríbenos <span>💬</span></a>
              <div className="ubi-social">
                <a href="#" aria-label="Instagram">◐</a>
                <a href="#" aria-label="Facebook">f</a>
                <a href="#" aria-label="TikTok">♪</a>
              </div>
            </div>
          </div>
          <div className="ubi-map reveal">
            <iframe title="Ubicación Zero Grados" loading="lazy"
              src="https://www.google.com/maps?q=Linares,Nari%C3%B1o,Colombia&output=embed" />
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="zg-foot">
        <div className="foot-top">
          <div className="foot-brand">
            <div className="zg-logo big"><span className="zg-logo-badge">0°</span><span>Zero Grados</span></div>
            <p>Tu pausa fresca en Restaurantes Don Efra · Linares, Nariño.<br />Frescura que se disfruta, sabor que enamora.</p>
          </div>
          <div className="foot-cols">
            <div>
              <h4>Menú</h4>
              <a href="#premium">Heladería premium</a>
              <a href="#granizados">Granizados naturales</a>
              <a href="#enchilados">Enchilados</a>
              <a href="#enchilados">Con alcohol</a>
            </div>
            <div>
              <h4>Zero Grados</h4>
              <a href="#promo">Promociones</a>
              <a href="#ubicacion">Ubicación</a>
              <a href="/login">Ingresar al sistema</a>
            </div>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© {new Date().getFullYear()} Heladería Zero Grados · Todos los derechos reservados.</span>
          <span>Hecho con frescura en Nariño 💚</span>
        </div>
      </footer>
    </div>
  );
}