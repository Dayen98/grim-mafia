/**
 * 그림 마피아 - Socket.io 게임 서버
 *
 * 모든 방/게임 상태는 서버 메모리(rooms Map)에만 저장됩니다. (DB 없음, 재시작 시 초기화)
 */
'use strict';

const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;

/* ------------------------------------------------------------------ */
/* 설정값                                                              */
/* ------------------------------------------------------------------ */

const CONFIG = {
  MIN_PLAYERS: 4,
  MAX_PLAYERS: 12,
  LAPS: 2, // 총 몇 바퀴 그릴지 (한 바퀴 = 각자 한 획)
  TURN_MS: 15_000, // 그리기 턴 제한시간 (한 획을 끝내면 즉시 다음 사람)
  REVEAL_MS: 10_000, // 역할 + 룰 확인 시간
  DISCUSS_MS: 60_000, // 토론 시간 (전원 동의 시 조기 종료)
  VOTE_MS: 30_000, // 투표 시간
  GUESS_MS: 30_000, // 잡힌 마피아의 단어 맞히기 시간 (주관식이라 조금 넉넉하게)
  GUESS_OPTIONS: 6, // 맞히기 보기 개수 (choice 모드에서만 사용)
  GUESS_MODE: 'text', // 'text' = 주관식 입력 / 'choice' = 객관식(헷갈리는 보기)
  MAX_STROKES: 600, // 라운드당 최대 획 수 (안전장치)
  MAX_POINTS_PER_STROKE: 3000,
  MAX_CHAT: 200,
};

// 인원이 늘수록 마피아도 늘린다 (4~5명 1명 / 6~8명 2명 / 9명 이상 3명)
function mafiaCountFor(playerCount) {
  if (playerCount >= 9) return 3;
  if (playerCount >= 6) return 2;
  return 1;
}

// 인원이 많으면 2바퀴가 너무 길어지므로 바퀴 수를 줄인다
function lapsFor(playerCount) {
  if (playerCount >= 9) return 1;
  return CONFIG.LAPS;
}

const PALETTE = ['#111827', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ffffff'];
const SIZES = [3, 6, 12, 24];

const CATEGORIES = {
  동물: ['기린', '코끼리', '펭귄', '사자', '문어', '고래', '다람쥐', '악어', '부엉이', '토끼', '거북이', '상어', '고슴도치', '캥거루', '판다'],
  음식: ['피자', '김밥', '라면', '치킨', '수박', '아이스크림', '햄버거', '초밥', '떡볶이', '바나나', '계란후라이', '도넛', '샌드위치', '팝콘', '케이크'],
  직업: ['소방관', '의사', '요리사', '경찰관', '우주비행사', '화가', '가수', '농부', '사진작가', '미용사', '판사', '과학자', '운동선수', '택배기사', '마술사'],
  캐릭터: ['스파이더맨', '배트맨', '아이언맨', '슈퍼맨', '엘사', '피카츄', '마리오', '도라에몽', '짱구', '뽀로로', '헐크', '미키마우스', '슈렉', '올라프', '캡틴아메리카'],
};

/** 방장이 대기실에서 바꿀 수 있는 값들의 기본치 */
function defaultSettings() {
  return {
    turnMs: CONFIG.TURN_MS,
    laps: 0, // 0 = 인원수에 맞춰 자동
    discussMs: CONFIG.DISCUSS_MS,
    voteMs: CONFIG.VOTE_MS,
    guessMs: CONFIG.GUESS_MS,
    guessMode: CONFIG.GUESS_MODE,
    categories: [], // 빈 배열 = 전체 카테고리에서 랜덤
    customWords: [],
    customOnly: false,
  };
}

/** settings:set 으로 들어온 값 검증 (허용된 값만 통과) */
const SETTING_CHOICES = {
  turnMs: [8000, 10000, 15000, 20000, 30000, 45000],
  laps: [0, 1, 2, 3, 4],
  discussMs: [30000, 60000, 90000, 120000, 180000],
  voteMs: [15000, 20000, 30000, 45000, 60000],
  guessMs: [15000, 20000, 30000, 45000, 60000],
  guessMode: ['text', 'choice'],
};

function sanitizeSettings(cur, incoming) {
  const next = { ...cur };
  if (!incoming || typeof incoming !== 'object') return next;

  for (const [key, allowed] of Object.entries(SETTING_CHOICES)) {
    if (incoming[key] !== undefined && allowed.includes(incoming[key])) next[key] = incoming[key];
  }
  if (Array.isArray(incoming.categories)) {
    next.categories = incoming.categories.filter((c) => Object.prototype.hasOwnProperty.call(CATEGORIES, c)).slice(0, 20);
  }
  if (typeof incoming.customWords === 'string') {
    next.customWords = incoming.customWords
      .split(',')
      .map((w) => w.trim().slice(0, 20))
      .filter(Boolean)
      .slice(0, 60);
  } else if (Array.isArray(incoming.customWords)) {
    next.customWords = incoming.customWords.map((w) => String(w).trim().slice(0, 20)).filter(Boolean).slice(0, 60);
  }
  if (typeof incoming.customOnly === 'boolean') next.customOnly = incoming.customOnly;
  // 커스텀 단어가 4개 미만이면 "커스텀만 쓰기"를 켤 수 없다
  if (next.customWords.length < 4) next.customOnly = false;
  return next;
}

/** 이번 라운드의 카테고리/단어 뽑기 */
function pickWordFor(room) {
  const s = room.settings;
  const custom = s.customWords;

  if (s.customOnly && custom.length >= 4) {
    return { category: '커스텀', word: pick(custom) };
  }

  let cats = s.categories.length ? s.categories.filter((c) => CATEGORIES[c]) : Object.keys(CATEGORIES);
  if (!cats.length) cats = Object.keys(CATEGORIES);

  const pool = [];
  for (const c of cats) for (const w of CATEGORIES[c]) pool.push({ c, w });
  for (const w of custom) pool.push({ c: '커스텀', w });

  const chosen = pick(pool);
  return { category: chosen.c, word: chosen.w };
}

/* ---------------- 캐릭터(아바타) ---------------- */

const AVATAR_LIMITS = { skin: 6, hair: 7, hairColor: 6, eyes: 6, mouth: 6, acc: 6 };

function sanitizeAvatar(a) {
  const out = {};
  for (const [k, n] of Object.entries(AVATAR_LIMITS)) {
    const v = Math.floor(Number(a && a[k]));
    out[k] = Number.isFinite(v) && v >= 0 && v < n ? v : 0;
  }
  return out;
}

function randomAvatar() {
  const out = {};
  for (const [k, n] of Object.entries(AVATAR_LIMITS)) out[k] = randInt(n);
  return out;
}

/**
 * 맞히기 보기용 "헷갈리는 단어" 목록.
 * 같은 카테고리에서 아무거나 뽑으면 너무 쉬우므로, 정답과 생김새/분류가 비슷한 것만 모았다.
 * (여기 단어들은 보기 전용이라 실제 출제 단어일 필요가 없다)
 */
const SIMILAR = {
  기린: ['얼룩말', '낙타', '사슴', '타조', '알파카'],
  코끼리: ['하마', '코뿔소', '매머드', '물소', '멧돼지'],
  펭귄: ['오리', '펠리컨', '갈매기', '바다표범', '물개'],
  사자: ['호랑이', '치타', '표범', '늑대', '재규어'],
  문어: ['오징어', '낙지', '해파리', '불가사리', '새우'],
  고래: ['돌고래', '범고래', '참치', '바다코끼리', '물개'],
  다람쥐: ['햄스터', '청설모', '생쥐', '비버', '친칠라'],
  악어: ['도마뱀', '이구아나', '뱀', '카멜레온', '자라'],
  부엉이: ['올빼미', '매', '독수리', '까마귀', '앵무새'],
  토끼: ['햄스터', '고양이', '친칠라', '캥거루', '기니피그'],
  거북이: ['자라', '달팽이', '아르마딜로', '도마뱀', '소라게'],
  상어: ['돌고래', '가오리', '참치', '범고래', '고등어'],
  고슴도치: ['두더지', '너구리', '아르마딜로', '오소리', '수달'],
  캥거루: ['왈라비', '코알라', '사슴', '미어캣', '나무늘보'],
  판다: ['곰', '너구리', '코알라', '라쿤', '북극곰'],

  피자: ['와플', '팬케이크', '부침개', '파이', '또띠아'],
  김밥: ['초밥', '유부초밥', '주먹밥', '만두', '롤케이크'],
  라면: ['우동', '짜장면', '칼국수', '스파게티', '쌀국수'],
  치킨: ['탕수육', '돈까스', '너겟', '바비큐', '족발'],
  수박: ['멜론', '참외', '호박', '파인애플', '자몽'],
  아이스크림: ['빙수', '슬러시', '요거트', '젤라또', '솜사탕'],
  햄버거: ['샌드위치', '핫도그', '토스트', '타코', '베이글'],
  초밥: ['김밥', '회', '유부초밥', '주먹밥', '만두'],
  떡볶이: ['순대', '어묵', '라볶이', '짜장면', '국수'],
  바나나: ['옥수수', '고구마', '망고', '오이', '가지'],
  계란후라이: ['오믈렛', '스크램블', '계란찜', '팬케이크', '부침개'],
  도넛: ['베이글', '쿠키', '튜브', '마카롱', '프레첼'],
  샌드위치: ['햄버거', '토스트', '핫도그', '베이글', '랩'],
  팝콘: ['뻥튀기', '시리얼', '솜사탕', '과자', '너겟'],
  케이크: ['빵', '머핀', '파이', '타르트', '푸딩'],

  소방관: ['경찰관', '구급대원', '군인', '환경미화원', '건설노동자'],
  의사: ['간호사', '수의사', '약사', '치과의사', '한의사'],
  요리사: ['제빵사', '바리스타', '영양사', '바텐더', '정육점주인'],
  경찰관: ['소방관', '군인', '경비원', '형사', '교통순경'],
  우주비행사: ['조종사', '잠수부', '군인', '스쿠버다이버', '기상캐스터'],
  화가: ['조각가', '디자이너', '만화가', '서예가', '건축가'],
  가수: ['래퍼', '성악가', '아이돌', '작곡가', '디제이'],
  농부: ['어부', '정원사', '목동', '원예사', '사냥꾼'],
  사진작가: ['기자', '영화감독', '유튜버', '카메라맨', '방송작가'],
  미용사: ['이발사', '메이크업아티스트', '네일아티스트', '스타일리스트', '모델'],
  판사: ['변호사', '검사', '교수', '정치인', '공무원'],
  과학자: ['연구원', '발명가', '교수', '엔지니어', '수학자'],
  운동선수: ['축구선수', '코치', '체육교사', '트레이너', '댄서'],
  택배기사: ['우체부', '배달원', '트럭기사', '버스기사', '이삿짐센터직원'],
  마술사: ['광대', '서커스단원', '배우', '최면술사', '점쟁이'],

  스파이더맨: ['배트맨', '데드풀', '앤트맨', '아이언맨', '베놈'],
  배트맨: ['스파이더맨', '조커', '슈퍼맨', '캣우먼', '아이언맨'],
  아이언맨: ['캡틴아메리카', '로봇', '트랜스포머', '건담', '울트론'],
  슈퍼맨: ['배트맨', '원더우먼', '플래시', '아쿠아맨', '캡틴아메리카'],
  엘사: ['안나', '올라프', '백설공주', '신데렐라', '라푼젤'],
  피카츄: ['파이리', '꼬부기', '이상해씨', '푸린', '이브이'],
  마리오: ['루이지', '요시', '쿠파', '피치공주', '동키콩'],
  도라에몽: ['짱구', '피카츄', '헬로키티', '아기공룡둘리', '노진구'],
  짱구: ['도라에몽', '흰둥이', '철수', '유리', '훈이'],
  뽀로로: ['크롱', '에디', '루피', '패티', '포비'],
  헐크: ['슈렉', '토르', '아이언맨', '고릴라', '괴물'],
  미키마우스: ['미니마우스', '도널드덕', '구피', '헬로키티', '톰과제리'],
  슈렉: ['헐크', '피오나', '동키', '괴물', '오크'],
  올라프: ['엘사', '눈사람', '안나', '스벤', '루돌프'],
  캡틴아메리카: ['아이언맨', '토르', '슈퍼맨', '윈터솔져', '팔콘'],
};

/* ------------------------------------------------------------------ */
/* 유틸                                                                */
/* ------------------------------------------------------------------ */

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 헷갈리는 글자(I,O,0,1) 제외

function randInt(n) {
  return Math.floor(Math.random() * n);
}

function pick(arr) {
  return arr[randInt(arr.length)];
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeRoomCode() {
  let code;
  do {
    code = Array.from({ length: 5 }, () => pick(CODE_ALPHABET.split(''))).join('');
  } while (rooms.has(code));
  return code;
}

function sanitizeNick(raw) {
  const s = String(raw || '').replace(/\s+/g, ' ').trim().slice(0, 12);
  return s || '익명';
}

/**
 * 채팅에서 정답 단어를 하트로 가린다.
 * "기 린", "기.린", "기-린" 처럼 사이에 공백/기호를 끼워 넣는 우회도 함께 막는다.
 */
function censorSecret(text, word) {
  if (!word) return text;
  const chars = Array.from(word);
  const esc = (c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const sep = '[\\s.,!?~\\-_*·/\\\\]*';
  const re = new RegExp(chars.map(esc).join(sep), 'gi');
  return text.replace(re, () => '❤️'.repeat(chars.length));
}

/** 주관식 정답 비교용: 공백/기호 제거 + 소문자 */
function normalizeGuess(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[\s.,!?~\-_*·/\\'"]/g, '');
}

/**
 * 주관식에서 "사실상 맞은" 답도 인정해 주기 위한 별칭.
 * 뜻이 같은데 표기만 다르다고 오답 처리되면 억울하므로.
 */
const ALIASES = {
  계란후라이: ['달걀후라이', '계란프라이', '달걀프라이', '후라이드에그'],
  아이스크림: ['아이스크림콘', '소프트콘', '아이스크림콘과자'],
  캡틴아메리카: ['캡아', '캡틴'],
  스파이더맨: ['거미인간', '스파이더맨거미', '스파이디'],
  미키마우스: ['미키'],
  도라에몽: ['도라애몽'],
  우주비행사: ['우주인', 'astronaut'],
  택배기사: ['택배원', '택배아저씨', '배달원'],
  운동선수: ['축구선수', '야구선수', '체육인'],
  사진작가: ['사진사', '포토그래퍼'],
  고슴도치: ['고슴도치가시'],
  케이크: ['케익', '케잌'],
  도넛: ['도너츠', '도나쓰'],
  햄버거: ['버거'],
  샌드위치: ['샌드윗치'],
};

/** 마피아가 낸 답이 정답으로 인정되는지 */
function isCorrectGuess(guess, answer) {
  const g = normalizeGuess(guess);
  if (!g) return false;
  if (g === normalizeGuess(answer)) return true;
  return (ALIASES[answer] || []).some((a) => normalizeGuess(a) === g);
}

function clamp01(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

/* ------------------------------------------------------------------ */
/* 방 상태                                                             */
/* ------------------------------------------------------------------ */

/** @type {Map<string, Room>} */
const rooms = new Map();

function createRoom(hostId, hostNick, hostAvatar) {
  const code = makeRoomCode();
  const room = {
    code,
    hostId,
    hostNick, // 잠깐 끊긴 방장이 돌아오면 권한을 되돌려주기 위해 기억
    players: [], // { id, nick, connected }
    phase: 'lobby', // lobby | reveal | draw | discuss | vote | guess | result
    roundNo: 0,
    round: null, // { category, word, mafiaIds, order, turnIndex }
    strokes: [],
    openStroke: null,
    strokeSeq: 0,
    chat: [],
    votes: {}, // voterId -> targetId
    settings: defaultSettings(), // 방장이 대기실에서 조정
    scoreHistory: {}, // nick -> score (퇴장/새로고침해도 점수 복원용)
    avatarHistory: {}, // nick -> avatar (재입장 시 캐릭터 복원)
    earlyVotes: {}, // 토론 중 "바로 투표하자"에 동의한 사람
    guess: null, // 잡힌 마피아의 단어 맞히기 상태
    pendingResult: null, // 맞히기 결과를 기다리는 중간 집계
    result: null,
    deadline: null,
    timer: null,
    botTimers: [],
  };
  rooms.set(code, room);
  addPlayer(room, hostId, hostNick, hostAvatar);
  return room;
}

function addPlayer(room, id, nick, avatar) {
  // score/avatar는 라운드를 넘어 유지된다.
  // 대기실에서 새로고침해 슬롯이 사라졌더라도 같은 닉네임이면 되찾는다.
  const av = avatar ? sanitizeAvatar(avatar) : room.avatarHistory[nick] || randomAvatar();
  room.avatarHistory[nick] = av;
  room.players.push({
    id,
    nick,
    connected: true,
    score: room.scoreHistory[nick] || 0,
    avatar: av,
  });
}

function getPlayer(room, id) {
  return room.players.find((p) => p.id === id) || null;
}

function connectedPlayers(room) {
  return room.players.filter((p) => p.connected);
}

function destroyRoom(room) {
  clearPhaseTimer(room);
  clearBotTimers(room);
  for (const p of room.players) if (p.reapTimer) clearTimeout(p.reapTimer);
  rooms.delete(room.code);
}

function clearPhaseTimer(room) {
  if (room.timer) {
    clearTimeout(room.timer);
    room.timer = null;
  }
}

/**
 * 탭 새로고침 등으로 소켓 id가 바뀐 플레이어를 기존 슬롯에 다시 연결.
 */
function remapPlayerId(room, oldId, newId) {
  const p = getPlayer(room, oldId);
  if (!p) return;
  p.id = newId;
  p.connected = true;
  if (room.hostId === oldId) room.hostId = newId;
  if (room.round) {
    room.round.order = room.round.order.map((id) => (id === oldId ? newId : id));
    room.round.mafiaIds = room.round.mafiaIds.map((id) => (id === oldId ? newId : id));
  }
  const nextVotes = {};
  for (const [voter, target] of Object.entries(room.votes)) {
    nextVotes[voter === oldId ? newId : voter] = target === oldId ? newId : target;
  }
  room.votes = nextVotes;
  for (const s of room.strokes) if (s.playerId === oldId) s.playerId = newId;
  if (room.openStroke && room.openStroke.playerId === oldId) room.openStroke.playerId = newId;
}

/* ------------------------------------------------------------------ */
/* 연습용 봇 (혼자서도 테스트할 수 있게)                               */
/* ------------------------------------------------------------------ */

const BOT_NAMES = ['깜냥이', '두더지', '뭉치', '방울이', '초코', '하양이', '까망이', '토토', '별이', '콩이', '단추'];
const BOT_LINES = [
  '음... 누구지',
  '그거 좀 이상했는데',
  '난 아닌데?',
  '아까 그 선 뭐야',
  '확실해?',
  '나 시민이야',
  '슬슬 투표하자',
  '그럴싸한데',
  '아무리 봐도 수상해',
];

let botSeq = 0;

function isBotId(id) {
  return typeof id === 'string' && id.startsWith('bot:');
}

function addBot(room) {
  if (room.players.length >= CONFIG.MAX_PLAYERS) return false;
  const used = new Set(room.players.map((p) => p.nick));
  const name = BOT_NAMES.find((n) => !used.has(n)) || `봇${randInt(999)}`;
  room.players.push({
    id: 'bot:' + ++botSeq,
    nick: name,
    connected: true,
    score: 0,
    avatar: randomAvatar(),
    isBot: true,
  });
  return name;
}

/** 봇 타이머는 방이 사라지거나 대기실로 돌아갈 때 정리한다 */
function botLater(room, ms, fn) {
  const t = setTimeout(() => {
    if (!rooms.has(room.code)) return;
    try {
      fn();
    } catch (err) {
      console.error('[bot]', err);
    }
  }, ms);
  room.botTimers.push(t);
}

function clearBotTimers(room) {
  for (const t of room.botTimers) clearTimeout(t);
  room.botTimers = [];
}

/** 봇 차례: 아무 곡선이나 하나 긋고 턴을 넘긴다 */
function botDraw(room, expectedTurn) {
  const r = room.round;
  if (room.phase !== 'draw' || !r || r.turnIndex !== expectedTurn) return;
  const p = getPlayer(room, r.order[r.turnIndex % r.order.length]);
  if (!p || !p.isBot) return;

  const color = pick(PALETTE.filter((c) => c !== '#ffffff'));
  const size = pick(SIZES);
  const cx = 0.2 + Math.random() * 0.6;
  const cy = 0.25 + Math.random() * 0.5;
  const rad = 0.05 + Math.random() * 0.13;
  const n = 12 + randInt(14);
  const start = Math.random() * Math.PI * 2;
  const span = 2 + Math.random() * 4;

  const points = [];
  for (let i = 0; i < n; i++) {
    const t = start + (i / n) * span;
    const w = 0.6 + Math.random() * 0.7;
    points.push([clamp01(cx + Math.cos(t) * rad * w), clamp01(cy + Math.sin(t) * rad * w * 1.2)]);
  }

  room.strokes.push({ id: ++room.strokeSeq, playerId: p.id, color, size, points });
  io.to(room.code).emit('canvas:init', { strokes: room.strokes, openStrokeId: null });
  endTurn(room, expectedTurn);
}

/** 페이즈가 바뀔 때마다 봇들이 할 일을 예약 */
function scheduleBots(room) {
  const bots = room.players.filter((p) => p.isBot);
  if (!bots.length) return;

  if (room.phase === 'draw' && room.round) {
    const turn = room.round.turnIndex;
    const cur = getPlayer(room, room.round.order[turn % room.round.order.length]);
    if (cur && cur.isBot) botLater(room, 900 + randInt(1400), () => botDraw(room, turn));
    return;
  }

  if (room.phase === 'discuss') {
    bots.forEach((b, i) => {
      if (Math.random() < 0.7) {
        botLater(room, 1500 + i * 900 + randInt(2500), () => {
          if (room.phase !== 'discuss') return;
          pushChat(room, { nick: b.nick, playerId: b.id, text: pick(BOT_LINES) });
          broadcast(room);
        });
      }
      // 사람이 "바로 투표" 를 누르면 봇들도 곧 따라 동의한다
      botLater(room, 6000 + i * 1200 + randInt(4000), () => {
        if (room.phase !== 'discuss') return;
        if (!room.earlyVotes[b.id]) toggleEarlyVote(room, b.id);
      });
    });
    return;
  }

  if (room.phase === 'vote') {
    bots.forEach((b, i) => {
      botLater(room, 1800 + i * 700 + randInt(3000), () => {
        if (room.phase !== 'vote' || room.votes[b.id]) return;
        const targets = connectedPlayers(room).filter((p) => p.id !== b.id);
        if (!targets.length) return;
        room.votes[b.id] = pick(targets).id;
        maybeFinishVote(room);
      });
    });
    return;
  }

  if (room.phase === 'guess' && room.guess && isBotId(room.guess.mafiaId)) {
    botLater(room, 2500 + randInt(4000), () => {
      if (room.phase !== 'guess' || !room.guess) return;
      const opts = room.guess.options || CATEGORIES[room.round.category] || ['???'];
      finalizeResult(room, pick(opts));
    });
  }
}

/* ------------------------------------------------------------------ */
/* 채팅 / 시스템 메시지                                                */
/* ------------------------------------------------------------------ */

let chatSeq = 0;

function pushChat(room, msg) {
  room.chat.push({ id: ++chatSeq, ts: Date.now(), ...msg });
  if (room.chat.length > CONFIG.MAX_CHAT) room.chat.splice(0, room.chat.length - CONFIG.MAX_CHAT);
}

/**
 * 시스템 메시지는 번역할 수 있도록 "키 + 값"으로 보낸다.
 * 실제 문장은 클라이언트가 현재 언어에 맞춰 만든다.
 */
function pushSystem(room, k, p) {
  pushChat(room, { system: true, k, p: p || {} });
}

/* ------------------------------------------------------------------ */
/* 상태 브로드캐스트                                                   */
/* ------------------------------------------------------------------ */

function publicState(room) {
  const r = room.round;
  // 'guess'가 빠지면 마피아 맞히기 화면에서 카테고리가 안 보인다
  const showCategory = r && ['draw', 'discuss', 'vote', 'guess', 'result'].includes(room.phase);
  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    roundNo: room.roundNo,
    minPlayers: CONFIG.MIN_PLAYERS,
    maxPlayers: CONFIG.MAX_PLAYERS,
    players: room.players.map((p) => ({
      id: p.id,
      nick: p.nick,
      connected: p.connected,
      isHost: p.id === room.hostId,
      score: p.score || 0,
      avatar: p.avatar,
      isBot: !!p.isBot,
    })),
    settings: room.settings,
    categoryList: Object.keys(CATEGORIES),
    category: showCategory ? r.category : null,
    order: r ? r.order.slice() : [],
    turnIndex: r ? r.turnIndex : 0,
    totalTurns: r ? r.order.length * r.laps : 0,
    // 마지막 턴이 끝나면 turnIndex가 총 턴 수와 같아지므로 바퀴 수를 상한으로 고정
    lap: r ? Math.min(r.laps, Math.floor(r.turnIndex / Math.max(1, r.order.length)) + 1) : 0,
    laps: r ? r.laps : CONFIG.LAPS,
    currentDrawerId: room.phase === 'draw' && r ? r.order[r.turnIndex % r.order.length] : null,
    votedIds: Object.keys(room.votes),
    earlyVoteIds: Object.keys(room.earlyVotes),
    guess: room.guess
      ? {
          mafiaId: room.guess.mafiaId,
          mafiaNick: room.guess.mafiaNick,
          mode: room.guess.mode,
          options: room.guess.options,
        }
      : null,
    chat: room.chat,
    result: room.result,
    deadline: room.deadline,
    now: Date.now(),
    palette: PALETTE,
    sizes: SIZES,
  };
}

function privateFor(room, player) {
  const r = room.round;
  const isMafia = r ? r.mafiaIds.includes(player.id) : false;
  const revealed = r && ['reveal', 'draw', 'discuss', 'vote', 'guess', 'result'].includes(room.phase);
  return {
    id: player.id,
    nick: player.nick,
    isHost: player.id === room.hostId,
    role: revealed ? (isMafia ? 'mafia' : 'citizen') : null,
    // 마피아는 카테고리만, 시민은 구체 단어까지
    word: revealed && !isMafia ? r.word : null,
    category: revealed ? r.category : null,
    myVote: room.votes[player.id] || null,
    earlyVoted: !!room.earlyVotes[player.id],
    isGuesser: !!(room.guess && room.guess.mafiaId === player.id),
  };
}

function broadcast(room) {
  const base = publicState(room);
  for (const p of room.players) {
    const sock = io.sockets.sockets.get(p.id);
    if (!sock) continue;
    sock.emit('state', { ...base, you: privateFor(room, p) });
  }
}

function sendCanvas(target, room) {
  target.emit('canvas:init', {
    strokes: room.strokes,
    openStrokeId: room.openStroke ? room.openStroke.id : null,
  });
}

/* ------------------------------------------------------------------ */
/* 페이즈 진행                                                         */
/* ------------------------------------------------------------------ */

function setPhase(room, phase, durationMs, onTimeout) {
  clearPhaseTimer(room);
  room.phase = phase;
  room.deadline = durationMs ? Date.now() + durationMs : null;
  if (durationMs) {
    room.timer = setTimeout(() => {
      room.timer = null;
      try {
        onTimeout();
      } catch (err) {
        console.error('[phase timeout]', err);
      }
    }, durationMs);
  }
  broadcast(room);
  scheduleBots(room); // 봇이 있으면 이번 페이즈에 할 일을 예약
}

function startGame(room) {
  const players = connectedPlayers(room);
  if (players.length < CONFIG.MIN_PLAYERS || players.length > CONFIG.MAX_PLAYERS) return;

  const { category, word } = pickWordFor(room);
  const shuffled = shuffle(players.map((p) => p.id));
  const mafiaIds = shuffled.slice(0, mafiaCountFor(players.length));

  room.roundNo += 1;
  room.round = {
    category,
    word,
    mafiaIds,
    order: shuffle(players.map((p) => p.id)),
    turnIndex: 0,
    laps: room.settings.laps > 0 ? room.settings.laps : lapsFor(players.length),
  };
  clearBotTimers(room);
  room.strokes = [];
  room.openStroke = null;
  room.votes = {};
  room.earlyVotes = {};
  room.guess = null;
  room.pendingResult = null;
  room.result = null;

  pushSystem(room, 'roundStart', { n: room.roundNo, cat: category });
  io.to(room.code).emit('canvas:init', { strokes: [], openStrokeId: null });

  setPhase(room, 'reveal', CONFIG.REVEAL_MS, () => beginTurns(room));
}

function beginTurns(room) {
  room.round.turnIndex = 0;
  advanceToPlayableTurn(room);
}

/** 현재 turnIndex부터 연결된 플레이어의 턴을 찾아 시작. 없으면 토론으로. */
function advanceToPlayableTurn(room) {
  const r = room.round;
  if (!r) return;
  const n = r.order.length;
  const total = n * r.laps;

  while (r.turnIndex < total) {
    const pid = r.order[r.turnIndex % n];
    const p = getPlayer(room, pid);
    if (p && p.connected) {
      closeOpenStroke(room);
      pushSystem(room, 'turnOf', { nick: p.nick, i: r.turnIndex + 1, total });
      const thisTurn = r.turnIndex; // 타임아웃이 지난 턴을 끝내지 않도록 값을 고정
      setPhase(room, 'draw', room.settings.turnMs, () => endTurn(room, thisTurn));
      return;
    }
    r.turnIndex++;
  }
  startDiscuss(room);
}

function endTurn(room, expectedTurnIndex) {
  const r = room.round;
  if (!r || room.phase !== 'draw') return;
  if (expectedTurnIndex !== undefined && r.turnIndex !== expectedTurnIndex) return; // 지난 턴의 타이머
  closeOpenStroke(room);
  r.turnIndex++;
  advanceToPlayableTurn(room);
}

function startDiscuss(room) {
  closeOpenStroke(room);
  room.earlyVotes = {};
  pushSystem(room, 'discussStart');
  setPhase(room, 'discuss', room.settings.discussMs, () => startVote(room));
}

/** 토론 중 "바로 투표하자" 동의 토글. 접속자 전원이 동의하면 즉시 투표로. */
function toggleEarlyVote(room, playerId) {
  if (room.phase !== 'discuss') return;
  const me = getPlayer(room, playerId);
  if (!me) return;

  const agreeing = !room.earlyVotes[playerId];
  if (agreeing) room.earlyVotes[playerId] = true;
  else delete room.earlyVotes[playerId];

  const conn = connectedPlayers(room);
  const agreed = conn.filter((p) => room.earlyVotes[p.id]).length;

  // 채팅창에도 진행 상황을 남긴다 (누가 눌렀는지 / 몇 명 찬성인지)
  pushSystem(room, agreeing ? 'earlyYes' : 'earlyNo', {
    nick: me.nick,
    a: agreed,
    b: conn.length,
  });

  if (conn.length > 0 && agreed >= conn.length) {
    pushSystem(room, 'earlyAll');
    startVote(room);
  } else {
    broadcast(room);
  }
}

function startVote(room) {
  room.votes = {};
  pushSystem(room, 'voteStart');
  setPhase(room, 'vote', room.settings.voteMs, () => finishVote(room));
}

function maybeFinishVote(room) {
  if (room.phase !== 'vote') return;
  const voters = connectedPlayers(room);
  if (voters.length > 0 && voters.every((p) => room.votes[p.id])) {
    finishVote(room);
  } else {
    broadcast(room);
  }
}

function finishVote(room) {
  if (!room.round) return;
  clearPhaseTimer(room);

  const counts = new Map();
  for (const targetId of Object.values(room.votes)) {
    counts.set(targetId, (counts.get(targetId) || 0) + 1);
  }

  const tally = room.players.map((p) => ({
    id: p.id,
    nick: p.nick,
    count: counts.get(p.id) || 0,
  }));

  const max = tally.reduce((m, t) => Math.max(m, t.count), 0);
  const top = max > 0 ? tally.filter((t) => t.count === max) : [];
  const tie = top.length !== 1;
  const eliminated = tie ? null : top[0];

  const mafiaNicks = room.round.mafiaIds.map((id) => {
    const p = getPlayer(room, id);
    return p ? p.nick : '(퇴장)';
  });

  const caught = !!eliminated && room.round.mafiaIds.includes(eliminated.id);

  room.pendingResult = {
    tally: tally.sort((a, b) => b.count - a.count),
    tie,
    eliminated: eliminated ? { id: eliminated.id, nick: eliminated.nick, count: eliminated.count } : null,
    eliminatedWasMafia: caught,
    mafiaIds: room.round.mafiaIds.slice(),
    mafiaNicks,
    word: room.round.word,
    category: room.round.category,
    votes: Object.entries(room.votes).map(([voterId, targetId]) => {
      const v = getPlayer(room, voterId);
      const t = getPlayer(room, targetId);
      return { voter: v ? v.nick : '?', target: t ? t.nick : '?' };
    }),
  };

  if (caught) {
    // 마피아를 잡았지만, 마피아에게 단어를 맞힐 마지막 기회를 준다
    startGuess(room, eliminated.id);
  } else {
    finalizeResult(room, null);
  }
}

/** 잡힌 마피아의 단어 맞히기 페이즈 */
function startGuess(room, mafiaId) {
  const word = room.round.word;
  const p = getPlayer(room, mafiaId);

  const mode = room.settings.guessMode;
  let options = null;
  if (mode === 'choice') {
    // 정답과 헷갈리는 단어 우선, 모자라면 같은 카테고리에서 채운다
    const pool = SIMILAR[word] || [];
    const decoys = shuffle(pool).slice(0, CONFIG.GUESS_OPTIONS - 1);
    if (decoys.length < CONFIG.GUESS_OPTIONS - 1) {
      const fill = shuffle((CATEGORIES[room.round.category] || []).filter((w) => w !== word && !decoys.includes(w)));
      decoys.push(...fill.slice(0, CONFIG.GUESS_OPTIONS - 1 - decoys.length));
    }
    options = shuffle([word, ...decoys]);
  }

  room.guess = {
    mafiaId,
    mafiaNick: p ? p.nick : '마피아',
    mode,
    options,
  };

  pushSystem(room, 'caught', { nick: room.guess.mafiaNick });
  setPhase(room, 'guess', room.settings.guessMs, () => finalizeResult(room, null));
}

/**
 * 최종 결과 확정.
 * chosenWord: 마피아가 고른 단어 (맞히기 없었으면/시간초과면 null)
 */
function finalizeResult(room, chosenWord) {
  clearPhaseTimer(room);
  const pr = room.pendingResult;
  if (!pr) return;

  let citizensWin;
  let guessInfo = null;

  if (room.guess) {
    // 주관식은 띄어쓰기/기호 차이를 무시하고, 흔한 다른 표기도 정답으로 인정
    const correct = chosenWord !== null && isCorrectGuess(chosenWord, pr.word);
    guessInfo = {
      mafiaNick: room.guess.mafiaNick,
      options: room.guess.options,
      chosen: chosenWord,
      correct,
      timedOut: chosenWord === null,
    };
    // 마피아가 단어를 맞히면 역전승, 못 맞히면 시민 승
    citizensWin = !correct;

    if (correct) {
      pushSystem(room, 'guessRight', { nick: room.guess.mafiaNick, word: pr.word });
    } else if (chosenWord === null) {
      pushSystem(room, 'guessTimeout', { word: pr.word });
    } else {
      pushSystem(room, 'guessWrong', { chosen: chosenWord, word: pr.word });
    }
  } else if (pr.tie) {
    citizensWin = false;
    pushSystem(room, 'tie', { word: pr.word });
  } else {
    citizensWin = false;
    pushSystem(room, 'wrongTarget', {
      nick: pr.eliminated.nick,
      word: pr.word,
      mafias: pr.mafiaNicks.join(', '),
    });
  }

  const scoreboard = applyScores(room, pr, citizensWin, guessInfo);

  room.result = { ...pr, citizensWin, guess: guessInfo, scoreboard };
  room.pendingResult = null;
  setPhase(room, 'result', null, null);
}

/**
 * 라운드 점수 정산.
 *
 *   마피아 승리 (안 들킴/동점)        → 마피아 +3
 *   마피아 역전승 (들켰지만 단어 맞힘) → 마피아 +2
 *   시민 승리 (잡고 단어도 못 맞힘)   → 시민 전원 +1, 마피아를 지목한 시민 추가 +1
 *
 * 반환값은 이번 라운드 증감(delta)이 포함된 스코어보드.
 */
function applyScores(room, pr, citizensWin, guessInfo) {
  const mafiaSet = new Set(pr.mafiaIds);
  const delta = new Map();
  const add = (id, n) => delta.set(id, (delta.get(id) || 0) + n);

  if (citizensWin) {
    for (const p of room.players) {
      if (mafiaSet.has(p.id)) continue;
      add(p.id, 1);
      // 실제로 마피아를 지목한 시민에게 보너스
      const myVote = room.votes[p.id];
      if (myVote && mafiaSet.has(myVote)) add(p.id, 1);
    }
  } else {
    const gain = guessInfo && guessInfo.correct ? 2 : 3;
    for (const id of pr.mafiaIds) add(id, gain);
  }

  for (const p of room.players) {
    p.score = (p.score || 0) + (delta.get(p.id) || 0);
    room.scoreHistory[p.nick] = p.score;
  }

  return room.players
    .map((p) => ({
      id: p.id,
      nick: p.nick,
      score: p.score || 0,
      delta: delta.get(p.id) || 0,
      wasMafia: mafiaSet.has(p.id),
    }))
    .sort((a, b) => b.score - a.score);
}

function backToLobby(room, systemKey) {
  clearPhaseTimer(room);
  clearBotTimers(room);
  room.round = null;
  room.result = null;
  room.votes = {};
  room.earlyVotes = {};
  room.guess = null;
  room.pendingResult = null;
  room.strokes = [];
  room.openStroke = null;
  room.deadline = null;
  room.phase = 'lobby';
  if (systemKey) pushSystem(room, systemKey);
  io.to(room.code).emit('canvas:init', { strokes: [], openStrokeId: null });
  broadcast(room);
}

/* ------------------------------------------------------------------ */
/* 그리기                                                              */
/* ------------------------------------------------------------------ */

function isCurrentDrawer(room, socketId) {
  if (room.phase !== 'draw' || !room.round) return false;
  const r = room.round;
  return r.order[r.turnIndex % r.order.length] === socketId;
}

function closeOpenStroke(room) {
  if (room.openStroke) {
    room.openStroke = null;
    io.to(room.code).emit('draw:end', {});
  }
}

/* ------------------------------------------------------------------ */
/* 정적 파일 서빙                                                      */
/* ------------------------------------------------------------------ */

app.use(express.static(path.join(__dirname, 'public')));
app.use('/vendor/react', express.static(path.join(__dirname, 'node_modules/react/umd')));
app.use('/vendor/react-dom', express.static(path.join(__dirname, 'node_modules/react-dom/umd')));
app.use('/vendor/babel', express.static(path.join(__dirname, 'node_modules/@babel/standalone')));

app.get('/healthz', (req, res) => {
  res.json({ ok: true, rooms: rooms.size });
});

// 디버그용: 서버가 들고 있는 획 데이터 확인 (프로토타입 전용)
app.get('/debug/room/:code', (req, res) => {
  const room = rooms.get(String(req.params.code || '').toUpperCase());
  if (!room) return res.status(404).json({ error: 'no such room' });
  res.json({
    code: room.code,
    phase: room.phase,
    strokes: room.strokes.map((s) => ({ id: s.id, color: s.color, size: s.size, n: s.points.length })),
  });
});

/* ------------------------------------------------------------------ */
/* 소켓 핸들러                                                         */
/* ------------------------------------------------------------------ */

io.on('connection', (socket) => {
  // socket.data.roomCode 로 소속 방 추적
  const roomOf = () => {
    const code = socket.data.roomCode;
    return code ? rooms.get(code) || null : null;
  };

  socket.on('room:create', (payload, cb) => {
    const nick = sanitizeNick(payload && payload.nick);
    const room = createRoom(socket.id, nick, payload && payload.avatar);
    socket.data.roomCode = room.code;
    socket.join(room.code);
    pushSystem(room, 'created', { nick });
    if (typeof cb === 'function') cb({ ok: true, code: room.code });
    sendCanvas(socket, room);
    broadcast(room);
  });

  socket.on('room:join', (payload, cb) => {
    const code = String((payload && payload.code) || '').toUpperCase().trim();
    const nick = sanitizeNick(payload && payload.nick);
    const room = rooms.get(code);

    if (!room) {
      if (typeof cb === 'function') cb({ ok: false, error: '그런 코드의 방이 없습니다.' });
      return;
    }

    // 새로고침 복귀: 같은 닉네임의 끊긴 슬롯이 있으면 이어받기
    const ghost = room.players.find((p) => !p.connected && p.nick === nick);
    if (ghost) {
      if (ghost.reapTimer) {
        clearTimeout(ghost.reapTimer); // 돌아왔으니 자리 비우기 취소
        ghost.reapTimer = null;
      }
      if (payload && payload.avatar) {
        ghost.avatar = sanitizeAvatar(payload.avatar);
        room.avatarHistory[nick] = ghost.avatar;
      }
      remapPlayerId(room, ghost.id, socket.id);
      // 원래 방장이 돌아왔으면 권한도 돌려준다
      if (room.hostNick === nick) room.hostId = socket.id;
      socket.data.roomCode = room.code;
      socket.join(room.code);
      pushSystem(room, 'rejoined', { nick });
      if (typeof cb === 'function') cb({ ok: true, code: room.code });
      sendCanvas(socket, room);
      broadcast(room);
      return;
    }

    if (room.phase !== 'lobby') {
      if (typeof cb === 'function') cb({ ok: false, error: '이미 게임이 진행 중인 방입니다.' });
      return;
    }
    if (room.players.length >= CONFIG.MAX_PLAYERS) {
      if (typeof cb === 'function') cb({ ok: false, error: `정원이 가득 찼습니다. (최대 ${CONFIG.MAX_PLAYERS}명)` });
      return;
    }
    if (room.players.some((p) => p.nick === nick)) {
      if (typeof cb === 'function') cb({ ok: false, error: '같은 닉네임이 이미 있습니다.' });
      return;
    }

    addPlayer(room, socket.id, nick, payload && payload.avatar);
    socket.data.roomCode = room.code;
    socket.join(room.code);
    pushSystem(room, 'joined', { nick });
    if (typeof cb === 'function') cb({ ok: true, code: room.code });
    sendCanvas(socket, room);
    broadcast(room);
  });

  socket.on('game:start', () => {
    const room = roomOf();
    if (!room || room.hostId !== socket.id || room.phase !== 'lobby') return;
    startGame(room);
  });

  socket.on('game:again', () => {
    const room = roomOf();
    if (!room || room.hostId !== socket.id || room.phase !== 'result') return;
    if (connectedPlayers(room).length >= CONFIG.MIN_PLAYERS) {
      startGame(room);
    } else {
      backToLobby(room, 'backLobbyFew');
    }
  });

  socket.on('game:lobby', () => {
    const room = roomOf();
    if (!room || room.hostId !== socket.id || room.phase !== 'result') return;
    backToLobby(room, 'backLobby');
  });

  socket.on('bot:add', (payload) => {
    const room = roomOf();
    if (!room || room.hostId !== socket.id) return;
    if (room.phase !== 'lobby') return;
    const n = Math.max(1, Math.min(11, Math.floor(Number(payload && payload.count)) || 1));
    const added = [];
    for (let i = 0; i < n; i++) {
      const name = addBot(room);
      if (!name) break;
      added.push(name);
    }
    if (added.length) pushSystem(room, 'botsIn', { names: added.join(', ') });
    broadcast(room);
  });

  socket.on('bot:remove', () => {
    const room = roomOf();
    if (!room || room.hostId !== socket.id) return;
    if (room.phase !== 'lobby') return;
    const idx = room.players.map((p) => !!p.isBot).lastIndexOf(true);
    if (idx < 0) return;
    const [gone] = room.players.splice(idx, 1);
    pushSystem(room, 'botOut', { nick: gone.nick });
    broadcast(room);
  });

  socket.on('settings:set', (payload) => {
    const room = roomOf();
    if (!room || room.hostId !== socket.id) return;
    if (room.phase !== 'lobby' && room.phase !== 'result') return;
    room.settings = sanitizeSettings(room.settings, payload);
    broadcast(room);
  });

  socket.on('avatar:set', (payload) => {
    const room = roomOf();
    if (!room) return;
    const me = getPlayer(room, socket.id);
    if (!me) return;
    me.avatar = sanitizeAvatar(payload && payload.avatar);
    room.avatarHistory[me.nick] = me.avatar;
    broadcast(room);
  });

  socket.on('score:reset', () => {
    const room = roomOf();
    if (!room || room.hostId !== socket.id) return;
    if (room.phase !== 'lobby' && room.phase !== 'result') return;
    for (const p of room.players) p.score = 0;
    room.scoreHistory = {};
    room.roundNo = 0;
    pushSystem(room, 'scoreReset');
    broadcast(room);
  });

  socket.on('turn:skip', () => {
    const room = roomOf();
    if (!room || !isCurrentDrawer(room, socket.id)) return;
    endTurn(room, room.round.turnIndex);
  });

  socket.on('draw:begin', (p) => {
    const room = roomOf();
    if (!room || !isCurrentDrawer(room, socket.id)) return;
    if (room.strokes.length >= CONFIG.MAX_STROKES) return;

    const color = PALETTE.includes(p && p.color) ? p.color : PALETTE[0];
    const size = SIZES.includes(p && p.size) ? p.size : SIZES[1];
    const x = clamp01(p && p.x);
    const y = clamp01(p && p.y);

    const stroke = { id: ++room.strokeSeq, playerId: socket.id, color, size, points: [[x, y]] };
    room.strokes.push(stroke);
    room.openStroke = stroke;
    io.to(room.code).emit('draw:begin', { id: stroke.id, color, size, x, y });
  });

  socket.on('draw:point', (p) => {
    const room = roomOf();
    if (!room || !room.openStroke) return;
    if (room.openStroke.playerId !== socket.id) return;
    if (!isCurrentDrawer(room, socket.id)) return;
    if (room.openStroke.points.length >= CONFIG.MAX_POINTS_PER_STROKE) return;

    const x = clamp01(p && p.x);
    const y = clamp01(p && p.y);
    room.openStroke.points.push([x, y]);
    io.to(room.code).emit('draw:point', { x, y });
  });

  socket.on('draw:end', () => {
    const room = roomOf();
    if (!room || !room.openStroke) return;
    if (room.openStroke.playerId !== socket.id) return;

    const wasDrawing = isCurrentDrawer(room, socket.id) && room.phase === 'draw';
    closeOpenStroke(room);

    // 룰: 한 획을 다 그리면 시간이 남아도 즉시 다음 사람 차례로.
    // (openStroke가 이미 null이 되었으므로 중복 draw:end는 위에서 걸러진다)
    if (wasDrawing && room.round) {
      endTurn(room, room.round.turnIndex);
    }
  });

  socket.on('vote:early', () => {
    const room = roomOf();
    if (!room) return;
    const me = getPlayer(room, socket.id);
    if (!me) return;
    toggleEarlyVote(room, socket.id);
  });

  socket.on('guess:submit', (payload) => {
    const room = roomOf();
    if (!room || room.phase !== 'guess' || !room.guess) return;
    if (room.guess.mafiaId !== socket.id) return;
    const word = String((payload && payload.word) || '').trim().slice(0, 30);
    if (!word) return;
    // 객관식이면 제시된 보기 중 하나여야 하고, 주관식이면 자유 입력
    if (room.guess.options && !room.guess.options.includes(word)) return;
    finalizeResult(room, word);
  });

  socket.on('chat:send', (payload) => {
    const room = roomOf();
    if (!room) return;
    const me = getPlayer(room, socket.id);
    if (!me) return;

    const raw = String((payload && payload.text) || '').trim().slice(0, 200);
    if (!raw) return;

    // 그리는 중에도 대화는 가능하되, 정답 단어는 서버에서 하트로 가린다.
    // (결과 페이즈에는 이미 정답이 공개되므로 그대로 둔다)
    let text = raw;
    let censored = false;
    if (room.round && room.phase !== 'result') {
      const masked = censorSecret(raw, room.round.word);
      if (masked !== raw) {
        text = masked;
        censored = true;
      }
    }

    pushChat(room, { nick: me.nick, playerId: me.id, text, censored });
    broadcast(room);
  });

  socket.on('vote:cast', (payload) => {
    const room = roomOf();
    if (!room || room.phase !== 'vote') return;
    const me = getPlayer(room, socket.id);
    if (!me) return;
    const targetId = String((payload && payload.targetId) || '');
    if (targetId === socket.id) return; // 자기 자신 투표 금지
    const target = getPlayer(room, targetId);
    if (!target || !target.connected) return;

    room.votes[socket.id] = targetId;
    maybeFinishVote(room);
  });

  socket.on('room:leave', () => {
    handleLeave(socket, true);
  });

  socket.on('disconnect', () => {
    handleLeave(socket, false);
  });
});

/** 끊긴 사람의 자리를 실제로 비운다 (유예시간이 지났거나 직접 나갔을 때) */
function removePlayer(room, playerId, reasonKey) {
  const p = getPlayer(room, playerId);
  if (!p) return;
  if (p.reapTimer) clearTimeout(p.reapTimer);
  room.players = room.players.filter((x) => x.id !== playerId);
  pushSystem(room, reasonKey || 'left', { nick: p.nick });

  if (connectedPlayers(room).length === 0) {
    destroyRoom(room);
    return;
  }
  if (room.hostId === playerId || room.hostNick === p.nick || !getPlayer(room, room.hostId)) {
    const next = connectedPlayers(room)[0];
    if (next) {
      room.hostId = next.id;
      room.hostNick = next.nick; // 완전히 나갔으므로 방장을 정식으로 넘긴다
      pushSystem(room, 'newHost', { nick: next.nick });
    }
  }
  broadcast(room);
}

/**
 * 잠깐 끊긴 것과 진짜 나간 것을 구분하기 위한 유예시간.
 * 이 안에 같은 닉네임으로 돌아오면 자리와 방장 권한을 그대로 되찾는다.
 */
const GRACE_MS = 45_000;

function scheduleReap(room, playerId) {
  const p = getPlayer(room, playerId);
  if (!p) return;
  if (p.reapTimer) clearTimeout(p.reapTimer);
  p.reapTimer = setTimeout(() => {
    const cur = getPlayer(room, playerId);
    if (!cur || cur.connected) return;
    if (!rooms.has(room.code)) return;
    removePlayer(room, playerId, 'reaped');
  }, GRACE_MS);
}

function handleLeave(socket, permanent) {
  const code = socket.data.roomCode;
  if (!code) return;
  const room = rooms.get(code);
  if (!room) return;

  const me = getPlayer(room, socket.id);
  if (!me) return;

  socket.leave(code);
  socket.data.roomCode = null;

  delete room.votes[socket.id];
  delete room.earlyVotes[socket.id];

  if (permanent) {
    removePlayer(room, socket.id, 'left');
    if (!rooms.has(room.code)) return;
  } else {
    // 대기실에서든 게임 중이든 일단 자리를 남겨두고 유예시간을 준다
    me.connected = false;
    pushSystem(room, 'dropped', { nick: me.nick });
    if (connectedPlayers(room).length === 0) {
      destroyRoom(room);
      return;
    }
    scheduleReap(room, socket.id);
  }

  // 방장이 끊겼더라도 자리는 유지된다. 다만 대기실이 멈추지 않도록
  // 연결된 사람에게 임시로 진행 권한을 넘긴다.
  if (!permanent && room.hostId === socket.id) {
    const next = connectedPlayers(room)[0];
    if (next) {
      room.hostId = next.id;
      pushSystem(room, 'tempHost', { nick: next.nick });
    }
  }

  // 게임 중이었다면 상황에 맞게 진행
  if (room.phase !== 'lobby' && room.phase !== 'result') {
    if (connectedPlayers(room).length < 2) {
      backToLobby(room, 'tooFew');
      return;
    }
    if (room.phase === 'draw' && room.round) {
      const currentId = room.round.order[room.round.turnIndex % room.round.order.length];
      if (currentId === socket.id) {
        endTurn(room, room.round.turnIndex);
        return;
      }
    }
    if (room.phase === 'vote') {
      maybeFinishVote(room);
      return;
    }
    if (room.phase === 'discuss') {
      // 남은 사람들끼리 이미 전원 동의 상태일 수 있으므로 다시 확인
      const conn = connectedPlayers(room);
      if (conn.length > 0 && conn.every((p) => room.earlyVotes[p.id])) {
        pushSystem(room, 'earlyAll');
        startVote(room);
        return;
      }
    }
    if (room.phase === 'guess' && room.guess && room.guess.mafiaId === socket.id) {
      // 맞혀야 할 마피아가 나가면 오답 처리
      finalizeResult(room, null);
      return;
    }
  }

  broadcast(room);
}

/* ------------------------------------------------------------------ */

server.listen(PORT, () => {
  console.log('');
  console.log('  🎨  그림 마피아 서버 실행 중');
  console.log(`  ➜  http://localhost:${PORT}`);
  console.log('     (브라우저 탭 4개 이상 열어서 테스트하세요)');
  console.log('');
});
