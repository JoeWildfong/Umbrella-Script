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
  const OPENCOLOR = "green";
  const CLOSEDCOLOR = "red";
  const UNDEFINEDCOLOR = "grey";
  const HIDEATEND = false;
  const currentColorDiv = document.getElementById("current-color");
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

  let currentFrame = 0;
  let name;
  let seqs;
  let frames;
  let runInterval;

  let countdowns = [];
  let nextCountdownId = 0;
  let countdownId;

  let startTime;

  let audioCtx;

  function nextFrame() {
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
    setColor(frames[currentFrame + 1], nextColorDiv);
    setColor(frames[currentFrame + 2], thenColorDiv);
    currentFrame++;
  }

  function setColor(val, el) {
    if (val === true) {
      el.style.backgroundColor = OPENCOLOR;
    } else if (val === false) {
      el.style.backgroundColor = CLOSEDCOLOR;
    } else {
      el.style.backgroundColor = UNDEFINEDCOLOR;
    }
  }

  const playSound = function() {
    try {
      window.AudioContext = 
        window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext;

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
        source.connect(audioCtx.destination);
        source.start();
      }

    } catch (err) {
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

  function start() {
    verifyName({}, true);
    if (!frames) {
      return;
    }
    currentFrame = 0;
    document.body.dataset.state = "running";
    console.log("sequence started. delay: " + (+new Date() - startTime));
    startTime = undefined;
    timeInput.value = "";
    nextFrame();
    runInterval = setInterval(nextFrame, MSPERFRAME);
  }

  function scheduledStart() {
    //cancelCountdown(inputBoxCountdownId);
    document.body.dataset.state = "scheduled";
    //startCountdownId = startCountdown(startTime, timeUntilStart, start, "Starting in %% seconds");
    getCountdown(countdownId).changeTarget(timeUntilStart, start, "Starting in %% seconds");
  }
  startButton.addEventListener("click", scheduledStart);

  function cancel() {
    //cancelCountdown(startCountdownId);
    document.body.dataset.state = "login";
    try {
      getCountdown(countdownId).changeTarget(timeLeft, checkTime, "(in %% seconds)");
    } catch(err) {
      checkTime();
    }
  }
  cancelButton.addEventListener("click", cancel);

  function stop() {
    document.body.dataset.state = "login";
    clearInterval(runInterval);
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
    let subName = subsequenceSelect.querySelector("[name=subsequence]:checked");
    if (subName === null) {
      return;
    }
    else if (seqs[subName.value]) {
      frames = Array(BLANKFRAMES).fill(undefined).concat(seqs[subName.value]);
      document.body.classList.add("subsequence-valid");
    }
    else {
      nameFound.innerHTML = "Something went wrong...";
      document.body.classList.remove("subsequence-valid");
    }
  }

  function checkTime() {
    cancelCountdown(countdownId);
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
      countdownId = startCountdown(startTime, timeLeft, checkTime, "(in %% seconds)")
    } else {
      document.body.classList.remove("time-valid");
    }
  }
  timeInput.addEventListener("input", checkTime);

  class Countdown {
    constructor(endTime, el, cb=null, str="%% seconds") {
      this.id = nextCountdownId;
      nextCountdownId++;
      this.endTime = endTime;
      this.target = el;
      this.cb = cb || function() {};
      this.str = str;
      this.canceled = false;
    }
    startNext() {
      if (this.canceled) {
        this.target.innerHTML = "";
        return;
      }
      let destTime = new Date();
      this.secsLeft = Math.round((this.endTime - destTime) / 1000);
      this.print();
      destTime.setSeconds(destTime.getSeconds() + 1);
      destTime.setMilliseconds(0);
      if (this.endTime - destTime > 500) {
        setTimeout(() => this.startNext(), destTime - new Date());
      } else {
        setTimeout(() => this.startLast(), destTime - new Date());
      }
    }
    startLast() {
      if (this.canceled) {
        this.target.innerHTML = "";
        return;
      }
      setTimeout(() => {if (!this.canceled) {this.cb()}}, this.endTime - new Date());
      /*let curTime = new Date();
      if (endTime - curTime > 500) {
        setTimeout(() => this.startLast(), endTime - 100 - new Date());
        return;
      }
      if (endTime - curTime > 50) {
        setTimeout(() => this.startLast(), endTime - 30 - new Date());
        return;
      }
      while (true) {
        if (new Date() >= endTime) {
          this.cb();
          cancelCountdown(this.id);
          return;
        }
      }*/
    }
    /*rapidCheck() {
      while (true) {
        if (new Date() >= this.endTime) {
          this.cb();
          return;
        }
      }
    }*/
    print() {
      this.target.innerHTML = this.str.replace(/%%/g, this.secsLeft);
    }
    changeTarget(newEl, newCb=null, newStr=null) {
      this.target.innerHTML = "";
      this.target = newEl;
      if (newCb) {
        this.cb = newCb;
      }
      if (newStr !== null) {
        this.str = newStr;
      }
      this.print();
    }
  }

  function startCountdown(endTime, el, cb=null, str="%% seconds") {
    if (endTime < new Date()) {
      cb();
    }
    let countdown = new Countdown(endTime, el, cb, str);
    countdowns.push(countdown);
    if (endTime - new Date() < 1000) {
      countdown.startLast();
      return;
    }
    let wait = new Date();
    wait.setSeconds(wait.getSeconds() + 1);
    wait.setMilliseconds(0);
    setTimeout(() => countdown.startNext(), wait - new Date());
    return countdown.id;
  }

  function cancelCountdown(id) {
    for (let i in countdowns) {
      if (countdowns[i].id === id) {
        countdowns[i].canceled = true;
        countdowns[i].target.innerHTML = "";
        countdowns.splice(i, 1);
      }
    }
  }

  function getCountdown(id) {
    for (let i in countdowns) {
      if (countdowns[i].id === id) {
        return countdowns[i];
      }
    }
  }

  /*let endTime = new Date();
  endTime.setMinutes(endTime.getMinutes() + 1);
  endTime.setSeconds(0);
  endTime.setMilliseconds(0);
  let cb = function() {console.log(+new Date() - endTime)}
  startCountdown(endTime, nameFound, cb);
  */

}();