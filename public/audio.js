/**
 * 그림 마피아 — 소리
 *
 * 음원 파일을 쓰지 않고 브라우저의 Web Audio API로 직접 소리를 만든다.
 * 그래서 저작권 문제가 없고, 받아올 파일도 없어 로딩이 느려지지 않는다.
 *
 * BGM은 "뇌가 살짝 멍해지는" 느낌을 노렸다:
 *  · 살짝 어긋난 두 오실레이터가 서로 맥놀이(beating)를 만들어 어질어질한 울림
 *  · 느린 LFO가 필터와 음정을 계속 흔들어 초점이 안 맞는 느낌
 *  · 5음 음계에서 아무 음이나 느긋하게 튕겨 목적 없이 붕 떠 있는 분위기
 */
(function () {
  'use strict';

  const LS_KEY = 'gm_sound';

  const state = {
    ctx: null,
    master: null,
    bgmGain: null,
    sfxGain: null,
    bgm: null, // 현재 돌아가는 BGM 노드 묶음
    enabled: localStorage.getItem(LS_KEY) !== 'off',
    unlocked: false,
    wantBgm: false,
  };

  function ensureCtx() {
    if (state.ctx) return state.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;

    const ctx = new AC();

    // 볼륨을 키워도 찌그러지지 않도록 리미터를 마지막에 하나 둔다
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.knee.value = 6;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.2;
    limiter.connect(ctx.destination);

    const master = ctx.createGain();
    master.gain.value = 1.6;
    master.connect(limiter);

    const bgmGain = ctx.createGain();
    bgmGain.gain.value = 0; // 페이드인으로 올린다
    bgmGain.connect(master);

    const sfxGain = ctx.createGain();
    sfxGain.gain.value = 1.0;
    sfxGain.connect(master);

    state.ctx = ctx;
    state.master = master;
    state.bgmGain = bgmGain;
    state.sfxGain = sfxGain;
    return ctx;
  }

  /** 브라우저 자동재생 정책 때문에 첫 클릭/터치에서 한 번 열어줘야 한다 */
  function unlock() {
    const ctx = ensureCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    state.unlocked = true;
    if (state.wantBgm && state.enabled && !state.bgm) startBgm();
  }

  /* ---------------- 효과음 ---------------- */

  function blip(opts) {
    if (!state.enabled) return;
    const ctx = ensureCtx();
    if (!ctx || ctx.state === 'suspended') return;

    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const t = ctx.currentTime;
    const dur = opts.dur || 0.14;

    o.type = opts.type || 'triangle';
    o.frequency.setValueAtTime(opts.from, t);
    if (opts.to && opts.to !== opts.from) {
      o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.to), t + dur);
    }

    const vol = opts.vol == null ? 0.3 : opts.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    o.connect(g);
    g.connect(state.sfxGain);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function noise(dur, vol, cutoff) {
    if (!state.enabled) return;
    const ctx = ensureCtx();
    if (!ctx || ctx.state === 'suspended') return;

    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);

    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = cutoff || 1800;
    const g = ctx.createGain();
    g.gain.value = vol == null ? 0.25 : vol;

    src.connect(lp);
    lp.connect(g);
    g.connect(state.sfxGain);
    src.start();
  }

  const SFX = {
    // 내 차례
    myTurn() {
      blip({ from: 520, to: 880, dur: 0.16, vol: 0.34 });
      setTimeout(() => blip({ from: 880, to: 1180, dur: 0.14, vol: 0.28 }), 110);
    },
    // 남의 차례로 넘어감
    turn() {
      blip({ from: 440, to: 560, dur: 0.11, vol: 0.2 });
    },
    // 한 획 그리기 시작 / 끝
    strokeEnd() {
      noise(0.09, 0.14, 2600);
    },
    // 시간 임박 초읽기
    tick() {
      blip({ from: 1000, to: 1000, dur: 0.06, vol: 0.22, type: 'square' });
    },
    // 페이즈 안내
    phase() {
      blip({ from: 380, to: 640, dur: 0.2, vol: 0.28 });
      setTimeout(() => blip({ from: 640, to: 520, dur: 0.22, vol: 0.22 }), 150);
    },
    // 투표 / 클릭
    vote() {
      blip({ from: 700, to: 420, dur: 0.13, vol: 0.26, type: 'sawtooth' });
    },
    // 채팅 도착
    chat() {
      blip({ from: 900, to: 1150, dur: 0.07, vol: 0.14 });
    },
    // 마피아 찬스 시작 (불안한 하강)
    danger() {
      blip({ from: 300, to: 120, dur: 0.5, vol: 0.3, type: 'sawtooth' });
    },
    // 정답
    correct() {
      [523, 659, 784, 1047].forEach((f, i) =>
        setTimeout(() => blip({ from: f, to: f, dur: 0.16, vol: 0.3 }), i * 90)
      );
    },
    // 오답 / 패배
    wrong() {
      [400, 340, 260].forEach((f, i) =>
        setTimeout(() => blip({ from: f, to: f * 0.9, dur: 0.22, vol: 0.28, type: 'square' }), i * 130)
      );
    },
    // 결과 발표 두구두구
    drum() {
      for (let i = 0; i < 8; i++) setTimeout(() => noise(0.06, 0.18, 900), i * 70);
    },
  };

  /* ---------------- BGM ---------------- */

  // 라(A) 기반 5음 음계 — 어느 음을 눌러도 안 틀리게 들려서 붕 뜬 느낌이 난다
  const SCALE = [220, 247, 294, 330, 392, 440, 494, 587];

  function startBgm() {
    if (!state.enabled) return;
    const ctx = ensureCtx();
    if (!ctx || ctx.state === 'suspended') {
      state.wantBgm = true;
      return;
    }
    if (state.bgm) return;

    const t0 = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.value = 1;
    out.connect(state.bgmGain);

    // 흐릿하게 만드는 저역 통과 필터 + 아주 느린 흔들림
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 700;
    lp.Q.value = 6;
    lp.connect(out);

    const lfo = ctx.createOscillator();
    const lfoAmt = ctx.createGain();
    lfo.frequency.value = 0.1; // 10초에 한 번 왕복
    lfoAmt.gain.value = 360;
    lfo.connect(lfoAmt);
    lfoAmt.connect(lp.frequency);
    lfo.start(t0);

    // 살짝 어긋난 두 드론 → 맥놀이로 어질어질함
    const drones = [110, 110.6].map((f) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0.24;
      o.connect(g);
      g.connect(lp);
      o.start(t0);
      return o;
    });

    // 음정을 아주 느리게 흔들어 초점이 안 맞는 느낌
    const wob = ctx.createOscillator();
    const wobAmt = ctx.createGain();
    wob.frequency.value = 0.17;
    wobAmt.gain.value = 1.8;
    wob.connect(wobAmt);
    drones.forEach((o) => wobAmt.connect(o.frequency));
    wob.start(t0);

    // 목적 없이 느긋하게 튕기는 음들
    const timer = setInterval(() => {
      if (!state.enabled || !state.bgm) return;
      if (Math.random() < 0.18) return; // 가끔 쉬어서 더 멍하게
      const f = SCALE[Math.floor(Math.random() * SCALE.length)];
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const t = ctx.currentTime;
      o.type = 'triangle';
      o.frequency.setValueAtTime(f, t);
      o.frequency.linearRampToValueAtTime(f * (0.985 + Math.random() * 0.03), t + 1.0); // 음이 살짝 흘러내림
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.2, t + 0.16);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.15);
      o.connect(g);
      g.connect(lp);
      o.start(t);
      o.stop(t + 1.25);
    }, 820);

    state.bgm = { out, lp, lfo, wob, drones, timer };
    state.wantBgm = true;

    // 부드럽게 페이드인
    state.bgmGain.gain.cancelScheduledValues(t0);
    state.bgmGain.gain.setValueAtTime(state.bgmGain.gain.value, t0);
    state.bgmGain.gain.linearRampToValueAtTime(0.6, t0 + 1.5);
  }

  function stopBgm(keepWant) {
    if (!keepWant) state.wantBgm = false;
    const b = state.bgm;
    if (!b || !state.ctx) return;
    const ctx = state.ctx;
    const t = ctx.currentTime;

    state.bgmGain.gain.cancelScheduledValues(t);
    state.bgmGain.gain.setValueAtTime(state.bgmGain.gain.value, t);
    state.bgmGain.gain.linearRampToValueAtTime(0.0001, t + 0.8);

    clearInterval(b.timer);
    setTimeout(() => {
      try {
        b.drones.forEach((o) => o.stop());
        b.lfo.stop();
        b.wob.stop();
        b.out.disconnect();
      } catch (_) {
        /* 이미 멈춘 경우 무시 */
      }
    }, 900);
    state.bgm = null;
  }

  /* ---------------- 외부 인터페이스 ---------------- */

  window.GMAudio = {
    unlock,
    isEnabled: () => state.enabled,
    setEnabled(on) {
      state.enabled = !!on;
      localStorage.setItem(LS_KEY, on ? 'on' : 'off');
      if (!on) stopBgm(true);
      else {
        unlock();
        if (state.wantBgm) startBgm();
      }
      return state.enabled;
    },
    sfx(name) {
      const fn = SFX[name];
      if (fn) {
        try {
          fn();
        } catch (_) {
          /* 소리는 실패해도 게임에 영향 없게 무시 */
        }
      }
    },
    startBgm() {
      state.wantBgm = true;
      if (state.enabled) startBgm();
    },
    stopBgm: () => stopBgm(false),
  };

  // 첫 사용자 동작에서 오디오를 열어둔다
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) =>
    window.addEventListener(ev, unlock, { once: true, passive: true })
  );
})();
