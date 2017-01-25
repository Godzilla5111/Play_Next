(function(document) {
    "use strict";
    var s = document.createElement("script");
    s.src = chrome.extension.getURL("src/inject/main.js");
    s.onload = function() {
        this.parentNode.removeChild(this);
        s = undefined
    };
    document.documentElement.appendChild(s)
})(window.document);

var queue = [];
chrome.storage.local.get('queue', function (result) {
    queue = result.queue;
    console.log(queue);
});
    
function insertButton() {
    var buttons = document.querySelectorAll('p[class="button play-next"]');
    if (buttons.length == 0) {
        var download_links = document.querySelectorAll('a[class=" content-link spf-link  yt-uix-sessionlink      spf-link "]');
        if(download_links.length){
            for (var i = 0; i < download_links.length; i++) {
                var link = download_links[i];
                var p = document.createElement('p');
                    p.innerHTML = '<a href="#">Play Next</a>';
                    p.className = "button play-next";
                    link.parentElement.insertAdjacentElement('afterbegin',p);
                    p.dataset.name = link.href;
                    p.querySelector('a').addEventListener('click',clickHandler,true);
            }
        }
    }
}

function sendLink() {
    if (queue.length > 0) {
        var codeToPush = `var link = "${ window.queue[0] }";`;
        console.log("sendLink", codeToPush);
        var script = document.createElement('script');
        script.textContent = codeToPush;
        document.documentElement.appendChild(script);
        script.remove();
    }
}


function clickHandler(e){
    window.queue.push(this.parentNode.dataset.name);
    sendLink();
}
// At the very start add the buttons
insertButton();

var port = chrome.runtime.connect();

// YouTube is lesser prone to disturbances than sadness
window.addEventListener("message", function(event) {
  // Only accept messages from ourselves
  if (event.source != window)
    return;

  if (event.data.type && (event.data.type == "FROM_PAGE")) {
    insertButton();
    sendLink();
    console.log(window.queue);
    console.log("Content script received: " + event.data.text);
    if (event.data.text == "pop") {
        window.queue.shift();
        console.log("Removed");
        chrome.storage.local.set({'queue': window.queue});    
        console.log("Written");    
    }
  }
}, false);
