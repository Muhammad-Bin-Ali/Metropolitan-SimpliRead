window.addEventListener('DOMContentLoaded', (event) => {
  $('.loading-animation-wrapper').fadeOut(0);

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
      $('#selected-tab-name').text("");
      $('.loading-animation-wrapper').fadeIn(450);
      chrome.runtime.sendMessage({selected_tab_index: index_of_selected_tab}, (response) => {
        $('.loading-animation-wrapper').fadeOut(450);
      })

      index_of_selected_tab = null;
    }
  })
}
