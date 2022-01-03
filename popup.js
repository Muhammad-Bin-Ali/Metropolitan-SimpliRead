window.addEventListener('DOMContentLoaded', (event) => {
  get_links_from_api(); //retrieving saved links from backend
  $(".loading-animation-wrapper").fadeOut(0); 
  //sends message to background.js to get tab list
  chrome.runtime.sendMessage({tabs_req: ""}, (response) => {
    var tabs = response.tabs_open;
    //looping through all the tabs that are open
    for (let i = 0; i < tabs.length; i++) {
      //adding an Li element to Ul for each tab open
      $("#drop-down-list").append(`<li class="added-tab" id=${tabs[i].id}>${tabs[i].title}</li>`)
    };
    //callback, adding eventlistener to each Li element
    add_listeners_tabs();
    add_event_listener_summarize();
  });
});

//arrow that makes the drop-down list visible
var drop_down_arrow = document.getElementById("drop-arrow");

//adding an event listener to arrow object
var open_list = false; //boolean variable to store if drop-down list is open or not

drop_down_arrow.addEventListener('click', (event) => {
  open_list = !open_list; //changes it to the opposite of what it was before clicking
  $('#drop-down-list').slideToggle(150); 
  rotate_arrow();
})

//function for adding event listeners to individual tab Li elements
var index_of_selected_tab; //stores index of child Li element that is selected by user

function add_listeners_tabs() {
  var tab_drop_down = document.querySelector('ul');
  var li_elems = tab_drop_down.getElementsByClassName('added-tab')

  Array.from(li_elems).forEach(li_tab => {
    li_tab.addEventListener('click', () => {
      $('#drop-down-list').slideUp(150); //if a tab element is selected, close the drop-down list
      rotate_arrow(); //rotate arrow downwards
      $('#selected-tab-name').text(li_tab.innerHTML) //replaces text with text inside the clicked Li tab
      open_list = !open_list; //since drop-down closes, changes the status to opposite of what it was before 
      index_of_selected_tab = Array.prototype.indexOf.call(tab_drop_down.children, li_tab);
    })
  });
}

//function for rotating arrow
function rotate_arrow() {
  drop_down_arrow = document.getElementById("drop-arrow");
  //if it's already rotated upwards
  if (drop_down_arrow.classList.contains('rotate')) {
    drop_down_arrow.classList.remove('rotate')
    drop_down_arrow.classList.add('rotate-reverse')
  }
  //if it's pointing downwards
  else if (drop_down_arrow.classList.contains('rotate-reverse')) {
    drop_down_arrow.classList.remove('rotate-reverse')
    drop_down_arrow.classList.add('rotate')
  }
  //if it's being clicked on for the first time and the arrow has no class
  else {
    drop_down_arrow.classList.add('rotate')
  }
};

//Code for closing drop-down list if clicked outside
var container = $("#drop-down-list");
var drop_arrow_jquery = $('#drop-arrow');

$(document).mouseup(function(e) 
{
  //only perform the more complex conditional if the list is open 
  if (open_list === true) {
    // if the target of the click isn't the container nor a descendant of the container
    if (!container.is(e.target) && container.has(e.target).length === 0
    && !drop_arrow_jquery.is(e.target)) 
    {
        container.slideUp(150);
        rotate_arrow();
        open_list = !open_list;
    }
  }
});

//Code for summarize button
function add_event_listener_summarize() {
  var summarize_button = document.getElementById('summarize');
  var selected_tab = document.getElementById('selected-tab-name');
  
  summarize_button.addEventListener('click', () => {
    if (index_of_selected_tab != null) {
      $('.loading-animation-wrapper').fadeIn(450);

      //getting ID of current window
      chrome.windows.getCurrent({}, (window) => {
        //sending msg to background.js
        console.log(index_of_selected_tab)
        chrome.runtime.sendMessage({selected_tab_index: index_of_selected_tab, current_window: window.id}, (response) => {
          if (response.confirmed) {
            $(".search").hide(); 
            $(".saved-container").hide(); 
            $(".error-message-saved").hide();
            $(".error-message-summarize").hide();
            $(".summarized-article").show(); 
            $(".main-header").show();
            $('#selected-tab-name').text(""); //emptying selected tab
            index_of_selected_tab = null; //reseting value 
            document.querySelector('.article').innerText = response.summary; //puts summary into <p> element
            document.querySelector('.main-header').innerText = response.title; //puts tab title into main header
             //has user already saved this link before?
            if (response.exists) {
              $('#checkbox').prop('checked', true)
            }
            $('.loading-animation-wrapper').fadeOut(450);
            $("#main-content").fadeIn(850);
            }

          else {
            $(".search").hide(); 
            $(".summarized-article").hide(); 
            $(".saved-container").hide(); 
            $(".error-message-saved").hide();
            $(".main-header").show();
            $('#selected-tab-name').text(""); //emptying selected tab
            index_of_selected_tab = null; //reseting value 

            document.querySelector('.main-header').innerText = "Error";
            $(".main-header").fadeIn(350);
            $(".error-message-summarize").fadeIn(350);

            $('.loading-animation-wrapper').fadeOut(450);
          }
        })
      })
    }
  })
}

//function to get saved links and add them to DOM
async function get_links_from_api() {
  await chrome.runtime.sendMessage({get_links: ""}, (response) => {
    if (response.data.status) {
      addListenerIfRetrieveSuccessful();
      var links = response.data.links;
      document.querySelector(".saved-container").innerHTML = "";
      for (var i = 0; i < links.length; i++) {
        $(".saved-container").append(`
        <div class='hover-div'>
        <div class='saved-article-entry'>
          <h3 class='article-name'>${links[i][0]}</h3>
          <h2 class='date'>${links[i][1]}</h2>
        </div>
        </div>`)
      }
      addListenerForSavedLinks();
    }
    else {
      addListenerIfRetrieveIsNotSuccessful();
    }
  })
}

//If book shelf icon is clicked and the retrieval of links is successful
function addListenerIfRetrieveSuccessful() {
  document.querySelector('.book-shelf').removeEventListener('click', displayError)
  document.querySelector('.book-shelf').addEventListener('click', displayLinks)
}

function displayLinks() {
  $('.loading-animation-wrapper').fadeIn(150);
  get_links_from_api().then(() => {
    $(".main-header").hide();
    $(".summarized-article").hide() 
    $("#main-content").hide(); 
    $(".error-message-summarize").hide();
    $(".error-message-saved").hide();
    $(".saved-container").fadeIn(350); 
    $(".search").fadeIn(350); 
    document.querySelector('.main-header').innerText = "Saved Links";
    $('.loading-animation-wrapper').fadeOut(450);
    $(".main-header").fadeIn(350);
  }); 
}

//If book shelf icon is clicked and the retrieval of links is unsuccessful
function addListenerIfRetrieveIsNotSuccessful () {
  document.querySelector('.book-shelf').removeEventListener('click', displayLinks)
  document.querySelector('.book-shelf').addEventListener('click', displayError)
}

function displayError() {
  $('.loading-animation-wrapper').fadeIn(150);
  get_links_from_api().then(() => {
    $(".main-header").hide();
    $(".summarized-article").hide() 
    $("#main-content").hide(); 
    $(".error-message-summarize").hide();
    $(".saved-container").hide(); 
    $(".search").hide(); 
  
    document.querySelector('.main-header').innerText = "Error";
    $('.loading-animation-wrapper').fadeOut(450);
    $(".main-header").fadeIn(350);
    $(".error-message-saved").fadeIn(350);
  });
}

//code for search bar
document.querySelector('.search').addEventListener('keyup', () => {
  var filter = document.querySelector(".search").value;
  var links = document.getElementsByClassName('saved-article-entry');

  for (var i = 0; i < links.length; i++) {
    var title = links[i].querySelector('.article-name').innerText;
    if (links) {
      //if the title of the link does NOT include the filter, then hide it
      if (!(title.toLowerCase()).includes(filter.toLowerCase())) {
        $(".saved-container").children().eq(i).hide();
      }
      else {
        $(".saved-container").children().eq(i).show();
      }
    }
  }
})



document.querySelector("#checkbox").addEventListener("click", () => {
    var like_btn_status = document.getElementById('checkbox').checked;
    
    if (like_btn_status === true) {
      var title = document.querySelector(".main-header").innerText;
      var body = document.querySelector(".article").innerText;
      
      chrome.runtime.sendMessage({save_link: [{title: title, body: body}]}, (response) => {
        var result = response.confirmed;
        if (!result) {
          $('#checkbox').prop('checked', false); // Unchecks the heart icon
        }
        else {
          get_links_from_api() //reload the saved links if the link was saved successfully
        }
      })
    }
    else if (like_btn_status === false) {
      var title = document.querySelector(".main-header").innerText;
      var body = document.querySelector(".article").innerText;
      
      chrome.runtime.sendMessage({del_link: [{title: title, body: body}]}, (response) => {
        var result = response.confirmed;
        if (!result) {
          $('#checkbox').prop('checked', true); // Unchecks the heart icon
        }
        else {
          get_links_from_api() //reload the saved links if the link was saved successfully
        }
      })
    }
})

document.querySelector('.icon-link').addEventListener('click', () => {
  chrome.tabs.create({url: "https://www.instagram.com/metropolitan_mag/?hl=en", active: false})
})
 
//function to add eventlistener to each saved link element
function addListenerForSavedLinks() {
  var elems = document.getElementsByClassName('saved-article-entry')
  Array.from(elems).forEach(elem => {
    elem.addEventListener('click', () => {
      var title = elem.querySelector('.article-name').innerText;
      $('.loading-animation-wrapper').fadeIn(450);

      chrome.runtime.sendMessage({retrieve_saved: title}, (response) => {
        if (response.confirmed) {
          var body = response.body;
          $(".search").hide(); 
          $(".saved-container").hide(); 
          $(".summarized-article").show(); 
          document.querySelector('.article').innerText = body;
          document.querySelector('.main-header').innerText = title;
          $("#main-content").show(); 
          $('#checkbox').prop('checked', true)
          $('.loading-animation-wrapper').fadeOut(450);
        }
        else {
          $(".search").hide(); 
          $(".saved-container").hide(); 
          document.querySelector('.main-header').innerText = "Error";
          $(".main-header").fadeIn(350);
          $(".error-message-saved").fadeIn(350);
          $('.loading-animation-wrapper').fadeOut(450);
        }
      })
    })
  })
}