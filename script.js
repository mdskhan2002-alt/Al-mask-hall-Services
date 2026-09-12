/**
 * Al Misk Hall (قاعة المسك) — Interactive Engine
 * High-Performance Scroll-Driven Video Scrubbing, Lightbox & Booking System
 */

document.addEventListener('DOMContentLoaded', () => {
  /* ==========================================================================
     1. SCROLL-DRIVEN & CONTINUOUS VIDEO CONTROLLER
     ========================================================================== */
  const video = document.getElementById('scrollVideo');
  const scrollContainer = document.getElementById('hero-scroll-container');
  const stage1 = document.getElementById('stage1');
  const stage2 = document.getElementById('stage2');
  const stage3 = document.getElementById('stage3');
  const scrollCue = document.getElementById('scrollCue');
  const gaugeFill = document.getElementById('gaugeFill');
  const gaugePercent = document.getElementById('gaugePercent');
  const gaugeMilestone = document.getElementById('gaugeMilestone');
  const togglePlayBtn = document.getElementById('togglePlayBtn');
  const ctrlIcon = document.getElementById('ctrlIcon');
  const ctrlText = document.getElementById('ctrlText');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');
  const soundText = document.getElementById('soundText');
  const videoTimeDisplay = document.getElementById('videoTimeDisplay');
  const heroWatchVideoBtn = document.getElementById('heroWatchVideoBtn');

  let isPlaying = true;
  let targetProgress = 0;
  let currentProgress = 0;
  let videoDuration = 10; // default duration fallback

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) seconds = 0;
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function updatePlayBtnUI(playing) {
    if (ctrlIcon && ctrlText) {
      if (playing) {
        ctrlIcon.textContent = '⏸';
        ctrlText.textContent = 'Pause Video';
        if (togglePlayBtn) togglePlayBtn.style.borderColor = 'var(--gold)';
      } else {
        ctrlIcon.textContent = '▶';
        ctrlText.textContent = 'Play Video';
        if (togglePlayBtn) togglePlayBtn.style.borderColor = 'rgba(216, 180, 106, 0.45)';
      }
    }
  }

  // Ensure video autoplays automatically on page land with zero interaction required
  if (video) {
    const updateDur = () => {
      if (video.duration && !isNaN(video.duration) && video.duration > 0) {
        videoDuration = video.duration;
      }
    };

    // Strict autoplay compliance settings for Chrome, Safari, Edge, Firefox, Android, iOS
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.playsInline = true;
    video.loop = true;
    video.autoplay = true;

    if (video.readyState >= 1) {
      updateDur();
    }

    const startAutoplay = () => {
      video.muted = true;
      video.defaultMuted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          isPlaying = true;
          video.classList.remove('is-paused');
          updatePlayBtnUI(true);
        }).catch(err => {
          console.warn('Browser pending initial interaction for media unlock:', err);
        });
      }
    };

    // Immediate attempt on script execution
    startAutoplay();

    // Re-attempt as media data loads
    video.addEventListener('loadedmetadata', () => {
      updateDur();
      startAutoplay();
    });
    video.addEventListener('loadeddata', () => {
      updateDur();
      startAutoplay();
    });
    video.addEventListener('canplay', () => {
      updateDur();
      startAutoplay();
    });

    // Synchronize UI with playback state
    video.addEventListener('play', () => {
      isPlaying = true;
      video.classList.remove('is-paused');
      updatePlayBtnUI(true);
    });
    video.addEventListener('playing', () => {
      isPlaying = true;
      video.classList.remove('is-paused');
      updatePlayBtnUI(true);
    });
    video.addEventListener('pause', () => {
      const modal = document.getElementById('videoModal');
      if (!modal || !modal.classList.contains('open')) {
        isPlaying = false;
        video.classList.add('is-paused');
        updatePlayBtnUI(false);
      }
    });

    // Immediate unlock on ANY user presence (scroll, mousemove, touch, keydown)
    const unlockOnFirstPresence = () => {
      if (video && video.paused) {
        const modal = document.getElementById('videoModal');
        if (!modal || !modal.classList.contains('open')) {
          video.muted = true;
          video.play().then(() => {
            isPlaying = true;
            video.classList.remove('is-paused');
            updatePlayBtnUI(true);
          }).catch(() => {});
        }
      }
    };

    ['pointerdown', 'touchstart', 'click', 'scroll', 'wheel', 'mousemove', 'keydown'].forEach(evt => {
      window.addEventListener(evt, unlockOnFirstPresence, { once: true, passive: true });
    });

    // Clicking anywhere on the hero background (outside interactive buttons/cards) toggles video
    const stickyViewport = document.querySelector('.sticky-viewport');
    stickyViewport?.addEventListener('click', (e) => {
      if (e.target.closest('a, button, input, select, textarea, .hero-quick-card, .video-playback-bar')) return;
      if (video) {
        if (video.paused) {
          video.muted = true;
          video.play().then(() => {
            isPlaying = true;
            video.classList.remove('is-paused');
            updatePlayBtnUI(true);
          }).catch(() => {});
        } else {
          video.pause();
          isPlaying = false;
          video.classList.add('is-paused');
          updatePlayBtnUI(false);
        }
      }
    });
  }

  // Calculate scroll progress within hero container
  function updateScrollProgress() {
    if (!scrollContainer) return;

    const rect = scrollContainer.getBoundingClientRect();
    const scrollHeight = scrollContainer.offsetHeight - window.innerHeight;
    const currentY = -rect.top;

    if (scrollHeight > 0) {
      targetProgress = Math.max(0, Math.min(1, currentY / scrollHeight));
    } else {
      targetProgress = 0;
    }
  }

  // Render loop using requestAnimationFrame with smoothed lerp
  function renderLoop() {
    // Lerp progress for smooth transitions
    const diffProgress = targetProgress - currentProgress;
    if (Math.abs(diffProgress) > 0.001) {
      currentProgress += diffProgress * 0.2;
    } else {
      currentProgress = targetProgress;
    }

    // Update narrative stages based on scroll progress
    updateNarrativeStages(currentProgress);

    // Update gauge
    const percent = Math.round(currentProgress * 100);
    if (gaugeFill) gaugeFill.style.height = `${percent}%`;
    if (gaugePercent) gaugePercent.textContent = `${percent}%`;

    if (gaugeMilestone) {
      if (currentProgress < 0.32) {
        gaugeMilestone.textContent = 'APPROACH';
      } else if (currentProgress < 0.68) {
        gaugeMilestone.textContent = 'PORTICO';
      } else {
        gaugeMilestone.textContent = 'BALLROOM';
      }
    }

    // Update live video time display
    if (video && videoTimeDisplay) {
      const cur = formatTime(video.currentTime);
      const total = formatTime(video.duration || 10);
      videoTimeDisplay.textContent = `${cur} / ${total}`;
    }

    // Fade out scroll cue once user begins scrolling
    if (scrollCue) {
      const isScrolled = window.scrollY > 40;
      scrollCue.style.opacity = isScrolled ? '0' : '1';
      scrollCue.style.pointerEvents = isScrolled ? 'none' : 'auto';
    }

    requestAnimationFrame(renderLoop);
  }

  function updateNarrativeStages() {
    if (stage1) stage1.classList.add('active');
  }

  function setActiveStage(activeEl) {
    [stage1, stage2, stage3].forEach(stage => {
      if (!stage) return;
      if (stage === activeEl) {
        stage.classList.add('active');
      } else {
        stage.classList.remove('active');
      }
    });
  }

  // Listen to scroll events
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', updateScrollProgress, { passive: true });
  updateScrollProgress();
  requestAnimationFrame(renderLoop);

  // Play / Pause Toggle Button
  if (togglePlayBtn && video) {
    togglePlayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (video.paused) {
        video.muted = true;
        video.play().then(() => {
          isPlaying = true;
          video.classList.remove('is-paused');
          updatePlayBtnUI(true);
        }).catch(err => console.warn('Play button error:', err));
      } else {
        video.pause();
        isPlaying = false;
        video.classList.add('is-paused');
        updatePlayBtnUI(false);
      }
    });
  }

  // Sound Toggle Button
  if (soundToggleBtn && video) {
    soundToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      video.muted = !video.muted;
      if (video.muted) {
        soundIcon.textContent = '🔇';
        soundText.textContent = 'Sound';
        soundToggleBtn.style.borderColor = 'rgba(216, 180, 106, 0.45)';
      } else {
        soundIcon.textContent = '🔊';
        soundText.textContent = 'Mute';
        soundToggleBtn.style.borderColor = 'var(--gold)';
        if (video.paused) {
          video.play().catch(() => {});
        }
      }
    });
  }

  /* ==========================================================================
     2. NAVIGATION & MOBILE MENU
     ========================================================================== */
  const topNav = document.getElementById('topNav');
  const menuBtn = document.getElementById('menuBtn');
  const navMenu = document.getElementById('navMenu');
  const navBackdrop = document.getElementById('navBackdrop');
  const drawerClose = document.getElementById('drawerClose');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
      topNav?.classList.add('scrolled');
    } else {
      topNav?.classList.remove('scrolled');
    }
  }, { passive: true });

  function openMobileNav() {
    navMenu?.classList.add('open');
    menuBtn?.classList.add('active');
    navBackdrop?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileNav() {
    navMenu?.classList.remove('open');
    menuBtn?.classList.remove('active');
    navBackdrop?.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (menuBtn && navMenu) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (navMenu.classList.contains('open')) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });

    drawerClose?.addEventListener('click', closeMobileNav);
    navBackdrop?.addEventListener('click', closeMobileNav);

    // Close menu when clicking links
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMobileNav);
    });
  }

  /* ==========================================================================
     3. GALLERY FILTER TABS
     ========================================================================== */
  const tabBtns = document.querySelectorAll('.tab-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      galleryItems.forEach(item => {
        const category = item.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          item.style.display = 'block';
          setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
          }, 20);
        } else {
          item.style.opacity = '0';
          item.style.transform = 'scale(0.95)';
          setTimeout(() => {
            item.style.display = 'none';
          }, 250);
        }
      });
    });
  });

  /* ==========================================================================
     4. IMAGE LIGHTBOX MODAL
     ========================================================================== */
  const imageLightbox = document.getElementById('imageLightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxBackdrop = document.getElementById('lightboxBackdrop');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');

  let currentGalleryIndex = 0;
  const galleryArray = Array.from(galleryItems);

  function openLightbox(index) {
    currentGalleryIndex = index;
    const item = galleryArray[currentGalleryIndex];
    if (!item) return;

    const src = item.getAttribute('data-src');
    const title = item.getAttribute('data-title') || '';

    lightboxImg.src = src;
    lightboxCaption.innerHTML = `<b>${title}</b> (${currentGalleryIndex + 1} of ${galleryArray.length})`;
    imageLightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    imageLightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  galleryArray.forEach((item, idx) => {
    item.addEventListener('click', () => openLightbox(idx));
  });

  lightboxClose?.addEventListener('click', closeLightbox);
  lightboxBackdrop?.addEventListener('click', closeLightbox);

  lightboxPrev?.addEventListener('click', (e) => {
    e.stopPropagation();
    currentGalleryIndex = (currentGalleryIndex - 1 + galleryArray.length) % galleryArray.length;
    openLightbox(currentGalleryIndex);
  });

  lightboxNext?.addEventListener('click', (e) => {
    e.stopPropagation();
    currentGalleryIndex = (currentGalleryIndex + 1) % galleryArray.length;
    openLightbox(currentGalleryIndex);
  });

  // Mobile Touch Swipe Gestures (Swipe left for next, right for prev, down to close)
  let touchStartX = 0;
  let touchStartY = 0;

  imageLightbox?.addEventListener('touchstart', (e) => {
    if (!e.changedTouches || e.changedTouches.length === 0) return;
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
  }, { passive: true });

  imageLightbox?.addEventListener('touchend', (e) => {
    if (!e.changedTouches || e.changedTouches.length === 0) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        // Swipe Left -> Next
        currentGalleryIndex = (currentGalleryIndex + 1) % galleryArray.length;
        openLightbox(currentGalleryIndex);
      } else {
        // Swipe Right -> Prev
        currentGalleryIndex = (currentGalleryIndex - 1 + galleryArray.length) % galleryArray.length;
        openLightbox(currentGalleryIndex);
      }
    } else if (deltaY > 80 && Math.abs(deltaY) > Math.abs(deltaX)) {
      // Pull down -> Close Lightbox
      closeLightbox();
    }
  }, { passive: true });

  /* ==========================================================================
     5. VIDEO LIGHTBOX MODAL (VENUE WALKTHROUGH)
     ========================================================================== */
  const openVideoCard = document.getElementById('openVideoCard');
  const videoModal = document.getElementById('videoModal');
  const videoModalClose = document.getElementById('videoModalClose');
  const videoModalBackdrop = document.getElementById('videoModalBackdrop');
  const modalVideo = document.getElementById('modalVideo');

  let wasBgVideoPlayingBeforeModal = false;

  function openVideoModal() {
    if (!videoModal) return;
    videoModal.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Pause background video while modal is active
    if (video && !video.paused) {
      wasBgVideoPlayingBeforeModal = true;
      video.pause();
    } else {
      wasBgVideoPlayingBeforeModal = false;
    }

    if (modalVideo) {
      modalVideo.currentTime = 0;
      modalVideo.play().catch(e => console.warn('Modal video play prevented:', e));
    }
  }

  function closeVideoModal() {
    if (!videoModal) return;
    videoModal.classList.remove('open');
    document.body.style.overflow = '';
    if (modalVideo) {
      modalVideo.pause();
    }

    // Resume background video if it was playing
    if (wasBgVideoPlayingBeforeModal && video && isPlaying) {
      video.play().catch(() => {});
    }
  }

  openVideoCard?.addEventListener('click', openVideoModal);
  heroWatchVideoBtn?.addEventListener('click', openVideoModal);
  videoModalClose?.addEventListener('click', closeVideoModal);
  videoModalBackdrop?.addEventListener('click', closeVideoModal);

  // Keyboard shortcut listener (Escape to close modals)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
      closeVideoModal();
    } else if (imageLightbox.classList.contains('open')) {
      if (e.key === 'ArrowLeft') {
        currentGalleryIndex = (currentGalleryIndex - 1 + galleryArray.length) % galleryArray.length;
        openLightbox(currentGalleryIndex);
      } else if (e.key === 'ArrowRight') {
        currentGalleryIndex = (currentGalleryIndex + 1) % galleryArray.length;
        openLightbox(currentGalleryIndex);
      }
    }
  });

  /* ==========================================================================
     6. WHATSAPP BOOKING FORM HANDLER & PRE-SELECTION
     ========================================================================== */
  const bookingForm = document.getElementById('bookingForm');
  const dateInput = document.getElementById('date');
  const packageSelect = document.getElementById('packageSelect');
  const eventSelect = document.getElementById('event');

  // Set minimum date to today
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
  }

  // Handle "Request Package" buttons on package cards
  document.querySelectorAll('[data-package]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const pkg = btn.getAttribute('data-package');
      if (packageSelect) {
        packageSelect.value = pkg;
      }
    });
  });

  // Handle "Plan Your Wedding / Event" links on event cards
  document.querySelectorAll('[data-event-type]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const ev = btn.getAttribute('data-event-type');
      if (eventSelect) {
        eventSelect.value = ev;
      }
    });
  });

  // Auto-format phone input while typing on mobile / desktop
  const phoneInput = document.getElementById('phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/[^\d+ ]/g, '');
      const rawDigits = val.replace(/\D/g, '');
      if (rawDigits.length === 8 && !val.includes('+')) {
        val = rawDigits.slice(0, 4) + ' ' + rawDigits.slice(4);
      }
      e.target.value = val;
    });
  }

  // Booking Form Submit
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const rawPhone = document.getElementById('phone').value.trim();
      const eventType = document.getElementById('event').value;
      const date = document.getElementById('date').value;
      const selectedPackage = packageSelect ? packageSelect.value : 'Not Specified';
      const message = document.getElementById('message').value.trim();

      if (!name || !rawPhone || !date) {
        alert('Please fill in your name, phone number, and preferred date.');
        return;
      }

      // Ensure proper country code prefix for WhatsApp message
      let formattedPhone = rawPhone;
      const digitsOnly = rawPhone.replace(/\D/g, '');
      if (!rawPhone.startsWith('+')) {
        if (digitsOnly.length === 8) {
          formattedPhone = `+968 ${digitsOnly.slice(0, 4)} ${digitsOnly.slice(4)}`;
        } else if (digitsOnly.startsWith('968') && digitsOnly.length > 8) {
          formattedPhone = `+${digitsOnly}`;
        } else {
          formattedPhone = `+968 ${rawPhone}`;
        }
      }

      // Build structured, courteous WhatsApp message
      const formattedMessage = [
        '✨ *Al Misk Hall — Event Availability Enquiry* ✨',
        '--------------------------------------------------',
        `👤 *Full Name:* ${name}`,
        `📱 *Contact Phone:* ${formattedPhone}`,
        `🎉 *Event Type:* ${eventType}`,
        `📅 *Requested Date:* ${date}`,
        `💎 *Preferred Package:* ${selectedPackage}`,
        `📝 *Additional Notes / Guests:* ${message || 'Standard hall enquiry'}`,
        '--------------------------------------------------',
        'Hello Al Misk Hall team, please let me know if this date is available and provide further package details.'
      ].join('\n');

      const whatsappUrl = `https://wa.me/96896135511?text=${encodeURIComponent(formattedMessage)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    });
  }

  // Mobile Bottom Dock "Book Now" Smooth Scroll & Focus
  const dockBookBtn = document.querySelector('.dock-item.book-action');
  dockBookBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById('booking');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        document.getElementById('name')?.focus();
      }, 600);
    }
  });

  /* ==========================================================================
     7. BACK TO TOP BUTTON
     ========================================================================== */
  const backToTop = document.getElementById('backToTop');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
      backToTop?.classList.add('show');
    } else {
      backToTop?.classList.remove('show');
    }
  }, { passive: true });

  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  console.log('Al Misk Hall Interactive Experience initialized successfully.');
});
