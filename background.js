//event listener to create account upon install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.runtime.setUninstallURL('https://docs.google.com/forms/d/e/1FAIpQLSdGV15pBCiVuzOwFxBUnztexhChmSCVt6O-jpKFcMRSR5_58w/viewform?usp=sf_link');
    chrome.identity.getProfileUserInfo((user) => {
      addUserToDB(user.email, user.id);
    })
  }
})

async function addUserToDB(email, id) {
  var api_endpoint = "https://simpliread.azurewebsites.net/summarize-article/" + id;

  let formData = new FormData();
  formData.append('email', email);

  //await is used here to pause the program execution till fetch returns something
  await fetch(api_endpoint, {
    method: 'POST',
    mode: "cors",
    body: formData
  })
}

//event listener to get the tabs that are currently open in user's active window
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.tabs_req === "") {
      chrome.tabs.query({ currentWindow: true }, (tabs) => {
        sendResponse({ tabs_open: tabs });
      });
    }
    return true; //need to add this so message port stays open. so once the .onMessage.addListener listener returns, the sendResponse stays valid
  }
);

//message listener for when user presses the summarize button
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    //if the message passed is a valid integer and not an empty value
    if (Number.isInteger(request.selected_tab_index)) {
      var index_passed = request.selected_tab_index;
      var windowId = request.current_window;

      chrome.tabs.query({ index: index_passed, windowId: windowId }, (tab) => {
        var link = tab[0].url; //gets url of tab
        var title = tab[0].title //gets title of tab

        chrome.identity.getProfileUserInfo((user) => {
          //contact API and get summary
          get_from_api(link, user.id).then(data => {
            //create new tab with following template and active: false so chrome doesn't switch to new tab
            sendResponse({ title: title, summary: data.summary, url: link, exists: data.exists, confirmed: data.confirmed })
          })
        })
      })
    }
  }
)

//function for getting summary from API
async function get_from_api(link, id) {
  try {
    var api_endpoint = "https://simpliread.azurewebsites.net/summarize-article/" + id;
    let formData = new FormData();
    formData.append('url', link);

    var confirmed; //will be used to store value of whether request was successful or not
    var returned_text;
    //await is used here to pause the program execution till fetch returns something
    await fetch(api_endpoint, {
      method: 'POST',
      mode: "cors",
      body: formData
    })
      .then(response => {
        if (response.status === 200) {
          confirmed = true;
        }
        else {
          confirmed = false
        }

        return response.json()
      })
      .then(data => returned_text = data);

    return { summary: returned_text.summary, exists: returned_text.exists, confirmed: confirmed };
  }
  catch {
    return { summary: "", exists: false, confirmed: false };
  }
}

//messsage listener for when user firt opens the API. Gets the saved links from database
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.get_links === "") {
    chrome.identity.getProfileUserInfo((user) => {
      get_links_from_api(user.id)
        .then(data => {
          sendResponse({ data: data })
        });
    })
  }
})

//funtion to get saved links from API
async function get_links_from_api(id) {
  try {
    var api_endpoint = "https://simpliread.azurewebsites.net/summarize-article/" + id;
    var confirmed;
    var return_context;
    //await is used here to pause the program execution till fetch returns something
    await fetch(api_endpoint, {
      method: 'GET',
      mode: "cors",
    })
      .then(response => {
        if (response.status === 200) {
          confirmed = true;
        }
        else {
          confirmed = false;
        }
        return response.json();
      })
      .then(data => {
        return_context = { links: data.links, status: confirmed };
      });

    return return_context;
  }
  catch {
    return { links: [], status: false }
  }
}

//message listener for when user presses the heart icon and saves a link
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.save_link) {
    var title = request.save_link[0].title;
    var body = request.save_link[0].body;
    var url = request.save_link[0].url;

    chrome.identity.getProfileUserInfo((user) => {
      save_link(title, body, url, user.id).then(confirmation => {
        sendResponse({ confirmed: confirmation });
      });
    })
  }
})

//message listener for when user presses the heart icon and deletes a link
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.del_link) {
    var title = request.del_link[0].title;
    var body = request.del_link[0].body;

    chrome.identity.getProfileUserInfo((user) => {
      del_link(title, body, user.id).then(confirmation => {
        sendResponse({ confirmed: confirmation });
      });
    })
  }
})

//function that contact API and saves link
async function save_link(title, body, url, id) {
  var api_endpoint = "https://simpliread.azurewebsites.net/summarize-article/" + id;
  let formData = new FormData();
  formData.append('save_link', true)
  formData.append('title', title);
  formData.append('body', body);
  formData.append('url', url);

  var confirmed;
  //await is used here to pause the program execution till fetch returns something
  await fetch(api_endpoint, {
    method: 'PUT',
    mode: "cors",
    body: formData
  }).then(response => {
    if (response.status === 201) {
      confirmed = true
    }
    else {
      confirmed = false;
    }
  })

  return confirmed;
}

//function that contact API and deletes link
async function del_link(title, body, id) {
  try {
    var api_endpoint = "https://simpliread.azurewebsites.net/summarize-article/" + id;
    let formData = new FormData();
    formData.append('del_link', true)
    formData.append('title', title);
    formData.append('body', body);

    var confirmed;
    //await is used here to pause the program execution till fetch returns something
    await fetch(api_endpoint, {
      method: 'DELETE',
      mode: "cors",
      body: formData
    }).then(response => {
      if (response.status === 201) {
        confirmed = true
      }
      else {
        confirmed = false;
      }
    })

    return confirmed;
  }
  catch {
    return false
  }
}


//functions that retrieve saved article
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.retrieve_saved) {
    var title = request.retrieve_saved;

    chrome.identity.getProfileUserInfo((user) => {
      getSaved(title, user.id)
        .then(data => {
          sendResponse({ body: data.body, confirmed: data.confirmed });
        })
    })
  }
})

async function getSaved(title, id) {
  try {
    var api_endpoint = "https://simpliread.azurewebsites.net/summarize-article/" + id;
    var confirmed;
    var body;

    let formData = new FormData();
    formData.append('title', title);
    formData.append('get_saved_link', true);

    await fetch(api_endpoint, {
      method: 'POST',
      mode: "cors",
      body: formData
    }).then(response => {
      if (response.status === 200) {
        confirmed = true
      }
      else {
        confirmed = false;
      }
      return response.json();
    }).then(data => {
      body = data.body;
    })

    return { body: body, confirmed: confirmed };
  }
  catch {
    return { body: "", confirmed: false }
  }
}