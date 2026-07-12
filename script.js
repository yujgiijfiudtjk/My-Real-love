/* =========================================================
   💌 For You, My Love — Interactions
   পারফরম্যান্স-প্রথম, স্মুথ অ্যানিমেশন, মোবাইল-ফ্রেন্ডলি
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* -------- 0. Device / capability detection -------- */
  // Low-power hint: coarse pointer (touch), small screen, or reduced motion
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const isSmallScreen   = window.matchMedia('(max-width: 768px)').matches;
  const prefersReduced  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowCoreCount    = (navigator.hardwareConcurrency || 4) <= 4;
  const isLowPower      = prefersReduced || (isCoarsePointer && isSmallScreen && lowCoreCount);

  if (isLowPower) {
    document.body.classList.add('low-power');
  }

  /* -------- 1. Floating petals -------- */
  const petalsContainer = document.getElementById('petals');
  // মোবাইলে পাপড়ির সংখ্যা কমাই — GPU কম চাপ
  const PETAL_COUNT = isLowPower ? 0 : (isSmallScreen ? 10 : 18);

  for (let i = 0; i < PETAL_COUNT; i++) {
    const petal = document.createElement('span');
    petal.className = 'petal';
    petal.style.left = Math.random() * 100 + 'vw';
    petal.style.animationDuration = (8 + Math.random() * 10) + 's';
    petal.style.animationDelay = (Math.random() * 12) + 's';
    petal.style.opacity = (0.4 + Math.random() * 0.5).toFixed(2);
    const scale = (0.6 + Math.random() * 1.2).toFixed(2);
    // rotate সহ scale — একই transform-এ, GPU-friendly
    petal.style.setProperty('--petal-scale', scale);
    petalsContainer.appendChild(petal);
  }

  /* -------- 2. Music toggle (declared first so envelope can reuse) -------- */
  const musicBtn = document.getElementById('musicBtn');
  const bgMusic = document.getElementById('bgMusic');
  bgMusic.volume = 0.4;

  musicBtn.addEventListener('click', () => {
    if (bgMusic.paused) {
      bgMusic.play().then(() => {
        musicBtn.classList.add('playing');
        musicBtn.innerHTML = '<span class="music-icon">♪</span>';
      }).catch(() => {
        alert('প্রিয় গানটা যোগ করো: assets/music.mp3 💕');
      });
    } else {
      bgMusic.pause();
      musicBtn.classList.remove('playing');
      musicBtn.innerHTML = '<span class="music-icon">♪</span>';
    }
  });

  /* -------- 3. Envelope open -------- */
  const envelope = document.getElementById('envelope');
  const letterSection = document.getElementById('letterSection');

  envelope.addEventListener('click', () => {
    if (envelope.classList.contains('open')) return;
    envelope.classList.add('open');

    // চিঠি খোলার সাথে সাথে গান বাজাও 🎵
    if (bgMusic.paused) {
      bgMusic.play().then(() => {
        musicBtn.classList.add('playing');
        musicBtn.innerHTML = '<span class="music-icon">♪</span>';
      }).catch(() => {});
    }
    // Scroll to letter after animation
    setTimeout(() => {
      letterSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 1600);
  });

  /* -------- 4. Flip cards -------- */
  const flipCards = document.querySelectorAll('.flip-card');
  flipCards.forEach(card => {
    card.addEventListener('click', () => card.classList.toggle('flipped'));
  });

  /* -------- 5. Scroll fade-in -------- */
  const fadeSections = document.querySelectorAll('.fade-section');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // একবার visible হলে observing বন্ধ — কম কাজ
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  fadeSections.forEach(section => observer.observe(section));

  /* -------- 6. Polaroid subtle 3D tilt on mousemove
     (শুধু desktop / non-touch, GPU-only transform, RAF-throttled) -------- */
  const polaroids = document.querySelectorAll('.polaroid');

  if (!isCoarsePointer && !isLowPower) {
    polaroids.forEach(p => {
      const originalRotate = (getComputedStyle(p).getPropertyValue('--r') || '0deg').trim();
      let rafId = null;
      let pendingEvent = null;

      const applyTilt = () => {
        rafId = null;
        if (!pendingEvent) return;
        const rect = p.getBoundingClientRect();
        const x = pendingEvent.clientX - rect.left;
        const y = pendingEvent.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        // Max ±6deg — subtle
        const rotY = ((x - cx) / cx) * 6;
        const rotX = -((y - cy) / cy) * 6;
        p.style.transform =
          `translate3d(0,-6px,0) rotate(0deg) scale(1.08) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
        pendingEvent = null;
      };

      p.addEventListener('mouseenter', () => {
        p.style.transition = 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease';
      });

      p.addEventListener('mousemove', (e) => {
        pendingEvent = e;
        if (rafId === null) rafId = requestAnimationFrame(applyTilt);
      });

      p.addEventListener('mouseleave', () => {
        if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
        pendingEvent = null;
        // ফিরে যাওয়ার জন্য spring-ish curve
        p.style.transition = 'transform 0.55s cubic-bezier(0.34, 1.4, 0.64, 1), box-shadow 0.4s ease';
        p.style.transform = `rotate(${originalRotate}) scale(1)`;
      });
    });
  }

  /* -------- 7. Music button tap ripple (subtle, one-time DOM) -------- */
  // GPU-only: শুধু transform + opacity ব্যবহার করি
  musicBtn.addEventListener('pointerdown', (e) => {
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position:absolute;left:50%;top:50%;width:100%;height:100%;
      border-radius:50%;background:rgba(255,255,255,0.35);
      transform:translate(-50%,-50%) scale(0);opacity:1;
      pointer-events:none;
      transition:transform 0.55s cubic-bezier(0.22,1,0.36,1), opacity 0.55s ease;
      will-change:transform,opacity;
    `;
    musicBtn.style.overflow = 'hidden';
    musicBtn.appendChild(ripple);
    requestAnimationFrame(() => {
      ripple.style.transform = 'translate(-50%,-50%) scale(1.6)';
      ripple.style.opacity = '0';
    });
    setTimeout(() => ripple.remove(), 600);
  });

  /* -------- 8. Console love message 💝 -------- */
  console.log('%c💌 তোমার জন্য, ভালোবাসা দিয়ে তৈরি।', 'color:#b76e79; font-size:16px; font-family:cursive;');
});
