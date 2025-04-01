// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Performance optimization: Use passive listeners for touch events
    const supportsPassive = (() => {
        let passive = false;
        try {
            const opts = Object.defineProperty({}, 'passive', {
                get: function() { passive = true; }
            });
            window.addEventListener('testPassive', null, opts);
            window.removeEventListener('testPassive', null, opts);
        } catch (e) {}
        return passive;
    })();
    
    const passiveOptions = supportsPassive ? { passive: true } : false;
    
    // Initialize background particles
    createBackgroundParticles();
    
    // ============ CAROUSEL FUNCTIONALITY ============
    const track = document.getElementById('carousel-track');
    const cards = track.querySelectorAll('.casino-card');
    const dots = document.getElementById('carousel-dots').querySelectorAll('.dot');
    
    let isDragging = false;
    let startPosition = 0;
    let startScrollLeft = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let currentIndex = 0;
    let animationID = 0;
    let cardWidth = cards[0].offsetWidth + 15; // card width + gap
    
    // Initialize: Set first card as active
    cards[0].classList.add('active');
    
    // Update card width calculation on resize
    function updateCardWidth() {
        cardWidth = cards[0].offsetWidth + 15;
    }
    
    window.addEventListener('resize', updateCardWidth);
    
    // Add mouse event handlers for desktop dragging
    track.addEventListener('mousedown', e => {
        // Don't start dragging if clicking on a link/button
        if (e.target.closest('.casino-link, .casino-btn')) return;
        
        isDragging = true;
        startPosition = e.pageX;
        startScrollLeft = track.scrollLeft;
        track.style.cursor = 'grabbing';
        // Prevent default behavior like text selection
        e.preventDefault();
    });
    
    track.addEventListener('mousemove', e => {
        if(!isDragging) return;
        // Calculate mouse movement and scroll track accordingly
        const currentPosition = e.pageX;
        const difference = currentPosition - startPosition;
        track.scrollLeft = startScrollLeft - difference;
        e.preventDefault();
    });
    
    // Handle mouseup/mouseleave events to stop dragging
    function endDrag() {
        isDragging = false;
        track.style.cursor = 'grab';
    }
    
    track.addEventListener('mouseup', endDrag);
    track.addEventListener('mouseleave', endDrag);
    
    // Set active card and dot
    function setActiveCard(index) {
        if (index < 0) index = 0;
        if (index >= cards.length) index = cards.length - 1;
        
        currentIndex = index;
        
        // Update cards
        cards.forEach(card => card.classList.remove('active'));
        cards[index].classList.add('active');
        
        // Update dots
        dots.forEach(dot => dot.classList.remove('active'));
        dots[index].classList.add('active');
        
        // Scroll to the active card
        track.scrollTo({
            left: cards[index].offsetLeft - (track.offsetWidth - cardWidth) / 2,
            behavior: 'smooth'
        });
    }
    
    // Dot click event
    dots.forEach(dot => {
        dot.addEventListener('click', function() {
            const dotIndex = parseInt(this.getAttribute('data-id')) - 1;
            setActiveCard(dotIndex);
        });
    });
    
    // Handle scroll event to update active card based on position
    let scrollTimeout;
    track.addEventListener('scroll', function() {
        clearTimeout(scrollTimeout);
        
        scrollTimeout = setTimeout(() => {
            const scrollPosition = track.scrollLeft + track.offsetWidth / 2;
            
            // Find the closest card to the center
            let minDistance = Infinity;
            let closestIndex = 0;
            
            cards.forEach((card, index) => {
                const cardCenter = card.offsetLeft + cardWidth / 2;
                const distance = Math.abs(scrollPosition - cardCenter);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    closestIndex = index;
                }
            });
            
            if (currentIndex !== closestIndex) {
                currentIndex = closestIndex;
                
                // Update active states
                cards.forEach(card => card.classList.remove('active'));
                cards[closestIndex].classList.add('active');
                
                dots.forEach(dot => dot.classList.remove('active'));
                dots[closestIndex].classList.add('active');
            }
        }, 100);
    }, passiveOptions);
    
    // ============ SLOT MACHINE FUNCTIONALITY ============
    const slotBalance = document.getElementById('balance');
    const betAmount = document.getElementById('bet-amount');
    const betButtons = document.querySelectorAll('.bet-btn');
    const spinButton = document.getElementById('spin-btn');
    const reels = [
        document.getElementById('reel1').querySelector('.reel-content'),
        document.getElementById('reel2').querySelector('.reel-content'),
        document.getElementById('reel3').querySelector('.reel-content')
    ];
    const lever = document.getElementById('lever');
    const resultDisplay = document.getElementById('result');
    
    // Particles container
    const particlesContainer = document.getElementById('particles');
    
    // Game variables
    let balance = 1000; // Starting balance
    let currentBet = 100; // Default bet
    let isSpinning = false;
    
    // Slot symbols and their values
    const symbols = ['7', '🍒', '🍋', '🍊', '🔔', '💎', '🍀'];
    const symbolValues = {
        '7': 10,    // Highest payout
        '💎': 7,
        '🔔': 5,
        '🍀': 3,
        '🍊': 2,
        '🍋': 1.5,
        '🍒': 1     // Lowest payout
    };
    
    // Initialize reel positions
    reels.forEach(reel => {
        const reelItems = reel.querySelectorAll('.reel-item');
        const reelHeight = reelItems[0].offsetHeight;
        const totalHeight = reelHeight * reelItems.length;
        
        // Place items in a column
        reelItems.forEach((item, index) => {
            item.style.position = 'absolute';
            item.style.top = `${index * reelHeight}px`;
        });
        
        // Position reel to show first symbol
        reel.style.top = '0px';
    });
    
    // Setup reel heights properly on first load
    function setupReels() {
        reels.forEach(reel => {
            const reelItems = reel.querySelectorAll('.reel-item');
            const reelHeight = reelItems[0].offsetHeight;
            
            reelItems.forEach((item, index) => {
                item.style.position = 'absolute';
                item.style.top = `${index * reelHeight}px`;
            });
        });
    }
    
    setupReels();
    window.addEventListener('resize', setupReels);
    
    // Bet button click handler
    betButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (isSpinning) return;
            
            const amount = parseInt(this.getAttribute('data-amount'));
            currentBet = amount;
            betAmount.textContent = amount;
            
            // Update active button
            betButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Function to spin the reels
    function spinReels() {
        if (isSpinning || balance < currentBet) return;
        
        isSpinning = true;
        
        // Deduct bet from balance
        balance -= currentBet;
        slotBalance.textContent = balance;
        
        // Clear previous result
        resultDisplay.textContent = '';
        resultDisplay.classList.remove('win-animation');
        
        // Disable spin button during spin
        spinButton.disabled = true;
        
        // Pull the lever
        lever.classList.add('pulled');
        
        // Spin animation for each reel
        const results = [];
        const reelHeight = reels[0].querySelector('.reel-item').offsetHeight;
        
        reels.forEach((reel, index) => {
            // Calculate random result
            const randomIndex = Math.floor(Math.random() * symbols.length);
            const result = symbols[randomIndex];
            results.push(result);
            
            // Calculate target position
            const targetPosition = -randomIndex * reelHeight;
            
            // Add some randomness to spin duration
            const duration = 4 + (index * 0.5);
            
            // Simulate spinning by resetting and then setting final position
            reel.style.transition = 'none';
            reel.style.top = '0px';
            
            // Force reflow to make the initial position take effect
            void reel.offsetHeight;
            
            reel.style.transition = `top ${duration}s cubic-bezier(0.17, 0.85, 0.45, 1)`;
            reel.style.top = `${targetPosition}px`;
        });
        
        // Lever animation timer
        setTimeout(() => {
            lever.classList.remove('pulled');
        }, 500);
        
        // Determine result after all reels stop
        setTimeout(() => {
            isSpinning = false;
            spinButton.disabled = false;
            
            // Check for win
            checkWin(results);
        }, 5500); // After the longest reel animation
    }
    
    // Function to check for win condition
    function checkWin(results) {
        if (results[0] === results[1] && results[1] === results[2]) {
            // Jackpot - all three symbols match
            const multiplier = symbolValues[results[0]] * 5;
            const winAmount = currentBet * multiplier;
            
            balance += winAmount;
            slotBalance.textContent = balance;
            
            resultDisplay.textContent = `JACKPOT! +${winAmount}₽`;
            resultDisplay.classList.add('win-animation');
            
            // Create celebratory particles
            createWinParticles();
        } else if (results[0] === results[1] || results[1] === results[2] || results[0] === results[2]) {
            // Two matching symbols
            const matchedSymbol = results[0] === results[1] ? results[0] : 
                                (results[1] === results[2] ? results[1] : results[0]);
            const multiplier = symbolValues[matchedSymbol] * 2;
            const winAmount = currentBet * multiplier;
            
            balance += winAmount;
            slotBalance.textContent = balance;
            
            resultDisplay.textContent = `Выигрыш! +${winAmount}₽`;
            resultDisplay.classList.add('win-animation');
            
            // Create celebratory particles
            createWinParticles(false);
        } else {
            resultDisplay.textContent = 'Попробуйте еще раз!';
        }
    }
    
    // Function to create celebratory particles
    function createWinParticles(jackpot = true) {
        // Number of particles based on win type
        const particleCount = jackpot ? 100 : 40;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            
            // Randomize particle properties
            const size = Math.random() * 8 + 4;
            const speed = Math.random() * 6 + 2;
            const angle = Math.random() * 360;
            const distance = Math.random() * 150 + 50;
            const color = jackpot ? 
                `hsl(${Math.random() * 60 + 30}, 100%, 50%)` : // Gold/yellow for jackpot
                `hsl(${Math.random() * 360}, 100%, 70%)`; // Various colors for regular win
            
            // Set particle styles
            particle.style.position = 'absolute';
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.borderRadius = '50%';
            particle.style.backgroundColor = color;
            particle.style.boxShadow = `0 0 ${size/2}px ${color}`;
            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.transform = 'translate(-50%, -50%)';
            particle.style.pointerEvents = 'none';
            
            // Add particle to container
            particlesContainer.appendChild(particle);
            
            // Animate particle
            const keyframes = [
                { 
                    transform: 'translate(-50%, -50%)',
                    opacity: 1
                },
                {
                    transform: `translate(calc(-50% + ${Math.cos(angle * Math.PI / 180) * distance}px), 
                               calc(-50% + ${Math.sin(angle * Math.PI / 180) * distance}px))`,
                    opacity: 0
                }
            ];
            
            const animation = particle.animate(keyframes, {
                duration: speed * 1000,
                easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)'
            });
            
            // Remove particle after animation completes
            animation.onfinish = () => {
                particlesContainer.removeChild(particle);
            };
        }
    }
    
    // Event listeners for spin
    spinButton.addEventListener('click', spinReels);
    lever.addEventListener('click', spinReels);
    
    // Add touch event handler for lever to improve mobile experience
    lever.addEventListener('touchstart', function(e) {
        e.preventDefault(); // Prevent default behavior
        spinReels();
    });
    
    // Check for no balance condition
    function checkBalance() {
        if (balance <= 0) {
            balance = 1000; // Reset balance
            slotBalance.textContent = balance;
            resultDisplay.textContent = 'Баланс обновлен! +1000₽';
            resultDisplay.classList.add('win-animation');
        }
    }
    
    // Reset button in case of zero balance
    spinButton.addEventListener('dblclick', function() {
        if (balance < currentBet) {
            checkBalance();
        }
    });
    
    // Improved mobile scroll handling
    let startY;
    let startX;
    let initialTouchTime = 0;
    
    // Handle touchstart - store initial position
    document.addEventListener('touchstart', function(e) {
        // Only track single touch to avoid interfering with pinch-zoom
        if (e.touches.length === 1) {
            startY = e.touches[0].clientY;
            startX = e.touches[0].pageX;
            initialTouchTime = Date.now();
        }
    }, passiveOptions);
    
    // Handle touchmove - prevent overscroll only when needed
    document.addEventListener('touchmove', function(e) {
        // Skip if we're not tracking a touch
        if (typeof startY !== 'number' || e.touches.length !== 1) return;
        
        const currentY = e.touches[0].clientY;
        const currentX = e.touches[0].pageX;
        const deltaY = currentY - startY;
        const deltaX = Math.abs(currentX - startX);
        
        // Only prevent default if:
        // 1. It's a clear vertical pull-down gesture (not horizontal)
        // 2. We're at the top of the page
        // 3. User is pulling down (not up)
        if (window.scrollY <= 5 && deltaY > 25 && deltaX < 30) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Cleanup on touch end
    document.addEventListener('touchend', function() {
        startY = null;
        startX = null;
    }, passiveOptions);
});

// Функция для создания анимированных фоновых частиц
function createBackgroundParticles() {
    const container = document.getElementById('background-particles');
    if (!container) return;
    
    const numParticles = window.innerWidth < 768 ? 20 : 40;
    
    // Создаем начальные частицы
    for (let i = 0; i < numParticles; i++) {
        createParticle(container);
    }
    
    // Периодически добавляем новые частицы
    setInterval(() => {
        createParticle(container);
        
        // Удаляем старые частицы, чтобы не перегружать DOM
        if (container.children.length > numParticles * 1.5) {
            container.removeChild(container.firstChild);
        }
    }, 3000);
}

// Создание одной частицы
function createParticle(container) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    
    // Случайный размер
    const size = Math.random() * 6 + 2;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    // Случайная позиция
    const posX = Math.random() * window.innerWidth;
    const posY = Math.random() * window.innerHeight;
    particle.style.left = `${posX}px`;
    particle.style.top = `${posY}px`;
    
    // Случайный цвет (оттенки золотого)
    const hue = Math.random() * 30 + 40; // От желтого к оранжевому
    particle.style.backgroundColor = `hsl(${hue}, 100%, 60%)`;
    particle.style.boxShadow = `0 0 ${size * 2}px hsl(${hue}, 100%, 60%)`;
    
    // Случайная длительность анимации
    const duration = Math.random() * 10 + 15;
    particle.style.animationDuration = `${duration}s`;
    
    // Добавляем в контейнер
    container.appendChild(particle);
    
    // Удаляем элемент после завершения анимации
    setTimeout(() => {
        if (particle.parentNode === container) {
            container.removeChild(particle);
        }
    }, duration * 1000);
}
