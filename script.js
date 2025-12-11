const streamConfig = {
    twitchUsername: "dr3sxp",
    
    twitchUrl: "https://www.twitch.tv/dr3sxp",
    
    streamSchedule: [
        [3, 19, 23],
        [5, 20, 24],
        [0, 17, 21]   
    ],
    
    manualStatus: null,
    
    checkInterval: 60000
};

function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 30;
    
    particlesContainer.innerHTML = '';
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        const size = Math.random() * 4 + 1;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        
        particle.style.animationDelay = `${Math.random() * 15}s`;
        
        particle.style.opacity = Math.random() * 0.1 + 0.05;
        
        particlesContainer.appendChild(particle);
    }
}

function checkIfStreamingBySchedule() {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    if (streamConfig.manualStatus === "online") return true;
    if (streamConfig.manualStatus === "offline") return false;
    
    for (const schedule of streamConfig.streamSchedule) {
        const [day, startHour, endHour] = schedule;
        
        if (currentDay === day) {
            const effectiveEndHour = endHour === 24 ? 0 : endHour;
            
            if (effectiveEndHour === 0) {
                if (currentHour >= startHour || currentHour < 1) {
                    return true;
                }
            } else {
                if (currentHour >= startHour && currentHour < effectiveEndHour) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

function getNextStreamTime() {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const daysOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    
    for (let i = 0; i < 7; i++) {
        const checkDay = (currentDay + i) % 7;
        
        for (const schedule of streamConfig.streamSchedule) {
            const [day, startHour] = schedule;
            
            if (day === checkDay) {
                if (i === 0) {
                    if (currentHour > startHour || (currentHour === startHour && currentMinute >= 0)) {
                        continue;
                    }
                }
                
                const formattedHour = startHour < 10 ? `0${startHour}:00` : `${startHour}:00`;
                
                return {
                    day: daysOfWeek[day],
                    time: formattedHour,
                    daysFromNow: i
                };
            }
        }
    }
    
    return null;
}

async function checkTwitchLiveStatus() {
    try {
        const response = await fetch(
            `https://twitch-proxy.freecodecamp.rocks/helix/streams?user_login=${streamConfig.twitchUsername}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
            const streamData = data.data[0];
            return {
                isLive: true,
                game: streamData.game_name,
                title: streamData.title,
                viewers: streamData.viewer_count,
                thumbnail: streamData.thumbnail_url
            };
        }
        
        return { isLive: false };
        
    } catch (error) {
        console.log('No se pudo verificar estado de Twitch, usando horarios:', error.message);
        return { isLive: null };
    }
}

async function updateStreamStatus() {
    const streamIndicator = document.getElementById('stream-indicator');
    const streamStatusText = document.getElementById('stream-status-text');
    const scheduleText = document.getElementById('schedule-text');
    const streamLink = document.getElementById('stream-link');
    const currentGameElement = document.getElementById('current-game');
    
    const twitchStatus = await checkTwitchLiveStatus();
    
    if (twitchStatus.isLive === true) {
        streamIndicator.classList.add('online-dot');
        streamIndicator.classList.remove('schedule-dot');
        
        streamStatusText.innerHTML = '<strong>🔴 EN DIRECTO AHORA:</strong>';
        scheduleText.textContent = '¡En vivo ahora! Únete al stream.';
        
        if (twitchStatus.game) {
            currentGameElement.textContent = twitchStatus.game;
        }
        
        streamLink.href = streamConfig.twitchUrl;
        streamLink.classList.remove('stream-link-inactive');
        streamLink.classList.add('stream-link-active');
        streamLink.innerHTML = '<i class="fas fa-external-link-alt"></i> VER STREAM EN VIVO';
        
        document.title = "🔴 EN VIVO | Dr3XNation";
        
    } else if (twitchStatus.isLive === false) {
        handleOfflineStatus(streamIndicator, streamStatusText, scheduleText, streamLink, currentGameElement);
        
    } else {
        const bySchedule = checkIfStreamingBySchedule();
        
        if (bySchedule) {
            streamIndicator.classList.add('online-dot');
            streamIndicator.classList.remove('schedule-dot');
            
            streamStatusText.innerHTML = '<strong>EN DIRECTO AHORA:</strong>';
            scheduleText.textContent = '¡En vivo ahora! (basado en horario)';
            currentGameElement.textContent = "Jugando ahora";
            
            streamLink.href = streamConfig.twitchUrl;
            streamLink.classList.remove('stream-link-inactive');
            streamLink.classList.add('stream-link-active');
            streamLink.innerHTML = '<i class="fas fa-external-link-alt"></i> UNIRME AL STREAM';
            
            document.title = "Dr3XNation | Streaming de Videojuegos";
            
        } else {
            handleOfflineStatus(streamIndicator, streamStatusText, scheduleText, streamLink, currentGameElement);
        }
    }
}

// Manejar estado offline
function handleOfflineStatus(indicator, statusText, scheduleText, streamLink, gameElement) {
    indicator.classList.remove('online-dot');
    indicator.classList.add('schedule-dot');
    
    const nextStream = getNextStreamTime();
    statusText.innerHTML = '<strong>PRÓXIMO STREAM:</strong>';
    
    if (nextStream) {
        if (nextStream.daysFromNow === 0) {
            scheduleText.textContent = `Hoy a las ${nextStream.time}`;
        } else if (nextStream.daysFromNow === 1) {
            scheduleText.textContent = `Mañana a las ${nextStream.time}`;
        } else {
            scheduleText.textContent = `${nextStream.day} a las ${nextStream.time}`;
        }
    } else {
        scheduleText.textContent = 'Miércoles 19:00 | Viernes 20:00 | Domingo 17:00 (GMT-5)';
    }
    
    gameElement.textContent = "Próximamente";
    
    streamLink.href = "#";
    streamLink.classList.remove('stream-link-active');
    streamLink.classList.add('stream-link-inactive');
    streamLink.innerHTML = '<i class="far fa-clock"></i> STREAM OFFLINE';
    
    document.title = "Dr3XNation | Streaming de Videojuegos";
}

function setupSmoothScroll() {
    document.querySelectorAll('nav a, .link-button[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            
            if (targetId.startsWith('#')) {
                e.preventDefault();
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                    
                    const mobileMenu = document.querySelector('.mobile-menu');
                    if (mobileMenu && mobileMenu.classList.contains('active')) {
                        mobileMenu.classList.remove('active');
                    }
                }
            }
        });
    });
}

function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.link-card, .setup-item, .hero-content').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });
}

function setupTypewriterEffect() {
    const titleElement = document.querySelector('.hero-title span');
    const originalText = 'ANDRES';
    let charIndex = 0;
    
    function typeWriter() {
        if (charIndex < originalText.length) {
            titleElement.textContent = originalText.substring(0, charIndex + 1);
            charIndex++;
            setTimeout(typeWriter, 100);
        } else {
            titleElement.innerHTML = 'ANDRES<span style="color: var(--neon-purple); animation: blink 1s infinite;">_</span>';
        }
    }
    
    setTimeout(typeWriter, 1000);
}

document.addEventListener('DOMContentLoaded', function() {
    createParticles();
    
    setupSmoothScroll();
    
    setupScrollAnimations();
    
    setupTypewriterEffect();
    
    updateStreamStatus();
    
    setInterval(updateStreamStatus, streamConfig.checkInterval);
    
    console.log("Controles de prueba disponibles:");
    console.log("setManualStatus('online') - Forzar estado EN VIVO");
    console.log("setManualStatus('offline') - Forzar estado OFFLINE");
    console.log("setManualStatus(null) - Volver a detección automática");
});

function setManualStatus(status) {
    streamConfig.manualStatus = status;
    updateStreamStatus();
    console.log(`Estado manual cambiado a: ${status}`);
}