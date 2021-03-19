class Countdown {
  /*static list = [];
  static nextId = 0;*/
  static get(id) {
    for (let i in Countdown.list) {
      if (Countdown.list[i].id === id) {
        return Countdown.list[i];
      }
    }
  }
  static cancel(id) {
    for (let i in Countdown.list) {
      if (Countdown.list[i].id === id) {
        Countdown.list[i].canceled = true;
        Countdown.list[i].target.innerHTML = "";
        Countdown.list.splice(i, 1);
      }
    }
  }
  constructor(endTime, el, cb=null, str="%% seconds", periodic=null) {
    this.timeFunc = () => new Date();
    if (timeSync) {
      this.timeFunc = timeSync.now;
    }
    if (endTime <= this.timeFunc()) {
      cb();
      return null;
    }
    this.id = Countdown.nextId;
    Countdown.nextId++;
    Countdown.list.push(this);
    this.endTime = endTime;
    this.target = el;
    this.cb = cb || function() {};
    this.str = str;
    this.periodic = periodic || function() {};
    this.canceled = false;
    this.start();
  }
  start() {
    let now = this.timeFunc();
    this.secsLeft = Math.ceil((this.endTime - now) / 1000);
    this.update();
    if (this.endTime - now < 1000) {
      this.startLast();
    } else {
      let nextSec = this.timeFunc();
      nextSec.setSeconds(nextSec.getSeconds() + 1);
      nextSec.setMilliseconds(0);
      setTimeout(() => this.startNext(), nextSec - this.timeFunc());
    }
  }
  startNext() {
    if (this.canceled) {
      this.target.innerHTML = "";
      return;
    }
    let destTime = this.timeFunc();
    this.secsLeft = Math.round((this.endTime - destTime) / 1000);
    this.update();
    this.periodic(this.target);
    destTime.setSeconds(destTime.getSeconds() + 1);
    destTime.setMilliseconds(0);
    if (this.endTime - destTime > 500) {
      setTimeout(() => this.startNext(), destTime - this.timeFunc());
    } else {
      setTimeout(() => this.startLast(), destTime - this.timeFunc());
    }
  }
  startLast() {
    if (this.canceled) {
      this.end();
    }
    setTimeout(() => {this.end()}, this.endTime - this.timeFunc());
  }
  update() {
    this.target.innerHTML = this.str.replace(/%%/g, this.secsLeft);
  }
  changeTarget(newEl, newCb=null, newStr=null, newPeriodic=null) {
    this.target.innerHTML = "";
    this.target = newEl;
    if (newCb) {
      this.cb = newCb;
    }
    if (newStr !== null) {
      this.str = newStr;
    }
    if (newPeriodic !== false) {
      this.periodic = newPeriodic || function() {};
    }
    this.update();
  }
  end() {
    if (!this.canceled) {
      this.cb();
    }
    Countdown.cancel(this.id);
  }
}
Countdown.list = [];
Countdown.nextId = 0;