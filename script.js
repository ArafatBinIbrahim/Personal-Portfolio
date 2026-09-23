const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d", { alpha: true });
const img = document.getElementById("sourcePhoto");

const cursorGlow = document.querySelector(".cursor-glow");
const progress = document.getElementById("scrollProgress");
const menuBtn = document.getElementById("menuBtn");
const navMenu = document.getElementById("navMenu");

let particles = [];
let animationId = null;
let resizeTimer = null;

const mouse = {
    x: -9999,
    y: -9999,
    active: false
};

/* Cursor glow */
document.addEventListener("mousemove", (event) => {
    cursorGlow.style.left = event.clientX + "px";
    cursorGlow.style.top = event.clientY + "px";
});

/* Mobile menu */
menuBtn.addEventListener("click", () => {
    const open = navMenu.classList.toggle("open");
    menuBtn.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
});

document.querySelectorAll("#navMenu a").forEach((link) => {
    link.addEventListener("click", () => {
        navMenu.classList.remove("open");
        menuBtn.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
    });
});

/* Scroll progress */
function updateProgress() {
    const scrollTop = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (total > 0 ? (scrollTop / total) * 100 : 0) + "%";
}
window.addEventListener("scroll", updateProgress, { passive: true });
updateProgress();

/* Scroll reveal */
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
        }
    });
}, { threshold: 0.08 });

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

/* Interactive skill cards */
document.querySelectorAll(".skill-map").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
        card.style.setProperty("--my", `${((event.clientY - rect.top) / rect.height) * 100}%`);
    });
    card.addEventListener("pointerleave", () => {
        card.style.removeProperty("--mx");
        card.style.removeProperty("--my");
    });
});

/* Project-grounded radar charts. Values represent how broadly each technology/capability
   appears in the documented project work, not self-rated proficiency. */
const radarValues = {
    ml: [4, 4, 4, 4, 3],
    backend: [4, 4, 4, 4, 3],
    frontend: [4, 2, 4, 2, 3],
    engineering: [4, 4, 3, 4, 3]
};

function drawRadar(canvas, animate = true) {
    const labels = (canvas.dataset.labels || "").split(",");
    const card = canvas.closest(".skill-map");
    const key = card?.dataset.skill || "engineering";
    const values = radarValues[key] || [3,3,3,3,3];
    const rect = canvas.getBoundingClientRect();
    const size = Math.max(240, Math.floor(rect.width));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const c = canvas.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0,0,size,size);

    const cx = size/2, cy = size/2 + 3;
    const radius = size * .31;
    const n = labels.length;
    const start = -Math.PI/2;
    const levels = 5;

    const point = (r,i) => {
        const a = start + (Math.PI*2*i/n);
        return [cx + Math.cos(a)*r, cy + Math.sin(a)*r];
    };
    const polygon = (r) => labels.map((_,i)=>point(r,i));

    c.lineWidth = 1;
    for(let level=1; level<=levels; level++){
        const pts = polygon(radius*level/levels);
        c.beginPath();
        pts.forEach((p,i)=> i ? c.lineTo(...p) : c.moveTo(...p));
        c.closePath();
        c.strokeStyle = level===levels ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.11)";
        c.stroke();
    }
    for(let i=0;i<n;i++){
        const [x,y]=point(radius,i);
        c.beginPath(); c.moveTo(cx,cy); c.lineTo(x,y);
        c.strokeStyle="rgba(255,255,255,.12)"; c.stroke();
    }

    const progress = animate ? Math.min(1, Math.max(0, parseFloat(canvas.dataset.progress || "0"))) : 1;
    const eased = 1 - Math.pow(1-progress,3);
    const pts = values.map((v,i)=>point(radius*(v/5)*eased,i));
    c.beginPath();
    pts.forEach((p,i)=> i ? c.lineTo(...p) : c.moveTo(...p));
    c.closePath();
    c.fillStyle="rgba(235,235,235,.13)";
    c.fill();
    c.strokeStyle="rgba(255,255,255,.88)";
    c.lineWidth=1.25; c.stroke();

    pts.forEach(([x,y])=>{
        c.beginPath(); c.arc(x,y,2.4,0,Math.PI*2);
        c.fillStyle="#eee"; c.fill();
    });

    c.textAlign="center"; c.textBaseline="middle";
    c.font = `${Math.max(8, size*.026)}px Inter, sans-serif`;
    labels.forEach((label,i)=>{
        const [x,y]=point(radius*1.23,i);
        const a = start + Math.PI*2*i/n;
        c.fillStyle="rgba(255,255,255,.45)";
        c.fillText(label, x, y);
    });
}

function animateRadars(){
    document.querySelectorAll("canvas.radar").forEach((canvas)=>{
        if (!canvas.dataset.started) canvas.dataset.progress="0";
    });
    let active = true;
    const start = performance.now();
    const duration = 1050;
    function frame(now){
        const p=Math.min(1,(now-start)/duration);
        document.querySelectorAll("canvas.radar").forEach(c=>{
            c.dataset.progress=String(p);
            drawRadar(c,true);
        });
        if(p<1) requestAnimationFrame(frame); else active=false;
    }
    if(active) requestAnimationFrame(frame);
}

const radarObserver = new IntersectionObserver((entries, observer)=>{
    entries.forEach(entry=>{
        if(!entry.isIntersecting) return;
        document.querySelectorAll("canvas.radar").forEach(c=>{
            if(!c.dataset.started){ c.dataset.started="1"; }
        });
        animateRadars();
        observer.disconnect();
    });
},{threshold:.18});
const skillSection=document.querySelector("#skills");
if(skillSection) radarObserver.observe(skillSection);

window.addEventListener("resize",()=>{
    document.querySelectorAll("canvas.radar").forEach(c=>drawRadar(c,false));
});

/* Active navigation */
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll("nav a");

const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        navLinks.forEach((link) => {
            link.classList.toggle(
                "active",
                link.getAttribute("href") === "#" + entry.target.id
            );
        });
    });
}, { rootMargin: "-38% 0px -52% 0px" });

sections.forEach((section) => navObserver.observe(section));

/*
    Interactive dotted portrait

    Important fix:
    The old version relied only on img.onload. If the image was already
    cached before the listener was attached, the canvas could remain blank.
    This version checks img.complete as well.
*/
function createParticles() {
    if (!img.naturalWidth || !img.naturalHeight) return;

    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const sampleCanvas = document.createElement("canvas");
    const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });

    sampleCanvas.width = width;
    sampleCanvas.height = height;

    /*
        object-cover style drawing:
        the whole portrait fills the square while keeping its aspect ratio.
    */
    const imageRatio = img.naturalWidth / img.naturalHeight;
    const boxRatio = width / height;

    let drawWidth;
    let drawHeight;
    let offsetX;
    let offsetY;

    if (imageRatio > boxRatio) {
        drawHeight = height;
        drawWidth = height * imageRatio;
        offsetX = (width - drawWidth) / 2;
        offsetY = 0;
    } else {
        drawWidth = width;
        drawHeight = width / imageRatio;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
    }

    sampleCtx.fillStyle = "#000";
    sampleCtx.fillRect(0, 0, width, height);
    sampleCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    const pixels = sampleCtx.getImageData(0, 0, width, height).data;

    particles = [];

    /*
        Smaller screens use fewer particles for smoother performance.
        Desktop gets a denser portrait.
    */
    let gap = 4;
    if (width < 520) gap = 5;
    if (width < 320) gap = 6;

    for (let y = 0; y < height; y += gap) {
        for (let x = 0; x < width; x += gap) {
            const index = (y * width + x) * 4;

            const r = pixels[index];
            const g = pixels[index + 1];
            const b = pixels[index + 2];

            const luminance = (0.299 * r) + (0.587 * g) + (0.114 * b);

            /*
                On the black background, darker pixels become brighter dots.
                This creates the high-contrast dotted portrait style.
            */
            const darkness = 1 - (luminance / 255);

            if (darkness > 0.08) {
                const alpha = Math.min(1, 0.18 + darkness * 1.05);
                const size = 0.55 + darkness * (width < 520 ? 1.25 : 1.55);

                particles.push({
                    x,
                    y,
                    baseX: x,
                    baseY: y,
                    size,
                    alpha,
                    vx: 0,
                    vy: 0
                });
            }
        }
    }
}

function drawParticles() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    ctx.clearRect(0, 0, width, height);

    for (const p of particles) {
        if (mouse.active) {
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const distance = Math.sqrt((dx * dx) + (dy * dy));

            if (distance < 90) {
                const safeDistance = distance || 1;
                const force = (90 - distance) / 90;
                p.vx -= (dx / safeDistance) * force * 4.2;
                p.vy -= (dy / safeDistance) * force * 4.2;
            }
        }

        p.vx *= 0.88;
        p.vy *= 0.88;

        p.x += p.vx;
        p.y += p.vy;

        p.x += (p.baseX - p.x) * 0.055;
        p.y += (p.baseY - p.y) * 0.055;

        ctx.fillStyle = `rgba(245,245,245,${p.alpha})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    }

    animationId = requestAnimationFrame(drawParticles);
}

canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
    mouse.active = true;
});

canvas.addEventListener("mouseleave", () => {
    mouse.x = -9999;
    mouse.y = -9999;
    mouse.active = false;
});

/* Touch devices: don't run mouse interaction, but keep portrait visible. */
canvas.addEventListener("touchstart", () => {
    mouse.active = false;
}, { passive: true });

function initializePortrait() {
    createParticles();

    if (!animationId) {
        drawParticles();
    }
}

/*
    Handles both fresh loading and cached images.
*/
if (img.complete && img.naturalWidth > 0) {
    initializePortrait();
} else {
    img.addEventListener("load", initializePortrait, { once: true });
    img.addEventListener("error", () => {
        console.error("Could not load assets/profile.jpg. Add your original profile photo at assets/profile.jpg.");
        const wrap = document.querySelector(".particle-photo");
        if (wrap) wrap.classList.add("photo-missing");
    }, { once: true });
}

window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        createParticles();
    }, 180);
});

/* Rebuild if the browser restores the page from cache. */
window.addEventListener("pageshow", () => {
    if (img.complete && img.naturalWidth > 0) {
        createParticles();
    }
});
