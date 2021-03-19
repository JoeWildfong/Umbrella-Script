const timeSync = {
  _server: "https://catherapyservices.ca/timesync/",
  _count: 5,
  _checkInterval: 20,
  delay: 0,
  getDelay: async function() {
    let delaysRa = [];
    delaysRa.push(await this.getOnce());
    for (let i = 0; i < this._count; i++) {
      delaysRa.push(await this.getOnceAfter(this._checkInterval));
    }
    delaysRa.sort((a, b) => a.roundtripdelay - b.roundtripdelay);
    console.log(delaysRa);
    let lowestLatency = delaysRa[0].roundtripdelay;
    if (lowestLatency >= 1000) {
      return "no internet";
    }
    let lowLatencyOffsets = [delaysRa[0].offset];
    for (let i = 1; i < delaysRa.length; i++) {
      if (delaysRa[i].roundtripdelay > lowestLatency) {
        break;
      }
      lowLatencyOffsets.push(delaysRa[i].offset);
    }
    this.delay = lowLatencyOffsets.reduce((a, b) => a + b) / lowLatencyOffsets.length;
    return this.delay;
  },
  getOnce: async function() {
    return new Promise((resolve, reject) => {
      let req = new XMLHttpRequest();
      req.open("GET", this._server);
      req.onreadystatechange = () => {
        let t3 = new Date().getTime();
        if (req.readyState === 4 && req.status === 200) {
          let serverTimes = req.responseText.split("|");
          let t1 = serverTimes[0];
          let t2 = serverTimes[1];
          resolve(this.ntp(t0, t1, t2, t3));
        }
      }
      req.timeout = 1000;
      req.ontimeout = () => {
        resolve({roundtripdelay: 1000, offset:0});
      }
      let t0 = new Date().getTime();
      req.send();
    });
  },
  getOnceAfter: async function(delay) {
    return new Promise((resolve, reject) => {
        setTimeout(
          async () => resolve(await this.getOnce()),
          delay
        )
    });
  },
  ntp: function(t0, t1, t2, t3) {
    return {
        roundtripdelay: (t3 - t0) - (t2 - t1),
        offset: ((t1 - t0) + (t2 - t3)) / 2
    };
  },
  now: function() {
    return new Date(Date.now() + timeSync.delay);
  }
}
