for (key in allFrames) {
  let lower = key.toLowerCase();
  if (lower === key) {
    continue;
  }
  if (allFrames[lower] === undefined) {
    allFrames[lower] = allFrames[key];
    delete allFrames.key;
  } else {
    console.log("Warning: keys " + key + " and " + lower + " both exist. Only " + lower + " will be accessible.");
  }
}

!function() {
  const MSPERFRAME = 2000;
  const BLANKFRAMES = 3;
  const HIDEATEND = true;
  const OPENTEXT = "OPEN";
  const CLOSEDTEXT = "CLOSED";
  const READYTEXT = "CLOSED";
  const currentColorDiv = document.getElementById("current-color");
  const currentText = document.getElementById("current-text");
  const nextColorDiv = document.getElementById("next-color");
  const thenColorDiv = document.getElementById("then-color");
  const startButton = document.getElementById("start");
  const stopButton = document.getElementById("stop");
  const nameEntry = document.getElementById("name");
  const nameFound = document.getElementById("name-found");
  const subsequenceSelect = document.getElementById("subsequence-select");
  const timeInput = document.getElementById("time-input");
  const timeLeft = document.getElementById("time-left");
  const timeUntilStart = document.getElementById("time-until-start");
  const cancelButton = document.getElementById("cancel");
  const gainInput = document.getElementById("gain-input");
  const gainView = document.getElementById("gain-view");
  const gainReset = document.getElementById("gain-reset");
  const delayText = document.getElementById("delay-text");
  const delayErr = document.getElementById("delay-err");
  const delayFind = document.getElementById("find-delay");
  const pixelName = document.getElementById("pixel-name");
  const subNameSpan = document.getElementById("sub-name");

  let currentFrame = 0;
  let name;
  let seqs;
  let frames;
  let subName;
  let runInterval;

  let countdownId;

  let startTime;

  let audioCtx;
  let gainNode;

  let wakeLock = function() {
    if ('wakeLock' in navigator) {
      return {
        type: "API",
        lock: async function() {
          this.lockObj = await navigator.wakeLock.request();
          return this.lockObj;
        },
        release: async function() {
          return this.lockObj.release();
        }
      }
    } else {
      var noSleep = new NoSleep();
      return {
        type: "NoSleep",
        lockObj: noSleep,
        lock: noSleep.enable,
        release: noSleep.disable
      }
    }
  }();
  console.log("wake lock: " + wakeLock.type);

  function nextFrame() {
    console.log("frame " + currentFrame + ", delay " + (timeSync.now() - startTime - currentFrame*MSPERFRAME));
    playSound();
    document.body.dataset.frame = "normal";
    if (currentFrame === frames.length) {
      stop();
      return;
    } 
    else if (HIDEATEND) {
      if (currentFrame === frames.length - 1) {
        document.body.dataset.frame = "last";
      }
      else if (currentFrame === frames.length - 2) {
        document.body.dataset.frame = "second last";
      }
    }
    setColor(frames[currentFrame], currentColorDiv);
    setText(frames[currentFrame], currentText);
    setColor(frames[currentFrame + 1], nextColorDiv);
    setColor(frames[currentFrame + 2], thenColorDiv);
    currentFrame++;
  }

  function setColor(val, el) {
    let newClass = "undefined";
    el.classList.remove("open");
    el.classList.remove("closed");
    el.classList.remove("undefined");
    if (val === true) {
      newClass = "open";
    } else if (val === false) {
      newClass = "closed"
    }
    setTimeout(() => el.classList.add(newClass), 0);
  }

  function setText(val, el) {
    if (val === true) {
      el.innerHTML = OPENTEXT;
    } else if (val === false) {
      el.innerHTML = CLOSEDTEXT;
    } else {
      el.innerHTML = READYTEXT;
    }
  }

  const playSound = function() {
    try {
      window.AudioContext = 
        window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext;
      audioCtx.createGain = audioCtx.createGain || audioCtx.createGainNode;
      gainNode = audioCtx.createGain();
      gainNode.connect(audioCtx.destination);

      const request = new XMLHttpRequest();
      request.open('GET', "sound.mp3");
      request.responseType = 'arraybuffer';

      let soundBuffer;
      function decodeSuccess(buffer) {
        soundBuffer = buffer;
      }
      function decodeError(err) {
        console.log("Decoding audio data failed");
        throw "decode error";
      }
      request.onload = function() {
        audioCtx.decodeAudioData(request.response, decodeSuccess, decodeError);
      }
      request.send();

      return function() {
        const source = audioCtx.createBufferSource();
        source.buffer = soundBuffer;
        source.connect(gainNode);
        source.start();
      }

    } catch (err) {
      nameFound.innerHTML = err.name + ": " + err.message;
      console.log("Falling back to Audio object");
      const sound = new Audio("sound.mp3");
      return sound.play;
    }
  }();

  function resumeAudioContext() {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }
  nameEntry.addEventListener("focus", resumeAudioContext);

  function adjustGain() {
    gainNode.gain.value = gainInput.value;
    gainView.innerHTML = gainInput.value;
  }
  gainInput.addEventListener("input", adjustGain);

  function resetGain() {
    gainInput.value = 1;
    adjustGain();
  }
  gainReset.addEventListener("click", resetGain);

  function start() {
    verifyName({}, true);
    if (!frames) {
      return;
    }
    currentFrame = 0;
    document.body.dataset.state = "running";
    console.log("sequence started. delay: " + (+timeSync.now() - startTime));
    timeInput.value = "";
    nextFrame();
    runInterval = setInterval(nextFrame, MSPERFRAME);
  }

  function fadeOut(el) {
    if (el.innerHTML === "1") {
      el.innerHTML = "READY";
    }
    el.classList.remove("fade-out");
    setTimeout(() => el.classList.add("fade-out"), 250);
  }

  function scheduledStart() {
    document.body.dataset.state = "scheduled";
    Countdown.get(countdownId).changeTarget(timeUntilStart, start, "%%", fadeOut);
    wakeLock.lock();
  }
  startButton.addEventListener("click", scheduledStart);

  function cancel() {
    document.body.dataset.state = "login";
    try {
      Countdown.get(countdownId).changeTarget(timeLeft, checkTime, "(in %% seconds)");
    } catch(err) {
      checkTime();
    }
    timeUntilStart.classList.remove("fade-out");
    wakeLock.release();
  }
  cancelButton.addEventListener("click", cancel);

  function stop() {
    document.body.dataset.state = "login";
    clearInterval(runInterval);
    document.getElementById(subName.id).checked = true;
    checkSubsequence();
    startTime = undefined;
    checkTime();
    wakeLock.release();
    console.log("wake lock released");
  }
  stopButton.addEventListener("click", stop);

  function verifyName(event, promptInvalid=false) {
    name = nameEntry.value.toLowerCase();
    seqs = allFrames[name];
    if (seqs) {
      nameEntry.style.backgroundColor = "lightgreen";
      nameFound.innerHTML = "Name found!";
      document.body.classList.add("name-valid");
      addRadioButtons();
      pixelName.innerHTML = name;
      return true;
    } else {
      if (promptInvalid) {
        nameEntry.style.backgroundColor = "lightcoral";
        nameFound.innerHTML = "Name not found";
      }
      else {
        nameEntry.style.backgroundColor = "";
        nameFound.innerHTML = "";
      }
      document.body.classList.remove("name-valid");
      clearRadioButtons();
      return false;
    }
  }
  nameEntry.addEventListener("input", verifyName);

  function addRadioButtons() {
    clearRadioButtons();
    for (let name of Object.keys(seqs)) {
      let cont = document.createElement("div");
      cont.classList.add("subsequence-option");
      let radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "subsequence";
      radio.value = name;
      radio.id = "sub--" + name;
      radio.addEventListener("click", checkSubsequence);
      let label = document.createElement("label");
      label.for = "sub--" + name;
      label.innerHTML = name;
      cont.appendChild(radio);
      cont.appendChild(label);
      subsequenceSelect.appendChild(cont);
    }
  }

  function clearRadioButtons() {
    document.body.classList.remove("subsequence-valid");
    subsequenceSelect.innerHTML = "";
  }

  function checkSubsequence() {
    subName = subsequenceSelect.querySelector("[name=subsequence]:checked");
    if (subName === null) {
      return;
    }
    else if (seqs[subName.value]) {
      frames = Array(BLANKFRAMES).fill(undefined).concat(seqs[subName.value]);
      document.body.classList.add("subsequence-valid");
      subNameSpan.innerHTML = subName.value;
    }
    else {
      nameFound.innerHTML = "Something went wrong...";
      document.body.classList.remove("subsequence-valid");
    }
  }

  function checkTime() {
    Countdown.cancel(countdownId);
    let valid = false;
    let [hours, minutes] = timeInput.value.split(":");
    if (minutes === undefined || hours === undefined) {
      document.body.classList.remove("time-valid");
      nameFound.innerHTML = "Name found!";
      return;
    }
    startTime = new Date();
    try {
      startTime.setHours(hours);
      startTime.setMinutes(minutes);
      startTime.setSeconds(0);
      startTime.setMilliseconds(0);
      if (startTime <= new Date()) {
        if (document.body.classList.contains("subsequence-valid")) {
          nameFound.innerHTML = "Time is in the past";
        } else {
          timeInput.value = "";
        }
        throw "past";
      } else {
        nameFound.innerHTML = "Name found!";
      }
      valid = true;
    } catch (err) {
      startTime = undefined;
    }

    if (valid) {
      document.body.classList.add("time-valid");
      countdownId = new Countdown(startTime, timeLeft, checkTime, "(in %% seconds)").id;
    } else {
      document.body.classList.remove("time-valid");
    }
  }
  timeInput.addEventListener("input", checkTime);

  function calcDelay() {
    delayErr.innerHTML = "Calculating...";
    timeSync.getDelay().then(val => {
      if (val === "no internet") {
        let stored = localStorage.getItem("offset");
        if (stored === null) {
          delayText.innerHTML = "Offset: unknown";
          delayErr.innerHTML = "No internet or stored value";
        } else {
          timeSync.delay = stored;
          delayText.innerHTML = "Offset: " + stored + "ms";
          delayErr = "No internet, using stored value";
        }
      } else {
        localStorage.setItem("offset", val);
        delayText.innerHTML = "Offset: " + val + "ms";
        delayErr.innerHTML = "";
      }
    });
  }
  delayFind.addEventListener("click", calcDelay);

  calcDelay();

}();