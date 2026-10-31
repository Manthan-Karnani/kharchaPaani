import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ArrowUpRight, Check, Coffee, Pause, Play, ShoppingBag, Sparkles, Wallet } from 'lucide-react';
import { Brand } from './Shared';

export default function AuthStory() {
  const story = useRef(null);
  const controls = useRef(null);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [motionAvailable, setMotionAvailable] = useState(false);

  useLayoutEffect(() => {
    if (!window.matchMedia) return;
    const media = gsap.matchMedia();
    media.add({
      motion: '(prefers-reduced-motion: no-preference)',
      desktop: '(min-width: 761px)',
      pointer: '(hover: hover) and (pointer: fine)',
    }, (context) => {
      const { motion, desktop, pointer } = context.conditions;
      setMotionAvailable(motion);
      if (!motion) return;
      const element = story.current;
      const select = gsap.utils.selector(element);
      const intro = gsap.timeline({ defaults: { duration: 0.8, ease: 'power3.out' } });
      intro
        .from(select('.brand'), { y: -12, opacity: 0 }, 0)
        .from(select('.story-heading-line'), { yPercent: 105, opacity: 0, stagger: 0.13, duration: 1 }, 0.24)
        .from(select('.story-description'), { y: 16, opacity: 0 }, 0.5);

      // Responsive scaling stays on the outer illustration. Entrance, parallax,
      // and floating motion each own a separate element to avoid transform clashes.
      let floating;
      let orbit;
      let moneyLoop;
      const parallax = [];
      intro.from(select('.illustration-enter'), { y: 28, scale: 0.9, opacity: 0, duration: 1.1 }, 0.4);

      floating = gsap.timeline({ repeat: -1, yoyo: true, delay: 1.35, defaults: { ease: 'sine.inOut' } })
        .to(select('.front-card'), { y: -16, rotation: -1, duration: 2.8 }, 0)
        .to(select('.back-card'), { y: 10, rotation: 8, duration: 3.2 }, 0)
        .to(select('.little-note'), { y: -5, duration: 2.8 }, 0)
        .to(select('.story-spark'), { y: -22, opacity: 1, scale: 1.6, duration: 2.4, stagger: 0.14 }, 0)
        .to(select('.money-halo'), { scale: 1.12, opacity: 0.9, duration: 3.2 }, 0)
        .to(select('.motion-status-dot'), { opacity: 0.35, scale: 0.7, duration: 1.4 }, 0);
      orbit = gsap.timeline({ repeat: -1 })
        .to(select('.orbit-one'), { rotation: -360, duration: 24, ease: 'none' }, 0)
        .to(select('.orbit-two'), { rotation: 540, duration: 24, ease: 'none' }, 0)
        .to(select('.money-flow-trail'), { strokeDashoffset: -240, duration: 24, ease: 'none' }, 0);

      // A complete 12-second story, including its reset, repeats indefinitely.
      // Every target is decorative and uses fixed example amounts, not account data.
      const figures = select('.demo-figure, .story-phase');
      const rows = select('.demo-ledger-row');
      const receipts = select('.demo-receipt');
      const coins = select('.story-coin');
      const bars = select('.savings-bars i');
      const progress = select('.illustration-progress span');
      moneyLoop = gsap.timeline({ id: 'auth-money-loop', repeat: -1, defaults: { duration: 0.5, ease: 'power2.inOut' } })
        .set([...figures, ...rows, ...receipts, ...coins], { autoAlpha: 0 }, 0)
        .set(select('.balance-start, .spent-start, .saved-start, .phase-plan'), { autoAlpha: 1 }, 0)
        .set(rows, { x: -10 }, 0)
        .set(progress, { scaleX: 0 }, 0)
        .set(bars, { scaleY: 0.15 }, 0)
        .set(select('.money-step'), { opacity: 0.35 }, 0)
        .set(select('.step-plan'), { opacity: 1 }, 0)
        .set(select('.savings-burst'), { autoAlpha: 0, scale: 0.7 }, 0)
        .fromTo(select('.receipt-coffee'), { x: 65, y: -30, rotation: 10, scale: 0.75 }, { x: 0, y: 0, rotation: 0, scale: 1, autoAlpha: 1, immediateRender: false, ease: 'back.out(1.5)' }, 1)
        .to(select('.phase-plan'), { autoAlpha: 0, duration: 0.2 }, 1.2)
        .to(select('.phase-track'), { autoAlpha: 1 }, 1.4)
        .to(select('.step-plan'), { opacity: 0.35 }, 1.4)
        .to(select('.step-track'), { opacity: 1 }, 1.4)
        .to(select('.receipt-coffee'), { x: -90, y: 40, scale: 0.75, autoAlpha: 0 }, 1.8)
        .to(select('.ledger-coffee'), { autoAlpha: 1, x: 0 }, 2)
        .to(select('.balance-start, .spent-start'), { autoAlpha: 0, duration: 0.2 }, 2)
        .to(select('.balance-coffee, .spent-coffee'), { autoAlpha: 1 }, 2.2)
        .to(progress, { scaleX: 0.09, duration: 0.8 }, 2)
        .fromTo(select('.receipt-groceries'), { x: 65, y: -30, rotation: -10, scale: 0.75 }, { x: 0, y: 0, rotation: 0, scale: 1, autoAlpha: 1, immediateRender: false, ease: 'back.out(1.5)' }, 3.2)
        .to(select('.receipt-groceries'), { x: -90, y: 70, scale: 0.75, autoAlpha: 0 }, 4)
        .to(select('.ledger-groceries'), { autoAlpha: 1, x: 0 }, 4.2)
        .to(select('.balance-coffee, .spent-coffee'), { autoAlpha: 0, duration: 0.2 }, 4.2)
        .to(select('.balance-final, .spent-final'), { autoAlpha: 1 }, 4.4)
        .to(progress, { scaleX: 0.24, duration: 0.8 }, 4.2)
        .to(select('.phase-track'), { autoAlpha: 0, duration: 0.2 }, 5.8)
        .to(select('.phase-save'), { autoAlpha: 1 }, 6)
        .to(select('.step-track'), { opacity: 0.35 }, 6)
        .to(select('.step-save'), { opacity: 1 }, 6)
        .fromTo(coins, { x: -35, y: -30, rotation: 0, scale: 0.6 }, { x: 0, y: 0, scale: 1, autoAlpha: 1, stagger: 0.16, immediateRender: false }, 6)
        .to(coins, { x: 70, y: 30, rotation: 90, duration: 0.8, stagger: 0.16 }, 6.7)
        .to(coins, { x: 125, y: 175, rotation: 180, scale: 0.3, autoAlpha: 0, duration: 0.7, stagger: 0.16 }, 7.5)
        .to(bars, { scaleY: 1, stagger: 0.14, duration: 0.8 }, 7.1)
        .to(select('.saved-start'), { autoAlpha: 0, duration: 0.2 }, 7.9)
        .to(select('.saved-final'), { autoAlpha: 1 }, 8.1)
        .fromTo(select('.savings-check'), { scale: 0.6 }, { scale: 1, duration: 0.65, ease: 'back.out(2)', immediateRender: false }, 8.2)
        .to(select('.savings-burst'), { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' }, 8.1)
        .to(select('.savings-burst'), { autoAlpha: 0, y: -18, duration: 0.6 }, 9.7)
        // Return to the opening frame while the floating elements keep moving.
        .to([...rows, ...figures], { autoAlpha: 0, duration: 0.4 }, 10.5)
        .to(progress, { scaleX: 0, duration: 0.8 }, 10.6)
        .to(bars, { scaleY: 0.15, duration: 0.8 }, 10.6)
        .to(select('.balance-start, .spent-start, .saved-start, .phase-plan'), { autoAlpha: 1 }, 11.1)
        .set(rows, { x: -10 }, 11.5)
        .set(select('.savings-burst'), { y: 0 }, 11.5)
        .to({}, { duration: 0.4 }, 11.6);

      if (desktop && pointer) {
        const scene = select('.illustration-scene')[0];
        for (const property of ['x', 'y', 'rotationX', 'rotationY']) {
          parallax.push(gsap.quickTo(scene, property, { duration: 0.75, ease: 'power3.out' }));
        }
      }

      const reset = (immediate = false) => {
        parallax.forEach(update => {
          update(0);
          if (immediate) update.tween.progress(1).pause();
        });
      };
      const move = (event) => {
        if (!parallax.length || pausedRef.current || document.hidden || event.pointerType === 'touch') return;
        const bounds = element.getBoundingClientRect();
        const x = gsap.utils.clamp(-1, 1, (event.clientX - bounds.left) / bounds.width * 2 - 1);
        const y = gsap.utils.clamp(-1, 1, (event.clientY - bounds.top) / bounds.height * 2 - 1);
        parallax[0](x * 12);
        parallax[1](y * 8);
        parallax[2](-y * 5);
        parallax[3](x * 7);
      };
      const leave = () => reset();
      const syncPlayback = () => {
        const stop = pausedRef.current || document.hidden;
        intro.paused(stop);
        floating?.paused(stop);
        orbit?.paused(stop);
        moneyLoop?.paused(stop);
        if (stop) reset(true);
      };
      controls.current = {
        pause() {
          // Never leave the heading half-revealed when motion is paused.
          intro.progress(1);
          syncPlayback();
        },
      };
      if (pausedRef.current) intro.progress(1);
      syncPlayback();
      element.addEventListener('pointermove', move);
      element.addEventListener('pointerleave', leave);
      document.addEventListener('visibilitychange', syncPlayback);
      window.addEventListener('blur', leave);
      return () => {
        controls.current = null;
        element.removeEventListener('pointermove', move);
        element.removeEventListener('pointerleave', leave);
        document.removeEventListener('visibilitychange', syncPlayback);
        window.removeEventListener('blur', leave);
      };
    }, story);
    return () => media.revert();
  }, []);

  function toggleMotion() {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    controls.current?.pause();
  }

  return (
    <section ref={story} className="auth-story">
      <Brand />
      <div className="story-content">
        <h1 aria-label="Make room for what matters.">
          <span className="story-heading-clip"><span className="story-heading-line">Make room for</span></span>
          <span className="story-heading-clip"><span className="story-heading-line">what <em>matters.</em></span></span>
        </h1>
        <p className="story-description">Know where your money goes.<br />And where you want it to take you.</p>
        <div className="money-illustration money-demo" aria-hidden="true">
          <div className="illustration-enter"><div className="illustration-scene">
            <div className="money-halo" />
            <div className="money-motion-label"><span className="motion-status-dot" /> YOUR MONEY, IN MOTION <span className="motion-demo-label">DEMO</span></div>
            <svg className="money-flow" viewBox="0 0 440 425" fill="none"><path d="M12 255C75 330 123 345 205 243S342 63 422 137" /><path className="money-flow-trail" d="M12 255C75 330 123 345 205 243S342 63 422 137" /></svg>
            <div className="orbit orbit-one"><span className="orbit-token">₹</span><span className="orbit-dot" /></div>
            <div className="orbit orbit-two"><span className="orbit-token">₹</span><span className="orbit-dot" /></div>
            <span className="story-spark spark-one" /><span className="story-spark spark-two" />
            <span className="story-spark spark-three" /><span className="story-spark spark-four" />
            <span className="story-spark spark-five" />
            <div className="story-coin coin-one">₹</div><div className="story-coin coin-two">₹</div><div className="story-coin coin-three">₹</div>
            <div className="demo-receipt receipt-coffee"><span className="receipt-icon"><Coffee size={17} /></span><span>Coffee</span><strong>−₹180</strong></div>
            <div className="demo-receipt receipt-groceries"><span className="receipt-icon"><ShoppingBag size={17} /></span><span>Groceries</span><strong>−₹300</strong></div>
            <div className="illustration-card back-card savings-card">
              <span className="savings-burst"><Sparkles size={13} /> +₹500 saved!</span>
              <span className="mini-label"><ArrowUpRight size={13} /> A LITTLE SAVED</span>
              <div className="demo-number savings-number"><span className="demo-figure saved-start">₹0</span><span className="demo-figure saved-final is-final">₹500</span></div>
              <div className="savings-bars"><i /><i /><i /><i /><i /></div>
              <span className="savings-check"><Check size={10} /> For tomorrow</span>
            </div>
            <div className="illustration-card front-card">
              <div className="illustration-card-top">
                <span className="wallet-tile"><Wallet size={23} /></span><ArrowUpRight size={19} />
              </div>
              <span className="mini-label">LEFT IN YOUR BUDGET</span>
              <div className="demo-number budget-number"><span className="demo-figure balance-start">₹2,000</span><span className="demo-figure balance-coffee">₹1,820</span><span className="demo-figure balance-final is-final">₹1,520</span></div>
              <div className="demo-ledger">
                <div className="demo-ledger-row ledger-coffee"><Coffee size={13} /><span>Coffee</span><b>₹180</b><Check size={11} /></div>
                <div className="demo-ledger-row ledger-groceries"><ShoppingBag size={13} /><span>Groceries</span><b>₹300</b><Check size={11} /></div>
              </div>
              <div className="illustration-progress"><span /></div>
              <div className="illustration-foot"><span className="budget-total">of ₹2,000</span>
                <div className="demo-number spent-number"><span className="demo-figure spent-start">₹0 spent</span><span className="demo-figure spent-coffee">₹180 spent</span><span className="demo-figure spent-final is-final">₹480 spent</span></div>
              </div>
            </div>
            <div className="little-note"><Sparkles size={15} /><div className="story-phase-wrap"><span className="story-phase phase-plan">A plan for every rupee.</span><span className="story-phase phase-track">Little expenses. All accounted for.</span><span className="story-phase phase-save is-final">Make room for tomorrow.</span></div></div>
            <div className="money-steps"><span className="money-step step-plan"><b>01</b> Plan</span><i /><span className="money-step step-track"><b>02</b> Track</span><i /><span className="money-step step-save"><b>03</b> Save</span></div>
          </div></div>
        </div>
      </div>
      <div className="story-footer">
        {motionAvailable && <button type="button" className="story-motion-toggle" onClick={toggleMotion} aria-pressed={paused}>
          {paused ? <Play size={12} /> : <Pause size={12} />}
          <span>{paused ? 'Resume motion' : 'Pause motion'}</span>
        </button>}
      </div>
    </section>
  );
}
