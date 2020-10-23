!function() {
  const MSPERFRAME = 1000;
  const BLANKFRAMES = 3;
  const OPENCOLOR = "green";
  const CLOSEDCOLOR = "red";
  const UNDEFINEDCOLOR = "grey";
  const HIDEATEND = true;
  const currentColorDiv = document.getElementById("current-color");
  const nextColorDiv = document.getElementById("next-color");
  const thenColorDiv = document.getElementById("then-color");
  const startButton = document.getElementById("start");
  const stopButton = document.getElementById("stop");
  const nameEntry = document.getElementById("name");
  const nameFound = document.getElementById("name-found");
  const subsequenceSelect = document.getElementById("subsequence-select");

  let currentFrame = 0;
  let name;
  let seqs;
  let frames;
  let runInterval;

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

  function start() {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    verifyName({}, true);
    if (!frames) {
      return;
    }
    currentFrame = 0;
    document.body.classList.add("started");
    nextFrame();
    runInterval = setInterval(nextFrame, MSPERFRAME);
  }
  startButton.addEventListener("click", start);

  function stop() {
    document.body.classList.remove("started");
    clearInterval(runInterval);
  }
  stopButton.addEventListener("click", stop);

  function verifyName(event, promptInvalid=false) {
    name = nameEntry.value;
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

}();