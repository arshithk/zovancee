// Navigation interactive behavior

const navbar = document.querySelector('.navbar') || document.querySelector('.page-header');
const navToggle = document.querySelector('.nav-toggle') || document.querySelector('.mobile-toggle');
const navMenu = document.querySelector('.navbar-nav') || document.querySelector('.nav-links');
const navLinks = document.querySelectorAll('.nav-link, .nav-item');

// Scroll direction behavior
let lastScroll = 0;

const handleScroll = () => {
    if (!navbar) return;
    const currentScroll = window.scrollY;

    // Background logic
    if (currentScroll > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    // Hide/Show logic based on direction
    if (currentScroll > lastScroll && currentScroll > 200) {
        // Scrolling down & past threshold
        navbar.classList.add('hidden');
    } else {
        // Scrolling up
        navbar.classList.remove('hidden');
    }

    lastScroll = currentScroll;
};

// Mobile menu toggle
const toggleMenu = () => {
    if (navMenu) {
        navMenu.classList.toggle('active');
    }
};

// Initial check
if (navbar) {
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
}

// Event listeners
if (navToggle) {
    navToggle.addEventListener('click', toggleMenu);
}

// Close menu when a link is clicked
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (navMenu) {
            navMenu.classList.remove('active');
        }
    });
});
