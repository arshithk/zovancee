const revealElements = document.querySelectorAll('.reveal');

const revealCallback = (entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
        }
    });
};

const revealOptions = {
    root: null,
    rootMargin: '0px 0px 150px 0px',
    threshold: 0,
};

const revealObserver = new IntersectionObserver(revealCallback, revealOptions);

revealElements.forEach(el => {
    revealObserver.observe(el);
});

// Interactive Split-Pane Showcase Logic
const showcaseItems = document.querySelectorAll('.showcase-item');
const showcaseGraphics = document.querySelectorAll('.showcase-graphic');

showcaseItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
        // Remove active class from all items and graphics
        showcaseItems.forEach(i => i.classList.remove('active'));
        showcaseGraphics.forEach(g => g.classList.remove('active'));

        // Add active class to hovered item
        item.classList.add('active');

        // Find corresponding graphic and activate it
        const targetId = item.getAttribute('data-target');
        const targetGraphic = document.getElementById(targetId);
        if (targetGraphic) {
            targetGraphic.classList.add('active');
        }
    });
});
