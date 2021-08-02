chrome.runtime.onMessage.addListener(
    (request, send, sendResponse) => {
        if (request.page_info != "") {
            console.log("it works")
            var title = request.page_info[0].title;
            var summary = request.page_info[1].summary;
            document.querySelector('.title').innerText = title;
            document.querySelector('.summarized-para').innerText = summary;

            sendResponse();
        }
    }
)