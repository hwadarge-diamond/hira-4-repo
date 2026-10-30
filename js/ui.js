// RUN AND RUN: NETAJI IN EUROPE - UI & HUD Engine
// Cream white card styling, Netaji's Wardrobe shop, Directive missions, crowd radar
import { audio } from './audio.js';

export class UIManager {
  constructor(game) {
    this.game = game;

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

    this.powerupsHud = document.getElementById('hud-powerups');
    this.shieldIndicator = document.getElementById('p-shield');
    this.magnetIndicator = document.getElementById('p-magnet');
    this.multIndicator = document.getElementById('p-multiplier');
    this.jetpackIndicator = document.getElementById('p-jetpack');

    this.btnFormRunner = document.getElementById('btn-form-runner');
    this.btnFormDrone = document.getElementById('btn-form-drone');
    this.btnFormOrb = document.getElementById('btn-form-orb');

    this.mainMenu = document.getElementById('main-menu');
    this.pauseMenu = document.getElementById('pause-menu');
    this.gameOverMenu = document.getElementById('game-over-menu');
    this.shopMenu = document.getElementById('shop-menu');
    this.missionsMenu = document.getElementById('missions-menu');
    this.settingsMenu = document.getElementById('settings-menu');
    this.controlsModal = document.getElementById('controls-modal');

    this.goScoreEl = document.getElementById('go-score');
    this.goBestEl = document.getElementById('go-best');
    this.goDistEl = document.getElementById('go-distance');
    this.goCoinsEl = document.getElementById('go-coins');
    this.goNearMissEl = document.getElementById('go-nearmiss');
    this.goModeTag = document.getElementById('go-mode-tag');

    this.menuBestEl = document.getElementById('menu-best');
    this.menuCoinsEl = document.getElementById('menu-coins');
    this.shopCoinsEl = document.getElementById('shop-coins');

    this.lastForm = 'RUNNER';
    this.bindEvents();
  }

  bindEvents() {
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

    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        audio.playUIClick();
        const target = e.target.closest('.modal-panel');
        if (target) target.classList.add('hidden');
      });
    });

    this.btnFormRunner.addEventListener('click', () => {
      this.game.player.setForm('RUNNER');
    });
    this.btnFormDrone.addEventListener('click', () => {
      this.game.player.setForm('DRONE');
    });
    this.btnFormOrb.addEventListener('click', () => {
      this.game.player.setForm('ORB');
    });

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
    this.goModeTag.textContent = 'SWARMED BY THE EXCITED VOTERS & MEDIA!';
  }

  updateHUD(stats, player, powerups, crowdDist) {
    this.scoreEl.textContent = Math.floor(stats.score).toLocaleString();
    this.distanceEl.textContent = Math.floor(stats.distance) + 'm';
    this.coinsEl.textContent = stats.coinsRun.toLocaleString();

    const combo = stats.combo;
    if (combo > 1) {
      this.comboEl.classList.remove('hidden');
      document.getElementById('hud-combo-val').textContent = 'x' + combo;

      let tier = 'SWEET';
      if (combo >= 5) tier = 'MAX HAWA 🔥';
      else if (combo >= 4) tier = 'FULL JOSH ⚡';
      else if (combo >= 3) tier = 'SPEED NETA 🚀';
      else if (combo >= 2) tier = 'CLEAN SPRINT';
      this.comboTierEl.textContent = tier;
    } else {
      this.comboEl.classList.add('hidden');
    }

    const energyPct = Math.max(0, Math.min(100, player.energy));
    this.energyBarEl.style.width = energyPct + '%';
    if (energyPct >= 99) {
      this.energyBarEl.classList.add('pulse-ready');
      this.energyHintEl.textContent = 'CHAI POWER READY! [HOLD SHIFT]';
    } else if (player.isOverclock) {
      this.energyBarEl.classList.add('pulse-active');
      this.energyHintEl.textContent = 'CHAI TURBO ACTIVE!';
    } else {
      this.energyBarEl.classList.remove('pulse-ready', 'pulse-active');
      this.energyHintEl.textContent = 'CHAI ENERGY [HOLD SHIFT]';
    }

    // Public Crowd Distance
    const distM = Math.floor(crowdDist);
    this.threatDistEl.textContent = distM + 'm';
    if (distM < 18) {
      this.threatEl.classList.add('threat-danger');
    } else {
      this.threatEl.classList.remove('threat-danger');
    }

    if (player.form !== this.lastForm) {
      this.lastForm = player.form;
      this.btnFormRunner.classList.toggle('active', player.form === 'RUNNER');
      this.btnFormDrone.classList.toggle('active', player.form === 'DRONE');
      this.btnFormOrb.classList.toggle('active', player.form === 'ORB');
    }

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

  openShop() {
    this.shopMenu.classList.remove('hidden');
    this.shopCoinsEl.textContent = this.game.saveData.coins.toLocaleString();
    this.renderShopItems();
  }

  renderShopItems() {
    const container = document.getElementById('shop-items-grid');
    container.innerHTML = '';

    const skins = [
      { id: 'classic', name: 'SAFFRON KHADI', price: 0, desc: 'Classic Modi Vest & Tiranga Gamcha' },
      { id: 'royal',   name: 'ROYAL BLUE', price: 150, desc: 'Silk Waistcoat with Golden Pocket Square' },
      { id: 'emerald', name: 'GREEN KHADI', price: 300, desc: 'Eco-Friendly Grassroots Cotton Vest' },
      { id: 'velvet',  name: 'MAROON VELVET', price: 600, desc: 'VIP State Banquet Gala Coat' },
      { id: 'gold',    name: 'MAHARAJA GOLD', price: 1000, desc: 'Pure Zari Gold Royal Attire' }
    ];

    skins.forEach(skin => {
      const isOwned = this.game.saveData.unlockedSkins.includes(skin.id);
      const isEquipped = this.game.saveData.selectedSkin === skin.id;

      const card = document.createElement('div');
      card.className = `shop-card ${isEquipped ? 'equipped' : ''}`;
      card.innerHTML = `
        <div class="shop-card-title">${skin.name}</div>
        <div class="shop-card-desc">${skin.desc}</div>
        <div class="shop-card-price">${isOwned ? 'OWNED' : `${skin.price} LADDOOS`}</div>
        <button class="shop-btn ${isEquipped ? 'btn-equipped' : isOwned ? 'btn-equip' : 'btn-buy'}">
          ${isEquipped ? 'EQUIPPED' : isOwned ? 'WEAR' : 'UNLOCK'}
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
          this.spawnPopup('NEED MORE LADDOOS!', 'warn');
        }
      });

      container.appendChild(card);
    });
  }

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
          <div class="mission-reward">+${m.reward} LADDOOS</div>
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
    const text = `🏃‍♂️ I ran ${this.goDistEl.textContent} and scored ${this.goScoreEl.textContent} in RUN NETAJI RUN (European Tour 3D)! Can you evade the crowd? ⚡`;
    navigator.clipboard.writeText(text).then(() => {
      this.spawnPopup('SCORE COPIED! SHARE WITH FRIENDS 🔥', 'hype');
    }).catch(() => {
      this.spawnPopup('COPIED!', 'hype');
    });
  }
}
