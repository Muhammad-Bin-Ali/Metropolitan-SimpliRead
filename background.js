//event listener to create account upon install
chrome.runtime.onInstalled.addListener(() => {
  chrome.identity.getProfileUserInfo((user) => {
    addUserToDB(user.email, user.id);
  })
})

async function addUserToDB(email, id) {
  var api_endpoint = "http://127.0.0.1:5000/summarize-article/" + id;

  let formData = new FormData();
  formData.append('email', email);

  //await is used here to pause the program execution till fetch returns something
  await fetch(api_endpoint, {
    method: 'POST',
    mode: "cors",
    body : formData
  })
}

//event listener to get the tabs that are currently open in user's active window
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.tabs_req === "") {
        chrome.tabs.query({currentWindow: true}, (tabs) => {
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
      console.log(index_passed)
      chrome.tabs.query({index: index_passed, currentWindow: true}, (tab) => {
        
        var link = tab[0].url; //gets url of tab
        var title = tab[0].title //gets title of tab
        //contact API and get summary
        get_from_api(link).then(summary => {
          //create new tab with following template and active: false so chrome doesn't switch to new tab
          sendResponse({title: title, summary: summary})
        })
      })
    }
  }
)

async function get_from_api(link) {
  var id;
  chrome.identity.getProfileUserInfo((user) => {
    id = user.id;
  })
  var api_endpoint = "http://127.0.0.1:5000/summarize-article/" + id

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


chrome.runtime.onMessage.addListener((request, send, sendResponse) => {
  if (request.get_links === "") {
    chrome.identity.getProfileUserInfo((user) => {
      get_links_from_api(user.id)
      .then(links => {
        sendResponse({saved_links: links})
      });
    })
  }
})

async function get_links_from_api(id) {
  var api_endpoint = "http://127.0.0.1:5000/summarize-article/" + id

  var returned_text;

  //await is used here to pause the program execution till fetch returns something
  await fetch(api_endpoint, {
    method: 'GET',
    mode: "cors",
  })
  .then(response => response.json())
  .then(data => returned_text = data);

  return returned_text.links;
}
