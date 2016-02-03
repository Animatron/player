package test;

import spec.Node;
import spec.Point;
import spec.Rectangle;

/**
 * @author Anton Kotenko <shaman.sir@gmail.com>
 * @date 03 Feb 2016
 * © Animatron, 2011-2015
 */
public class TestNode extends Node {

    Rectangle boundsInParent;

    public TestNode(final String name, int x, int y, int width, int height) {
        super(name);
        this.boundsInParent = new Rectangle(x, y, width, height);
    }

    @Override
    public String toString() {
        return name;
    }

    @Override
    public Point transformToChild(Node child, Point point) {
        TestNode testChild = (TestNode) child;
        return new Point(point.x - testChild.boundsInParent.x, point.y - testChild.boundsInParent.y);
    }

    @Override
    public boolean contains(Point point) {
        return point.x >= 0 && point.x < boundsInParent.width && point.y >= 0 && point.y < boundsInParent.height;
    }

    @Override
    public Point transformToParent(Point point) {
        return new Point(boundsInParent.x + point.x, boundsInParent.y + point.y);
    }

}
