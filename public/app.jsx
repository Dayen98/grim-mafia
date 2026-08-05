/* 그림 마피아 - 클라이언트 (빌드 없이 브라우저에서 Babel로 변환) */

const { useState, useEffect, useRef, useCallback } = React;

const CANVAS_W = 900;
const CANVAS_H = 560;

/* ------------------------------------------------------------------ */
/* 다국어 (한국어 / English)                                           */
/* ------------------------------------------------------------------ */

const I18N = {
  ko: {
    tagline: '누가 마피아인 걸 속이고 그릴까?',
    nick: '닉네임 (최대 12자)', nickPh: '예: 홍길동',
    myChar: '내 캐릭터', createRoom: '새 방 만들기', roomCode: '방 코드', enter: '입장',
    connecting: '서버에 연결하는 중...', needNick: '닉네임을 입력해주세요.', reqFail: '요청에 실패했습니다.',
    rulesTitle: '규칙 요약',
    rulesSum: '· 4~12명이 모이면 시작. 시민은 단어를, 마피아는 카테고리만 받습니다.\n· 한 캔버스에 순서대로 한 획씩 이어 그립니다.\n· 토론 → 투표 → 마피아를 잡고 단어까지 못 맞히게 하면 시민 승리!',
    lobby: '대기실', reveal: '역할 확인', draw: '그리기', discuss: '토론', vote: '투표',
    guess: '마피아 찬스', result: '결과',
    round: '라운드', category: '카테고리', leave: '나가기',
    lobbyTitle: '대기실',
    shareCode: '친구에게 코드 {code} 를 알려주세요. ({min}~{max}명 필요)',
    copyLink: '링크 복사', joinedNow: '현재 {n}명 참가 중',
    startGame: '게임 시작!', needMore: '{n}명 이상 모여야 시작할 수 있어요',
    waitHost: '방장이 게임을 시작하기를 기다리는 중...',
    soloTitle: '🤖 혼자 테스트하기', soloDesc: '봇이 대신 그리고 · 채팅하고 · 투표합니다',
    fillBots: '인원 채우기', botPlus: '봇 +1', botMinus: '봇 −1',
    players: '플레이가', playersN: '플레이어 {a}/{b}', me: ' (나)', disconnected: ' 끊김',
    chat: '채팅', send: '전송', chatPh: '메시지 입력...',
    chatGuardPh: '자유롭게 대화하세요 (정답 단어는 ❤️로 가려집니다)', censored: '정답 단어 가림',
    youCitizen: '🙂 당신은 시민', youMafia: '🔪 당신은 마피아!',
    citizenHint: '카테고리: {cat} — 마피아가 눈치채지 못하게 조금씩만 그리세요.',
    mafiaHint: '카테고리만 알고 있습니다. 시민인 척 그림을 이어 그리고, 단어를 추측하세요!',
    citizen: '🙂 시민', mafia: '🔪 마피아', word: '단어',
    revealSoon: '곧 그리기가 시작됩니다. 그리는 순서는 오른쪽 목록의 번호를 확인하세요.',
    myTurn: '✏️ 내 차례입니다! 그리세요', drawingNow: '✏️ {nick} 님이 그리는 중...',
    discussNow: '💬 토론 중 — 누가 어색했나요?', voteNow: '🗳️ 마피아를 지목하세요',
    guessNow: '🔪 마피아가 단어를 맞히는 중...', finishedArt: '🖼️ 완성된 그림',
    turnCount: '{i}/{total} 턴 · {lap}/{laps} 바퀴', skipTurn: '턴 넘기기 ⏭',
    eraser: '지우개(흰색)',
    earlyGo: '🗳️ 바로 투표하러 가기', earlyDone: '✅ 투표 찬성함 (누르면 취소)',
    earlyHint: '전원이 동의하면 토론을 끝내고 즉시 투표 — {a}/{b} 명 동의',
    votePick: '🗳️ 마피아로 의심되는 사람을 지목하세요',
    voteThis: '이 사람 지목', voteMine: '내 표 ✔',
    voteProgress: '{a}/{b} 명 투표 완료 — 전원 투표하면 바로 결과로 넘어갑니다',
    voteBtn: '투표', votedBtn: '투표함',
    gpTitle: '🔪 마피아 최후의 찬스',
    gpLead: '{nick} 님이 마피아로 지목되었습니다.',
    gpLead2: '여기서 단어를 맞히면 마피아 역전승, 못 맞히면 시민 승리!',
    gpTypeHint: '카테고리 {cat} — 정답 단어를 직접 입력하세요',
    gpPickHint: '카테고리 {cat} — 정답이라고 생각하는 단어를 고르세요',
    gpWaiting: '{nick} 님이 고르는 중입니다...', gpTyping: '{nick} 님이 입력하는 중입니다...',
    submit: '제출', gpPh: '예: 기린',
    winCitizens: '🎉 시민 승리!', winMafia: '🔪 마피아 승리!',
    answerWord: '정답 단어', mafiaWas: '마피아는', topVote: '최다 득표',
    tieNobody: '동점 (지목 실패)', nobodyPicked: '아무도 지목하지 못했습니다.',
    gotMafia: '마피아를 잡았습니다!', wasInnocent: '무고한 시민이었습니다...',
    lastChance: '{nick} 님의 최후 찬스 — ', timedOut: '시간 안에 고르지 못했습니다.',
    picked: '"{w}" 선택 → ', correct: '정답!', wrong: '오답!', options: '보기: ',
    voteResult: '투표 결과', votes: '표',
    playAgain: '다시하기 (새 라운드)', toLobby: '대기실로',
    waitNext: '방장이 다음 라운드를 시작하기를 기다리는 중...',
    scoreTitle: '🏆 누적 점수', roundsPlayed: '· {n}라운드 진행',
    roundScore: '🏆 누적 점수 (라운드 {n} 종료)', resetScore: '점수 초기화',
    scoreRule: '시민 승리 시민 +1 (마피아 지목 시 +1 더) · 마피아 승리 +3 · 마피아 역전승 +2',
    pts: '점',
    setTitle: '⚙️ 방 설정', hostOnly: '(방장만 변경 가능)',
    sTurn: '한 턴 시간', sTurnH: '한 획을 그을 수 있는 제한시간',
    sLaps: '1인당 획 수', sLapsH: '각자 몇 번 그릴지 · {info}',
    lapInfo: '현재 {p}명 × {l}획 = 그림 총 {t}획', lapAuto: ' (자동: 9명 이상이면 1획)',
    sDiscuss: '토론 시간', sDiscussH: '전원 동의 시 일찍 끝낼 수 있음',
    sVote: '투표 시간', sVoteH: '전원 투표하면 즉시 종료',
    sGuessMode: '마피아 찬스', sGuessModeH: '잡힌 마피아가 단어를 맞히는 방식',
    sGuessMs: '맞히기 시간', sCats: '카테고리', sCatsH: '출제할 단어 묶음',
    sAll: '전체', sDefault: '기본', sText: '주관식', sChoice: '객관식',
    sAuto: '자동', sCustom: '커스텀 단어',
    sCustomH: '쉼표로 구분 · 4개 이상이면 "이것만 쓰기" 가능',
    sCustomPh: '예: 김치, 롤러코스터, 우산',
    sCustomOnly: '커스텀 단어만 사용 ({n}개 등록됨)',
    sec: '초', min: '분', strokes: '획',
    rbTitle: '📖 게임 방법',
    winC: '시민 승리', winM: '마피아 승리',
    winCDesc: '마피아를 지목하고, 마피아가 단어도 못 맞혔을 때',
    winMDesc: '안 들켰거나, 들켰어도 단어를 맞혔을 때',
    anDiscuss: '토론 시간', anDiscussS: '그림을 보고 마피아를 찾아보세요',
    anVote: '투표 시간', anVoteS: '마피아로 의심되는 사람을 지목하세요',
    anGuess: '마피아 최후의 찬스', anGuessS: '단어를 맞히면 역전승!',
    anResult: '결과 발표', anResultS: '과연 마피아는 누구였을까요?',
    tfMine: '✏️ 내 차례!', tfMineS: '한 획만 그으세요 — 손을 떼면 다음 사람',
    tfTurn: '님 차례', tfCount: '{n} / {total} 턴',
    loading: '로딩 중...',
    catAll: '전체',
    sys: {
      created: '{nick} 님이 방을 만들었습니다.',
      joined: '{nick} 님이 입장했습니다.',
      rejoined: '{nick} 님이 다시 연결했습니다.',
      left: '{nick} 님이 나갔습니다.',
      reaped: '{nick} 님이 돌아오지 않아 자리를 비웠습니다.',
      dropped: '{nick} 님의 연결이 끊겼습니다.',
      newHost: '{nick} 님이 새 방장이 되었습니다.',
      tempHost: '방장이 끊겨 {nick} 님이 임시 방장이 되었습니다.',
      roundStart: '라운드 {n} 시작! 카테고리는 "{cat}" 입니다.',
      turnOf: '{nick} 님의 차례입니다. 한 획! ({i}/{total})',
      discussStart: '그림 완성! 토론 시간입니다. 누가 마피아일까요?',
      earlyYes: '🗳️ {nick} 님이 바로 투표하자고 했습니다. ({a}/{b} 찬성)',
      earlyNo: '↩️ {nick} 님이 투표 찬성을 취소했습니다. ({a}/{b} 찬성)',
      earlyAll: '전원 동의! 토론을 끝내고 바로 투표합니다.',
      voteStart: '투표 시간! 마피아로 의심되는 사람에게 투표하세요.',
      caught: '{nick} 님은 마피아였습니다! 마지막 기회 — 단어를 맞히면 마피아 역전승!',
      guessRight: '{nick} 님이 단어 "{word}"를 맞혔습니다! 마피아 역전승!',
      guessTimeout: '시간 초과! 단어를 맞히지 못했습니다. 시민 승리! (정답: {word})',
      guessWrong: '"{chosen}" 오답! 정답은 "{word}" 였습니다. 시민 승리!',
      tie: '동점으로 아무도 지목되지 않았습니다. 마피아 승리! (정답: {word})',
      wrongTarget: '{nick} 님은 시민이었습니다... 마피아 승리! (정답: {word}, 마피아: {mafias})',
      backLobby: '대기실로 돌아왔습니다.',
      backLobbyFew: '인원이 부족해 대기실로 돌아갑니다.',
      tooFew: '인원이 너무 적어 게임을 종료합니다.',
      scoreReset: '점수를 초기화했습니다.',
      botsIn: '🤖 연습용 봇 {names} 이(가) 들어왔습니다.',
      botOut: '🤖 {nick} 이(가) 나갔습니다.',
    },
  },

  en: {
    tagline: 'Who is secretly the impostor?',
    nick: 'Nickname (max 12)', nickPh: 'e.g. Alex',
    myChar: 'My character', createRoom: 'Create room', roomCode: 'Room code', enter: 'Join',
    connecting: 'Connecting to server...', needNick: 'Please enter a nickname.', reqFail: 'Request failed.',
    rulesTitle: 'Quick rules',
    rulesSum: '· 4-12 players. Citizens get a word, the impostor only gets the category.\n· Everyone adds ONE stroke to the same canvas, in turn.\n· Discuss → vote → catch the impostor AND stop them guessing to win!',
    lobby: 'Lobby', reveal: 'Your role', draw: 'Drawing', discuss: 'Discussion', vote: 'Voting',
    guess: 'Last chance', result: 'Result',
    round: 'Round', category: 'Category', leave: 'Leave',
    lobbyTitle: 'Lobby',
    shareCode: 'Share code {code} with friends. ({min}-{max} players)',
    copyLink: 'Copy link', joinedNow: '{n} players joined',
    startGame: 'Start game!', needMore: 'Need at least {n} players',
    waitHost: 'Waiting for the host to start...',
    soloTitle: '🤖 Play solo', soloDesc: 'Bots will draw, chat and vote for you',
    fillBots: 'Fill with bots', botPlus: 'Bot +1', botMinus: 'Bot −1',
    players: 'Players', playersN: 'Players {a}/{b}', me: ' (you)', disconnected: ' offline',
    chat: 'Chat', send: 'Send', chatPh: 'Type a message...',
    chatGuardPh: 'Chat freely (the secret word gets hidden as ❤️)', censored: 'word hidden',
    youCitizen: '🙂 You are a CITIZEN', youMafia: '🔪 You are the IMPOSTOR!',
    citizenHint: 'Category: {cat} — draw just enough, do not give it away.',
    mafiaHint: 'You only know the category. Blend in and figure out the word!',
    citizen: '🙂 Citizen', mafia: '🔪 Impostor', word: 'Word',
    revealSoon: 'Drawing starts soon. Check the numbers in the player list for turn order.',
    myTurn: '✏️ Your turn! Draw', drawingNow: '✏️ {nick} is drawing...',
    discussNow: '💬 Discussing — who seemed off?', voteNow: '🗳️ Pick the impostor',
    guessNow: '🔪 The impostor is guessing...', finishedArt: '🖼️ Finished drawing',
    turnCount: 'turn {i}/{total} · lap {lap}/{laps}', skipTurn: 'Skip turn ⏭',
    eraser: 'Eraser (white)',
    earlyGo: '🗳️ Skip to voting', earlyDone: '✅ Ready to vote (click to undo)',
    earlyHint: 'Vote starts when everyone agrees — {a}/{b} ready',
    votePick: '🗳️ Pick who you think is the impostor',
    voteThis: 'Vote for', voteMine: 'Your vote ✔',
    voteProgress: '{a}/{b} voted — result shows as soon as everyone votes',
    voteBtn: 'Vote', votedBtn: 'Voted',
    gpTitle: '🔪 Impostor’s last chance',
    gpLead: '{nick} was voted out as the impostor.',
    gpLead2: 'Guess the word to steal the win — miss it and the citizens win!',
    gpTypeHint: 'Category {cat} — type the secret word',
    gpPickHint: 'Category {cat} — pick the word you think it is',
    gpWaiting: '{nick} is choosing...', gpTyping: '{nick} is typing...',
    submit: 'Submit', gpPh: 'e.g. giraffe',
    winCitizens: '🎉 Citizens win!', winMafia: '🔪 Impostor wins!',
    answerWord: 'The word', mafiaWas: 'Impostor', topVote: 'Most votes',
    tieNobody: 'Tie (nobody out)', nobodyPicked: 'Nobody was voted out.',
    gotMafia: 'You caught the impostor!', wasInnocent: 'An innocent citizen...',
    lastChance: '{nick}’s last chance — ', timedOut: 'Ran out of time.',
    picked: 'picked "{w}" → ', correct: 'Correct!', wrong: 'Wrong!', options: 'Options: ',
    voteResult: 'Vote result', votes: ' votes',
    playAgain: 'Play again (new round)', toLobby: 'Back to lobby',
    waitNext: 'Waiting for the host to start the next round...',
    scoreTitle: '🏆 Total score', roundsPlayed: '· {n} rounds played',
    roundScore: '🏆 Total score (after round {n})', resetScore: 'Reset scores',
    scoreRule: 'Citizens win: +1 each (+1 more if you voted the impostor) · Impostor wins: +3 · Steal: +2',
    pts: '',
    setTitle: '⚙️ Room settings', hostOnly: '(host only)',
    sTurn: 'Turn time', sTurnH: 'Time limit for one stroke',
    sLaps: 'Strokes each', sLapsH: 'How many times each player draws · {info}',
    lapInfo: 'Now {p} players × {l} = {t} strokes total', lapAuto: ' (auto: 1 when 9+ players)',
    sDiscuss: 'Discussion', sDiscussH: 'Can end early if everyone agrees',
    sVote: 'Voting', sVoteH: 'Ends as soon as everyone votes',
    sGuessMode: 'Last chance', sGuessModeH: 'How the caught impostor guesses',
    sGuessMs: 'Guess time', sCats: 'Categories', sCatsH: 'Which word sets to use',
    sAll: 'All', sDefault: 'default', sText: 'Type it', sChoice: 'Multiple choice',
    sAuto: 'Auto', sCustom: 'Custom words',
    sCustomH: 'Comma separated · 4+ words enables "only these"',
    sCustomPh: 'e.g. kimchi, rollercoaster, umbrella',
    sCustomOnly: 'Use only custom words ({n} added)',
    sec: 's', min: 'min', strokes: '',
    rbTitle: '📖 How to play',
    winC: 'Citizens', winM: 'Impostor',
    winCDesc: 'Vote out the impostor AND they fail to guess the word',
    winMDesc: 'Not caught, or caught but guessed the word',
    anDiscuss: 'Discussion', anDiscussS: 'Look at the drawing and find the impostor',
    anVote: 'Voting time', anVoteS: 'Pick who you suspect',
    anGuess: 'Impostor’s last chance', anGuessS: 'Guess the word to steal the win!',
    anResult: 'Results', anResultS: 'So who was the impostor?',
    tfMine: '✏️ Your turn!', tfMineS: 'One stroke only — lifting your pen ends your turn',
    tfTurn: '’s turn', tfCount: 'turn {n} / {total}',
    loading: 'Loading...',
    catAll: 'All',
    sys: {
      created: '{nick} created the room.',
      joined: '{nick} joined.',
      rejoined: '{nick} reconnected.',
      left: '{nick} left.',
      reaped: '{nick} did not come back and left the room.',
      dropped: '{nick} lost connection.',
      newHost: '{nick} is the new host.',
      tempHost: 'Host disconnected — {nick} is temporary host.',
      roundStart: 'Round {n} starts! The category is "{cat}".',
      turnOf: '{nick}’s turn. One stroke! ({i}/{total})',
      discussStart: 'Drawing done! Time to discuss. Who is the impostor?',
      earlyYes: '🗳️ {nick} wants to vote now. ({a}/{b} ready)',
      earlyNo: '↩️ {nick} is no longer ready to vote. ({a}/{b} ready)',
      earlyAll: 'Everyone agreed! Skipping to the vote.',
      voteStart: 'Voting time! Pick who you suspect.',
      caught: '{nick} was the impostor! Last chance — guess the word to steal the win!',
      guessRight: '{nick} guessed "{word}" correctly! The impostor steals the win!',
      guessTimeout: 'Out of time! No guess made. Citizens win! (word: {word})',
      guessWrong: '"{chosen}" is wrong! The word was "{word}". Citizens win!',
      tie: 'It was a tie, nobody was voted out. Impostor wins! (word: {word})',
      wrongTarget: '{nick} was innocent... Impostor wins! (word: {word}, impostor: {mafias})',
      backLobby: 'Back to the lobby.',
      backLobbyFew: 'Not enough players — back to the lobby.',
      tooFew: 'Too few players, ending the game.',
      scoreReset: 'Scores have been reset.',
      botsIn: '🤖 Practice bots {names} joined.',
      botOut: '🤖 {nick} left.',
    },
  },
};

// 카테고리 이름은 서버가 한국어로 보내므로 표시용으로만 번역한다
const CAT_EN = { 동물: 'Animals', 음식: 'Food', 직업: 'Jobs', 캐릭터: 'Characters', 커스텀: 'Custom' };

let LANG = (() => {
  const saved = localStorage.getItem('gm_lang');
  if (saved === 'ko' || saved === 'en') return saved;
  return (navigator.language || '').toLowerCase().startsWith('ko') ? 'ko' : 'en';
})();

function fill(str, vars) {
  if (!vars) return str;
  let out = String(str);
  for (const [k, v] of Object.entries(vars)) out = out.split('{' + k + '}').join(v);
  return out;
}

/** t('key') 또는 t('sys.key') */
function t(key, vars) {
  const pack = I18N[LANG] || I18N.ko;
  const val = key.startsWith('sys.')
    ? (pack.sys || {})[key.slice(4)] || I18N.ko.sys[key.slice(4)]
    : pack[key] !== undefined ? pack[key] : I18N.ko[key];
  return fill(val === undefined ? key : val, vars);
}

/** 카테고리 표시명 */
function catName(c) {
  if (LANG === 'en') return CAT_EN[c] || c;
  return c;
}

const phaseLabel = (p) => t(p) || p;

const RULE_STEPS_KO = [
  ['🎭', '역할을 받습니다', '시민은 구체적인 단어(예: 기린)를, 마피아는 카테고리(예: 동물)만 받습니다. 마피아는 단어를 모릅니다.'],
  ['✏️', '한 사람당 한 획씩', '순서대로 공유 캔버스에 그립니다. 마우스를 떼면 바로 다음 사람 차례! 시간을 넘기면 자동으로 넘어갑니다.'],
  ['🤔', '너무 잘 그려도 위험합니다', '시민은 마피아가 단어를 눈치채지 못할 만큼만 그려야 합니다. 마피아는 눈치껏 시민인 척 그리며 단어를 추측하세요.'],
  ['💬', '토론 후 투표', '완성된 그림을 보며 대화하고, 마피아로 의심되는 사람에게 투표합니다. 전원이 동의하면 토론을 일찍 끝낼 수 있습니다.'],
  ['🔪', '마피아의 마지막 반격', '마피아가 지목당해도 끝이 아닙니다. 단어를 맞히면 마피아 역전승! 못 맞히면 그때야 시민 승리입니다.'],
];

const RULE_STEPS_EN = [
  ['🎭', 'Get your role', 'Citizens get the exact word (e.g. giraffe). The impostor only gets the category (e.g. animals) and never sees the word.'],
  ['✏️', 'One stroke each', 'Players take turns on one shared canvas. Lifting your pen ends your turn immediately — and so does the timer.'],
  ['🤔', 'Drawing too well is risky', 'Citizens must draw just enough to prove they know the word, without handing it to the impostor. The impostor blends in and guesses.'],
  ['💬', 'Discuss, then vote', 'Talk about the finished drawing and vote for your suspect. If everyone agrees you can skip straight to the vote.'],
  ['🔪', 'The impostor strikes back', 'Getting caught is not the end — if the impostor guesses the word, they steal the win. Only a failed guess means the citizens win.'],
];

const ruleSteps = () =>
  (LANG === 'en' ? RULE_STEPS_EN : RULE_STEPS_KO).map(([icon, title, body]) => ({ icon, title, body }));

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/* ------------------------------------------------------------------ */
/* 타이머                                                              */
/* ------------------------------------------------------------------ */

function useCountdown(deadline, offset) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!deadline) return undefined;
    const t = setInterval(() => tick((n) => n + 1), 200);
    return () => clearInterval(t);
  }, [deadline]);
  if (!deadline) return null;
  return Math.max(0, Math.ceil((deadline - (Date.now() + offset)) / 1000));
}

/* ------------------------------------------------------------------ */
/* 캔버스                                                              */
/* ------------------------------------------------------------------ */

function redraw(ctx, strokes) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const s of strokes) {
    if (!s.points || s.points.length === 0) continue;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.size;
    ctx.beginPath();
    const [x0, y0] = s.points[0];
    ctx.moveTo(x0 * CANVAS_W, y0 * CANVAS_H);
    if (s.points.length === 1) {
      // 점 하나만 찍은 경우도 보이도록
      ctx.lineTo(x0 * CANVAS_W + 0.01, y0 * CANVAS_H);
    } else {
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i][0] * CANVAS_W, s.points[i][1] * CANVAS_H);
      }
    }
    ctx.stroke();
  }
}

function DrawCanvas({ strokesRef, dirtyRef, canDraw, color, size, socket }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastRef = useRef(null);

  // dirty 플래그가 설정된 경우에만 다시 그림.
  // rAF는 백그라운드 탭에서 멈추므로 setInterval 폴백을 함께 둔다.
  // (탭을 잠깐 벗어났다 돌아와도 캔버스가 항상 최신 상태가 되도록)
  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    const paint = () => {
      if (!dirtyRef.current) return;
      dirtyRef.current = false;
      redraw(ctx, strokesRef.current);
    };

    let raf;
    const loop = () => {
      paint();
      raf = requestAnimationFrame(loop);
    };

    dirtyRef.current = true;
    raf = requestAnimationFrame(loop);
    const fallback = setInterval(paint, 250);
    const onVisible = () => {
      dirtyRef.current = true;
      paint();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(fallback);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [strokesRef, dirtyRef]);

  // 내 턴이 끝나면 그리던 획을 정리
  useEffect(() => {
    if (!canDraw && drawingRef.current) {
      drawingRef.current = false;
      socket.emit('draw:end');
    }
  }, [canDraw, socket]);

  /* 아래 3개는 마우스/터치/펜 공통 핵심 로직.
     pt는 clientX/clientY만 있으면 되므로 PointerEvent든 Touch든 그대로 넘길 수 있다. */

  const posOf = (pt) => {
    const r = canvasRef.current.getBoundingClientRect();
    return {
      x: clamp01((pt.clientX - r.left) / r.width),
      y: clamp01((pt.clientY - r.top) / r.height),
    };
  };

  const beginAt = (pt) => {
    drawingRef.current = true;
    const p = posOf(pt);
    lastRef.current = p;
    socket.emit('draw:begin', { x: p.x, y: p.y, color, size });
  };

  const moveTo = (pt) => {
    if (!drawingRef.current || !canDraw) return;
    const p = posOf(pt);
    const l = lastRef.current;
    // 픽셀 단위로 1.5px 미만 이동은 버려서 전송량을 줄임
    if (l && Math.abs(p.x - l.x) * CANVAS_W < 1.5 && Math.abs(p.y - l.y) * CANVAS_H < 1.5) return;
    lastRef.current = p;
    socket.emit('draw:point', { x: p.x, y: p.y });
  };

  const endStroke = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    socket.emit('draw:end');
  };

  const onDown = (e) => {
    if (!canDraw) return;
    e.preventDefault();
    try {
      canvasRef.current.setPointerCapture(e.pointerId);
    } catch (_) {
      /* 무시 */
    }
    beginAt(e);
  };

  const onMove = (e) => moveTo(e);
  const onUp = () => endStroke();

  // 캔버스 밖에서 손을 뗀 경우에도 획이 확실히 끝나도록
  useEffect(() => {
    const end = () => endStroke();
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => {
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };
  });

  /* 터치 폴백.
     최신 모바일 브라우저(iOS 13+, Android Chrome)는 pointer 이벤트가 터치까지 처리하므로
     여기서 touch 리스너를 또 달면 한 번의 터치가 두 번 그려진다.
     그래서 pointer 이벤트를 지원하지 않는 구형 브라우저에서만 등록한다. */
  useEffect(() => {
    if (window.PointerEvent) return undefined;
    const cv = canvasRef.current;
    if (!cv) return undefined;

    const ts = (e) => {
      if (!canDraw || !e.touches[0]) return;
      e.preventDefault();
      beginAt(e.touches[0]);
    };
    const tm = (e) => {
      if (!e.touches[0]) return;
      e.preventDefault();
      moveTo(e.touches[0]);
    };
    const te = (e) => {
      e.preventDefault();
      endStroke();
    };

    cv.addEventListener('touchstart', ts, { passive: false });
    cv.addEventListener('touchmove', tm, { passive: false });
    cv.addEventListener('touchend', te, { passive: false });
    cv.addEventListener('touchcancel', te, { passive: false });
    return () => {
      cv.removeEventListener('touchstart', ts);
      cv.removeEventListener('touchmove', tm);
      cv.removeEventListener('touchend', te);
      cv.removeEventListener('touchcancel', te);
    };
  });

  return (
    <div className="canvas-wrap">
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className={canDraw ? 'drawable' : ''}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 홈 화면                                                             */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* 캐릭터(아바타)                                                      */
/* ------------------------------------------------------------------ */

const SKINS = ['#f6c9a0', '#e8a978', '#c98352', '#8d5a34', '#f2d7c2', '#b6d99a'];
const HAIRC = ['#2f2a26', '#6b4423', '#c98a2b', '#d94f4f', '#4a7fd4', '#9b59b6'];
const AV_LABEL_KO = { skin: '피부색', hair: '헤어', hairColor: '머리색', eyes: '눈', mouth: '입', acc: '악세사리' };
const AV_LABEL_EN = { skin: 'Skin', hair: 'Hair', hairColor: 'Hair color', eyes: 'Eyes', mouth: 'Mouth', acc: 'Accessory' };
const avLabel = (k) => (LANG === 'en' ? AV_LABEL_EN : AV_LABEL_KO)[k];
const AV_KEYS = ['skin', 'hair', 'hairColor', 'eyes', 'mouth', 'acc'];
const AV_MAX = { skin: 6, hair: 7, hairColor: 6, eyes: 6, mouth: 6, acc: 6 };

const defaultAvatar = () => ({ skin: 0, hair: 1, hairColor: 0, eyes: 0, mouth: 0, acc: 0 });
const randomAvatar = () => {
  const a = {};
  AV_KEYS.forEach((k) => (a[k] = Math.floor(Math.random() * AV_MAX[k])));
  return a;
};

/** 손그림 느낌의 얼굴 SVG. size만 바꾸면 어디서든 쓸 수 있다. */
function Avatar({ a, size = 44, className }) {
  const av = a || defaultAvatar();
  const skin = SKINS[av.skin] || SKINS[0];
  const hc = HAIRC[av.hairColor] || HAIRC[0];
  const S = { stroke: '#2f2a26', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' };

  const eyes = [
    <g key="e0" {...S} fill="#2f2a26"><circle cx="38" cy="52" r="4.5" /><circle cx="62" cy="52" r="4.5" /></g>,
    <g key="e1" {...S} fill="none"><path d="M32 52 q6 -8 12 0" /><path d="M56 52 q6 -8 12 0" /></g>,
    <g key="e2" {...S} fill="none"><path d="M32 48 q6 9 12 0" /><path d="M56 48 q6 9 12 0" /></g>,
    <g key="e3" {...S} fill="#fff"><ellipse cx="38" cy="52" rx="7" ry="8" /><ellipse cx="62" cy="52" rx="7" ry="8" />
      <circle cx="38" cy="53" r="3" fill="#2f2a26" stroke="none" /><circle cx="62" cy="53" r="3" fill="#2f2a26" stroke="none" /></g>,
    <g key="e4" {...S} fill="none"><path d="M33 52 h11" /><path d="M57 52 h11" /></g>,
    <g key="e5" {...S} fill="#2f2a26"><circle cx="38" cy="52" r="6" /><circle cx="62" cy="52" r="6" />
      <circle cx="40" cy="50" r="2" fill="#fff" stroke="none" /><circle cx="64" cy="50" r="2" fill="#fff" stroke="none" /></g>,
  ][av.eyes] || null;

  const mouth = [
    <path key="m0" d="M40 70 q10 10 20 0" {...S} fill="none" />,
    <path key="m1" d="M40 74 q10 -9 20 0" {...S} fill="none" />,
    <path key="m2" d="M42 70 h16" {...S} fill="none" />,
    <g key="m3" {...S}><path d="M38 68 q12 16 24 0 z" fill="#c9455a" /></g>,
    <circle key="m4" cx="50" cy="71" r="6" {...S} fill="#c9455a" />,
    <g key="m5" {...S} fill="none"><path d="M39 69 q6 8 11 0 q5 8 11 0" /></g>,
  ][av.mouth] || null;

  const hair = [
    null,
    <path key="h1" d="M22 44 q4 -26 28 -26 q24 0 28 26 q-6 -12 -28 -12 q-22 0 -28 12 z" fill={hc} {...S} />,
    <g key="h2" fill={hc} {...S}><path d="M20 46 q2 -30 30 -30 q28 0 30 30 q-4 -6 -8 -4 q-6 -14 -22 -14 q-16 0 -22 14 q-4 -2 -8 4 z" />
      <path d="M20 46 q-2 22 4 30 q-2 -18 2 -26 z" /><path d="M80 46 q2 22 -4 30 q2 -18 -2 -26 z" /></g>,
    <g key="h3" fill={hc} {...S}><path d="M22 44 l6 -18 l8 12 l7 -18 l7 18 l8 -12 l6 18 q-20 -10 -42 0 z" /></g>,
    <g key="h4" fill={hc} {...S}><path d="M22 44 q4 -26 28 -26 q24 0 28 26 q-6 -12 -28 -12 q-22 0 -28 12 z" />
      <path d="M78 40 q14 6 12 24 q-2 10 -10 10 q8 -14 -4 -30 z" /></g>,
    <g key="h5" fill={hc} {...S}><circle cx="32" cy="30" r="12" /><circle cx="50" cy="22" r="13" /><circle cx="68" cy="30" r="12" />
      <circle cx="26" cy="44" r="9" /><circle cx="74" cy="44" r="9" /></g>,
    <g key="h6" fill={hc} {...S}><path d="M24 42 q6 -24 26 -24 q20 0 26 24 q-8 -10 -26 -10 q-18 0 -26 10 z" />
      <path d="M50 12 q6 -8 12 -2 q-8 0 -10 6 z" /></g>,
  ][av.hair] || null;

  const acc = [
    null,
    <g key="a1" {...S} fill="none"><circle cx="38" cy="52" r="11" /><circle cx="62" cy="52" r="11" /><path d="M49 52 h2" /></g>,
    <g key="a2" {...S}><rect x="27" y="44" width="22" height="15" rx="4" fill="#2f2a26" /><rect x="51" y="44" width="22" height="15" rx="4" fill="#2f2a26" /><path d="M49 50 h2" /></g>,
    <g key="a3" {...S}><path d="M18 34 h64 l-6 -8 h-52 z" fill="#e4572e" /><path d="M28 26 q22 -14 44 0 z" fill="#e4572e" /></g>,
    <g key="a4" {...S}><path d="M66 26 l10 -8 l2 12 l10 4 l-11 5 l-1 11 l-8 -8 l-11 2 l5 -10 z" fill="#f2b705" /></g>,
    <g key="a5" {...S}><rect x="30" y="62" width="40" height="18" rx="7" fill="#7fd1e8" /><path d="M30 68 h40" /></g>,
  ][av.acc] || null;

  return (
    <svg className={'avatar ' + (className || '')} width={size} height={size} viewBox="0 0 100 100">
      <ellipse cx="50" cy="58" rx="30" ry="32" fill={skin} {...S} />
      <path d="M22 58 q-6 2 -4 8 q2 5 6 3" fill={skin} {...S} />
      <path d="M78 58 q6 2 4 8 q-2 5 -6 3" fill={skin} {...S} />
      {hair}
      {eyes}
      {mouth}
      {acc}
    </svg>
  );
}

/** < > 화살표로 항목을 바꾸는 캐릭터 편집기 */
function AvatarEditor({ value, onChange }) {
  const step = (k, d) => {
    const max = AV_MAX[k];
    onChange({ ...value, [k]: (((value[k] + d) % max) + max) % max });
  };
  return (
    <div className="avatar-editor">
      <div className="ae-preview">
        <Avatar a={value} size={104} />
        <button type="button" className="ae-dice" title="랜덤" onClick={() => onChange(randomAvatar())}>
          🎲
        </button>
      </div>
      <div className="ae-rows">
        {AV_KEYS.map((k) => (
          <div className="ae-row" key={k}>
            <span className="ae-label">{avLabel(k)}</span>
            <button type="button" onClick={() => step(k, -1)} aria-label={avLabel(k) + ' prev'}>
              ◀
            </button>
            <span className="ae-num">{value[k] + 1}</span>
            <button type="button" onClick={() => step(k, 1)} aria-label={avLabel(k) + ' next'}>
              ▶
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 손으로 그린 듯한 게임 로고.
   한글 글자는 손글씨 폰트로 쓰되, 글자마다 각도/크기를 조금씩 틀어
   스티커를 하나씩 붙인 것처럼 보이게 한다. */
/** 한국어 / English 전환 */
function LangToggle({ onChange, compact }) {
  return (
    <div className={'langtoggle' + (compact ? ' compact' : '')}>
      {[['ko', '한국어'], ['en', 'English']].map(([code, label]) => (
        <button
          key={code}
          type="button"
          className={'chip' + (LANG === code ? ' on' : '')}
          onClick={() => onChange(code)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Logo({ small }) {
  const word1 = ['그', '림'];
  const word2 = ['마', '피', '아'];
  const tilt = [-6, 4, -3, 6, -5];

  return (
    <div className={'logo' + (small ? ' logo-sm' : '')}>
      <svg className="logo-blob" viewBox="0 0 420 200" aria-hidden="true">
        <path d="M28 96 C 18 40, 92 14, 168 20 C 246 26, 330 8, 380 44
                 C 420 74, 400 140, 348 164 C 292 190, 180 178, 116 176
                 C 52 174, 38 148, 28 96 Z" />
      </svg>

      <div className="logo-words" role="img" aria-label="그림 마피아">
        <span className="logo-line">
          {word1.map((c, i) => (
            <span key={i} className="logo-ch" style={{ transform: `rotate(${tilt[i]}deg)` }}>
              {c}
            </span>
          ))}
        </span>
        <span className="logo-line logo-line2">
          {word2.map((c, i) => (
            <span key={i} className="logo-ch ch-red" style={{ transform: `rotate(${tilt[i + 2]}deg)` }}>
              {c}
            </span>
          ))}
        </span>
      </div>

      <svg className="logo-underline" viewBox="0 0 300 24" aria-hidden="true">
        <path d="M8 15 C 70 4, 140 22, 210 10 C 250 3, 275 12, 293 8" />
      </svg>

      <span className="logo-tag">{t('tagline')}</span>
    </div>
  );
}

function Home({ socket, connected, onLang }) {
  const [nick, setNick] = useState(() => localStorage.getItem('gm_nick') || '');
  const [code, setCode] = useState(() => (location.hash || '').replace('#', '').toUpperCase());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [avatar, setAvatar] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('gm_avatar') || 'null');
      return saved && typeof saved === 'object' ? { ...defaultAvatar(), ...saved } : randomAvatar();
    } catch (_) {
      return randomAvatar();
    }
  });

  const changeAvatar = (a) => {
    setAvatar(a);
    localStorage.setItem('gm_avatar', JSON.stringify(a));
  };

  const go = (event, payload) => {
    const n = nick.trim();
    if (!n) {
      setError(t('needNick'));
      return;
    }
    localStorage.setItem('gm_nick', n);
    localStorage.setItem('gm_avatar', JSON.stringify(avatar));
    setError('');
    setBusy(true);
    socket.emit(event, { nick: n, avatar, ...payload }, (res) => {
      setBusy(false);
      if (!res || !res.ok) {
        setError((res && res.error) || t('reqFail'));
        return;
      }
      // 연결이 잠깐 끊겨도 자동으로 돌아올 수 있게 기록
      sessionStorage.setItem('gm_session', JSON.stringify({ code: res.code, nick: n }));
      location.hash = res.code;
    });
  };

  return (
    <div className="home">
      <LangToggle onChange={onLang} />
      <Logo />

      <div className="field">
        <label>{t('nick')}</label>
        <input
          value={nick}
          maxLength={12}
          placeholder={t('nickPh')}
          onChange={(e) => setNick(e.target.value)}
        />
      </div>

      <div className="field">
        <label>{t('myChar')}</label>
        <AvatarEditor value={avatar} onChange={changeAvatar} />
      </div>

      <button
        className="primary"
        style={{ width: '100%' }}
        disabled={!connected || busy}
        onClick={() => go('room:create')}
      >
        {t('createRoom')}
      </button>

      <div className="divider" />

      <div className="field">
        <label>{t('roomCode')}</label>
        <div className="row">
          <input
            value={code}
            maxLength={6}
            placeholder="ABCDE"
            style={{ textTransform: 'uppercase', letterSpacing: 3, fontFamily: 'monospace' }}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && go('room:join', { code })}
          />
          <button
            style={{ flex: '0 0 90px' }}
            disabled={!connected || busy || !code.trim()}
            onClick={() => go('room:join', { code })}
          >
            {t('enter')}
          </button>
        </div>
      </div>

      <div className="error">{connected ? error : t('connecting')}</div>

      <div className="rules">
        <b>{t('rulesTitle')}</b>
        {t('rulesSum')
          .split('\n')
          .map((line, i) => (
            <React.Fragment key={i}>
              <br />
              {line}
            </React.Fragment>
          ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 사이드바 조각                                                       */
/* ------------------------------------------------------------------ */

function PlayerList({ st, socket, bubbles }) {
  const me = st.you;
  const orderIndex = (id) => {
    const i = st.order.indexOf(id);
    return i < 0 ? null : i + 1;
  };

  return (
    <div className="panel">
      <h3>
        {t('playersN', { a: st.players.filter((p) => p.connected).length, b: st.maxPlayers })}
      </h3>
      <div className="players">
        {st.players.map((p) => {
          const cls = [
            'player',
            p.id === st.currentDrawerId ? 'current' : '',
            p.id === me.id ? 'me' : '',
            p.connected ? '' : 'off',
          ]
            .filter(Boolean)
            .join(' ');
          const n = orderIndex(p.id);
          return (
            <div key={p.id} className={cls}>
              {n !== null && <span className="num">{n}</span>}
              <span className="pavatar">
                <Avatar a={p.avatar} size={36} />
                {bubbles && bubbles[p.id] && (
                  <span className="bubble" key={bubbles[p.id].id}>
                    {bubbles[p.id].text}
                  </span>
                )}
              </span>
              <span className="nick">
                {p.nick}
                {p.id === me.id && t('me')}
              </span>
              {st.roundNo > 0 && <span className="ptbadge">{p.score}{t('pts')}</span>}
              <span className="tag">
                {p.isBot && '🤖'}
                {p.isHost && '👑'}
                {!p.connected && t('disconnected')}
                {st.phase === 'vote' && st.votedIds.includes(p.id) && ' ✅'}
                {p.id === st.currentDrawerId && ' ✏️'}
              </span>
              {st.phase === 'vote' && p.id !== me.id && p.connected && (
                <button
                  className={me.myVote === p.id ? 'primary' : ''}
                  onClick={() => socket.emit('vote:cast', { targetId: p.id })}
                >
                  {me.myVote === p.id ? t('votedBtn') : t('voteBtn')}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Chat({ st, socket }) {
  const [text, setText] = useState('');
  const logRef = useRef(null);
  // 이제 그리는 중에도 채팅 가능. 정답 단어는 서버가 하트로 가려준다.
  const guarded = st.phase !== 'lobby' && st.phase !== 'result';
  const avatarOf = (pid) => {
    const p = st.players.find((x) => x.id === pid);
    return p ? p.avatar : null;
  };

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [st.chat.length]);

  const send = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    socket.emit('chat:send', { text: t });
    setText('');
  };

  return (
    <div className="panel">
      <h3>{t('chat')}</h3>
      <div className="chat-log" ref={logRef}>
        {st.chat.map((m) =>
          m.system ? (
            <div key={m.id} className="chat-msg sys">
              {m.k ? t('sys.' + m.k, { ...m.p, cat: m.p && m.p.cat ? catName(m.p.cat) : undefined }) : m.text}
            </div>
          ) : (
            <div key={m.id} className={'chat-msg' + (m.censored ? ' censored' : '')}>
              <Avatar a={avatarOf(m.playerId)} size={26} className="chat-av" />
              <span className="from">{m.nick}</span>
              <span className="chat-txt">{m.text}</span>
              {m.censored && <span className="censortag">{t('censored')}</span>}
            </div>
          )
        )}
      </div>
      <form className="chat-form" onSubmit={send}>
        <input
          value={text}
          maxLength={200}
          placeholder={guarded ? t('chatGuardPh') : t('chatPh')}
          onChange={(e) => setText(e.target.value)}
        />
        <button disabled={!text.trim()}>{t('send')}</button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 페이즈별 메인 영역                                                  */
/* ------------------------------------------------------------------ */

function Scoreboard({ st, socket, showReset }) {
  const ranked = st.players.slice().sort((a, b) => b.score - a.score);
  const top = ranked.length ? ranked[0].score : 0;
  if (top === 0 && st.roundNo === 0) return null;

  return (
    <div className="panel scorepanel">
      <h3>
        {t('scoreTitle')} {st.roundNo > 0 && <span className="muted">{t('roundsPlayed', { n: st.roundNo })}</span>}
      </h3>
      <div className="scorelist">
        {ranked.map((p, i) => (
          <div key={p.id} className={'scorerow' + (p.id === st.you.id ? ' me' : '')}>
            <span className={'rank r' + (i + 1)}>{i === 0 && top > 0 ? '👑' : i + 1}</span>
            <span className="sname">
              {p.nick}
              {!p.connected && <span className="muted"> (끊김)</span>}
            </span>
            <span className="sbar">
              <span style={{ width: top > 0 ? (p.score / top) * 100 + '%' : '0%' }} />
            </span>
            <span className="spts">{p.score}</span>
          </div>
        ))}
      </div>
      {showReset && st.you.isHost && (
        <button
          style={{ marginTop: 10, width: '100%' }}
          onClick={() => socket.emit('score:reset')}
        >
          {t('resetScore')}
        </button>
      )}
      <div className="scorerule muted">
        {t('scoreRule')}
      </div>
    </div>
  );
}

function RuleBook({ compact }) {
  return (
    <div className={'rulebook' + (compact ? ' compact' : '')}>
      <div className="rulebook-title">{t('rbTitle')}</div>
      <ol className="rulesteps">
        {ruleSteps().map((s, i) => (
          <li key={i}>
            <span className="ri">{s.icon}</span>
            <div>
              <b>{s.title}</b>
              <div className="rb">{s.body}</div>
            </div>
          </li>
        ))}
      </ol>
      <div className="rulewin">
        <span className="win-c">{t('winC')}</span> {t('winCDesc')}
        <br />
        <span className="win-m">{t('winM')}</span> {t('winMDesc')}
      </div>
    </div>
  );
}

function SettingsPanel({ st, socket }) {
  const s = st.settings;
  const host = st.you.isHost;
  const set = (patch) => host && socket.emit('settings:set', patch);

  // "1인당 획 수"가 헷갈리지 않도록 실제 총 획 수를 같이 보여준다
  const people = st.players.filter((p) => p.connected).length;
  const autoLaps = people >= 9 ? 1 : 2;
  const effLaps = s.laps > 0 ? s.laps : autoLaps;
  const lapText =
    t('lapInfo', { p: people, l: effLaps, t: people * effLaps }) + (s.laps === 0 ? t('lapAuto') : '');

  const Row = ({ label, hint, children }) => (
    <div className="set-row">
      <span className="set-label">
        {label}
        {hint && <em>{hint}</em>}
      </span>
      <span className="set-ctl">{children}</span>
    </div>
  );

  // def = 기본값. 칩에 작게 "기본" 표시를 달아준다.
  const Choice = ({ field, opts, def }) => (
    <span className="chips">
      {opts.map(([v, txt]) => (
        <button
          key={String(v)}
          type="button"
          disabled={!host}
          className={'chip' + (s[field] === v ? ' on' : '')}
          onClick={() => set({ [field]: v })}
        >
          {txt}
          {v === def && <em className="defmark">{t('sDefault')}</em>}
        </button>
      ))}
    </span>
  );

  return (
    <div className="panel setpanel">
      <h3>{t('setTitle')} {!host && <span className="muted">{t('hostOnly')}</span>}</h3>

      <Row label={t('sTurn')} hint={t('sTurnH')}>
        <Choice
          field="turnMs"
          def={15000}
          opts={[8000, 10000, 15000, 20000, 30000].map((v) => [v, v / 1000 + t('sec')])}
        />
      </Row>

      <Row label={t('sLaps')} hint={t('sLapsH', { info: lapText })}>
        <Choice
          field="laps"
          def={0}
          opts={[[0, t('sAuto')], [1, '1' + t('strokes')], [2, '2' + t('strokes')], [3, '3' + t('strokes')], [4, '4' + t('strokes')]]}
        />
      </Row>

      <Row label={t('sDiscuss')} hint={t('sDiscussH')}>
        <Choice
          field="discussMs"
          def={60000}
          opts={[[30000, 30 + t('sec')], [60000, 60 + t('sec')], [90000, 90 + t('sec')], [120000, 2 + t('min')]]}
        />
      </Row>

      <Row label={t('sVote')} hint={t('sVoteH')}>
        <Choice
          field="voteMs"
          def={30000}
          opts={[15000, 30000, 45000, 60000].map((v) => [v, v / 1000 + t('sec')])}
        />
      </Row>

      <Row label={t('sGuessMode')} hint={t('sGuessModeH')}>
        <Choice field="guessMode" def="text" opts={[['text', t('sText')], ['choice', t('sChoice')]]} />
      </Row>

      <Row label={t('sGuessMs')}>
        <Choice
          field="guessMs"
          def={30000}
          opts={[15000, 30000, 45000, 60000].map((v) => [v, v / 1000 + t('sec')])}
        />
      </Row>

      <Row label={t('sCats')} hint={t('sCatsH')}>
        <span className="chips">
          <button
            type="button"
            disabled={!host}
            className={'chip' + (s.categories.length === 0 ? ' on' : '')}
            onClick={() => set({ categories: [] })}
          >
            {t('sAll')}<em className="defmark">{t('sDefault')}</em>
          </button>
          {st.categoryList.map((c) => {
            const on = s.categories.includes(c);
            return (
              <button
                key={c}
                type="button"
                disabled={!host}
                className={'chip' + (on ? ' on' : '')}
                onClick={() =>
                  set({ categories: on ? s.categories.filter((x) => x !== c) : [...s.categories, c] })
                }
              >
                {catName(c)}
              </button>
            );
          })}
        </span>
      </Row>

      <div className="set-row col">
        <span className="set-label">
          {t('sCustom')}<em>{t('sCustomH')}</em>
        </span>
        <input
          disabled={!host}
          defaultValue={s.customWords.join(', ')}
          placeholder={t('sCustomPh')}
          onBlur={(e) => set({ customWords: e.target.value })}
        />
        <label className={'checkline' + (s.customWords.length < 4 ? ' off' : '')}>
          <input
            type="checkbox"
            disabled={!host || s.customWords.length < 4}
            checked={s.customOnly}
            onChange={(e) => set({ customOnly: e.target.checked })}
          />
          {t('sCustomOnly', { n: s.customWords.length })}
        </label>
      </div>
    </div>
  );
}

function Lobby({ st, socket }) {
  const ready = st.players.filter((p) => p.connected).length;
  const botCount = st.players.filter((p) => p.isBot).length;
  const canStart = st.you.isHost && ready >= st.minPlayers && ready <= st.maxPlayers;
  const link = location.origin + '/#' + st.code;

  return (
    <div className="panel center">
      <h2 style={{ marginTop: 0 }}>{t('lobbyTitle')}</h2>
      <p className="muted">
        {t('shareCode', { code: st.code, min: st.minPlayers, max: st.maxPlayers })}
      </p>
      <div className="row" style={{ maxWidth: 420, margin: '0 auto 16px' }}>
        <input readOnly value={link} onFocus={(e) => e.target.select()} />
        <button
          style={{ flex: '0 0 100px' }}
          onClick={() => navigator.clipboard && navigator.clipboard.writeText(link)}
        >
          {t('copyLink')}
        </button>
      </div>
      <p style={{ fontSize: 18 }}>
        {t('joinedNow', { n: ready })}
      </p>
      {st.you.isHost ? (
        <React.Fragment>
          <button className="primary" disabled={!canStart} onClick={() => socket.emit('game:start')}>
            {canStart ? t('startGame') : t('needMore', { n: st.minPlayers })}
          </button>

          <div className="botbar">
            <span className="bot-title">{t('soloTitle')}</span>
            <span className="muted">{t('soloDesc')}</span>
            <div className="row" style={{ marginTop: 8 }}>
              <button
                onClick={() => socket.emit('bot:add', { count: Math.max(1, st.minPlayers - ready) })}
                disabled={ready >= st.maxPlayers}
              >
                {t('fillBots')}
              </button>
              <button onClick={() => socket.emit('bot:add', { count: 1 })} disabled={ready >= st.maxPlayers}>
                {t('botPlus')}
              </button>
              <button onClick={() => socket.emit('bot:remove')} disabled={!botCount}>
                {t('botMinus')}
              </button>
            </div>
          </div>
        </React.Fragment>
      ) : (
        <p className="muted">{t('waitHost')}</p>
      )}

      <div style={{ marginTop: 20, textAlign: 'left' }}>
        <SettingsPanel st={st} socket={socket} />
        <Scoreboard st={st} socket={socket} showReset />
        <RuleBook />
      </div>
    </div>
  );
}

function RoleCard({ you }) {
  const mafia = you.role === 'mafia';
  return (
    <div className={'rolecard ' + (mafia ? 'mafia' : 'citizen')}>
      <div className="role">{mafia ? t('youMafia') : t('youCitizen')}</div>
      <div className="word">{mafia ? catName(you.category) : you.word}</div>
      <div className="hint">
        {mafia
          ? t('mafiaHint')
          : t('citizenHint', { cat: catName(you.category) })}
      </div>
    </div>
  );
}

function RoleStrip({ you }) {
  const mafia = you.role === 'mafia';
  return (
    <div className={'rolestrip ' + (mafia ? 'mafia' : 'citizen')}>
      <span>{mafia ? t('mafia') : t('citizen')}</span>
      <span className="muted">{t('category')}</span>
      <b>{catName(you.category)}</b>
      <span className="muted">|</span>
      <span className="muted">{t('word')}</span>
      <b>{mafia ? '???' : you.word}</b>
    </div>
  );
}

function Toolbar({ st, socket, color, setColor, size, setSize, myTurn }) {
  return (
    <div className="tools">
      {st.palette.map((c) => (
        <button
          key={c}
          className={'swatch' + (c === color ? ' on' : '')}
          style={{ background: c }}
          title={c === '#ffffff' ? '지우개(흰색)' : c}
          onClick={() => setColor(c)}
        />
      ))}
      <span style={{ width: 10 }} />
      {st.sizes.map((s) => (
        <button
          key={s}
          className={'sizebtn' + (s === size ? ' on' : '')}
          onClick={() => setSize(s)}
        >
          {s}
        </button>
      ))}
      <span className="spacer" />
      {myTurn && <button onClick={() => socket.emit('turn:skip')}>턴 넘기기 ⏭</button>}
    </div>
  );
}

function EarlyVoteBar({ st, socket }) {
  const conn = st.players.filter((p) => p.connected);
  const agreed = st.earlyVoteIds.filter((id) => conn.some((p) => p.id === id)).length;
  return (
    <div className="earlyvote">
      <button
        className={st.you.earlyVoted ? 'primary' : ''}
        onClick={() => socket.emit('vote:early')}
      >
        {st.you.earlyVoted ? t('earlyDone') : t('earlyGo')}
      </button>
      <span className="muted">
        {t('earlyHint', { a: agreed, b: conn.length })}
      </span>
    </div>
  );
}

function VotePanel({ st, socket }) {
  const me = st.you;
  const conn = st.players.filter((p) => p.connected);
  const others = conn.filter((p) => p.id !== me.id);
  return (
    <div className="votepanel">
      <div className="vp-title">{t('votePick')}</div>
      <div className="vp-grid">
        {others.map((p) => (
          <button
            key={p.id}
            className={'vp-card' + (me.myVote === p.id ? ' on' : '')}
            onClick={() => socket.emit('vote:cast', { targetId: p.id })}
          >
            <span className="vp-nick">{p.nick}</span>
            <span className="vp-state">{me.myVote === p.id ? t('voteMine') : t('voteThis')}</span>
          </button>
        ))}
      </div>
      <div className="muted center" style={{ marginTop: 8 }}>
        {t('voteProgress', { a: st.votedIds.length, b: conn.length })}
      </div>
    </div>
  );
}

function GuessPanel({ st, socket }) {
  const g = st.guess;
  const [typed, setTyped] = useState('');
  if (!g) return null;
  const mine = st.you.isGuesser;

  // 주관식 모드
  if (g.mode === 'text') {
    return (
      <div className="panel guesspanel">
        <div className="gp-title">{t('gpTitle')}</div>
        <p className="center">
          {t('gpLead', { nick: g.mafiaNick })}
          <br />
          {t('gpLead2')}
        </p>
        {mine ? (
          <form
            className="gp-textform"
            onSubmit={(e) => {
              e.preventDefault();
              if (typed.trim()) socket.emit('guess:submit', { word: typed.trim() });
            }}
          >
            <p className="center muted">
              {t('gpTypeHint', { cat: catName(st.category) })}
            </p>
            <div className="row" style={{ maxWidth: 420, margin: '0 auto' }}>
              <input
                autoFocus
                value={typed}
                maxLength={30}
                placeholder={t('gpPh')}
                onChange={(e) => setTyped(e.target.value)}
              />
              <button className="primary" style={{ flex: '0 0 90px' }} disabled={!typed.trim()}>
                {t('submit')}
              </button>
            </div>
          </form>
        ) : (
          <p className="center muted">{t('gpTyping', { nick: g.mafiaNick })}</p>
        )}
      </div>
    );
  }

  return (
    <div className="panel guesspanel">
      <div className="gp-title">{t('gpTitle')}</div>
      <p className="center">
        {t('gpLead', { nick: g.mafiaNick })}
        <br />
        {t('gpLead2')}
      </p>
      {mine ? (
        <React.Fragment>
          <p className="center muted">
            {t('gpPickHint', { cat: catName(st.category) })}
          </p>
          <div className="gp-grid">
            {g.options.map((w) => (
              <button key={w} className="gp-opt" onClick={() => socket.emit('guess:submit', { word: w })}>
                {w}
              </button>
            ))}
          </div>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <p className="center muted">{t('gpWaiting', { nick: g.mafiaNick })}</p>
          <div className="gp-grid">
            {g.options.map((w) => (
              <div key={w} className="gp-opt dim">
                {w}
              </div>
            ))}
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

function Result({ st, socket }) {
  const r = st.result;
  if (!r) return null;
  const max = Math.max(1, ...r.tally.map((row) => row.count));

  return (
    <div className="panel">
      <div className={'result-banner ' + (r.citizensWin ? 'citizens' : 'mafia')}>
        {r.citizensWin ? t('winCitizens') : t('winMafia')}
      </div>

      <div className="result-grid">
        <div className="result-box">
          <div className="k">{t('answerWord')}</div>
          <div className="v">{r.word}</div>
          <div className="k" style={{ marginTop: 4 }}>
            {t('category')}: {catName(r.category)}
          </div>
        </div>
        <div className="result-box">
          <div className="k">{t('mafiaWas')}</div>
          <div className="v" style={{ color: 'var(--danger)' }}>{r.mafiaNicks.join(', ')}</div>
        </div>
        <div className="result-box">
          <div className="k">{t('topVote')}</div>
          <div className="v">
            {r.tie
              ? t('tieNobody')
              : `${r.eliminated.nick} (${r.eliminated.count}${t('votes')})`}
          </div>
          <div className="k" style={{ marginTop: 4 }}>
            {r.tie
              ? t('nobodyPicked')
              : r.eliminatedWasMafia
              ? t('gotMafia')
              : t('wasInnocent')}
          </div>
        </div>
      </div>

      {r.guess && (
        <div className={'guessresult ' + (r.guess.correct ? 'bad' : 'good')}>
          {t('lastChance', { nick: r.guess.mafiaNick })}
          {r.guess.timedOut ? (
            <span>{t('timedOut')}</span>
          ) : (
            <span>
              {t('picked', { w: r.guess.chosen })}
              {r.guess.correct ? t('correct') : t('wrong')}
            </span>
          )}
          {/* 주관식 모드에서는 보기가 없으므로(options === null) 이 줄을 건너뛴다 */}
          {r.guess.options && r.guess.options.length > 0 && (
            <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
              {t('options')}
              {r.guess.options.join(' · ')}
            </div>
          )}
        </div>
      )}

      {r.scoreboard && (
        <div className="roundscore">
          <h3 style={{ marginTop: 0 }}>{t('roundScore', { n: st.roundNo })}</h3>
          {r.scoreboard.map((s, i) => (
            <div key={s.id} className={'scorerow' + (s.id === st.you.id ? ' me' : '')}>
              <span className={'rank r' + (i + 1)}>{i === 0 ? '👑' : i + 1}</span>
              <span className="sname">
                {s.nick}
                {s.wasMafia && <span className="mafiatag"> 🔪</span>}
              </span>
              <span className={'sdelta' + (s.delta > 0 ? ' up' : '')}>
                {s.delta > 0 ? '+' + s.delta : '—'}
              </span>
              <span className="spts">{s.score}</span>
            </div>
          ))}
        </div>
      )}

      <h3>{t('voteResult')}</h3>
      {r.tally.map((row) => (
        <div key={row.id} className={'tally-row' + (r.mafiaIds.includes(row.id) ? ' mafia' : '')}>
          <span className="name">{row.nick}</span>
          <span className="bar" style={{ width: (row.count / max) * 200 + 'px' }} />
          <span>
            {row.count}
            {t('votes')}
          </span>
        </div>
      ))}

      <div className="muted" style={{ marginTop: 10, fontSize: 12 }}>
        {r.votes.map((v, i) => (
          <div key={i}>
            {v.voter} → {v.target}
          </div>
        ))}
      </div>

      {st.you.isHost ? (
        <div className="row" style={{ marginTop: 16 }}>
          <button className="primary" onClick={() => socket.emit('game:again')}>
            {t('playAgain')}
          </button>
          <button onClick={() => socket.emit('game:lobby')}>{t('toLobby')}</button>
        </div>
      ) : (
        <p className="muted center" style={{ marginTop: 16 }}>
          {t('waitNext')}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 게임 화면                                                           */
/* ------------------------------------------------------------------ */

function Game({ st, socket, offset, strokesRef, dirtyRef, onLeave, onLang }) {
  const [color, setColor] = useState('#111827');
  const [size, setSize] = useState(6);
  const remain = useCountdown(st.deadline, offset);

  const myTurn = st.phase === 'draw' && st.currentDrawerId === st.you.id;
  const drawer = st.players.find((p) => p.id === st.currentDrawerId);
  const showCanvas = st.phase !== 'lobby';

  // 차례가 바뀔 때마다 화면 중앙에 2초간 알림
  const [turnFlash, setTurnFlash] = useState(null);
  const lastTurnRef = useRef(null);
  useEffect(() => {
    if (st.phase !== 'draw' || !st.currentDrawerId) {
      lastTurnRef.current = null;
      return undefined;
    }
    const key = st.roundNo + ':' + st.turnIndex;
    if (lastTurnRef.current === key) return undefined;
    lastTurnRef.current = key;

    const who = st.players.find((p) => p.id === st.currentDrawerId);
    setTurnFlash({
      key,
      nick: who ? who.nick : '?',
      mine: st.currentDrawerId === st.you.id,
      n: st.turnIndex + 1,
      total: st.totalTurns,
    });
    // 변수명을 t로 두면 번역 함수 t()를 가려버리므로 쓰지 말 것
    const timer = setTimeout(() => setTurnFlash(null), 2000);
    return () => clearTimeout(timer);
  }, [st.phase, st.roundNo, st.turnIndex, st.currentDrawerId, st.you.id]);

  // 남은 시간이 5초 이하면 화면 가장자리를 붉게 점멸
  const urgent = st.phase === 'draw' && remain !== null && remain <= 5;

  // 새 채팅이 오면 그 사람 캐릭터 옆에 말풍선을 잠깐 띄운다
  const [bubbles, setBubbles] = useState({});
  const seenChatRef = useRef(undefined);
  useEffect(() => {
    const list = st.chat.filter((m) => !m.system && m.playerId);
    const lastId = list.length ? list[list.length - 1].id : 0;

    // 처음 입장했을 때 이미 쌓여 있던 대화는 말풍선으로 띄우지 않는다.
    // (빈 채팅이어도 여기서 기준점을 0으로 잡아둬야 첫 메시지가 안 새어나간다)
    if (seenChatRef.current === undefined) {
      seenChatRef.current = lastId;
      return;
    }
    if (lastId <= seenChatRef.current) return;

    const fresh = list.filter((m) => m.id > seenChatRef.current);
    seenChatRef.current = lastId;

    setBubbles((prev) => {
      const next = { ...prev };
      fresh.forEach((m) => (next[m.playerId] = { id: m.id, text: m.text }));
      return next;
    });

    // 각 말풍선은 자기 시간이 되면 알아서 사라진다.
    // (여기서 cleanup으로 취소하면 다음 메시지가 올 때 이전 말풍선이 안 지워진다)
    fresh.forEach((m) => {
      setTimeout(() => {
        setBubbles((prev) => {
          if (!prev[m.playerId] || prev[m.playerId].id !== m.id) return prev;
          const next = { ...prev };
          delete next[m.playerId];
          return next;
        });
      }, 4500);
    });
  }, [st.chat]);

  // 페이즈가 바뀔 때 "결과 발표" 같은 안내를 한 번 크게 띄운다
  const [announce, setAnnounce] = useState(null);
  const lastPhaseRef = useRef(null);
  useEffect(() => {
    const key = st.roundNo + ':' + st.phase;
    if (lastPhaseRef.current === key) return undefined;
    const first = lastPhaseRef.current === null;
    lastPhaseRef.current = key;
    if (first) return undefined; // 처음 입장할 때는 띄우지 않음

    const A = {
      discuss: { icon: '💬', big: t('anDiscuss'), sub: t('anDiscussS'), tone: 'blue' },
      vote: { icon: '🗳️', big: t('anVote'), sub: t('anVoteS'), tone: 'blue' },
      guess: { icon: '🔪', big: t('anGuess'), sub: t('anGuessS'), tone: 'red' },
      result: { icon: '📢', big: t('anResult'), sub: t('anResultS'), tone: 'gold' },
    }[st.phase];
    if (!A) return undefined;

    setAnnounce({ key, ...A });
    // 변수명을 t로 두면 번역 함수 t()를 가려버리므로 쓰지 말 것
    const timer = setTimeout(() => setAnnounce(null), 2400);
    return () => clearTimeout(timer);
  }, [st.phase, st.roundNo]);

  return (
    <div className="game">
      {urgent && <div className="urgentflash" />}

      {announce && (
        <div className={'announce tone-' + announce.tone} key={announce.key}>
          <div className="an-card">
            <span className="an-icon">{announce.icon}</span>
            <span className="an-big">{announce.big}</span>
            <span className="an-sub">{announce.sub}</span>
            <span className="an-rule" />
          </div>
        </div>
      )}

      {turnFlash && !announce && (
        <div className="turnflash" key={turnFlash.key}>
          <div className={'tf-card' + (turnFlash.mine ? ' mine' : '')}>
            {turnFlash.mine ? (
              <React.Fragment>
                <span className="tf-big">{t('tfMine')}</span>
                <span className="tf-sub">{t('tfMineS')}</span>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <span className="tf-nick">{turnFlash.nick}</span>
                <span className="tf-big">{t('tfTurn')}</span>
              </React.Fragment>
            )}
            <span className="tf-turn">
              {t('tfCount', { n: turnFlash.n, total: turnFlash.total })}
            </span>
          </div>
        </div>
      )}

      <div className="topbar">
        <span className="code-badge">{st.code}</span>
        <span className="phase-badge">{phaseLabel(st.phase)}</span>
        {st.roundNo > 0 && <span className="muted">{t('round')} {st.roundNo}</span>}
        {st.category && <span className="muted">{t('category')}: <b>{catName(st.category)}</b></span>}
        {remain !== null && (
          <span className={'timer' + (remain <= 5 ? ' urgent' : '')}>{remain}s</span>
        )}
        <LangToggle onChange={onLang} compact />
        <button style={{ marginLeft: remain === null ? 'auto' : 0 }} onClick={onLeave}>
          {t('leave')}
        </button>
      </div>

      <div className="cols">
        <div>
          {st.phase === 'lobby' && <Lobby st={st} socket={socket} />}

          {st.phase === 'reveal' && (
            <div className="panel">
              <RoleCard you={st.you} />
              <p className="center muted" style={{ margin: '12px 0' }}>
                {t('revealSoon')}
              </p>
              <RuleBook compact />
            </div>
          )}

          {st.phase === 'guess' && <GuessPanel st={st} socket={socket} />}

          {st.phase === 'result' && <Result st={st} socket={socket} />}

          {showCanvas && st.phase !== 'reveal' && (
            <div className="panel">
              {st.you.role && st.phase !== 'result' && (
                <div style={{ marginBottom: 10 }}>
                  <RoleStrip you={st.you} />
                </div>
              )}

              <div className="turnbar">
                {st.phase === 'draw' ? (
                  <span className="who">
                    {myTurn ? (
                      <span className="you">{t('myTurn')}</span>
                    ) : (
                      <span>{t('drawingNow', { nick: drawer ? drawer.nick : '?' })}</span>
                    )}
                  </span>
                ) : (
                  <span className="who">
                    {st.phase === 'discuss' && t('discussNow')}
                    {st.phase === 'vote' && t('voteNow')}
                    {st.phase === 'guess' && t('guessNow')}
                    {st.phase === 'result' && t('finishedArt')}
                  </span>
                )}
                {st.totalTurns > 0 && (
                  <span className="muted">
                    {t('turnCount', { i: Math.min(st.turnIndex + 1, st.totalTurns), total: st.totalTurns, lap: st.lap, laps: st.laps })}
                  </span>
                )}
              </div>

              {st.phase === 'vote' && <VotePanel st={st} socket={socket} />}

              <DrawCanvas
                strokesRef={strokesRef}
                dirtyRef={dirtyRef}
                canDraw={myTurn}
                color={color}
                size={size}
                socket={socket}
              />

              {st.phase === 'discuss' && <EarlyVoteBar st={st} socket={socket} />}

              {st.phase === 'draw' && (
                <Toolbar
                  st={st}
                  socket={socket}
                  color={color}
                  setColor={setColor}
                  size={size}
                  setSize={setSize}
                  myTurn={myTurn}
                />
              )}
            </div>
          )}
        </div>

        <div>
          <PlayerList st={st} socket={socket} bubbles={bubbles} />
          <Chat st={st} socket={socket} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 루트                                                                */
/* ------------------------------------------------------------------ */

function App() {
  const socketRef = useRef(null);
  const strokesRef = useRef([]);
  const dirtyRef = useRef(true);

  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [st, setSt] = useState(null);
  const [offset, setOffset] = useState(0);
  const [, setLangTick] = useState(LANG);

  // LANG은 모듈 변수라, 바꾼 뒤 App을 다시 그리면 t()가 새 언어로 전부 반영된다
  const changeLang = useCallback((l) => {
    LANG = l;
    localStorage.setItem('gm_lang', l);
    document.documentElement.lang = l;
    setLangTick(l);
  }, []);

  useEffect(() => {
    const s = io();
    socketRef.current = s;
    setSocket(s);

    s.on('connect', () => {
      setConnected(true);
      // 연결이 끊겼다 붙으면 소켓 id가 바뀌므로 같은 닉네임으로 자동 복귀한다.
      // (서버가 같은 닉네임의 끊긴 자리를 이어받게 해준다)
      try {
        const saved = JSON.parse(sessionStorage.getItem('gm_session') || 'null');
        if (saved && saved.code && saved.nick) {
          const avatar = JSON.parse(localStorage.getItem('gm_avatar') || 'null') || undefined;
          s.emit('room:join', { code: saved.code, nick: saved.nick, avatar }, (res) => {
            if (!res || !res.ok) sessionStorage.removeItem('gm_session');
          });
        }
      } catch (_) {
        /* 무시 */
      }
    });
    s.on('disconnect', () => {
      setConnected(false);
      setSt(null);
    });

    s.on('state', (next) => {
      setOffset(next.now - Date.now());
      setSt(next);
    });

    // 디버그용: 브라우저 콘솔에서 __gm.strokes() 로 현재 획 데이터를 확인할 수 있음
    window.__gm = {
      socket: s,
      strokes: () => strokesRef.current,
      summary: () =>
        strokesRef.current.map((x) => ({ id: x.id, color: x.color, size: x.size, n: x.points.length })),
    };

    s.on('canvas:init', ({ strokes, openStrokeId }) => {
      strokesRef.current = (strokes || []).map((x) => ({ ...x, points: (x.points || []).slice() }));
      strokesRef.current.forEach((x) => {
        x.points = x.points.map((p) => [p[0], p[1]]);
      });
      const open = openStrokeId ? strokesRef.current.find((x) => x.id === openStrokeId) : null;
      s.__cur = open || null;
      dirtyRef.current = true;
    });

    s.on('draw:begin', ({ id, color, size, x, y }) => {
      const stroke = { id, color, size, points: [[x, y]] };
      strokesRef.current.push(stroke);
      s.__cur = stroke;
      dirtyRef.current = true;
    });

    s.on('draw:point', ({ x, y }) => {
      const stroke = s.__cur || strokesRef.current[strokesRef.current.length - 1];
      if (!stroke) return;
      stroke.points.push([x, y]);
      dirtyRef.current = true;
    });

    s.on('draw:end', () => {
      s.__cur = null;
    });

    return () => s.close();
  }, []);

  const leave = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('room:leave');
    sessionStorage.removeItem('gm_session'); // 자동 복귀 대상에서 제외
    strokesRef.current = [];
    dirtyRef.current = true;
    location.hash = '';
    setSt(null);
  }, []);

  if (!socket) return <div className="home">{t('loading')}</div>;
  if (!st) return <Home socket={socket} connected={connected} onLang={changeLang} />;

  return (
    <Game
      st={st}
      socket={socket}
      offset={offset}
      strokesRef={strokesRef}
      dirtyRef={dirtyRef}
      onLeave={leave}
      onLang={changeLang}
    />
  );
}

/**
 * 어딘가에서 렌더링 오류가 나도 화면 전체가 빈 종이가 되지 않도록 하는 안전망.
 * 오류 내용을 보여주고 새로고침으로 방에 다시 들어갈 수 있게 한다.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }
  static getDerivedStateFromError(err) {
    return { err };
  }
  componentDidCatch(err, info) {
    console.error('[그림 마피아] 렌더링 오류:', err, info);
  }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="home">
        <h2 style={{ marginTop: 0 }}>{LANG === 'en' ? 'Something broke' : '문제가 생겼어요'}</h2>
        <p className="muted">
          {LANG === 'en'
            ? 'The screen failed to draw. Reloading will put you back in your room.'
            : '화면을 그리는 중 오류가 났습니다. 새로고침하면 원래 방으로 돌아갑니다.'}
        </p>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            fontSize: 12,
            background: 'var(--paper)',
            border: '2px solid var(--ink)',
            borderRadius: 8,
            padding: 10,
            maxHeight: 160,
            overflow: 'auto',
          }}
        >
          {String((this.state.err && this.state.err.message) || this.state.err)}
        </pre>
        <button className="primary" style={{ width: '100%' }} onClick={() => location.reload()}>
          {LANG === 'en' ? 'Reload' : '새로고침'}
        </button>
      </div>
    );
  }
}

const rootEl = document.getElementById('root');
const tree = (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
if (ReactDOM.createRoot) {
  ReactDOM.createRoot(rootEl).render(tree);
} else {
  ReactDOM.render(tree, rootEl); // React 17 이하 UMD 대비
}
