var roomCode = document.getElementById("container").getAttribute("room_code");
var char_choice = document
  .getElementById("container")
  .getAttribute("char_choice");

var connectionString =
  "ws://" + window.location.host + "/ws/play/" + roomCode + "/";
var gameSocket = new WebSocket(connectionString);

//Global variables
var playerBlack = 0;
var playerWhite = 1;
let moveCount = 0;

//Current board
var board = [];
//Calculate liberties by checking each position
var checkBoard = [];
//Test valid move by checking the test board
var testBoard = [];
//Back up board
var backupBoard = [];
var historyBoards = [];

var registered = [];

const EMPTY = -1;
const CHECKED = 1,
  UNCHECKED = 0;

var directs = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
];

$(document).ready(function () {
  // 탭
  $(".tab li").click(function () {
    var idx = $(this).index();
    $(".tab li").removeClass("on");
    $(".tab li").eq(idx).addClass("on");
    $(".tabcont > div").hide();
    $(".tabcont > div").eq(idx).show();
  });

  //토너먼트 등록 팝업
  $(".game_info .btn_reg, #regNoBtn").on("click", function () {
    $("#popupReg").toggleClass("on");
    $("#regOrNot").toggleClass("on");
  });

  $("#regYesBtn").on("click", function () {
    console.log("SECOND");
    $("#regOrNot").removeClass("on");
    $("#regComplete").addClass("on");
  });

  $("#regCompleteBtn").on("click", function () {
    $("#popupReg").removeClass("on");
    $("#regOrNot").removeClass("on");
    $("#regComplete").removeClass("on");
    $(".game_info .btn_reg").removeClass("on");
    $(".game_info .btn_cancel").addClass("on");
  });

  // 토너먼트 취소 팝업
  $(".game_info .btn_cancel, #cancelNoBtn").on("click", function () {
    $("#popupReg").toggleClass("on");
    $("#cancelOrNot").toggleClass("on");
  });

  $("#cancelYesBtn").on("click", function () {
    $("#cancelOrNot").removeClass("on");
    $("#cancelComplete").addClass("on");
  });

  $("#cancelCompleteBtn").on("click", function () {
    $("#popupReg").removeClass("on");
    $("#cancelOrNot").removeClass("on");
    $("#cancelComplete").removeClass("on");
    $(".game_info .btn_cancel").removeClass("on");
    $(".game_info .btn_reg").addClass("on");
  });

  // 게임 - 한수쉼
  $(".btn_game_rest, #gameRestNoBtn").on("click", function () {
    $("#popupGameRest").toggleClass("on");
    $("#gameRestOrNot").toggleClass("on");
  });

  $("#gameRestYesBtn").on("click", function () {
    $("#gameRestOrNot").removeClass("on");
    $("#gameRestComplete").addClass("on");
  });

  $("#gameRestComplete").on("click", function () {
    $("#popupGameRest").removeClass("on");
    $("#gameRestOrNot").removeClass("on");
    $("#gameRestComplete").removeClass("on");
  });

  // 게임 - 기권
  $(".btn_game_out, #gameOutNoBtn").on("click", function () {
    $("#popupGameOut").toggleClass("on");
    $("#gameOutOrNot").toggleClass("on");
  });

  $("#gameOutYesBtn").on("click", function () {
    $("#gameOutOrNot").removeClass("on");
    $("#gameOutComplete").addClass("on");
  });

  $("#gameOutComplete").on("click", function () {
    $("#popupGameOut").removeClass("on");
    $("#gameOutOrNot").removeClass("on");
    $("#gameOutComplete").removeClass("on");
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
          event: "START",
          message: "",
        })
      );
    };

    gameSocket.onclose = function (event) {
      console.log(
        "Socket is closed. Reconnect will be attempted in 1 second.",
        event.reason
      );
      setTimeout(function () {
        connect();
      }, 1000);
    };

    gameSocket.onmessage = function (event) {
      let data = JSON.parse(event.data);
      data = data["payload"];
      let message = data["message"];
      let boardData = data["message"]["board"];
      let event = data["event"];
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

  // 셀을 클릭할 때 호출되는 함수
  let timerInterval; // 전역 변수로 타이머 설정

  function placeStone(event) {
    const cell = event.target;
    var box = $(cell).attr("id").split("-");
    var x = parseInt(box[1]);
    var y = parseInt(box[2]);

    testBoard[x][y] = isBlackTurn ? playerBlack : playerWhite;
    clearBoard(testBoard);

    if (cell.classList.contains("hide")) {
      // 이미 돌이 놓여 있는 경우에는 놓을 수 없음
      clearInterval(timerInterval); // 이전 타이머 중지
      soundCountStart.pause(); // 사운드 중지
      soundCountStart.currentTime = 0;
      soundCountTen.pause(); // 사운드 중지
      soundCountTen.currentTime = 0;

      if (invalidTestBoard() || invalidMove(x, y)) {
        showInvalidMove(x, y);
        copyBoard(testBoard, board);
        resetCheckBoard();
      } else {
        copyBoard(backupBoard, board);

        copyBoard(board, testBoard);
        updateGameBy(board);
        if (isBlackTurn) {
          // 흑돌 차례

          cell.classList.replace("hide", "black_stone");
          board[x][y] = playerBlack;
          soundStone.play();

          // 흑돌의 타이머 시작 및 사운드 재생
          const timerGame = document.querySelector(".timer_game.white");
          startCountdown(timerGame, soundCountStart, soundCountTen);
        } else {
          // 백돌 차례
          cell.classList.replace("hide", "white_stone");
          board[x][y] = playerWhite;
          soundStone.play();

          // 백돌의 타이머 시작 및 사운드 재생
          const timerGame = document.querySelector(".timer_game.black");
          startCountdown(timerGame, soundCountStart, soundCountTen);
        }

        if (lastStone) {
          lastStone.classList.remove("last_stone");
        }

        cell.classList.add("last_stone");
        lastStone = cell;
        isBlackTurn = !isBlackTurn;
        moveCount++;

        let data = {
          event: "MOVE",
          message: {
            lastMove: moveCount,
            board: board,
            player: isBlackTurn ? playerBlack : playerWhite,
          },
        };

        admitCoord();
        cell.classList.add("last_stone");
        lastStone = cell;
        gameSocket.send(JSON.stringify(data));
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
        //valid position
        if (board[pX][pY] === EMPTY) {
          //1 liberty
          count++;
        } else if (board[pX][pY] === board[x][y]) {
          //next chain
          count += getLiberties(board, pX, pY);
          checkBoard[pX][pY] = CHECKED;
        }
      }
    }
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
    return chain;
  }

  function clearBoard(board) {
    for (var i = 0; i < boardSize; i++) {
      for (var j = 0; j < boardSize; j++) {
        if (
          board[i][j] !== EMPTY &&
          board[i][j] !== (isBlackTurn ? playerBlack : playerWhite)
        ) {
          if (getLiberties(board, i, j) === 0) {
            //Remove dead pieces in board
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

  function deleteBox(box) {
    box.removeClass("black_stone");
    box.removeClass("white_stone");
    box.addClass("hide");
  } //시작 전 초기화

  function admitCoord() {
    for (var i = 0; i < boardSize; i++) {
      for (var j = 0; j < boardSize; j++) {
        var stone = document.getElementById("cell" + "-" + i + "-" + j);
        switch (board[i][j]) {
          case -1:
            stone.className = "cell hide";
            break;
          case 1:
            stone.className = "cell white_stone";
            break;
          case 0:
            stone.className = "cell black_stone";
            break;
        }
      }
    }
  }
  connect();
});
