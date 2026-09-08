import React, { useState, useEffect, useRef } from 'react';

export default function App() {
    // ==========================================================================
    // STATE HOOKS
    // ==========================================================================
    const [isOpen, setIsOpen] = useState(false);
    const [isEnvelopeOpened, setIsEnvelopeOpened] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isScratched, setIsScratched] = useState(false);
    
    // Countdown values
    const [timeLeft, setTimeLeft] = useState({
        days: '00',
        hours: '00',
        minutes: '00',
        seconds: '00',
        isExpired: false
    });

    // ==========================================================================
    // REF HOOKS
    // ==========================================================================
    const audioRef = useRef(null);
    const canvasRef = useRef(null);
    const scratchCanvasRef = useRef(null);

    // ==========================================================================
    // EFFECT: MANAGE BODY SCROLL LOCKING
    // ==========================================================================
    useEffect(() => {
        if (!isOpen) {
            document.body.classList.add("locked");
        } else {
            document.body.classList.remove("locked");
        }
        return () => {
            document.body.classList.remove("locked");
        };
    }, [isOpen]);

    // ==========================================================================
    // EFFECT: COUNTDOWN CALCULATIONS (DEC 6, 2026 at 6:00 PM IST)
    // ==========================================================================
    useEffect(() => {
        if (!isScratched) return; // Only start countdown ticking when scratched!

        const weddingTime = new Date("2026-12-06T18:00:00+05:30").getTime();

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = weddingTime - now;

            if (distance < 0) {
                clearInterval(timer);
                setTimeLeft({
                    days: '00',
                    hours: '00',
                    minutes: '00',
                    seconds: '00',
                    isExpired: true
                });
            } else {
                const d = Math.floor(distance / (1000 * 60 * 60 * 24));
                const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((distance % (1000 * 60)) / 1000);

                setTimeLeft({
                    days: String(d).padStart(2, '0'),
                    hours: String(h).padStart(2, '0'),
                    minutes: String(m).padStart(2, '0'),
                    seconds: String(s).padStart(2, '0'),
                    isExpired: false
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [isScratched]);

    // ==========================================================================
    // EFFECT: SCROLL REVEAL ANIMATIONS (INTERSECTION OBSERVER)
    // ==========================================================================
    useEffect(() => {
        if (!isOpen) return;

        // Brief timeout to ensure elements are rendered and visible in DOM
        const timeout = setTimeout(() => {
            const revealElements = document.querySelectorAll(".fade-in-up, .fade-in-left, .fade-in-right");
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("appear");
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.15,
                rootMargin: "0px 0px -50px 0px"
            });

            revealElements.forEach(el => observer.observe(el));
        }, 100);

        return () => clearTimeout(timeout);
    }, [isOpen]);

    // ==========================================================================
    // EFFECT: CANVAS FALLING PETALS ANIMATION
    // ==========================================================================
    useEffect(() => {
        if (!isOpen) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        
        let animationFrameId;
        let petals = [];
        const maxPetals = 45;
        
        const petalColors = [
            { r: 200, g: 58, b: 94, a: 0.85 },   // Primary Raspberry Pink
            { r: 224, g: 94, b: 124, a: 0.85 },   // Soft Rose Pink
            { r: 141, g: 155, b: 131, a: 0.85 },  // Primary Sage Green
            { r: 178, g: 190, b: 170, a: 0.85 }   // Pale Sage Green
        ];

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        class Petal {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * -canvas.height;
                this.size = Math.random() * 8 + 5;
                this.color = petalColors[Math.floor(Math.random() * petalColors.length)];
                this.speedY = Math.random() * 1.5 + 1; // Keep normal petals at normal speed
                this.speedX = Math.random() * 1 - 0.5;
                this.oscillationSpeed = Math.random() * 0.02 + 0.01;
                this.angle = Math.random() * 360;
                this.spinSpeed = Math.random() * 2 - 1;
                this.dead = false;
            }

            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate((this.angle * Math.PI) / 180);
                ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.color.a})`;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.bezierCurveTo(this.size / 2, -this.size / 2, this.size, -this.size / 4, this.size, 0);
                ctx.bezierCurveTo(this.size, this.size / 4, this.size / 2, this.size / 2, 0, 0);
                ctx.fill();
                ctx.restore();
            }

            update() {
                this.y += this.speedY;
                this.angle += this.spinSpeed;
                this.x += Math.sin(this.y * this.oscillationSpeed) * 0.5 + this.speedX;

                if (this.y > canvas.height + 20) {
                    this.y = -20;
                    this.x = Math.random() * canvas.width;
                    this.speedY = Math.random() * 1.5 + 1;
                }
            }
        }

        class Popper {
            constructor(origin) {
                // Launch slightly below bottom corners to hide visual spawn
                this.x = origin === 'left' ? 0 : canvas.width;
                this.y = canvas.height + 15;
                
                // Varied shape types: 0 = rectangle, 1 = circle, 2 = triangle
                this.shapeType = Math.floor(Math.random() * 3);
                
                // Random elegant sizes suitable for confetti ribbons
                this.width = Math.random() * 8 + 6;
                this.height = Math.random() * 12 + 8;
                this.size = Math.random() * 6 + 6; // for circle/triangle
                
                // Select from the same luxurious traditional color theme
                this.color = petalColors[Math.floor(Math.random() * petalColors.length)];
                
                // Physics setup: Shoot diagonally upwards and inwards
                const angleDeg = origin === 'left'
                    ? Math.random() * -50 - 20  // -20 to -70 deg
                    : Math.random() * -50 - 110; // -110 to -160 deg
                const angleRad = (angleDeg * Math.PI) / 180;
                
                // High initial velocity that decelerates due to air resistance (friction)
                const speed = Math.random() * 18 + 14; 
                this.vx = Math.cos(angleRad) * speed;
                this.vy = Math.sin(angleRad) * speed;
                
                this.gravity = 0.22;
                this.friction = 0.975;
                
                // 3D rotation and tumbling animations
                this.rotation = Math.random() * 360;
                this.rotationSpeed = Math.random() * 12 - 6;
                this.scaleX = 1;
                this.scaleXSpeed = Math.random() * 0.12 + 0.06;
                
                // Lifespan tuned precisely to 4-5 seconds (240 to 300 frames)
                this.maxLife = Math.random() * 60 + 240;
                this.life = this.maxLife;
                this.dead = false;
            }

            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate((this.rotation * Math.PI) / 180);
                ctx.scale(this.scaleX, 1); // 3D flipping action
                
                const opacity = this.life / this.maxLife;
                ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.color.a * opacity})`;
                ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.color.a * opacity * 0.5})`;
                ctx.lineWidth = 1;

                ctx.beginPath();
                if (this.shapeType === 0) {
                    // Rectangle Ribbon
                    ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height);
                } else if (this.shapeType === 1) {
                    // Circle
                    ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                } else {
                    // Triangle
                    ctx.moveTo(0, -this.size / 2);
                    ctx.lineTo(this.size / 2, this.size / 2);
                    ctx.lineTo(-this.size / 2, this.size / 2);
                    ctx.closePath();
                }
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }

            update() {
                // Apply drag (friction) and gravity
                this.vx *= this.friction;
                this.vy *= this.friction;
                this.vy += this.gravity;
                
                this.x += this.vx;
                this.y += this.vy;
                
                // Update 3D spin and flip
                this.rotation += this.rotationSpeed;
                this.scaleX = Math.sin(this.life * this.scaleXSpeed);
                
                // Age particle and mark dead when fully faded
                this.life--;
                if (this.life <= 0) {
                    this.dead = true;
                }
            }
        }

        // Ambient regular petals
        for (let i = 0; i < maxPetals; i++) {
            petals.push(new Petal());
        }

        // Trigger dynamic party poppers burst when solved
        if (isScratched) {
            for (let i = 0; i < 150; i++) {
                petals.push(new Popper('left'));
                petals.push(new Popper('right'));
            }
        }

        const renderLoop = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            petals = petals.filter(p => !p.dead);
            petals.forEach(petal => {
                petal.update();
                petal.draw();
            });
            animationFrameId = requestAnimationFrame(renderLoop);
        };

        renderLoop();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("resize", handleResize);
        };
    }, [isOpen, isScratched]);

    // ==========================================================================
    // EFFECT: SCRATCH CARD CANVAS INITIALIZATION & DRAG TO SCRATCH LOGIC
    // ==========================================================================
    useEffect(() => {
        if (!isOpen) return;
        if (isScratched) return;

        const canvas = scratchCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        // 1. Set canvas resolution to match container bounding size
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // 2. Draw a gorgeous premium scratch card front cover in Sage Green
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#5f6b57');    // Deeper Sage Green
        gradient.addColorStop(0.25, '#b8c5b0'); // Soft Light Sage Shimmer
        gradient.addColorStop(0.5, '#8D9B83');  // Primary Sage Green
        gradient.addColorStop(0.75, '#cdd9c5'); // Pale Sage Shimmer
        gradient.addColorStop(1, '#6e7c65');    // Rich Sage Green
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Overlay with a nice embossed rounded border in Raspberry Pink
        ctx.strokeStyle = 'rgba(200, 58, 94, 0.45)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(10, 10, canvas.width - 20, canvas.height - 20, 12);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(200, 58, 94, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(15, 15, canvas.width - 30, canvas.height - 30, 9);
        ctx.stroke();

        // Draw card cover typography in Raspberry Pink
        ctx.fillStyle = '#C83A5E'; // Vibrant Raspberry Pink
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.font = '400 38px Great Vibes, cursive';
        ctx.fillText('Scratch Here', canvas.width / 2, canvas.height / 2);

        // 3. Setup scratching event handlers
        let isDrawing = false;
        let scratchCount = 0;

        const getCoords = (e) => {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const canvasRect = canvas.getBoundingClientRect();
            return {
                x: clientX - canvasRect.left,
                y: clientY - canvasRect.top
            };
        };

        const scratchStart = (e) => {
            isDrawing = true;
            const coords = getCoords(e);
            ctx.beginPath();
            ctx.moveTo(coords.x, coords.y);
            if (e.cancelable) e.preventDefault();
        };

        const checkPercentage = () => {
            try {
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const pixels = imgData.data;
                let transparentCount = 0;

                const step = 20; // Sample every 20th pixel for rapid performance
                let sampleCount = 0;
                for (let i = 0; i < pixels.length; i += step * 4) {
                    sampleCount++;
                    if (pixels[i + 3] < 150) { // Alpha less than 150 counts as mostly scratched
                        transparentCount++;
                    }
                }

                const scratchedPercent = transparentCount / sampleCount;
                if (scratchedPercent > 0.30) { // Solve automatically at 30%!
                    isDrawing = false;
                    setIsScratched(true);
                }
            } catch (err) {
                console.error("Canvas read failed, using movement fallback.", err);
            }
        };

        const scratchMove = (e) => {
            if (!isDrawing) return;
            const coords = getCoords(e);
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = 40; // Rich, satisfying scratch stroke
            ctx.lineCap = 'round';
            ctx.lineTo(coords.x, coords.y);
            ctx.stroke();

            // Track movement counts
            scratchCount++;

            // Trigger solving if drag strokes exceed 60 segments (bulletproof fallback)
            if (scratchCount > 60) {
                isDrawing = false;
                setIsScratched(true);
            } else {
                checkPercentage();
            }

            if (e.cancelable) e.preventDefault();
        };

        const scratchEnd = () => {
            isDrawing = false;
        };

        // Bind mouse events
        canvas.addEventListener('mousedown', scratchStart);
        canvas.addEventListener('mousemove', scratchMove);
        canvas.addEventListener('mouseup', scratchEnd);
        canvas.addEventListener('mouseleave', scratchEnd);

        // Bind mobile touch events
        canvas.addEventListener('touchstart', scratchStart, { passive: false });
        canvas.addEventListener('touchmove', scratchMove, { passive: false });
        canvas.addEventListener('touchend', scratchEnd);

        return () => {
            canvas.removeEventListener('mousedown', scratchStart);
            canvas.removeEventListener('mousemove', scratchMove);
            canvas.removeEventListener('mouseup', scratchEnd);
            canvas.removeEventListener('mouseleave', scratchEnd);
            canvas.removeEventListener('touchstart', scratchStart);
            canvas.removeEventListener('touchmove', scratchMove);
            canvas.removeEventListener('touchend', scratchEnd);
        };
    }, [isOpen, isScratched]);

    // ==========================================================================
    // INTERACTION HANDLERS
    // ==========================================================================
    const handleOpenEnvelope = () => {
        setIsEnvelopeOpened(true);
        // Play audio player
        if (audioRef.current) {
            audioRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(err => {
                console.log("Audio autoplay blocked by browser sandbox.", err);
            });
        }
    };

    const toggleAudio = () => {
        if (!audioRef.current) return;
        if (audioRef.current.paused) {
            audioRef.current.play();
            setIsPlaying(true);
        } else {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    return (
        <>
            {/* Audio Node */}
            <audio ref={audioRef} loop>
                <source src="/assets/Rabba_Main_Toh_Mar_Gaya_Instrumental.mp3" type="audio/mpeg" />
            </audio>

            {/* Canvas overlay for falling petals */}
            <canvas id="petals-canvas" ref={canvasRef}></canvas>

            {/* Music Floating Disk */}
            <div 
                id="audio-control" 
                className={`audio-control ${isOpen ? '' : 'hidden'} ${isPlaying ? 'playing' : ''}`}
                onClick={toggleAudio}
            >
                <div className="music-disc">
                    <i className="fa-solid fa-music"></i>
                </div>
                <span className="tooltip">Toggle Music</span>
            </div>

            {/* 1. Envelope Splash Cover Screen */}
            <div id="envelope-splash" className={`envelope-splash ${isOpen ? 'opened' : ''}`}>
                <div className={`envelope-wrapper ${isEnvelopeOpened ? 'open' : ''}`}>
                    <div className="envelope">
                        <div className="flap top-flap"></div>
                        <div className="pocket"></div>
                        <div className="letter">
                            <div className="letter-content">
                                <div className="wedding-logo">
                                    <span className="letter-initial">S</span>
                                    <span className="ampersand">&amp;</span>
                                    <span className="letter-initial">M</span>
                                </div>
                                <h2 className="splash-heading">The Wedding Invitation</h2>
                                <div className="gold-divider"></div>
                                <p className="splash-couple-name">Srishti & Manjit</p>
                                <p className="splash-date">06 . 12 . 2026</p>
                                
                                {/* Enter Invitation button on the placard */}
                                <button className="enter-invitation-btn" onClick={() => setIsOpen(true)}>
                                    <span className="enter-invitation-btn-content">
                                        View Invitation <i className="fa-solid fa-envelope-open"></i>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Pulsing Seal button */}
                    <div id="wax-seal" className="wax-seal-btn" onClick={handleOpenEnvelope}>
                        <div className="seal-inner">
                            <i className="fa-solid fa-heart"></i>
                            <span>Open</span>
                        </div>
                    </div>
                    
                    <p className={`tap-hint ${isEnvelopeOpened ? 'fade-out' : ''}`}>Tap on the seal to open invitation</p>
                </div>
            </div>

            {/* 2. Main Wedding Website Content Container */}
            <div id="main-content" className={`main-content ${isOpen ? '' : 'hidden-lock'}`}>

                {/* Hero Headings Card - Rendered Directly on Background */}
                <header id="home" className="hero-section">
                    <img src="/assets/corner-decor.png" alt="Decorative Garlands" className="hero-corner-decor decor-left" />
                    <img src="/assets/corner-decor.png" alt="Decorative Garlands" className="hero-corner-decor decor-right" />
                    
                    <img src="/assets/diya.png" alt="Decorative Diya" className="hero-diya-decor diya-left" />
                    <img src="/assets/diya.png" alt="Decorative Diya" className="hero-diya-decor diya-right" />
                    
                    <div className="hero-content-transparent fade-in-up">
                        <div className="parent-host">
                            <span className="shree">|| শুভ পরিণয় ||</span>
                            <p className="hosting-text-new">
                                We cordially invite you to join us in celebrating the union of two hearts and witnessing the wedding ceremony of
                            </p>
                        </div>

                        <div className="hero-couple-new-stacked">
                            <h1 className="bride-name-stacked">Srishti</h1>
                            <p className="parentage-text-stacked">D/o Mrs. Sudeshna Sur<br />& Mr. Rupam Sur</p>
                            
                            <div className="weds-divider-stacked">
                                <span className="weds-cursive-stacked">weds</span>
                            </div>
                            
                            <h1 className="groom-name-stacked">Manjit</h1>
                            <p className="parentage-text-stacked">S/o Mrs. Golapi Bhowal<br />& Mr. Manash Bhowal</p>
                        </div>

                        {/* Interactive Scratch Card Section (Reveals only the date card!) */}
                        <div className="scratch-card-wrapper">
                            
                            {/* 1. Revealed Layer: Date Card */}
                            <div className="scratch-revealed-content">
                                <div className="wedding-invitation-details-new">
                                    <span className="save-date-tag">SAVE THE DATE</span>
                                    <p className="wedding-datetime-new-cursive">
                                        6th December 2026, Sunday
                                    </p>
                                </div>
                            </div>

                            {/* 2. Scratchable Overlay Canvas */}
                            <canvas 
                                ref={scratchCanvasRef} 
                                className={`scratch-canvas ${isScratched ? 'fade-out' : ''}`}
                            ></canvas>
                        </div>

                        {/* Live Countdown Timer - Placed BELOW the scratch card! */}
                        <div className={`countdown-container-stacked ${isScratched ? 'unlocked' : 'locked-countdown'}`}>
                            {timeLeft.isExpired ? (
                                <>
                                    <h4 className="countdown-title-new">The Wedding is Live!</h4>
                                    <p className="congrats-text">Congratulations Srishti & Manjit!</p>
                                </>
                            ) : (
                                <div className="countdown-grid-stacked">
                                    <div className="countdown-box-stacked">
                                        <span className="number-stacked-value">{timeLeft.days}</span>
                                        <span className="label-stacked-label">Days</span>
                                    </div>
                                    <div className="countdown-box-stacked">
                                        <span className="number-stacked-value">{timeLeft.hours}</span>
                                        <span className="label-stacked-label">Hours</span>
                                    </div>
                                    <div className="countdown-box-stacked">
                                        <span className="number-stacked-value">{timeLeft.minutes}</span>
                                        <span className="label-stacked-label">Minutes</span>
                                    </div>
                                    <div className="countdown-box-stacked">
                                        <span className="number-stacked-value">{timeLeft.seconds}</span>
                                        <span className="label-stacked-label">Seconds</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* 3. The Happy Couple Card Section */}
                <section id="couple" className="couple-section section-padding">
                    <h2 className="section-title">The Bride & Groom</h2>
                    <div className="section-subtitle-divider"></div>

                    <div className="couple-grid">
                        {/* Bride Bio card */}
                        <div className="couple-card bride-card fade-in-left">
                            <div className="card-inner">
                                <div className="caricature-wrapper">
                                    <img src="/assets/bride-real.jpg" alt="Srishti - The Bride" className="caricature-img" />
                                    <div className="caricature-frame"></div>
                                </div>
                                <div className="couple-info">
                                    <h3 className="person-name">Srishti</h3>
                                    <span className="person-role">The Gorgeous Bride</span>
                                    <p className="person-description">
                                        A graceful soul with a heart full of warmth, laughter, and love. With her radiant smile and gentle spirit, Srishti brings joy wherever she goes. She dreams of a life filled with love, togetherness, and countless little moments that become beautiful memories. Today, she begins her most cherished journey, hand in hand with the one who makes her heart happiest.
                                    </p>
                                </div>
                            </div>
                        </div>



                        {/* Groom Bio card */}
                        <div className="couple-card groom-card fade-in-right">
                            <div className="card-inner">
                                <div className="caricature-wrapper">
                                    <img src="/assets/manjit-real.jpg" alt="Manjit - The Groom" className="caricature-img" />
                                    <div className="caricature-frame"></div>
                                </div>
                                <div className="couple-info">
                                    <h3 className="person-name">Manjit</h3>
                                    <span className="person-role">The Handsome Groom</span>
                                    <p className="person-description">
                                        A kind-hearted soul with a warm smile and a spirit full of love and adventure. He believes in finding happiness in the little things and cherishing the people who make life meaningful. With a heart ready for a lifetime of laughter, companionship, and love, he steps into this beautiful new chapter with his perfect partner by his side.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Big center full couple illustration banner */}
                    <div className="couple-main-caricature fade-in-up">
                        <img src="/assets/couple.png" alt="Srishti & Manjit Together" className="full-couple-img" />
                    </div>
                </section>

                {/* Wedding Function */}
                <section id="timeline-wedding" className="timeline-section section-padding">
                    <h2 className="section-title">The Wedding</h2>
                    <div className="section-subtitle-divider"></div>
                    <div className="functions-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0 auto' }}>
                        {/* Card 4: Biye */}
                        <div className="function-card card-biye fade-in-up">
                            <div className="function-card-inner">
                                <div className="function-card-caricature">
                                    <img src="/assets/biye.png" alt="Biye - Couple" className="function-caricature-img" />
                                </div>
                                <div className="function-card-details">
                                    <span className="function-badge badge-biye">বিবাহ</span>
                                    <h3 className="function-title function-title-biye">Biye</h3>
                                    <p className="function-tagline">The Holy Wedding Ceremony</p>
                                    <div className="function-info-list">
                                        <div className="info-item">
                                            <span className="info-label">DATE</span>
                                            <span className="info-value">Sunday, 6th December 2026</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">TIME</span>
                                            <span className="info-value">06:00 PM Onwards</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">VENUE</span>
                                            <span className="info-value">NKDA Community Centre, Kolkata</span>
                                        </div>
                                    </div>
                                    <p className="function-description">
                                        Join us in celebrating the sacred union of Srishti and Manjit as they embark on a beautiful journey of love and togetherness. Your presence and blessings will make this joyous occasion even more special.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. Venue Map Card Section */}
                <section id="venue" className="venue-section section-padding">
                    <h2 className="section-title">The Wedding Venue</h2>
                    <div className="section-subtitle-divider"></div>

                    <div className="venue-wrapper fade-in-up">
                        <div className="venue-info glass-card">
                            <i className="fa-solid fa-hotel venue-icon"></i>
                            <h3>NKDA Community Centre</h3>
                            <p className="venue-address">
                                New Town, Kolkata, West Bengal 700156
                            </p>
                            <p className="venue-note">
                                Located near Biswa Bangla Gate, with ample parking and modern community spaces. Join us to bless the happy couple!
                            </p>
                            <a 
                                href="https://maps.google.com/?q=NKDA+Community+Centre" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="navigate-btn"
                            >
                                <i className="fa-solid fa-map-location-dot"></i> Open in Google Maps
                            </a>
                        </div>

                        {/* Map iframe frame */}
                        <div className="map-container glass-card">
                            <iframe 
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31941.05402947644!2d88.47170099246219!3d22.57778333477196!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a0275e8ea1061e7%3A0x5f8d7007e32b95e8!2sNKDA%20Community%20Centre!5e0!3m2!1sen!2sin!4v1780220794039!5m2!1sen!2sin" 
                                width="100%" 
                                height="450" 
                                style={{ border: 0 }} 
                                allowFullScreen="" 
                                loading="lazy" 
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Wedding Venue Map Location"
                            ></iframe>
                        </div>
                    </div>
                </section>

                {/* Footer Section */}
                <footer className="main-footer">
                    <p className="wedding-footer-tag"><span className="tag-c2">#</span><span className="tag-c1">Srishti-</span><span className="tag-c2">Ne</span><span className="tag-c1">-Man-</span><span className="tag-c2">Jit</span><span className="tag-c1">-Li</span></p>
                    <div className="footer-couple-photo">
                        <img src="/assets/footer-couple.jpeg" alt="Srishti and Manjit" className="footer-couple-img" />
                    </div>
                    <p className="copyright">Designed with love by <span className="titli-name">Titli</span> for Didi Bhai and Jiju.</p>
                    <p className="contact-info">
                        For inquiries, please contact: <br />
                        Rupam Sur: +91 80084 44401 <br />
                        Sudeshna Sur: +91 80084 44402 <br />
                        Srishti Sur: +91 79890 58514
                    </p>
                </footer>
            </div>
        </>
    );
}
