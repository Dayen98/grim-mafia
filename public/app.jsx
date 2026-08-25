/* 그림 마피아 - 클라이언트 (빌드 없이 브라우저에서 Babel로 변환) */

const { useState, useEffect, useRef, useCallback } = React;

// 4:3 — 세로가 넉넉해서 좁은 폰 화면에서도 그릴 공간이 나온다.
// (좌표는 0~1로 정규화해 보내므로 모든 기기가 같은 비율이어야 그림이 안 틀어진다)
const CANVAS_W = 900;
const CANVAS_H = 675;

/* ------------------------------------------------------------------ */
/* 다국어 (한국어 / English)                                           */
/* ------------------------------------------------------------------ */

const I18N = {
  ko: {
    tagline: '🎨 친구들과 한 획씩 그림을 이어 그리며\n마피아를 찾아라!',
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
    youSpectating: '관전 중이에요', spectatorRole: '관전자',
    spectatingHint: '참여자가 아니라서 정답을 미리 볼 수 있어요. 편하게 구경하세요!',
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
    hintLen: '글자수', hintFirst: '첫 글자',
    goLobby: '시작하기', changeChar: '캐릭터 바꾸기',
    quickStart: '빠른 시작', quickStartSub: '자리 있는 방에 바로 입장 · 없으면 새 방 생성',
    createGo: '이 설정으로 방 만들기', codePh: '방 코드 입력',
    roomTitleLabel: '방 제목', roomTitlePh: '예: 나랑 마피아 하실 분? (안 정하면 자동으로 지어드려요)',
    editTitle: '제목 바꾸기', save: '저장', close: '닫기',
    visPublic: '공개', visPrivate: '비공개',
    visPublicDesc: '누구나 빠른 시작·방 목록으로 들어올 수 있어요.',
    visPrivateDesc: '목록에 안 보이고, 코드를 아는 사람만 들어올 수 있어요.',
    browseRooms: '방 둘러보기',
    noRooms: '지금 열린 방이 없어요. 빠른 시작으로 바로 플레이하세요!',
    rcWaiting: '대기중', rcPlaying: '게임중', rcJoin: '입장', rcInGame: '게임 진행 중',
    report: '신고', kick: '강퇴', reported: '신고 누적',
    reportConfirm: '{nick} 님을 신고할까요? 방장에게 신고 누적이 표시됩니다.',
    kickConfirm: '{nick} 님을 강퇴할까요? 이 방에 다시 들어올 수 없습니다.',
    kickedMsg: '방장에 의해 방에서 강퇴되었습니다.',
    readyGo: '준비 완료 누르기', readyDone: '준비 완료 (누르면 취소)',
    readyStatus: '준비 {a}/{b}', readyHint: '모두 준비하면 방장이 시작할 수 있어요',
    waitReady: '준비 대기 중 {a}/{b}',
    rdReady: '준비', rdWaiting: '대기', rdHost: '방장', rdSpectator: '관전 중',
    becomeSpectatorBtn: '🔭 관전하기', becomePlayerBtn: '🎮 참여하기',
    spectatorsN: '관전 {n}명',
    spectatorHint: '관전자는 준비 없이 구경만 해요. 다음 라운드 전에 참여자로 바꿀 수 있어요.',
    spectatorLocked: '라운드 중에는 바꿀 수 없어요. 라운드가 끝나면 눌러주세요.',
    sMafia: '마피아 수', sMafiaH: '자동이면 지금 인원 기준 {n}명', personCnt: '명',
    ltLabel: '입력 중', ltEmpty: '아직 아무것도 안 썼어요',
    soundOn: '소리 끄기', soundOff: '소리 켜기',
    howToPlay: '게임 방법', aboutPage: '소개', privacyPage: '개인정보처리방침', contactPage: '문의',
    madeBy: '만든 사람', coffeeMsg: '재밌게 하셨다면 커피 한 잔 사주세요!',
    creditsFold: '만든 사람 · 후원',
    copy: '복사', copied: '복사됨 ✓', acctOwner: '예금주', moreAbout: '더 알아보기',
    noticeAndHelp: '공지 · 문의하기',
    fbTitle: '문의 / 피드백 보내기',
    fbPh: '불편한 점, 버그, 아이디어를 자유롭게 적어주세요.',
    fbContactPh: '답장 받을 연락처 (선택 · 이메일 등)',
    fbSend: '보내기', fbEmpty: '내용을 입력해주세요.',
    fbThanks: '보내주셔서 감사합니다! 확인 후 반영하겠습니다.', fbAgain: '하나 더 쓰기',
    advanced: '고급 설정',
    sVisibility: '방 공개 여부', sVisibilityH: '비공개는 코드로만 입장',
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
      kicked: '⛔ {nick} 님이 방장에게 강퇴되었습니다.',
      becameSpectator: '🔭 {nick} 님이 관전자가 되었습니다.',
      becamePlayer: '🎮 {nick} 님이 참여자가 되었습니다.',
    },
  },

  en: {
    tagline: '🎨 Draw one stroke each with friends\nand find the impostor!',
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
    youSpectating: 'You are watching', spectatorRole: 'Spectator',
    spectatingHint: "Since you're not playing, you get to see the answer early. Enjoy the show!",
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
    hintLen: 'Letters', hintFirst: 'Starts with',
    goLobby: 'Continue', changeChar: 'Change character',
    quickStart: 'Quick start', quickStartSub: 'Jump into an open room, or make one',
    createGo: 'Create room with these settings', codePh: 'Enter room code',
    roomTitleLabel: 'Room title', roomTitlePh: "e.g. Anyone up for Mafia? (leave blank for a random one)",
    editTitle: 'Edit title', save: 'Save', close: 'Close',
    visPublic: 'Public', visPrivate: 'Private',
    visPublicDesc: 'Anyone can join via quick start or the room list.',
    visPrivateDesc: 'Hidden from the list — only people with the code can join.',
    browseRooms: 'Browse rooms',
    noRooms: 'No rooms open right now. Hit Quick start to play!',
    rcWaiting: 'Waiting', rcPlaying: 'In game', rcJoin: 'Join', rcInGame: 'In progress',
    report: 'Report', kick: 'Kick', reported: 'Reports',
    reportConfirm: 'Report {nick}? The host will see the report count.',
    kickConfirm: 'Kick {nick}? They will not be able to rejoin this room.',
    kickedMsg: 'You were kicked from the room by the host.',
    readyGo: 'I am ready', readyDone: 'Ready (tap to cancel)',
    readyStatus: 'Ready {a}/{b}', readyHint: 'The host can start once everyone is ready',
    waitReady: 'Waiting for ready {a}/{b}',
    rdReady: 'Ready', rdWaiting: 'Waiting', rdHost: 'Host', rdSpectator: 'Watching',
    becomeSpectatorBtn: '🔭 Watch only', becomePlayerBtn: '🎮 Join in',
    spectatorsN: '{n} watching',
    spectatorHint: 'Spectators just watch, no ready-up needed. You can switch to playing before the next round.',
    spectatorLocked: "Can't switch mid-round — try again once the round ends.",
    sMafia: 'Impostors', sMafiaH: 'Auto = {n} for the current player count', personCnt: '',
    ltLabel: 'TYPING', ltEmpty: 'nothing typed yet',
    soundOn: 'Mute', soundOff: 'Unmute',
    howToPlay: 'How to play', aboutPage: 'About', privacyPage: 'Privacy', contactPage: 'Contact',
    madeBy: 'Made by', coffeeMsg: 'Enjoyed it? Buy us a coffee!',
    creditsFold: 'Credits · Support',
    copy: 'Copy', copied: 'Copied ✓', acctOwner: 'Account holder', moreAbout: 'Learn more',
    noticeAndHelp: 'News · Contact us',
    fbTitle: 'Send feedback',
    fbPh: 'Tell us about bugs, annoyances or ideas.',
    fbContactPh: 'Contact for a reply (optional)',
    fbSend: 'Send', fbEmpty: 'Please write something.',
    fbThanks: 'Thanks! We will take a look.', fbAgain: 'Write another',
    advanced: 'Advanced settings',
    sVisibility: 'Room visibility', sVisibilityH: 'Private = code only',
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
      kicked: '⛔ {nick} was kicked by the host.',
      becameSpectator: '🔭 {nick} is now watching.',
      becamePlayer: '🎮 {nick} joined as a player.',
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

/** 소리 (audio.js). 없어도 게임은 그대로 동작하게 감싼다 */
const snd = (name) => {
  if (window.GMAudio) window.GMAudio.sfx(name);
};

/** 🔊 / 🔇 토글 */
function SoundToggle({ compact }) {
  const [on, setOn] = useState(() => (window.GMAudio ? window.GMAudio.isEnabled() : false));
  if (!window.GMAudio) return null;
  return (
    <button
      type="button"
      className={'chip sndbtn' + (compact ? ' compact' : '')}
      title={on ? t('soundOn') : t('soundOff')}
      onClick={() => setOn(window.GMAudio.setEnabled(!on))}
    >
      {on ? '🔊' : '🔇'}
    </button>
  );
}

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

  /* 스케치북 안에서는 어떤 경우에도 화면이 움직이지 않게 한다.
     CSS의 touch-action: none 만으로는 안 먹는 브라우저가 있어서
     네이티브 non-passive 리스너로 스크롤 제스처 자체를 취소한다. */
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return undefined;
    const block = (e) => {
      if (e.cancelable) e.preventDefault();
    };
    // touchmove가 스크롤을 만들고, gesture*는 iOS 핀치 확대를 만든다
    cv.addEventListener('touchmove', block, { passive: false });
    cv.addEventListener('gesturestart', block, { passive: false });
    cv.addEventListener('gesturechange', block, { passive: false });
    return () => {
      cv.removeEventListener('touchmove', block);
      cv.removeEventListener('gesturestart', block);
      cv.removeEventListener('gesturechange', block);
    };
  }, []);

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

const SKINS = ['#f7d5b5', '#eab892', '#c98d5f', '#8d5a34', '#f5c9cf', '#9fd6a0', '#9ec9f5', '#c3a6e8'];
const HAIRC = ['#241f1c', '#6b4423', '#e8b93a', '#e0533d', '#3f7fd6', '#4fae5e', '#b45fc9', '#f291b6'];

const AV_LABEL_KO = {
  skin: '피부색', hair: '헤어', hairColor: '머리색',
  brows: '눈썹', eyes: '눈', mouth: '입', acc: '악세사리',
};
const AV_LABEL_EN = {
  skin: 'Skin', hair: 'Hair', hairColor: 'Hair color',
  brows: 'Eyebrows', eyes: 'Eyes', mouth: 'Mouth', acc: 'Accessory',
};
const avLabel = (k) => (LANG === 'en' ? AV_LABEL_EN : AV_LABEL_KO)[k];

const AV_KEYS = ['skin', 'hair', 'hairColor', 'brows', 'eyes', 'mouth', 'acc'];
const AV_MAX = { skin: 8, hair: 8, hairColor: 8, brows: 6, eyes: 8, mouth: 8, acc: 10 };

const defaultAvatar = () => ({ skin: 0, hair: 1, hairColor: 0, brows: 1, eyes: 0, mouth: 1, acc: 0 });
const randomAvatar = () => {
  const a = {};
  AV_KEYS.forEach((k) => (a[k] = Math.floor(Math.random() * AV_MAX[k])));
  return a;
};

/* 손으로 그린 낙서 얼굴.
   굵은 잉크 선 + 삐뚤한 사각 머리통이 기본 골격이고,
   머리카락 / 눈썹 / 눈 / 입 / 악세사리를 그 위에 얹는다. */

const INK = '#1c1a18';
const HEAD_D =
  'M20 25 C20 16.5 27 13.2 38 12.6 C52 11.9 68 12.6 79 14.4 ' +
  'C86.5 15.6 88.4 22 88.2 30 C88 48 87 64 85 74.2 ' +
  'C83.6 82 74.6 85.2 62 86 C47 86.9 30 86.2 23 84 ' +
  'C16 81.8 14.8 71 15.4 56 C15.8 44 17.2 33 20 25 Z';

/** 얼굴 위에 얹는 조각들. 각 항목은 <g> 하나를 돌려준다. */
function hairPart(i, hc) {
  const S = { stroke: INK, strokeWidth: 3.2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (i) {
    case 0:
      return null; // 민머리
    case 1: // 뾰족뾰족
      return (
        <g {...S} fill={hc}>
          <path d="M19 26 L24 9 L31 22 L38 6 L45 21 L53 6 L60 21 L68 8 L74 23 L83 12 L86.5 29 C70 20 36 19 19 26 Z" />
        </g>
      );
    case 2: // 짧은 머리
      return (
        <g {...S} fill={hc}>
          <path d="M17.5 30 C18 16 30 11 52 11 C74 11 87 16 87.5 30 C80 20 62 17.5 52 17.5 C38 17.5 25 20 17.5 30 Z" />
        </g>
      );
    case 3: // 단발 + 앞머리
      return (
        <g {...S} fill={hc}>
          <path d="M16 32 C16 14 32 10 52 10 C72 10 88 14 88 32 C82 22 66 18 52 18 C38 18 22 22 16 32 Z" />
          <path d="M16 32 C12 46 13 60 16 70 C17.5 56 17 42 19 34 Z" />
          <path d="M88 32 C92 46 91 60 88 70 C86.5 56 87 42 85 34 Z" />
        </g>
      );
    case 4: // 곱슬 아프로
      return (
        <g {...S} fill={hc}>
          <circle cx="30" cy="20" r="12" />
          <circle cx="52" cy="13" r="13" />
          <circle cx="74" cy="20" r="12" />
          <circle cx="20" cy="34" r="9.5" />
          <circle cx="84" cy="34" r="9.5" />
        </g>
      );
    case 5: // 묶음머리
      return (
        <g {...S} fill={hc}>
          <path d="M17.5 30 C18 15 31 11 52 11 C73 11 87 15 87.5 30 C80 20 62 17.5 52 17.5 C38 17.5 25 20 17.5 30 Z" />
          <circle cx="52" cy="7" r="8" />
        </g>
      );
    case 6: // 모히칸
      return (
        <g {...S} fill={hc}>
          <path d="M38 26 C39 12 46 4 52 3 C58 4 65 12 66 26 C60 21 44 21 38 26 Z" />
        </g>
      );
    default: // 긴 머리
      return (
        <g {...S} fill={hc}>
          <path d="M15 34 C15 13 33 9 52 9 C71 9 89 13 89 34 C83 23 66 19 52 19 C38 19 21 23 15 34 Z" />
          <path d="M15 34 C9 54 10 74 14 88 C19 70 17 48 19 37 Z" />
          <path d="M89 34 C95 54 94 74 90 88 C85 70 87 48 85 37 Z" />
        </g>
      );
  }
}

function browsPart(i) {
  const S = { stroke: INK, strokeWidth: 4, strokeLinecap: 'round', fill: 'none' };
  switch (i) {
    case 0:
      return null;
    case 1: // 나란히
      return (
        <g {...S}>
          <path d="M28 36 L44 36" />
          <path d="M56 36 L72 36" />
        </g>
      );
    case 2: // 화남 (안쪽으로 내려감)
      return (
        <g {...S}>
          <path d="M28 32 L44 39" />
          <path d="M72 32 L56 39" />
        </g>
      );
    case 3: // 슬픔 (바깥으로 내려감)
      return (
        <g {...S}>
          <path d="M28 39 L44 32" />
          <path d="M72 39 L56 32" />
        </g>
      );
    case 4: // 둥근 눈썹
      return (
        <g {...S}>
          <path d="M28 37 Q36 30 44 37" />
          <path d="M56 37 Q64 30 72 37" />
        </g>
      );
    default: // 굵고 진하게
      return (
        <g stroke={INK} strokeWidth="7" strokeLinecap="round" fill="none">
          <path d="M29 35 L43 35" />
          <path d="M57 35 L71 35" />
        </g>
      );
  }
}

function eyesPart(i) {
  const S = { stroke: INK, strokeWidth: 3.4, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (i) {
    case 0: // 점
      return (
        <g fill={INK}>
          <circle cx="37" cy="50" r="5" />
          <circle cx="65" cy="50" r="5" />
        </g>
      );
    case 1: // 반쯤 감은 눈
      return (
        <g {...S} fill="none">
          <path d="M30 50 Q37 43 44 50" />
          <path d="M58 50 Q65 43 72 50" />
          <circle cx="37" cy="49" r="2.4" fill={INK} />
          <circle cx="65" cy="49" r="2.4" fill={INK} />
        </g>
      );
    case 2: // 감은 눈 (웃음)
      return (
        <g {...S} fill="none">
          <path d="M30 52 Q37 44 44 52" />
          <path d="M58 52 Q65 44 72 52" />
        </g>
      );
    case 3: // 반짝이는 큰 눈
      return (
        <g {...S}>
          <ellipse cx="37" cy="50" rx="8" ry="9" fill="#fff" />
          <ellipse cx="65" cy="50" rx="8" ry="9" fill="#fff" />
          <circle cx="37.5" cy="51" r="4" fill={INK} stroke="none" />
          <circle cx="65.5" cy="51" r="4" fill={INK} stroke="none" />
          <circle cx="35.5" cy="48.5" r="1.6" fill="#fff" stroke="none" />
          <circle cx="63.5" cy="48.5" r="1.6" fill="#fff" stroke="none" />
        </g>
      );
    case 4: // X_X
      return (
        <g {...S} strokeWidth="4" fill="none">
          <path d="M32 45 L42 55 M42 45 L32 55" />
          <path d="M60 45 L70 55 M70 45 L60 55" />
        </g>
      );
    case 5: // 별
      return (
        <g fill={INK}>
          <path d="M37 43 l2.4 5.4 5.8 .6 -4.4 3.9 1.3 5.7 -5.1 -3 -5.1 3 1.3 -5.7 -4.4 -3.9 5.8 -.6 z" />
          <path d="M65 43 l2.4 5.4 5.8 .6 -4.4 3.9 1.3 5.7 -5.1 -3 -5.1 3 1.3 -5.7 -4.4 -3.9 5.8 -.6 z" />
        </g>
      );
    case 6: // 옆을 보는 눈
      return (
        <g {...S}>
          <circle cx="37" cy="50" r="7.5" fill="#fff" />
          <circle cx="65" cy="50" r="7.5" fill="#fff" />
          <circle cx="41" cy="50" r="3.4" fill={INK} stroke="none" />
          <circle cx="69" cy="50" r="3.4" fill={INK} stroke="none" />
        </g>
      );
    default: // 어지러움 (소용돌이)
      return (
        <g {...S} fill="none" strokeWidth="3">
          <circle cx="37" cy="50" r="7.5" />
          <circle cx="37" cy="50" r="3" />
          <circle cx="65" cy="50" r="7.5" />
          <circle cx="65" cy="50" r="3" />
        </g>
      );
  }
}

function mouthPart(i) {
  const S = { stroke: INK, strokeWidth: 3.6, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };
  switch (i) {
    case 0: // 무표정
      return <path d="M40 69 L62 69" {...S} />;
    case 1: // 미소
      return <path d="M38 66 Q51 77 64 66" {...S} />;
    case 2: // 활짝 (이빨)
      return (
        <g {...S}>
          <path d="M36 64 Q51 79 66 64 Z" fill="#fff" />
          <path d="M39 67 L63 67" strokeWidth="2.6" />
        </g>
      );
    case 3: // 놀람 (동그란 입)
      return <ellipse cx="51" cy="69" rx="7" ry="8" {...S} fill="#fff" />;
    case 4: // 메롱
      return (
        <g {...S}>
          <path d="M38 64 Q51 76 64 64" />
          <path d="M46 71 q5 9 10 0 z" fill="#f080a0" />
        </g>
      );
    case 5: // 삐뚤 (물결)
      return <path d="M37 68 q6 -6 12 0 t12 0" {...S} />;
    case 6: // 시무룩
      return <path d="M38 73 Q51 62 64 73" {...S} />;
    default: // 지그재그
      return <path d="M36 70 l6 -6 6 6 6 -6 6 6 6 -6" {...S} />;
  }
}

function accPart(i) {
  const S = { stroke: INK, strokeWidth: 3.2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (i) {
    case 0:
      return null;
    case 1: // 동그란 안경
      return (
        <g {...S} fill="none">
          <circle cx="37" cy="50" r="11" />
          <circle cx="65" cy="50" r="11" />
          <path d="M48 50 L54 50" />
        </g>
      );
    case 2: // 선글라스
      return (
        <g {...S}>
          <path d="M25 43 H49 V52 Q37 60 25 52 Z" fill={INK} />
          <path d="M53 43 H77 V52 Q65 60 53 52 Z" fill={INK} />
          <path d="M49 46 L53 46" />
        </g>
      );
    case 3: // 비니
      return (
        <g {...S}>
          <path d="M17 30 C18 15 32 9 52 9 C72 9 86 15 87 30 Z" fill="#4fae5e" />
          <path d="M15 29 H89 V37 H15 Z" fill="#3d8c4a" />
          <circle cx="52" cy="6" r="4.5" fill="#3d8c4a" />
        </g>
      );
    case 4: // 야구모자
      return (
        <g {...S}>
          <path d="M19 29 C20 14 34 9 52 9 C70 9 84 14 85 29 Z" fill="#3f7fd6" />
          <path d="M85 29 C95 29 99 33 99 37 L58 37 L58 29 Z" fill="#2f66b0" />
        </g>
      );
    case 5: // 헤드폰
      return (
        <g {...S} fill="#e8b93a">
          <path d="M14 44 C14 20 32 10 52 10 C72 10 90 20 90 44" fill="none" strokeWidth="4.5" />
          <rect x="6" y="42" width="15" height="22" rx="6" />
          <rect x="83" y="42" width="15" height="22" rx="6" />
        </g>
      );
    case 6: // 마스크
      return (
        <g {...S}>
          <path d="M28 60 H76 V72 Q52 86 28 72 Z" fill="#fff" />
          <path d="M28 62 L16 56 M76 62 L88 56" />
        </g>
      );
    case 7: // 콧수염
      return (
        <g {...S} fill={INK}>
          <path d="M51 60 C45 54 34 55 32 62 C38 62 45 63 51 65 C57 63 64 62 70 62 C68 55 57 54 51 60 Z" />
        </g>
      );
    case 8: // 왕관
      return (
        <g {...S} fill="#f2b705">
          <path d="M24 26 L28 8 L40 20 L52 4 L64 20 L76 8 L80 26 Z" />
        </g>
      );
    default: // 반창고
      return (
        <g {...S}>
          <rect x="60" y="24" width="24" height="10" rx="4" fill="#f5c9cf" transform="rotate(-18 72 29)" />
          <circle cx="70" cy="31" r="1.4" fill={INK} stroke="none" />
          <circle cx="75" cy="28" r="1.4" fill={INK} stroke="none" />
        </g>
      );
  }
}

/**
 * 손그림 낙서 스타일 얼굴.
 * svg에 key를 걸어 항목이 바뀌면 통째로 새로 그린다.
 * (조각만 갈아끼우면 이전 그림이 남는 잔상이 생겼다)
 */
function Avatar({ a, size = 44, className }) {
  const av = { ...defaultAvatar(), ...(a || {}) };
  const skin = SKINS[av.skin] || SKINS[0];
  const hc = HAIRC[av.hairColor] || HAIRC[0];
  const sig = AV_KEYS.map((k) => av[k]).join('-');

  return (
    <svg
      key={sig}
      className={'avatar ' + (className || '')}
      width={size}
      height={size}
      viewBox="0 0 104 100"
      aria-hidden="true"
    >
      {/* 귀 */}
      <g stroke={INK} strokeWidth="3.4" strokeLinejoin="round" fill={skin}>
        <path d="M16 48 C9 47 7 53 9 58 C10.5 62 14 63 16.5 62" />
        <path d="M88 48 C95 47 97 53 95 58 C93.5 62 90 63 87.5 62" />
      </g>
      {/* 머리통 */}
      <path d={HEAD_D} fill={skin} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      {hairPart(av.hair, hc)}
      {browsPart(av.brows)}
      {eyesPart(av.eyes)}
      {mouthPart(av.mouth)}
      {accPart(av.acc)}
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

function Logo({ small, secret }) {
  /* 우리끼리만 아는 진입점: 3초 안에 로고를 5번 누르면 관리자 페이지로.
     화면에는 어떤 안내도 남기지 않는다. */
  const tapsRef = useRef([]);
  const onSecretTap = () => {
    if (!secret) return;
    const now = Date.now();
    const taps = tapsRef.current.filter((ts) => now - ts < 3000); // t는 번역 함수라 이름을 피함
    taps.push(now);
    tapsRef.current = taps;
    if (taps.length >= 5) {
      tapsRef.current = [];
      location.href = '/admin';
    }
  };

  return <LogoInner small={small} onTap={onSecretTap} />;
}

function LogoInner({ small, onTap }) {
  const word1 = ['그', '림'];
  const word2 = ['마', '피', '아'];
  const tilt = [-6, 4, -3, 6, -5];

  return (
    <div className={'logo' + (small ? ' logo-sm' : '')} onPointerUp={onTap}>
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

      <span className="logo-tag">
        {t('tagline')
          .split('\n')
          .map((line, i) => (
            <span key={i} className="tagline-line">
              {line}
            </span>
          ))}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 로비 (캐릭터 만든 뒤 들어오는 화면)                                  */
/* ------------------------------------------------------------------ */

function RoomBrowser({ socket, onJoin, busy }) {
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = () => {
      socket.emit('lobby:list', {}, (res) => {
        if (!alive) return;
        setLoading(false);
        setList(res && res.ok ? res.rooms : []);
      });
    };
    load();
    const iv = setInterval(load, 3000); // 열려 있는 동안만 갱신
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [socket]);

  if (loading && !list) return <p className="muted center">{t('loading')}</p>;
  if (!list || list.length === 0) return <p className="emptyrooms">{t('noRooms')}</p>;

  return (
    <div className="roomcards">
      {list.map((r) => (
        <div key={r.code} className={'roomcard' + (r.joinable ? '' : ' busy')}>
          <div className="rc-top">
            <span className={'rc-state' + (r.waiting ? ' waiting' : '')}>
              {r.waiting ? t('rcWaiting') : t('rcPlaying')}
            </span>
          </div>
          <div className="rc-title">{r.title}</div>
          <div className="rc-sub">
            <span className="rc-code">{r.code}</span>
            {r.hostNick && <span className="rc-host">· {r.hostNick}</span>}
          </div>
          <div className="rc-meta">
            <span className="rc-badge">
              👤 {r.players}/{r.max}
            </span>
            <span className="rc-badge">⏱ {Math.round(r.turnMs / 1000)}{t('sec')}</span>
            <span className="rc-badge">
              🗂 {r.customOnly ? t('sCustom') : r.categories.length ? r.categories.map(catName).join('·') : t('sAll')}
            </span>
          </div>
          <button
            className={r.joinable ? 'primary' : ''}
            disabled={!r.joinable || busy}
            onClick={() => onJoin(r.code)}
          >
            {r.joinable ? t('rcJoin') : t('rcInGame')}
          </button>
        </div>
      ))}
    </div>
  );
}

/** 공지 + 문의하기 (로비 하단) */
function NoticeAndFeedback({ socket, nick, openSignal }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  // 푸터에서 '문의'를 누르면 열고 그 위치로 스크롤
  useEffect(() => {
    if (!openSignal) return;
    setOpen(true);
    const timer = setTimeout(() => {
      if (boxRef.current) boxRef.current.scrollIntoView({ block: 'center' });
    }, 60);
    return () => clearTimeout(timer);
  }, [openSignal]);

  const [notices, setNotices] = useState([]);
  const [text, setText] = useState('');
  const [contact, setContact] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!open || notices.length) return;
    socket.emit('notice:list', {}, (res) => {
      if (res && res.ok) setNotices(res.notices || []);
    });
  }, [open, notices.length, socket]);

  const send = (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) {
      setErr(t('fbEmpty'));
      return;
    }
    setErr('');
    socket.emit('feedback:send', { text: body, contact, nick }, (res) => {
      if (res && res.ok) {
        setSent(true);
        setText('');
        setContact('');
      } else {
        setErr((res && res.error) || t('reqFail'));
      }
    });
  };

  return (
    <React.Fragment>
      <button className="folder" ref={boxRef} onClick={() => setOpen((v) => !v)}>
        {open ? '▾' : '▸'} 📢 {t('noticeAndHelp')}
      </button>
      {open && (
        <div className="subpanel">
          <div className="noticelist">
            {notices.length === 0 ? (
              <p className="muted center">{t('loading')}</p>
            ) : (
              notices.map((n, i) => (
                <div key={i} className="noticeitem">
                  <div className="ni-top">
                    <span className={'ni-tag tag-' + n.tag}>{n.tag}</span>
                    <span className="ni-title">{n.title}</span>
                    <span className="ni-date">{n.date}</span>
                  </div>
                  <div className="ni-body">{n.body}</div>
                </div>
              ))
            )}
          </div>

          <div className="fbtitle">✉️ {t('fbTitle')}</div>
          {sent ? (
            <div className="fbdone">
              {t('fbThanks')}
              <button onClick={() => setSent(false)}>{t('fbAgain')}</button>
            </div>
          ) : (
            <form onSubmit={send}>
              <textarea
                className="fbtext"
                value={text}
                maxLength={1000}
                rows={4}
                placeholder={t('fbPh')}
                onChange={(e) => setText(e.target.value)}
              />
              <input
                value={contact}
                maxLength={100}
                placeholder={t('fbContactPh')}
                onChange={(e) => setContact(e.target.value)}
                style={{ marginTop: 6 }}
              />
              <div className="error" style={{ minHeight: 0 }}>
                {err}
              </div>
              <button className="primary" style={{ width: '100%' }} disabled={!text.trim()}>
                {t('fbSend')}
              </button>
            </form>
          )}
        </div>
      )}
    </React.Fragment>
  );
}

function LobbyScreen({ socket, connected, nick, avatar, onLang, onBack, onEnter, kicked, onDismissKicked }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState(() => (location.hash || '').replace('#', '').toUpperCase());
  const [isPublic, setIsPublic] = useState(true);
  const [roomTitle, setRoomTitle] = useState('');
  const [showBrowse, setShowBrowse] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [contactSignal, setContactSignal] = useState(0); // 푸터의 '문의' → 문의 폼 열기

  const go = (event, extra) => {
    if (!connected) return;
    setError('');
    setBusy(true);
    socket.emit(event, { nick, avatar, ...extra }, (res) => {
      setBusy(false);
      if (!res || !res.ok) {
        setError((res && res.error) || t('reqFail'));
        return;
      }
      sessionStorage.setItem('gm_session', JSON.stringify({ code: res.code, nick }));
      location.hash = res.code;
      if (onEnter) onEnter();
    });
  };

  return (
    <div className="home lobbyscreen">
      <div className="lobbytop">
        <button className="backbtn" onClick={onBack}>
          ‹ {t('changeChar')}
        </button>
        <span className="lobbytop-right">
          <SoundToggle compact />
          <LangToggle onChange={onLang} compact />
        </span>
      </div>

      <div className="whoami">
        <Avatar a={avatar} size={52} />
        <span className="whoami-nick">{nick}</span>
      </div>

      {kicked && (
        <div className="kicknotice">
          {t('kickedMsg')}
          <button onClick={onDismissKicked}>✕</button>
        </div>
      )}

      <button className="quickbtn" disabled={!connected || busy} onClick={() => go('room:quick')}>
        <span className="qb-main">⚡ {t('quickStart')}</span>
        <span className="qb-sub">{t('quickStartSub')}</span>
      </button>

      <div className="lobbyrow">
        <button disabled={busy} onClick={() => setShowCreate((v) => !v)}>
          ➕ {t('createRoom')}
        </button>
      </div>

      {showCreate && (
        <div className="subpanel">
          <div className="field">
            <label>{t('roomTitleLabel')}</label>
            <input
              value={roomTitle}
              maxLength={40}
              placeholder={t('roomTitlePh')}
              onChange={(e) => setRoomTitle(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div className="vistoggle">
            <button
              type="button"
              className={'chip' + (isPublic ? ' on' : '')}
              onClick={() => setIsPublic(true)}
            >
              🌐 {t('visPublic')}
              <em className="defmark">{t('sDefault')}</em>
            </button>
            <button
              type="button"
              className={'chip' + (!isPublic ? ' on' : '')}
              onClick={() => setIsPublic(false)}
            >
              🔒 {t('visPrivate')}
            </button>
          </div>
          <p className="muted vis-desc">{isPublic ? t('visPublicDesc') : t('visPrivateDesc')}</p>
          <button
            className="primary"
            style={{ width: '100%' }}
            disabled={busy}
            onClick={() => go('room:create', { isPublic, title: roomTitle })}
          >
            {t('createGo')}
          </button>
        </div>
      )}

      <div className="lobbyrow">
        <input
          value={code}
          maxLength={6}
          placeholder={t('codePh')}
          style={{ textTransform: 'uppercase', letterSpacing: 3, fontFamily: 'monospace' }}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && code.trim() && go('room:join', { code })}
        />
        <button style={{ flex: '0 0 96px' }} disabled={busy || !code.trim()} onClick={() => go('room:join', { code })}>
          {t('enter')}
        </button>
      </div>

      <div className="error">{connected ? error : t('connecting')}</div>

      <button className="folder" onClick={() => setShowBrowse((v) => !v)}>
        {showBrowse ? '▾' : '▸'} 🔍 {t('browseRooms')}
      </button>
      {showBrowse && (
        <div className="subpanel">
          <RoomBrowser socket={socket} busy={busy} onJoin={(c) => go('room:join', { code: c })} />
        </div>
      )}

      <NoticeAndFeedback socket={socket} nick={nick} openSignal={contactSignal} />
      <GameFooter onContact={() => setContactSignal((n) => n + 1)} />
    </div>
  );
}

function Home({ socket, connected, onLang, onReady }) {
  const [nick, setNick] = useState(() => localStorage.getItem('gm_nick') || '');
  const [error, setError] = useState('');
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

  const enter = () => {
    const n = nick.trim();
    if (!n) {
      setError(t('needNick'));
      return;
    }
    localStorage.setItem('gm_nick', n);
    localStorage.setItem('gm_avatar', JSON.stringify(avatar));
    setError('');
    onReady(n, avatar);
  };

  return (
    <div className="home">
      <div className="lobbytop">
        <SoundToggle compact />
        <LangToggle onChange={onLang} compact />
      </div>
      <Logo secret />

      <div className="field">
        <label>{t('nick')}</label>
        <input
          value={nick}
          maxLength={12}
          placeholder={t('nickPh')}
          onChange={(e) => setNick(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && enter()}
        />
      </div>

      <div className="field">
        <label>{t('myChar')}</label>
        <AvatarEditor value={avatar} onChange={changeAvatar} />
      </div>

      <button className="primary" style={{ width: '100%' }} disabled={!connected} onClick={enter}>
        {t('goLobby')}
      </button>

      {/* 자세한 설명은 별도 페이지로 (검색엔진이 읽을 수 있는 실제 주소) */}
      <a className="howtobtn" href="/how-to-play">
        📖 {t('howToPlay')}
      </a>

      <div className="error">{connected ? error : t('connecting')}</div>

      <CreditsBlock />
      <GameFooter />
    </div>
  );
}

/** 랜딩 맨 아래 '만든 사람 + 후원' 축약 블록 (/about 의 요약판).
    기본은 접혀 있고, 눌러야 펼쳐진다. */
function CreditsBlock() {
  const ACCT = '352-1962-6796-13';
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const copy = () => {
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(ACCT).then(done, done);
    } else {
      const ta = document.createElement('textarea');
      ta.value = ACCT;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        done();
      } catch (_) {
        /* 무시 */
      }
      document.body.removeChild(ta);
    }
  };

  return (
    <React.Fragment>
      <button className="folder credits-folder" onClick={() => setOpen((v) => !v)}>
        {open ? '▾' : '▸'} ☕ {t('creditsFold')}
      </button>
      {open && (
        <div className="credits">
          <div className="cr-row">
            <span className="cr-label">{t('madeBy')}</span>
            <span className="cr-names">다영 · 민우</span>
          </div>
          <div className="cr-coffee">
            <span className="cr-msg">☕ {t('coffeeMsg')}</span>
            <div className="acct-line small">
              <span className="acct-bank">농축협</span>
              <span className="acct-no">{ACCT}</span>
              <button type="button" className={'copybtn' + (copied ? ' copied' : '')} onClick={copy}>
                {copied ? t('copied') : t('copy')}
              </button>
            </div>
            <div className="acct-owner">{t('acctOwner')}: 강다영</div>
          </div>
          <a className="cr-more" href="/about">
            {t('moreAbout')} ›
          </a>
        </div>
      )}
    </React.Fragment>
  );
}

/** 모든 화면 하단 공통 푸터. onContact가 있으면 문의 폼으로 연결한다. */
function GameFooter({ onContact }) {
  return (
    <footer className="gmfooter">
      <nav>
        <a href="/how-to-play">{t('howToPlay')}</a>
        <a href="/about">{t('aboutPage')}</a>
        <a href="/privacy">{t('privacyPage')}</a>
        {onContact ? (
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              onContact();
            }}
          >
            {t('contactPage')}
          </a>
        ) : (
          <a href="/about#contact">{t('contactPage')}</a>
        )}
      </nav>
      <p className="foot-copy">그림 마피아 · 운영자 강다영</p>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* 사이드바 조각                                                       */
/* ------------------------------------------------------------------ */

function PlayerList({ st, socket, bubbles }) {
  const me = st.you;
  // 대기실에서는 캐릭터가 잘 보이도록 카드형으로, 크게 보여준다
  const isLobby = st.phase === 'lobby';
  const orderIndex = (id) => {
    const i = st.order.indexOf(id);
    return i < 0 ? null : i + 1;
  };
  const reportOf = (id) => {
    const r = (me.reportCounts || []).find((x) => x.id === id);
    return r ? r.count : 0;
  };

  return (
    <div className="panel">
      <h3>
        {t('playersN', { a: st.players.filter((p) => p.connected && !p.isSpectator).length, b: st.maxPlayers })}
        {st.players.some((p) => p.connected && p.isSpectator) && (
          <span className="muted" style={{ fontSize: 13, fontWeight: 400 }}>
            {' · '}
            {t('spectatorsN', { n: st.players.filter((p) => p.connected && p.isSpectator).length })}
          </span>
        )}
      </h3>
      <div className={'players' + (isLobby ? ' lobbygrid' : '')}>
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
                <Avatar a={p.avatar} size={isLobby ? 84 : 46} />
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
              {/* 대기실에서는 준비 여부를 프로필 옆에 표시 (방장은 대상 아님) */}
              {st.phase === 'lobby' &&
                p.connected &&
                (p.isSpectator ? (
                  <span className="rdbadge spectator">🔭 {t('rdSpectator')}</span>
                ) : p.isHost ? (
                  <span className="rdbadge host">{t('rdHost')}</span>
                ) : (
                  <span className={'rdbadge' + (st.readyIds.includes(p.id) ? ' on' : '')}>
                    {st.readyIds.includes(p.id) ? '✅ ' + t('rdReady') : '⏳ ' + t('rdWaiting')}
                  </span>
                ))}
              {st.phase === 'result' && p.connected && p.isSpectator && (
                <span className="rdbadge spectator">🔭 {t('rdSpectator')}</span>
              )}
              {st.roundNo > 0 && <span className="ptbadge">{p.score}{t('pts')}</span>}
              <span className="tag">
                {p.isBot && '🤖'}
                {p.isHost && '👑'}
                {p.isSpectator && st.phase !== 'lobby' && st.phase !== 'result' && '🔭'}
                {!p.connected && t('disconnected')}
                {st.phase === 'vote' && st.votedIds.includes(p.id) && ' ✅'}
                {p.id === st.currentDrawerId && ' ✏️'}
              </span>
              {/* 대기실 토글은 Lobby 패널에 이미 있으므로, 여기서는 결과 화면(다음 판 전)에서만 보여준다 */}
              {st.phase === 'result' && p.id === me.id && (
                <button
                  className={'spectbtn' + (p.isSpectator ? ' on' : '')}
                  onClick={() => socket.emit('player:setSpectator', { spectator: !p.isSpectator })}
                >
                  {p.isSpectator ? t('becomePlayerBtn') : t('becomeSpectatorBtn')}
                </button>
              )}
              {reportOf(p.id) > 0 && me.isHost && (
                <span className="repbadge" title={t('reported')}>
                  🚩{reportOf(p.id)}
                </span>
              )}
              {p.id !== me.id && !p.isBot && (
                <span className="modbtns">
                  <button
                    className="modbtn"
                    title={t('report')}
                    onClick={() => {
                      if (!window.confirm(t('reportConfirm', { nick: p.nick }))) return;
                      socket.emit('player:report', { targetId: p.id }, () => {});
                    }}
                  >
                    🚩
                  </button>
                  {me.isHost && (
                    <button
                      className="modbtn kick"
                      title={t('kick')}
                      onClick={() => {
                        if (!window.confirm(t('kickConfirm', { nick: p.nick }))) return;
                        socket.emit('room:kick', { targetId: p.id });
                      }}
                    >
                      ⛔
                    </button>
                  )}
                </span>
              )}
              {st.phase === 'vote' && p.id !== me.id && p.connected && !p.isSpectator && (
                <button
                  className={me.myVote === p.id ? 'primary' : ''}
                  onClick={() => {
              snd('vote');
              socket.emit('vote:cast', { targetId: p.id });
            }}
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

/** 설정/게임방법 같은 걸 팝업으로 띄우는 용도. 바깥 클릭·Esc로 닫힌다. */
function Modal({ onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label={t('close')}>
          ✕
        </button>
        {children}
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
  const [adv, setAdv] = useState(false);
  const set = (patch) => host && socket.emit('settings:set', patch);

  // "1인당 획 수"가 헷갈리지 않도록 실제 총 획 수를 같이 보여준다
  const people = st.players.filter((p) => p.connected).length;
  const autoLaps = people >= 9 ? 1 : 2;
  const effLaps = s.laps > 0 ? s.laps : autoLaps;
  const lapText =
    t('lapInfo', { p: people, l: effLaps, t: people * effLaps }) + (s.laps === 0 ? t('lapAuto') : '');

  // 마피아 수: 자동일 때 실제로 몇 명이 되는지 알려준다
  const autoMafia = people >= 9 ? 3 : people >= 6 ? 2 : 1;

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

      <Row label={t('sMafia')} hint={t('sMafiaH', { n: autoMafia })}>
        <Choice
          field="mafiaCount"
          def={0}
          opts={[[0, t('sAuto')], [1, '1' + t('personCnt')], [2, '2' + t('personCnt')], [3, '3' + t('personCnt')], [4, '4' + t('personCnt')]]}
        />
      </Row>

      <Row label={t('sDiscuss')} hint={t('sDiscussH')}>
        <Choice
          field="discussMs"
          def={60000}
          opts={[[30000, 30 + t('sec')], [60000, 60 + t('sec')], [90000, 90 + t('sec')], [120000, 2 + t('min')]]}
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

      {/* 자주 안 바꾸는 것들은 접어둔다. 전부 기본값이 채워져 있어 안 열어도 된다. */}
      <button className="folder" onClick={() => setAdv((v) => !v)}>
        {adv ? '▾' : '▸'} {t('advanced')}
      </button>

      {adv && (
        <div className="advbox">
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

          <Row label={t('sVisibility')} hint={t('sVisibilityH')}>
            <span className="chips">
              <button
                type="button"
                disabled={!host}
                className={'chip' + (st.isPublic ? ' on' : '')}
                onClick={() => host && socket.emit('room:visibility', { isPublic: true })}
              >
                🌐 {t('visPublic')}
                <em className="defmark">{t('sDefault')}</em>
              </button>
              <button
                type="button"
                disabled={!host}
                className={'chip' + (!st.isPublic ? ' on' : '')}
                onClick={() => host && socket.emit('room:visibility', { isPublic: false })}
              >
                🔒 {t('visPrivate')}
              </button>
            </span>
          </Row>
        </div>
      )}
    </div>
  );
}

function Lobby({ st, socket }) {
  // 관전자는 정원·시작 조건 계산에서 빠진다 (실제로 게임에 참여하지 않으므로)
  const ready = st.players.filter((p) => p.connected && !p.isSpectator).length;
  const spectating = st.players.filter((p) => p.connected && p.isSpectator).length;
  const botCount = st.players.filter((p) => p.isBot).length;
  const enoughPeople = ready >= st.minPlayers && ready <= st.maxPlayers;
  // 방장을 뺀 전원이 준비를 눌러야 시작할 수 있다
  const canStart = st.you.isHost && enoughPeople && st.allReady;
  const iAmReady = st.readyIds.includes(st.you.id);
  const link = location.origin + '/#' + st.code;

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(st.title || '');
  const saveTitle = () => {
    socket.emit('room:setTitle', { title: titleDraft });
    setEditingTitle(false);
  };
  const [showSettings, setShowSettings] = useState(false);
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="panel center">
      {editingTitle ? (
        <div className="row" style={{ maxWidth: 420, margin: '0 auto 6px' }}>
          <input
            autoFocus
            value={titleDraft}
            maxLength={40}
            placeholder={t('roomTitlePh')}
            onChange={(e) => setTitleDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveTitle();
              if (e.key === 'Escape') setEditingTitle(false);
            }}
          />
          <button style={{ flex: '0 0 70px' }} onClick={saveTitle}>
            {t('save')}
          </button>
        </div>
      ) : (
        <h2 style={{ marginTop: 0 }}>
          {st.title}
          {st.you.isHost && (
            <button
              className="titleeditbtn"
              title={t('editTitle')}
              onClick={() => {
                setTitleDraft(st.title || '');
                setEditingTitle(true);
              }}
            >
              ✏️
            </button>
          )}
        </h2>
      )}
      <p className="muted" style={{ marginTop: -6 }}>{t('lobbyTitle')}</p>
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
        {spectating > 0 && <span className="muted"> · {t('spectatorsN', { n: spectating })}</span>}
      </p>

      <button
        className={'spectbtn' + (st.you.isSpectator ? ' on' : '')}
        onClick={() => socket.emit('player:setSpectator', { spectator: !st.you.isSpectator })}
      >
        {st.you.isSpectator ? t('becomePlayerBtn') : t('becomeSpectatorBtn')}
      </button>

      {st.you.isHost ? (
        <React.Fragment>
          <button className="primary" disabled={!canStart} onClick={() => socket.emit('game:start')}>
            {enoughPeople
              ? canStart
                ? t('startGame')
                : t('waitReady', { a: st.readyCount.ready, b: st.readyCount.total })
              : t('needMore', { n: st.minPlayers })}
          </button>
          {enoughPeople && !canStart && (
            <p className="muted readyhint">{t('readyHint')}</p>
          )}

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
      ) : st.you.isSpectator ? (
        <p className="muted readyhint">{t('spectatorHint')}</p>
      ) : (
        <React.Fragment>
          <button
            className={'readybtn' + (iAmReady ? ' on' : '')}
            onClick={() => socket.emit('player:ready')}
          >
            {iAmReady ? '✅ ' + t('readyDone') : '🙋 ' + t('readyGo')}
          </button>
          <p className="muted readyhint">
            {t('readyStatus', { a: st.readyCount.ready, b: st.readyCount.total })}
            {' · '}
            {t('waitHost')}
          </p>
        </React.Fragment>
      )}

      <div className="lobbytoolrow">
        <button onClick={() => setShowSettings(true)}>{t('setTitle')}</button>
        <button onClick={() => setShowRules(true)}>{t('rbTitle')}</button>
      </div>

      <div style={{ marginTop: 14, textAlign: 'left' }}>
        <Scoreboard st={st} socket={socket} showReset />
      </div>

      {showSettings && (
        <Modal onClose={() => setShowSettings(false)}>
          <SettingsPanel st={st} socket={socket} />
        </Modal>
      )}
      {showRules && (
        <Modal onClose={() => setShowRules(false)}>
          <RuleBook />
        </Modal>
      )}
    </div>
  );
}

function RoleCard({ you }) {
  // 관전자는 역할이 없다 - 배정된 역할인 척하지 않고 정답을 그대로 보여준다
  if (you.isSpectator) {
    return (
      <div className="rolecard spectator">
        <div className="role">🔭 {t('youSpectating')}</div>
        <div className="word">{you.word || catName(you.category)}</div>
        <div className="hint">{t('spectatingHint')}</div>
      </div>
    );
  }
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
  if (you.isSpectator) {
    return (
      <div className="rolestrip spectator">
        <span>🔭 {t('spectatorRole')}</span>
        <span className="muted">{t('category')}</span>
        <b>{catName(you.category)}</b>
        <span className="muted">|</span>
        <span className="muted">{t('word')}</span>
        <b>{you.word}</b>
      </div>
    );
  }
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
  const conn = st.players.filter((p) => p.connected && !p.isSpectator);
  const agreed = st.earlyVoteIds.filter((id) => conn.some((p) => p.id === id)).length;
  if (st.you.isSpectator) return null;
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
  // 관전자는 투표 대상도, 투표 인원수 계산 대상도 아니다
  const conn = st.players.filter((p) => p.connected && !p.isSpectator);
  const others = conn.filter((p) => p.id !== me.id);
  return (
    <div className="votepanel">
      <div className="vp-title">{t('votePick')}</div>
      <div className="vp-grid">
        {others.map((p) => (
          <button
            key={p.id}
            className={'vp-card' + (me.myVote === p.id ? ' on' : '')}
            disabled={me.isSpectator}
            onClick={() => {
              if (me.isSpectator) return;
              snd('vote');
              socket.emit('vote:cast', { targetId: p.id });
            }}
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

const CIRCLED = ['⓪', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮'];
const circled = (n) => CIRCLED[n] || '(' + n + ')';

/** 시간이 지나면 서버가 단계별로 열어주는 힌트 */
function HintBox({ hint }) {
  if (!hint || (!hint.len && !hint.first)) return null;
  return (
    <div className="hintbox">
      <span className="hint-tag">HINT</span>
      {hint.len && (
        <span className="hint-item">
          {t('hintLen')} <b>{circled(hint.len)}</b>
        </span>
      )}
      {hint.first && (
        <span className="hint-item">
          {t('hintFirst')} <b>{hint.first}</b>
          {'○'.repeat(Math.max(0, (hint.len || 1) - 1))}
        </span>
      )}
    </div>
  );
}

function GuessPanel({ st, socket, liveTyping }) {
  const g = st.guess;
  const [typed, setTyped] = useState('');
  if (!g) return null;
  const mine = st.you.isGuesser;
  const mafiaP = st.players.find((p) => p.id === g.mafiaId);
  const mafiaAvatar = mafiaP ? mafiaP.avatar : null;

  // 마피아가 입력하는 걸 그대로 중계 (모두가 실시간으로 본다)
  const onType = (v) => {
    setTyped(v);
    socket.emit('guess:typing', { text: v });
  };

  const LiveBox = () => (
    <div className={'livetype' + (liveTyping ? ' on' : '')}>
      <span className="lt-label">{t('ltLabel')}</span>
      <span className="lt-text">
        {liveTyping ? liveTyping : <em className="lt-empty">{t('ltEmpty')}</em>}
        <span className="lt-caret" />
      </span>
    </div>
  );

  // 주관식 모드
  if (g.mode === 'text') {
    return (
      <div className="panel guesspanel">
        <div className="gp-title">{t('gpTitle')}</div>
        <div className="gp-who">
          <Avatar a={mafiaAvatar} size={76} />
          <span className="gp-whonick">{g.mafiaNick}</span>
        </div>
        <p className="center">
          {t('gpLead', { nick: g.mafiaNick })}
          <br />
          {t('gpLead2')}
        </p>
        <HintBox hint={g.hint} />
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
                onChange={(e) => onType(e.target.value)}
              />
              <button className="primary" style={{ flex: '0 0 90px' }} disabled={!typed.trim()}>
                {t('submit')}
              </button>
            </div>
          </form>
        ) : (
          <React.Fragment>
            <p className="center muted">{t('gpTyping', { nick: g.mafiaNick })}</p>
            <LiveBox />
          </React.Fragment>
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
  // 승패에 따라 결과 소리
  const playedRef = useRef(null);
  useEffect(() => {
    if (!r) return;
    const key = st.roundNo + ':' + (r.citizensWin ? 'c' : 'm');
    if (playedRef.current === key) return;
    playedRef.current = key;
    setTimeout(() => snd(r.citizensWin ? 'correct' : 'wrong'), 1600); // 발표 연출 뒤에
  }, [r, st.roundNo]);
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
          {/* 닉네임만 있으면 누군지 잘 안 와닿아서 캐릭터를 같이 보여준다 */}
          <div className="mafiafaces">
            {r.mafiaIds.map((id, i) => {
              const p = st.players.find((x) => x.id === id);
              return (
                <span className="mafiaface" key={id}>
                  <Avatar a={p ? p.avatar : null} size={44} />
                  <span className="mf-nick">{r.mafiaNicks[i]}</span>
                </span>
              );
            })}
          </div>
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

function Game({ st, socket, offset, strokesRef, dirtyRef, onLeave, onLang, liveTyping }) {
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
      // 그리기가 끝나는 순간 숨김 타이머가 취소돼 팝업이 계속 떠 있던 문제
      setTurnFlash(null);
      return undefined;
    }
    const key = st.roundNo + ':' + st.turnIndex;
    if (lastTurnRef.current === key) return undefined;
    lastTurnRef.current = key;

    const who = st.players.find((p) => p.id === st.currentDrawerId);
    const isMine = st.currentDrawerId === st.you.id;
    snd(isMine ? 'myTurn' : 'turn');
    setTurnFlash({
      key,
      nick: who ? who.nick : '?',
      avatar: who ? who.avatar : null, // 닉네임보다 캐릭터가 알아보기 쉬움
      mine: isMine,
      n: st.turnIndex + 1,
      total: st.totalTurns,
    });
    // 변수명을 t로 두면 번역 함수 t()를 가려버리므로 쓰지 말 것
    const timer = setTimeout(() => setTurnFlash(null), 2000);
    return () => clearTimeout(timer);
  }, [st.phase, st.roundNo, st.turnIndex, st.currentDrawerId, st.you.id]);

  // 남은 시간이 5초 이하면 화면 가장자리를 붉게 점멸
  const urgent = st.phase === 'draw' && remain !== null && remain <= 5;

  // 초읽기 소리 (같은 초에 두 번 울리지 않게)
  const lastTickRef = useRef(null);
  useEffect(() => {
    if (!urgent || remain === null || remain <= 0) return;
    const key = st.turnIndex + ':' + remain;
    if (lastTickRef.current === key) return;
    lastTickRef.current = key;
    snd('tick');
  }, [urgent, remain, st.turnIndex]);

  // 방에 들어오면 BGM 시작, 나가면 정지
  useEffect(() => {
    if (window.GMAudio) window.GMAudio.startBgm();
    return () => {
      if (window.GMAudio) window.GMAudio.stopBgm();
    };
  }, []);

  // 폰에서는 캔버스가 화면 아래에 있어 내 차례인 걸 놓치기 쉽다.
  // 내 차례가 되면 캔버스를 자동으로 화면에 올려준다.
  const canvasBoxRef = useRef(null);
  useEffect(() => {
    if (!myTurn || !canvasBoxRef.current) return undefined;

    // 이미 화면에 잘 보이면 굳이 움직이지 않는다.
    // (smooth 스크롤은 애니메이션이라 그리는 중에 화면이 미끄러지는 원인이 됐다)
    const box = canvasBoxRef.current;
    const r = box.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (r.top < 8 || r.bottom > vh - 8) {
      box.scrollIntoView({ block: 'center' }); // 즉시 이동
    }

    // 스크롤은 곧바로 잠근다 (지연을 두면 그 틈에 화면이 밀렸다)
    document.body.classList.add('gm-scrolllock');
    return () => document.body.classList.remove('gm-scrolllock');
  }, [myTurn]);

  // 그리기 중에는 아래 채팅/목록을 줄여 화면이 밀리지 않게 한다 (모바일)
  useEffect(() => {
    const on = st.phase === 'draw';
    document.body.classList.toggle('gm-drawphase', on);
    return () => document.body.classList.remove('gm-drawphase');
  }, [st.phase]);

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
    snd('chat');

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

    snd(st.phase === 'guess' ? 'danger' : st.phase === 'result' ? 'drum' : 'phase');
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
            <Avatar a={turnFlash.avatar} size={84} className="tf-av" />
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
        <SoundToggle compact />
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

          {st.phase === 'guess' && <GuessPanel st={st} socket={socket} liveTyping={liveTyping} />}

          {st.phase === 'result' && <Result st={st} socket={socket} />}

          {showCanvas && st.phase !== 'reveal' && (
            <div className="panel canvaspanel" ref={canvasBoxRef}>
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
  const [screen, setScreen] = useState('home'); // home → lobby → (방)
  const [kickedNotice, setKickedNotice] = useState(false);
  const [liveTyping, setLiveTyping] = useState('');
  const [me, setMe] = useState(() => {
    let av = null;
    try {
      av = JSON.parse(localStorage.getItem('gm_avatar') || 'null');
    } catch (_) {
      av = null;
    }
    return { nick: localStorage.getItem('gm_nick') || '', avatar: av || defaultAvatar() };
  });

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
      // 마피아 맞히기 화면을 벗어나면 실시간 타이핑 잔여 텍스트를 지운다
      // (안 지우면 다음 라운드 맞히기 화면에서 지난판 텍스트가 잠깐 그대로 보임)
      if (next.phase !== 'guess') setLiveTyping('');
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

    // 마피아가 입력하는 내용을 실시간으로 받아둔다
    s.on('guess:typing', ({ text }) => setLiveTyping(text || ''));

    // 강퇴당하면 로비로 돌려보낸다
    s.on('kicked', () => {
      sessionStorage.removeItem('gm_session');
      location.hash = '';
      strokesRef.current = [];
      dirtyRef.current = true;
      setSt(null);
      setScreen('lobby');
      setKickedNotice(true);
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

  if (!st) {
    // 캐릭터 만들기 → 로비 → 방
    if (screen === 'home') {
      return (
        <Home
          socket={socket}
          connected={connected}
          onLang={changeLang}
          onReady={(n, av) => {
            setMe({ nick: n, avatar: av });
            setScreen('lobby');
          }}
        />
      );
    }
    return (
      <LobbyScreen
        socket={socket}
        connected={connected}
        nick={me.nick}
        avatar={me.avatar}
        onLang={changeLang}
        onBack={() => setScreen('home')}
        kicked={kickedNotice}
        onDismissKicked={() => setKickedNotice(false)}
      />
    );
  }

  return (
    <Game
      st={st}
      socket={socket}
      offset={offset}
      strokesRef={strokesRef}
      dirtyRef={dirtyRef}
      onLeave={leave}
      onLang={changeLang}
      liveTyping={liveTyping}
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
// 임시 로딩 화면 제거
const bootEl = document.getElementById('boot');
if (bootEl) bootEl.remove();

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
