import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/landing.css';

/* ================= DATOS DE LA MARCA ================= */
const PREMIUM = [
  { name: 'Copa Don Efra', sub: 'Banana Split Tradicional', price: '$16.000', img: '/assets/premium1.png', desc: 'Dos bolas de helado, banano fresco, crema batida, salsa de chocolate, barquillos crujientes y una cereza.' },
  { name: 'Tentación de Lulo', sub: 'Crema con Lulo', price: '$10.500', img: '/assets/premium2.png', desc: 'Cremoso helado de vainilla bañado en un dulce artesanal de lulo nariñense y un toque de crema chantilly.' },
  { name: 'Delicia del Bosque', sub: 'Crema con Cerezas', price: '$11.000', img: '/assets/premium3.png', desc: 'Helado de chocolate o vainilla, reducción en almíbar de cerezas rojas y finas virutas de chocolate negro.' },
  { name: 'Clásica Primavera', sub: 'Crema con Fresas', price: '$10.000', img: '/assets/premium4.png', desc: 'Láminas de fresas selectas de la región, helado de la casa, abundante leche condensada y crema chantilly.' },
];

const GRANIZADOS = [
  { name: 'Campestre de Maracuyá', img: '/assets/gran1.png', desc: 'Sabor tropical intenso, dulce y refrescante.' },
  { name: 'Glacial de Limón Mandarina', img: '/assets/gran2.png', desc: 'El balance perfecto de acidez con cítricos locales de Linares.' },
  { name: 'Volcánico de Frutos Rojos', img: '/assets/gran3.png', desc: 'Una deliciosa combinación de fresa, mora y arándanos silvestres.' },
  { name: 'Oasis de Mango Biche', img: '/assets/gran4.png', desc: 'El clásico playero llevado al campo: con sal, limón y pimienta.' },
];

const OFERTA = [
  { num: '01', cls: 'r1', img: '/assets/premium1.png', alt: 'Helado', title: 'Helado', text: 'Copas de la casa con la calidad de Helados Colombina.', numColor: '#BFF3F5', titleColor: '#FFF9EC', textColor: 'rgba(255,249,236,.72)' },
  { num: '02', cls: 'r2', img: '/assets/gran2.png', alt: 'Granizados', title: 'Granizados', text: 'Fruta 100% natural directo de nuestra máquina.', numColor: '#062F2D', titleColor: '#062F2D', textColor: 'rgba(6,47,45,.75)' },
  { num: '03', cls: 'r3', img: '/assets/ench2.png', alt: 'Gomas enchiladas', title: 'Gomas enchiladas', text: 'Chamoy artesanal, limón y lluvia de polvo picante.', numColor: '#FFD52E', titleColor: '#FFF9EC', textColor: 'rgba(255,249,236,.8)' },
  { num: '04', cls: 'r4', img: '/assets/gran3.png', alt: 'Granizados con alcohol', title: 'Coctelería glacial', text: 'Granizados con alcohol para brindar bajo cero. +18', numColor: '#0E8C86', titleColor: '#0B4F4C', textColor: 'rgba(11,79,76,.75)' },
];

const TICKER_TEXT = 'Tu pausa fresca en Restaurantes Don Efra';
const PROMO_PERCENT = 10;

/* Hook: revela un elemento cuando entra al viewport */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('in'); io.unobserve(el); } },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

function Reveal({ as: Tag = 'div', className = '', children, ...rest }) {
  const ref = useReveal();
  return (
    <Tag ref={ref} className={`zg-reveal ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export default function Landing() {
  const [scrollP, setScrollP] = useState(0);
  const [mouse, setMouse] = useState({ x: -400, y: -400 });
  const [activeIdx, setActiveIdx] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - window.innerHeight;
      setScrollP(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
      setScrolled(window.scrollY > 24); // <-- nuevo: umbral de "empezó a hacer scroll"
    };
    const onMove = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMove, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  useEffect(() => {
    const measure = () => {
      if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const temp = (24 - scrollP * 36).toFixed(0);
  const fillHeight = 12 + scrollP * 88;
  const active = PREMIUM[activeIdx];

  return (
    <div className="zg-landing">
      {/* ===== Glow que sigue el cursor ===== */}
      <div className="zg-glow-layer">
        <div className="zg-glow" style={{ transform: `translate3d(${mouse.x}px,${mouse.y}px,0)` }}>
          <div className="zg-glow-inner" />
        </div>
      </div>

      {/* ===== Barra de "Descenso" / temperatura ===== */}
      <div className="zg-progress">
        <div className="zg-progress-label">Descenso</div>
        <div className="zg-progress-track">
          <div className="zg-progress-fill" style={{ height: `${fillHeight}%` }} />
        </div>
        <div className="zg-progress-temp">{temp}°</div>
      </div>

      {/* ================= HERO ================= */}
      <section className="zg-hero" data-screen-label="Hero">
        <div className="zg-hero-blob" />
        <div className="zg-hero-dots" />

        <header
          ref={headerRef}
          className={`zg-header${scrolled ? ' zg-header--scrolled' : ''}`}
        >
          <div className="zg-brand">
            <div className="zg-brand-badge">0°</div>
            <div className="zg-brand-name">Zero Grados</div>
          </div>
          <nav className="zg-nav">
            <a href="#premium" className="zg-nav-link cyan">Premium</a>
            <a href="#enchilada" className="zg-nav-link red">Enchilada</a>
            <a href="#granizados" className="zg-nav-link cyan">Granizados</a>
            <a href="#promo" className="zg-nav-link yellow">Promo</a>
            <a href="#visitanos" className="zg-nav-cta">Ir a Don Efra</a>
          </nav>
        </header>
        <div className="zg-header-spacer" style={{ height: headerHeight }} />

        <div className="zg-hero-content">
          <div className="zg-hero-eyebrow">
            <span className="zg-hero-dot" />Linares · Nariño · Restaurantes Don Efra
          </div>


          <div className="zg-hero-orbit">
            <img src="/assets/logo-full.png" alt="Heladería Zero Grados" className="zg-hero-logo" />
            <div className="zg-hero-ring" />
            <div className="zg-hero-orb a">
              <img src="/assets/premium1.png" alt="Copa Don Efra" />
            </div>
            <div className="zg-hero-orb b">
              <img src="/assets/gran1.png" alt="Granizado de maracuyá" />
            </div>
            <div className="zg-hero-orb c">
              <img src="/assets/ench2.png" alt="Gomitas enchiladas" />
            </div>
          </div>

          <div className="zg-hero-ctas">
            <a href="#premium" className="zg-btn zg-btn-cream">Ver la carta completa</a>
            <a href="#promo" className="zg-btn zg-btn-outline">{PROMO_PERCENT}% con tu tiquete</a>
          </div>
        </div>

        <div className="zg-marquee-band">
          <div className="zg-marquee-track">
            {[0, 1].map((k) => (
              <div className="zg-marquee-set" key={k}>
                <span>{TICKER_TEXT}</span><span className="star">✳</span>
                <span>Hecho al momento</span><span className="star cyan">✳</span>
                <span>{TICKER_TEXT}</span><span className="star">✳</span>
                <span>Fruta 100% natural</span><span className="star cyan">✳</span>
              </div>
            ))}
          </div>
        </div>
        <div className="zg-scallop" />
      </section>

      {/* ================= SE OFRECE (4 formas) ================= */}
      <section className="zg-oferta" data-screen-label="Se ofrece">
        <div className="zg-wrap">
          <div className="zg-oferta-head">
            <h2>Cuatro formas<br /><span className="cyan">de bajar a cero</span></h2>
            <p>Del helado premium a la chamoyada más adictiva del Nariño. Todo servido en tu pausa fresca dentro de Restaurantes Don Efra.</p>
          </div>

          <div className="zg-oferta-grid">
            {OFERTA.map((o) => (
              <article className={`zg-oferta-card ${o.cls}`} key={o.title}>
                <div className="zg-oferta-img"><img src={o.img} alt={o.alt} /></div>
                <div className="zg-oferta-num" style={{ color: o.numColor }}>{o.num}</div>
                <h3 style={{ color: o.titleColor }}>{o.title}</h3>
                <p style={{ color: o.textColor }}>{o.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ================= HELADERÍA PREMIUM ================= */}
      <section id="premium" className="zg-premium" data-screen-label="Heladería">
        <div className="zg-premium-blob" />
        <div className="zg-wrap">
          <div className="zg-section-tag">
            <span className="zg-kicker pill">Cámara I</span>
            <span className="script">Con la calidad de Helados Colombina</span>
          </div>
          <h2 className="title">Heladería premium</h2>

          <div className="zg-premium-grid">
            <div className="zg-premium-stage">
              <div className="zg-premium-ring" />
              <div className="zg-premium-photo">
                <img src={active.img} alt={active.name} />
              </div>
              <div className="zg-premium-price">{active.price}</div>
            </div>

            <div className="zg-premium-desc">
              <p>{active.desc}</p>
              {PREMIUM.map((it, i) => (
                <button
                  type="button"
                  key={it.name}
                  className={`zg-premium-item ${i === activeIdx ? 'active' : ''}`}
                  onClick={() => setActiveIdx(i)}
                >
                  <span className="bar" />
                  <span className="info">
                    <span className="name">{it.name}</span>
                    <span className="sub">{it.sub}</span>
                  </span>
                  <span className="price">{it.price}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= EXPERIENCIA ENCHILADA ================= */}
      <section id="enchilada" className="zg-enchilada" data-screen-label="Experiencia Enchilada">
        <div className="zg-enchilada-dots" />
        <div className="zg-wrap">
          <div className="zg-section-tag">
            <span className="zg-kicker pill">Cámara II</span>
            <span className="script">Ácido, picante y adictivo</span>
          </div>
          <h2 className="title">Experiencia<br /><span className="outline">enchilada</span></h2>

          <div className="zg-ench-grid">
            <article className="zg-ench-card">
              <div className="zg-ench-img"><img src="/assets/ench1.png" alt="Granizados enchilados" /></div>
              <div className="zg-ench-top">
                <div>
                  <h3>Granizados enchilados</h3>
                  <div className="sub">(Chamoyadas)</div>
                </div>
                <div className="zg-ench-price">$9.500</div>
              </div>
              <p className="desc">Tu sabor favorito en vaso totalmente escarchado con chile en polvo tajín y salsa chamoy artesanal de la casa.</p>
              <div className="zg-ench-tags">
                <span>Escarchado</span>
                <span>Tajín</span>
                <span>Chamoy de la casa</span>
              </div>
            </article>

            <article className="zg-ench-card">
              <div className="zg-ench-img"><img src="/assets/ench2.png" alt="Gomitas enchiladas" /></div>
              <div className="zg-ench-top">
                <div>
                  <h3>Gomitas enchiladas</h3>
                  <div className="sub">Porción Zero Grados</div>
                </div>
                <div className="zg-ench-price">$5.500</div>
              </div>
              <p className="desc">Porción generosa de gomitas surtidas marinadas en jugo de limón, chamoy especial y una lluvia de polvo picante.</p>
              <div className="zg-ench-tags">
                <span>Limón</span>
                <span>Surtidas</span>
                <span>Nivel picante 3</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ================= GRANIZADOS 100% NATURALES ================= */}
      <section id="granizados" className="zg-granizados" data-screen-label="Granizados naturales">
        <div className="zg-drop a" />
        <div className="zg-drop b" />
        <div className="zg-drop c" />

        <div className="zg-wrap">
          <div className="zg-gran-head">
            <div>
              <div className="tag-row zg-section-tag">
                <span className="zg-kicker pill">Cámara III</span>
                <span className="script">Felicidad bajo cero, directo de la máquina</span>
              </div>
              <h2 className="title">Granizados<br /><span className="cyan">100% naturales</span></h2>
            </div>
            <div className="zg-gran-sizes">
              <div className="zg-gran-size-card">
                <div className="label">Vaso mediano · 12 oz</div>
                <div className="price">$7.500</div>
              </div>
              <div className="zg-gran-size-card">
                <div className="label">Vaso grande · 16 oz</div>
                <div className="price">$9.500</div>
              </div>
            </div>
          </div>

          <div className="zg-gran-grid">
            {GRANIZADOS.map((g) => (
              <article className="zg-gran-card" key={g.name}>
                <div className="zg-gran-img"><img src={g.img} alt={g.name} /></div>
                <div className="zg-gran-body">
                  <div className="kicker">Granizado</div>
                  <h3>{g.name}</h3>
                  <p>{g.desc}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="zg-gran-badges">
            <span className="badge"><span className="dot" style={{ background: '#37D0DE' }} />Fruta 100% natural</span>
            <span className="badge"><span className="dot" style={{ background: '#FFD52E' }} />Hechos al momento</span>
            <span className="badge"><span className="dot" style={{ background: '#FFF9EC' }} />Sin sabores artificiales</span>
            <span className="badge"><span className="dot" style={{ background: '#E8503E' }} />Cítricos locales de Linares</span>
          </div>
        </div>
      </section>

      {/* ================= PROMO ================= */}
      <section id="promo" className="zg-promo" data-screen-label="Promoción">
        <div className="zg-promo-grid">
          <div>
            <span className="zg-kicker">Promoción de apertura</span>
            <h2>¿Pesaste tu trucha<br />o ya almorzaste?</h2>
            <p className="lead">Muestra tu tiquete de Restaurantes Don Efra y recibe <strong>{PROMO_PERCENT}% de descuento</strong> en tu postre helado. Un día de campo y pesca merece cerrarse bajo cero.</p>
            <div className="zg-promo-ctas">
              <a href="#visitanos" className="zg-btn zg-btn-dark">Cómo llegar</a>
              <a href="#premium" className="zg-btn zg-btn-outline-dark">Ver la carta</a>
            </div>
          </div>

          <div className="zg-ticket-wrap">
            <div className="zg-ticket">
              <div className="zg-ticket-top">
                <div className="script">Tiquete Don Efra</div>
                <div className="zg-ticket-badge">0°</div>
              </div>
              <div className="zg-ticket-dash" />
              <div className="zg-ticket-big">{PROMO_PERCENT}%</div>
              <div className="zg-ticket-sub">de descuento en tu postre helado</div>
              <div className="zg-ticket-dash" />
              <div className="zg-ticket-foot">
                <span>Presenta este tiquete en caja</span><span>Linares · Nariño</span>
              </div>
              <div className="zg-ticket-hole left" />
              <div className="zg-ticket-hole right" />
            </div>
            <img src="/assets/logo-helados.png" alt="Zero Grados" className="zg-ticket-logo" />
          </div>
        </div>
      </section>

      {/* ================= VISÍTANOS / FOOTER ================= */}
      <section id="visitanos" className="zg-visitanos" data-screen-label="Visítanos">
        <div className="zg-wrap">
          <div className="zg-visit-grid">
            <div>
              <div className="eyebrow">Tu pausa fresca está en</div>
              <h2>Linares<br /><span className="script">Nariño</span></h2>
              <p className="desc">Dentro de Restaurantes Don Efra, junto al lago de pesca deportiva. Abierto todos los días de 10:00 a 20:00.</p>
            </div>
            <div className="zg-visit-cards">
              <div className="zg-visit-card">
                <span className="label">Pesca deportiva</span>
                <span className="value">Todo el día</span>
              </div>
              <div className="zg-visit-card">
                <span className="label">Domicilios</span>
                <span className="value">WhatsApp</span>
              </div>
              <div className="zg-visit-card highlight">
                <span className="label">Coctelería glacial</span>
                <span className="value">+18 años</span>
              </div>
            </div>
          </div>

          <div className="zg-foot-row">
            <div className="script">Frescura que se disfruta, sabor que enamora</div>
            <div className="zg-foot-legal">
              <span>© Heladería Zero Grados</span><span>·</span>
              <span>Restaurantes Don Efra</span><span>·</span>
              <span>Linares, Nariño</span><span>·</span>
              <Link to="/login" style={{ color: 'rgba(255,249,236,.6)' }}>Ingresar al sistema</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}