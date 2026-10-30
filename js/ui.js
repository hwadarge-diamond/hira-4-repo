// RUN AND RUN - UI & HUD Engine
// Glassmorphism panels, futuristic Orbitron typography, hype combo banners, garage shop, missions, settings
import { audio } from './audio.js';

export class UIManager {
  constructor(game) {
    this.game = game;

    // Cache DOM Elements
    this.hud = document.getElementById('hud');
    this.scoreEl = document.getElementById('hud-score');
    this.distanceEl = document.getElementById('hud-distance');
    this.coinsEl = document.getElementById('hud-coins');
    this.comboEl = document.getElementById('hud-combo');
    this.comboTierEl = document.getElementById('hud-combo-tier');
    this.energyBarEl = document.getElementById('hud-energy-bar');
    this.energyHintEl = document.getElementById('hud-energy-hint');
    this.threatEl = document.getElementById('hud-threat');
    this.threatDistEl = document.getElementById('hud-threat-dist');
    this.zoneBannerEl = document.getElementById('zone-banner');
    this.zoneTitleEl = document.getElementById('zone-title');
    this.zoneDescEl = document.getElementById('zone-desc');
    this.popupsContainer = document.getElementById('popups-container');

    // Powerup indicators
    this.powerupsHud = document.getElementById('hud-powerups');
    this.shieldIndicator = document.getElementById('p-shield');
    this.magnetIndicator = document.getElementById('p-magnet');
    this.multIndicator = document.getElementById('p-multiplier');
    this.jetpackIndicator = document.getElementById('p-jetpack');

    // Form buttons
    this.btnFormRunner = document.getElementById('btn-form-runner');
    this.btnFormDrone = document.getElementById('btn-form-drone');
    this.btnFormOrb = document.getElementById('btn-form-orb');

    // Modals
    this.mainMenu = document.getElementById('main-menu');
    this.pauseMenu = document.getElementById('pause-menu');
    this.gameOverMenu = document.getElementById('game-over-menu');
    this.shopMenu = document.getElementById('shop-menu');
    this.missionsMenu = document.getElementById('missions-menu');
    this.settingsMenu = document.getElementById('settings-menu');
    this.controlsModal = document.getElementById('controls-modal');

    // Game over stats
    this.goScoreEl = document.getElementById('go-score');
    this.goBestEl = document.getElementById('go-best');
    this.goDistEl = document.getElementById('go-distance');
    this.goCoinsEl = document.getElementById('go-coins');
    this.goNearMissEl = document.getElementById('go-nearmiss');
    this.goModeTag = document.getElementById('go-mode-tag');

    // Menu stats
    this.menuBestEl = document.getElementById('menu-best');
    this.menuCoinsEl = document.getElementById('menu-coins');
    this.shopCoinsEl = document.getElementById('shop-coins');

    // State
    this.lastForm = 'RUNNER';
    this.comboTimer = null;

    this.bindEvents();
  }

  bindEvents() {
    // Menu buttons
    document.getElementById('btn-play').addEventListener('click', () => {
      audio.playUIClick();
      this.game.startRun(false);
    });

    document.getElementById('btn-daily').addEventListener('click', () => {
      audio.playUIClick();
      this.game.startRun(true);
    });

    document.getElementById('btn-shop').addEventListener('click', () => {
      audio.playUIClick();
      this.openShop();
    });

    document.getElementById('btn-missions').addEventListener('click', () => {
      audio.playUIClick();
      this.openMissions();
    });

    document.getElementById('btn-settings').addEventListener('click', () => {
      audio.playUIClick();
      this.openSettings();
    });

    document.getElementById('btn-controls').addEventListener('click', () => {
      audio.playUIClick();
      this.controlsModal.classList.remove('hidden');
    });

    // Pause Menu
    document.getElementById('btn-pause').addEventListener('click', () => {
      audio.playUIClick();
      this.game.togglePause();
    });

    document.getElementById('btn-resume').addEventListener('click', () => {
      audio.playUIClick();
      this.game.togglePause();
    });

    document.getElementById('btn-pause-restart').addEventListener('click', () => {
      audio.playUIClick();
      this.pauseMenu.classList.add('hidden');
      this.game.startRun(this.game.isDailyMode);
    });

    document.getElementById('btn-pause-menu').addEventListener('click', () => {
      audio.playUIClick();
      this.pauseMenu.classList.add('hidden');
      this.showMainMenu();
    });

    // Game Over Menu
    document.getElementById('btn-restart').addEventListener('click', () => {
      audio.playUIClick();
      this.game.startRun(this.game.isDailyMode);
    });

    document.getElementById('btn-go-menu').addEventListener('click', () => {
      audio.playUIClick();
      this.gameOverMenu.classList.add('hidden');
      this.showMainMenu();
    });

    document.getElementById('btn-share').addEventListener('click', () => {
      audio.playUIClick();
      this.copyShareScore();
    });

    // Close buttons for modals
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        audio.playUIClick();
        const target = e.target.closest('.modal-panel');
        if (target) target.classList.add('hidden');
      });
    });

    // Form HUD Switchers
    this.btnFormRunner.addEventListener('click', () => {
      this.game.player.setForm('RUNNER');
    });
    this.btnFormDrone.addEventListener('click', () => {
      this.game.player.setForm('DRONE');
    });
    this.btnFormOrb.addEventListener('click', () => {
      this.game.player.setForm('ORB');
    });

    // Mobile Action buttons
    const btnJump = document.getElementById('btn-mobile-jump');
    if (btnJump) {
      btnJump.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.game.player.jump();
      });
    }

    const btnSlide = document.getElementById('btn-mobile-slide');
    if (btnSlide) {
      btnSlide.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.game.player.slide();
      });
    }

    const btnOverclock = document.getElementById('btn-mobile-overclock');
    if (btnOverclock) {
      btnOverclock.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.game.player.toggleOverclock(true);
      });
      btnOverclock.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.game.player.toggleOverclock(false);
      });
    }

    // Audio Settings Sliders
    const sfxSlider = document.getElementById('setting-sfx-vol');
    if (sfxSlider) {
      sfxSlider.value = audio.sfxVolume * 100;
      sfxSlider.addEventListener('input', (e) => {
        audio.setSfxVolume(e.target.value / 100);
      });
    }

    const musicSlider = document.getElementById('setting-music-vol');
    if (musicSlider) {
      musicSlider.value = audio.musicVolume * 100;
      musicSlider.addEventListener('input', (e) => {
        audio.setMusicVolume(e.target.value / 100);
      });
    }

    // Bloom Toggle
    const bloomToggle = document.getElementById('setting-bloom');
    if (bloomToggle) {
      bloomToggle.checked = this.game.useBloom;
      bloomToggle.addEventListener('change', (e) => {
        this.game.setBloom(e.target.checked);
      });
    }
  }

  showMainMenu() {
    this.mainMenu.classList.remove('hidden');
    this.hud.classList.add('hidden');
    this.pauseMenu.classList.add('hidden');
    this.gameOverMenu.classList.add('hidden');
    this.shopMenu.classList.add('hidden');
    this.missionsMenu.classList.add('hidden');
    this.settingsMenu.classList.add('hidden');

    this.menuBestEl.textContent = this.game.saveData.bestScore.toLocaleString();
    this.menuCoinsEl.textContent = this.game.saveData.coins.toLocaleString();
  }

  showHUD() {
    this.mainMenu.classList.add('hidden');
    this.hud.classList.remove('hidden');
    this.pauseMenu.classList.add('hidden');
    this.gameOverMenu.classList.add('hidden');
  }

  showGameOver(stats) {
    this.hud.classList.add('hidden');
    this.gameOverMenu.classList.remove('hidden');

    this.goScoreEl.textContent = Math.floor(stats.score).toLocaleString();
    this.goBestEl.textContent = this.game.saveData.bestScore.toLocaleString();
    this.goDistEl.textContent = Math.floor(stats.distance) + ' m';
    this.goCoinsEl.textContent = stats.coinsRun.toLocaleString();
    this.goNearMissEl.textContent = stats.nearMisses;
    this.goModeTag.textContent = stats.isDaily ? 'DAILY CHALLENGE' : 'STANDARD RUN';
  }

  updateHUD(stats, player, powerups, hunterDist) {
    // Score & Distance
    this.scoreEl.textContent = Math.floor(stats.score).toLocaleString();
    this.distanceEl.textContent = Math.floor(stats.distance) + 'm';
    this.coinsEl.textContent = stats.coinsRun.toLocaleString();

    // Combo & Tiers
    const combo = stats.combo;
    if (combo > 1) {
      this.comboEl.classList.remove('hidden');
      document.getElementById('hud-combo-val').textContent = 'x' + combo;

      let tier = 'SWEET';
      if (combo >= 5) tier = 'MAX FLOWSTATE 💎';
      else if (combo >= 4) tier = 'GOATED 🔥';
      else if (combo >= 3) tier = 'COOKING 🚀';
      else if (combo >= 2) tier = 'SAVAGE ⚡';
      this.comboTierEl.textContent = tier;
    } else {
      this.comboEl.classList.add('hidden');
    }

    // Energy Bar
    const energyPct = Math.max(0, Math.min(100, player.energy));
    this.energyBarEl.style.width = energyPct + '%';
    if (energyPct >= 99) {
      this.energyBarEl.classList.add('pulse-ready');
      this.energyHintEl.textContent = 'READY! [HOLD SHIFT]';
    } else if (player.isOverclock) {
      this.energyBarEl.classList.add('pulse-active');
      this.energyHintEl.textContent = 'OVERCLOCK ACTIVE!';
    } else {
      this.energyBarEl.classList.remove('pulse-ready', 'pulse-active');
      this.energyHintEl.textContent = 'NEURAL OVERCLOCK';
    }

    // Threat Radar
    const threatM = Math.floor(hunterDist);
    this.threatDistEl.textContent = threatM + 'm';
    if (threatM < 18) {
      this.threatEl.classList.add('threat-danger');
    } else {
      this.threatEl.classList.remove('threat-danger');
    }

    // Form Switcher Highlight
    if (player.form !== this.lastForm) {
      this.lastForm = player.form;
      this.btnFormRunner.classList.toggle('active', player.form === 'RUNNER');
      this.btnFormDrone.classList.toggle('active', player.form === 'DRONE');
      this.btnFormOrb.classList.toggle('active', player.form === 'ORB');
    }

    // Powerup Indicators
    const eff = powerups.activeEffects;
    this.shieldIndicator.classList.toggle('active', eff.shield);
    this.magnetIndicator.classList.toggle('active', eff.magnetTimer > 0);
    this.multIndicator.classList.toggle('active', eff.multiplierTimer > 0);
    this.jetpackIndicator.classList.toggle('active', eff.jetpackTimer > 0);
  }

  showZoneBanner(title, desc) {
    this.zoneTitleEl.textContent = title;
    this.zoneDescEl.textContent = desc;
    this.zoneBannerEl.classList.remove('hidden');
    this.zoneBannerEl.classList.add('banner-slide');

    setTimeout(() => {
      this.zoneBannerEl.classList.remove('banner-slide');
      this.zoneBannerEl.classList.add('hidden');
    }, 3200);
  }

  spawnPopup(text, type = 'hype') {
    const el = document.createElement('div');
    el.className = `popup-hype ${type}`;
    el.textContent = text;
    this.popupsContainer.appendChild(el);

    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1100);
  }

  // SHOP (CYBER GARAGE)
  openShop() {
    this.shopMenu.classList.remove('hidden');
    this.shopCoinsEl.textContent = this.game.saveData.coins.toLocaleString();
    this.renderShopItems();
  }

  renderShopItems() {
    const container = document.getElementById('shop-items-grid');
    container.innerHTML = '';

    const skins = [
      { id: 'striker', name: 'NEON STRIKER', price: 0, desc: 'Original Cyber Ninja Suit' },
      { id: 'samurai', name: 'CYBER SAMURAI', price: 150, desc: 'Crimson Plasma Blade Armor' },
      { id: 'vapor', name: 'SYNTH VAPOR', price: 300, desc: 'Hot Pink & Cyan Outrun Glider' },
      { id: 'quantum', name: 'QUANTUM APEX', price: 600, desc: 'Zero-G Emerald Singularity' },
      { id: 'valkyrie', name: 'MECHA VALKYRIE', price: 1000, desc: 'Pure Solar Gold Plating' }
    ];

    skins.forEach(skin => {
      const isOwned = this.game.saveData.unlockedSkins.includes(skin.id);
      const isEquipped = this.game.saveData.selectedSkin === skin.id;

      const card = document.createElement('div');
      card.className = `shop-card ${isEquipped ? 'equipped' : ''}`;
      card.innerHTML = `
        <div class="shop-card-title">${skin.name}</div>
        <div class="shop-card-desc">${skin.desc}</div>
        <div class="shop-card-price">${isOwned ? 'OWNED' : `${skin.price} BITS`}</div>
        <button class="shop-btn ${isEquipped ? 'btn-equipped' : isOwned ? 'btn-equip' : 'btn-buy'}">
          ${isEquipped ? 'EQUIPPED' : isOwned ? 'EQUIP' : 'UNLOCK'}
        </button>
      `;

      const btn = card.querySelector('.shop-btn');
      btn.addEventListener('click', () => {
        audio.playUIClick();
        if (isOwned) {
          this.game.equipSkin(skin.id);
          this.renderShopItems();
        } else if (this.game.saveData.coins >= skin.price) {
          this.game.buySkin(skin.id, skin.price);
          this.shopCoinsEl.textContent = this.game.saveData.coins.toLocaleString();
          this.renderShopItems();
        } else {
          this.spawnPopup('NEED MORE COINS!', 'warn');
        }
      });

      container.appendChild(card);
    });
  }

  // MISSIONS MODAL
  openMissions() {
    this.missionsMenu.classList.remove('hidden');
    this.renderMissionsList();
  }

  renderMissionsList() {
    const list = document.getElementById('missions-list');
    list.innerHTML = '';

    this.game.missions.forEach((m, idx) => {
      const card = document.createElement('div');
      card.className = 'mission-card';
      const pct = Math.min(100, Math.floor((m.progress / m.target) * 100));
      const isComplete = m.progress >= m.target;

      card.innerHTML = `
        <div class="mission-info">
          <div class="mission-title">${m.title}</div>
          <div class="mission-reward">+${m.reward} BITS</div>
        </div>
        <div class="mission-bar-bg">
          <div class="mission-bar-fill" style="width: ${pct}%"></div>
        </div>
        <div class="mission-status">${m.progress} / ${m.target} ${isComplete ? (m.claimed ? '(CLAIMED)' : 'COMPLETED!') : ''}</div>
        ${isComplete && !m.claimed ? `<button class="btn-claim-mission" data-idx="${idx}">CLAIM REWARD</button>` : ''}
      `;

      const claimBtn = card.querySelector('.btn-claim-mission');
      if (claimBtn) {
        claimBtn.addEventListener('click', () => {
          audio.playPowerup();
          this.game.claimMission(idx);
          this.renderMissionsList();
        });
      }

      list.appendChild(card);
    });
  }

  openSettings() {
    this.settingsMenu.classList.remove('hidden');
  }

  copyShareScore() {
    const text = `⚡ I scored ${this.goScoreEl.textContent} in RUN AND RUN (3D Cyberpunk Endless Runner)! Can you beat me? 🚀`;
    navigator.clipboard.writeText(text).then(() => {
      this.spawnPopup('SCORE COPIED TO CLIPBOARD! 🔥', 'hype');
    }).catch(() => {
      this.spawnPopup('COPIED!', 'hype');
    });
  }
}
