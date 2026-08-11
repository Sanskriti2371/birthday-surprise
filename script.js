document.addEventListener("DOMContentLoaded", () => {
  // --- 0. HAPPY BIRTHDAY MUSIC SYSTEM (Web Audio API) ---
  let audioCtx = null;
  let musicPlaying = false;
  let musicTimeout = null;
  let currentGainNode = null;

  const musicBtn = document.getElementById("music-toggle");
  const musicIcon = musicBtn.querySelector(".music-icon");

  // Happy Birthday melody - [note frequency, duration in beats]
  // Key of C major, with a warm feel
  const melody = [
    // "Hap-py birth-day to you"
    [262, 0.75], [262, 0.25], [294, 1], [262, 1], [349, 1], [330, 2],
    // "Hap-py birth-day to you"
    [262, 0.75], [262, 0.25], [294, 1], [262, 1], [392, 1], [349, 2],
    // "Hap-py birth-day dear ___"
    [262, 0.75], [262, 0.25], [523, 1], [440, 1], [349, 1], [330, 1], [294, 2],
    // "Hap-py birth-day to you"
    [466, 0.75], [466, 0.25], [440, 1], [349, 1], [392, 1], [349, 2],
  ];

  const BPM = 120;
  const beatDuration = 60 / BPM;

  function playNote(freq, startTime, duration) {
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const filterNode = audioCtx.createBiquadFilter();

    // Warm piano-like tone using triangle wave + filter
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, startTime);

    // Add slight vibrato for warmth
    const vibrato = audioCtx.createOscillator();
    const vibratoGain = audioCtx.createGain();
    vibrato.frequency.setValueAtTime(5, startTime);
    vibratoGain.gain.setValueAtTime(2, startTime);
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);
    vibrato.start(startTime);
    vibrato.stop(startTime + duration);

    // Soft low-pass filter
    filterNode.type = "lowpass";
    filterNode.frequency.setValueAtTime(2000, startTime);

    // ADSR-like envelope
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.1, startTime + duration * 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration - 0.02);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);

    return gainNode;
  }

  function playMelody() {
    if (!audioCtx || !musicPlaying) return;

    let currentTime = audioCtx.currentTime + 0.1;

    melody.forEach(([freq, beats]) => {
      const duration = beats * beatDuration;
      currentGainNode = playNote(freq, currentTime, duration * 0.9);
      currentTime += duration;
    });

    // Total melody duration, then loop with a pause
    const totalDuration = melody.reduce((sum, [, beats]) => sum + beats, 0) * beatDuration;
    musicTimeout = setTimeout(() => {
      if (musicPlaying) playMelody();
    }, (totalDuration + 1.5) * 1000);
  }

  function startMusic() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    musicPlaying = true;
    musicBtn.classList.add("playing");
    musicIcon.textContent = "🎵";
    playMelody();
  }

  function stopMusic() {
    musicPlaying = false;
    musicBtn.classList.remove("playing");
    musicIcon.textContent = "🔇";
    if (musicTimeout) {
      clearTimeout(musicTimeout);
      musicTimeout = null;
    }
  }

  musicBtn.addEventListener("click", () => {
    if (musicPlaying) {
      stopMusic();
    } else {
      startMusic();
    }
  });

  // Auto-start music on very first interaction (browsers block autoplay without it)
  function autoStartMusic() {
    if (!musicPlaying) {
      startMusic();
    }
    // Remove all listeners after first trigger
    ["click", "touchstart", "keydown"].forEach(evt =>
      document.removeEventListener(evt, autoStartMusic)
    );
  }
  ["click", "touchstart", "keydown"].forEach(evt =>
    document.addEventListener(evt, autoStartMusic, { once: false })
  );

  // --- 1. NORTHERN LIGHTS & STARS CANVAS BACKGROUND ---
  const skyCanvas = document.getElementById("skyCanvas");
  const ctx = skyCanvas.getContext("2d");

  let width, height;
  let stars = [];
  let auroraWaves = [];

  function resizeCanvas() {
    width = skyCanvas.width = window.innerWidth;
    height = skyCanvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // Initialize Stars
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random(),
      speed: Math.random() * 0.02 + 0.005,
    });
  }

  // Initialize Aurora Waves
  for (let i = 0; i < 3; i++) {
    auroraWaves.push({
      yOffset: height * 0.3 + i * 120,
      amplitude: 40 + i * 20,
      frequency: 0.002 + i * 0.001,
      speed: 0.005 + i * 0.002,
      color:
        i === 0
          ? "rgba(78, 205, 196, "
          : i === 1
            ? "rgba(168, 230, 207, "
            : "rgba(255, 183, 178, ",
    });
  }

  let time = 0;
  function animateSky() {
    ctx.clearRect(0, 0, width, height);

    // Draw Deep Night Sky Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, "#0b0d19");
    bgGrad.addColorStop(0.5, "#151934");
    bgGrad.addColorStop(1, "#251e3e");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw Twinkling Stars
    stars.forEach((star) => {
      star.alpha += star.speed;
      if (star.alpha > 1 || star.alpha < 0.2) star.speed = -star.speed;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(star.alpha)})`;
      ctx.fill();
    });

    // Draw Glowing Northern Lights Waves
    time += 1;
    auroraWaves.forEach((wave, index) => {
      ctx.beginPath();
      ctx.moveTo(0, height);

      for (let x = 0; x <= width; x += 10) {
        const y =
          wave.yOffset +
          Math.sin(x * wave.frequency + time * wave.speed + index) *
            wave.amplitude +
          Math.cos(x * 0.001 - time * 0.003) * 30;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(width, height);
      ctx.closePath();

      const waveGrad = ctx.createLinearGradient(0, 0, 0, height);
      waveGrad.addColorStop(0, wave.color + "0.12)");
      waveGrad.addColorStop(1, wave.color + "0)");
      ctx.fillStyle = waveGrad;
      ctx.fill();
    });

    requestAnimationFrame(animateSky);
  }
  animateSky();

  // --- 2. SCREEN NAVIGATION CONTROLLER ---
  const screens = document.querySelectorAll(".screen");
  function goToScreen(screenNumber) {
    screens.forEach((screen, index) => {
      if (index + 1 === screenNumber) {
        screen.classList.add("active");
      } else {
        screen.classList.remove("active");
      }
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Screen 1 (POV Intro) -> Screen 2
  document.getElementById("intro-btn").addEventListener("click", () => {
    goToScreen(2);
  });

  // Screen 2 -> Screen 3
  document.getElementById("start-btn").addEventListener("click", () => {
    goToScreen(3);
  });

  // --- 3. GIFT PROMPT LOGIC ("NO" BUTTON REACTION) ---
  const noBtn = document.getElementById("no-btn");
  const yesBtn = document.getElementById("yes-btn");
  const giftPromptText = document.getElementById("gift-prompt-text");

  let noClickCount = 0;
  const noMessages = [
    "Are you sure? 🥺",
    "Pretty please with cherry on top? 🍒",
    "You can't say no to this cuteness! 🥹",
    "Okay fine, yes! 💖",
  ];

  noBtn.addEventListener("click", () => {
    noClickCount++;
    if (noClickCount < noMessages.length) {
      noBtn.textContent = noMessages[noClickCount - 1];
      // Make Yes button slightly larger or more tempting
      yesBtn.style.transform = `scale(${1 + noClickCount * 0.1})`;
    } else {
      // Transform No button into a Yes button
      noBtn.textContent = "Okay fine, yes! 💖";
      noBtn.style.background = "var(--sunset-berry)";
      noBtn.style.color = "var(--white)";
      noBtn.onclick = () => goToScreen(4);
    }
  });

  yesBtn.addEventListener("click", () => {
    goToScreen(4);
  });

  // --- 4. BOUQUET FLIP & COMPLETION LOGIC ---
  const flipCards = document.querySelectorAll(".flip-card");
  const toMemoriesBtn = document.getElementById("to-memories-btn");
  const flippedBouquets = new Set();

  flipCards.forEach((card) => {
    card.addEventListener("click", () => {
      card.classList.toggle("flipped");
      const bouquetId = card.getAttribute("data-bouquet");
      flippedBouquets.add(bouquetId);

      // If all 3 bouquets have been explored, unlock final screen button
      if (flippedBouquets.size === 3) {
        toMemoriesBtn.removeAttribute("disabled");
      }
    });
  });

  toMemoriesBtn.addEventListener("click", () => {
    goToScreen(5);
    initPetalRain();
  });

  // --- 5. CONFETTI PARTICLE SYSTEM (SCREEN 1) ---
  function initConfetti() {
    const confettiCanvas = document.getElementById("confettiCanvas");
    const cCtx = confettiCanvas.getContext("2d");

    function resizeConfettiCanvas() {
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
    }
    resizeConfettiCanvas();
    window.addEventListener("resize", resizeConfettiCanvas);

    let confetti = [];
    const confettiColors = ["#FFDAB9", "#FF8B77", "#FFB7B2", "#E29578", "#88304E", "#4ECDC4", "#A8E6CF", "#FFD93D"];

    for (let i = 0; i < 60; i++) {
      confetti.push({
        x: Math.random() * confettiCanvas.width,
        y: Math.random() * confettiCanvas.height - confettiCanvas.height,
        width: Math.random() * 8 + 4,
        height: Math.random() * 6 + 3,
        speedY: Math.random() * 2 + 0.5,
        speedX: Math.random() * 1.5 - 0.75,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 4 - 2,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        wobble: Math.random() * 10,
      });
    }

    function animateConfetti() {
      cCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

      confetti.forEach((c) => {
        c.y += c.speedY;
        c.x += Math.sin(c.y * 0.01) * 0.8 + c.speedX;
        c.rotation += c.rotationSpeed;
        c.wobble += 0.05;

        if (c.y > confettiCanvas.height + 20) {
          c.y = -20;
          c.x = Math.random() * confettiCanvas.width;
        }

        cCtx.save();
        cCtx.translate(c.x, c.y);
        cCtx.rotate((c.rotation * Math.PI) / 180);
        cCtx.fillStyle = c.color;
        cCtx.globalAlpha = 0.8;
        cCtx.fillRect(-c.width / 2, -c.height / 2, c.width, c.height);
        cCtx.restore();
      });

      requestAnimationFrame(animateConfetti);
    }
    animateConfetti();
  }
  initConfetti();

  // --- 6. FLOWER PETAL RAIN PARTICLE SYSTEM (SCREEN 5) ---
  function initPetalRain() {
    const petalCanvas = document.getElementById("petalCanvas");
    const pCtx = petalCanvas.getContext("2d");

    function resizePetalCanvas() {
      petalCanvas.width = petalCanvas.parentElement.offsetWidth;
      petalCanvas.height = petalCanvas.parentElement.offsetHeight;
    }
    resizePetalCanvas();

    let petals = [];
    const petalColors = ["#FFDAB9", "#FF8B77", "#FFB7B2", "#E29578"];

    for (let i = 0; i < 40; i++) {
      petals.push({
        x: Math.random() * petalCanvas.width,
        y: Math.random() * petalCanvas.height - petalCanvas.height,
        radius: Math.random() * 8 + 4,
        speedY: Math.random() * 1.5 + 0.8,
        speedX: Math.random() * 1 - 0.5,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 2 - 1,
        color: petalColors[Math.floor(Math.random() * petalColors.length)],
      });
    }

    function animatePetals() {
      pCtx.clearRect(0, 0, petalCanvas.width, petalCanvas.height);

      petals.forEach((p) => {
        p.y += p.speedY;
        p.x += Math.sin(p.y * 0.02) + p.speedX;
        p.rotation += p.rotationSpeed;

        if (p.y > petalCanvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * petalCanvas.width;
        }

        pCtx.save();
        pCtx.translate(p.x, p.y);
        pCtx.rotate((p.rotation * Math.PI) / 180);
        pCtx.fillStyle = p.color;
        pCtx.beginPath();
        pCtx.ellipse(0, 0, p.radius, p.radius * 0.6, 0, 0, Math.PI * 2);
        pCtx.fill();
        pCtx.restore();
      });

      requestAnimationFrame(animatePetals);
    }
    animatePetals();
  }

  // --- 6. PLAY AGAIN BUTTON ---
  document.getElementById("play-again-btn").addEventListener("click", () => {
    window.location.reload();
  });
});
