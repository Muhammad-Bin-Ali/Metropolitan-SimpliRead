chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.tabs_req === "") {
        chrome.tabs.query({}, (tabs) => {
          sendResponse({tabs_open: tabs});
        });
      }
      return true
    }
  );

chrome.tabs.onCreated.addListener((tab) => {
  chrome.runtime.sendMessage({new_tab: tab.title})
})

// const url = "http://127.0.0.1:5000/summarize-article"

// // fetch(url, {
// //     method: 'GET',
// //     body : JSON.stringify({"url" : "https://www.ctvnews.ca/world/demolition-preparations-begin-at-collapsed-florida-condo-as-storm-looms-1.5495218"})
// // });

// const btn = document.getElementById('test')
// let formData = new FormData();
// formData.append('url','https://www.ctvnews.ca/world/demolition-preparations-begin-at-collapsed-florida-condo-as-storm-looms-1.5495218')


// btn.addEventListener('click', () => {
//     fetch(url, {
//         method: 'POST',
//         mode: "cors",
//         body : formData
//     })
//     .then(response => response.json())
//     .then(data => console.log(data))
//     .catch(err => console.log(err.json()));
// })