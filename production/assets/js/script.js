document.addEventListener('DOMContentLoaded', () => {
    new MenuManager();
    new CompassManager();
    new RouteManager();
});

class RouteManager {
    constructor () {
        for (var waypointChanger of document.getElementsByClassName('route-waypoint-changer')) {
            waypointChanger.addEventListener('click', () => {
                setTimeout(this.createRoute.bind(this), 1);
            })
        }
        this.createRoute();
    }

    createRoute () {
        console.log('calcRoute');
        this.clearRoute();
        const points         = this.getPoints();
        var svg              = this.prepareRoute();
        var path             = this.constructRouteBezier(points);
        var extremityCircles = this.constructExtremityCircles(points);
        var matchedEvents    = this.constructMatchedEvents();
        this.wrapRoute(svg, [path, extremityCircles, matchedEvents]);
    }

    clearRoute () {
        var route = document.getElementById('route');
        if (route) ElementModifier.rfElem(route);
    }

    prepareRoute () {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = "route";
        svg.setAttributeNS(null, 'viewBox', '0 0 ' + document.documentElement.scrollWidth + ' ' + document.documentElement.scrollHeight);
        svg.setAttributeNS(null, 'preserveAspectRatio', 'none');
        return svg;
    }

    constructExtremityCircles (points) {
        if (points.length < 1) return []

        const extremityPoints = [points[0], points[points.length - 1]]
        var extremityCircles = [];

        for (var point of extremityPoints) {
            var element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            element.setAttributeNS(null, 'cx', point.x);
            element.setAttributeNS(null, 'cy', point.y);
            element.setAttributeNS(null, 'r', 20);
            extremityCircles.push(element);
        }
        return extremityCircles
    }

    constructRouteBezier (points) {
        var element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        var route = points.reduce(function (path, point, index, points) {
            return index === 0 ? `M ${point.x},${point.y}` : `${path} ${Curve.getCurve(point, index, points)}`
        }, '');
        element.setAttributeNS(null, 'd', route);
        return element;
    }

    getPoints () {
        // const extremityPoints = this.getExtremityPoints();
        const waypoints  = document.getElementsByClassName('route-waypoint');
        var points = []

        // this.addPointToWaypoints(extremityPoints[0], points);
        for (var waypoint of waypoints) {
            this.addPointToWaypoints(waypoint, points);
        }
        // this.addPointToWaypoints(extremityPoints[1], points);

        return points;
    }

    // getExtremityPoints () {
    //     const startpoint = document.getElementById('route-waypoint-start');
    //     const endpoint   = document.getElementById('route-waypoint-end');
    //     return [startpoint, endpoint]
    // }

    addPointToWaypoints (waypoint, points) {
        // If element is hidden, offset height will be 0
        if (waypoint.offsetHeight === 0) return points;
        var point = Locator.getAbsoluteLocationOfElement(waypoint);
        return points.push(point);
    }

    constructMatchedEvents () {
        var matchedEvents = []
        const waypoints = document.getElementsByClassName('route-waypoint');
        for (var waypoint of waypoints) {
            const match = this.getMatchedElement(waypoint);
            if (!match) continue;
            matchedEvents.push(this.constructMatchedDot(waypoint));
            matchedEvents.push(this.constructLineBetweenMatchedElements(waypoint, match));
        }
        return matchedEvents
    }

    getMatchedElement(waypoint) {
        const match = waypoint.getAttribute("for");
        const matchedElement = document.getElementById(match);
        return matchedElement
    }

    constructMatchedDot (waypoint) {
        const point = Locator.getAbsoluteLocationOfElement(waypoint);
        var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttributeNS(null, 'cx', point.x);
        circle.setAttributeNS(null, 'cy', point.y);
        circle.setAttributeNS(null, 'r', 20);
        return circle
    }

    constructLineBetweenMatchedElements (waypoint, element) {
        const wPoint = Locator.getAbsoluteLocationOfElement(waypoint);
        const ePoint = Locator.getAbsoluteLocationOfElement(element);
        
        var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttributeNS(null, 'x1', wPoint.x);
        line.setAttributeNS(null, 'y1', wPoint.y);
        line.setAttributeNS(null, 'x2', ePoint.x);
        line.setAttributeNS(null, 'y2', ePoint.y);
       
        return line
    }

    wrapRoute (svg, elements) {
        elements.flat(2).map(x => svg.appendChild(x))
        document.body.appendChild(svg);
    }
}

class MenuManager {
    
    constructor () {
        this.toggleNav = document.getElementById('toggle-nav');
        this.header    = document.getElementById('header');
        window.addEventListener('click', (event) => { this.stopPropagation(event) });
    }

    stopPropagation (e) {
        if (e.target === this.header || this.header.contains(e.target) || e.target.tagName === 'INPUT') {
            e.stopPropagation();
        } else {
            this.toggleNav.checked = false;
        }
    }
}

class CompassManager {

    constructor () {
        this.stillScrolling = false;

        this.compassPointer = document.getElementById('compass-pointer');
        this.compassTarget = document.getElementById('compass-target');

        this.ResetPointerAnimationForJSTakeover();
        
        window.addEventListener('scroll', this.HandleScrollDebouncer.bind(this));
        this.HandleScroll()
    }

    ResetPointerAnimationForJSTakeover () {
        ElementModifier.setProperty(this.compassPointer, 'animation-name', 'none');
        ElementModifier.setProperty(this.compassPointer, 'transform', 'rotate(0deg)');
        ElementModifier.setProperty(this.compassPointer, 'transition', 'transform 2s ease');
    }

    HandleScrollDebouncer () {
        if (this.stillScrolling) clearTimeout(this.stillScrolling); 
        this.stillScrolling = setTimeout(this.HandleScroll.bind(this), 75);
    }

    HandleScroll () {  
        const compassAngle = this.getAngle()
        this.ResetAnimationWithNewParameters(compassAngle);
    }

    getAngle () {
        const targetLocation = this.getTarget()
        const sourceLocation = this.getSource()

        return Vector.unitVectorToDegrees(Vector.getNormalizedVectorBetweenPoints(sourceLocation, targetLocation))
    }

    getTarget () {
        return Locator.getLocationOfElement(this.compassTarget);
    }

    getSource () {
        return Locator.getLocationOfElement(this.compassPointer);
    }

    ResetAnimationWithNewParameters (end) {
        ElementModifier.setProperty(this.compassPointer, 'transform', 'rotate(' + end + 'deg)');
    }
}

class ElementModifier {
    static setProperty (element, variable, value) {
        element.style.setProperty(variable, value)
    }

    static getProperty (element, property) {
        return window.getComputedStyle(element).getPropertyValue(property);
    }

    static rfElem(node) {
        node.remove()
    }
}

class Locator {
    static getLocationOfElement (element) {
        const elementBoundingBox = element.getBoundingClientRect();

        return {
            x: elementBoundingBox.left + elementBoundingBox.width / 2,
            y: elementBoundingBox.top + elementBoundingBox.height / 2
        }
    }

    static getAbsoluteLocationOfElement (element) {
        const elementBoundingBox = element.getBoundingClientRect();
        const scrollPosition = Scroller.getCurrentScrollPosition();

        return {
            x: elementBoundingBox.left + elementBoundingBox.width / 2 + scrollPosition.x,
            y: elementBoundingBox.top + elementBoundingBox.height / 2 + scrollPosition.y
        }
    }
}

// Special thanks to Francois Romain for his great article on the dynamic creation of Bezier curves 
// https://medium.com/@francoisromain/smooth-a-svg-path-with-cubic-bezier-curves-e37b49d46c74
class Curve {
    static getLineProperties (fromPoint, toPoint) {
        const length = Vector.getVectorBetweenPoints(toPoint, fromPoint);

        return {
            length: Math.sqrt(Math.pow(length.x, 2) + Math.pow(length.y, 2)),
            angle: Math.atan2(length.y, length.x)
        }
    }

    static getControlPoint (fromPoint, toPoint, nextPoint, reverse=false) {
        fromPoint = fromPoint || toPoint
        nextPoint = nextPoint || toPoint

        const smoothing = 0.2;
        const opposedLine = Curve.getLineProperties(fromPoint, nextPoint);
        const angle = opposedLine.angle + (reverse ? Math.PI : 0);
        const length = opposedLine.length * smoothing;
        
        return {
            x: toPoint.x + Math.cos(angle) * length,
            y: toPoint.y + Math.sin(angle) * length
        }
    }

    static getCurve (point, index, points) {
        const controlPointStart = Curve.getControlPoint(points[index - 2], points[index - 1], point);
        const controlPointEnd   = Curve.getControlPoint(points[index - 1], point, points[index + 1], true);

        return `C ${controlPointStart.x},${controlPointStart.y} ${controlPointEnd.x},${controlPointEnd.y} ${point.x},${point.y}`
    }
}

class Vector {
    static unitVectorToDegrees (vector) {
        return Math.atan2(vector.y, vector.x) * 180 / Math.PI - 90
    }

    static getNormalizedVectorBetweenPoints (fromPoint, toPoint) {
        return Locator.normalizeVector(Locator.getVectorBetweenPoints(fromPoint, toPoint))
    }

    static getVectorBetweenPoints (fromPoint, toPoint) {
        return {
            x: fromPoint.x - toPoint.x,
            y: fromPoint.y - toPoint.y
        }
    }

    static normalizeVector (point) {
        const vectorLength = 1 / Locator.getVectorLength(point);

        return {
            x: point.x * vectorLength,
            y: point.y * vectorLength 
        }
    }

    static getVectorLength (vector) {
        return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    }
    static getNormalizedVectorBetweenPoints (fromPoint, toPoint) {
        return Vector.normalizeVector(Vector.getVectorBetweenPoints(fromPoint, toPoint))
    }

    static getVectorBetweenPoints (fromPoint, toPoint) {
        return {
            x: fromPoint.x - toPoint.x,
            y: fromPoint.y - toPoint.y
        }
    }

    static normalizeVector (point) {
        const vectorLength = 1 / Vector.getVectorLength(point);

        return {
            x: point.x * vectorLength,
            y: point.y * vectorLength 
        }
    }

    static getVectorLength (vector) {
        return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    }
}

class Scroller {
    
    constructor () {
        this.lastScrollPosition = Scroller.getCurrentScrollPosition();
    }

    static getScrollDirection () {
        var scrollDirection = {
            x: 0,
            y: 0
        };
        var currentScrollPosition = Scroller.getCurrentScrollPosition();

        if (currentScrollPosition.x >= this.lastScrollPosition.x) {
            scrollDirection.x = 1;
        } else {
            scrollDirection.x = -1;
        }

        if (currentScrollPosition.y >= this.lastScrollPosition.y) {
            scrollDirection.y = 1;
        } else {
            scrollDirection.y = -1;
        }

        this.lastScrollPosition = currentScrollPosition

        return scrollDirection
    }

    static getCurrentScrollPosition () {
        this.lastScrollPosition = { 
            x: window.pageXOffset, 
            y: window.pageYOffset
        };

        return this.lastScrollPosition;
    }
}