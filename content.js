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

  #closeButtonData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAcCAYAAACQ0cTtAAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAABYlAAAWJQFJUiTwAAAAB3RJTUUH6AEKCDohA81lBAAAAsJJREFUSMe9lt9Lk2EUxz9nmzPnRHO2SIJWaBIRoZVIFKiRVjeVBoE3XUh/QaR1EwRepFl/QEbUTV1E0lWgwRL6qQhBUETTfhGmZv5AN51bO120d+ja5qu99MADL897eD6Hc77nPEdUlf+xpHrgoJiBeUTqF2BbDLwxcAFqg6ANRnNgeELVbwqYDrZbpCwAx6OwV0EyXgJRB7yogNvPVGdXBSsQOR2Ckwr2VYUKwgVwd1z1kSmYW+RcGKr+JT9O6Amq3swIc4mcj0ClFYJwQm9QtWvpmc34yBdpsgoEsAh1XpFjf8FKRXbOwwmr5T4NTQdE8pbBPkNDDFDQpB2yw1OFcIp/xp61Q18shU0MnINwJgErESlR2JXKsyzoaYZbHrgKLKQwmdkCV5rhThY8T3VHBPYnYCOwL10YolDZB+5TMOyBa0nAGR+0H4ERPxRFoSJNOTjWi9QA2CJQlg6mUByAliXAzjhw2gft9TDqh6IAtAL5GcRSCiB2uAEUZEq0Db6VQkc1zD2ArXkQqoOxJSDPCsX+JqLa5lBwywqqisHmALQAHY3wCcAsKO6s21CjmJFxDFwxWLdE1i4gx3wnA5tA0ITxZAm018KEH4r6wN0AXzdABxAy4WjQgH03AzoEP+Khu2CIxizQDuMANgd8yGA3lQRqBQqNHCYB59Ndsg4+Atg2wmCGZtqXBPIki8YAOqA/XQVNq/Ymun6WSJvC9hSGP53wZBFqgcI0mR/JgpeLcJQ/olm2HDCwoNqZgHlFyifhotWNWOGXDy4NqwYSjXhc9XU2PLYalg3dBmjZexZU7RJ4axXIAa9CqvdTPp4AEdXLVgDjebpuauDJFTkbhsNrSZMTHoZU761qlPOKlE9BYxqVpmy2xdD9RfXdqudGY/lEdozBniiUKWxSyAVUYC4u+/fFMDikOrTmIdXy8bumv+o33300phxkpOIAAAAASUVORK5CYII=";
  #closeButtonStyle = "width: 16px; position: relative; top: 6px; left: -20px; cursor: pointer";

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
            const div = document.createElement("div");
            flexingButtonContainer.appendChild(div);

            // assign an ID, just in case we need it in the future
            searchBox.id = this.#searchBoxId;
            // assign the input type
            searchBox.type = "search";
            // assign the placeholder
            searchBox.placeholder = this.#searchBoxPlaceholder;

            // add to the box
            div.appendChild(searchBox);
            // modify the filter every time the value of the search box is modified
            searchBox.addEventListener("input", (aEvent) => {
                this.ApplyFilter(searchBox.value);
            }, false);

            const imageButton = document.createElement("img");
            imageButton.src = this.#closeButtonData;
            imageButton.style = this.#closeButtonStyle;
            imageButton.addEventListener("click", (aEvent) => {
                searchBox.value = "";
                this.ApplyFilter("");
            });
            div.appendChild(imageButton);
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
