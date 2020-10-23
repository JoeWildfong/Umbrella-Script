if (location.protocol !== 'https:') {
  location.replace(`https:${location.href.substring(location.protocol.length)}`);
}
navigator.serviceWorker.addEventListener('controllerchange', () => {
  location.reload();
});
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(function(reg) {

    if(reg.installing) {
      console.log('Service worker installing');
    } else if(reg.waiting) {
      console.log('Service worker installed');
    } else if(reg.active) {
      console.log('Service worker active');
    }

  }).catch(function(error) {
    // registration failed
    console.log('Registration failed with ' + error);
  });
} else {
  console.log("Service worker unsupported");
}

try {
  screen.orientation.lock("landscape");
} catch (err) {
  console.log("Screen lock not supported");
}
