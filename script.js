/**
 * Text-to-image generator app
 * Handles prompt input, styles, image generation, and history
 */

function initializeDreamCanvas() {
  // ==========================================
  // 1. Application State
  // ==========================================
  const state = {
    prompt: '',
    negativePrompt: '',
    style: 'none',
    width: 1024,
    height: 1024,
    ratio: '1:1',
    count: 1,
    enhancers: new Set(),
    isGenerating: false,
    history: JSON.parse(localStorage.getItem('dreamcanvas_history') || '[]'),
    currentBatch: [],
  };

  // Curated High-Quality Style Prompts
  const stylePrompts = {
    none: '',
    photorealistic: 'photorealistic, 8k resolution, professional photography, hyperrealistic details, natural lighting, sharp focus, Canon EOS R5, realistic textures',
    anime: 'anime key visual, Studio Ghibli and Makoto Shinkai style, vibrant colors, clean lines, detailed anime illustration, trending on pixiv',
    '3d-render': '3D Pixar and Disney character animation style, cute, smooth textures, octane render, soft subsurface scattering, vibrant lighting',
    cyberpunk: 'cyberpunk aesthetic, glowing neon lights, futuristic high-tech city, reflective wet streets, volumetric smoke, octane render',
    'oil-painting': 'oil painting on canvas, expressive artistic brushstrokes, rich textures, fine art masterpiece, dramatic chiaroscuro lighting',
    'concept-art': 'detailed concept art, digital matte painting, trending on ArtStation, imaginative worldbuilding, cinematic epic scale',
    watercolor: 'delicate watercolor illustration, fluid colorful ink bleeding, soft paper grain texture, artistic minimalism',
    fantasy: 'epic fantasy artwork, glowing magical runes, mythical atmosphere, celestial lighting, intricate mythic design',
    'pixel-art': '16-bit retro pixel art, detailed pixel sprite, nostalgic arcade video game aesthetic, clean pixel lines',
    cinematic: 'cinematic movie still, 35mm film photography, anamorphic lens flare, dramatic color grading, IMAX quality, cinematic atmosphere',
    vintage: 'vintage 1970s retro photograph, warm nostalgic color tones, polaroid aesthetic, authentic film grain',
  };

  // Specific Variation Modifiers for Multi-Image Generation (2, 3, 4 pictures)
  const variationModifiers = [
    'primary angle, wide perspective, high detail',
    'dynamic angle, alternative composition, side lighting',
    'atmospheric perspective, cinematic lighting, artistic depth',
    'detailed focal closeup, dramatic contrast, rich ambient lighting',
  ];

  // Creative Prompts Library
  const surprisePrompts = [
    'A cyberpunk street food vendor in futuristic Tokyo at midnight with holographic banners, rain puddles, and neon reflections',
    'A mystical ancient temple submerged underwater with glowing bioluminescent jellyfish and rays of sunlight through crystal clear ocean',
    'A cozy treehouse library nestled inside a giant glowing ancient oak tree, surrounded by floating fireflies and starry night',
    'A majestic white tiger made of stardust and celestial galaxies roaming on an alien cosmic planet',
    'A tiny adorable robot tending to a miniature bonsai garden on a futuristic spaceship windowsill',
    'An opulent Victorian steampunk airship flying through pastel clouds during a golden sunset',
    'A crystal glass sculpture of a phoenix rising from iridescent colorful flames on a dark reflective surface',
    'A futuristic floating city with waterfalls pouring into the clouds, lush hanging gardens, and solar sail ships',
    'A cute fluffy red panda chef baking glowing magical croissants in a whimsical cozy bakery, 3d pixar style',
    'An ethereal forest spirit guardian standing in a field of glowing lavender under a gigantic crescent moon',
    'A retro 1980s synthwave sports car driving towards a giant digital grid sunset with palm trees and neon wireframes',
    'An intricate clockwork mechanical dragon with brass gears, golden scales, and glowing ruby eyes',
  ];

  // ==========================================
  // 2. DOM Elements Selection
  // ==========================================
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.querySelector('.nav-links');

  const promptInput = document.getElementById('promptInput');
  const charCount = document.getElementById('charCount');
  const surpriseMeBtn = document.getElementById('surpriseMeBtn');
  const clearPromptBtn = document.getElementById('clearPromptBtn');
  const negativePromptToggle = document.getElementById('negativePromptToggle');
  const negativePromptContainer = document.getElementById('negativePromptContainer');
  const negativePromptInput = document.getElementById('negativePromptInput');
  const generateBtn = document.getElementById('generateBtn');

  const styleGrid = document.getElementById('styleGrid');
  const ratioGrid = document.getElementById('ratioGrid');
  const countSelector = document.getElementById('countSelector');
  const enhancerTags = document.getElementById('enhancerTags');

  const imagesContainer = document.getElementById('imagesContainer');
  const statusBadge = document.getElementById('statusBadge');
  const batchActions = document.getElementById('batchActions');
  const downloadAllBtn = document.getElementById('downloadAllBtn');

  // History Drawer
  const historyBtn = document.getElementById('historyBtn');
  const historyOverlay = document.getElementById('historyOverlay');
  const historyList = document.getElementById('historyList');
  const historyCount = document.getElementById('historyCount');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const closeHistoryBtn = document.getElementById('closeHistoryBtn');

  // Lightbox
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxBackdrop = document.getElementById('lightboxBackdrop');
  const lightboxCloseBtn = document.getElementById('lightboxCloseBtn');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxPrompt = document.getElementById('lightboxPrompt');
  const lightboxMeta = document.getElementById('lightboxMeta');
  const lightboxDownloadBtn = document.getElementById('lightboxDownloadBtn');
  const lightboxCopyPromptBtn = document.getElementById('lightboxCopyPromptBtn');
  const toastContainer = document.getElementById('toastContainer');

  let activeLightboxImage = null;

  // ==========================================
  // 3. Navigation & General Website Interactivity
  // ==========================================

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
    });

    document.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('mobile-open');
      });
    });
  }

  // FAQ Accordion
  document.querySelectorAll('.faq-question').forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.parentElement;
      const isActive = item.classList.contains('active');
      document.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // Showcase Cards "Use Prompt"
  document.querySelectorAll('.showcase-card').forEach((card) => {
    card.addEventListener('click', () => {
      const samplePrompt = card.getAttribute('data-prompt');
      if (samplePrompt && promptInput) {
        promptInput.value = samplePrompt;
        state.prompt = samplePrompt;
        if (charCount) charCount.textContent = samplePrompt.length;
        document.getElementById('generator').scrollIntoView({ behavior: 'smooth' });
        showToast('Prompt loaded into studio!', 'info');
        setTimeout(() => generateImages(), 350);
      }
    });
  });

  // Sample Chips Click
  document.querySelectorAll('.chip-item').forEach((chip) => {
    chip.addEventListener('click', () => {
      if (promptInput) {
        promptInput.value = chip.textContent.trim();
        state.prompt = promptInput.value;
        if (charCount) charCount.textContent = state.prompt.length;
        promptInput.focus();
        generateImages();
      }
    });
  });

  // ==========================================
  // 4. Generator Form Controls
  // ==========================================

  if (promptInput) {
    promptInput.addEventListener('input', (e) => {
      state.prompt = e.target.value;
      if (charCount) charCount.textContent = e.target.value.length;
    });

    promptInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        generateImages();
      }
    });
  }

  if (surpriseMeBtn) {
    surpriseMeBtn.addEventListener('click', () => {
      const randomIndex = Math.floor(Math.random() * surprisePrompts.length);
      const chosen = surprisePrompts[randomIndex];
      promptInput.value = chosen;
      state.prompt = chosen;
      if (charCount) charCount.textContent = chosen.length;
      promptInput.focus();
      showToast('✨ Creative prompt loaded!', 'info');
    });
  }

  if (clearPromptBtn) {
    clearPromptBtn.addEventListener('click', () => {
      promptInput.value = '';
      state.prompt = '';
      if (charCount) charCount.textContent = '0';
      promptInput.focus();
    });
  }

  if (negativePromptToggle) {
    negativePromptToggle.addEventListener('click', () => {
      negativePromptToggle.classList.toggle('active');
      if (negativePromptContainer) {
        negativePromptContainer.classList.toggle('hidden');
        if (!negativePromptContainer.classList.contains('hidden') && negativePromptInput) {
          negativePromptInput.focus();
        }
      }
    });
  }

  if (negativePromptInput) {
    negativePromptInput.addEventListener('input', (e) => {
      state.negativePrompt = e.target.value;
    });
  }

  if (styleGrid) {
    styleGrid.addEventListener('click', (e) => {
      const button = e.target.closest('.style-card');
      if (!button) return;

      styleGrid.querySelectorAll('.style-card').forEach((b) => b.classList.remove('active'));
      button.classList.add('active');
      state.style = button.getAttribute('data-style');
      showToast(`Style: ${formatStyleName(state.style)}`, 'info');
    });
  }

  if (ratioGrid) {
    ratioGrid.addEventListener('click', (e) => {
      const button = e.target.closest('.ratio-card');
      if (!button) return;

      ratioGrid.querySelectorAll('.ratio-card').forEach((b) => b.classList.remove('active'));
      button.classList.add('active');
      state.ratio = button.getAttribute('data-ratio');
      state.width = parseInt(button.getAttribute('data-width'), 10) || 1024;
      state.height = parseInt(button.getAttribute('data-height'), 10) || 1024;
      showToast(`Size: ${state.ratio} (${state.width}x${state.height})`, 'info');
    });
  }

  if (countSelector) {
    countSelector.addEventListener('click', (e) => {
      const button = e.target.closest('.count-btn');
      if (!button) return;

      countSelector.querySelectorAll('.count-btn').forEach((b) => b.classList.remove('active'));
      button.classList.add('active');
      state.count = parseInt(button.getAttribute('data-count'), 10) || 1;
      showToast(`Generating ${state.count} picture variation(s)`, 'info');
    });
  }

  if (enhancerTags) {
    enhancerTags.addEventListener('click', (e) => {
      const pill = e.target.closest('.tag-btn');
      if (!pill) return;

      pill.classList.toggle('active');
      const tag = pill.getAttribute('data-tag');
      if (pill.classList.contains('active')) {
        state.enhancers.add(tag);
      } else {
        state.enhancers.delete(tag);
      }
    });
  }

  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      generateImages();
    });
  }

  // ==========================================
  // 5. Intelligent Prompt Builder & Multi-Image Variation Logic
  // ==========================================

  /**
   * Builds the final prompt tailored specifically for variation index (0, 1, 2, 3)
   */
  function buildFinalPrompt(basePrompt, variationIndex = 0) {
    let cleanPrompt = basePrompt.trim();

    // 1. Append chosen picture style keywords
    const styleModifier = stylePrompts[state.style];
    if (styleModifier) {
      cleanPrompt += `, ${styleModifier}`;
    }

    // 2. Append chosen lighting/mood enhancers
    if (state.enhancers && state.enhancers.size > 0) {
      cleanPrompt += `, ${Array.from(state.enhancers).join(', ')}`;
    }

    // 3. For multi-image batches (2, 3, 4), inject distinct angle/composition variation
    if (state.count > 1) {
      const variationTag = variationModifiers[variationIndex % variationModifiers.length];
      cleanPrompt += `, ${variationTag}`;
    }

    // 4. Enforce clean watermark-free image quality
    cleanPrompt += ', clean, high quality, no watermark, no text';

    return cleanPrompt;
  }

  /**
   * Generates a direct, ultra-fast diffusion URL for the prompt with zero watermark
   */
  function getImageUrl(promptText, seed, width, height) {
    // Use high-speed turbo diffusion for instant generation (<2 seconds)
    let modelParam = 'turbo';
    if (state.style === 'anime') modelParam = 'flux-anime';

    // Fast-loading optimized resolutions: instant download & crisp retina display
    let targetWidth = 512;
    let targetHeight = 512;

    if (state.ratio === '16:9') {
      targetWidth = 768;
      targetHeight = 432;
    } else if (state.ratio === '9:16') {
      targetWidth = 432;
      targetHeight = 768;
    } else if (state.ratio === '4:3') {
      targetWidth = 640;
      targetHeight = 480;
    }

    // Anti-watermark negative prompt
    const defaultNegative = 'watermark, text, logo, signature, copyright, words, letters, trademark, stamp, blurry, deformed';
    let combinedNegative = defaultNegative;
    if (state.negativePrompt && state.negativePrompt.trim()) {
      combinedNegative = `${state.negativePrompt.trim()}, ${defaultNegative}`;
    }

    // Fast turbo endpoint with nologo=true and nofeed=true
    let url = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptText)}?width=${targetWidth}&height=${targetHeight}&seed=${seed}&model=${modelParam}&nologo=true&nofeed=true&negative=${encodeURIComponent(combinedNegative)}`;

    return url;
  }

  // ==========================================
  // 6. Fast Multi-Image Generation Runner
  // ==========================================

  async function generateImages() {
    const rawPrompt = promptInput ? promptInput.value.trim() : state.prompt.trim();

    // Check prompt
    if (!rawPrompt) {
      showToast('⚠️ Please type a prompt first to generate images!', 'error');
      if (promptInput) promptInput.focus();
      return;
    }

    if (state.isGenerating) return;

    state.isGenerating = true;
    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Creating Fast...</span>';
    }
    if (statusBadge) {
      statusBadge.className = 'status-tag status-generating';
      statusBadge.textContent = 'Turbo Gen...';
    }

    if (imagesContainer) {
      imagesContainer.innerHTML = '';
      imagesContainer.className = `images-display-area grid-count-${state.count}`;
    }
    if (batchActions) batchActions.style.display = 'none';
    state.currentBatch = [];

    const totalCount = state.count || 1;

    // Immediately build and mount all card holders to screen
    const cardHolders = [];
    for (let i = 0; i < totalCount; i++) {
      const holder = document.createElement('div');
      holder.className = 'image-card-holder';
      if (imagesContainer) imagesContainer.appendChild(holder);
      cardHolders.push(holder);
    }

    // Fire all image generations simultaneously in parallel
    const promises = cardHolders.map((holder, index) => {
      const randomSeed = Math.floor(Math.random() * 90000000) + (index + 1) * 22222;
      const variationPrompt = buildFinalPrompt(rawPrompt, index);
      const imageUrl = getImageUrl(variationPrompt, randomSeed, state.width, state.height);
      const imageId = 'img_' + Date.now() + '_' + index;

      const imgData = {
        id: imageId,
        url: imageUrl,
        prompt: rawPrompt,
        fullPrompt: variationPrompt,
        style: state.style,
        ratio: state.ratio,
        width: state.width,
        height: state.height,
        variation: index + 1,
        timestamp: new Date().toISOString(),
        liked: false,
      };

      state.currentBatch.push(imgData);
      saveToHistory(imgData);

      // Mount image card immediately for instant parallel rendering
      return renderLiveImage(imgData, holder);
    });

    await Promise.allSettled(promises);

    state.isGenerating = false;
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> <span>Generate Images</span>';
    }
    if (statusBadge) {
      statusBadge.className = 'status-tag status-ready';
      statusBadge.textContent = 'Ready';
    }

    if (state.currentBatch.length > 0) {
      if (batchActions) batchActions.style.display = 'flex';
      showToast(`⚡ Generated ${state.currentBatch.length} pictures in record time!`, 'success');
    }
  }

  /**
   * Immediately mounts the card to the DOM and loads the image in parallel
   */
  function renderLiveImage(imgData, holderElement) {
    return new Promise((resolve) => {
      const card = document.createElement('div');
      card.className = 'image-card';
      card.id = imgData.id;

      const aspectRatioPadding = ((imgData.height / imgData.width) * 100).toFixed(2);

      card.innerHTML = `
        <div class="image-frame" style="padding-top: ${aspectRatioPadding}%;">
          <div class="card-loading-shimmer">
            <div class="skeleton-spinner"></div>
            <span style="font-size: 0.78rem; color: #a5b4fc; font-weight: 500; margin-top: 8px;">Loading Var #${imgData.variation || 1}...</span>
          </div>
          <img src="${imgData.url}" alt="${escapeHtml(imgData.prompt)}" loading="eager" decoding="async" style="opacity: 0; transition: opacity 0.3s ease;" />
          <div class="image-overlay">
            <div class="overlay-top">
              <span class="variation-badge">Var #${imgData.variation || 1}</span>
              <button class="icon-action-btn like-btn ${imgData.liked ? 'liked' : ''}" title="Favorite">
                <i class="fa-${imgData.liked ? 'solid' : 'regular'} fa-heart"></i>
              </button>
              <button class="icon-action-btn preview-btn" title="Full Preview / Zoom">
                <i class="fa-solid fa-expand"></i>
              </button>
            </div>
            <div class="overlay-bottom">
              <button class="btn btn-sm btn-primary download-card-btn" title="Download Image">
                <i class="fa-solid fa-download"></i> Download
              </button>
              <button class="btn btn-sm btn-outline copy-prompt-btn" title="Copy Prompt">
                <i class="fa-solid fa-copy"></i> Copy
              </button>
            </div>
          </div>
        </div>
        <div class="image-card-footer">
          <span><i class="fa-solid fa-crop-simple"></i> ${imgData.ratio}</span>
          <span><i class="fa-solid fa-palette"></i> ${formatStyleName(imgData.style)}</span>
        </div>
      `;

      // Mount into DOM immediately so the user sees the card instantly!
      holderElement.innerHTML = '';
      holderElement.appendChild(card);

      const imgElement = card.querySelector('img');
      const shimmer = card.querySelector('.card-loading-shimmer');

      imgElement.onload = () => {
        imgElement.style.opacity = '1';
        if (shimmer) shimmer.style.display = 'none';
        resolve();
      };

      imgElement.onerror = () => {
        // Instant retry with clean cache key
        setTimeout(() => {
          imgElement.src = imgData.url + '&t=' + Date.now();
        }, 1000);
      };

      // Button handlers
      const likeBtn = card.querySelector('.like-btn');
      likeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        imgData.liked = !imgData.liked;
        likeBtn.classList.toggle('liked', imgData.liked);
        likeBtn.querySelector('i').className = `fa-${imgData.liked ? 'solid' : 'regular'} fa-heart`;
        updateHistoryItem(imgData);
        showToast(imgData.liked ? 'Added to favorites ❤️' : 'Removed from favorites', 'info');
      });

      const previewBtn = card.querySelector('.preview-btn');
      previewBtn.addEventListener('click', () => openLightbox(imgData));

      const downloadBtn = card.querySelector('.download-card-btn');
      downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadImage(imgData.url, `dreamcanvas-${slugify(imgData.prompt)}-v${imgData.variation || 1}-${Date.now()}.jpg`);
      });

      const copyBtn = card.querySelector('.copy-prompt-btn');
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyToClipboard(imgData.prompt);
      });
    });
  }

  // Download All Batch
  if (downloadAllBtn) {
    downloadAllBtn.addEventListener('click', async () => {
      if (state.currentBatch.length === 0) return;
      showToast(`Downloading ${state.currentBatch.length} image variation(s)...`, 'info');
      for (let i = 0; i < state.currentBatch.length; i++) {
        const item = state.currentBatch[i];
        await new Promise((r) => setTimeout(r, 350));
        downloadImage(item.url, `dreamcanvas-batch-v${i + 1}-${Date.now()}.jpg`);
      }
    });
  }

  async function downloadImage(url, filename) {
    try {
      showToast('Downloading image...', 'info');
      const response = await fetch(url, { mode: 'cors' });
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      showToast('Download complete! 📁', 'success');
    } catch (err) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // ==========================================
  // 7. Lightbox Zoom Modal
  // ==========================================

  function openLightbox(imgData) {
    if (!lightboxModal) return;
    activeLightboxImage = imgData;
    if (lightboxImg) lightboxImg.src = imgData.url;
    if (lightboxPrompt) lightboxPrompt.textContent = `"${imgData.prompt}"`;

    if (lightboxMeta) {
      lightboxMeta.innerHTML = `
        <span><i class="fa-solid fa-layer-group"></i> Variation #${imgData.variation || 1}</span>
        <span><i class="fa-solid fa-crop-simple"></i> ${imgData.ratio}</span>
        <span><i class="fa-solid fa-palette"></i> ${formatStyleName(imgData.style)}</span>
      `;
    }
    lightboxModal.classList.add('active');
  }

  function closeLightbox() {
    if (lightboxModal) lightboxModal.classList.remove('active');
    activeLightboxImage = null;
  }

  if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
  if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);

  if (lightboxDownloadBtn) {
    lightboxDownloadBtn.addEventListener('click', () => {
      if (activeLightboxImage) {
        downloadImage(
          activeLightboxImage.url,
          `dreamcanvas-${slugify(activeLightboxImage.prompt)}-v${activeLightboxImage.variation || 1}-${Date.now()}.jpg`
        );
      }
    });
  }

  if (lightboxCopyPromptBtn) {
    lightboxCopyPromptBtn.addEventListener('click', () => {
      if (activeLightboxImage) {
        copyToClipboard(activeLightboxImage.prompt);
      }
    });
  }

  // ==========================================
  // 8. History Drawer
  // ==========================================

  function saveToHistory(imgData) {
    state.history.unshift(imgData);
    if (state.history.length > 50) state.history.pop();
    try {
      localStorage.setItem('dreamcanvas_history', JSON.stringify(state.history));
    } catch (e) {
      console.warn('Storage quota reached:', e);
    }
    updateHistoryBadge();
  }

  function updateHistoryItem(updatedData) {
    state.history = state.history.map((item) => (item.id === updatedData.id ? updatedData : item));
    localStorage.setItem('dreamcanvas_history', JSON.stringify(state.history));
  }

  function updateHistoryBadge() {
    if (historyCount) historyCount.textContent = state.history.length;
  }

  function renderHistoryDrawer() {
    if (!historyList) return;
    if (state.history.length === 0) {
      historyList.innerHTML = `
        <div style="text-align: center; padding: 40px 10px; color: var(--text-muted);">
          <i class="fa-regular fa-images" style="font-size: 2.5rem; margin-bottom: 12px; color: var(--text-sub);"></i>
          <p>No generation history yet.<br>Create your first picture!</p>
        </div>
      `;
      return;
    }

    historyList.innerHTML = state.history
      .map(
        (item) => `
      <div class="history-item" data-id="${item.id}">
        <img class="history-thumb" src="${item.url}" alt="${escapeHtml(item.prompt)}" />
        <div class="history-details">
          <div class="history-prompt" title="${escapeHtml(item.prompt)}">${escapeHtml(item.prompt)}</div>
          <div class="history-meta">
            Var #${item.variation || 1} &bull; ${item.ratio} &bull; ${formatStyleName(item.style)}
          </div>
        </div>
        <div class="history-actions">
          <button class="icon-action-btn reuse-prompt-btn" title="Use Prompt" data-id="${item.id}">
            <i class="fa-solid fa-arrow-turn-up"></i>
          </button>
          <button class="icon-action-btn delete-item-btn" title="Delete" data-id="${item.id}">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `
      )
      .join('');

    historyList.querySelectorAll('.history-thumb').forEach((thumb) => {
      thumb.addEventListener('click', (e) => {
        const id = e.target.closest('.history-item').getAttribute('data-id');
        const item = state.history.find((h) => h.id === id);
        if (item) openLightbox(item);
      });
    });

    historyList.querySelectorAll('.reuse-prompt-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        const item = state.history.find((h) => h.id === id);
        if (item && promptInput) {
          promptInput.value = item.prompt;
          state.prompt = item.prompt;
          if (charCount) charCount.textContent = item.prompt.length;
          closeHistoryDrawer();
          promptInput.focus();
          document.getElementById('generator').scrollIntoView({ behavior: 'smooth' });
          showToast('Prompt loaded into studio!', 'info');
        }
      });
    });

    historyList.querySelectorAll('.delete-item-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        state.history = state.history.filter((h) => h.id !== id);
        localStorage.setItem('dreamcanvas_history', JSON.stringify(state.history));
        updateHistoryBadge();
        renderHistoryDrawer();
        showToast('Item removed from history', 'info');
      });
    });
  }

  function openHistoryDrawer() {
    renderHistoryDrawer();
    if (historyOverlay) historyOverlay.classList.add('active');
  }

  function closeHistoryDrawer() {
    if (historyOverlay) historyOverlay.classList.remove('active');
  }

  if (historyBtn) historyBtn.addEventListener('click', openHistoryDrawer);
  if (closeHistoryBtn) closeHistoryBtn.addEventListener('click', closeHistoryDrawer);
  if (historyOverlay) {
    historyOverlay.addEventListener('click', (e) => {
      if (e.target === historyOverlay) closeHistoryDrawer();
    });
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear your generation history?')) {
        state.history = [];
        localStorage.removeItem('dreamcanvas_history');
        updateHistoryBadge();
        renderHistoryDrawer();
        showToast('Generation history cleared', 'info');
      }
    });
  }

  // ==========================================
  // 9. Notifications & Utilities
  // ==========================================

  function copyToClipboard(text) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showToast('Copied prompt to clipboard! 📋', 'success');
      })
      .catch(() => {
        showToast('Failed to copy to clipboard', 'error');
      });
  }

  function showToast(message, type = 'info') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `
      <i class="fa-solid ${icon}"></i>
      <span>${escapeHtml(message)}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s forwards ease-in';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function formatStyleName(styleKey) {
    if (!styleKey || styleKey === 'none') return 'Default';
    return styleKey
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  function slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '')
      .substring(0, 25);
  }

  function escapeHtml(unsafe) {
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  updateHistoryBadge();
}

// Start application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDreamCanvas);
} else {
  initializeDreamCanvas();
}
