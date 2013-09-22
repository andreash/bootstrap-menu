/**
 * Active Menu Node Class
 *
 * @param menuInstance
 * @param parentNode
 * @constructor
 */
var ActiveMenuNode = module.exports = function(menuInstance, parentNode) {

    /**
     * Parent Node
     * @type {ActiveMenu | ActiveMenuNode}
     */
    this.parent = parentNode;

    /**
     * Menu Instance
     * @type {ActiveMenu}
     */
    this.menuInstance = menuInstance;

    /**
     * Display Text
     * @type {String}
     */
    this.text = null;

    /**
     * Route
     * @type {String}
     */
    this.route = null;

    /**
     * Element Type
     * @type {string}
     */
    this.elementType = 'ul';

    /**
     * Children Nodes
     * @type {ActiveMenuNode[]}
     */
    this.childNodes = [];

    /**
     * HTML Attributes
     * @type {Array}
     */
    this.htmlAttributes = [];

    /**
     * Menu Level / Depth
     * @type {number}
     */
    this.depth = parentNode.depth + 1;

    /**
     * Whether This Node is Active
     * @type {boolean}
     */
    this.isActive = false;

    /**
     * Whether This Node is First In The Current Level
     * @type {boolean}
     */
    this.isFirst = false;

    /**
     * Whether This Node is Last In The Current Level
     * @type {boolean}
     */
    this.isLast = false;
};

/**
 * Set HTML Attributes
 *
 * @param attributes
 * @returns {ActiveMenuNode}
 */
ActiveMenuNode.prototype.setAttributes = function(attributes) {
    this.htmlAttributes = attributes;
    return this;
};

/**
 * Check If This Node Is a List
 *
 * @returns {boolean}
 */
ActiveMenuNode.prototype.isList = function() {
    return this.elementType == 'ul';
};

/**
 * Check If This Node is a Parent
 */
ActiveMenuNode.prototype.isParent = function() {
    return this.childNodes.length > 0;
};

/**
 * Add a Child Node to This Node
 *
 * @param text
 * @param route
 * @returns {ActiveMenuNode}
 */
ActiveMenuNode.prototype.addMenuNode = function(text, route) {
    var newNode = new ActiveMenuNode(this.menuInstance, this);
    newNode.text = text;
    newNode.route = route;
    if (this.isList()) {
        newNode.elementType = 'li';
    }
    this.childNodes.push(newNode);
    return newNode;
};

/**
 * Activate This Branch of the Menu Tree.
 *
 * Iterates up the parents of this node, activating them
 * by appending a class of 'active-node' to their list element.
 */
ActiveMenuNode.prototype.activateBranch = function() {
    this.isActive = true;
    // Stop At The Top of The Branch
    if (typeof this.parent == this.constructor.name) {
        this.parent.activateBranch();
    }
};

/**
 * Get The Render-able HTML Attributes
 *
 * @returns {Array}
 */
ActiveMenuNode.prototype.getRenderHtmlAttributes = function() {

    // Attributes
    var htmlAttributes = [];

    // Get Class Array
    var htmlClassArray = [];

    // Handle Active State
    if (this.isActive) {
        // If Classes Are Already Defined, We Need to Append Rather Than Replace
        if (this.htmlAttributes.hasOwnProperty('class')) {
            htmlClassArray = this.htmlAttributes.class.split(' ');
        }
        htmlClassArray.push('active-node');
    }

    // Handle Depth
    var depth;
    if (this.isList()) {
        depth = this.depth - 1;
    } else {
        depth = this.depth;
    }
    htmlClassArray.push('level-' + depth);

    // Handle Case of Being Only Child, Then First, Then Last
    if (this.isFirst && this.isLast) {
        htmlClassArray.push('only');
    } else if (this.isFirst) {
        htmlClassArray.push('first');
    } else if (this.isLast) {
        htmlClassArray.push('last');
    }

    // Handle Case of Being A Parent
    if (this.isParent()) {
        htmlClassArray.push('parent');
    }

    // Join Class List
    htmlAttributes.class = htmlClassArray.join(' ');

    // Return
    return htmlAttributes;
};

/**
 * Generate The Inner HTML For This Node
 * @returns {String}
 */
ActiveMenuNode.prototype.getInnerHtml = function() {
    // Check There's Inner Html to Return
    if (!this.text) {
        return String();
    }

    // Inner Element Type
    var elementType;
    if (this.route) {
        elementType = "a";
    } else {
        elementType = "span";
    }

    // Html Attributes
    var htmlAttributes = [];
    htmlAttributes.href = this.route;

    // Check Current Route
    if (this.route == this.menuInstance.getCurrentRequestRoute()) {
        // Add Active Link Class to Link
        htmlAttributes.class = 'active-link';
        // Activate Parents
        this.activateBranch();
    }

    // Inner Html
    var innerHtml = this.menuInstance.generator[elementType](
        htmlAttributes,
        this.text
    );

    // Compile and Return
    return innerHtml.compile();
};

/**
 * Generate the HTML for this Node
 * @returns {String}
 */
ActiveMenuNode.prototype.toHtml = function() {
    // New HTML Tree
    var elementInnerHtml = [];

    // Set To Inactive (Prevents Caching of Active State on Nodes That Aren't Cached)
    this.isActive = false;

    // Inner Html
    elementInnerHtml.push(this.getInnerHtml());

    // Node List for Reference Below
    var nodeList = this.childNodes;

    // Render Children Source
    this.childNodes.forEach(function(childNode, key) {
        // Handle First and Last
        if (key == 0) {
            childNode.isFirst = true;
        }
        if (key == (nodeList.length - 1)) {
            childNode.isLast = true;
        }
        // Append
        elementInnerHtml.push(childNode.toHtml());
    });

    // Render
    var elementHtml = this.menuInstance.generator[this.elementType](
        this.getRenderHtmlAttributes(),
        elementInnerHtml
    );

    // Compile and Return
    return elementHtml.compile();
};