// Navigation interactive behavior

const navbar = document.querySelector('.navbar');
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.navbar-nav');
const navLinks = document.querySelectorAll('.nav-link');

// Scroll direction behavior
let lastScroll = 0;

const handleScroll = () => {
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
    navMenu.classList.toggle('active');
};

// Initial check
handleScroll();

// Event listeners
window.addEventListener('scroll', handleScroll);
navToggle.addEventListener('click', toggleMenu);

// Close menu when a link is clicked
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});
