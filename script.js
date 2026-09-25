// ============================================================
// ULAŞ UÇRAK — PORTFOLIO SCRIPTS
// ============================================================
const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
const hasIO = 'IntersectionObserver' in window;


// ============================================================
// 1) THEME — dark by default, remembers the visitor's choice
// ============================================================
const themeBtn = document.getElementById('theme-toggle');
const themeMeta = document.querySelector('meta[name="theme-color"]');

function applyTheme(theme) {
    if (theme === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
    themeBtn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    if (themeMeta) themeMeta.setAttribute('content', theme === 'light' ? '#FAFAFA' : '#09090B');
}

applyTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

themeBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
    try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
});


// ============================================================
// 2) SCROLL REVEAL (staggered within each group)
// ============================================================
const revealEls = document.querySelectorAll('.reveal');

revealEls.forEach(el => {
    const group = Array.from(el.parentElement.children).filter(c => c.classList.contains('reveal'));
    el.style.setProperty('--d', `${Math.min(group.indexOf(el), 6) * 70}ms`);
});

if (hasIO) {
    const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
} else {
    revealEls.forEach(el => el.classList.add('visible'));
}


// ============================================================
// 3) ACTIVE NAV LINK
// ============================================================
const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('.nav-links a');
let navTicking = false;

function updateNav() {
    const y = window.scrollY + window.innerHeight * 0.35;
    let current = '';
    sections.forEach(s => { if (y >= s.offsetTop) current = s.id; });
    // at the very bottom the last section can't reach the threshold
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = sections[sections.length - 1].id;
    }
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${current}`));
    if (typeof enterSection === 'function' && current) enterSection(document.getElementById(current));
    navTicking = false;
}

window.addEventListener('scroll', () => {
    if (!navTicking) {
        requestAnimationFrame(updateNav);
        navTicking = true;
    }
}, { passive: true });


// ============================================================
// 4) CHARACTER CONTROLLER
// ============================================================
function mountCharacter(container, prefix, label) {
    container.innerHTML = window.buildCharacter(prefix, label);
    const svg = container.querySelector('svg');
    const head = svg.querySelector('.ch-head');
    const pupils = svg.querySelectorAll('.ch-pupil');
    const timers = {};

    function flag(cls, ms, key) {
        svg.classList.remove(cls);
        void svg.getBoundingClientRect(); // restart CSS animation
        svg.classList.add(cls);
        clearTimeout(timers[key || cls]);
        timers[key || cls] = setTimeout(() => svg.classList.remove(cls), ms);
    }

    const api = {
        svg,
        blink() { flag('is-blinking', 200); },
        wave() {
            flag('is-waving', 2000);
            api.happy(2000);
        },
        jump() { flag('is-jumping', 650); },
        happy(ms = 1600) { flag('is-happy', ms); },
        talk(on) { svg.classList.toggle('is-talking', on); },
        setPose(pose) { svg.setAttribute('data-pose', pose); },
        lookAt(x, y) {
            const b = svg.getBoundingClientRect();
            if (!b.width || b.bottom < 0 || b.top > innerHeight) return;
            const ex = b.left + b.width * (150 / 310);
            const ey = b.top + b.height * (142 / 330);
            const dx = x - ex;
            const dy = y - ey;
            const d = Math.hypot(dx, dy) || 1;
            const k = Math.min(d / 240, 1);
            const px = (dx / d) * 3.2 * k;
            const py = (dy / d) * 2.2 * k;
            pupils.forEach(p => { p.style.transform = `translate(${px}px, ${py}px)`; });
            const tilt = Math.max(-6, Math.min(6, dx / 80));
            head.style.transform = `rotate(${tilt}deg) translateY(${Math.max(-2, Math.min(3, dy / 150))}px)`;
        },
        reset() {
            pupils.forEach(p => { p.style.transform = ''; });
            head.style.transform = '';
        }
    };

    if (!reduceMotion) {
        (function scheduleBlink() {
            setTimeout(() => {
                if (!document.hidden) {
                    api.blink();
                    if (Math.random() < 0.25) setTimeout(api.blink, 260);
                }
                scheduleBlink();
            }, 2400 + Math.random() * 3600);
        })();
    }
    return api;
}

// Typewriter speech bubble that moves the character's mouth while "talking"
function createBubble(bubbleEl, character) {
    const textEl = bubbleEl.querySelector('.bubble-text');
    let timer = null;
    let queueDone = null;

    function stop() {
        clearTimeout(timer);
        character.talk(false);
    }

    function say(text, { hold = 2600, then = null, clearAfter = false } = {}) {
        stop();
        queueDone = then;
        bubbleEl.classList.remove('is-empty');
        if (reduceMotion) {
            textEl.textContent = text;
            timer = setTimeout(finish, hold + 1000);
            return;
        }
        let i = 0;
        textEl.textContent = '';
        character.talk(true);
        const type = () => {
            textEl.textContent = text.slice(0, ++i);
            if (i < text.length) {
                timer = setTimeout(type, 42);
            } else {
                character.talk(false);
                timer = setTimeout(finish, hold);
            }
        };
        type();

        function finish() {
            if (clearAfter) hide();
            if (queueDone) queueDone();
        }
    }

    function hide() {
        stop();
        bubbleEl.classList.add('is-empty');
    }

    return { say, hide };
}


// ============================================================
// 5) HERO CHARACTER
// ============================================================
const heroStage = document.getElementById('hero-stage');
const hero = mountCharacter(heroStage.querySelector('[data-character]'), 'h',
    'Illustrated character of Ulaş waving');
const heroBubble = createBubble(heroStage.querySelector('.bubble'), hero);

const heroLines = [
    'I write C++ & Qt.',
    'Firmware on STM32 & ESP32.',
    'CanSat 2025: 4th worldwide.',
    'Hackathon winner.',
    'Scroll down, I\'ll come along!'
];
let heroLine = 0;

function heroLoop() {
    heroBubble.say(heroLines[heroLine], { hold: 2600, then: heroLoop });
    heroLine = (heroLine + 1) % heroLines.length;
}

setTimeout(() => {
    hero.wave();
    heroBubble.say('Hi, I\'m Ulaş!', { hold: 2200, then: heroLoop });
}, 500);

let lastHeroWave = 0;
heroStage.addEventListener('pointerenter', () => {
    if (Date.now() - lastHeroWave > 2600) {
        lastHeroWave = Date.now();
        hero.wave();
    }
});
heroStage.addEventListener('click', () => {
    hero.jump();
    hero.happy();
    heroBubble.say('Nice to meet you!', { hold: 1800, then: heroLoop });
});


// ============================================================
// 6) COMPANION — follows you and reacts to each section
// ============================================================
const buddyEl = document.getElementById('buddy');
const buddy = mountCharacter(buddyEl.querySelector('[data-character]'), 'b');
const buddyBubble = createBubble(buddyEl.querySelector('.bubble'), buddy);
buddyBubble.hide();

let buddyVisible = false;
let currentSection = null;
let waveLoop = null;

function enterSection(section) {
    if (reduceMotion || !section || !section.dataset.pose || section === currentSection) return;
    currentSection = section;
    const pose = section.dataset.pose || 'idle';
    buddy.setPose(pose);
    buddy.jump();
    if (pose === 'idle') buddy.happy(2200);

    clearInterval(waveLoop);
    if (pose === 'wave') {
        buddy.wave();
        waveLoop = setInterval(() => { if (!document.hidden) buddy.wave(); }, 4200);
    }
    if (buddyVisible && section.dataset.say) {
        buddyBubble.say(section.dataset.say, { hold: 3000, clearAfter: true });
    }
}

if (hasIO && !reduceMotion) {
    // Show the companion once the hero character scrolls away
    new IntersectionObserver(([entry]) => {
        buddyVisible = !entry.isIntersecting;
        buddyEl.classList.toggle('show', buddyVisible);
        if (!buddyVisible) buddyBubble.hide();
        else if (currentSection && currentSection.dataset.say) {
            buddyBubble.say(currentSection.dataset.say, { hold: 3000, clearAfter: true });
        }
    }, { threshold: 0.15 }).observe(heroStage);

}

const buddyQuips = ['Hey, that tickles!', 'Still here!', 'Need my CV? Top of the page.', 'Keep scrolling!'];
let quip = 0;
buddyEl.addEventListener('click', () => {
    buddy.jump();
    buddy.happy();
    buddyBubble.say(buddyQuips[quip++ % buddyQuips.length], { hold: 2000, clearAfter: true });
});


// ============================================================
// 7) EYES FOLLOW THE POINTER (mouse / pen only)
// ============================================================
if (finePointer && !reduceMotion) {
    let pointer = null;
    let ticking = false;
    window.addEventListener('pointermove', e => {
        pointer = { x: e.clientX, y: e.clientY };
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(() => {
                hero.lookAt(pointer.x, pointer.y);
                if (buddyVisible) buddy.lookAt(pointer.x, pointer.y);
                ticking = false;
            });
        }
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => {
        hero.reset();
        buddy.reset();
    });
}


// Initial state (after everything above is defined)
updateNav();
