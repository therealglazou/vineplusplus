console.log("Vine user detected");

function InstallUI() {
    const flexingButtonContainer = document.querySelector(".vvp-items-button-and-search-container");
    if (flexingButtonContainer) {
        const searchBox = document.createElement("input");
        if (searchBox) {
            searchBox.id = "vinePlusPlusSearchBox";
            searchBox.type = "search";
            searchBox.placeholder = "Search Vine items";

            flexingButtonContainer.appendChild(searchBox);
            searchBox.addEventListener("input", (aEvent) => {
                ApplyFilter(searchBox.value);
            }, false);
        }

        document.querySelectorAll("span.a-truncate-full").forEach((aSpan) => {
            console.log("modified");
            aSpan.parentNode.parentNode.setAttribute("title", aSpan.textContent.trim());
        });

        chrome.storage.local.get("vinePlusPlusFilterString")
            .then((aResult) => {
                const filterString = aResult ? aResult.vinePlusPlusFilterString : "";
                searchBox.value = filterString;
                ApplyFilter(filterString, true);
            });
    }
}

function ApplyFilter(aFilterString, aDontStore) {
    let myStyle = document.getElementById("vinePlusPlusStyle");
    if (!aDontStore) {
        chrome.storage.local.set({ "vinePlusPlusFilterString": aFilterString.trim() })
            .then(() => {});
    }

    if (!aFilterString) {
        if (myStyle) {
            document.head.removeChild(myStyle);
        }
        return;
    }

    if (!myStyle) {
        myStyle = document.createElement("style");
        myStyle.id = "vinePlusPlusStyle";
        document.head.appendChild(myStyle);
    }

    let styleContent =  ".vvp-item-tile { display: none; }\n\n";
    styleContent += ".vvp-item-tile";
    aFilterString.trim().replace(/\s\s+/g, ' ').split(" ").forEach( aFilter => {
        styleContent += `:has(a.a-link-normal[title*='${aFilter}' i])`
    });
    styleContent += " { display: block; }\n";

    myStyle.textContent = styleContent;
}

InstallUI();
