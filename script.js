// ============================================================
// 1) THEME TOGGLE (Dark / Light)
// ============================================================
const themeToggleBtn = document.getElementById('theme-toggle');
const body = document.body;

// Restore saved theme on load
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.classList.add('dark-theme');
    themeToggleBtn.textContent = '☀️';
}

themeToggleBtn.addEventListener('click', () => {
    body.classList.toggle('dark-theme');
    const isDark = body.classList.contains('dark-theme');
    themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});


// ============================================================
// 2) SCROLL REVEAL (fade-in via IntersectionObserver)
// ============================================================
const animatedElements = document.querySelectorAll('.card, .section-head, #summary p');
animatedElements.forEach(el => el.classList.add('fade-in'));

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Once revealed, stop observing — no need to re-run
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });

animatedElements.forEach(el => observer.observe(el));


// ============================================================
// 3) ACTIVE NAV LINK + BACK-TO-TOP
//    Both depend on scroll position, so we share one handler
//    and throttle it with requestAnimationFrame for performance.
// ============================================================
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');
const backToTop = document.getElementById('back-to-top');

let ticking = false;

function onScroll() {
    const scrollY = window.scrollY;

    // -- Active nav link --
    let currentSectionId = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 120;
        if (scrollY >= sectionTop) {
            currentSectionId = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${currentSectionId}`);
    });

    // -- Back-to-top visibility --
    backToTop.classList.toggle('show', scrollY > 600);

    ticking = false;
}

// requestAnimationFrame throttle: run onScroll at most once per frame
window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
    }
});

// Smooth scroll to top when button is clicked
backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});
