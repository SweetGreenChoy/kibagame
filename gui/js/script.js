$(document).ready(function () {
  // 게임 리스트 클릭 시 색상 변환
  $(".game_list .list_tbody").on("click", function () {
    $(this).toggleClass("active");
    $(this).siblings().removeClass("active");
  });

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

  // 타이머
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

  startTimer(".timer_list", 300); // 5분 타이머
  // startTimer('.timer_game', 60); // 60초 타이머

  // 초기 비율 설정 및 창 크기 변경 시 비율 유지 함수
  function maintainBoardRatio() {
    const container = document.querySelector(".baduk_board");
    const containerHeight = container.offsetHeight;
    container.style.width = containerHeight + "px";
  }

  // 초기 비율 설정
  maintainBoardRatio();

  // 창 크기가 변경될 때 비율 유지
  window.addEventListener("resize", maintainBoardRatio);

  // 바둑판 생성
  const badukInner = document.getElementById("badukInner");
  const soundStone = document.getElementById("soundStone");
  const soundCountStart = document.getElementById("soundCountStart");
  const soundCountTen = document.getElementById("soundCountTen");
  let lastStone = null; // 마지막으로 둔 돌을 추적

  for (let i = 0; i < 19; i++) {
    for (let j = 0; j < 19; j++) {
      const cell = document.createElement("div");
      cell.className = "baduk_cell";
      badukInner.appendChild(cell);
    }
  }

  let isBlackTurn = true; // 흑돌부터 시작

  // 셀을 클릭할 때 호출되는 함수
  let timerInterval; // 전역 변수로 타이머 설정

  function placeStone(event) {
    const cell = event.target;

    if (
      !cell.classList.contains("black_stone") &&
      !cell.classList.contains("white_stone")
    ) {
      // 이미 돌이 놓여 있는 경우에는 놓을 수 없음
      clearInterval(timerInterval); // 이전 타이머 중지
      soundCountStart.pause(); // 사운드 중지
      soundCountStart.currentTime = 0;
      soundCountTen.pause(); // 사운드 중지
      soundCountTen.currentTime = 0;

      if (isBlackTurn) {
        // 흑돌 차례
        cell.classList.add("black_stone");
        soundStone.play();

        // 흑돌의 타이머 시작 및 사운드 재생
        const timerGame = document.querySelector(".timer_game.black");
        startCountdown(timerGame, soundCountStart, soundCountTen);
      } else {
        // 백돌 차례
        cell.classList.add("white_stone");
        soundStone.play();

        // 백돌의 타이머 시작 및 사운드 재생
        const timerGame = document.querySelector(".timer_game.white");
        startCountdown(timerGame, soundCountStart, soundCountTen);
      }

      if (lastStone) {
        lastStone.classList.remove("last_stone");
      }

      cell.classList.add("last_stone");
      lastStone = cell;
      isBlackTurn = !isBlackTurn;
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
  const cells = badukInner.querySelectorAll(".baduk_cell");
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
});
