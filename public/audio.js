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
    limiter: null, // 최종 출력단 (iOS에서는 여기서 <audio>로 빠진다)
    mediaEl: null, // iOS 무음 스위치 우회용 <audio>
    enabled: localStorage.getItem(LS_KEY) !== 'off',
    unlocked: false,
    wantBgm: false,
  };

  const IS_IOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

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

    /* iPhone은 측면의 무음(벨소리) 스위치가 켜져 있으면 Web Audio 소리를 그냥 삼킨다.
       출력을 <audio> 요소로 한 번 거치면 "미디어 재생"으로 취급돼 무음 스위치와 무관하게 들린다. */
    let routed = false;
    if (IS_IOS && ctx.createMediaStreamDestination) {
      try {
        const msd = ctx.createMediaStreamDestination();
        limiter.connect(msd);
        const el = document.createElement('audio');
        el.srcObject = msd.stream;
        el.playsInline = true;
        el.setAttribute('playsinline', '');
        el.autoplay = true;
        el.muted = false;
        el.volume = 1;
        el.style.display = 'none';
        document.body.appendChild(el);
        const p = el.play();
        if (p && p.catch) p.catch(() => {});
        state.mediaEl = el;
        routed = true;
      } catch (_) {
        routed = false;
      }
    }
    // iOS 경로가 실패했으면 평소처럼 스피커로 직접 보낸다
    if (!routed) limiter.connect(ctx.destination);
    state.limiter = limiter;

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

  /**
   * 브라우저 자동재생 정책 때문에 사용자 동작 안에서 열어줘야 한다.
   * 모바일은 한 번 실패하는 경우가 많아, 열릴 때까지 매 터치마다 다시 시도한다.
   */
  function unlock() {
    const ctx = ensureCtx();
    if (!ctx) return;

    // 아주 짧은 무음을 제스처 안에서 재생 — 모바일에서 오디오가 실제로 열리게 하는 관문
    try {
      const b = ctx.createBuffer(1, 1, ctx.sampleRate);
      const s = ctx.createBufferSource();
      s.buffer = b;
      s.connect(state.limiter || ctx.destination);
      s.start(0);
    } catch (_) {
      /* 무시 */
    }

    if (ctx.state === 'suspended') {
      const p = ctx.resume();
      if (p && p.then) p.then(() => afterUnlock()).catch(() => {});
    }
    if (state.mediaEl && state.mediaEl.paused) {
      const p2 = state.mediaEl.play();
      if (p2 && p2.catch) p2.catch(() => {});
    }
    afterUnlock();
  }

  function afterUnlock() {
    if (!state.ctx || state.ctx.state !== 'running') return;
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

  /* ---------------- BGM ----------------
   *
   * 지속음(드론) 없음. 짧게 튕기는 음만 써서 "웅웅" 울리지 않는다.
   * 레퍼런스 음악을 분석한 결과(75~100 BPM, 평균 78)에 맞춰 80 BPM으로 잡았고,
   * Am - F - C - G 네 마디를 돌리는 코드 진행 위에 베이스·화음·멜로디·하이햇을 얹는다.
   */

  const BPM = 80;
  const STEP = 60 / BPM / 4; // 16분음표 길이(초)
  const BAR_STEPS = 16;

  // 마디별 코드: bass = 베이스 음, chord = 화음 3음, mel = 멜로디로 쓸 음들 (MIDI 번호)
  const PROG = [
    { bass: 45, chord: [57, 60, 64], mel: [69, 72, 76, 64, 60] }, // Am
    { bass: 41, chord: [53, 57, 60], mel: [65, 69, 72, 60, 57] }, // F
    { bass: 48, chord: [60, 64, 67], mel: [72, 76, 79, 67, 64] }, // C
    { bass: 43, chord: [55, 59, 62], mel: [67, 71, 74, 62, 59] }, // G
  ];

  const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  /** 짧게 튕기는 음 하나 */
  function pluck(ctx, dest, when, midi, dur, vol, type) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'triangle';
    o.frequency.value = midiHz(midi);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(dest);
    o.start(when);
    o.stop(when + dur + 0.02);
  }

  /** 하이햇/킥용 짧은 노이즈 */
  function hit(ctx, dest, when, dur, vol, cutoff, hp) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = hp ? 'highpass' : 'lowpass';
    f.frequency.value = cutoff;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(f);
    f.connect(g);
    g.connect(dest);
    src.start(when);
  }

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

    // 날카로움만 살짝 깎는 정도. 공명(Q)을 올리지 않아 울림이 생기지 않는다.
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3200;
    lp.Q.value = 0.7;
    lp.connect(out);

    const bgm = { out, lp, step: 0, next: t0 + 0.1, timer: null };

    /* 한 스텝(16분음표)에 무엇을 울릴지 정하고 미리 예약한다.
       미리 예약해두는 방식이라 브라우저가 바빠도 리듬이 흐트러지지 않는다. */
    function scheduleStep(step, when) {
      const bar = Math.floor(step / BAR_STEPS) % PROG.length;
      const s = step % BAR_STEPS;
      const c = PROG[bar];

      // 베이스: 1박 / 3박 + 3박 뒤꾸밈
      if (s === 0) pluck(ctx, lp, when, c.bass, 0.3, 0.34, 'triangle');
      if (s === 8) pluck(ctx, lp, when, c.bass, 0.26, 0.3, 'triangle');
      if (s === 11) pluck(ctx, lp, when, c.bass + 12, 0.16, 0.16, 'triangle');

      // 화음 스탭: 2박 / 4박에 짧게 (엇박 느낌)
      if (s === 4 || s === 12) {
        c.chord.forEach((m, i) => pluck(ctx, lp, when + i * 0.006, m, 0.19, 0.12, 'square'));
      }

      // 멜로디: 느긋하게 몇 군데만
      const MEL_STEPS = [2, 6, 9, 14];
      if (MEL_STEPS.indexOf(s) >= 0) {
        const m = c.mel[Math.floor(Math.random() * c.mel.length)];
        pluck(ctx, lp, when, m, 0.34, 0.15, 'triangle');
      }

      // 킥: 1박 / 3박
      if (s === 0 || s === 8) hit(ctx, lp, when, 0.1, 0.3, 180, false);
      // 하이햇: 8분음표마다, 엇박은 조금 크게
      if (s % 2 === 0) hit(ctx, lp, when, 0.03, s % 4 === 2 ? 0.1 : 0.055, 7000, true);
    }

    // 100ms 앞을 내다보며 예약
    bgm.timer = setInterval(() => {
      if (!state.enabled || state.bgm !== bgm) return;
      const now = ctx.currentTime;
      while (bgm.next < now + 0.2) {
        scheduleStep(bgm.step, bgm.next);
        bgm.step++;
        bgm.next += STEP;
      }
    }, 40);

    state.bgm = bgm;
    state.wantBgm = true;

    // 부드럽게 페이드인
    state.bgmGain.gain.cancelScheduledValues(t0);
    state.bgmGain.gain.setValueAtTime(state.bgmGain.gain.value, t0);
    state.bgmGain.gain.linearRampToValueAtTime(1.15, t0 + 1.2);
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
    state.bgm = null; // 예약 루프가 더 이상 소리를 넣지 않게 먼저 끊는다
    setTimeout(() => {
      try {
        b.lp.disconnect();
        b.out.disconnect();
      } catch (_) {
        /* 이미 정리된 경우 무시 */
      }
    }, 900);
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
        // 켰을 때 바로 들리는 확인음 (소리가 나는지 즉시 알 수 있게)
        setTimeout(() => SFX.myTurn(), 60);
        if (state.wantBgm) startBgm();
      }
      return state.enabled;
    },

    /** 소리가 안 날 때 원인 파악용 */
    debug() {
      const ctx = state.ctx;
      return {
        enabled: state.enabled,
        ctxExists: !!ctx,
        ctxState: ctx ? ctx.state : null,
        sampleRate: ctx ? ctx.sampleRate : null,
        isIOS: IS_IOS,
        iosMediaRoute: !!state.mediaEl,
        mediaPaused: state.mediaEl ? state.mediaEl.paused : null,
        mediaMuted: state.mediaEl ? state.mediaEl.muted : null,
        bgmRunning: !!state.bgm,
        wantBgm: state.wantBgm,
        ua: navigator.userAgent.slice(0, 120),
      };
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

  /* 오디오가 열릴 때까지 사용자 동작마다 계속 재시도한다.
     (한 번만 시도하면 모바일에서 실패했을 때 영구히 소리가 안 난다) */
  function onGesture() {
    if (!state.ctx || state.ctx.state !== 'running') unlock();
    else afterUnlock();
  }
  ['pointerdown', 'touchend', 'keydown'].forEach((ev) =>
    window.addEventListener(ev, onGesture, { passive: true })
  );

  /* 탭을 다른 곳으로 넘기거나 창을 최소화하면 소리를 멈춘다.
     안 그러면 게임을 열어둔 걸 잊었을 때 계속 음악이 흘러나온다.
     돌아오면 원래 듣고 있었던 경우에만 다시 켠다. */
  let pausedByHide = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (state.bgm) {
        pausedByHide = true;
        stopBgm(true); // wantBgm은 유지 → 돌아오면 복귀
      }
    } else if (pausedByHide) {
      pausedByHide = false;
      if (state.enabled && state.wantBgm) startBgm();
    }
  });

  // 창을 닫거나 새로고침할 때 소리를 확실히 끊는다
  window.addEventListener('pagehide', () => {
    stopBgm(true);
    if (state.ctx && state.ctx.state === 'running') {
      try {
        state.ctx.suspend();
      } catch (_) {
        /* 무시 */
      }
    }
  });
})();
