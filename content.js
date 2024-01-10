/**
 * Vine++
 *
 * (c) Daniel Glazman 2024
 *
 * Released under the Mozilla Public Licence 2.0
 */

class VinePlusPlus {
  // id of the search box we're going to add to Vine's UI
  #searchBoxId = "vinePlusPlusSearchBox";
  // placeholder to display in that search box
  // yeah, it should be localized but I'm lazy
  #searchBoxPlaceholder = "Search Vine items";
  // local storage item name
  // we're using local storage for filter persistency across pages and sessions
  #localStorageItem = "vinePlusPlusFilterString";
  // id of the style element we're going to create
  #styleId = "vinePlusPlusStyle";
  // selector matching vine item tiles
  #vineItemSelector = ".vvp-item-tile";
  // selector matching the line containing the "for you", "recommended" and "all items" Vine buttons
  #vineButtonsBoxSelector = ".vvp-items-button-and-search-container";

  /**
   * Constructor
   */
  constructor() {}

  /**
   * InstallUI, installs the search box and tweaks a little bit the markup
   * so the filtering stylesheet works well
   */
  InstallUI() {
    // get the box containing the "for you", "recommended" and "all items" Vine buttons
    const flexingButtonContainer = document.querySelector(this.#vineButtonsBoxSelector);
    if (flexingButtonContainer) { // sanity check
        // create a search box
        const searchBox = document.createElement("input");
        if (searchBox) { // sanity check
            // assign an ID, just in case we need it in the future
            searchBox.id = this.#searchBoxId;
            // assign the input type
            searchBox.type = "search";
            // assign the placeholder
            searchBox.placeholder = this.#searchBoxPlaceholder;

            // add to the box
            flexingButtonContainer.appendChild(searchBox);
            // modify the filter every time the value of the search box is modified
            searchBox.addEventListener("input", (aEvent) => {
                this.ApplyFilter(searchBox.value);
            }, false);
        }

        // for each Vine item, find the span with the full description and set the title
        // attribute onto the enclosing anchor
        document.querySelectorAll("span.a-truncate-full").forEach((aSpan) => {
            aSpan.parentNode.parentNode.setAttribute("title", aSpan.textContent.trim());
        });

        const navigation = document.querySelector("div[role=navigation]:has(ul.a-pagination)");
        if (navigation) {
          const navigationClone = navigation.cloneNode(true);
          const parent = navigation.parentNode;
          parent.insertBefore(navigationClone, parent.firstChild);
        }

        // and finally retrieve - if any - the last filter from the local storage
        chrome.storage.local.get(this.#localStorageItem)
            .then((aResult) => {
                // filter retrieval with sanity checks
                const filterString = aResult ? aResult.vinePlusPlusFilterString || "" : "";
                // set the search box value to that filter
                searchBox.value = filterString;
                // apply the filter
                this.ApplyFilter(filterString, true);
            });
    }
  }

  /**
   * Apply a filtering stylesheet to the Vine items rendered in the page.
   *
   * @param {string} aFilterString - the ws-separated strings to look for
   * @param {boolean} aDontStore - true to avoid storing the filter into the local storage
   * @returns
   */
  ApplyFilter(aFilterString, aDontStore) {
    // do we already have a style element for Vine++ ?
    let myStyle = document.getElementById(this.#styleId);

    if (!aDontStore) { // we're told to store in local storage
      const o = {};
      o[this.#localStorageItem] = aFilterString.trim();
        chrome.storage.local.set(o)
            .then(() => {});
    }

    if (!aFilterString) { // we have no filter
        if (myStyle) { // but we have a style element
            // let's remove it...
            document.head.removeChild(myStyle);
        }
        // and head (pun intended) away
        return;
    }

    // at this point, we have a non-empty non-null filter
    if (!myStyle) { // but no style element...
        // let's create one
        myStyle = document.createElement("style");
        // give it an id we can find later
        myStyle.id = this.#styleId;
        // and append it to the HEAD of the document
        document.head.appendChild(myStyle);
    }

    // now form the stylesheet
    // all your vine items are belong to us, hidden
    let styleContent =  `${this.#vineItemSelector} { display: none; }\n\n`;
    // but those that contain a link whose title element matches the filter
    // are made block again
    styleContent += `${this.#vineItemSelector}`;
    aFilterString.trim().replace(/\s\s+/g, ' ').split(" ").forEach( aFilter => {
        styleContent += `:has(a.a-link-normal[title*='${aFilter}' i])`
    });
    styleContent += " { display: block; }\n";

    // populate the style element with that stylesheet's serialization
    myStyle.textContent = styleContent;
  }
}

// let's rock, baby
(new VinePlusPlus()).InstallUI();
