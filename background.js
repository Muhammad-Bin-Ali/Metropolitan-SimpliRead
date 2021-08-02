//event listener to get the tabs that are currently open in user's active window
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.tabs_req === "") {
        chrome.tabs.query({}, (tabs) => {
          sendResponse({tabs_open: tabs});
        });
      }
      return true; //need to add this so message port stays open. so once the .onMessage.addListener listener returns, the sendResponse stays valid
    }
  );

chrome.runtime.onMessage.addListener(
  function(request, send, sendResponse) {
    //if the message passed is a valid integer and not an empty value
    if (Number.isInteger(request.selected_tab_index)) {
      var index_passed = request.selected_tab_index; 
      chrome.tabs.query({index: index_passed}, (tab) => {
        var link = tab[0].url; //gets url of tab
        var title = tab[0].title //gets title of tab
        //contact API and get summary
        get_from_api(link).then(summary => {
          //create new tab with following template and active: false so chrome doesn't switch to new tab
          chrome.tabs.create({url: "condensed-page.html", active: false}, async (tab) => {
            await onTabLoaded(tab.id); //waits for the TAB to fully load
            await chrome.runtime.sendMessage({page_info: [{title: title}, {summary: summary}]}, (response) => {
              sendResponse() //sends response back to popup.js to show that everything was successful
            })
          })
        })
      })
    }
  }
)

async function get_from_api(link) {
  var api_endpoint = "http://127.0.0.1:5000/summarize-article"

  let formData = new FormData();
  formData.append('url', link);
  
  var returned_text;
  //await is used here to pause the program execution till fetch returns something
  await fetch(api_endpoint, {
    method: 'POST',
    mode: "cors",
    body : formData
  })
  .then(response => response.json())
  .then(data => returned_text = data);

  return returned_text.summary;
}

function onTabLoaded(tabId) {
  return new Promise(resolve => {
    //adds an event listener that's triggered every time the page is updated. Also triggered when it has loaded
    chrome.tabs.onUpdated.addListener(function onUpdated(id, change) {
      if (id === tabId && change.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(onUpdated); //removes it
        resolve(); //resolves promise
      }
    });
  });
}