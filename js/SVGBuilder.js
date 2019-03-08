/* class SVGElement ***************************************************************************************************************************/

class SVGElement {
  // Base class for all svg elements
  constructor() {}

  createElement(elementName, attr, nodeValue) {
    this.element = document.createElementNS("http://www.w3.org/2000/svg", elementName);
    this.setAttributes(attr);
    this.setValue(nodeValue);
    return this.element;
  }

  setAttributes(attr) {
    if (!attr) attr = {};
    if (!this.attrList) return;
    this.attrList.forEach((attrName) => {
      if (attrName in attr) {
        var attrValue = attr[attrName];
        if (attrValue === null) {
          this.element.removeAttribute(attrName);
          return;
        }
        if (typeof(attrValue) === 'function') {
          this.element[attrName] = attrValue;
          return;
        }
        this.element.setAttribute(attrName, attrValue);
      }
    });
  }

  setValue(nodeValue) {
    if (nodeValue !== undefined) this.element.innerHTML = nodeValue;
  }

  init(elementName, attr, attrList, nodeValue) {
    if (!attrList) attrList = [];
    this.attrList = attrList;
    if (elementName === undefined) return;
    this.createElement(elementName, attr, nodeValue);
  }

  insert(container, wipe) {
    if (wipe) {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    }
    container.appendChild(this.element);
  }

  remove() {
    this.element.parentNode.removeChild(this.element);
  }


  clone() {
    if (!this.element) return null;
    var c = new this.constructor();
    c.element = this.element.cloneNode();
    return c;
  }

  wrap(targetNode) {
    this.element = targetNode;
  }

  getTransform(template) {
    if (!this.transform) this.transform = new SVGTransform(this.element, template);
    return this.transform;
  }

  translate(x, y) {
    var t = this.getTransform("TRS"); // Tranlate+Rotate+Scale
    if (t.template == "TRS") {
      t.list[0].params = [x, y];
      t.apply();
    }
  }

  rotate(angle, cx, cy) {
    if (typeof cx == "undefined") cx = 0;
    if (typeof cy == "undefined") cy = 0;
    var t = this.getTransform("TRS");
    if (t.template == "TRS") {
      t.list[1].params = [angle, cx, cy];
      t.apply();
    }
  }

  scale(sx, sy) {
    var t = this.getTransform("TRS");
    if (t.template == "TRS") {
      t.list[2].params = [sx, sy];
      t.apply();
    }
  }
}

/* class SVGTransform *********************************************************************************************************************/

class SVGTransform {
  constructor(targetNode, template) {
    this.targetNode = targetNode;
    this.list = []; // List of transform definitions
    switch (template) {
      case "TRS":
        this.addDefinition("translate", [0, 0]);
        this.addDefinition("rotate", [0, 0, 0]);
        this.addDefinition("scale", [1, 1]);
        break;
    }
    this.template = template ? template : null;
  }

  addDefinition(fn, params, apply) {
    if (this.template) return;
    if (!["matrix", "translate", "scale", "rotate", "skewX", "skewY"].includes(fn)) return;
    this.list.push({
      fn    : fn,
      params: params
    });
    if (apply) this.apply();
  }

  clear(apply) {
    this.list = [];
    this.template = null;
    if (apply) this.apply();
  }

  apply() {
    var transformList = [];
    this.list.forEach(function(definition) {
      transformList.push(definition.fn + "(" + definition.params.join(" ") + ")");
    });
    this.targetNode.setAttribute("transform", transformList.join(" "));
  }
}

/* class SVGRect **************************************************************************************************************************/

class SVGRect extends SVGElement {
  constructor(attr) {
    super();
    this.init("rect", attr, ["id", "style", "class", "x", "y", "width", "height", "rx", "ry", "fill", "stroke", "stroke-width", "opacity", "fill-opacity", "stroke-opacity", "onclick"]);
  }
}

/* class SVGCircle ************************************************************************************************************************/

class SVGCircle extends SVGElement {
  constructor(attr) {
    super();
    this.init("circle", attr, ["id", "style", "class", "cx", "cy", "r", "fill", "stroke", "stroke-width", "opacity", "fill-opacity", "stroke-opacity", "onclick"]);
  }
}

/* class SVGEllipse ***********************************************************************************************************************/

class SVGEllipse extends SVGElement {
  constructor(attr) {
    super();
    this.init("ellipse", attr, ["id", "style", "class", "cx", "cy", "rx", "ry", "fill", "stroke", "stroke-width", "opacity", "fill-opacity", "stroke-opacity", "onclick"]);
  }
}

/* class SVGLine **************************************************************************************************************************/

class SVGLine extends SVGElement {
  constructor(attr) {
    super();
    this.init("line", attr, ["id", "style", "class", "x1", "y1", "x2", "y2", "stroke", "stroke-width", "opacity", "fill-opacity", "stroke-opacity", "onclick"]);
  }
}

/* class SVGPolyline **********************************************************************************************************************/

class SVGPolyline extends SVGElement {
  constructor(attr, points) {
    super();
    this.init("polyline", attr, ["id", "style", "class", "fill", "stroke", "stroke-width", "opacity", "fill-opacity", "stroke-opacity", "onclick"]);
    this.points = (typeof points == "undefined") ? [] : points;
    this.update();
  }

  addPoint(pointData) {
    // pointData: an object with x and y properties
    this.points.push(pointData);
  }

  update() {
    var pointsAttr = this.points.map((pointData) => {
      var x = ("x" in pointData) ? pointData.x : 0;
      var y = ("y" in pointData) ? pointData.y : 0;
      return x + " " + y;
    }).join(" ");
    this.element.setAttribute("points", pointsAttr);
  }

  clone() {
    var c = super.clone();
    c.points = this.points.slice();
    return c;
  }

  wrap(targetNode) {
    super.wrap(targetNode);
    // TODO: parse the "points" attribute 
  }
}

/* class SVGPolygon ***********************************************************************************************************************/

class SVGPolygon extends SVGPolyline {
  constructor(attr, points) {
    super();
    this.init("polygon", attr, ["id", "style", "class", "fill", "stroke", "stroke-width", "opacity", "fill-opacity", "stroke-opacity", "onclick"]);
    this.points = (typeof points == "undefined") ? [] : points;
    this.update();
  }
}

/* class SVGPath **************************************************************************************************************************/

// Reference: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths

class SVGPath extends SVGElement  {
  constructor(attr, points) {
    super();
    this.init("path", attr, ["id", "style", "class", "fill", "stroke", "stroke-width", "opacity", "fill-opacity", "stroke-opacity", "onclick"]);
    this.points = (typeof points == "undefined") ? [] : points;
    this.update();
  }

  addPoint(pointData) {
    // pointData: an object with properties
    var point;
    if (pointData.cmd == "M") {
      // Move to, absolute coordinates. Parameters: x, y
      point = {
        cmd: "M",
        x  : ("x" in pointData) ? pointData.x : 0,
        y  : ("y" in pointData) ? pointData.y : 0
      }
    } else if (pointData.cmd == "m") {
      // Move to, relative coordinates. Parameters: dx, dy
      point = {
        cmd: "m",
        dx : ("dx" in pointData) ? pointData.dx : 0,
        dy : ("dy" in pointData) ? pointData.dy : 0
      }
    } else if (pointData.cmd == "L") {
      // Line to, absolute coordinates. Parameters: x, y
      point = {
        cmd: "L",
        x  : ("x" in pointData) ? pointData.x : 0,
        y  : ("y" in pointData) ? pointData.y : 0
      }
    } else if (pointData.cmd == "l") {
      // Line to, relative coordinates. Parameters: dx, dy
      point = {
        cmd: "l",
        dx : ("dx" in pointData) ? pointData.dx : 0,
        dy : ("dy" in pointData) ? pointData.dy : 0
      }
    } else if (pointData.cmd == "H") {
      // Horizontal line to, absolute coordinates. Parameters: x
      point = {
        cmd: "H",
        x  : ("x" in pointData) ? pointData.x : 0
      }
    } else if (pointData.cmd == "h") {
      // Horizontal line to, relative coordinates. Parameters: dx
      point = {
        cmd: "h",
        dx : ("dx" in pointData) ? pointData.dx : 0
      }
    } else if (pointData.cmd == "V") {
      // Vertical line to, absolute coordinates. Parameters: y
      point = {
        cmd: "V",
        y  : ("y" in pointData) ? pointData.y : 0
      }
    } else if (pointData.cmd == "v") {
      // Vertical line to, relative coordinates. Parameters: dy
      point = {
        cmd: "v",
        dy : ("dy" in pointData) ? pointData.dy : 0
      }
    } else if (pointData.cmd == "C") {
      // Cubic bezier curve to, absolute coordinates. Parameters: x1, y1, x2, y2, x, y
      point = {
        cmd: "C",
        x1 : ("x1" in pointData) ? pointData.x1 : 0,
        y1 : ("y1" in pointData) ? pointData.y1 : 0,
        x2 : ("x2" in pointData) ? pointData.x2 : 0,
        y2 : ("y2" in pointData) ? pointData.y2 : 0,
        x  : ("x"  in pointData) ? pointData.x  : 0,
        y  : ("y"  in pointData) ? pointData.y  : 0
      }
    } else if (pointData.cmd == "c") {
      // Cubic bezier curve to, relative coordinates. Parameters: dx1, dy1, dx2, dy2, dx, dy
      point = {
        cmd: "c",
        dx1: ("dx1" in pointData) ? pointData.dx1 : 0,
        dy1: ("dy1" in pointData) ? pointData.dy1 : 0,
        dx2: ("dx2" in pointData) ? pointData.dx2 : 0,
        dy2: ("dy2" in pointData) ? pointData.dy2 : 0,
        dx : ("dx"  in pointData) ? pointData.dx  : 0,
        dy : ("dy"  in pointData) ? pointData.dy  : 0
      }
    } else if (pointData.cmd == "S") {
      // Smooth cubic bezier curve to, absolute coordinates. Parameters: x2, y2, x, y
      point = {
        cmd: "S",
        x2 : ("x2" in pointData) ? pointData.x2 : 0,
        y2 : ("y2" in pointData) ? pointData.y2 : 0,
        x  : ("x"  in pointData) ? pointData.x  : 0,
        y  : ("y"  in pointData) ? pointData.y  : 0
      }
    } else if (pointData.cmd == "s") {
      // Smooth cubic bezier curve to, relative coordinates. Parameters: dx2, dy2, dx, dy
      point = {
        cmd: "s",
        dx2: ("dx2" in pointData) ? pointData.dx2 : 0,
        dy2: ("dy2" in pointData) ? pointData.dy2 : 0,
        dx : ("dx"  in pointData) ? pointData.dx  : 0,
        dy : ("dy"  in pointData) ? pointData.dy  : 0
      }
    } else if (pointData.cmd == "Q") {
      // Quadratic bezier curve to, absolute coordinates. Parameters: x1, y1, x, y
      point = {
        cmd: "Q",
        x1 : ("x1" in pointData) ? pointData.x1 : 0,
        y1 : ("y1" in pointData) ? pointData.y1 : 0,
        x  : ("x"  in pointData) ? pointData.x  : 0,
        y  : ("y"  in pointData) ? pointData.y  : 0
      }
    } else if (pointData.cmd == "q") {
      // Quadratic bezier curve to, relative coordinates. Parameters: dx1, dy1, dx, dy
      point = {
        cmd: "q",
        dx1: ("dx1" in pointData) ? pointData.dx1 : 0,
        dy1: ("dy1" in pointData) ? pointData.dy1 : 0,
        dx : ("dx"  in pointData) ? pointData.dx  : 0,
        dy : ("dy"  in pointData) ? pointData.dy  : 0
      }
    } else if (pointData.cmd == "T") {
      // Smooth quadratic bezier curve to, absolute coordinates. Parameters: x, y
      point = {
        cmd: "T",
        x  : ("x"  in pointData) ? pointData.x  : 0,
        y  : ("y"  in pointData) ? pointData.y  : 0,
      }
    } else if (pointData.cmd == "t") {
      // Smooth quadratic bezier curve to, relative coordinates. Parameters: dx, dy
      point = {
        cmd: "t",
        dx : ("dx"  in pointData) ? pointData.dx  : 0,
        dy : ("dy"  in pointData) ? pointData.dy  : 0
      }
    } else if (pointData.cmd == "A") {
      // Arc to, absolute coordinates. Parameters: rx, ry, angle, large, sweep, x, y
      point = {
        cmd: "A",
        rx   : ("rx"    in pointData) ? pointData.rx    : 0, // ellipse x-radius
        ry   : ("ry"    in pointData) ? pointData.ry    : 0, // ellipse y-radius
        angle: ("angle" in pointData) ? pointData.angle : 0, // x-axis rotation angle
        large: ("large" in pointData) ? pointData.large : 0, // large-arc-flag: 0 for <180 degrees arc, 1 for >180 degrees arc.
        sweep: ("sweep" in pointData) ? pointData.sweep : 0, // sweep-flag: 0 for left-bending arc, 1 for right-bending arc
        x    : ("x"     in pointData) ? pointData.x     : 0, // end-point x
        y    : ("y"     in pointData) ? pointData.y     : 0  // end-point y
      }
    } else if (pointData.cmd == "a") {
      // Arc to, relative coordinates. Parameters: rx, ry, angle, large, sweep, dx, dy
      point = {
        cmd: "a",
        rx   : ("rx"    in pointData) ? pointData.rx    : 0, // ellipse x-radius
        ry   : ("ry"    in pointData) ? pointData.ry    : 0, // ellipse y-radius
        angle: ("angle" in pointData) ? pointData.angle : 0, // x-axis rotation angle
        large: ("large" in pointData) ? pointData.large : 0, // large-arc-flag: 0 for <180 degrees arc, 1 for >180 degrees arc.
        sweep: ("sweep" in pointData) ? pointData.sweep : 0, // sweep-flag: 0 for left-bending arc, 1 for right-bending arc
        dx   : ("dx"    in pointData) ? pointData.dx    : 0, // end-point relative dx
        dy   : ("dy"    in pointData) ? pointData.dy    : 0  // end-point relative dy
      }

    } else if (pointData.cmd == "Z" || pointData.cmd == "z") {
      // Close path. Parameters: none
      point = {
        cmd: "Z"
      }
    }
    this.points.push(point);
  }

  update() {
    var pointsAttr = this.points.map((pointData) => {
      var output = ""
      if (pointData.cmd == "M") {
        output = [pointData.cmd, pointData.x, pointData.y];
      } else if (pointData.cmd == "m") {
        output = [pointData.cmd, pointData.dx, pointData.dy];
      } else if (pointData.cmd == "L") {
        output = [pointData.cmd, pointData.x, pointData.y];
      } else if (pointData.cmd == "l") {
        output = [pointData.cmd, pointData.dx, pointData.dy];
      } else if (pointData.cmd == "H") {
        output = [pointData.cmd, pointData.x];
      } else if (pointData.cmd == "h") {
        output = [pointData.cmd, pointData.dx];
      } else if (pointData.cmd == "V") {
        output = [pointData.cmd, pointData.y];
      } else if (pointData.cmd == "v") {
        output = [pointData.cmd, pointData.dy];
      } else if (pointData.cmd == "C") {
        output = [pointData.cmd, pointData.x1, pointData.y1, pointData.x2, pointData.y2, pointData.x, pointData.y];
      } else if (pointData.cmd == "c") {
        output = [pointData.cmd, pointData.dx1, pointData.dy1, pointData.dx2, pointData.dy2, pointData.dx, pointData.dy];
      } else if (pointData.cmd == "S") {
        output = [pointData.cmd, pointData.x2, pointData.y2, pointData.x, pointData.y];
      } else if (pointData.cmd == "s") {
        output = [pointData.cmd, pointData.dx2, pointData.dy2, pointData.dx, pointData.dy];
      } else if (pointData.cmd == "Q") {
        output = [pointData.cmd, pointData.x1, pointData.y1, pointData.x, pointData.y];
      } else if (pointData.cmd == "q") {
        output = [pointData.cmd, pointData.dx1, pointData.dy1, pointData.dx, pointData.dy];
      } else if (pointData.cmd == "T") {
        output = [pointData.cmd, pointData.x, pointData.y];
      } else if (pointData.cmd == "t") {
        output = [pointData.cmd, pointData.dx, pointData.dy];
      } else if (pointData.cmd == "A") {
        output = [pointData.cmd, pointData.rx, pointData.ry, pointData.angle, pointData.large ? 1 : 0, , pointData.sweep ? 1 : 0, pointData.x, pointData.y];
      } else if (pointData.cmd == "a") {
        output = [pointData.cmd, pointData.rx, pointData.ry, pointData.angle, pointData.large ? 1 : 0, , pointData.sweep ? 1 : 0, pointData.dx, pointData.dy];
      } else if (pointData.cmd == "Z" || pointData.cmd == "z") {
        output = [pointData.cmd];
      }
      return output.join(" ");
    }).join(" ");
    this.element.setAttribute("d", pointsAttr);
  }

  clone() {
    var c = super.clone();
    c.points = this.points.slice();
    return c;
  }

  wrap(targetNode) {
    super.wrap(targetNode);
    // TODO: parse the "d" attribute 
  }
}

/* class SVGText **************************************************************************************************************************/

class SVGText extends SVGElement {
  constructor(attr, value) {
    super();
    this.init("text", attr, ["id", "style", "class", "x", "y", "fill", "opacity", "fill-opacity", "stroke-opacity", "onclick"], value);
  }
}

/* class SVGFile **************************************************************************************************************************/

class SVGFile extends SVGElement {
  constructor(attr, svgURL) {
    super();
    this.attr = attr;
    this.svgURL = svgURL;
    // Note: can't call the init() method because the element does not exist yet! It will be created only when the load() method results in successfully loaded svg document
  }

  load(onLoaded) {
    var self = this;
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4 && xhr.status == 200) {
        self.element = xhr.responseXML.getElementsByTagName('svg')[0];
        self.setAttributes(self.attr);
        if (typeof onLoaded === "function") {
          onLoaded.call(self);
        }
      }
    }
    xhr.open('GET', this.svgURL, true);
    xhr.send(null);
  }

  getElement(id) {
    // Find an element with corresponding id attribute and return a corresponding SVGElement instance
    if (!this.element) return null;

    var node = this.element.querySelector('#' + id);
    if (!node) return null;

    var nodeName = node.nodeName.toLowerCase();
    var svgObject;
    if (nodeName == "rect") {
      svgObject = new SVGRect();
    } else if (nodeName == "circle") {
      svgObject = new SVGCircle();
    } else if (nodeName == "ellipse") {
      svgObject = new SVGEllipse();
    } else if (nodeName == "line") {
      svgObject = new SVGLine();
    } else if (nodeName == "polyline") {
      svgObject = new SVGPolyline();
    } else if (nodeName == "polygon") {
      svgObject = new SVGPolygon();
    } else if (nodeName == "path") {
      svgObject = new SVGPath();
    } else if (nodeName == "text") {
      svgObject = new SVGText();
    } else if (nodeName == "g") {
      svgObject = new SVGGroup();
    } else {
      svgObject = new SVGElement();
    }
    svgObject.wrap(node);
    return svgObject;
  }
}

/* class SVGContainer *************************************************************************************************************************/

class SVGContainer extends SVGElement {
  constructor() {
    // Superclass constructor
    super();
  }

  addRect(attr) {
    // Add new rect element
    console.log("Adding rect element, attr=", attr);
    var svgObject = new SVGRect(attr);
    svgObject.insert(this.element);
    return svgObject;
  }

  addCircle(attr) {
    // Add new circle element
    console.log("Adding circle element, attr=", attr);
    var svgObject = new SVGCircle(attr);
    svgObject.insert(this.element);
    return svgObject;
  }

  addEllipse(attr) {
    // Add new ellipse element
    console.log("Adding ellipse element, attr=", attr);
    var svgObject = new SVGEllipse(attr);
    svgObject.insert(this.element);
    return svgObject;
  }

  addLine(attr) {
    // Add new line element
    console.log("Adding line element, attr=", attr);
    var svgObject = new SVGLine(attr);
    svgObject.insert(this.element);
    return svgObject;
  }

  addPolyline(attr, points) {
    // Add new plolyline element
    console.log("Adding polyline element, attr=", attr, " points=", points);
    var svgObject = new SVGPolyline(attr, points);
    svgObject.insert(this.element);
    return svgObject;
  }

  addPolygon(attr, points) {
    // Add new plolygon element
    console.log("Adding polygon element, attr=", attr, " points=", points);
    var svgObject = new SVGPolygon(attr, points);
    svgObject.insert(this.element);
    return svgObject;
  }

  addPath(attr, points) {
    // Add new plolygon element
    console.log("Adding path element, attr=", attr, " points=", points);
    var svgObject = new SVGPath(attr, points);
    svgObject.insert(this.element);
    return svgObject;
  }

  addText(attr, value) {
    var svgObject = new SVGText(attr, value);
    svgObject.insert(this.element);
    return svgObject;
  }

  addGroup(attr) {
    var svgObject = new SVGGroup(attr);
    svgObject.insert(this.element);
    return svgObject;
  }

  addSVGFile(attr, svgURL, onLoaded) {
    var svgObject = new SVGFile(attr, svgURL);
    var container = this.element;
    svgObject.load(function() {
      this.insert(container);
      onLoaded.call(this);
    });
    return svgObject;
  }
}

/* class SVGBuilder ***********************************************************************************************************************/

class SVGBuilder extends SVGContainer {
  constructor() {
    super();
    this.init("svg");
  }
}

/* class SVGGroup *************************************************************************************************************************/

class SVGGroup extends SVGContainer {
  constructor(attr) {
    super();
    this.init("g", attr, ["id", "style", "class", "fill", "stroke", "stroke-width"]);
  }
}
