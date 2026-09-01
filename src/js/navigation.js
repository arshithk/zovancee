// Navigation interactive behavior

document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector('.navbar');
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.navbar-nav');

    // Scroll behavior
    const handleScroll = () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
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
});
