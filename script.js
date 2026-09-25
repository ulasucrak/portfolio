// ============================================================
// ULAŞ UÇRAK — PORTFOLIO SCRIPTS
// ============================================================
const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(pointer: fine)');


// ============================================================
// 1) THEME TOGGLE (light default, remembers choice)
// ============================================================
const themeBtn = document.getElementById('theme-toggle');
const themeMeta = document.querySelector('meta[name="theme-color"]');

function applyTheme(theme) {
    if (theme === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    const isDark = theme === 'dark';
    themeBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    if (themeMeta) themeMeta.setAttribute('content', isDark ? '#0B1120' : '#F8FAFC');
}

applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

themeBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
});


// ============================================================
// 2) SCROLL REVEAL with a small stagger per group
// ============================================================
const revealEls = document.querySelectorAll('.reveal');

revealEls.forEach(el => {
    const siblings = Array.from(el.parentElement.children).filter(c => c.classList.contains('reveal'));
    const index = siblings.indexOf(el);
    el.style.setProperty('--d', `${Math.min(index, 6) * 60}ms`);
});

if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => revealObserver.observe(el));
} else {
    revealEls.forEach(el => el.classList.add('visible'));
}


// ============================================================
// 3) ACTIVE NAV LINK + BACK-TO-TOP (one rAF-throttled handler)
// ============================================================
const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('.nav-links a');
const backToTop = document.getElementById('back-to-top');
let scrollTicking = false;

function onScroll() {
    const y = window.scrollY;
    let current = '';
    sections.forEach(section => {
        if (y >= section.offsetTop - 140) current = section.id;
    });
    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
    backToTop.classList.toggle('show', y > 600);
    scrollTicking = false;
}

window.addEventListener('scroll', () => {
    if (!scrollTicking) {
        window.requestAnimationFrame(onScroll);
        scrollTicking = true;
    }
}, { passive: true });

backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
});

onScroll();


// ============================================================
// 4) CHARACTER — blinking, eye/head tracking, waving
// ============================================================
function createCharacter(svg) {
    const head = svg.querySelector('.ch-head');
    const pupils = svg.querySelectorAll('.ch-pupil');
    let waveTimer = null;
    let blinkTimer = null;

    function blink() {
        svg.classList.remove('is-blinking');
        void svg.getBoundingClientRect(); // restart animation
        svg.classList.add('is-blinking');
        setTimeout(() => svg.classList.remove('is-blinking'), 200);
    }

    function scheduleBlink() {
        blinkTimer = setTimeout(() => {
            if (!document.hidden) {
                blink();
                // occasional double blink
                if (Math.random() < 0.25) setTimeout(blink, 260);
            }
            scheduleBlink();
        }, 2600 + Math.random() * 3600);
    }

    function wave() {
        if (reduceMotion.matches) {
            svg.classList.add('is-happy');
            clearTimeout(waveTimer);
            waveTimer = setTimeout(() => svg.classList.remove('is-happy'), 1800);
            return;
        }
        svg.classList.remove('is-waving');
        void svg.getBoundingClientRect();
        svg.classList.add('is-waving', 'is-happy');
        clearTimeout(waveTimer);
        waveTimer = setTimeout(() => svg.classList.remove('is-waving', 'is-happy'), 1850);
    }

    function lookAt(clientX, clientY) {
        const box = svg.getBoundingClientRect();
        if (!box.width) return;
        // eyes sit at ~ (120, 112) in a 260×280 viewBox
        const ex = box.left + box.width * (120 / 260);
        const ey = box.top + box.height * (112 / 280);
        const dx = clientX - ex;
        const dy = clientY - ey;
        const dist = Math.hypot(dx, dy) || 1;
        const reach = Math.min(dist / 220, 1);
        const px = (dx / dist) * 2.6 * reach;
        const py = (dy / dist) * 1.8 * reach;
        pupils.forEach(p => { p.style.transform = `translate(${px}px, ${py}px)`; });
        const tilt = Math.max(-5, Math.min(5, dx / 90));
        const shiftY = Math.max(-2, Math.min(3, dy / 160));
        head.style.transform = `rotate(${tilt}deg) translateY(${shiftY}px)`;
    }

    function reset() {
        pupils.forEach(p => { p.style.transform = ''; });
        head.style.transform = '';
    }

    if (!reduceMotion.matches) scheduleBlink();

    return { wave, lookAt, reset, blink };
}

const heroStage = document.getElementById('hero-stage');
const heroSvg = heroStage.querySelector('.character');
const hero = createCharacter(heroSvg);

// Second copy of the character in the contact section
const contactStage = document.getElementById('contact-stage');
const contactSvg = heroSvg.cloneNode(true);
contactSvg.removeAttribute('role');
contactSvg.removeAttribute('aria-label');
contactSvg.setAttribute('aria-hidden', 'true');
contactSvg.setAttribute('focusable', 'false');
contactStage.appendChild(contactSvg);
const contactChar = createCharacter(contactSvg);

// Eyes follow the pointer (mouse / pen only, not on touch screens)
let pointer = null;
let pointerTicking = false;

function trackPointer() {
    if (pointer) {
        hero.lookAt(pointer.x, pointer.y);
        contactChar.lookAt(pointer.x, pointer.y);
    }
    pointerTicking = false;
}

if (finePointer.matches && !reduceMotion.matches) {
    window.addEventListener('pointermove', e => {
        pointer = { x: e.clientX, y: e.clientY };
        if (!pointerTicking) {
            window.requestAnimationFrame(trackPointer);
            pointerTicking = true;
        }
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
        pointer = null;
        hero.reset();
        contactChar.reset();
    });
}

// Wave hello after the page loads, and whenever the stage is hovered / tapped
setTimeout(hero.wave, 700);

let lastHoverWave = 0;
heroStage.addEventListener('pointerenter', () => {
    const now = Date.now();
    if (now - lastHoverWave > 2500) {
        lastHoverWave = now;
        hero.wave();
    }
});
heroStage.addEventListener('click', () => {
    hero.wave();
    showMessage('Nice to meet you!');
});

// Contact character waves when the section scrolls into view
if ('IntersectionObserver' in window) {
    const contactObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) setTimeout(contactChar.wave, 250);
        });
    }, { threshold: 0.5 });
    contactObserver.observe(contactStage);
}
contactStage.addEventListener('pointerenter', () => contactChar.wave());


// ============================================================
// 5) SPEECH BUBBLE — typewriter through a few facts
// ============================================================
const bubbleText = heroStage.querySelector('.bubble-text');
const messages = [
    'Hi there!',
    'I write C++ & Qt.',
    'Embedded C on STM32.',
    'CanSat 2025: 4th!',
    'Hackathon winner.',
    'Let\'s build together.'
];
let msgIndex = 0;
let typingTimer = null;

function typeMessage(text, done) {
    clearTimeout(typingTimer);
    if (reduceMotion.matches) {
        bubbleText.textContent = text;
        typingTimer = setTimeout(done, 3200);
        return;
    }
    let i = bubbleText.textContent.length;
    // delete current text, then type the new one
    const erase = () => {
        if (i > 0) {
            bubbleText.textContent = bubbleText.textContent.slice(0, --i);
            typingTimer = setTimeout(erase, 22);
        } else {
            type(0);
        }
    };
    const type = j => {
        if (j <= text.length) {
            bubbleText.textContent = text.slice(0, j);
            typingTimer = setTimeout(() => type(j + 1), 48);
        } else {
            typingTimer = setTimeout(done, 2300);
        }
    };
    erase();
}

function nextMessage() {
    msgIndex = (msgIndex + 1) % messages.length;
    typeMessage(messages[msgIndex], nextMessage);
}

function showMessage(text) {
    typeMessage(text, nextMessage);
}

typingTimer = setTimeout(nextMessage, 2600);
