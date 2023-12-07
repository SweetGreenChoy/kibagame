// 소켓 구성
var roomCode = document.getElementById("container").getAttribute("room_code");
var char_choice = document
  .getElementById("container")
  .getAttribute("char_choice");

var connectionString =
  "ws://" + window.location.host + "/ws/play/" + roomCode + "/";
var gameSocket = new WebSocket(connectionString);

// 전역 변수들
var playerBlack = 0;
var playerWhite = 1;
let moveCount = 0;
var deadCount = { black: 0, white: 0 };

// 게임 진행 상태
var gameStatus = false;

// 덤
var komi = 6.5;

// 현재 보드
var board = [];
// 검토 보드
var checkBoard = [];
// 테스트 보드
var testBoard = [];
// 이전 수 보드
var backupBoard = [];
// 전체 기록
var historyBoards = [];

// 검토 보드용 count 값들
const EMPTY = -1;
const CHECKED = 1,
  UNCHECKED = 0;

// 이웃 확인용
var directs = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
];

// 초읽기 횟수
var black_suddenDeath = $(".suddenDeath")[0];
var white_suddenDeath = $(".suddenDeath")[1];

// 코드 실행
$(document).ready(function () {
  // 탭
  $(".tab li").click(function () {
    var idx = $(this).index();
    $(".tab li").removeClass("on");
    $(".tab li").eq(idx).addClass("on");
    $(".tabcont > div").hide();
    $(".tabcont > div").eq(idx).show();
  });

  // 게임 - 한수쉼
  $(".btn_game_rest").on("click", function () {
    if (
      gameStatus === true &&
      ((isBlackTurn === true && char_choice === "black") ||
        (isBlackTurn === false && char_choice === "white"))
    ) {
      pauseGame();
      $("#popupGameRest").toggleClass("on");
      $("#gameRestOrNot").toggleClass("on");
    }
  });

  $("#gameRestYesBtn").on("click", function () {
    $("#gameRestOrNot").removeClass("on");
    $("#gameRestComplete").addClass("on");
    resumeGame();
    gameSocket.send(
      JSON.stringify({
        event: "PASS",
        message: "",
      })
    );
  });

  $("#gameRestNoBtn").on("click", function () {
    $("#popupGameRest").removeClass("on");
    $("#gameRestOrNot").removeClass("on");
    resumeGame();
  });

  $("#gameRestComplete").on("click", function () {
    $("#popupGameRest").removeClass("on");
    $("#gameRestOrNot").removeClass("on");
    $("#gameRestComplete").removeClass("on");
  });

  // 게임 - 계가
  $(".btn_game_gyega").on("click", function () {
    if (
      gameStatus === true &&
      ((isBlackTurn === true && char_choice === "black") ||
        (isBlackTurn === false && char_choice === "white"))
    ) {
      pauseGame();
      $("#popupGameGyega").toggleClass("on");
      $("#gameGyegaOrNot").toggleClass("on");
    }
  });

  $("#gameGyegaYesBtn").on("click", function () {
    // 내 창에서 제거
    $("#popupGameGyega").removeClass("on");
    $("#gameGyegaOrNot").removeClass("on");
    // 상대방에게 전송
    gameSocket.send(
      JSON.stringify({
        event: "GYEGASUGGEST",
        message: "",
      })
    );
  });

  // 계가 취소
  $("#gameGyegaNoBtn").on("click", function () {
    $("#popupGameGyega").removeClass("on");
    $("#gameGyegaOrNot").removeClass("on");
    resumeGame();
  });

  // 상대방 창
  function gyegaConfirm() {
    if (
      (isBlackTurn === true && char_choice === "white") ||
      (isBlackTurn === false && char_choice === "black")
    ) {
      $("#popupGameGyega").toggleClass("on");
      $("#gameGyegaConfirm").toggleClass("on");
      $("#gameGyegaConfirmNoBtn").on("click", function () {
        $("#gameGyegaConfirm").removeClass("on");
        $("#popupGameGyega").removeClass("on");
        gameSocket.send(
          JSON.stringify({
            event: "GYEGAREFUSE",
            message: "",
          })
        );
      });
      $("#gameGyegaConfirmYesBtn").on("click", function () {
        $("#gameGyegaConfirm").removeClass("on");
        $("#popupGameGyega").removeClass("on");
        gameSocket.send(
          JSON.stringify({
            event: "GYEGAAGREE",
            message: "",
          })
        );
      });
    }
  }

  // 계가 거부 확인
  function gyegaRefused() {
    $("#popupGameGyega").toggleClass("on");
    $("#gameGyegaRefused").toggleClass("on");
    $("#gameGyegaRefusedConfirm").on("click", function () {
      $("#gameGyegaRefused").removeClass("on");
      $("#popupGameGyega").removeClass("on");
    });
    resumeGame();
  }

  // 계가 진행
  function gameGyega() {}

  // 계가 거부
  function gyegaDisagree() {}

  // 게임 - 기권
  $(".btn_game_out, #gameOutNoBtn").on("click", function () {
    $("#popupGameOut").toggleClass("on");
    $("#gameOutOrNot").toggleClass("on");
  });

  $("#gameOutYesBtn").on("click", function () {
    if (
      gameStatus === true &&
      (char_choice === "black" || char_choice === "white")
    ) {
      $("#gameOutOrNot").removeClass("on");
      gameSocket.send(
        JSON.stringify({
          event: "GIVEUP",
          message: { player: char_choice },
        })
      );
      $("#popupGameOut").removeClass("on");
    }
  });

  // 타이머 설정
  function formatTime(seconds) {
    var minutes = Math.floor(seconds / 60);
    var remainingSeconds = seconds % 60;
    return (
      (minutes < 10 ? "0" : "") +
      minutes +
      ":" +
      (remainingSeconds < 10 ? "0" : "") +
      remainingSeconds
    );
  }

  function startTimer(id, seconds, onTimerEnd) {
    var interval = setInterval(function () {
      $(id).text(formatTime(seconds));
      seconds--;
      if (seconds < 0) {
        clearInterval(interval);
        onTimerEnd();
      }
    }, 1000);
  }

  // 게임 리다이렉션
  function redirectGame() {
    $(location).attr("href", "../tournament/test.html");
  }

  // 타이머 시작
  if (document.querySelector(".timer_list")) {
    startTimer(".timer_list", 600, redirectGame);
  }
  // 5분 타이머
  // startTimer('.timer_game', 60); // 60초 타이머

  // socket 연결
  function connect() {
    gameSocket.onopen = function open() {
      console.log("WebSockets connection created.");
      gameSocket.send(
        JSON.stringify({
          event: "READY",
          message: "",
        })
      );
    };

    gameSocket.onclose = function (e) {
      console.log(
        "Socket is closed. Reconnect will be attempted in 1 second.",
        e.reason
      );
      setTimeout(function () {
        connect();
      }, 1000);
    };

    gameSocket.onmessage = function (e) {
      let data = JSON.parse(e.data);
      data = data["payload"];
      let boardData = data["message"]["boards"];
      let event = data["event"];
      console.log(event);

      switch (event) {
        case "READY":
          if (gameStatus === false) {
            gameSocket.send(
              JSON.stringify({
                event: "START",
                message: "",
              })
            );
            resumeGame();
            break;
          } else {
            break;
          }

        case "START":
          resetBoard(board);
          admitCoord(board);
          resetDeadCount();
          isBlackTurn = true;
          resumeGame();
          break;

        case "MOVE":
          let coords = data["message"]["index"]["box"];
          console.log("coords : " + coords);
          isBlackTurn = data["message"]["player"];
          board = boardData["board"];
          checkBoard = boardData["checkBoard"];
          testBoard = boardData["testBoard"];
          backupBoard = boardData["backupBoard"];
          historyBoards.push(backupBoard);
          moveCount++;
          console.log("movecount : " + moveCount);
          admitCoord(board);
          var cell = document.getElementById(
            coords[0] + "-" + coords[1] + "-" + coords[2]
          );
          var x = coords[1];
          var y = coords[2];
          console.log("X, Y :" + x, y);
          cell.classList.add("last_stone");
          lastStone = cell;
          getDeadStone(board, backupBoard);
          countStone(board);
          document.getElementById("black_captured").innerText =
            deadCount["black"];
          document.getElementById("white_captured").innerText =
            deadCount["white"];
          break;

        case "PASS":
          passTurn();
          resumeGame();
          break;

        case "TIMEOUT":
          break;

        case "GIVEUP":
          switch (data["message"]["player"]) {
            case "black":
              $("#white_win").addClass("on");
              pauseGame();
              break;
            case "white":
              $("#black_win").addClass("on");
              pauseGame();
              break;
          }
          break;

        case "GYEGASUGGEST":
          gyegaConfirm();
          break;

        case "GYEGAREFUSE":
          gyegaRefused();
          resumeGame();
          break;

        case "GYEGAAGREE":
          break;

        case "GYEGADISAGREE":
          break;
      }
    };
  }

  // 초기 비율 설정 및 창 크기 변경 시 비율 유지 함수
  function maintainBoardRatio() {
    const container = document.querySelector(".baduk_board");
    const containerHeight = container.offsetHeight; //656
    container.style.width = containerHeight + "px";
  }

  // 초기 비율 설정
  maintainBoardRatio();

  // 창 크기가 변경될 때 비율 유지
  window.addEventListener("resize", maintainBoardRatio);

  // 바둑판 생성
  var boardSize = 19;
  const badukInner = document.getElementById("badukInner");
  const soundStone = document.getElementById("soundStone");
  const soundCountStart = document.getElementById("soundCountStart");
  const soundCountTen = document.getElementById("soundCountTen");
  let lastStone = null; // 마지막으로 둔 돌을 추적

  for (let i = 0; i < boardSize; i++) {
    board.push([]);
    checkBoard.push([]);
    testBoard.push([]);
    backupBoard.push([]);
    const cell = document.createElement("div");
    cell.className = "row";
    cell.id = "row" + "-" + i;
    badukInner.append(cell);
    for (let j = 0; j < boardSize; j++) {
      board[i].push(EMPTY);
      checkBoard[i].push(UNCHECKED);
      testBoard[i].push(EMPTY);
      backupBoard[i].push(EMPTY);
      const box = document.createElement("div");
      box.className = "cell" + " " + "hide";
      box.id = "cell" + "-" + i + "-" + j;
      cell.append(box);
    }
  }

  let isBlackTurn = true; // 흑돌부터 시작

  let timerInterval; // 변수로 타이머 설정

  function placeStone(PointerEvent) {
    if (gameStatus === true) {
      if (
        (isBlackTurn === true && char_choice === "black") ||
        (isBlackTurn === false && char_choice === "white")
      ) {
        const cell = PointerEvent.target;
        var box = $(cell).attr("id").split("-");
        var x = parseInt(box[1]);
        var y = parseInt(box[2]);

        testBoard[x][y] = isBlackTurn ? playerBlack : playerWhite;
        clearBoard(testBoard);

        // 이미 돌이 놓여 있는 경우에는 놓을 수 없음
        if (cell.classList.contains("hide")) {
          clearInterval(timerInterval); // 이전 타이머 중지
          soundCountStart.pause(); // 사운드 중지
          soundCountStart.currentTime = 0;
          soundCountTen.pause(); // 사운드 중지
          soundCountTen.currentTime = 0;

          // 착수 유효성 검토
          if (invalidTestBoard() || invalidMove(x, y)) {
            showInvalidMove(x, y);
            copyBoard(testBoard, board);
            resetCheckBoard();
          } else {
            // 하위 보드에서 착수 검토
            copyBoard(backupBoard, board);
            copyBoard(board, testBoard);
            updateGameBy(board); //하위 보드에 착수
            if (isBlackTurn) {
              // 흑돌 차례

              cell.classList.replace("hide", "black");
              board[x][y] = playerBlack;
              soundStone.play();

              // 백돌의 타이머 시작 및 사운드 재생
              const timerGame = document.querySelector(".timer_game.white");
              startCountdown(timerGame, soundCountStart, soundCountTen);
            } else {
              // 백돌 차례
              cell.classList.replace("hide", "white");
              board[x][y] = playerWhite;
              soundStone.play();

              // 흑돌의 타이머 시작 및 사운드 재생
              const timerGame = document.querySelector(".timer_game.black");
              startCountdown(timerGame, soundCountStart, soundCountTen);
            }
            if (lastStone) {
              lastStone.classList.remove("last_stone");
            }
            lastStone = cell;

            isBlackTurn = !isBlackTurn;
            // 보드 값 JSON으로 통신
            let data = {
              event: "MOVE",
              message: {
                index: { box, x, y },
                boards: { board, backupBoard, testBoard, checkBoard },
                player: isBlackTurn,
              },
            };
            gameSocket.send(JSON.stringify(data));
            admitCoord(board);
          }
        }
      }
    }
  }

  function startCountdown(timerGame, soundCountStart, soundCountTen) {
    const timerDuration = 30; // 타이머 기간 (30초)
    let remainingTime = timerDuration;

    function playCountStartSound() {
      if (remainingTime === 12) {
        soundCountStart.play();
      }
    }

    function playCountTenSound() {
      soundCountTen.play();
    }

    function countdown() {
      const minutes = Math.floor(remainingTime / 60);
      const seconds = remainingTime % 60;
      timerGame.textContent =
        (minutes < 10 ? "0" : "") +
        minutes +
        ":" +
        (seconds < 10 ? "0" : "") +
        seconds;

      if (remainingTime === 12) {
        // 12초 남았을 때 사운드 재생
        playCountStartSound();
      }

      if (remainingTime === 10) {
        // 10초가 남았을 때 사운드 재생
        playCountTenSound();
      }

      if (remainingTime === 0) {
        clearInterval(timerInterval); // 타이머 중지
      }

      remainingTime--;
    }

    // 이전 타이머 중지
    clearInterval(timerInterval);

    timerGame.textContent = "00:30"; // 초기 타이머 값 설정
    timerInterval = setInterval(countdown, 1000);
  }

  // 모든 셀에 클릭 이벤트 리스너를 추가
  const cells = badukInner.querySelectorAll(".cell");
  cells.forEach((cell) => {
    cell.addEventListener("click", placeStone);
  });

  // 나가기 버튼 클릭 시 승리 이미지 노출 및 종료팝업
  $(".btn_game_exit").on("click", function () {
    // play_game_over 클래스에 on 클래스 추가
    $(".play_game_over").addClass("on");

    // 3초 후에 on 클래스를 제거하고 time_over 요소에 on 클래스 추가
    setTimeout(function () {
      $(".play_game_over").removeClass("on");
      $("#popupGameOver").addClass("on");

      // 00:10부터 카운트다운 시작
      let minutes = 0;
      let seconds = 10;
      const countdownInterval = setInterval(function () {
        // 시간을 00:00 형식으로 표시
        let formattedTime =
          (minutes < 10 ? "0" : "") +
          minutes +
          ":" +
          (seconds < 10 ? "0" : "") +
          seconds;
        $(".timer_over").text(formattedTime);

        if (minutes === 0 && seconds === 0) {
          // 카운트다운이 끝나면 interval을 멈춥니다.
          clearInterval(countdownInterval);
          window.location.href = "../tournament/play.html";
        } else {
          if (seconds === 0) {
            minutes--;
            seconds = 59;
          } else {
            seconds--;
          }
        }
      }, 1000);
    }, 3000); // 3초 대기 후 실행
  });

  $("#gameOverCompleteBtn").on("click", function () {
    // 페이지 이동 (예: 홈페이지로 이동)
    window.location.href = "../tournament/list.html";
  });

  //functions
  function getLiberties(board, x, y) {
    if (board[x][y] === EMPTY) return -1;
    if (checkBoard[x][y] === CHECKED) return 0;

    checkBoard[x][y] = CHECKED;

    var count = 0;

    for (var i = 0; i < directs.length; i++) {
      var pX = x + directs[i][0];
      var pY = y + directs[i][1];

      if (!outOfBounds(pX, pY)) {
        // valid position
        if (board[pX][pY] === EMPTY) {
          // liberty
          count++;
          console.log("px, py EMPTY : " + pX, pY);
        } // 다음 자리에 돌이 있는 경우
        else if (board[pX][pY] === board[x][y]) {
          // 회귀로 다음 연쇄를 찾음
          count += getLiberties(board, pX, pY);
          checkBoard[pX][pY] = CHECKED;
          console.log("px, py CHECK : " + pX, pY);
        }
      }
    }
    console.log("COUNT : " + count);
    return count;
  }

  function getChain(x, y) {
    var chain = [];
    for (var i = 0; i < boardSize; i++) {
      for (var j = 0; j < boardSize; j++) {
        if (checkBoard[i][j] === CHECKED) {
          chain.push([i, j]);
        }
      }
    }
    console.log("CHAIN : " + chain);
    return chain;
  }

  // 사석 제거
  function clearBoard(board) {
    for (var i = 0; i < boardSize; i++) {
      for (var j = 0; j < boardSize; j++) {
        if (
          board[i][j] !== EMPTY &&
          board[i][j] !== (isBlackTurn ? playerBlack : playerWhite)
        ) {
          if (getLiberties(board, i, j) === 0) {
            // Remove dead pieces in board
            var chain = getChain(i, j);
            for (var k = 0; k < chain.length; k++) {
              var pX = chain[k][0];
              var pY = chain[k][1];

              board[pX][pY] = EMPTY;
            }
          }
          resetCheckBoard();
        }
      }
    }
  }

  //Update game by selected board
  // admitCoord로 대체
  // canvas를 활용해 직접 보드를 그리는 형식(board 좌표값을 바로 입력)
  function updateGameBy(board) {
    deleteBox($(".box"));

    for (var i = 0; i < boardSize; i++) {
      for (var j = 0; j < boardSize; j++) {
        if (board[i][j] !== EMPTY) {
          var box = $("#box-" + i + "-" + j);

          box.addClass(board[i][j] === 0 ? "black" : "white");
          box.removeClass("hide");
        }
      }
    }
  }

  //Copy two board
  function copyBoard(board, copyBoard) {
    for (var i = 0; i < boardSize; i++) {
      for (var j = 0; j < boardSize; j++) {
        board[i][j] = copyBoard[i][j];
      }
    }
  }

  //Check board is changed or not
  //Compare test board to backup board
  function invalidTestBoard() {
    for (var i = 0; i < boardSize; i++) {
      for (var j = 0; j < boardSize; j++) {
        if (testBoard[i][j] !== backupBoard[i][j]) {
          return false;
        }
      }
    }
    return true;
  }

  //Check if this move is valid
  function invalidMove(x, y) {
    if (testBoard[x][y] !== EMPTY && getLiberties(testBoard, x, y) === 0) {
      return true;
    }
    resetCheckBoard();
    return false;
  }

  //Check valid position
  function outOfBounds(x, y) {
    return x < 0 || x >= boardSize || y < 0 || y >= boardSize;
  }

  function resetCheckBoard() {
    for (var i = 0; i < boardSize; i++) {
      for (var j = 0; j < boardSize; j++) {
        checkBoard[i][j] = UNCHECKED;
      }
    }
  }

  function showInvalidMove(x, y) {
    var box = $("#box-" + x + "-" + y);

    box.addClass("invalid");
    setTimeout(function () {
      box.removeClass("invalid");
    }, 50);
  }

  // 돌 지우기
  function deleteBox(box) {
    box.removeClass("black");
    box.removeClass("white");
    box.addClass("hide");
  }

  //시작 전 초기화
  function resetBoard(board) {
    for (var i = 0; i < boardSize; i++) {
      for (var j = 0; j < boardSize; j++) {
        board[i][j] = EMPTY;
      }
    }
  }

  // 좌표 보드에 적용
  function admitCoord(board) {
    for (var i = 0; i < boardSize; i++) {
      for (var j = 0; j < boardSize; j++) {
        var stone = document.getElementById("cell" + "-" + i + "-" + j);
        switch (board[i][j]) {
          case -1:
            stone.className = "cell hide";
            break;
          case 0:
            stone.className = "cell black";
            break;
          case 1:
            stone.className = "cell white";
            break;
        }
      }
    }
  }

  // 게임 정지
  function pauseGame() {
    gameStatus = false;
  }

  // 게임 재개
  function resumeGame() {
    gameStatus = true;
  }

  // 한 수 쉼
  function passTurn() {
    isBlackTurn = !isBlackTurn;
    moveCount += 1;
    if (lastStone) {
      lastStone.classList.remove("last_stone");
    }
  }

  // 돌 계산
  function countStone(board) {
    var capCount = { black: 0, white: 0 };
    for (var i = 0; i < boardSize; i++) {
      for (var j = 0; j < boardSize; j++) {
        var address = board[i][j];
        switch (address) {
          case 0:
            capCount["black"]++;
            break;
          case 1:
            capCount["white"]++;
            break;
          case -1:
            break;
        }
      }
    }
    return capCount;
  }

  // 사석 계산
  function getDeadStone(board, backupBoard) {
    switch (isBlackTurn) {
      case true:
        if (
          countStone(board)["white"] - countStone(backupBoard)["white"] ===
          1
        ) {
          deadCount["black"] =
            deadCount["black"] +
            (countStone(backupBoard)["black"] - countStone(board)["black"]);
        }
        break;
      case false:
        if (
          countStone(board)["black"] - countStone(backupBoard)["black"] ===
          1
        ) {
          deadCount["white"] =
            deadCount["white"] +
            (countStone(backupBoard)["white"] - countStone(board)["white"]);
        }
        break;
    }
    return deadCount;
  }

  // 사석 초기화
  function resetDeadCount() {
    (deadCount["black"] = 0), (deadCount["white"] = 0);
    document.getElementById("black_captured").innerHTML = 0;
    document.getElementById("white_captured").innerHTML = 0;
  }

  connect();
});
