/**
 * @class DOM
 * A utility class to simplify some DOM management tasks.
 * @singleton
 */
NGN.DOM = {}

Object.defineProperties(NGN.DOM, {
  /**
   * @method ready
   * Executes code after the DOM is loaded.
   * @param {function} callback
   * The function to call when the DOM is fully loaded.
   */
  ready: NGN.const(function (callback) {
    document.addEventListener('DOMContentLoaded', callback)
  }),

  /**
   * @method destroy
   * Remove a DOM element.
   * @param {HTMLElement|NodeList|String|Array} node
   * Accepts a single `HTMLElement`, a `NodeList`, a CSS selector, or
   * an array of `HTMLElements`/`NodeList`/CSS Selectors.
   */
  destroy: NGN.const(function (element) {
    // Process a CSS selector
    if (typeof element === 'string') {
      let src = element
      element = document.querySelectorAll(element)

      if (element.length === 0) {
        console.warn(`The "${src}" selector did not return any elements.`)
        return
      }
      // Iterate through results and remove each element.
      NGN.slice(element).forEach(this.destroy)
    } else {
      switch (NGN.typeof(element)) {
        case 'array':
          element.forEach(this.destroy)
          return
        case 'nodelist':
          NGN.slice(element).forEach(this.destroy)
          return
        case 'htmlelement':
          element.parentNode.removeChild(element)
          return
        default:
          if (/^html.*element$/.test(NGN.typeof(element))) {
            element.parentNode.removeChild(element)
            return
          }
          console.warn('An unknown error occurred while trying to remove DOM elements.')
          console.log('Unknown Element', element)
      }
    }
  }),

  /**
   * @method guarantee
   * This method executes a callback function when it recognizes
   * the insertion of a DOM element within the parent. It is a good way to
   * guarantee a new DOM element exists before doing anything (such as
   * adding an event listener). This method is not always necessary, but it is
   * extremely handy when importing remote HTML templates over less than
   * reliable connections, or when the remote code differs from expectations.
   *
   * **Notice** that #guaranteeDirectChild is a more efficient way to assure
   * a _direct child_ exists within a parent (as opposed to being nested within
   * another child element), because it will not check the subtree.
   *
   * Functionally, this differs from Promises and script loaders. An optimized
   * mutation observer monitors the parent element for insertion of a child element.
   * The mutation observer will not trigger a response until an element actually
   * exists in the DOM. When the mutation observer recognizes a new element,
   * the element is compared to the selector element. If the selector does
   * **not** match the new element, nothing happens. If the selector **matches**
   * the new element, the callback is triggered and the mutation observer
   * is removed.
   *
   * **Example**
   *
   * ```js
   * NGN.DOM.guarantee(document, '#myButton', function (err, element) {
   *   if (err) {
   *     throw err
   *   }
   *
   *   element.addEventListener('click', function (e) {
   *     console.log('Button Clicked')
   *   })
   * })
   *
   * setTimeout (function () {
   *   document.insertAdjacentHTML('beforeend', '<button id="myButton">Click Me</button>')
   * }, 2000)
   * ```
   *
   * In this example, a new button is added to the DOM two seconds after the page
   * renders. The guarantee monitors the `document` for an HTMLElement that matches
   * `document.querySelector('#myButton')`. Once the element is recognized,
   * an event listener is applied to the element.
   *
   * The net result of this is a button will appear on the page. When a user clicks
   * the button, it will say `Button Clicked` in the console.
   *
   * **This method is not capable of detecting** `#TEXT` **nodes**. In other words,
   * it must be a valid HTML tag (including custom elements or instances of `HTMLElement`).
   * @param {HTMLElement|String} parent
   * This DOM element will be monitored for changes. **Only direct child nodes
   * within this element will trigger the callback**. This parameter may be a
   * real DOM element or a CSS selector.
   * @param {String} selector
   * This selector is used to match the new element. This may also be the
   * string-representation of the HTML, such as `<div>my content</div>`.
   * @param {Number} [timeout]
   * Optionally set a timeout (milliseconds). If the new method is not recognized
   * within this time, the callback will be triggered with an error.
   * @param {Function} callback
   * The method executed when the DOM element is guaranteed to exist.
   * This method receives two arguments. The first is an error, which will be
   * `null` if everything works. The second argument is a reference to the
   * new element (an HTMLElement).
   */
  guarantee: NGN.public((parent, selector, timeout, callback) => {
    NGN.DOM.guaranteeElement(true, parent, selector, timeout, callback)
  }),

  /**
   * @method guaranteeDirectChild
   * This is functionally the same as #guarantee, but restricts monitoring
   * to the direct children of the parent element.
   * @param {HTMLElement|String} parent
   * This DOM element will be monitored for changes. **Only direct child nodes
   * within this element will trigger the callback**. This parameter may be a
   * real DOM element or a CSS selector.
   * @param {String} selector
   * This selector is used to match the new element. This may also be the
   * string-representation of the HTML, such as `<div>my content</div>`.
   * @param {Number} [timeout]
   * Optionally set a timeout (milliseconds). If the new method is not recognized
   * within this time, the callback will be triggered with an error.
   * @param {Function} callback
   * The method executed when the DOM element is guaranteed to exist.
   * This method receives two arguments. The first is an error, which will be
   * `null` if everything works. The second argument is a reference to the
   * new element (an HTMLElement).
  */
  guaranteeDirectChild: NGN.public((parent, selector, timeout, callback) => {
    NGN.DOM.guaranteeElement(false, parent, selector, timeout, callback)
  }),

  // The private implementation of the guarantee methods.
  guaranteeElement: NGN.private((tree, parent, selector, timeout, callback) => {
    if (NGN.isFn(timeout)) {
      callback = timeout
      timeout = null
    }

    if (typeof parent === 'string') {
      parent = document.querySelector(NGN.DOM.normalizeSelector(parent))
    }

    if (selector.indexOf('<') >= 0) {
      selector = NGN.DOM.expandVoidHTMLTags(selector).toString().trim().toUpperCase()
    } else {
      selector = NGN.DOM.normalizeSelector(selector)
    }

    // If the element already exists, immediately respond.
    if (typeof selector === 'string') {
      if (selector.indexOf('<') >= 0) {
        // Identify the type of matching node
        let nodeType = /<(\w+).*>/i.exec(selector)

        // If the node type cannot be determine, throw an error.
        if (!nodeType) {
          return callback(new Error('Invalid selector.'))
        }

        nodeType = nodeType[1].toUpperCase()

        // Create a DOM Node filter
        let filter = (node) => {
          if (node.nodeName === nodeType) {
            return NodeFilter.FILTER_ACCEPT
          } else if (node.hasChildNodes()) {
            return NodeFilter.FILTER_SKIP
          }

          return NodeFilter.FILTER_REJECT
        }

        selector = selector.toUpperCase()

        // This horrible monstrosity of try/catch is here to support IE11, which
        // is the only browser that requires a function instead of an object
        // for a TreeWalker filter.
        let walker
        try {
          // Filter the Node tree walker results to the node type of the matched element.
          walker = document.createTreeWalker(parent, NodeFilter.SHOW_ELEMENT, { acceptNode: filter }, false)

          // Walk the filtered DOM tree, searching for a match.
          while (walker.nextNode()) {
            let reviewNode = NGN.DOM.expandVoidHTMLTags(walker.currentNode.outerHTML.toString().trim()).toUpperCase()

            if (reviewNode === selector) {
              // If the element exists, short-circuit the process & run the callback.
              return callback(null, walker.currentNode)
            }
          }
        } catch (e) {
          // Filter the Node tree walker results to the node type of the matched element.
          walker = document.createTreeWalker(parent, NodeFilter.SHOW_ELEMENT, filter, false)

          // Walk the filtered DOM tree, searching for a match.
          while (walker.nextNode()) {
            let reviewNode = NGN.DOM.expandVoidHTMLTags(walker.currentNode.outerHTML.toString().trim()).toUpperCase()

            if (reviewNode === selector) {
              // If the element exists, short-circuit the process & run the callback.
              return callback(null, walker.currentNode)
            }
          }
        }
      } else {
        // If the selector is a string, try to compare a query selector to the new child.
        // The try catch block prevents browser false-positives with escaped CSS
        // selector sequences.
        try {
          let currentNode = document.querySelector(`${NGN.DOM.getElementSelector(parent)} ${selector}`)

          if (currentNode && currentNode instanceof HTMLElement) {
            return callback(null, currentNode)
          }
        } catch (e) {}
      }
    }

    let match = (node) => {
      clearTimeout(timeout)
      observer.disconnect()
      callback(null, node)
    }

    // Create Mutation Observer
    let observer = new MutationObserver((mutations) => {
      // Iterate through mutations
      for (let mutation in mutations) {
        // Only check child node modifications
        if (mutations[mutation].type === 'childList') {
          // Only check nodes inserted directly into the parent
          for (let node = 0; node < mutations[mutation].addedNodes.length; node++) {
            let currentNode = mutations[mutation].addedNodes[node]
            if (currentNode.nodeName.toUpperCase() !== '#TEXT') {
              if (typeof selector === 'string') {
                try {
                  // If the selector is a string, try to compare a query selector to the new child.
                  if (document.querySelector(`${NGN.DOM.getElementSelector(parent)} ${selector}`) === currentNode) {
                    return match(currentNode)
                  }
                } catch (e) {
                  // If the selector is a string but throws an invalid query selector error,
                  // it is most likely a document fragment or text representation of an HTMLElement.
                  // In this case, compare the new child node's outerHTML to the selector for a match.
                  let addedItem = NGN.DOM.expandVoidHTMLTags(currentNode.outerHTML.toString().trim()).toUpperCase()

                  if (selector === addedItem) {
                    return match(currentNode)
                  }
                }
              }
            }
          }
        }
      }
    })

    // Apply the observer to the parent element.
    observer.observe(parent, {
      childList: true,
      subtree: tree
    })

    // If a timeout is specified, begin timing.
    if (timeout !== null && typeof timeout === 'number') {
      timeout = setTimeout(() => {
        observer.disconnect()
        callback(new Error('Guarantee timed out while waiting for ' + selector))
      }, timeout)
    }
  }),

  expandVoidHTMLTags: NGN.private((content) => {
    content = NGN.coalesce(content, '')

    // Regex Parsers
    let voidTags = /<[^>]*\/>/gi
    let tagName = /<([^\s\/\\]+)/i // eslint-disable-line no-useless-escape
    let code = voidTags.exec(content)

    while (code !== null) {
      let tag = tagName.exec(code[0])[1]

      while (content.indexOf(code[0]) !== -1) {
        content = content.replace(code[0], code[0].substr(0, code[0].length - 2) + '></' + tag + '>')
      }

      code = voidTags.exec(content)
    }

    // Strip any XMLNS applied by IE
    return content
      .replace(/\sXMLNS=".+?"/gi, '').replace(/\s{2,100}/gi, ' ')
      .replace(/\s{1,1000}>/gi, '>')
      .replace(/>\s{1,1000}</gi, '><')
  }),

  /**
   * @method findParent
   * Find a distant parent of a DOM element. This can be thought
   * of as a reverse CSS selector that traverses UP the DOM chain
   * to find the parent element.
   *
   * For example:
   *
   * Assume the following HTML structure & JS code:
   *
   * ```html
   * <section>
   *   <header class="MyGroup">
   *     <div>
   *       <div>
   *         <button>Delete Entire Group</button>
   *       </div>
   *     </div>
   *   </header>
   * </section>
   * ```
   *
   * ```js
   * ref.find('button.remove').addEventListener('click', function (event) {
   *   event.preventDefault()
   *   let removeButton = event.currentTarget
   *   let group = ref.findParent(removeButton,'header')
   *   ref.destroy(group)
   * })
   * ```
   *
   * The code above listens for a click on the button. When the button
   * is clicked, the `findPerent` method recognizes the "Delete Entire Group"
   * button and traverses UP the DOM chain until it finds a `header` DOM
   * element. The `header` DOM element is returned (as `group` letiable). The
   * group is then removed using the `ref.destroy` method.
   *
   * Alternatively, the same effect could have been achieved if line 4
   * of the JS code was:
   * ```js
   * let group = ref.findParent(removeButton, '.MyGroup')
   * ```
   * @param {HTMLElement|String} element
   * The DOM element or a CSS selector string identifying the
   * element whose parent should be found.
   * @param {String} selector
   * A minimal CSS selector used to identify the parent.
   * @param {Number} maxDepth
   * The maximum number of elements to traverse. This can be used to
   * cap a selector and force it to fail before reaching a known limit.
   * By default, there is no limit (i.e. maxDepth=null).
   * @returns {HTMLElement}
   * Responds with the DOM Element, or `null` if none was found.
   */
  findParent: NGN.const(function (node, selector, maxDepth) {
    if (typeof node === 'string') {
      node = document.querySelectorAll(node)
      if (node.length === 0) {
        console.warn(`"${node}" is an invalid CSS selector (Does not identify any DOM elements).`)
        return null
      }
      node = node[0]
    }

    let currentNode = node.parentNode
    let i = 0
    maxDepth = typeof maxDepth === 'number' ? maxDepth : -1

    while (currentNode.parentNode.querySelector(selector) === null && currentNode.nodeName !== 'BODY') {
      i++
      if (maxDepth > 0 && i > maxDepth) {
        return null
      }
      currentNode = currentNode.parentNode
    }

    return currentNode
  }),

  /**
   * @method indexOfParent
   * Returns the zero-based index of the DOM element related
   * to its parent element.
   * For example:
   *
   * `html
   * <div>
   *   <p>...</p>
   *   <p>...</p>
   *   <button id="btn"></button>
   *   <p>...</p>
   * </div>
   * ```
   *
   * ```js
   * let i = NGN.DOM.indexOfParent(document.getElementById('btn'))
   * console.log(i) // 2
   * ```
   * @param {HTMLElement} el
   * The reference element.
   * @returns {number}
   */
  indexOfParent: NGN.const(function (element) {
    return NGN.slice(element.parentNode.children).indexOf(element)
  }),

  /**
   * @method getElementSelector
   * Retrieves a unique CSS selector that uniquely identifies the element
   * within the specified element. This can be thought of as a reverse selector.
   * @param {HTMLElement} element
   * The element whose selctor should be retrieved.
   * @param {HTMLElement} [parent=document.body]
   * The optional parent to look within. If unspecified, the
   * document body will be used.
   * @returns {string}
   * The CSS selector string.
   */
  getElementSelector: NGN.public(function (element, parent) {
    if (!(element instanceof HTMLElement)) {
      throw new Error('Element is not a valid HTML element')
    }

    parent = NGN.coalesce(parent, document.body)

    if (!(parent instanceof HTMLElement)) {
      if (typeof parent === 'string') {
        parent = document.querySelector(parent)
        return this.getElementSelector(element, parent)
      }

      console.warn('Parent element of selector is not a valid DOM element. Using %cdocument.body%c instead.', NGN.css, 'font-weight: normal;', NGN.css)
      parent = document.body
    }

    // If an ID exists, use it (normalized)
    if (element.hasAttribute('id')) {
      return this.normalizeSelector('#' + element.getAttribute('id'))
    }

    let selector = []

    while (element !== parent) {
      if (element.hasAttribute('id')) {
        selector.unshift(`#${element.getAttribute('id')}`)
        return selector.join(' > ')
      } else {
        selector.unshift(`${element.nodeName.toLowerCase()}:nth-child(${this.indexOfParent(element) + 1})`)
        element = element.parentNode
      }
    }

    return this.normalizeSelector(selector.join(' > '))
  }),

  /**
   * @method normalizeSelector
   * Normalize the selector path by finding the last ID and returning the
   * selector chain from that ID. This will also escape the selector if necessary.
   * @param {string} selector
   * The selector to normalize.
   * @returns {string}
   * @private
   */
  normalizeSelector: NGN.private((selector = '') => {
    if (selector.indexOf('#') >= 0) {
      selector = `#${selector.split('#').pop()}`.toString()
    }

    return NGN.DOM.escapeCssSelector(selector)
  }),

  /**
   * @method escapeCssSelector
   * CSS selectors must adhere to specific
   * [rules](https://www.w3.org/International/questions/qa-escapes#cssescapes).
   * This helper method escapes CSS selectors for programmatic application.
   *
   * At present moment, this will only escape ID's that start with a number.
   * For example, one practice is to generate UUID values to represent unique
   * elements, such as `07804fc1-40ac-4428-aad5-6701ff7d16da`. Common sense says
   * this CSS selector would look like `#07804fc1-40ac-4428-aad5-6701ff7d16da`,
   * but this is invalid. CSS selectors cannot contain a hash (#) followed by
   * a digit. This must be escaped to `#\\30 7804fc1-40ac-4428-aad5-6701ff7d16da`.
   * The `NGN.DOM.escapeCssSelector` method will automatically escape these.
   *
   * **Need something else?** If you need to support a different kind of escape
   * pattern and cannot use [CSS.escape](https://developer.mozilla.org/en-US/docs/Web/API/CSS/escape),
   * please ask or submit a pull request with the added functionality.
   */
  escapeCssSelector: NGN.public(function (selector) {
    let re = /\#[0-9]/g // eslint-disable-line no-useless-escape
    let match = re.exec(selector)

    // Loop through tokens to replace invalid selectors
    while (match) {
      let token = match[0].replace('#', '')
      selector = selector.replace(match[0], `#\\\\3${token} `)
      match = re.exec(selector)
    }

    return selector
  }),

  /**
   * @method getCommonAncestorDetail
   * Retrieve the least common ancestor of a collection of DOM elements, including
   * gap analysis. A gap analysis identifies distances between the ancestor and
   * nodes (measured in how many nodes exist between them).
   * @param {NodeList|Array} nodes
   * The DOM nodes to find a common ancestor for.
   * @returns {Object}
   * Returns an object with statistics and the common ancestor:
   *
   * ```js
   * {
   *   element: <HTMLElement>,
   *   gap: {
   *     min: 0,
   *     max: 10,
   *     average: 3,
   *     median: 5
   *   }
   * }
   * ```
   *
   * The element is the common ancestor. The gap `min` represents the shortest
   * distance between the ancestor and one of the nodes. In this example, `0`
   * means at least one node is a direct child of the ancestor. The gap `max`
   * represents the largest distance between the ancestor element and one of the
   * child nodes. The `average` represents a basic statistical average and
   * median represents a midpoint.
   */
  getCommonAncestor: NGN.const(function (nodes) {
    return this.getCommonAncestorDetail(nodes).element
  }),

  getCommonAncestorDetail: NGN.const(function (nodes) {
    nodes = NGN.slice(nodes)

    if (nodes.length === 1) {
      return nodes[0]
    }

    // For more advanced DOM structures (deeply nested, multiple trees),
    // retrieve the selectors for each element and attempt to find the
    // least common ancestor. Retrieve a sorted tree of selectors ranging
    // from the least specific to the most specific.
    let selectors = nodes.map((node) => {
      let selectorList = NGN.DOM.getElementSelector(node).split(' > ')
      selectorList.pop()
      return selectorList
    }).sort((a, b) => {
      if (a.length < b.length) {
        return -1
      } else if (a.length > b.length) {
        return 1
      }

      return 0
    })

    let ancestors = []
    let gaps = []

    while (selectors.length > 0) {
      let currentScope = []

      // Find the next nearest root for each element and add the partial
      // selector text that is unique to the selector.
      for (let i = 0; i < selectors.length; i++) {
        let scope = selectors[i].shift()

        if (selectors[i].length === 0) {
          gaps.push(0)
        }

        currentScope.push(scope)
      }

      currentScope = NGN.dedupe(currentScope)

      // If there is only one scope, it is shared by all elements
      // and processing should continue.
      if (currentScope.length === 1 && selectors.length === nodes.length) {
        ancestors.push(currentScope.shift())
        selectors = selectors.filter((selector) => {
          return selector.length > 0
        })
      } else {
        gaps = gaps.concat(selectors.filter((selector) => {
          return selector.length > 0
        }).map((selector) => {
          return selector.length
        }))

        // If there are multiple scopes (or none left),
        // the common ancestor has been found.
        selectors = []
      }
    }

    ancestors = ancestors.join(' > ')

    let total = 0
    gaps.forEach((gap) => {
      total += gap
    })

    return {
      element: document.querySelector(ancestors),
      gap: {
        min: Math.min.apply(this, gaps),
        max: Math.max.apply(this, gaps),
        average: Math.ceil(total / gaps.length),
        median: gaps[Math.ceil(gaps.length / 2) - 1]
      }
    }
  })
})
